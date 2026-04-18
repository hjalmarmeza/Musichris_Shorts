const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
const TOKEN_PATH = path.join(__dirname, 'token.json');

async function generateToken(code) {
    const inputCode = code || process.argv[2];
    if (!inputCode) {
        console.error('❌ ERROR: Debes pasar el código como argumento: node generate_token.js "TU_CODIGO"');
        process.exit(1);
    }

    const content = fs.readFileSync(CREDENTIALS_PATH);
    const { client_secret, client_id, redirect_uris } = JSON.parse(content).installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    const { tokens } = await oAuth2Client.getToken(inputCode);
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
    console.log('✅ ¡TOKEN GENERADO CON ÉXITO! LA FÁBRICA ESTÁ CONECTADA TOTALMENTE (SHEETS, YT, DRIVE).');
}

generateToken().catch(e => {
    console.error('❌ ERROR GENERANDO TOKEN:', e.message);
    process.exit(1);
});
