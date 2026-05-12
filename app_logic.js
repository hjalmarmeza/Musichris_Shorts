/**
 * MUSICHIRS ENGINE v39.2 - Detective Edition
 * Motor ultra-resiliente con detección de cabeceras dinámica.
 */

window.MusiChrisEngine = {
    CATALOG_ID: '1oTVSF7CjrCtnk3pHdBIRE8gzhE9zKDM5NJFyWV-qsJs',
    URL_SHEET_ID: '19zXfIiAZktXXyixZ1HdcW1IO9bOBn8S8sRPZAXUVZbE',
    HISTORY_ID: '17vd4F5yhQUPYFOO6ZR6uNkBwlq2BuJRNFO9SN-ViN5Y',

    log: [],
    addLog: function(msg) {
        const t = new Date().toLocaleTimeString();
        this.log.push(`[${t}] ${msg}`);
        console.log(msg);
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
                this.addLog("🔍 Probando conexión con servidor local...");
                const response = await fetch(`${apiBase}/api/songs`);
                if (response.ok) {
                    this.addLog("✅ Servidor local conectado.");
                    return await response.json();
                }
            } catch (e) { this.addLog("⚠️ Servidor local offline."); }
        }
        return this.fetchFromSheets();
    },

    fetchFromSheets: function() {
        return new Promise((resolve) => {
            this.addLog("🛰️ Iniciando Nexus Direct (Modo 4G)...");
            const callbacks = {
                cat: 'cb_cat_' + Date.now(),
                url: 'cb_url_' + Date.now(),
                his: 'cb_his_' + Date.now()
            };
            
            let data = { theology: [], urls: {}, counts: {} };
            let loaded = 0;

            const finalize = () => {
                this.addLog(`📊 Cruzando datos: ${data.theology.length} temas encontrados.`);
                const final = data.theology.map(s => {
                    const cleanTitle = s.title.toLowerCase().trim();
                    return {
                        ...s,
                        audioUrl: data.urls[cleanTitle] || null,
                        shortCount: data.counts[cleanTitle] || 0
                    };
                }).filter(s => s.title); // No filtramos por URL para ver qué falta
                
                resolve(final.sort((a, b) => a.title.localeCompare(b.title)));
            };

            const findColumn = (rows, keywords) => {
                if (!rows || rows.length === 0) return -1;
                const firstRow = rows[0].c;
                for (let i = 0; i < firstRow.length; i++) {
                    const val = (firstRow[i]?.v || "").toLowerCase();
                    if (keywords.some(k => val.includes(k.toLowerCase()))) return i;
                }
                return -1;
            };

            // 1. HISTORIAL
            window[callbacks.his] = (res) => {
                this.addLog("📥 Datos de Historial recibidos.");
                try {
                    res.table.rows.forEach(r => {
                        const name = r.c[0]?.v;
                        const count = r.c[1]?.v;
                        if (name) data.counts[name.toLowerCase().trim()] = count;
                    });
                } catch(e) { this.addLog("❌ Error procesando Historial."); }
                if (++loaded === 3) finalize();
            };

            // 2. URLs (Hoja 2)
            window[callbacks.url] = (res) => {
                this.addLog("📥 Datos de URLs recibidos.");
                try {
                    const rows = res.table.rows;
                    const colTitle = findColumn(rows, ["título", "title", "nombre", "canción"]) || 2;
                    const colUrl = findColumn(rows, ["url", "link", "drive", "audio"]) || 3;
                    
                    rows.forEach((r, idx) => {
                        if (idx === 0) return; // Saltamos cabecera si la hay
                        const title = r.c[colTitle]?.v;
                        const url = r.c[colUrl]?.v;
                        if (title && url) data.urls[title.toLowerCase().trim()] = url;
                    });
                } catch(e) { this.addLog("❌ Error procesando URLs."); }
                if (++loaded === 3) finalize();
            };

            // 3. CATÁLOGO (Hoja 4)
            window[callbacks.cat] = (res) => {
                this.addLog("📥 Datos de Catálogo recibidos.");
                try {
                    const rows = res.table.rows;
                    const colTitle = findColumn(rows, ["título", "title", "tema"]) || 1;
                    const colBib = findColumn(rows, ["biblia", "texto", "cita"]) || 2;
                    
                    data.theology = rows.map((r, idx) => {
                        if (idx === 0) return null;
                        const title = r.c[colTitle]?.v;
                        if (!title || title.length > 100) return null;
                        return {
                            id: title.toLowerCase().replace(/[^a-z0-9]/g, '_'),
                            title: title,
                            biblical: r.c[colBib]?.v || ''
                        };
                    }).filter(s => s !== null);
                } catch(e) { this.addLog("❌ Error procesando Catálogo."); }
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

            setTimeout(() => { if (loaded < 3) { this.addLog("⏰ Tiempo de espera agotado."); resolve([]); } }, 20000);
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
