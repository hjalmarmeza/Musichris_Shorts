const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

// ==========================================
// YOUTUBE STUDIO UPLOADER (SIMULADOR HUMANO)
// ==========================================

async function uploadToYouTubeStudio(videoPath, title, description, tags) {
    console.log(`\n[PUPPETEER UPLOADER] Iniciando subida de: ${title}`);
    
    // NOTA: Debes usar la ruta a un perfil de Chrome que YA TENGA tu sesión de Google iniciada.
    // Mac Default: /Users/hjalmarmeza/Library/Application Support/Google/Chrome
    // Cambia 'Profile 1' por el perfil que tenga la sesión de Musichris Studio.
    const CHROME_PROFILE_PATH = '/Users/hjalmarmeza/Library/Application Support/Google/Chrome';
    const CHROME_EXEC_PATH = fs.existsSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome') 
        ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' 
        : undefined;

    if (!CHROME_EXEC_PATH) throw new Error("Google Chrome no encontrado en el sistema.");

    const browser = await puppeteer.launch({
        headless: false, // ¡Falso para que veas qué hace! (Puedes cambiar a 'new' luego)
        executablePath: CHROME_EXEC_PATH,
        userDataDir: CHROME_PROFILE_PATH,
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--window-size=1280,800',
            // Usa el perfil específico (ajústalo si es Default o Profile 1)
            // '--profile-directory=Default'
        ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    try {
        console.log('[PUPPETEER UPLOADER] Entrando a YouTube Studio...');
        await page.goto('https://studio.youtube.com/', { waitUntil: 'networkidle2', timeout: 60000 });
        
        // Esperar el botón de CREAR (Ícono de cámara)
        await page.waitForSelector('#create-icon', { timeout: 15000 });
        await page.click('#create-icon');
        
        // Clic en "Subir video"
        await page.waitForSelector('#text-item-0', { timeout: 5000 });
        await page.click('#text-item-0');
        
        // Subir archivo (inyectando la ruta en el input type file oculto)
        console.log(`[PUPPETEER UPLOADER] Inyectando archivo: ${videoPath}`);
        const fileInputSelector = 'input[type="file"][name="Filedata"]';
        await page.waitForSelector(fileInputSelector, { timeout: 10000 });
        
        const absoluteVideoPath = path.resolve(videoPath);
        const fileInput = await page.$(fileInputSelector);
        await fileInput.uploadFile(absoluteVideoPath);
        
        // Esperar a que cargue el editor de detalles
        console.log('[PUPPETEER UPLOADER] Esperando panel de detalles...');
        await page.waitForSelector('#textbox', { timeout: 30000 });
        await new Promise(r => setTimeout(r, 2000)); // Pequeña pausa humana

        // 1. Título
        console.log('[PUPPETEER UPLOADER] Llenando título...');
        const titleBoxes = await page.$$('#textbox');
        if (titleBoxes.length > 0) {
            await titleBoxes[0].click({ clickCount: 3 }); // Seleccionar todo
            await titleBoxes[0].press('Backspace');
            await titleBoxes[0].type(title, { delay: 30 }); // Escribir como humano
        }
        
        // 2. Descripción
        console.log('[PUPPETEER UPLOADER] Llenando descripción...');
        if (titleBoxes.length > 1) {
            await titleBoxes[1].click({ clickCount: 3 });
            await titleBoxes[1].press('Backspace');
            await titleBoxes[1].type(description + '\n\n' + tags, { delay: 10 });
        }
        
        // 3. Check de Niños (No, no es contenido para niños)
        console.log('[PUPPETEER UPLOADER] Marcando restricción de edad...');
        const kidsRadio = 'tp-yt-paper-radio-button[name="VIDEO_MADE_FOR_KIDS_NOT_MFK"]';
        try {
            await page.waitForSelector(kidsRadio, { timeout: 5000 });
            await page.click(kidsRadio);
        } catch(e) { console.log('El check de niños ya estaba seleccionado o no apareció.'); }

        // 4. Siguiente -> Siguiente -> Siguiente
        console.log('[PUPPETEER UPLOADER] Avanzando pestañas...');
        const nextButton = '#next-button';
        for (let i = 0; i < 3; i++) {
            await page.waitForSelector(nextButton, { timeout: 5000 });
            await page.click(nextButton);
            await new Promise(r => setTimeout(r, 1500));
        }

        // 5. Publicación (Opciones de visibilidad)
        console.log('[PUPPETEER UPLOADER] Configurando publicación (Público/Oculto)...');
        // Aquí selecciona 'Público' o 'Oculto' (unlisted) - Selecciono Oculto como tenías en tu script
        const unlistedRadio = 'tp-yt-paper-radio-button[name="UNLISTED"]';
        await page.waitForSelector(unlistedRadio, { timeout: 5000 });
        await page.click(unlistedRadio);

        // 6. Botón Guardar/Publicar final
        console.log('[PUPPETEER UPLOADER] Haciendo clic en GUARDAR...');
        const doneButton = '#done-button';
        await page.waitForSelector(doneButton, { timeout: 5000 });
        await page.click(doneButton);

        // Esperar a que el modal de cierre aparezca (significa que terminó)
        console.log('[PUPPETEER UPLOADER] Esperando confirmación de subida...');
        await page.waitForSelector('ytcp-video-share-dialog', { timeout: 60000 });
        
        console.log('[PUPPETEER UPLOADER] ✅ ¡Video subido con éxito!');

    } catch (error) {
        console.error('[PUPPETEER UPLOADER] ❌ Error durante la subida:', error);
    } finally {
        console.log('[PUPPETEER UPLOADER] Cerrando navegador en 5 segundos...');
        await new Promise(r => setTimeout(r, 5000));
        await browser.close();
    }
}

module.exports = { uploadToYouTubeStudio };
