const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Script to analyze arches, paths, and spawn
const analyzeHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
<canvas id="c"></canvas>
<script>
async function run() {
  const c = document.getElementById('c');
  const ctx = c.getContext('2d');
  const results = {};

  const images = ['fase1_v3.webp', 'fase2_v3.webp', 'fase3_v3.webp'];
  for (const name of images) {
    const img = new Image();
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
      img.src = '../assets/puzzles/labirinto/' + name;
    });
    c.width = img.width;
    c.height = img.height;
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, c.width, c.height).data;

    // Detect path color:
    // Path is yellowish/tan dirt: R: 200-245, G: 175-225, B: 115-180
    // Check horizontal scanline at y = 180 (middle of east-west corridor)
    // and vertical scanline at x = 512 (middle of north-south entrance)
    
    // Bottom entrance path:
    // Scan at y = 430, 400, 350
    const entranceXs = [];
    for (let x = 0; x < c.width; x++) {
      const idx = (410 * c.width + x) * 4;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      // dirt path: R > 180, G > 160, B between 100 and 180, R > B + 30
      if (r > 180 && g > 155 && b > 100 && b < 185 && r > b + 25) {
        entranceXs.push(x);
      }
    }
    const entranceMinX = Math.min(...entranceXs);
    const entranceMaxX = Math.max(...entranceXs);
    const entranceCenter = (entranceMinX + entranceMaxX) / 2;

    // Detect arches:
    // Arches are brown wood/brick structures with green ivy vines.
    // Left arch: located between left edge and left pedestal (x ~ 150-250, y ~ 100-230)
    // Right arch: located between right pedestal and right edge (x ~ 780-880, y ~ 100-230)
    // Top arches: located near top edge (y ~ 10-60)

    // Let's find the exact bounding boxes of the arch structures by searching for arch pillars/top
    // Arch wooden brown: R ~ 110-160, G ~ 70-110, B ~ 40-75 (brown wood)
    function findArchInBox(x1, y1, x2, y2) {
      const archPixels = [];
      for (let y = y1; y <= y2; y++) {
        for (let x = x1; x <= x2; x++) {
          const idx = (y * c.width + x) * 4;
          const r = data[idx], g = data[idx+1], b = data[idx+2];
          // Brown wood or grey arch base
          const isBrown = (r > 100 && r < 180 && g > 60 && g < 130 && b > 35 && b < 100 && r > g + 20);
          const isArchStone = (r > 90 && r < 150 && g > 90 && g < 150 && b > 90 && b < 160 && Math.abs(r-g)<20);
          if (isBrown || isArchStone) {
            archPixels.push({ x, y });
          }
        }
      }
      if (archPixels.length === 0) return null;
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const p of archPixels) {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      }
      return { minX, maxX, minY, maxY, centerX: (minX + maxX)/2, centerY: (minY + maxY)/2, count: archPixels.length };
    }

    const archLeft = findArchInBox(150, 80, 260, 220);
    const archRight = findArchInBox(780, 80, 880, 220);
    const archTop = findArchInBox(450, 0, 580, 100);
    const archTopLeft = findArchInBox(350, 0, 480, 100);
    const archTopRight = findArchInBox(540, 0, 670, 100);

    results[name] = {
      entrance: { minX: entranceMinX, maxX: entranceMaxX, centerX: entranceCenter },
      archLeft,
      archRight,
      archTop,
      archTopLeft,
      archTopRight
    };
  }

  fetch('/result', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(results, null, 2)
  });
}
run();
</script>
</body>
</html>
`;

fs.writeFileSync('scratch/analyze-arches.html', analyzeHtml);

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/result') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      console.log('ARCH_RESULTS:\n', body);
      res.writeHead(200);
      res.end('OK');
      process.exit(0);
    });
    return;
  }
  let filePath = path.join(__dirname, '..', req.url.split('?')[0]);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }
  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath);
    const mime = ext === '.html' ? 'text/html' : ext === '.js' ? 'text/javascript' : ext === '.webp' ? 'image/webp' : 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(8090, () => {
  console.log('Server listening on http://localhost:8090');
  spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
    '--headless=new',
    '--disable-gpu',
    'http://localhost:8090/scratch/analyze-arches.html'
  ]);
  setTimeout(() => {
    console.log('Timeout');
    process.exit(1);
  }, 10000);
});

