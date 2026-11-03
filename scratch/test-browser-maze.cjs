const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const testHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Teste Labirinto</title>
</head>
<body style="margin:0;padding:0;background:#000;">
  <script src="../js/config.js"></script>
  <script src="../js/hero-animation.js"></script>
  <script>
    async function runTest() {
      const logs = [];
      window.console.log = (...args) => { logs.push(args.join(' ')); };
      window.console.warn = (...args) => { logs.push('[WARN] ' + args.join(' ')); };
      window.console.error = (...args) => { logs.push('[ERROR] ' + args.join(' ')); };

      try {
        await window.loadMemoryMaze();
        // Open the puzzle
        window.LabirintoPuzzle.open({
          skipMemorize: false,
          onExit: (won) => {
            logs.push('onExit called: won=' + won);
          }
        });

        // Wait for rendering
        await new Promise(r => setTimeout(r, 600));

        // Send results
        await fetch('/result', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'SUCCESS',
            active: window.LabirintoPuzzle.active,
            logs
          })
        });
      } catch (err) {
        await fetch('/result', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'ERROR',
            error: err.message,
            stack: err.stack,
            logs
          })
        });
      }
    }
    window.addEventListener('load', runTest);
  </script>
</body>
</html>`;

fs.writeFileSync('scratch/test-browser-maze.html', testHtml);

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/result') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      console.log('BROWSER_TEST_RESULT:\n', body);
      res.writeHead(200); res.end('OK'); process.exit(0);
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

server.listen(8077, () => {
  console.log('Server running on http://localhost:8077');
  spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
    '--headless=new',
    '--disable-gpu',
    'http://localhost:8077/scratch/test-browser-maze.html'
  ]);
  setTimeout(() => {
    console.log('Timeout');
    process.exit(1);
  }, 15000);
});
