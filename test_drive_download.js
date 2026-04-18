const { getLandscapes, downloadDriveFile } = require('./server/google_connector');
const path = require('path');
const fs = require('fs');

async function test() {
    try {
        console.log('🔍 Leyendo paisajes del Sheet...');
        const landscapes = await getLandscapes();
        if (landscapes.length === 0) {
            console.error('❌ No hay paisajes en el Sheet.');
            return;
        }

        const first = landscapes[0];
        console.log('✅ Primer paisaje detectado:', first);

        const urlParts = first.url.split('?');
        const urlParams = new URLSearchParams(urlParts[1]);
        const fileId = urlParams.get('id');

        if (!fileId) {
            console.error('❌ No se encontró ID de Drive en la URL:', first.url);
            return;
        }

        const outputPath = path.join(__dirname, 'temp', 'test_video_drive.mp4');
        if (!fs.existsSync(path.join(__dirname, 'temp'))) fs.mkdirSync(path.join(__dirname, 'temp'));

        console.log(`🚀 Iniciando descarga VIP del ID: ${fileId}...`);
        await downloadDriveFile(fileId, outputPath);

        const stats = fs.statSync(outputPath);
        console.log(`✅ ¡ÉXITO! Video descargado. Tamaño: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    } catch (err) {
        console.error('❌ ERROR CRÍTICO EN LA PRUEBA:', err.message);
    }
}

test();
