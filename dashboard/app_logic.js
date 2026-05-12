/**
 * MUSICHIRS ENGINE v39.1 - Master Logic Core (UHD Edition)
 * Optimizado para movilidad y sincronización de alta fidelidad.
 */

window.MusiChrisEngine = {
    // Detectamos la URL base dinámicamente para que funcione en móvil y PC
    getAPI_BASE: function() {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:3001';
        }
        return window.location.origin; // Usa la IP o dominio actual
    },
    
    // Función de Sincronización Maestra
    fetchCatalog: async function() {
        try {
            console.log("🛰️ Sincronizando con el motor local...");
            const response = await fetch(`${this.getAPI_BASE()}/api/songs`);
            if (!response.ok) throw new Error("Error en servidor");
            
            const songs = await response.json();
            
            // DEDUPLICACIÓN Y LIMPIEZA
            const uniqueSongs = [];
            const titles = new Set();
            
            songs.forEach(s => {
                const cleanTitle = s.title.trim().toLowerCase();
                if (!titles.has(cleanTitle)) {
                    titles.add(cleanTitle);
                    uniqueSongs.push({
                        id: s.id,
                        title: s.title,
                        album: s.album || 'MusiChris',
                        shortCount: s.shortCount || 0
                    });
                }
            });

            return uniqueSongs.sort((a, b) => a.title.localeCompare(b.title));
            
        } catch (e) {
            console.warn("⚠️ Servidor local inaccesible, activando Nexus Sheet Sync...");
            return this.fetchFromSheets(); // Fallback a Google Sheets directo
        }
    },

    // Orquestación de Producción
    produce: async function(songId, onLog) {
        onLog(`🚀 Iniciando producción para: ${songId}`);
        try {
            const response = await fetch(`${this.getAPI_BASE()}/api/publish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ songId })
            });
            
            const result = await response.json();
            if (result.success) {
                onLog(`✅ ¡ÉXITO! Short generado.`);
                return result;
            } else {
                throw new Error(result.error || 'Error en producción');
            }
        } catch (e) {
            onLog(`❌ ERROR: ${e.message}`);
            throw e;
        }
    },

    // NEXUS SYNC (Fallback de seguridad)
    CATALOG_ID: '1oTVSF7CjrCtnk3pHdBIRE8gzhE9zKDM5NJFyWV-qsJs',
    HISTORY_ID: '17vd4F5yhQUPYFOO6ZR6uNkBwlq2BuJRNFO9SN-ViN5Y',
    
    fetchFromSheets: function() {
        return new Promise((resolve) => {
            // Lógica minimalista para no dejar la pantalla en blanco
            // En una versión futura, aquí iría el parser de JSONP completo
            console.log("Fallback activo");
            resolve([]); 
        });
    },

    // Función para GitHub Actions (Producción en la Nube)
    produceShort: async function(pat, songId) {
        if (!pat) throw new Error("Falta Token");
        const response = await fetch(`https://api.github.com/repos/hjalmarmeza/Musichris_Shorts/dispatches`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${pat}`,
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({ event_type: 'render_short', client_payload: { songId } })
        });
        if (!response.ok) throw new Error("Falla en la Nube");
        return true;
    },

    getStoredPat: () => localStorage.getItem('gh_pat') || '',
    storePat: (pat) => localStorage.setItem('gh_pat', pat)
};

console.log("✨ MusiChris Master Engine v39.1 Cargado");
