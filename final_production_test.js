require('dotenv').config({ path: '/Users/hjalmarmeza/Downloads/Antigravity/Musichris_Shorts/.env' });
const { getSongTheology } = require('/Users/hjalmarmeza/Downloads/Antigravity/Musichris_Shorts/server/google_connector');
const { generateAIContent } = require('/Users/hjalmarmeza/Downloads/Antigravity/Musichris_Shorts/server/ai_messenger');

async function testSingleSong(title) {
    console.log(`\n🔍 PROBANDO PRODUCCIÓN REAL PARA: "${title}"...`);
    try {
        const theologyData = await getSongTheology(title);
        if (!theologyData) throw new Error('No se encontró teología.');

        const aiResponse = await generateAIContent(title, theologyData, theologyData.verse);
        
        console.log(`\n💎 RESULTADO DE LA INTELIGENCIA ARTIFICIAL:`);
        console.log(`   📝 MENSAJE EN VIDEO: "${aiResponse.message}"`);
        console.log(`   📖 CITA BÍBLICA: ${aiResponse.citation}`);
        console.log(`   🏷️ TAGS: ${aiResponse.tags}`);

    } catch (e) {
        console.error(`💥 FALLO TÉCNICO:`, e.message);
    }
}

testSingleSong("Alabastro");
