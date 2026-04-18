const fs = require('fs');
const path = require('path');

const rawContent = fs.readFileSync(path.join(__dirname, 'letras_completo.txt'), 'utf8');

// Pattern to find song titles (usually uppercase or followed by BPM/Base Bíblica)
const songPatterns = [
    /([A-ZÁÉÍÓÚÑ\s]{3,})\nBase Bíblica:/g,
    /([A-ZÁÉÍÓÚÑ\s]{3,})\nDIRECCIÓN MUSICAL/g
];

let songs = [];
let lastIndex = 0;

// Simple but effective splitter for this document structure
const lines = rawContent.split('\n');
let currentSong = null;
let currentText = [];

lines.forEach(line => {
    // Detect if a line is a title (all caps, not too long)
    if (line.trim().length > 3 && line.trim() === line.trim().toUpperCase() && !line.includes(':')) {
        if (currentSong) {
            fs.writeFileSync(path.join(__dirname, 'letras', `${currentSong.toLowerCase().replace(/\s+/g, '_')}.txt`), currentText.join('\n'));
        }
        currentSong = line.trim();
        currentText = [line];
    } else if (currentSong) {
        currentText.push(line);
    }
});

// Save last one
if (currentSong) {
    fs.writeFileSync(path.join(__dirname, 'letras', `${currentSong.toLowerCase().replace(/\s+/g, '_')}.txt`), currentText.join('\n'));
}

console.log("¡Importación Masiva Completada!");
