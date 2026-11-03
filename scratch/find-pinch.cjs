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

  const name = 'fase1_v3.webp';
  const img = new Image();
  await new Promise(r => { img.onload = r; img.src = '../assets/puzzles/labirinto/' + name; });
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
    const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
    const isStone = (maxDiff < 32 && r > 110 && r < 215 && g > 115 && g < 215 && b > 125 && b < 225);
    const isDirt = (r > 150 && g > 125 && b > 70 && b < 195 && r >= g - 8 && r > b + 15);
    const isShadowDirt = (r > 110 && g > 90 && b > 55 && b < 155 && r > b + 12);
    return (!isGreen && !isDarkGreen) && (isStone || isDirt || isShadowDirt);
  }

  const visited = new Uint8Array(W * H);
  const q = [400 * W + 512];
  visited[400 * W + 512] = 1;
  let head = 0;
  while (head < q.length) {
    const idx = q[head++];
    const cx = idx % W, cy = Math.floor(idx / W);
    for (const n of [cy > 0 ? idx - W : -1, cy < H - 1 ? idx + W : -1, cx > 0 ? idx - 1 : -1, cx < W - 1 ? idx + 1 : -1]) {
      if (n >= 0 && !visited[n] && isPath(n % W, Math.floor(n / W))) {
        visited[n] = 1;
        q.push(n);
      }
    }
  }

  let minX = 1000, maxX = 0, minY = 1000, maxY = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (visited[y * W + x]) {
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      }
    }
  }

  // Find the leftmost boundary of visited around y = 200..260
  const leftEdgeAtY = [];
  for (let y = 180; y <= 300; y += 10) {
    let lx = -1, rx = -1;
    for (let x = 0; x < W; x++) {
      if (visited[y * W + x]) {
        if (lx === -1) lx = x;
        rx = x;
      }
    }
    leftEdgeAtY.push({ y, lx, rx });
  }

  fetch('/result', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ minX, maxX, minY, maxY, leftEdgeAtY }, null, 2)
  });
}
run();
</script>
</body>
</html>`;

fs.writeFileSync('scratch/find-pinch.html', html);

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/result') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      console.log('PINCH_POINT:\n', body);
      res.writeHead(200); res.end('OK'); process.exit(0);
    });
    return;
  }
  let filePath = path.join(__dirname, '..', req.url.split('?')[0]);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) filePath = path.join(filePath, 'index.html');
  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': ext === '.html' ? 'text/html' : 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  }
});

server.listen(8098, () => {
  spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--disable-gpu', 'http://localhost:8098/scratch/find-pinch.html']);
});
