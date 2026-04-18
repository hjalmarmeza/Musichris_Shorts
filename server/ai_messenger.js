const fetch = require('node-fetch');

const FALLBACK_TEMPLATES = [
    {
        citation: "Jeremías 29:11",
        msg: "En cada nota de '{song}' resuena la promesa de que Dios tiene un plan de paz para tu vida.",
        tags: "#Fe #MusiChris #Worship"
    },
    {
        citation: "Filipenses 4:13",
        msg: "Al escuchar '{song}', recuerda que no caminas solo. Su fuerza es tu motor hoy.",
        tags: "#Fortaleza #Victoria #Cristo"
    },
    {
        citation: "Salmo 23:1",
        msg: "Deja que la melodía de '{song}' sea un refugio. Él te guía hacia aguas de reposo.",
        tags: "#Paz #Salmo23 #Adoracion"
    }
];

async function generateAIContent(songTitle, theologyContext = null) {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const model = "gemini-1.5-flash";
    
    let instructions = `Para la canción "${songTitle}", genera un JSON con:
    1. "citation": Solo la referencia bíblica corta (Libro Capítulo:Versículo).
    2. "message": Una frase motivadora muy breve (máximo 100 caracteres).
    3. "tags": 3 hashtags.
    Responde UNICAMENTE JSON.`;

    if (theologyContext) {
        instructions = `El autor compuso "${songTitle}" basado en: ${theologyContext.verse}.
        Genera JSON con:
        1. "citation": La referencia bíblica de ese verso (ej: Juan 3:16).
        2. "message": Una reflexión breve sobre ese verso y la canción (máximo 100 caracteres).
        3. "tags": 3 hashtags.
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
        return { citation: t.citation, message: t.msg.replace('{song}', songTitle), tags: t.tags };
    }
}

module.exports = { generateAIContent };
