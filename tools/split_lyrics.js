const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, 'letras', 'master_letras.txt'), 'utf8');
const songs = content.split('---');

songs.forEach(song => {
    const lines = song.trim().split('\n');
    const title = lines[0].trim().toLowerCase().replace(/\s+/g, '_');
    if (title) {
        fs.writeFileSync(path.join(__dirname, 'letras', `${title}.txt`), song.trim());
        console.log(`Saved: ${title}.txt`);
    }
});
