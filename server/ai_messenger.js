const fetch = require('node-fetch');

async function generateAIContent(songTitle, theologyContext = null) {
    const timestamp = new Date().getTime();
    
    // Configuración de la Cascada
    const providers = [
        { name: 'Gemini', key: process.env.GEMINI_API_KEY, func: generateWithGemini },
        { name: 'Groq', key: process.env.GROQ_API_KEY, func: generateWithGroq },
        { name: 'OpenAI', key: process.env.OPENAI_API_KEY, func: generateWithOpenAI }
    ];

    for (const provider of providers) {
        if (!provider.key) {
            console.warn(`⚠️ Saltando ${provider.name}: API Key no configurada.`);
            continue;
        }

        try {
            console.log(`[AI-CASCADE] Intentando con ${provider.name} para: ${songTitle}...`);
            const result = await provider.func(songTitle, theologyContext, provider.key, timestamp);
            if (result) {
                console.log(`✅ [AI-CASCADE] Mensaje generado con éxito vía ${provider.name}.`);
                return result;
            }
        } catch (e) {
            console.error(`❌ [AI-CASCADE] ${provider.name} falló:`, e.message);
            // Continúa al siguiente proveedor en la lista
        }
    }

    throw new Error('💥 FALLO TOTAL: Ninguna de las APIs de IA respondió. Verifica tus API Keys.');
}

async function generateWithGemini(title, context, key, ts) {
    const prompt = buildPrompt(title, context, ts);
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    if (!response.ok) throw new Error(`Status ${response.status}`);
    const data = await response.json();
    return JSON.parse(data.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim());
}

async function generateWithGroq(title, context, key, ts) {
    const prompt = buildPrompt(title, context, ts);
    const response = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({
            model: "llama3-8b-8192",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
        })
    });
    if (!response.ok) throw new Error(`Status ${response.status}`);
    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
}

async function generateWithOpenAI(title, context, key, ts) {
    const prompt = buildPrompt(title, context, ts);
    const response = await fetch(`https://api.openai.com/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
        })
    });
    if (!response.ok) throw new Error(`Status ${response.status}`);
    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
}

function buildPrompt(title, context, ts) {
    if (context) {
        return `Misión: ALIENTO Y VIDA. Basándote en el versículo "${context.verse}" para la canción "${title}". 
        Genera un JSON con:
        1. "citation": Exactamente "${context.verse}".
        2. "message": Reflexión de impacto (base: ${ts}) de máx. 100 caracteres. Única y fresca.
        3. "tags": 3 hashtags.
        Responde SOLO JSON.`;
    }
    return `Misión: ALIENTO. Canción "${title}". Ref: ${ts}. Genera JSON con: "citation" (Biblia), "message" (esperanza, máx 100 caracteres), "tags". SOLO JSON.`;
}

module.exports = { generateAIContent };
