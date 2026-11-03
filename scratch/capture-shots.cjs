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
  <title>Captura Labirinto</title>
</head>
<body style="margin:0;padding:0;background:#000;overflow:hidden;">
  <script src="../js/config.js"></script>
  <script src="../js/hero-animation.js"></script>
  <script>
    async function captureFlow() {
      const urlParams = new URLSearchParams(window.location.search);
      const phaseToTest = parseInt(urlParams.get('fase') || '0', 10);
      const isDebug = urlParams.get('debug') === '1';

      await window.loadMemoryMaze();
      window.LabirintoPuzzle.open({
        phase: phaseToTest,
        skipMemorize: true, // skip memorization so we see the walking maze with pedestals!
        onExit: () => {}
      });

      if (isDebug) {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'F3', bubbles: true }));
      }

      // Allow 2 frames of rendering
      await new Promise(r => setTimeout(r, 400));

      // Get screenshot from canvas
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

fs.writeFileSync('scratch/capture-maze.html', testHtml);

const shotsToTake = [
  { name: 'shot-maze-fase1-20x9', w: 888, h: 400, fase: 0, debug: 1 },
  { name: 'shot-maze-fase1-16x9', w: 1280, h: 720, fase: 0, debug: 1 },
  { name: 'shot-maze-fase2-16x9', w: 1280, h: 720, fase: 1, debug: 1 },
  { name: 'shot-maze-fase3-16x9', w: 1280, h: 720, fase: 2, debug: 1 },
  { name: 'shot-maze-fase1-16x10-blur', w: 1152, h: 720, fase: 0, debug: 0 },
  { name: 'shot-maze-fase1-4x3-blur', w: 960, h: 720, fase: 0, debug: 0 },
  { name: 'shot-maze-fase2-walking', w: 1280, h: 720, fase: 1, debug: 0 }
];

let currentIndex = 0;

function runNextShot() {
  if (currentIndex >= shotsToTake.length) {
    console.log('ALL SHOTS CAPTURED SUCCESSFULLY!');
    process.exit(0);
  }
  const item = shotsToTake[currentIndex];
  console.log(`Capturing ${item.name} (${item.w}x${item.h}, fase ${item.fase+1})...`);

  const url = `http://localhost:8076/scratch/capture-maze.html?shotName=${item.name}&fase=${item.fase}&debug=${item.debug}`;
  const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
    '--headless=new',
    '--disable-gpu',
    `--window-size=${item.w},${item.h}`,
    url
  ]);

  setTimeout(() => {
    // safety timeout for single shot
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
      console.log(`Saved ${artDir}/${shotName}.png`);
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

server.listen(8076, () => {
  console.log('Capture server running on http://localhost:8076');
  runNextShot();
});

