/**
 * MUSICHIRS ENGINE v19.0 - Master Logic Core (Diamond Triangulation)
 * Este archivo protege la funcionalidad crítica del ecosistema MusiChris.
 * NO EDITAR SIN SUPERVISIÓN DE ANTIGRAVITY.
 */

window.MusiChrisEngine = {
    // IDs de los Núcleos de Datos
    CATALOG_ID: '1oTVSF7CjrCtnk3pHdBIRE8gzhE9zKDM5NJFyWV-qsJs',
    URL_SHEET_ID: '19zXfIiAZktXXyixZ1HdcW1IO9bOBn8S8sRPZAXUVZbE',
    HISTORY_ID: '17vd4F5yhQUPYFOO6ZR6uNkBwlq2BuJRNFO9SN-ViN5Y',
    
    // Función de Sincronización Multi-Sheet v21.0
    fetchCatalog: function() {
        return new Promise((resolve, reject) => {
            const catalogCallback = 'cat_' + Math.floor(Math.random() * 100000);
            const urlCallback = 'url_' + Math.floor(Math.random() * 100000);
            const historyCallback = 'his_' + Math.floor(Math.random() * 100000);
            
            let rawTheologyData = [];
            let urlMap = {};
            let countsMap = {};
            let partsLoaded = 0;

            const checkDone = () => {
                partsLoaded++;
                if (partsLoaded === 3) {
                    // MERGE FINAL: Unimos Teología + URLs + Historial
                    const finalData = rawTheologyData.map(song => {
                        const songUrl = urlMap[song.title.toLowerCase().trim()];
                        if (!songUrl) return null; // Si no tiene URL, no es reproducible

                        return {
                            ...song,
                            audioUrl: songUrl,
                            shortCount: countsMap[song.title.toLowerCase().trim()] || 0
                        };
                    }).filter(s => s !== null);
                    
                    resolve(finalData);
                    cleanup();
                }
            };

            const cleanup = () => {
                delete window[catalogCallback]; delete window[urlCallback]; delete window[historyCallback];
                document.getElementById(catalogCallback)?.remove();
                document.getElementById(urlCallback)?.remove();
                document.getElementById(historyCallback)?.remove();
            };

            // 1. Obtener Historial (Producciones hechas)
            window[historyCallback] = (data) => {
                try {
                    data.table.rows.forEach(r => {
                        const name = r.c[0] ? r.c[0].v : '';
                        const total = r.c[1] ? r.c[1].v : 0;
                        if (name) countsMap[name.toLowerCase().trim()] = total;
                    });
                } catch(e) { console.warn("Historial vacío"); }
                checkDone();
            };

            // 2. Obtener URLs (Sheet 2 - 19zX... Hoja 2)
            window[urlCallback] = (data) => {
                try {
                    data.table.rows.forEach(r => {
                        const title = r.c[2] ? r.c[2].v : ''; // Columna C: Título
                        const url = r.c[3] ? r.c[3].v : '';   // Columna D: URL
                        if (title && url) urlMap[title.toLowerCase().trim()] = url;
                    });
                } catch(e) { console.error("Error en URLs:", e); }
                checkDone();
            };

            // 3. Obtener Catálogo Maestro (Sheet 1 - 1oTVS... Hoja 4)
            window[catalogCallback] = (data) => {
                try {
                    rawTheologyData = data.table.rows.map(r => {
                        const clean = (i) => (r.c[i] ? r.c[i].v : '');
                        const title = clean(1);    // Columna B: Título
                        const biblical = clean(2); // Columna C: Versículo
                        const complement = clean(3); // Columna D: Contexto
                        
                        if (!title || title.length > 70 || title.includes('Style')) return null;

                        return {
                            album: 'MusiChris',
                            title: title,
                            biblical: biblical,
                            complement: complement,
                            id: title.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '_')
                        };
                    }).filter(s => s !== null);
                } catch(e) { console.error("Error en teología:", e); }
                checkDone();
            };

            // Disparar Consultas
            const sHistory = document.createElement('script');
            sHistory.id = historyCallback;
            sHistory.src = `https://docs.google.com/spreadsheets/d/${this.HISTORY_ID}/gviz/tq?tqx=responseHandler:${historyCallback}&sheet=Hoja%201&tq=${encodeURIComponent('SELECT E, COUNT(E) GROUP BY E')}`;
            document.body.appendChild(sHistory);

            const sUrls = document.createElement('script');
            sUrls.id = urlCallback;
            sUrls.src = `https://docs.google.com/spreadsheets/d/${this.URL_SHEET_ID}/gviz/tq?tqx=responseHandler:${urlCallback}&sheet=Hoja%202`;
            document.body.appendChild(sUrls);

            const sCatalog = document.createElement('script');
            sCatalog.id = catalogCallback;
            sCatalog.src = `https://docs.google.com/spreadsheets/d/${this.CATALOG_ID}/gviz/tq?tqx=responseHandler:${catalogCallback}&sheet=Hoja%204`;
            document.body.appendChild(sCatalog);

            setTimeout(() => reject(new Error("Nexus Sync Timeout")), 15000);
        });
    },

    produceShort: async function(pat, songId) {
        if (!pat) throw new Error("Falta Token de Configuración");
        const response = await fetch(`https://api.github.com/repos/hjalmarmeza/Musichris_Shorts/dispatches`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${pat}`,
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({ event_type: 'render_short', client_payload: { songId } })
        });
        if (!response.ok) throw new Error("Error de conexión con la nube");
        return true;
    },

    getStoredPat: () => localStorage.getItem('gh_pat') || '',
    storePat: (pat) => localStorage.setItem('gh_pat', pat)
};
