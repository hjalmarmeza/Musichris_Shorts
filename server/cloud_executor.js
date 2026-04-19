const { getAllSongs, getLandscapes, updateShortStatus, uploadToYouTube, downloadDriveFile, getSongTheology, incrementSongShortCount, markSongAsDone } = require('./google_connector');
const { generateAIContent } = require('./ai_messenger');
const { renderShort } = require('../engine');
const path = require('path');

async function runEngine() {
    // LIMPIEZA TOTAL DE ARRANQUE: Borrar carpetas temporales para evitar archivos zombis
    const tempDir = path.join(__dirname, '..', 'temp');
    if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
        fs.mkdirSync(tempDir, { recursive: true });
    }

    const SONG_ID = process.env.SONG_ID;
    console.log(`🚀 [CLOUD ENGINE] Iniciando producción para: ${SONG_ID || 'PENDIENTE'}`);

    try {
        // 1. Obtener Datos
        const songs = await getAllSongs();
        const song = songs.find(s => s.id === SONG_ID);
        if (!song) throw new Error(`Canción con ID "${SONG_ID}" no encontrada o no disponible.`);

        const landscapes = await getLandscapes();
        const landscape = landscapes.find(l => l.status === 'pending');
        if (!landscape) throw new Error('No hay paisajes disponibles.');

        // 2. Fundamento y IA Minimalista
        console.log(`[AUDITORÍA] 🎵 Procesando: "${song.title}"`);
        console.log(`[AUDITORÍA] 🔗 Audio Source (Col D): ${song.audioUrl}`);
        
        console.log(`📖 Analizando teología para: ${song.title}...`);
        const theologyContext = await getSongTheology(song.title);
        const aiResponse = await generateAIContent(song.title, theologyContext);
        
        // 3. Mapeo Minimalista v10.0
        const row = {
            quote: aiResponse.message,    // Solo la reflexión (Grande)
            complement: "",               // Sin hashtags en el video
            verse: aiResponse.citation    // Solo la CITA BÍBLICA (ej: Salmos 23:1)
        };

        // 4. Renderizado Masterpiece
        await renderShort({
            id: song.id,
            inputVideo: landscape.url,
            audioUrl: song.audioUrl,
            quote: row.quote,
            complement: row.complement,
            verse: row.verse
        });

        // 5. Subida a YouTube (Aquí sí mantenemos los hashtags)
        const finalVideoPath = path.join(__dirname, '..', 'output', `VIDEO_${song.id}.mp4`);
        const ytDescription = `${aiResponse.citation}\n\n${aiResponse.message}\n\n${aiResponse.tags}`;
        const ytData = await uploadToYouTube(finalVideoPath, song.title, ytDescription);

        // 6. Estados y Contadores
        await updateShortStatus(landscape.rowIndex, 'done', ytData.id, song.title);
        await incrementSongShortCount(song.title);
        await markSongAsDone(song.rowIndex);
        
        console.log(`✅ [CLOUD ENGINE] ¡Short de "${song.title}" completado y datos actualizados!`);
        process.exit(0);
    } catch (e) {
        console.error('❌ [CLOUD ENGINE] ERROR CRÍTICO:', e.message);
        process.exit(1);
    }
}

runEngine();
