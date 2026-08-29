const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const path = require('path');

async function uploadToOdysee(videoPath, title, description, tags) {
    console.log(`\n[ODYSEE] Iniciando subida de: ${title}`);
    
    if (!process.env.ODYSEE_USERNAME || !process.env.ODYSEE_PASSWORD) {
        console.warn('[ODYSEE] Credenciales no encontradas. Saltando subida a Odysee.');
        return false;
    }

    const browser = await puppeteer.launch({
        headless: "new",
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--window-size=1280,800'
        ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    try {
        console.log('[ODYSEE] Iniciando sesión...');
        await page.goto('https://odysee.com/$/signin', { waitUntil: 'networkidle2' });
        
        await page.waitForSelector('input[type="email"]', { timeout: 15000 });
        await page.type('input[type="email"]', process.env.ODYSEE_USERNAME, { delay: 30 });
        
        const continueBtn = await page.$('button[type="submit"]');
        if (continueBtn) await continueBtn.click();
        
        await page.waitForSelector('input[type="password"]', { timeout: 10000 });
        await page.type('input[type="password"]', process.env.ODYSEE_PASSWORD, { delay: 30 });
        
        const loginBtn = await page.$('button[type="submit"]');
        if (loginBtn) {
            await Promise.all([
                page.waitForNavigation({ waitUntil: 'networkidle2' }),
                loginBtn.click()
            ]);
        }
        
        console.log('[ODYSEE] Entrando a la página de subida...');
        await page.goto('https://odysee.com/$/upload', { waitUntil: 'networkidle2' });
        
        console.log(`[ODYSEE] Inyectando archivo: ${videoPath}`);
        const fileInputSelector = 'input[type="file"]';
        await page.waitForSelector(fileInputSelector, { timeout: 15000 });
        
        const absoluteVideoPath = path.resolve(videoPath);
        const fileInput = await page.$(fileInputSelector);
        await fileInput.uploadFile(absoluteVideoPath);
        
        console.log('[ODYSEE] Llenando metadatos...');
        // Título
        const titleInput = await page.$('input[name="title"], input[placeholder*="Title"]');
        if (titleInput) {
            await titleInput.click({ clickCount: 3 });
            await titleInput.type(title, { delay: 10 });
        }
        
        // Descripción
        const descInput = await page.$('textarea');
        if (descInput) {
            await descInput.type(description, { delay: 10 });
        }
        
        // Subir
        console.log('[ODYSEE] Haciendo clic en subir/publicar...');
        const submitBtn = await page.$('button[type="submit"], button:has-text("Upload")');
        if (submitBtn) {
            await submitBtn.click();
            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
        }
        
        console.log('[ODYSEE] ✅ ¡Video subido con éxito!');
        return true;
    } catch (error) {
        console.error('[ODYSEE] ❌ Error durante la subida:', error.message);
        return false;
    } finally {
        await browser.close();
    }
}

module.exports = { uploadToOdysee };
