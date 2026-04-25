const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const CREDENTIALS_PATH = path.join(__dirname, '..', 'credentials.json');
const TOKEN_PATH = path.join(__dirname, '..', 'token.json');

async function crossSheets() {
    const content = fs.readFileSync(CREDENTIALS_PATH);
    const creds = JSON.parse(content);
    const auth = new google.auth.OAuth2(creds.installed.client_id, creds.installed.client_secret, creds.installed.redirect_uris[0]);
    auth.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH)));

    const sheets = google.sheets({ version: 'v4', auth });

    // 1. Catálogo (Hoja 2) - Título está en Col C (index 2)
    const resAudio = await sheets.spreadsheets.values.get({
        spreadsheetId: '19zXfIiAZktXXyixZ1HdcW1IO9bOBn8S8sRPZAXUVZbE',
        range: 'Hoja 2!A:D'
    });
    const audioRows = resAudio.data.values || [];
    const audioSongs = audioRows.slice(1).map(r => (r[2] || '').trim()).filter(Boolean);

    // 2. Teología (Hoja 4) - Título está en Col B (index 1)
    const resTheo = await sheets.spreadsheets.values.get({
        spreadsheetId: '1oTVSF7CjrCtnk3pHdBIRE8gzhE9zKDM5NJFyWV-qsJs',
        range: 'Hoja 4!A:B'
    });
    const theoRows = resTheo.data.values || [];
    const theoSongs = theoRows.slice(1).map(r => (r[1] || '').trim()).filter(Boolean);

    const normalize = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

    const normalizedTheo = theoSongs.map(normalize);
    const normalizedAudio = audioSongs.map(normalize);

    console.log('\n🔍 --- REPORTE DE INTEGRIDAD MusiChris ---');
    
    const ready = audioSongs.filter(s => normalizedTheo.includes(normalize(s)));
    const missingTheo = audioSongs.filter(s => !normalizedTheo.includes(normalize(s)));
    const missingAudio = theoSongs.filter(s => !normalizedAudio.includes(normalize(s)));

    console.log(`✅ LISTAS PARA PRODUCIR: ${ready.length}`);
    console.log(`❌ EN CATÁLOGO PERO SIN TEOLOGÍA: ${missingTheo.length}`);
    console.log(`⚠️ EN TEOLOGÍA PERO SIN AUDIO: ${missingAudio.length}`);

    if (missingTheo.length > 0) {
        console.log('\n❌ FALTAN EN TEOLOGÍA (Debes agregarlas a la Hoja 4 para que Shorts funcione):');
        missingTheo.slice(0, 20).forEach(s => console.log(`- ${s}`));
        if (missingTheo.length > 20) console.log(`... y ${missingTheo.length - 20} más.`);
    }

    if (missingAudio.length > 0) {
        console.log('\n⚠️ FALTAN EN CATÁLOGO (Están en Teología pero no tienen audio en Hoja 2):');
        missingAudio.slice(0, 20).forEach(s => console.log(`- ${s}`));
        if (missingAudio.length > 20) console.log(`... y ${missingAudio.length - 20} más.`);
    }
    
    if (ready.length > 0) {
        console.log('\n✅ LISTAS PARA PRODUCCIÓN (Ejemplos):');
        ready.slice(0, 20).forEach(s => console.log(`- ${s}`));
    }
}

crossSheets().catch(console.error);
