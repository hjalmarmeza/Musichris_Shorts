const fetch = require('node-fetch');

// Plantillas de Respaldo con Citas Bíblicas Reales y Poderosas
const FALLBACK_TEMPLATES = [
    {
        verse: "Porque yo sé los pensamientos que tengo acerca de vosotros, dice Jehová, pensamientos de paz, y no de mal. (Jeremías 29:11)",
        msg: "En cada nota de '{song}' resuena la promesa de que Dios tiene un plan perfecto para tu vida. Déjate guiar por Su paz hoy.",
        tags: "#Fe #Jeremias2911 #MusicaCristiana"
    },
    {
        verse: "Todo lo puedo en Cristo que me fortalece. (Filipenses 4:13)",
        msg: "Al escuchar '{song}', recuerda que no caminas solo. Con Su fuerza, no hay montaña que no puedas escalar.",
        tags: "#Fortaleza #Filipenses413 #Victoria"
    },
    {
        verse: "Jehová es mi pastor; nada me faltará. (Salmo 23:1)",
        msg: "Deja que la melodía de '{song}' sea un refugio para tu alma. Él te guía hacia aguas de reposo y renueva tus fuerzas.",
        tags: "#Salmo23 #PazOriginal #Adoracion"
    },
    {
        verse: "Mas el Dios de toda gracia, que nos llamó a su gloria eterna en Jesucristo, os perfeccione y fortalezca. (1 Pedro 5:10)",
        msg: "La canción '{song}' es un recordatorio de Su gracia infinita. Dios está perfeccionando Su obra maestra en ti.",
        tags: "#Gracia #1Pedro #Esperanza"
    }
];

async function generateAIContent(songTitle, theologyContext = null) {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const model = "gemini-1.5-flash";
    
    let instructions = `Actúa como un pastor y experto en música de adoración. Para la canción "${songTitle}", genera un objeto JSON con:
    1. "title": Título en mayúsculas.
    2. "verse": Una CITA BÍBLICA RELEVANTE (Versículo y Referencia).
    3. "message": Una pequeña reflexión motivadora basada en el versículo (máximo 120 caracteres).
    4. "tags": 3 hashtags bíblicos.
    Responde UNICAMENTE el objeto JSON puro.`;

    // INYECCIÓN DE VERDAD: Si tenemos contexto de la Hoja 4, forzamos a la IA a usarlo
    if (theologyContext) {
        instructions = `Actúa como un pastor y experto en música. El autor de la canción "${songTitle}" la compuso basándose en esta verdad:
        - VERSÍCULO ORIGINAL: ${theologyContext.verse}
        - CONTEXTO BÍBLICO: ${theologyContext.context}
        - TEMÁTICA: ${theologyContext.thematic}

        Genera un objeto JSON con:
        1. "title": "${songTitle.toUpperCase()}".
        2. "verse": "${theologyContext.verse}". (USA EXACTAMENTE ESTE VERSÍCULO)
        3. "message": Una reflexión motivadora que conecte el versículo con la canción (máximo 120 caracteres).
        4. "tags": 3 hashtags basados en la temática "${theologyContext.thematic}".
        Responde UNICAMENTE el objeto JSON puro.`;
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: instructions }] }]
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
        console.error(`[AI-SPIRITUAL-BACKUP] Usando Sabiduría Bíblica para: ${songTitle}`);
        const template = FALLBACK_TEMPLATES[Math.floor(Math.random() * FALLBACK_TEMPLATES.length)];
        return {
            title: songTitle.toUpperCase(),
            verse: template.verse,
            message: template.msg.replace('{song}', songTitle),
            tags: template.tags
        };
    }
}

module.exports = { generateAIContent };
