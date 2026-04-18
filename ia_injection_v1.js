const fs = require('fs');
const path = require('path');

// Contenido maestro generado por IA para las primeras canciones
const lyricsLib = {
    cireneo: {
        quote: "Como Simón de Cirene, no temas ayudar a otros a cargar su cruz.",
        complement: "Tu ayuda no solo alivia su carga, sino que revela el amor de Cristo.",
        verse: "Gálatas 6:2"
    },
    alabastro: {
        quote: "Lo más valioso que tienes es tu adoración genuina a los pies del Maestro.",
        complement: "No hay precio muy alto para aquel que nos entregó su vida entera.",
        verse: "Lucas 7:38"
    },
    siete_vueltas: {
        quote: "Tus muros caerán no por fuerza, sino por la obediencia a Su voz.",
        complement: "Sigue caminando con fe, la victoria ya ha sido decretada en los cielos.",
        verse: "Josué 6:20"
    },
    leon_y_cordero: {
        quote: "Aquel que rugió en la victoria es el mismo que se entregó por ti.",
        complement: "El León de Judá es también el Cordero que quitó el pecado del mundo.",
        verse: "Apocalipsis 5:5"
    },
    maranatha: {
        quote: "Mantén tu lámpara encendida, el Amado está a las puertas de Su regreso.",
        complement: "Nuestra esperanza está viva: ¡Ven pronto, Señor Jesús!",
        verse: "Apocalipsis 22:20"
    },
    consumado_es: {
        quote: "La deuda ha sido pagada y el velo se ha rasgado para siempre.",
        complement: "En Su último aliento, Cristo nos dio el regalo de la vida eterna.",
        verse: "Juan 19:30"
    },
    getsemani: {
        quote: "En la entrega total de tu voluntad es donde nace la verdadera gloria.",
        complement: "Como en el huerto, di hoy: 'No se haga mi voluntad, sino la Tuya'.",
        verse: "Lucas 22:42"
    }
};

// ... Inyectando el resto de las 100 canciones con sabiduría ...

Object.keys(lyricsLib).forEach(id => {
    const data = lyricsLib[id];
    const content = `${id.toUpperCase()}
Quote: ${data.quote}
Complement: ${data.complement}
Verse: ${data.verse}
---
Escucha la canción completa en nuestro canal.`;
    fs.writeFileSync(path.join(__dirname, 'letras', `${id}.txt`), content);
});

console.log("¡Inteligencia MusiChris Short Inyectada con Éxito!");
