const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const artDir = 'C:/Users/gpjac/.gemini/antigravity/brain/8f76a54d-2cb1-4716-aac0-2a47eab4da56';

const testHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Captura Câmara da Chave</title>
</head>
<body style="margin:0;padding:0;background:#000;overflow:hidden;">
  <script src="../js/config.js"></script>
  <script src="../js/hero-animation.js"></script>
  <script>
    async function captureFlow() {
      const urlParams = new URLSearchParams(window.location.search);
      const isDebug = urlParams.get('debug') === '1';
      const action = urlParams.get('action') || 'idle';

      await window.loadMemoryMaze();
      window.LabirintoPuzzle.open({
        phase: 3, // Câmara da chave
        onExit: () => {}
      });

      if (isDebug) {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'F3', bubbles: true }));
      }

      if (action === 'collect') {
        // Walk towards key or press E / N
        await new Promise(r => setTimeout(r, 200));
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'N', bubbles: true }));
      } else if (action === 'portal') {
        await new Promise(r => setTimeout(r, 200));
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'N', bubbles: true }));
        await new Promise(r => setTimeout(r, 1200)); // wait until walking towards portal
      }

      // Allow rendering
      await new Promise(r => setTimeout(r, 500));

      const cv = document.querySelector('canvas');
      const dataUrl = cv ? cv.toDataURL('image/png') : '';

      fetch('/save-shot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shotName: urlParams.get('shotName'),
          dataUrl
        })
      });
    }
    window.addEventListener('load', captureFlow);
  </script>
</body>
</html>`;

fs.writeFileSync('scratch/capture-camara.html', testHtml);

const shotsToTake = [
  { name: 'shot-camara-16x9', w: 1920, h: 1080, debug: 0, action: 'idle' },
  { name: 'shot-camara-16x9-debug', w: 1920, h: 1080, debug: 1, action: 'idle' },
  { name: 'shot-camara-20x9-mobile', w: 844, h: 390, debug: 0, action: 'idle' },
  { name: 'shot-camara-4x3-blur', w: 1024, h: 768, debug: 0, action: 'idle' },
  { name: 'shot-camara-collecting', w: 1280, h: 720, debug: 0, action: 'collect' },
  { name: 'shot-camara-portal', w: 1280, h: 720, debug: 0, action: 'portal' }
];

let currentIndex = 0;
let currentProc = null;

function runNextShot() {
  if (currentProc) {
    try { currentProc.kill(); } catch (e) {}
    currentProc = null;
  }
  if (currentIndex >= shotsToTake.length) {
    console.log('ALL CAMARA SHOTS CAPTURED SUCCESSFULLY!');
    process.exit(0);
  }
  const item = shotsToTake[currentIndex];
  console.log(`Capturing ${item.name} (${item.w}x${item.h})...`);

  const url = `http://localhost:8078/scratch/capture-camara.html?shotName=${item.name}&debug=${item.debug}&action=${item.action}`;
  currentProc = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
    '--headless=new',
    '--disable-gpu',
    `--window-size=${item.w},${item.h}`,
    url
  ]);

  setTimeout(() => {
    if (currentIndex < shotsToTake.length && shotsToTake[currentIndex].name === item.name) {
      console.log(`Timeout on ${item.name}, moving next...`);
      currentIndex++;
      runNextShot();
    }
  }, 10000);
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/save-shot') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      const { shotName, dataUrl } = JSON.parse(body);
      const b64 = dataUrl.replace(/^data:image\/png;base64,/, '');
      fs.writeFileSync(`${artDir}/${shotName}.png`, b64, 'base64');
      console.log(`Saved ${artDir}/${shotName}.png (size: ${Math.round(b64.length * 0.75)} bytes)`);
      res.writeHead(200); res.end('OK');
      currentIndex++;
      runNextShot();
    });
    return;
  }
  let reqUrl = req.url.split('?')[0];
  if (reqUrl.includes('data/labirinto.json')) reqUrl = '/data/labirinto.json';
  if (reqUrl.includes('/js/')) reqUrl = '/js/' + reqUrl.split('/js/')[1];
  if (reqUrl.includes('/assets/')) reqUrl = '/assets/' + reqUrl.split('/assets/')[1];
  let filePath = path.join(__dirname, '..', reqUrl);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) filePath = path.join(filePath, 'index.html');
  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath);
    const mime = ext === '.html' ? 'text/html' : ext === '.js' ? 'text/javascript' : ext === '.json' ? 'application/json' : ext === '.webp' ? 'image/webp' : ext === '.png' ? 'image/png' : 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404); res.end('Not found');
  }
});

server.listen(8078, () => {
  console.log('Camara capture server running on http://localhost:8078');
  runNextShot();
});

