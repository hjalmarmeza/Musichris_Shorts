const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const CREDENTIALS_PATH = path.join(__dirname, '..', 'credentials.json');
const TOKEN_PATH = path.join(__dirname, '..', 'token.json');

async function findExactSong() {
    const content = fs.readFileSync(CREDENTIALS_PATH);
    const creds = JSON.parse(content);
    const auth = new google.auth.OAuth2(creds.installed.client_id, creds.installed.client_secret, creds.installed.redirect_uris[0]);
    auth.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH)));

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '19zXfIiAZktXXyixZ1HdcW1IO9bOBn8S8sRPZAXUVZbE';
    const range = 'Hoja 2!A:E';
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range
    });

    const rows = res.data.values || [];
    console.log(`Buscando "Refugio Seguro" entre ${rows.length} filas...`);
    
    const target = "Refugio Seguro".toLowerCase().trim();
    
    rows.forEach((r, i) => {
        const title = (r[1] || '').toLowerCase().trim();
        if (title.includes("refugio")) {
            console.log(`[Fila ${i+1}] Encontrado: "${r[1]}" | ID generado: ${r[1].toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '_')}`);
        }
    });
}

findExactSong().catch(console.error);
