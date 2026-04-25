const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const CREDENTIALS_PATH = path.join(__dirname, '..', 'credentials.json');
const TOKEN_PATH = path.join(__dirname, '..', 'token.json');

async function checkHeaders() {
    const content = fs.readFileSync(CREDENTIALS_PATH);
    const creds = JSON.parse(content);
    const auth = new google.auth.OAuth2(creds.installed.client_id, creds.installed.client_secret, creds.installed.redirect_uris[0]);
    auth.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH)));

    const sheets = google.sheets({ version: 'v4', auth });
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: '1oTVSF7CjrCtnk3pHdBIRE8gzhE9zKDM5NJFyWV-qsJs',
        range: 'Hoja 4!A1:K1'
    });

    console.log('--- HEADERS HOJA 4 ---');
    console.log(res.data.values[0]);
}

checkHeaders().catch(console.error);
