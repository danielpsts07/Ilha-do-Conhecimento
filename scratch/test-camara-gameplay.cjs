const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const root = path.resolve(__dirname, '..');
const artDir = 'C:/Users/gpjac/.gemini/antigravity/brain/8f76a54d-2cb1-4716-aac0-2a47eab4da56';

const testHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Teste Gameplay Câmara</title>
</head>
<body style="margin:0;padding:0;background:#000;overflow:hidden;">
  <script src="../js/config.js"></script>
  <script src="../js/hero-animation.js"></script>
  <script>
    async function runFullTest() {
      const logs = [];
      const steps = [];

      let exitWon = null;
      await window.loadMemoryMaze();
      window.LabirintoPuzzle.open({
        phase: 3,
        onExit: (won) => {
          exitWon = won;
          logs.push('onExit called with won=' + won);
        }
      });

      // 1. Initial State Check
      await new Promise(r => setTimeout(r, 200));
      steps.push({ step: 'init', active: window.LabirintoPuzzle.active });

      // 2. Walk towards the central disc (Hold ArrowUp)
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      // Wait while walking up (speed is 220 px/s, distance from 412 to 240 is 172 px -> ~800ms)
      await new Promise(r => setTimeout(r, 900));
      document.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp', bubbles: true }));

      // Take screenshot while at the central disc or collecting
      const cv = document.querySelector('canvas');
      const shotCollecting = cv ? cv.toDataURL('image/png') : '';

      // 3. Wait for auto-collect and portal walk (approx 2.5 seconds total)
      await new Promise(r => setTimeout(r, 2200));

      const shotPortal = cv ? cv.toDataURL('image/png') : '';

      // 4. Wait for exit transition (entrance + white fade = 1.0s)
      await new Promise(r => setTimeout(r, 1200));

      fetch('/test-done', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exitWon,
          logs,
          steps,
          shotCollecting,
          shotPortal
        })
      });
    }
    window.addEventListener('load', runFullTest);
  </script>
</body>
</html>`;

fs.writeFileSync('scratch/test-camara-gameplay.html', testHtml);

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/test-done') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      const result = JSON.parse(body);
      console.log('=== RESULTADO DO TESTE DE GAMEPLAY ===');
      console.log('exitWon:', result.exitWon);
      console.log('logs:', result.logs);
      console.log('steps:', result.steps);

      if (result.shotCollecting) {
        const b64 = result.shotCollecting.replace(/^data:image\/png;base64,/, '');
        fs.writeFileSync(`${artDir}/shot-camara-walked-key.png`, b64, 'base64');
        console.log('Saved shot-camara-walked-key.png');
      }
      if (result.shotPortal) {
        const b64 = result.shotPortal.replace(/^data:image\/png;base64,/, '');
        fs.writeFileSync(`${artDir}/shot-camara-walked-portal.png`, b64, 'base64');
        console.log('Saved shot-camara-walked-portal.png');
      }

      res.writeHead(200); res.end('OK');
      setTimeout(() => {
        server.close();
        process.exit(result.exitWon === true ? 0 : 1);
      }, 500);
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

server.listen(8081, () => {
  console.log('Gameplay server running on http://localhost:8081');
  spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
    '--headless=new',
    '--disable-gpu',
    '--window-size=1280,720',
    'http://localhost:8081/scratch/test-camara-gameplay.html'
  ]);
});

