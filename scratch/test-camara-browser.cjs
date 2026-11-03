const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const root = path.resolve(__dirname, '..');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];
  if (urlPath === '/report-test') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      console.log('BROWSER TEST REPORT:', body);
      res.writeHead(200);
      res.end('ok');
    });
    return;
  }

  let filePath = path.join(root, urlPath === '/' ? 'index.html' : urlPath);
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

const PORT = 8092;
server.listen(PORT, async () => {
  console.log(`Server listening on http://localhost:${PORT}`);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  // Helper to run Chrome screenshot or inspection
  function runChrome(url, width, height, screenshotPath) {
    return new Promise((resolve, reject) => {
      const args = [
        '--headless=new',
        '--disable-gpu',
        `--window-size=${width},${height}`,
        `--screenshot=${screenshotPath}`,
        url
      ];
      const proc = spawn(chromePath, args);
      proc.on('close', code => {
        if (code === 0) resolve();
        else reject(new Error(`Chrome exited with code ${code}`));
      });
      proc.on('error', reject);
    });
  }

  // Create test harness HTML
  const testHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Teste Câmara da Chave</title>
  <style>
    body, html { margin:0; padding:0; width:100%; height:100%; overflow:hidden; background:#000; }
  </style>
</head>
<body>
  <script src="/js/config.js"></script>
  <script src="/js/labirinto-mascaras.js"></script>
  <script src="/js/labirinto-logica.js"></script>
  <script src="/js/hero-animation.js"></script>
  <script src="/js/labirinto-puzzle.js"></script>
  <script>
    async function start() {
      const data = LABIRINTO_LOCAL;
      await window.LabirintoPuzzle.prepare(data);
      console.log('Prepare finished');

      let exitWon = null;
      window.LabirintoPuzzle.open({
        phase: 3,
        debug: () => location.search.includes('debug'),
        onExit: (won) => {
          exitWon = won;
          console.log('onExit called with:', won);
        }
      });

      // Report test metrics after 1 second
      setTimeout(() => {
        const canvas = document.querySelector('canvas');
        const report = {
          canvasW: canvas?.width,
          canvasH: canvas?.height,
          active: window.LabirintoPuzzle.active,
          bodyHtml: document.body.innerHTML.length
        };
        fetch('/report-test', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify(report)
        });
      }, 1000);
    }
    window.onload = start;
  </script>
</body>
</html>`;

  fs.writeFileSync(path.join(root, 'scratch/test-camara.html'), testHtml, 'utf8');

  try {
    // 1. Screenshot 1920x1080 (16:9 Desktop - testing 2x texture)
    console.log('Capturing 1920x1080...');
    await runChrome(`http://localhost:${PORT}/scratch/test-camara.html`, 1920, 1080, path.join(__dirname, 'shot-camara-1920x1080.png'));
    console.log('Saved shot-camara-1920x1080.png');

    // 2. Screenshot 1920x1080 with F3 debug overlay
    console.log('Capturing 1920x1080 with debug...');
    await runChrome(`http://localhost:${PORT}/scratch/test-camara.html?debug=1`, 1920, 1080, path.join(__dirname, 'shot-camara-debug-1920x1080.png'));
    console.log('Saved shot-camara-debug-1920x1080.png');

    // 3. Screenshot 844x390 (Mobile Landscape ~20:9)
    console.log('Capturing 844x390...');
    await runChrome(`http://localhost:${PORT}/scratch/test-camara.html`, 844, 390, path.join(__dirname, 'shot-camara-844x390.png'));
    console.log('Saved shot-camara-844x390.png');

    // 4. Screenshot 1024x768 (4:3 - testing blur fallback padding)
    console.log('Capturing 1024x768 (4:3)...');
    await runChrome(`http://localhost:${PORT}/scratch/test-camara.html`, 1024, 768, path.join(__dirname, 'shot-camara-1024x768.png'));
    console.log('Saved shot-camara-1024x768.png');

    console.log('ALL SCREENSHOTS CAPTURED SUCCESSFULLY!');
  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    server.close();
    process.exit(0);
  }
});

