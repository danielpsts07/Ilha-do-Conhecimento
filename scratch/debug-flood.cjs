const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
<canvas id="c"></canvas>
<script>
async function run() {
  const c = document.getElementById('c');
  const ctx = c.getContext('2d');
  const results = {};

  for (let phaseNum = 1; phaseNum <= 3; phaseNum++) {
    const name = 'fase' + phaseNum + '_v3.webp';
    const img = new Image();
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
      img.src = '../assets/puzzles/labirinto/' + name;
    });

    const W = img.width, H = img.height;
    c.width = W; c.height = H;
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, W, H).data;

    function isPath(x, y) {
      if (x < 1 || x >= W - 1 || y < 1 || y >= H - 1) return false;
      const i = (y * W + x) * 4;
      const r = data[i], g = data[i+1], b = data[i+2];

      const isGreen = (g > r + 8 && g > b + 12) || (g > 105 && r < 115 && b < 105);
      const isDarkGreen = (r < 90 && g < 125 && b < 90);

      // Under horizontal arches (x: 175..245, y: 140..205; x: 795..865, y: 140..205)
      if ((x >= 175 && x <= 245 && y >= 140 && y <= 205) ||
          (x >= 795 && x <= 865 && y >= 140 && y <= 205)) {
        if (!isGreen && !isDarkGreen) return true;
      }
      // Under top arches
      if (phaseNum === 2 && x >= 490 && x <= 550 && y >= 10 && y <= 85) {
        if (!isGreen && !isDarkGreen) return true;
      }
      if (phaseNum === 3 && ((x >= 390 && x <= 460 && y >= 10 && y <= 85) || (x >= 570 && x <= 640 && y >= 10 && y <= 85))) {
        if (!isGreen && !isDarkGreen) return true;
      }

      const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
      const isStone = (maxDiff < 32 && r > 110 && r < 215 && g > 115 && g < 215 && b > 125 && b < 225);
      const isDirt = (r > 150 && g > 125 && b > 70 && b < 195 && r >= g - 8 && r > b + 15);
      const isShadowDirt = (r > 110 && g > 90 && b > 55 && b < 155 && r > b + 12);

      return (!isGreen && !isDarkGreen) && (isStone || isDirt || isShadowDirt);
    }

    // Flood fill from (512, 400)
    const visited = new Uint8Array(W * H);
    const q = [400 * W + 512];
    visited[400 * W + 512] = 1;
    let head = 0;
    while (head < q.length) {
      const idx = q[head++];
      const cx = idx % W;
      const cy = Math.floor(idx / W);
      const neighbors = [
        cy > 0 ? idx - W : -1,
        cy < H - 1 ? idx + W : -1,
        cx > 0 ? idx - 1 : -1,
        cx < W - 1 ? idx + 1 : -1
      ];
      for (const n of neighbors) {
        if (n >= 0 && !visited[n]) {
          const nx = n % W, ny = Math.floor(n / W);
          if (isPath(nx, ny)) {
            visited[n] = 1;
            q.push(n);
          }
        }
      }
    }

    // Targets to check:
    const targets = [
      { name: 'Spawn', x: 512, y: 400 },
      { name: 'Pedestal Esquerdo', x: 369, y: 172 },
      { name: 'Pedestal Direito', x: 661, y: 171 },
      { name: 'Arco Esquerdo', x: 205, y: 170 },
      { name: 'Arco Direito', x: 830, y: 170 },
      { name: 'Saida Extrema Esquerda', x: 20, y: 170 },
      { name: 'Saida Extrema Direita', x: 1000, y: 170 }
    ];
    if (phaseNum === 2) {
      targets.push({ name: 'Pedestal Topo', x: 516, y: 82 });
      targets.push({ name: 'Arco Topo', x: 516, y: 40 });
    }
    if (phaseNum === 3) {
      targets.push({ name: 'Pedestal Topo Esq', x: 429, y: 82 });
      targets.push({ name: 'Pedestal Topo Dir', x: 602, y: 82 });
      targets.push({ name: 'Arco Topo Esq', x: 420, y: 40 });
      targets.push({ name: 'Arco Topo Dir', x: 604, y: 40 });
    }

    const report = targets.map(t => ({
      name: t.name,
      x: t.x,
      y: t.y,
      isPath: isPath(t.x, t.y),
      visited: Boolean(visited[t.y * W + t.x])
    }));

    results['fase' + phaseNum] = {
      totalVisited: q.length,
      report
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
</html>`;

fs.writeFileSync('scratch/debug-flood.html', html);

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/result') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      console.log('DEBUG_FLOOD:\n', body);
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

server.listen(8097, () => {
  console.log('Server listening on http://localhost:8097');
  spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
    '--headless=new',
    '--disable-gpu',
    'http://localhost:8097/scratch/debug-flood.html'
  ]);
  setTimeout(() => {
    console.log('Timeout');
    process.exit(1);
  }, 12000);
});

