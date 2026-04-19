const fetch = require('node-fetch');

async function generateAIContent(songTitle, theologyContext = null) {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const model = "gemini-1.5-flash";
    const timestamp = new Date().getTime(); // Semilla de aleatoriedad
    
    let instructions = `Misión: Creador de contenido de ALTO IMPACTO y VIDA para la marca MusiChris. 
    Canción: "${songTitle}". 
    CONTEXTO ÚNICO [ID-${timestamp}]: No uses frases hechas ni clichés religiosos comunes.
    
    Genera un JSON con:
    1. "citation": Una referencia bíblica corta y poderosa.
    2. "message": Una profunda reflexión de esperanza de MÁXIMO 100 caracteres. Debe sonar fresca, moderna y ministerial.
    3. "tags": 3 hashtags de gran alcance.
    
    RESPONDE UNICAMENTE JSON PURO.`;

    if (theologyContext) {
        instructions = `Misión: ALIENTO Y VIDA. Basándote en el versículo "${theologyContext.verse}" y la temática "${theologyContext.thematic}" de la canción "${songTitle}".
        
        REGLAS DE ORO:
        - "citation": Usa exactamente "${theologyContext.verse}".
        - "message": Escribe una reflexión de IMPACTO TOTAL basada en ese pasaje. Máximo 100 caracteres. 
        - Único: Esta respuesta debe ser diferente a cualquier otra (Referencia: ${timestamp}).
        
        RESPONDE UNICAMENTE JSON.`;
    }

    try {
        console.log(`[AI-GEN] Solicitando contenido único para: ${songTitle}...`);
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: instructions }] }] })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(`API de Gemini rechazó la petición: ${JSON.stringify(errData)}`);
        }

        const data = await response.json();
        let jsonStr = data.candidates[0].content.parts[0].text;
        jsonStr = jsonStr.replace(/```json|```/g, '').trim();
        return JSON.parse(jsonStr);

    } catch (e) {
        console.error('❌ [AI-GEN ERROR]:', e.message);
        throw new Error(`Error generando IA para ${songTitle}. Deteniendo para evitar duplicados genéricos.`);
    }
}

module.exports = { generateAIContent };
