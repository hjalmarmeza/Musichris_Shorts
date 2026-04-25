const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const CREDENTIALS_PATH = path.join(__dirname, '..', 'credentials.json');
const TOKEN_PATH = path.join(__dirname, '..', 'token.json');

async function checkSongs() {
    const content = fs.readFileSync(CREDENTIALS_PATH);
    const creds = JSON.parse(content);
    const key = creds.installed || creds.web;
    const { client_secret, client_id, redirect_uris } = key;
    const auth = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    auth.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH)));

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '1oTVSF7CjrCtnk3pHdBIRE8gzhE9zKDM5NJFyWV-qsJs';
    const range = 'Hoja 4!A:K';

    const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range
    });

    const rows = res.data.values || [];
    console.log('--- CANCIONES ENCONTRADAS ---');
    rows.forEach((r, i) => {
        if (i === 0) return;
        const title = r[1] || '';
        const id = title.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '_');
        console.log(`[${i}] Title: "${title}" -> ID: "${id}" | Status: ${r[4] || 'pending'}`);
    });
}

checkSongs().catch(console.error);
