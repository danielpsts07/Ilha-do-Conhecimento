const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const files = [
  'botao-interagir.webp',
  'joystick-base.webp',
  'joystick-manche.webp',
  'seta-baixo.webp',
  'seta-cima.webp',
  'seta-direita.webp',
  'seta-esquerda.webp',
  'setas-completo.webp'
];

const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
<canvas id="c"></canvas>
<script>
async function analyze() {
  const c = document.getElementById('c');
  const ctx = c.getContext('2d', { willReadFrequently: true });
  const results = [];

  for (const filename of ${JSON.stringify(files)}) {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = '/assets/hud/controles/' + filename;
    });

    const W = img.width;
    const H = img.height;
    c.width = W;
    c.height = H;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(img, 0, 0);

    const imgData = ctx.getImageData(0, 0, W, H);
    const data = imgData.data;

    // Check corners: top-left, top-right, bottom-left, bottom-right
    const corners = [
      { name: 'top-left', x: 0, y: 0 },
      { name: 'top-right', x: W - 1, y: 0 },
      { name: 'bottom-left', x: 0, y: H - 1 },
      { name: 'bottom-right', x: W - 1, y: H - 1 }
    ].map(pt => {
      const idx = (pt.y * W + pt.x) * 4;
      return { ...pt, r: data[idx], g: data[idx+1], b: data[idx+2], a: data[idx+3] };
    });

    // Check for green fringe: pixels with alpha > 0 where G is significantly higher than R and B
    // Typical green screen fringe: g > 80, g > r * 1.4, g > b * 1.4
    let greenFringeCount = 0;
    const sampleGreenPixels = [];

    // Also count transparent pixels and total pixels
    let transparentCount = 0;
    let semitransparentCount = 0;
    let opaqueCount = 0;

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const idx = (y * W + x) * 4;
        const r = data[idx];
        const g = data[idx+1];
        const b = data[idx+2];
        const a = data[idx+3];

        if (a === 0) {
          transparentCount++;
        } else if (a < 255) {
          semitransparentCount++;
          // check if semitransparent edge is greenish
          if (g > 60 && g > r + 30 && g > b + 30) {
            greenFringeCount++;
            if (sampleGreenPixels.length < 5) {
              sampleGreenPixels.push({ x, y, r, g, b, a });
            }
          }
        } else {
          opaqueCount++;
          // if this is an edge or near transparent pixel with green spill
          // let's check if the art itself has green (e.g. arrow colors, button colors)
        }
      }
    }

    results.push({
      filename,
      width: W,
      height: H,
      corners,
      transparentCount,
      semitransparentCount,
      opaqueCount,
      greenFringeCount,
      sampleGreenPixels
    });
  }

  fetch('/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(results)
  });
}
analyze();
</script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  } else if (req.url.startsWith('/assets/hud/controles/')) {
    const filename = req.url.replace('/assets/hud/controles/', '');
    const filePath = path.join(__dirname, '..', 'assets', 'hud', 'controles', filename);
    if (fs.existsSync(filePath)) {
      res.writeHead(200, { 'Content-Type': 'image/webp' });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  } else if (req.url === '/report' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const results = JSON.parse(body);
      console.log('=== RELATÓRIO DE INSPEÇÃO DOS NOVOS ASSETS ===');
      results.forEach(r => {
        console.log(`\nArquivo: ${r.filename}`);
        console.log(`  Dimensões: ${r.width} × ${r.height} px`);
        console.log(`  Cantos (alpha): TL=${r.corners[0].a}, TR=${r.corners[1].a}, BL=${r.corners[2].a}, BR=${r.corners[3].a}`);
        console.log(`  Pixels: Transparentes=${r.transparentCount}, Semitransparentes=${r.semitransparentCount}, Opacos=${r.opaqueCount}`);
        console.log(`  Fiapo verde detectado em bordas: ${r.greenFringeCount}`);
        if (r.sampleGreenPixels.length > 0) {
          console.log(`  Amostras verdes:`, JSON.stringify(r.sampleGreenPixels));
        }
      });
      res.writeHead(200);
      res.end('OK');
      process.exit(0);
    });
  }
});

server.listen(8999, () => {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    'http://localhost:8999/'
  ]);
  setTimeout(() => {
    console.error('Timeout waiting for inspection');
    process.exit(1);
  }, 10000);
});

