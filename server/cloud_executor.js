const fs = require('fs');
const { getAllSongs, getLandscapes, updateShortStatus, uploadToYouTube, downloadDriveFile, getSongTheology, incrementSongShortCount, markSongAsDone } = require('./google_connector');
const { generateAIContent } = require('./ai_messenger');
const { renderShort } = require('../tools/engine');
const path = require('path');
const { logProduction } = require('./audit_logger');

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
        
        // 2. Inteligencia Teológica (Fuente de Verdad Obligatoria: Hoja 4)
        const theologyData = await getSongTheology(song.title);
        
        if (!theologyData) {
            throw new Error(`❌ ERROR DE INTEGRIDAD: La canción "${song.title}" no tiene registro en la HOJA 4 de Teología. Por favor, asegúrate de que el nombre coincida exactamente.`);
        }
        
        // El versículo es SAGRADO: Se toma directamente de tu Excel (Hoja 4, Col C)
        const finalVerse = (theologyData.verse && theologyData.verse !== 'Cita no encontrada') 
            ? theologyData.verse 
            : "Lucas 7:37"; // Fallback mínimo por seguridad, pero el error de arriba evitará llegar aquí si no hay datos.

        // La IA solo genera el mensaje de reflexión basado en el contexto teológico
        // La IA genera el mensaje basado en TODO el contexto teológico (v26.1)
        const aiResponse = await generateAIContent(song.title, theologyData, finalVerse);
        
        // 3. Mapeo de Integridad v25.1
        const row = {
            quote: aiResponse.message,    // Reflexión de la IA
            complement: "",               
            verse: finalVerse             // EL VERSÍCULO REAL DE TU EXCEL
        };
        
        // Registrar intención de producción
        logProduction({
            song: song.title,
            source: aiResponse.source,
            message: aiResponse.message,
            verse: finalVerse
        });

        // 4. Renderizado Masterpiece
        await renderShort({
            id: song.id,
            inputVideo: landscape.url,
            audioUrl: song.audioUrl,
            quote: row.quote,
            complement: row.complement,
            verse: row.verse
        });

        // 5. Subida a YouTube (Descripción blindada v26.1)
        const finalVideoPath = path.join(__dirname, '..', 'output', `VIDEO_${song.id}.mp4`);
        const ytDescription = `${finalVerse}\n\n${aiResponse.message}\n\n${aiResponse.tags}`;
        const ytData = await uploadToYouTube(finalVideoPath, song.title, ytDescription);
        
        // Actualizar registro con URL final
        logProduction({
            song: song.title,
            source: aiResponse.source,
            message: aiResponse.message,
            verse: finalVerse,
            video_url: `https://youtube.com/watch?v=${ytData.id}`
        });

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
