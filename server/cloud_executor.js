const { getAllSongs, getLandscapes, updateShortStatus, uploadToYouTube, downloadDriveFile, getChannelStats, updateChannelStats, getSongTheology } = require('./google_connector');
const { generateAIContent } = require('./ai_messenger');
const { renderShort } = require('../engine');
const path = require('path');

async function runEngine() {
    const SONG_ID = process.env.SONG_ID;
    console.log(`🚀 [CLOUD ENGINE] Iniciando producción para: ${SONG_ID || 'PENDIENTE'}`);

    try {
        // 1. Obtener Datos de la Canción
        const songs = await getAllSongs();
        const song = songs.find(s => s.id === SONG_ID) || songs.find(s => s.status === 'pending');
        if (!song) throw new Error('No hay canciones pendientes para producir.');

        const landscapes = await getLandscapes();
        const landscape = landscapes.find(l => l.status === 'pending');
        if (!landscape) throw new Error('No hay paisajes disponibles.');

        // 2. Obtener Fundamento Bíblico (Hoja 4)
        console.log(`📖 Buscando fundamento teológico para: ${song.title}...`);
        const theologyContext = await getSongTheology(song.title);

        // 3. IA Gemini con Contexto de composición
        console.log(`🎬 Generando mensaje espiritual...`);
        const aiResponse = await generateAIContent(song.title, theologyContext);
        
        // 4. Mapeo para la Plantilla v8.1/v9.0
        const row = {
            quote: aiResponse.message,    // Reflexión
            complement: aiResponse.tags,  // Tags
            verse: aiResponse.verse       // EL VERSÍCULO (Original o sugerido)
        };

        // 5. Renderizado Masterpiece
        await renderShort({
            id: song.id,
            inputVideo: landscape.url,
            audioUrl: song.audioUrl,
            quote: row.quote,
            complement: row.complement,
            verse: row.verse
        });

        // 6. Subida a YouTube
        const finalVideoPath = path.join(__dirname, '..', 'output', 'SHORT_MASTERPIECE_ANIMATED_LOGO.mp4');
        const ytDescription = `${aiResponse.verse}\n\n${aiResponse.message}\n\nEscucha la versión completa de "${song.title}" en nuestro canal.\n\n#EscuchaMusichris #Fe #Biblia #Worship`;
        const ytData = await uploadToYouTube(finalVideoPath, song.title, ytDescription);

        // 7. Actualización de Estados
        await updateShortStatus(landscape.rowIndex, 'done', ytData.id, song.title);

        // 8. Radar de Impacto
        try {
            console.log('📊 Actualizando Radar de Impacto...');
            const stats = await getChannelStats();
            await updateChannelStats(stats);
        } catch (e) { console.error('⚠️ Error actualizando Radar:', e.message); }

        console.log('✅ [CLOUD ENGINE] ¡Propósito cumplido con base bíblica!');
        process.exit(0);
    } catch (e) {
        console.error('❌ [CLOUD ENGINE] ERROR CRÍTICO:', e.message);
        process.exit(1);
    }
}

runEngine();
