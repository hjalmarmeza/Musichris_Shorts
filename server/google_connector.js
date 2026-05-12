const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const CATALOG_ID = '19zXfIiAZktXXyixZ1HdcW1IO9bOBn8S8sRPZAXUVZbE';
const THEOLOGY_SHEET_ID = '1oTVSF7CjrCtnk3pHdBIRE8gzhE9zKDM5NJFyWV-qsJs';
const SHORTS_SHEET_ID = '17vd4F5yhQUPYFOO6ZR6uNkBwlq2BuJRNFO9SN-ViN5Y';

const THEO_TAB = 'Hoja 4';
const KEY_FILE = path.join(__dirname, 'credentials.json');

// Reusable Auth Client
async function getAuth() {
    const auth = new google.auth.GoogleAuth({
        keyFile: KEY_FILE,
        scopes: [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive',
            'https://www.googleapis.com/auth/youtube.upload',
            'https://www.googleapis.com/auth/youtube.force-ssl'
        ],
    });
    return await auth.getClient();
}

function smartNormalize(text) {
    if (!text) return '';
    return text.toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '')
        .trim();
}

async function getAllSongs() {
    const auth = await getAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const resSongs = await sheets.spreadsheets.values.get({
        spreadsheetId: CATALOG_ID,
        range: 'Hoja 2!A:G'
    });
    const songRows = resSongs.data.values || [];

    const resStats = await sheets.spreadsheets.values.get({
        spreadsheetId: THEOLOGY_SHEET_ID,
        range: `${THEO_TAB}!A:L`
    });
    const statRows = resStats.data.values || [];

    const headers = songRows[0] || [];
    const firstRow = songRows[1] || [];
    
    const findIdx = (keywords) => headers.findIndex(h => 
        keywords.some(k => (h || '').toString().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(k))
    );

    const idxTitle = findIdx(['TITULO DE CANCION', 'TITULO', 'CANCION']);
    const idxAudio = headers.findIndex(h => {
        const head = (h || '').toString().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return (head.includes('URL') || head.includes('CANCION')) && !head.includes('IMAGEN');
    });
    const idxStatus = findIdx(['STATUS', 'ESTADO']);

    console.log(`[DEBUG] Mapeo v40.0 -> Titulo: ${idxTitle}, Audio: ${idxAudio}, Status: ${idxStatus}`);

    const normalizedStats = statRows.map(sr => ({
        original: sr[1],
        clean: smartNormalize(sr[1]),
        row: sr
    }));

    const uniqueSongsMap = new Map();

    songRows.slice(1).forEach((r, i) => {
        const title = (idxTitle !== -1 ? r[idxTitle] : '') || ''; 
        const audioUrl = (idxAudio !== -1 ? r[idxAudio] : '') || ''; 
        const status = (idxStatus !== -1 ? r[idxStatus] : 'pending') || 'pending'; 
        
        if (!title || title.length > 100) return;

        const cleanTitle = smartNormalize(title);
        const statFound = normalizedStats.find(ns => ns.clean === cleanTitle || cleanTitle.includes(ns.clean) || ns.clean.includes(cleanTitle));
        const count = statFound ? parseInt(statFound.row[9]) || 0 : 0; 

        const songObj = {
            rowIndex: i + 2, 
            album: r[0] || 'MusiChris', 
            title: title,
            audioUrl: audioUrl, 
            status: status,
            youtubeId: '',
            shortCount: count,
            id: title.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '_')
        };

        if (!uniqueSongsMap.has(cleanTitle) || audioUrl) {
            uniqueSongsMap.set(cleanTitle, songObj);
        }
    });

    return Array.from(uniqueSongsMap.values());
}

async function getLandscapes() {
    const auth = await getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SHORTS_SHEET_ID,
        range: 'Hoja 1!A:E'
    });
    const rows = res.data.values || [];
    return rows.slice(1).map((r, i) => ({
        rowIndex: i + 2,
        name: r[0],
        url: r[1],
        status: r[2] || 'pending'
    }));
}

async function updateShortStatus(rowIndex, status, youtubeId, songName) {
    const auth = await getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    await sheets.spreadsheets.values.update({
        spreadsheetId: SHORTS_SHEET_ID,
        range: `Hoja 1!C${rowIndex}:E${rowIndex}`,
        valueInputOption: 'RAW',
        resource: {
            values: [[status, youtubeId, songName]]
        }
    });
}

async function uploadToYouTube(videoPath, title, description) {
    const auth = await getAuth();
    const youtube = google.youtube({ version: 'v3', auth });
    const res = await youtube.videos.insert({
        part: 'snippet,status',
        requestBody: {
            snippet: {
                title: `${title} #shorts #musichris #worship #musicacristiana`,
                description: description || 'Visita nuestro perfil para más música inspiradora.',
                categoryId: '10'
            },
            status: {
                privacyStatus: 'unlisted',
                selfDeclaredMadeForKids: false
            }
        },
        media: {
            body: fs.createReadStream(videoPath)
        }
    });
    return res.data;
}

async function markSongAsDone(rowIndex) {
    const auth = await getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    await sheets.spreadsheets.values.update({
        spreadsheetId: CATALOG_ID,
        range: `Hoja 2!E${rowIndex}`,
        valueInputOption: 'RAW',
        resource: { values: [['done']] }
    });
}

async function incrementSongShortCount(songTitle) {
    const auth = await getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: THEOLOGY_SHEET_ID,
        range: `${THEO_TAB}!A:L`
    });
    const rows = res.data.values || [];
    const cleanTarget = smartNormalize(songTitle);
    const rowIndex = rows.findIndex(r => smartNormalize(r[1]) === cleanTarget);

    if (rowIndex !== -1) {
        const currentCount = parseInt(rows[rowIndex][9]) || 0;
        await sheets.spreadsheets.values.update({
            spreadsheetId: THEOLOGY_SHEET_ID,
            range: `${THEO_TAB}!J${rowIndex + 1}`,
            valueInputOption: 'RAW',
            resource: { values: [[currentCount + 1]] }
        });
    }
}

async function downloadDriveFile(fileId, outputPath) {
    const auth = await getAuth();
    const drive = google.drive({ version: 'v3', auth });
    const dest = fs.createWriteStream(outputPath);
    const res = await drive.files.get({ fileId: fileId, alt: 'media' }, { responseType: 'stream' });
    return new Promise((resolve, reject) => {
        res.data.on('end', () => resolve(outputPath)).on('error', reject).pipe(dest);
    });
}

async function getSongTheology(songTitle) {
    const auth = await getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: THEOLOGY_SHEET_ID,
        range: `${THEO_TAB}!A:L`
    });
    const rows = res.data.values || [];
    const headers = rows[0] || [];
    const normalizeKey = (s) => (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const idxTitle = headers.findIndex(h => normalizeKey(h) === 'titulo');
    const idxVerse = headers.findIndex(h => normalizeKey(h).includes('verso biblico'));
    const idxContext = headers.findIndex(h => normalizeKey(h).includes('contenido biblico'));
    const cleanTarget = smartNormalize(songTitle);
    const r = rows.find(row => smartNormalize(row[idxTitle]) === cleanTarget);
    return r ? { title: r[idxTitle], verse: r[idxVerse], context: r[idxContext] } : null;
}

module.exports = { 
    getAllSongs, getLandscapes, updateShortStatus, uploadToYouTube, 
    downloadDriveFile, getSongTheology, incrementSongShortCount, markSongAsDone 
};
