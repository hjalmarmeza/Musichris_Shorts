const API_KEY = process.env.GEMINI_API_KEY;

async function generateAIContent(title, album) {
    try {
        console.log(`[AI-GEMINI] Solicitando reflexión profunda para: ${title}...`);
        
        const prompt = `Actúa como un mentor espiritual y experto en copywriting para YouTube Shorts. 
        Canción: "${title}"
        Album: "${album}"
        
        Objetivo: Generar 3 textos cortos para un video de 30 segundos:
        1. "quote": Una frase impactante sobre la fe, la esperanza o el propósito inspirada en el título.
        2. "complement": Un mensaje corto pero profundo que anime al espectador.
        3. "verse": Un versículo bíblico corto que pegue con el tema.
        
        RESPONDE ÚNICAMENTE EN FORMATO JSON PURO como este:
        {"quote": "...", "complement": "...", "verse": "..."}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { response_mime_type: "application/json" }
            })
        });

        const data = await response.json();
        
        // Validación de seguridad para la respuesta de Gemini
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            console.error('⚠️ Respuesta de Gemini incompleta o bloqueada:', JSON.stringify(data));
            throw new Error('Formato de respuesta inválido');
        }

        const jsonStr = data.candidates[0].content.parts[0].text;
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error('[AI-ERROR] Falló Gemini, usando respaldo:', e.message);
        return {
            quote: `Que la paz de Dios que sobrepasa todo entendimiento te guarde.`,
            complement: `Escucha "${title}" y encuentra descanso para tu alma.`,
            verse: 'Filipenses 4:7'
        };
    }
}

module.exports = { generateAIContent };
