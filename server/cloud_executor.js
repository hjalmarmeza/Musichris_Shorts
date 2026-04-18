const { getAllSongs, getLandscapes, updateShortStatus, uploadToYouTube, downloadDriveFile, getChannelStats, updateChannelStats } = require('./google_connector');
const { generateAIContent } = require('./ai_messenger');
const { renderShort } = require('../engine');
const path = require('path');

async function runEngine() {
    const SONG_ID = process.env.SONG_ID;
    console.log(`🚀 [CLOUD ENGINE] Iniciando producción para: ${SONG_ID || 'PENDIENTE'}`);

    try {
        // 1. Obtener Datos
        const songs = await getAllSongs();
        const song = songs.find(s => s.id === SONG_ID) || songs.find(s => s.status === 'pending');
        if (!song) throw new Error('No hay canciones pendientes para producir.');

        const landscapes = await getLandscapes();
        const landscape = landscapes.find(l => l.status === 'pending');
        if (!landscape) throw new Error('No hay paisajes disponibles.');

        // 2. IA Gemini (Llamado Único)
        console.log(`🎬 Generando mensaje espiritual para: ${song.title}...`);
        const aiResponse = await generateAIContent(song.title);
        
        // 3. Mapeo Estratégico para la Plantilla v8.1
        const row = {
            quote: aiResponse.message,    // El mensaje motivacional (Arriba)
            complement: aiResponse.tags,  // Hashtags
            verse: aiResponse.verse       // EL VERSÍCULO BÍBLICO (En el medio, con su estilo propio)
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

        // 5. Subida a YouTube con metadatos espirituales
        const finalVideoPath = path.join(__dirname, '..', 'output', 'SHORT_MASTERPIECE_ANIMATED_LOGO.mp4');
        const ytDescription = `${aiResponse.verse}\n\n${aiResponse.message}\n\nEscucha la versión completa de "${song.title}" en nuestro canal.\n\n#Fe #MusicaCristiana #Shorts`;
        const ytData = await uploadToYouTube(finalVideoPath, song.title, ytDescription);

        // 6. Actualización de Estados
        await updateShortStatus(landscape.rowIndex, 'done', ytData.id, song.title);

        // 7. Radar de Impacto
        try {
            console.log('📊 Actualizando Radar de Impacto...');
            const stats = await getChannelStats();
            await updateChannelStats(stats);
        } catch (e) { console.error('⚠️ Error actualizando Radar:', e.message); }

        console.log('✅ [CLOUD ENGINE] ¡Propósito cumplido! Short con Versículo Bíblico publicado.');
        process.exit(0);
    } catch (e) {
        console.error('❌ [CLOUD ENGINE] ERROR CRÍTICO:', e.message);
        process.exit(1);
    }
}

runEngine();
