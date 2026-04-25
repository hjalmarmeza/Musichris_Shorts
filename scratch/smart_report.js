const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const CREDENTIALS_PATH = path.join(__dirname, '..', 'credentials.json');
const TOKEN_PATH = path.join(__dirname, '..', 'token.json');

async function smartReport() {
    const content = fs.readFileSync(CREDENTIALS_PATH);
    const creds = JSON.parse(content);
    const auth = new google.auth.OAuth2(creds.installed.client_id, creds.installed.client_secret, creds.installed.redirect_uris[0]);
    auth.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH)));

    const sheets = google.sheets({ version: 'v4', auth });

    const resAudio = await sheets.spreadsheets.values.get({
        spreadsheetId: '19zXfIiAZktXXyixZ1HdcW1IO9bOBn8S8sRPZAXUVZbE',
        range: 'Hoja 2!A:C'
    });
    const audioSongs = resAudio.data.values || [];
    const audioList = audioSongs.slice(1).map(r => (r[2] || '').trim()).filter(Boolean);

    const resTheo = await sheets.spreadsheets.values.get({
        spreadsheetId: '1oTVSF7CjrCtnk3pHdBIRE8gzhE9zKDM5NJFyWV-qsJs',
        range: 'Hoja 4!A:B'
    });
    const theoRows = resTheo.data.values || [];
    const theoList = theoRows.slice(1).map(r => (r[1] || '').trim()).filter(Boolean);

    // FUNCIÓN DE LIMPIEZA ELITE
    const smartNormalize = (s) => {
        return s.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Quitar tildes
            .replace(/\s+v\d+$/i, '')                       // Quitar " v2", " v1" al final
            .replace(/\((.*?)\)/g, '')                      // Quitar todo lo entre paréntesis
            .replace(/[^a-z0-9]/g, '')                      // Quitar TODO lo que no sea letra o número
            .trim();
    };

    const normalizedTheo = theoList.map(t => ({ original: t, clean: smartNormalize(t) }));
    
    console.log('\n🧠 --- REPORTE DE INTEGRIDAD INTELIGENTE (SMART-MATCH) ---');
    
    let readyCount = 0;
    let failCount = 0;
    let fails = [];

    audioList.forEach(s => {
        const cleanS = smartNormalize(s);
        const match = normalizedTheo.find(t => t.clean === cleanS || cleanS.includes(t.clean) || t.clean.includes(cleanS));
        
        if (match) {
            readyCount++;
            // console.log(`✅ [MATCH] "${s}" -> Usa teología de: "${match.original}"`);
        } else {
            failCount++;
            fails.push(s);
        }
    });

    console.log(`✅ CANCIONES VÁLIDAS CON SMART-MATCH: ${readyCount}`);
    console.log(`❌ CANCIONES QUE SIGUEN SIN COINCIDENCIA: ${failCount}`);

    if (fails.length > 0) {
        console.log('\n❌ ESTAS SIGUEN SIN APARECER (Revisar nombres en Excel):');
        fails.forEach((f, i) => console.log(`${i+1}. ${f}`));
    }
}

smartReport().catch(console.error);
