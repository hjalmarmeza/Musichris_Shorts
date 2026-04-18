const { google } = require('googleapis');
const fs = require('fs');

const DB_SHEET_ID = '19zXfIiAZktXXyixZ1HdcW1IO9bOBn8S8sRPZAXUVZbE';
const SHORTS_SHEET_ID = '17vd4F5yhQUPYFOO6ZR6uNkBwlq2BuJRNFO9SN-ViN5Y';

async function getAuth() {
    const content = fs.readFileSync('credentials.json');
    const { client_secret, client_id, redirect_uris } = JSON.parse(content).installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    oAuth2Client.setCredentials(JSON.parse(fs.readFileSync('token.json')));
    return oAuth2Client;
}

async function readCatalog() {
    const auth = await getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Read song catalog from DB_Musichris_app Hoja 2
    const dbRes = await sheets.spreadsheets.values.get({
        spreadsheetId: DB_SHEET_ID,
        range: 'Hoja 2!A:G'
    });
    const rows = dbRes.data.values || [];
    console.log('📊 Total filas en DB:', rows.length);
    console.log('📋 Encabezados:', rows[0]);
    console.log('\n🎵 Primeras 10 canciones:');
    rows.slice(1, 11).forEach((r, i) => {
        console.log(`  ${i+1}. [${r[0]||''}] ${r[2]||'SIN NOMBRE'} → ${(r[3]||'SIN URL').substring(0,60)}`);
    });
    console.log('\n📈 TOTAL CANCIONES:', rows.length - 1);
    
    // Read landscapes from MusiChris Short
    const shortsRes = await sheets.spreadsheets.values.get({
        spreadsheetId: SHORTS_SHEET_ID,
        range: 'Hoja 1!A:F'
    });
    const landscapes = shortsRes.data.values || [];
    console.log('\n🌄 Paisajes en MusiChris Short:', landscapes.length - 1);
    console.log('📋 Encabezados paisajes:', landscapes[0]);
    landscapes.slice(1, 6).forEach((r, i) => {
        console.log(`  ${i+1}. ${JSON.stringify(r)}`);
    });
}

readCatalog().catch(e => console.error('❌ ERROR:', e.message));
