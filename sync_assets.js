const { syncDriveFolderToSheet } = require('./server/google_connector');

const FOLDER_ID = '13phD_lCgjsFcKXwkLmpAUxtG27GBfhRO';

console.log('🚀 Iniciando Sincronización Maestra: Drive ➔ Sheets...');

syncDriveFolderToSheet(FOLDER_ID)
    .then(() => {
        console.log('✅ Sincronización completada con éxito.');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ ERROR durante la sincronización:', err.message);
        if (err.message.includes('Insufficient Permission')) {
            console.log('\n⚠️ TIP: Parece que necesitamos actualizar los permisos para incluir Google Drive.');
            console.log('Pronto te daré las instrucciones para re-autorizar.');
        }
        process.exit(1);
    });
