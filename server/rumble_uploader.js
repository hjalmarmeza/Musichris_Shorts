const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const path = require('path');
const fs = require('fs');

async function uploadToRumble(videoPath, title, description, tags) {
    console.log(`\n[RUMBLE] Iniciando subida de: ${title}`);
    
    if (!process.env.RUMBLE_USERNAME || !process.env.RUMBLE_PASSWORD) {
        console.warn('[RUMBLE] Credenciales no encontradas. Saltando subida a Rumble.');
        return false;
    }

    const browser = await puppeteer.launch({
        headless: "new",
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--window-size=1280,800',
            '--disable-blink-features=AutomationControlled'
        ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    // Set a normal user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');

    try {
        console.log('[RUMBLE] Iniciando sesión...');
        await page.goto('https://rumble.com/login.php', { waitUntil: 'networkidle2' });
        
        // Esperar al input de usuario
        await page.waitForSelector('input[name="user_login_login"]', { timeout: 15000 });
        await page.type('input[name="user_login_login"]', process.env.RUMBLE_USERNAME, { delay: 50 });
        await page.type('input[name="user_login_password"]', process.env.RUMBLE_PASSWORD, { delay: 50 });
        
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2' }),
            page.click('button[type="submit"]')
        ]);
        
        console.log('[RUMBLE] Entrando a la página de subida...');
        await page.goto('https://rumble.com/upload.php', { waitUntil: 'networkidle2' });
        
        // Esperar el input file
        console.log(`[RUMBLE] Inyectando archivo: ${videoPath}`);
        const fileInputSelector = 'input[type="file"]';
        await page.waitForSelector(fileInputSelector, { timeout: 15000 });
        
        const absoluteVideoPath = path.resolve(videoPath);
        const fileInput = await page.$(fileInputSelector);
        await fileInput.uploadFile(absoluteVideoPath);
        
        console.log('[RUMBLE] Llenando metadatos...');
        // Título
        await page.waitForSelector('input[name="title"]', { timeout: 10000 });
        await page.type('input[name="title"]', title, { delay: 30 });
        
        // Descripción
        await page.type('textarea[name="description"]', description, { delay: 10 });
        
        // Tags
        await page.type('input[name="tags"]', tags, { delay: 30 });
        
        // Esperar a que la subida (barra de progreso) llegue al 100%
        console.log('[RUMBLE] Esperando a que el video termine de subir al servidor...');
        await new Promise(r => setTimeout(r, 15000)); // Simular espera prudente para shorts
        
        // Guardar/Upload botón
        // Depende de la interfaz actual, pero normalmente es submit.
        const uploadBtn = await page.$('button[type="submit"]');
        if (uploadBtn) {
            await uploadBtn.click();
            await page.waitForNavigation({ waitUntil: 'networkidle2' });
        }
        
        console.log('[RUMBLE] ✅ ¡Video subido con éxito!');
        return true;
    } catch (error) {
        console.error('[RUMBLE] ❌ Error durante la subida:', error.message);
        return false;
    } finally {
        await browser.close();
    }
}

module.exports = { uploadToRumble };
