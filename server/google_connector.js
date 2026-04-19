const { sheets: googleSheets } = require('@googleapis/sheets');
const { youtube: googleYoutube } = require('@googleapis/youtube');
const { drive: googleDrive } = require('@googleapis/drive');
const { OAuth2Client } = require('google-auth-library');
const fs = require('fs');
const path = require('path');

const CREDENTIALS_PATH = path.join(__dirname, '..', 'credentials.json');
const TOKEN_PATH = path.join(__dirname, '..', 'token.json');
const DB_SHEET_ID = '19zXfIiAZktXXyixZ1HdcW1IO9bOBn8S8sRPZAXUVZbE';
const SHORTS_SHEET_ID = '17vd4F5yhQUPYFOO6ZR6uNkBwlq2BuJRNFO9SN-ViN5Y';
const THEOLOGY_SHEET_ID = '1oTVSF7CjrCtnk3pHdBIRE8gzhE9zKDM5NJFyWV-qsJs';

async function getAuth() {
    try {
        if (!fs.existsSync(CREDENTIALS_PATH)) throw new Error(`Missing: ${CREDENTIALS_PATH}`);
        if (!fs.existsSync(TOKEN_PATH)) throw new Error(`Missing: ${TOKEN_PATH}`);

        const content = fs.readFileSync(CREDENTIALS_PATH);
        const creds = JSON.parse(content);
        const key = creds.installed || creds.web;
        
        if (!key) throw new Error("Invalid credentials structure: missing 'installed' or 'web'");

        const { client_secret, client_id, redirect_uris } = key;
        const auth = new OAuth2Client(client_id, client_secret, redirect_uris[0]);
        auth.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH)));
        return auth;
    } catch (e) {
        console.error("❌ [AUTH ENGINE ERROR]", e.message);
        throw e;
    }
}

// Get all songs from the unified catalog (Hoja 4 of 1oTVS...)
async function getAllSongs() {
    const auth = await getAuth();
    const sheets = googleSheets({ version: 'v4', auth });
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: THEOLOGY_SHEET_ID,
        range: 'Hoja 4!A:L'
    });
    const rows = res.data.values || [];
    // Skip header row
    return rows.slice(1).map((r, i) => {
        const title = r[1] || ''; // Columna B (Nombre real)
        return {
            rowIndex: i + 2, // +2 because 1-indexed and skip header
            album: r[0] || 'MusiChris', // Columna A
            title: title,
            audioUrl: r[6] || '', // Columna G (Drive URL - Ajustado a G según catálogo maestro)
            status: r[4] || '',  // Columna E (Status)
            youtubeId: '',
            shortCount: parseInt(r[7]) || 0, // Columna H (Short Count)
            id: title.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '_')
        };
    }).filter(s => s.title && s.title.length < 100); 
}

// Get available landscapes from MusiChris Short sheet
async function getLandscapes() {
    const auth = await getAuth();
    const sheets = googleSheets({ version: 'v4', auth });
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SHORTS_SHEET_ID,
        range: 'Hoja 1!A:E'
    });
    const rows = res.data.values || [];
    return rows.slice(1).map((r, i) => ({
        rowIndex: i + 2,
        item: r[0] || '',
        url: r[1] || '',
        status: r[2] || 'pending',
        youtubeId: r[3] || '',
        songName: r[4] || ''
    })).filter(l => l.url);
}

// Update Short status in MusiChris Short sheet
async function updateShortStatus(rowIndex, status, youtubeId = '', songName = '') {
    const auth = await getAuth();
    const sheets = googleSheets({ version: 'v4', auth });
    await sheets.spreadsheets.values.update({
        spreadsheetId: SHORTS_SHEET_ID,
        range: `Hoja 1!C${rowIndex}:E${rowIndex}`,
        valueInputOption: 'RAW',
        resource: {
            values: [[status, youtubeId, songName]]
        }
    });
    console.log(`[SHEETS] Paisaje fila ${rowIndex} → ${status} (${songName || 'Sin Nombre'})`);
}

// Upload the rendered video to YouTube
async function uploadToYouTube(videoPath, title, description) {
    const auth = await getAuth();
    const youtube = googleYoutube({ version: 'v3', auth });
    
    console.log('[YOUTUBE] Iniciando subida de video:', videoPath);
    
    const fileSize = fs.statSync(videoPath).size;
    const res = await youtube.videos.insert({
        part: 'snippet,status',
        requestBody: {
            snippet: {
                title: `${title} #shorts #musichris #worship #musicacristiana`,
                description: description || 'Visita nuestro perfil para más música inspiradora.',
                categoryId: '10' // Music
            },
            status: {
                privacyStatus: 'unlisted', // Iniciamos en Oculto para revisión
                selfDeclaredMadeForKids: false
            }
        },
        media: {
            body: fs.createReadStream(videoPath)
        }
    }, {
        onUploadProgress: evt => {
            const progress = (evt.bytesRead / fileSize) * 100;
            process.stdout.write(`\r[YOUTUBE] Progreso: ${Math.round(progress)}%`);
        }
    });
    
    console.log('\n[YOUTUBE] ¡Subida exitosa! YouTube ID:', res.data.id);
    return res.data;
}

