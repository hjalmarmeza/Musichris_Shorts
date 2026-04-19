const fetch = require('node-fetch');

async function generateAIContent(songTitle, theologyContext = null, fallbackCitation = "Salmos 23:1") {
    const timestamp = new Date().getTime();
    
    // Configuración de la Pentarquía de Blindaje Gratis (v29.0)
    const providers = [
        { name: 'Gemini', key: process.env.GEMINI_API_KEY, func: generateWithGemini },
        { name: 'Groq', key: process.env.GROQ_API_KEY, func: generateWithGroq },
        { name: 'Mistral', key: process.env.MISTRAL_API_KEY, func: generateWithMistral }
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
                if (!result.citation || result.citation.trim() === "") {
                    result.citation = fallbackCitation;
                }
                return result;
            }
        } catch (e) {
            console.error(`❌ [AI-CASCADE] ${provider.name} falló:`, e.message);
        }
    }

    throw new Error('💥 COLAPSO TOTAL: Ninguna de las 5 APIs de IA respondió. El sistema está ciego.');
}

async function generateWithGemini(title, context, key, ts) {
    const prompt = buildPrompt(title, context, ts);
    const model = "gemini-1.5-flash"; 
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Status ${response.status}: ${errText}`);
    }
    const data = await response.json();
    let text = data.candidates[0].content.parts[0].text;
    return JSON.parse(text.replace(/```json|```/g, '').trim());
}

async function generateWithGroq(title, context, key, ts) {
    const prompt = buildPrompt(title, context, ts);
    const response = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({
            model: "llama-3.1-8b-instant", // Modelo activo y gratuito
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            response_format: { "type": "json_object" }
        })
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Status ${response.status}: ${errText}`);
    }
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
            messages: [{ role: "system", content: "Responde siempre con JSON puro." }, { role: "user", content: prompt }],
            temperature: 0.7,
            response_format: { "type": "json_object" }
        })
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Status ${response.status}: ${errText}`);
    }
    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
}

async function generateWithClaude(title, context, key, ts) {
    const prompt = buildPrompt(title, context, ts);
    const response = await fetch(`https://api.anthropic.com/v1/messages`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json', 
            'x-api-key': key,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: "claude-3-haiku-20240307",
            max_tokens: 512,
            messages: [{ role: "user", content: prompt + "\nIMPORTANTE: Responde UNICAMENTE el objeto JSON." }]
        })
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Status ${response.status}: ${errText}`);
    }
    const data = await response.json();
    let content = data.content[0].text;
    return JSON.parse(content.replace(/```json|```/g, '').trim());
}

async function generateWithMistral(title, context, key, ts) {
    const prompt = buildPrompt(title, context, ts);
    const response = await fetch(`https://api.mistral.ai/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({
            model: "mistral-small-latest",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
        })
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Status ${response.status}: ${errText}`);
    }
    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
}

function buildPrompt(title, context, ts) {
    if (context) {
        return `Misión: ALIENTO Y VIDA REFRESCANTE. 
        Canción: ${title}
        Pasaje: ${context.verse}
        Contexto Teológico Profundo: ${context.context}
        Temática Central: ${context.thematic} (Semilla: ${ts})
        
        Basado en este contexto teológico específico, genera un mensaje JSON que cumpla:
        1. "citation": Exactamente "${context.verse}".
        2. "message": Reflexión de impacto PROFUNDA y HUMANA. Máx. 120 caracteres. 
           PROHIBIDO usar frases genéricas como "Dios tiene paz" o "No temas". 
           Extrae la esencia del "Contexto Teológico" arriba descrito. 
        3. "tags": 3 hashtags de adoración.
        Responde ÚNICAMENTE el objeto JSON puro.`.trim();
    }
    return `Misión: ALIENTO. Canción "${title}". (Ref: ${ts}). Genera JSON con: "citation" (Biblia), "message" (esperanza profunda, máx 120 caracteres, basada en la letra), "tags". SOLO JSON.`;
}

module.exports = { generateAIContent };
// Force new run v27.2
