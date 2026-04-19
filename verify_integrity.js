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

async function verifySong(songTitle) {
    console.log(`\n🕵️‍♂️ BUSCANDO EN HOJA 4: "${songTitle}"...`);
    const auth = await getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: THEOLOGY_SHEET_ID,
        range: 'Hoja 4!A:L'
    });

    const rows = res.data.values || [];
    const headers = rows[0] || [];
    
    const normalize = (s) => (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

    const idxTitle = headers.findIndex(h => normalize(h) === 'titulo');
    const idxVerse = headers.findIndex(h => normalize(h).includes('verso biblico'));
    const idxContext = headers.findIndex(h => normalize(h).includes('contenido biblico'));

    console.log(`📋 Columnas detectadas: Título(${idxTitle}), Pasaje(${idxVerse}), Contexto(${idxContext})`);

    const normalizedTarget = songTitle.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    
    const found = rows.find(r => {
        const rowTitle = (r[idxTitle] || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        return rowTitle === normalizedTarget;
    });

    if (found) {
        console.log(`\n✅ ¡ÉXITO! DATOS ENCONTRADOS:`);
        console.log(`   🎵 Título: ${found[idxTitle]}`);
        console.log(`   📖 Pasaje Bíblico: ${found[idxVerse]}`);
        console.log(`   💡 Fragmento Teológico: ${found[idxContext].substring(0, 100)}...`);
    } else {
        console.log(`\n❌ ERROR: No se encontró "${songTitle}" en la Hoja 4.`);
        console.log(`   Sugerencia: Revisa si hay espacios extras o si el nombre es exacto.`);
    }
}

verifySong("Alabastro").catch(e => console.error('❌ ERROR CRÍTICO:', e.message));
