const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
    try {
        const browser = await puppeteer.launch({
            executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            headless: 'new',
            args: ['--no-sandbox', '--disable-web-security']
        });
        const page = await browser.newPage();
        
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', err => console.log('PAGE ERROR STACK:', err.stack));
        
        await page.goto('file:///Users/hjalmarmeza/Downloads/Antigravity/PROYECTOS_FINALIZADOS/Musichris_Shorts/dashboard/index.html', {waitUntil: 'networkidle0'});
        
        await browser.close();
    } catch (e) {
        console.error(e);
    }
})();
