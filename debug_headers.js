const { google } = require('googleapis');
const fs = require('fs');
const THEOLOGY_SHEET_ID = '1oTVSF7CjrCtnk3pHdBIRE8gzhE9zKDM5NJFyWV-qsJs';

async function getAuth() {
    const content = fs.readFileSync('credentials.json');
    const { client_secret, client_id, redirect_uris } = JSON.parse(content).installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    oAuth2Client.setCredentials(JSON.parse(fs.readFileSync('token.json')));
    return oAuth2Client;
}

async function debugHeaders() {
    const auth = await getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: THEOLOGY_SHEET_ID,
        range: 'Hoja 4!A1:L1'
    });
    console.log('📋 ENCABEZADOS REALES DE TU HOJA 4:', JSON.stringify(res.data.values[0]));
}

debugHeaders().catch(e => console.error(e));