// NUEVO: Sincronizar carpeta de Drive con el Sheet de Paisajes
async function syncDriveFolderToSheet(folderId) {
    const auth = await getAuth();
    const drive = googleDrive({ version: 'v3', auth });
    const sheets = googleSheets({ version: 'v4', auth });

    console.log(`[DRIVE] Escaneando carpeta: ${folderId}...`);
    
    const res = await drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: 'files(id, name, mimeType)',
        pageSize: 1000
    });

    const files = res.data.files.filter(f => f.mimeType.startsWith('video/'));
    console.log(`[DRIVE] Se encontraron ${files.length} videos.`);

    const rows = files.map((file, index) => [
        index + 1,
        `https://drive.google.com/uc?export=download&id=${file.id}`,
        'pending',
        '',
        '' // Columna Cancion vacía al inicio
    ]);

    // Escribir en MusiChris Short (Hoja 1) empezando en A2 para no borrar encabezados
    await sheets.spreadsheets.values.update({
        spreadsheetId: SHORTS_SHEET_ID,
        range: 'Hoja 1!A2:E',
        valueInputOption: 'RAW',
        resource: { values: rows }
    });

    console.log(`[SHEETS] ¡Sheet actualizado con ${files.length} paisajes de Drive!`);
}

// Función para cambiar la privacidad del video (De Oculto a Público)
async function setVideoPublic(videoId) {
    const auth = await getAuth();
    const youtube = googleYoutube({ version: 'v3', auth });

    console.log(`[YOUTUBE] Publicando video ID: ${videoId}...`);
    
    await youtube.videos.update({
        part: 'status',
        requestBody: {
            id: videoId,
            status: {
                privacyStatus: 'public'
            }
        }
    });

    console.log(`[YOUTUBE] ¡Video ${videoId} ahora es PÚBLICO!`);
}

// NUEVO: Descarga nativa vía API para saltar avisos de virus y muros de Google
async function downloadDriveFile(fileId, outputPath) {
    const auth = await getAuth();
    const drive = googleDrive({ version: 'v3', auth });

    console.log(`[DRIVE-API] Descargando archivo ID: ${fileId}...`);
    const dest = fs.createWriteStream(outputPath);
    
    const res = await drive.files.get(
        { fileId: fileId, alt: 'media' },
        { responseType: 'stream' }
    );

    return new Promise((resolve, reject) => {
        res.data
            .on('end', () => {
                console.log('[DRIVE-API] Descarga completada.');
                resolve(outputPath);
            })
            .on('error', err => {
                console.error('[DRIVE-API] Error en descarga:', err);
                reject(err);
            })
            .pipe(dest);
    });
}

async function getSongTheology(songTitle) {
    try {
        const auth = await getAuth();
        const sheets = googleSheets({ version: 'v4', auth });
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: THEOLOGY_SHEET_ID,
            range: 'Hoja 4!A:L'
        });
        const rows = res.data.values || [];
        
        // Normalización para búsqueda exacta sin fallos por tildes o espacios
        const normalizedTarget = songTitle.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        
        const found = rows.find(r => {
            const rowTitle = (r[1] || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
            return rowTitle === normalizedTarget;
        });

        if (found) {
            console.log(`[THEO-SOURCE] ¡Base bíblica encontrada para: ${songTitle}!`);
            return {
                verse: found[2],    // Verso Bíblico / Pasaje
                context: found[4],  // Contenido Bíblico
                thematic: found[7]  // Temática Central
            };
        }
        console.warn(`[THEO-SOURCE] No se encontró registro en Hoja 4 para: ${songTitle}`);
        return null;
    } catch (e) {
        console.error('⚠️ Error leyendo Hoja de Teología:', e.message);
        return null;
    }
}

async function getChannelStats() {
    const auth = await getAuth();
    const youtube = googleYoutube({ version: 'v3', auth });
    const response = await youtube.channels.list({
        part: 'statistics',
        id: 'UC_k6DDoPbVtsHd6ovucBbVA'
    });
    return response.data.items[0]?.statistics || null;
}

async function updateChannelStats(stats) {
    if (!stats) return;
    const auth = await getAuth();
    const sheets = googleSheets({ version: 'v4', auth });
    
    const values = [
        ['views', 'subscribers', 'videos', 'lastUpdate'],
        [stats.viewCount, stats.subscriberCount, stats.videoCount, new Date().toISOString()]
    ];

    await sheets.spreadsheets.values.update({
        spreadsheetId: DB_SHEET_ID,
        range: 'stats!A1',
        valueInputOption: 'RAW',
        resource: { values }
    });
}

async function incrementSongShortCount(rowIndex) {
    const auth = await getAuth();
    const sheets = googleSheets({ version: 'v4', auth });
    
    // Obtener valor actual (Ahora en THEOLOGY_SHEET_ID Hoja 4)
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: THEOLOGY_SHEET_ID,
        range: `Hoja 4!H${rowIndex}`
    });
    const currentCount = parseInt(res.data.values?.[0]?.[0]) || 0;
    
    // Incrementar y Guardar
    await sheets.spreadsheets.values.update({
        spreadsheetId: THEOLOGY_SHEET_ID,
        range: `Hoja 4!H${rowIndex}`,
        valueInputOption: 'RAW',
        resource: {
            values: [[currentCount + 1]]
        }
    });
    console.log(`[SHEETS] Contador Canción fila ${rowIndex} incrementado a: ${currentCount + 1}`);
}

async function markSongAsDone(rowIndex) {
    const auth = await getAuth();
    const sheets = googleSheets({ version: 'v4', auth });
    await sheets.spreadsheets.values.update({
        spreadsheetId: THEOLOGY_SHEET_ID,
        range: `Hoja 4!E${rowIndex}`,
        valueInputOption: 'RAW',
        resource: { values: [['done']] }
    });
}

module.exports = { 
    getAllSongs, getLandscapes, updateShortStatus, uploadToYouTube, 
    syncDriveFolderToSheet, setVideoPublic, downloadDriveFile, getChannelStats,
    updateChannelStats, getSongTheology, incrementSongShortCount, markSongAsDone
};
