/**
 * MUSICHIRS ENGINE v39.4 - X-Ray Edition
 * Diagnóstico profundo y lectura de emergencia.
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

    fetchCatalog: async function() {
        return this.fetchFromSheets();
    },

    fetchFromSheets: function() {
        return new Promise((resolve) => {
            this.addLog("🛰️ Nexus X-Ray v39.4: Iniciando...");
            const callbacks = {
                cat: 'cb_cat_' + Date.now(),
                url: 'cb_url_' + Date.now(),
                his: 'cb_his_' + Date.now()
            };
            
            let data = { theology: [], urls: {}, counts: {} };
            let loaded = 0;

            const checkFinish = () => {
                if (++loaded === 3) {
                    this.addLog(`📊 Finalizando cruce de ${data.theology.length} temas.`);
                    const final = data.theology.map(s => {
                        const cleanTitle = s.title.toLowerCase().trim();
                        return { ...s, audioUrl: data.urls[cleanTitle] || null, shortCount: data.counts[cleanTitle] || 0 };
                    });
                    resolve(final.sort((a, b) => a.title.localeCompare(b.title)));
                }
            };

            const safeGetRows = (res, label) => {
                if (!res) { this.addLog(`❌ [${label}] Respuesta nula.`); return null; }
                if (res.status === 'error') { this.addLog(`❌ [${label}] Google dice: ${res.errors[0]?.detailed_message || 'Error desconocido'}`); return null; }
                if (!res.table || !res.table.rows) { this.addLog(`❌ [${label}] Estructura de tabla no encontrada.`); return null; }
                return res.table.rows;
            };

            window[callbacks.his] = (res) => {
                const rows = safeGetRows(res, "Historial");
                if (rows) {
                    rows.forEach(r => {
                        const name = r.c?.[0]?.v;
                        const count = r.c?.[1]?.v;
                        if (name) data.counts[name.toString().toLowerCase().trim()] = count;
                    });
                    this.addLog("✅ Historial procesado.");
                }
                checkFinish();
            };

            window[callbacks.url] = (res) => {
                const rows = safeGetRows(res, "URLs");
                if (rows) {
                    // Mapeo forzado si falla detección
                    rows.forEach((r, idx) => {
                        if (idx === 0) return;
                        const title = r.c?.[2]?.v; // Columna C
                        const url = r.c?.[3]?.v;   // Columna D
                        if (title && url) data.urls[title.toString().toLowerCase().trim()] = url.toString();
                    });
                    this.addLog(`✅ URLs procesadas (${Object.keys(data.urls).length} encontradas).`);
                }
                checkFinish();
            };

            window[callbacks.cat] = (res) => {
                const rows = safeGetRows(res, "Catálogo");
                if (rows) {
                    try {
                        data.theology = rows.map((r, idx) => {
                            if (idx === 0) return null;
                            const title = r.c?.[1]?.v; // Columna B
                            if (!title) return null;
                            return {
                                id: title.toString().toLowerCase().replace(/[^a-z0-9]/g, '_'),
                                title: title.toString(),
                                biblical: r.c?.[2]?.v || '' // Columna C
                            };
                        }).filter(s => s !== null);
                        this.addLog(`✅ Catálogo procesado (${data.theology.length} temas).`);
                    } catch(e) { this.addLog("❌ Error en mapeo de Catálogo: " + e.message); }
                }
                checkFinish();
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
