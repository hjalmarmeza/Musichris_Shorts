const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { spawnSync, execSync } = require('child_process');
const puppeteer = require('puppeteer-core');

const FFMPEG_PATH = fs.existsSync('/opt/homebrew/bin/ffmpeg') ? '/opt/homebrew/bin/ffmpeg' : 'ffmpeg';
const FFPROBE_PATH = fs.existsSync('/opt/homebrew/bin/ffprobe') ? '/opt/homebrew/bin/ffprobe' : 'ffprobe';

const CONFIG = {
    tempDir: path.join(__dirname, 'temp'),
    outputDir: path.join(__dirname, 'output'),
    templatePath: path.join(__dirname, 'template.html'),
    logoVideo: path.join(__dirname, 'Logo Hjalmar animado v2.mp4'),
    width: 1080,
    height: 1920,
    fps: 30,
    targetDuration: 30,
    wordDelay: 0.16,
    lineFinishDelay: 0.8,
    startDelay: 0.8,
    complementStartTime: 9.0,
    verseStartTime: 16.0,
    outroStartTime: 22.0
};

function init() {
    [CONFIG.tempDir, CONFIG.outputDir].forEach(d => {
        if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
    });
}

function getVideoDuration(filePath) {
    try {
        const cmd = `"${FFPROBE_PATH}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`;
        return parseFloat(execSync(cmd).toString().trim());
    } catch (e) { return CONFIG.targetDuration; }
}

async function downloadMedia(url, outputPath) {
    if (!url) return null;

    // LIMPIEZA INICIAL: Borrar si ya existe para evitar archivos corruptos viejos
    if (fs.existsSync(outputPath)) {
        try { fs.unlinkSync(outputPath); } catch(e) {}
    }

    console.log(`[DEBUG] Iniciando proceso para: ${url}`);

    // DETECCIÓN INTELIGENTE DE DRIVE
    if (url.includes('drive.google.com') || url.includes('/uc?')) {
        console.log(`[DEBUG] Detectado enlace de Google Drive.`);
        try {
            const urlParts = url.split('?');
            const urlParams = new URLSearchParams(urlParts[1]);
            const fileId = urlParams.get('id');
            
            if (fileId) {
                console.log(`[DEBUG] ID de Drive encontrado: ${fileId}. Usando descarga API...`);
                const { downloadDriveFile } = require('./server/google_connector');
                return await downloadDriveFile(fileId, outputPath);
            } else {
                console.warn(`[DEBUG] No se pudo extraer ID de la URL: ${url}`);
            }
        } catch (e) {
            console.error('[DRIVE-DETECT-ERROR] Error analizando URL:', e.message);
        }
    }
    
    // Support local files
    if (!url.startsWith('http')) {
        if (fs.existsSync(url)) return url;
        return null;
    }

    console.log(`[DOWNLOAD] Usando descarga estándar para: ${url.substring(0, 40)}...`);
    const result = spawnSync('curl', ['-s', '-L', '-f', '-o', outputPath, url]);
    
    if (result.status !== 0) {
        console.error(`[DOWNLOAD-ERROR] Falló curl con status ${result.status}`);
        return null;
    }

    return outputPath;
}

