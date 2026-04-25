const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const CREDENTIALS_PATH = path.join(__dirname, '..', 'credentials.json');
const TOKEN_PATH = path.join(__dirname, '..', 'token.json');

async function fullReport() {
    const content = fs.readFileSync(CREDENTIALS_PATH);
    const creds = JSON.parse(content);
    const auth = new google.auth.OAuth2(creds.installed.client_id, creds.installed.client_secret, creds.installed.redirect_uris[0]);
    auth.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH)));

    const sheets = google.sheets({ version: 'v4', auth });

    const resAudio = await sheets.spreadsheets.values.get({
        spreadsheetId: '19zXfIiAZktXXyixZ1HdcW1IO9bOBn8S8sRPZAXUVZbE',
        range: 'Hoja 2!A:C'
    });
    const audioRows = resAudio.data.values || [];
    const audioSongs = audioRows.slice(1).map(r => (r[2] || '').trim()).filter(Boolean);

    const resTheo = await sheets.spreadsheets.values.get({
        spreadsheetId: '1oTVSF7CjrCtnk3pHdBIRE8gzhE9zKDM5NJFyWV-qsJs',
        range: 'Hoja 4!A:B'
    });
    const theoRows = resTheo.data.values || [];
    const theoSongs = theoRows.slice(1).map(r => (r[1] || '').trim()).filter(Boolean);

    const normalize = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const normalizedTheo = theoSongs.map(normalize);

    console.log('\n❌ --- CANCIONES EN CATÁLOGO (Hoja 2) QUE NO ESTÁN EN TEOLOGÍA (Hoja 4) ---');
    let count = 0;
    audioSongs.forEach(s => {
        if (!normalizedTheo.includes(normalize(s))) {
            count++;
            console.log(`${count}. ${s}`);
        }
    });
}

fullReport().catch(console.error);
