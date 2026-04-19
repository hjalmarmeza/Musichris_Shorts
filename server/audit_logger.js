const fs = require('fs');
const path = require('path');

const HISTORY_FILE = path.join(__dirname, 'production_history.json');

function logProduction(data) {
    let history = [];
    try {
        if (fs.existsSync(HISTORY_FILE)) {
            history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
        }
    } catch (e) {
        console.error('⚠️ Error cargando historial, creando nuevo.');
    }

    const entry = {
        timestamp: new Date().toISOString(),
        song: data.song,
        source: data.source, // 'Gemini', 'Groq', 'Library_Index_3', etc.
        message: data.message,
        verse: data.verse,
        video_url: data.video_url || 'pending'
    };

    history.unshift(entry); // El más nuevo al principio
    
    // Guardamos solo los últimos 500 para no saturar memoria
    if (history.length > 500) history = history.slice(0, 500);

    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
    console.log(`[AUDIT] Producción de "${data.song}" registrada exitosamente.`);
}

function getHistory() {
    try {
        if (fs.existsSync(HISTORY_FILE)) {
            return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
        }
    } catch (e) {}
    return [];
}

module.exports = { logProduction, getHistory };
