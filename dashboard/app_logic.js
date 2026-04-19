/**
 * MUSICHIRS ENGINE v18.0 - Master Logic Core
 * Este archivo protege la funcionalidad crítica del ecosistema MusiChris.
 * NO EDITAR SIN SUPERVISIÓN DE ANTIGRAVITY.
 */

window.MusiChrisEngine = {
    // Configuración del Mando a Distancia Local
    API_BASE: 'http://localhost:3001',
    
    // Función de Sincronización Integrada v22.0
    fetchCatalog: async function() {
        try {
            const response = await fetch(`${this.API_BASE}/api/songs`);
            if (!response.ok) throw new Error("Servidor fuera de línea");
            const songs = await response.json();
            
            // Mapeamos para mantener compatibilidad con la UI de humo
            return songs.map(s => ({
                id: s.id,
                title: s.title,
                album: s.album || 'MusiChris',
                shortCount: s.count || 0 // El servidor ya entrega el conteo
            }));
        } catch (e) {
            console.warn("⚠️ Servidor local no detectado, usando Nexus Sheet Sync de respaldo...");
            return this.fetchFromSheets(); // Fallback por si el servidor está apagado
        }
    },

    // Orquestación de Producción Real
    produce: async function(songId, onLog) {
        onLog(`🚀 Iniciando secuencia para [${songId}]...`);
        onLog(`🔗 Conectando con Master Engine en puerto 3001...`);
        
        try {
            const response = await fetch(`${this.API_BASE}/api/publish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ songId })
            });
            
            const result = await response.json();
            
            if (result.success) {
                onLog(`✅ ¡ÉXITO! Short #${result.song.count} generado.`);
                onLog(`📺 YouTube ID: ${result.youtubeId}`);
                onLog(`✨ Estado: ${result.status}`);
                return result;
            } else {
                throw new Error(result.error || 'Error en producción');
            }
        } catch (e) {
            onLog(`❌ ERROR: ${e.message}`);
            throw e;
        }
    },

    // Respaldo de seguridad (Nexus Sheet Sync)
    CATALOG_ID: '1oTVSF7CjrCtnk3pHdBIRE8gzhE9zKDM5NJFyWV-qsJs',
    HISTORY_ID: '17vd4F5yhQUPYFOO6ZR6uNkBwlq2BuJRNFO9SN-ViN5Y',
    fetchFromSheets: function() {
        // ... (Mantengo la lógica anterior de Sheets como backup)
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
