/**
 * ⚙️ MUSICHRIS SHORTS ENGINE - PANEL DE CONTROL MAESTRO
 * Aquí puedes cambiar los archivos y pestañas de Google Sheets.
 */

module.exports = {
    // 📂 IDs de los Archivos de Google Drive (Spreadsheet IDs)
    sheets: {
        master_catalog: '19zXfIiAZktXXyixZ1HdcW1IO9bOBn8S8sRPZAXUVZbE', // El archivo con la voz/audio
        theology: '1oTVSF7CjrCtnk3pHdBIRE8gzhE9zKDM5NJFyWV-qsJs',       // El archivo con la biblia/contexto
        landscapes: '17vd4F5yhQUPYFOO6ZR6uNkBwlq2BuJRNFO9SN-ViN5Y',     // El archivo con los paisajes de fondo
        database_stats: '19zXfIiAZktXXyixZ1HdcW1IO9bOBn8S8sRPZAXUVZbE'  // Hoja de analítica general
    },

    // 📑 Nombres de las Pestañas (Tabs)
    tabs: {
        songs: 'Hoja 2',      // Donde están las canciones (Master Catalog)
        theology: 'Hoja 4',   // Donde está el contenido bíblico
        landscapes: 'Hoja 1'  // Donde están los fondos de video
    },

    // 🎨 Configuración Visual
    style: {
        logoCircle: false,    // True para activar el círculo blanco, False para modo Elite (limpio)
        theme: 'executive'    // Estilo visual del Short
    }
};
