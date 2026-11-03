const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const server = http.createServer((req, res) => {
  let reqUrl = req.url.split('?')[0];
  if (req.method === 'POST' && reqUrl === '/gameplay-report') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      console.log('GAMEPLAY_REPORT:\n', body);
      res.writeHead(200); res.end('OK'); process.exit(0);
    });
    return;
  }
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

server.listen(8075, () => {
  console.log('Gameplay server on http://localhost:8075');
  const testHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
<iframe id="game" src="http://localhost:8075/index.html" style="width:1280px;height:720px;border:none;"></iframe>
<script>
window.addEventListener('load', async () => {
  const errors = [];
  const logs = [];

  const iframe = document.getElementById('game');
  await new Promise(r => setTimeout(r, 800));

  const win = iframe.contentWindow;
  win.addEventListener('error', e => errors.push(e.message));

  try {
    // 1. Click "Iniciar"
    const startBtn = win.document.getElementById('start-button');
    if (startBtn) startBtn.click();
    await new Promise(r => setTimeout(r, 600));

    // 2. Open Memory Maze (Logic)
    await win.PuzzleScenes.logica();
    await new Promise(r => setTimeout(r, 600));
    logs.push('Labirinto opened, active: ' + win.LabirintoPuzzle.active);

    // 3. Press N (with debug) to advance round
    win.document.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'F3', bubbles: true }));
    await new Promise(r => setTimeout(r, 200));
    win.document.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'n', bubbles: true }));
    await new Promise(r => setTimeout(r, 600));
    logs.push('Advanced round via N');

    // 4. Press Escape to return to island
    win.document.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await new Promise(r => setTimeout(r, 600));
    logs.push('Labirinto closed via Escape, active: ' + win.LabirintoPuzzle.active);

    fetch('/gameplay-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'OK',
        errors,
        logs
      })
    });
  } catch (err) {
    fetch('/gameplay-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'ERROR',
        error: err.message,
        errors,
        logs
      })
    });
  }
});
</script>
</body>
</html>`;
  fs.writeFileSync('scratch/harness.html', testHtml);

  spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
    '--headless=new',
    '--disable-gpu',
    '--window-size=1280,720',
    'http://localhost:8075/scratch/harness.html'
  ]);

  setTimeout(() => {
    console.log('Timeout');
    process.exit(1);
  }, 15000);
});

