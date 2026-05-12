/**
 * MUSICHIRS ENGINE v39.1 - Master Logic Core (UHD Edition)
 * Versión Híbrida: Conecta al servidor local o directamente a Google Sheets (4G Ready).
 */

window.MusiChrisEngine = {
    CATALOG_ID: '1oTVSF7CjrCtnk3pHdBIRE8gzhE9zKDM5NJFyWV-qsJs',
    URL_SHEET_ID: '19zXfIiAZktXXyixZ1HdcW1IO9bOBn8S8sRPZAXUVZbE',
    HISTORY_ID: '17vd4F5yhQUPYFOO6ZR6uNkBwlq2BuJRNFO9SN-ViN5Y',

    getAPI_BASE: function() {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:3001';
        }
        return null; // En 4G/Cloud, forzamos conexión directa a Sheets
    },
    
    fetchCatalog: async function() {
        const apiBase = this.getAPI_BASE();
        if (apiBase) {
            try {
                const response = await fetch(`${apiBase}/api/songs`);
                if (response.ok) return await response.json();
            } catch (e) { console.log("Servidor local no responde, usando Nexus Direct..."); }
        }
        return this.fetchFromSheets();
    },

    fetchFromSheets: function() {
        return new Promise((resolve, reject) => {
            console.log("🛰️ Iniciando Nexus Direct Sync (Modo 4G)...");
            const callbacks = {
                cat: 'cb_' + Math.floor(Math.random() * 99999),
                url: 'cb_' + Math.floor(Math.random() * 99999),
                his: 'cb_' + Math.floor(Math.random() * 99999)
            };
            
            let data = { theology: [], urls: {}, counts: {} };
            let loaded = 0;

            const checkDone = () => {
                loaded++;
                if (loaded === 3) {
                    const final = data.theology.map(s => {
                        const url = data.urls[s.title.toLowerCase().trim()];
                        if (!url) return null;
                        return { ...s, audioUrl: url, shortCount: data.counts[s.title.toLowerCase().trim()] || 0 };
                    }).filter(s => s !== null);
                    resolve(final);
                }
            };

            // 1. Historial
            window[callbacks.his] = (res) => {
                try {
                    res.table.rows.forEach(r => {
                        const name = r.c[0]?.v;
                        const count = r.c[1]?.v;
                        if (name) data.counts[name.toLowerCase().trim()] = count;
                    });
                } catch(e) {}
                checkDone();
            };

            // 2. URLs (Hoja 2)
            window[callbacks.url] = (res) => {
                try {
                    const rows = res.table.rows;
                    rows.forEach(r => {
                        const title = r.c[2]?.v; // Título en C
                        const url = r.c[3]?.v;   // URL en D
                        if (title && url) data.urls[title.toLowerCase().trim()] = url;
                    });
                } catch(e) {}
                checkDone();
            };

            // 3. Catálogo (Hoja 4)
            window[callbacks.cat] = (res) => {
                try {
                    data.theology = res.table.rows.map(r => {
                        const title = r.c[1]?.v; // B
                        if (!title || title.length > 80) return null;
                        return {
                            id: title.toLowerCase().replace(/[^a-z0-9]/g, '_'),
                            title: title,
                            biblical: r.c[2]?.v || '',
                            complement: r.c[3]?.v || ''
                        };
                    }).filter(s => s !== null);
                } catch(e) {}
                checkDone();
            };

            const addScript = (id, src) => {
                const s = document.createElement('script');
                s.id = id; s.src = src;
                document.body.appendChild(s);
            };

            addScript(callbacks.his, `https://docs.google.com/spreadsheets/d/${this.HISTORY_ID}/gviz/tq?tqx=responseHandler:${callbacks.his}&sheet=Hoja%201&tq=SELECT%20E%2C%20COUNT(E)%20GROUP%20BY%20E`);
            addScript(callbacks.url, `https://docs.google.com/spreadsheets/d/${this.URL_SHEET_ID}/gviz/tq?tqx=responseHandler:${callbacks.url}&sheet=Hoja%202`);
            addScript(callbacks.cat, `https://docs.google.com/spreadsheets/d/${this.CATALOG_ID}/gviz/tq?tqx=responseHandler:${callbacks.cat}&sheet=Hoja%204`);

            setTimeout(() => resolve([]), 15000);
        });
    },

    produceShort: async function(pat, songId) {
        if (!pat) throw new Error("Falta Token");
        const response = await fetch(`https://api.github.com/repos/hjalmarmeza/Musichris_Shorts/dispatches`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${pat}`, 'Accept': 'application/vnd.github.v3+json' },
            body: JSON.stringify({ event_type: 'render_short', client_payload: { songId } })
        });
        return response.ok;
    },

    getStoredPat: () => localStorage.getItem('gh_pat') || '',
    storePat: (pat) => localStorage.setItem('gh_pat', pat)
};
