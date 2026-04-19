const APP_VERSION = "v24.9 - Identity & Bible Resilience";
const express = require('express');
const fs = require('fs');
// Cargar variables de entorno manualmente desde .env
try {
    const env = fs.readFileSync(require('path').join(__dirname, '..', '.env'), 'utf8');
    env.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) process.env[key.trim()] = value.trim();
    });
} catch (e) { console.log('⚠️ No se encontró archivo .env, usando variables de sistema.'); }

const cors = require('cors');
const path = require('path');
const { getAllSongs, getLandscapes, updateShortStatus, uploadToYouTube, setVideoPublic, downloadDriveFile } = require('./google_connector');
const { generateAIContent } = require('./ai_messenger');
const { renderShort } = require('../engine');

const app = express();
app.use(cors());
app.use(express.json());
// Servir la carpeta dashboard para que la app sea accesible
app.use(express.static(path.join(__dirname, '..', 'dashboard')));
const PORT = 3001;

// Servir la página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dashboard', 'index.html'));
});

// GET all songs from DB_Musichris_app
app.get('/api/songs', async (req, res) => {
    try {
        const songs = await getAllSongs();
        res.json(songs);
    } catch (e) {
        console.error('[ERROR /api/songs]', e.message);
        res.status(500).json({ error: e.message });
    }
});

// GET available landscapes
app.get('/api/landscapes', async (req, res) => {
    try {
        const landscapes = await getLandscapes();
        res.json(landscapes);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST publish: combine song + landscape → generate Short
app.post('/api/publish', async (req, res) => {
    const { songId } = req.body;
    
    try {
        console.log(`\n[MASTER] Iniciando Short para: ${songId}`);
        
        // 1. Get song data
        const songs = await getAllSongs();
        const song = songs.find(s => s.id === songId || s.title.toLowerCase().includes(songId.toLowerCase()));
        if (!song) return res.status(404).json({ error: `Canción "${songId}" no encontrada` });

        // 2. Get landscapes and find the FIRST one that is 'pending'
        const landscapes = await getLandscapes();
        const landscape = landscapes.find(l => l.status === 'pending');
        
        if (!landscape) {
            return res.status(404).json({ error: 'No hay paisajes "pending" disponibles.' });
        }
        
        console.log(`[MASTER] Canción: ${song.title}`);
        
        // 3. Variety Counter (How many shorts of this song already exist)
        const songCount = landscapes.filter(l => (l.songName || '').toLowerCase() === song.title.toLowerCase()).length;
        console.log(`[MASTER] Generando el Short #${songCount + 1}`);

        // 4. Gemini Intelligence Phase (Generación Dinámica)
        const theologyContext = await require('./google_connector').getSongTheology(song.title);
        const fallbackCitation = song.citation || "Salmos 23:1";
        const message = await generateAIContent(song.title, theologyContext, fallbackCitation);
        
        // 5. Execute Render Engine
        await renderShort({
            id: song.id,
            inputVideo: landscape.url,
            audioUrl: song.audioUrl,
            ...message
        });
        
        // 6. Upload to YouTube (Unlisted)
        // Usar el ID dinámico generado por el engine
        const finalVideoPath = require('path').join(__dirname, '..', 'output', `VIDEO_${song.id}.mp4`);
        const ytDescription = `${message.quote}\n\nEscucha ${song.title} completa en nuestro perfil.\n\n${message.verse}`;
        const ytData = await uploadToYouTube(finalVideoPath, song.title, ytDescription);

        // 7. Update Sheet status
        await updateShortStatus(landscape.rowIndex, 'done', ytData.id, song.title);
        
        res.json({
            success: true,
            song: { title: song.title, count: songCount + 1 },
            youtubeId: ytData.id,
            status: 'FINISHED'
        });
        
    } catch (e) {
        console.error('[ERROR /api/publish]', e.stack);
        res.status(500).json({ error: e.message });
    }
});

// Confirm and Publish (Unlisted -> Public)
app.post('/api/confirm-publish', async (req, res) => {
    try {
        const { youtubeId } = req.body;
        if (!youtubeId) return res.status(400).json({ error: 'Falta youtubeId' });
        await setVideoPublic(youtubeId);
        res.json({ success: true, message: '¡Video ahora es PÚBLICO!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`\n🚀 Musichris Shorts Engine [${APP_VERSION}]`);
    console.log(`🔗 Dashboard: http://localhost:${PORT}\n`);
});
