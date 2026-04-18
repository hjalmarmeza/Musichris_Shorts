const fetch = require('node-fetch');

const FALLBACK_TEMPLATES = [
    {
        msg: "La profundidad de '{song}' nos invita a un momento de reflexión y paz interior. Deja que esta melodía renueve tu fe hoy.",
        tags: "#Reflexion #MusicaCristiana #Paz"
    },
    {
        msg: "Descubre la esperanza escondida en cada nota de '{song}'. Un mensaje vital para recordar que no estamos solos en el camino.",
        tags: "#Esperanza #DiosEsBueno #MusiChris"
    },
    {
        msg: "En los acordes de '{song}' encontramos un refugio para el alma cansada. Una pausa necesaria para reconectar con lo eterno.",
        tags: "#Adoracion #Fe #Descanso"
    },
    {
        msg: "A veces una canción dice lo que el corazón calla. '{song}' es ese puente hacia una conversación más profunda con el Creador.",
        tags: "#Corazon #MensajeDeFe #Musica"
    }
];

async function generateAIContent(songTitle) {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const model = "gemini-1.5-flash";
    const prompt = `Actúa como un experto en reflexión espiritual y música. Para la canción titulada "${songTitle}", genera un objeto JSON con:
    1. "title": El título de la canción en mayúsculas.
    2. "message": Una frase inspiracional y profunda (máximo 150 caracteres) que hable sobre la fe, la esperanza o el amor, inspirada en el título.
    3. "tags": 3 hashtags relevantes.
    Responde UNICAMENTE el objeto JSON puro.`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            throw new Error('Respuesta inválida de Gemini');
        }

        let jsonStr = data.candidates[0].content.parts[0].text;
        jsonStr = jsonStr.replace(/```json|```/g, '').trim();
        return JSON.parse(jsonStr);

    } catch (e) {
        console.error(`[AI-BACKUP] Usando Generador Dinámico para: ${songTitle}`);
        
        // Seleccionar una plantilla aleatoria para que no se repitan
        const template = FALLBACK_TEMPLATES[Math.floor(Math.random() * FALLBACK_TEMPLATES.length)];
        
        return {
            title: songTitle.toUpperCase(),
            message: template.msg.replace('{song}', songTitle),
            tags: template.tags
        };
    }
}

module.exports = { generateAIContent };
