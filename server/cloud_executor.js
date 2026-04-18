const { getAllSongs, getLandscapes, updateShortStatus, uploadToYouTube, downloadDriveFile, getChannelStats, updateChannelStats } = require('./google_connector');
const { generateAIContent } = require('./ai_messenger');
const { renderShort } = require('../engine');
const path = require('path');

async function runEngine() {
    const songId = process.env.SONG_ID;
    if (!songId) {
        console.error('❌ Error: No se proporcionó SONG_ID');
        process.exit(1);
    }

    try {
        console.log(`\n🚀 [CLOUD ENGINE] Iniciando producción para: ${songId}`);

        // 1. Obtener datos
        const songs = await getAllSongs();
        const song = songs.find(s => s.id === songId || s.title.toLowerCase().includes(songId.toLowerCase()));
        if (!song) throw new Error(`Canción "${songId}" no encontrada.`);

        const landscapes = await getLandscapes();
        const landscape = landscapes.find(l => l.status === 'pending');
        if (!landscape) throw new Error('No hay paisajes disponibles.');

        // 2. IA Gemini
        const message = await generateAIContent(song.title, song.album);

        // 3. Renderizado - Mapeo de los campos de la IA al Motor
        console.log('🎬 Empezando renderizado en la nube...');
        await renderShort({
            id: song.id,
            inputVideo: landscape.url,
            audioUrl: song.audioUrl,
            quote: message.message,
            complement: message.tags,
            verse: message.title
        });

        // 4. Subida a YouTube
        const finalVideoPath = path.join(__dirname, '..', 'output', 'SHORT_MASTERPIECE_ANIMATED_LOGO.mp4');
        const ytDescription = `${message.message}\n\nEscucha ${song.title} completa en nuestro perfil.\n\n${message.title}`;
        const ytData = await uploadToYouTube(finalVideoPath, song.title, ytDescription);

        // 5. Actualizar Sheet
        await updateShortStatus(landscape.rowIndex, 'done', ytData.id, song.title);

        // 6. Radar de Impacto
        try {
            console.log('📊 Actualizando Radar de Impacto...');
            const stats = await getChannelStats();
            await updateChannelStats(stats);
        } catch (e) { console.error('⚠️ Error actualizando Radar:', e.message); }

        console.log('✅ [CLOUD ENGINE] ¡Short completado, subido y Radar actualizado!');
        process.exit(0);
    } catch (e) {
        console.error('❌ [CLOUD ENGINE] ERROR CRÍTICO:', e.message);
        process.exit(1);
    }
}

runEngine();
