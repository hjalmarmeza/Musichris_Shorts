const fetch = require('node-fetch');

const FALLBACK_TEMPLATES = [
    {
        citation: "Jeremías 29:11",
        msg: "Dios tiene pensamientos de paz para ti hoy. No temas, Su plan es devolverte la esperanza y un futuro lleno de Su luz.",
        tags: "#Esperanza #Fe #DiosEsBueno"
    },
    {
        citation: "Filipenses 4:13",
        msg: "Aunque el camino sea difícil, Su fuerza te sostiene. Hoy puedes levantarte porque Cristo es quien te fortalece.",
        tags: "#Fortaleza #Victoria #Aliento"
    }
];

async function generateAIContent(songTitle, theologyContext = null) {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const model = "gemini-1.5-flash";
    
    // El prompt ahora se enfoca en MINISTERIAL/ALIENTO, con variedad garantizada.
    let instructions = `Actúa como un pastor que brinda aliento. Para el tema "${songTitle}", genera un JSON con:
    1. "citation": La referencia bíblica corta.
    2. "message": Una reflexión de ESPERANZA NUEVA y ÚNICA (máximo 100 caracteres). NO repitas frases comunes.
    3. "tags": 3 hashtags de fe.
    Responde UNICAMENTE JSON.`;

    if (theologyContext) {
        instructions = `Misión: Brindar aliento y vida. La canción "${songTitle}" se basa en: ${theologyContext.verse}.
        
        Tu tarea:
        1. "citation": Usa EXACTAMENTE "${theologyContext.verse}".
        2. "message": Basándote en ese versículo, escribe una reflexión de esperanza TOTALMENTE NUEVA y DIFERENTE a interpretaciones previas. Que sea profunda y motivadora (máx. 100 caracteres).
        3. "tags": 3 hashtags basados en "${theologyContext.thematic}".
        Responde UNICAMENTE JSON.`;
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: instructions }] }] })
        });

        const data = await response.json();
        let jsonStr = data.candidates[0].content.parts[0].text;
        jsonStr = jsonStr.replace(/```json|```/g, '').trim();
        return JSON.parse(jsonStr);

    } catch (e) {
        const t = FALLBACK_TEMPLATES[Math.floor(Math.random() * FALLBACK_TEMPLATES.length)];
        return { citation: t.citation, message: t.msg, tags: t.tags };
    }
}

module.exports = { generateAIContent };
