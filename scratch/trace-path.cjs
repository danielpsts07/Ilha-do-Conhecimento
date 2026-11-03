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

  const name = 'fase1_v3.webp';
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

  // Let's sample every 32px in X: find where path exists in Y
  const slices = [];
  for (let x = 50; x < c.width; x += 30) {
    const yList = [];
    for (let y = 0; y < c.height; y++) {
      const idx = (y * c.width + x) * 4;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      // Check for dirt color:
      // In WebP images, let's see actual RGB values of dirt
      const isDirt = (r > 160 && g > 135 && b > 85 && r > b + 25 && g > b + 10 && g < r + 15);
      const diff = Math.max(Math.abs(r-g), Math.abs(g-b), Math.abs(r-b));
      const isStone = (diff < 28 && r > 120 && r < 200 && g > 125 && g < 200 && b > 135 && b < 210);
      if (isDirt || isStone) {
        yList.push(y);
      }
    }
    if (yList.length > 0) {
      slices.push({
        x,
        minY: Math.min(...yList),
        maxY: Math.max(...yList),
        span: Math.max(...yList) - Math.min(...yList),
        count: yList.length
      });
    } else {
      slices.push({ x, none: true });
    }
  }

  fetch('/result', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(slices, null, 2)
  });
}
run();
</script>
</body>
</html>`;

fs.writeFileSync('scratch/trace-path.html', html);

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/result') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      console.log('TRACE_PATH:\n', body);
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

server.listen(8094, () => {
  console.log('Server listening on http://localhost:8094');
  spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
    '--headless=new',
    '--disable-gpu',
    'http://localhost:8094/scratch/trace-path.html'
  ]);
  setTimeout(() => {
    console.log('Timeout');
    process.exit(1);
  }, 10000);
});

