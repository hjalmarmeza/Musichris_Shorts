/**
 * MUSICHIRS ENGINE v39.3 - Bulletproof Edition
 * Procesador de datos ultra-tolerante con logs de estructura.
 */

window.MusiChrisEngine = {
    CATALOG_ID: '1oTVSF7CjrCtnk3pHdBIRE8gzhE9zKDM5NJFyWV-qsJs',
    URL_SHEET_ID: '19zXfIiAZktXXyixZ1HdcW1IO9bOBn8S8sRPZAXUVZbE',
    HISTORY_ID: '17vd4F5yhQUPYFOO6ZR6uNkBwlq2BuJRNFO9SN-ViN5Y',

    log: [],
    addLog: function(msg) {
        const t = new Date().toLocaleTimeString();
        this.log.push(`[${t}] ${msg}`);
        if (window.updateLogUI) window.updateLogUI();
    },

    getAPI_BASE: function() {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:3001';
        }
        return null;
    },
    
    fetchCatalog: async function() {
        const apiBase = this.getAPI_BASE();
        if (apiBase) {
            try {
                const response = await fetch(`${apiBase}/api/songs`);
                if (response.ok) return await response.json();
            } catch (e) {}
        }
        return this.fetchFromSheets();
    },

    fetchFromSheets: function() {
        return new Promise((resolve) => {
            this.addLog("🛰️ Nexus Direct v39.3: Iniciando...");
            const callbacks = {
                cat: 'cb_cat_' + Date.now(),
                url: 'cb_url_' + Date.now(),
                his: 'cb_his_' + Date.now()
            };
            
            let data = { theology: [], urls: {}, counts: {} };
            let loaded = 0;

            const finalize = () => {
                this.addLog(`📊 Fusionando: ${data.theology.length} temas.`);
                const final = data.theology.map(s => {
                    const cleanTitle = s.title.toLowerCase().trim();
                    return {
                        ...s,
                        audioUrl: data.urls[cleanTitle] || null,
                        shortCount: data.counts[cleanTitle] || 0
                    };
                });
                resolve(final.sort((a, b) => a.title.localeCompare(b.title)));
            };

            const findColumn = (rows, keywords, label) => {
                if (!rows || rows.length === 0) return -1;
                const firstRow = rows[0].c || [];
                for (let i = 0; i < firstRow.length; i++) {
                    const val = (firstRow[i]?.v || "").toString().toLowerCase();
                    if (keywords.some(k => val.includes(k.toLowerCase()))) {
                        this.addLog(`📍 [${label}] detectado en columna ${i}`);
                        return i;
                    }
                }
                return -1;
            };

            window[callbacks.his] = (res) => {
                try {
                    res.table.rows.forEach(r => {
                        const name = r.c[0]?.v;
                        const count = r.c[1]?.v;
                        if (name) data.counts[name.toLowerCase().trim()] = count;
                    });
                    this.addLog("✅ Historial OK.");
                } catch(e) { this.addLog("⚠️ Historial vacío."); }
                if (++loaded === 3) finalize();
            };

            window[callbacks.url] = (res) => {
                try {
                    const rows = res.table.rows;
                    const colTitle = findColumn(rows, ["título", "title", "nombre"], "URL-Título");
                    const colUrl = findColumn(rows, ["url", "link", "drive"], "URL-Link");
                    
                    const tCol = colTitle !== -1 ? colTitle : 2;
                    const uCol = colUrl !== -1 ? colUrl : 3;

                    rows.forEach((r, idx) => {
                        if (idx === 0) return;
                        const title = r.c[tCol]?.v;
                        const url = r.c[uCol]?.v;
                        if (title && url) data.urls[title.toLowerCase().trim()] = url;
                    });
                    this.addLog("✅ URLs OK.");
                } catch(e) { this.addLog("⚠️ Error en URLs."); }
                if (++loaded === 3) finalize();
            };

            window[callbacks.cat] = (res) => {
                try {
                    const rows = res.table.rows;
                    const colTitle = findColumn(rows, ["título", "title", "tema"], "CAT-Título");
                    const colBib = findColumn(rows, ["biblia", "texto", "cita"], "CAT-Biblia");
                    
                    const tCol = colTitle !== -1 ? colTitle : 1;
                    const bCol = colBib !== -1 ? colBib : 2;

                    data.theology = rows.map((r, idx) => {
                        if (idx === 0) return null;
                        const title = r.c[tCol]?.v;
                        if (!title || title.toString().length > 100) return null;
                        return {
                            id: title.toString().toLowerCase().replace(/[^a-z0-9]/g, '_'),
                            title: title.toString(),
                            biblical: r.c[bCol]?.v || ''
                        };
                    }).filter(s => s !== null);
                    this.addLog(`✅ Catálogo OK (${data.theology.length} items).`);
                } catch(e) { 
                    this.addLog("❌ Error fatal en Catálogo: " + e.message); 
                }
                if (++loaded === 3) finalize();
            };

            const addScript = (src) => {
                const s = document.createElement('script');
                s.src = src;
                document.body.appendChild(s);
            };

            addScript(`https://docs.google.com/spreadsheets/d/${this.HISTORY_ID}/gviz/tq?tqx=responseHandler:${callbacks.his}&sheet=Hoja%201&tq=SELECT%20E%2C%20COUNT(E)%20GROUP%20BY%20E`);
            addScript(`https://docs.google.com/spreadsheets/d/${this.URL_SHEET_ID}/gviz/tq?tqx=responseHandler:${callbacks.url}&sheet=Hoja%202`);
            addScript(`https://docs.google.com/spreadsheets/d/${this.CATALOG_ID}/gviz/tq?tqx=responseHandler:${callbacks.cat}&sheet=Hoja%204`);

            setTimeout(() => { if (loaded < 3) { this.addLog("⏰ Timeout Nexus."); resolve([]); } }, 15000);
        });
    },

    produceShort: async function(pat, songId) {
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
