/**
 * MUSICHIRS ENGINE v18.0 - Master Logic Core
 * Este archivo protege la funcionalidad crítica del ecosistema MusiChris.
 * NO EDITAR SIN SUPERVISIÓN DE ANTIGRAVITY.
 */

window.MusiChrisEngine = {
    // IDs de los dos Núcleos de Datos
    CATALOG_ID: '1oTVSF7CjrCtnk3pHdBIRE8gzhE9zKDM5NJFyWV-qsJs',
    HISTORY_ID: '17vd4F5yhQUPYFOO6ZR6uNkBwlq2BuJRNFO9SN-ViN5Y',
    
    // Función de Sincronización Multi-Sheet v20.0
    fetchCatalog: function() {
        return new Promise((resolve, reject) => {
            const catalogCallback = 'cat_' + Math.floor(Math.random() * 100000);
            const historyCallback = 'his_' + Math.floor(Math.random() * 100000);
            
            let catalogData = [];
            let countsMap = {};
            let partsLoaded = 0;

            const checkDone = () => {
                partsLoaded++;
                if (partsLoaded === 2) {
                    const finalData = catalogData.map(song => ({
                        ...song,
                        shortCount: countsMap[song.title.toLowerCase().trim()] || 0
                    }));
                    resolve(finalData);
                    cleanup();
                }
            };

            const cleanup = () => {
                delete window[catalogCallback]; delete window[historyCallback];
                document.getElementById(catalogCallback)?.remove();
                document.getElementById(historyCallback)?.remove();
            };

            // 1. Obtener Historial (Sheet B - 17vd...)
            window[historyCallback] = (data) => {
                try {
                    data.table.rows.forEach(r => {
                        const songName = r.c[4] ? r.c[4].v : ''; // Columna E (index 4)
                        const count = r.c[10] ? r.c[10].v : 1; // Un registro = 1 short si no hay cuenta
                        // Si la consulta ya viene agrupada (SELECT E, COUNT(E)...)
                        const name = r.c[0] ? r.c[0].v : '';
                        const total = r.c[1] ? r.c[1].v : 0;
                        if (name) countsMap[name.toLowerCase().trim()] = total;
                    });
                } catch(e) { console.warn("Historial vacío"); }
                checkDone();
            };

            // 2. Obtener Catálogo Maestro (Sheet A - 1oTVS...)
            window[catalogCallback] = (data) => {
                try {
                    catalogData = data.table.rows.map(r => {
                        const clean = (i) => (r.c[i] ? r.c[i].v : '');
                        const title = clean(1); // Columna B (Nombre)
                        const biblical = clean(3); // Columna D (Texto Bíblico)
                        
                        // FILTRO ATÓMICO v21.1: Si cumple CUALQUIERA de estos, es BASURA técnica
                        const isTrash = !title || 
                                       title.length > 70 || 
                                       title.includes('REGLAS') || 
                                       title.includes('FORMATO') || 
                                       title.includes('Style') || 
                                       title.includes('Actúa como') ||
                                       /^[0-9]\./.test(title) || // Empieza con "1. ", "2. ", etc
                                       /^[A-Z]\)/.test(title) || // Empieza con "A) ", "B) ", etc
                                       title.includes('🔴') || title.includes('🟢') || title.includes('🔵');

                        if (isTrash) return null;

                        return {
                            album: clean(0) || 'MusiChris',
                            title: title,
                            biblical: biblical,
                            id: title.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '_')
                        };
                    }).filter(s => s !== null);
                } catch(e) { console.error("Error en catálogo:", e); }
                checkDone();
            };

            // Disparar Consultas
            const sHistory = document.createElement('script');
            sHistory.id = historyCallback;
            sHistory.src = `https://docs.google.com/spreadsheets/d/${this.HISTORY_ID}/gviz/tq?tqx=responseHandler:${historyCallback}&sheet=Hoja%201&tq=${encodeURIComponent('SELECT E, COUNT(E) GROUP BY E')}`;
            document.body.appendChild(sHistory);

            const sCatalog = document.createElement('script');
            sCatalog.id = catalogCallback;
            // PUNTO FINAL: Apuntamos específicamente a la Hoja 4 (El Catálogo Real)
            sCatalog.src = `https://docs.google.com/spreadsheets/d/${this.CATALOG_ID}/gviz/tq?tqx=responseHandler:${catalogCallback}&sheet=Hoja%204`;
            document.body.appendChild(sCatalog);

            setTimeout(() => reject(new Error("Nexus Sync Timeout")), 12000);
        });
    },

    // Función Central para disparar la producción en la nube
    produceShort: async function(pat, songId) {
        if (!pat) throw new Error("Falta Token de Configuración");
        
        const response = await fetch(`https://api.github.com/repos/hjalmarmeza/Musichris_Shorts/dispatches`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${pat}`,
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({ 
                event_type: 'render_short', 
                client_payload: { songId } 
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || "Error de conexión con la nube");
        }

        return true;
    },

    // Gestión de Credenciales
    getStoredPat: () => localStorage.getItem('gh_pat') || '',
    storePat: (pat) => localStorage.setItem('gh_pat', pat)
};

console.log("🚀 MusiChris Engine v18.0 - Ready and Protected");
