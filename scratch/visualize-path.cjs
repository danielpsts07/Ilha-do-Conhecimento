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
    const imgData = ctx.getImageData(0, 0, W, H);
    const data = imgData.data;

    // We want to classify dirt, stone, and arch
    // Let's inspect each pixel:
    // If dirt/stone/arch, color it semi-transparent yellow/cyan on top of the original image!
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const r = data[i], g = data[i+1], b = data[i+2];

        // Green check
        const isGreen = (g > r + 8 && g > b + 12) || (g > 105 && r < 115 && b < 105);
        const isDarkGreen = (r < 90 && g < 125 && b < 90);

        // Stone check
        const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
        const isStone = (maxDiff < 32 && r > 110 && r < 215 && g > 115 && g < 215 && b > 125 && b < 225);

        // Dirt check (warm tan/sandy)
        const isDirt = (r > 150 && g > 125 && b > 70 && b < 195 && r >= g - 8 && r > b + 15);
        const isShadowDirt = (r > 110 && g > 90 && b > 55 && b < 155 && r > b + 12);

        const isPath = (!isGreen && !isDarkGreen) && (isStone || isDirt || isShadowDirt);
        if (isPath) {
          // Highlight with red tint
          data[i] = Math.min(255, data[i] + 120);
          data[i+1] = Math.floor(data[i+1] * 0.4);
          data[i+2] = Math.floor(data[i+2] * 0.4);
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    results['fase' + phaseNum] = c.toDataURL('image/png');
  }

  fetch('/result', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(results)
  });
}
run();
</script>
</body>
</html>`;

fs.writeFileSync('scratch/visualize-path.html', html);

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/result') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      const parsed = JSON.parse(body);
      for (let i = 1; i <= 3; i++) {
        const base64Data = parsed['fase' + i].replace(/^data:image\/png;base64,/, '');
        fs.writeFileSync('scratch/visualize-fase' + i + '.png', base64Data, 'base64');
        console.log('Saved scratch/visualize-fase' + i + '.png');
      }
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

server.listen(8096, () => {
  console.log('Server listening on http://localhost:8096');
  spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
    '--headless=new',
    '--disable-gpu',
    'http://localhost:8096/scratch/visualize-path.html'
  ]);
  setTimeout(() => {
    console.log('Timeout');
    process.exit(1);
  }, 12000);
});