async function generateMasterpieceSequence(row, id) {
    const quote = row.quote || '';
    const complement = row.complement || '';
    const verse = row.verse || '';
    
    const qLines = quote.split(/<br>|\n/).filter(l => l.trim() !== '');
    const cLines = complement ? complement.split(/<br>|\n/).filter(l => l.trim() !== '') : [];
    const overlays = [];
    const browser = await puppeteer.launch({ 
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: require('fs').existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined
    });
    
    try {
        console.log('[PUPPETEER] browser launched, creating page...');
        const page = await browser.newPage();
        console.log('[PUPPETEER] setting viewport...');
        await page.setViewport({ width: CONFIG.width, height: CONFIG.height });
        console.log('[PUPPETEER] Viewport set. PHASE 1 start.');
        
        // PHASE 1: Main Quote
        let currentTime = CONFIG.startDelay;
        let cumulativeQ = "";
        for (let l = 0; l < qLines.length; l++) {
            const words = qLines[l].trim().split(/\s+/);
            const delim = l > 0 ? "<br>" : "";
            for (let w = 0; w < words.length; w++) {
                let frameText = cumulativeQ + delim + words.slice(0, w + 1).join(' ');
                let html = fs.readFileSync(CONFIG.templatePath, 'utf8')
                    .replace('<!-- MODE -->', 'quote')
                    .replace('<!-- CURSOR_CLASS_1 -->', 'cursor')
                    .replace('<!-- Text injected here -->', frameText);
                await page.setContent(html);
                const out = path.join(CONFIG.tempDir, `${id}_q1_${overlays.length}.png`);
                if (l===0 && w===0) console.log('[PUPPETEER] Making first screenshot at:', out);
                await page.screenshot({ path: out, omitBackground: true });
                overlays.push({ path: out, startTime: currentTime });
                currentTime += CONFIG.wordDelay;
            }
            cumulativeQ += delim + words.join(' ');
            currentTime += CONFIG.lineFinishDelay;
        }

        // PHASE 2: Complement
        currentTime = Math.max(currentTime, CONFIG.complementStartTime);
        let cumulativeC = "";
        for (let l = 0; l < cLines.length; l++) {
            const words = cLines[l].trim().split(/\s+/);
            const delim = l > 0 ? "<br>" : "";
            for (let w = 0; w < words.length; w++) {
                let frameText = cumulativeC + delim + words.slice(0, w + 1).join(' ');
                let html = fs.readFileSync(CONFIG.templatePath, 'utf8')
                    .replace('<!-- MODE -->', 'quote with-complement')
                    .replace('<!-- CURSOR_CLASS_2 -->', 'cursor')
                    .replace('<!-- Text injected here -->', cumulativeQ)
                    .replace('<!-- COMPLEMENT_TEXT -->', frameText);
                await page.setContent(html);
                const out = path.join(CONFIG.tempDir, `${id}_q2_${overlays.length}.png`);
                await page.screenshot({ path: out, omitBackground: true });
                overlays.push({ path: out, startTime: currentTime });
                currentTime += CONFIG.wordDelay;
            }
            cumulativeC += delim + words.join(' ');
            currentTime += CONFIG.lineFinishDelay;
        }

        // PHASE 3: Verse
        currentTime = Math.max(currentTime, CONFIG.verseStartTime);
        let htmlVerse = fs.readFileSync(CONFIG.templatePath, 'utf8')
            .replace('<!-- MODE -->', 'quote with-complement quote-verse')
            .replace('<!-- Text injected here -->', cumulativeQ)
            .replace('<!-- COMPLEMENT_TEXT -->', cumulativeC)
            .replace('<!-- BI_VERSE -->', verse || "");
        await page.setContent(htmlVerse);
        const vPath = path.join(CONFIG.tempDir, `${id}_verse.png`);
        await page.screenshot({ path: vPath, omitBackground: true });
        overlays.push({ path: vPath, startTime: currentTime });

        // PHASE 4: Outro (Transparent Hole)
        let htmlOutro = fs.readFileSync(CONFIG.templatePath, 'utf8')
            .replace('<!-- MODE -->', 'outro');
        await page.setContent(htmlOutro);
        const oPath = path.join(CONFIG.tempDir, `${id}_outro.png`);
        await page.screenshot({ path: oPath, omitBackground: true });
        overlays.push({ path: oPath, startTime: CONFIG.outroStartTime });
        
    } finally { await browser.close(); }
    return overlays;
}

async function renderShort(row) {
    const { id, inputVideo } = row;
    const finalPath = path.join(CONFIG.outputDir, `SHORT_MASTERPIECE_ANIMATED_LOGO.mp4`);
    console.log(`\n[ENGINE] 🎬 Rendering with ANIMATED LOGO: ${id}`);

    // Pre-download media
    const localVideoPath = path.join(CONFIG.tempDir, `${id}_bg.mp4`);
    const localAudioPath = path.join(CONFIG.tempDir, `${id}_audio.mp3`);
    
    let videoPath = path.join(__dirname, 'nas_test_video.mp4');
    if (inputVideo && !inputVideo.includes('ug.link')) {
        try {
            const resultVideo = await downloadMedia(inputVideo, localVideoPath);
            if (resultVideo) videoPath = resultVideo;
        } catch(e) { console.error('Error info video:', e); }
    }
    
    let audioPath = path.join(__dirname, 'chorus_cireneo.mp3');
    if (row.audioUrl) {
         try {
            const resultAudio = await downloadMedia(row.audioUrl, localAudioPath);
            if (resultAudio) audioPath = resultAudio;
         } catch(e) { console.error('Error info audio:', e); }
    }

    console.log('[ENGINE] Getting video duration...');
    const originalDuration = getVideoDuration(videoPath);
    console.log('[ENGINE] Generating sequence (Puppeteer)...');
    let frames;
    try {
        frames = await generateMasterpieceSequence(row, id);
        console.log(`[ENGINE] Sequence generated: ${frames.length} frames`);
    } catch (e) {
        console.error('[ENGINE] Puppeteer ERROR:', e);
        throw e;
    }
    
    console.log('[ENGINE] Preparing ffmpeg arguments...');
    const args = ['-y', '-i', videoPath, '-stream_loop', '-1', '-i', audioPath];
    // Input 2: Animated Logo
    args.push('-stream_loop', '-1', '-i', CONFIG.logoVideo);
    // Inputs 3+: Screenshots
    frames.forEach(f => args.push('-loop', '1', '-i', f.path, '-r', CONFIG.fps.toString()));

    const ptsFactor = (CONFIG.targetDuration / originalDuration).toFixed(6);
    let filter = `[0:v]setpts=${ptsFactor}*PTS,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,`;
    filter += `eq=brightness=-0.1:contrast=1.1,vignette=angle=0.5,format=yuv420p[bg];`;
    
    // Process Animated Logo: Scale, Crop to circle
    filter += `[2:v]scale=320:320:force_original_aspect_ratio=increase,crop=320:320,setsar=1[logo_s];`;
    filter += `[logo_s]geq=lum='p(X,Y)':a='if(gt(sqrt(pow(X-160,2)+pow(Y-160,2)),160),0,255)'[logo_final];`;

    let lastV = 'bg';
    frames.forEach((f, i) => {
        const nextTime = (i < frames.length - 1) ? frames[i+1].startTime : CONFIG.targetDuration;
        const currentV = `v${i}`;
        
        // Normal overlay of UI screenshots
        filter += `[${lastV}][${i + 3}:v]overlay=0:0:enable='between(t,${f.startTime.toFixed(2)},${nextTime.toFixed(2)})'`;
        
        // SPECIAL LOGIC: If we are in the Outro Phase, overlay the Animated Logo ABOVE the background but BELOW the UI (or above everything if positioned correctly)
        if (f.startTime >= CONFIG.outroStartTime) {
            // Updated Y from 800 to 630 to align with the template's vertical center
            filter += `[base${i}];[base${i}][logo_final]overlay=380:630:enable='between(t,${f.startTime.toFixed(2)},${nextTime.toFixed(2)})'[${currentV}];`;
        } else {
            filter += `[${currentV}];`;
        }
        lastV = currentV;
    });

    args.push('-filter_complex', filter.slice(0, -1), '-map', `[${lastV}]`, '-map', '1:a');
    args.push('-c:v', 'libx264', '-c:a', 'aac', '-shortest', '-t', CONFIG.targetDuration.toString(), '-pix_fmt', 'yuv420p', '-crf', '18', finalPath);

    console.log('[ENGINE] Running FFMPEG...');
    const result = spawnSync(FFMPEG_PATH, args);
    console.log(`[ENGINE] FFMPEG Finished with status: ${result.status}`);
    
    if (result.status !== 0) {
        console.error(`[ENGINE] FFMPEG Error output:`, result.stderr?.toString());
        throw new Error(`FFMPEG falló con código ${result.status}`);
    }
    console.log(`[SUCCESS] Masterpiece with ANIMATED LOGO generated!`);
}

async function processBatch(f) {
    const res = [];
    return new Promise((r) => {
        fs.createReadStream(f).pipe(csv()).on('data',(d)=>res.push(d))
            .on('end', async ()=>{for(const row of res)await renderShort(row);r();});
    });
}
module.exports = { renderShort, CONFIG, init };

if (require.main === module) {
    (async () => { init(); const f = path.join(__dirname, 'shorts_data.csv'); if(fs.existsSync(f)) await processBatch(f); })();
}
