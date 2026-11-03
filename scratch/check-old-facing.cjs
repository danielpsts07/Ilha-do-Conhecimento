const http = require('http');
const fs = require('fs');
const { spawn } = require('child_process');

const server = http.createServer((req, res) => {
  if (req.url === '/img1') {
    res.writeHead(200, { 'Content-Type': 'image/webp' });
    fs.createReadStream('assets/personagem/menina-diagonais-4x4.webp').pipe(res);
  } else if (req.url === '/report') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      console.log(body);
      res.writeHead(200); res.end('ok');
      server.close(); process.exit(0);
    });
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!DOCTYPE html><html><body><script>
      (async () => {
        const load = url => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = url; });
        const img = await load('/img1');

        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, c.width, c.height).data;

        const cellW = c.width / 4;
        const cellH = c.height / 4;

        const analysis = [];
        for (let r = 0; r < 2; r++) {
          for (let col = 0; col < 4; col++) {
            const x0 = Math.floor(col * cellW);
            const x1 = Math.floor((col + 1) * cellW);
            const y0 = Math.floor(r * cellH);
            const y1 = Math.floor((r + 1) * cellH);

            let totalWeightX = 0, count = 0;
            for (let y = y0 + Math.floor(cellH * 0.05); y < y0 + Math.floor(cellH * 0.45); y++) {
              for (let x = x0; x < x1; x++) {
                if (data[(y * c.width + x) * 4 + 3] > 30) {
                  totalWeightX += x;
                  count++;
                }
              }
            }
            const headCenterX = count ? totalWeightX / count : (x0 + x1) / 2;
            const midX = (x0 + x1) / 2;
            analysis.push({
              row: r, col,
              diffFromCenter: (headCenterX - midX).toFixed(1),
              looksLike: (headCenterX - midX) > 0 ? 'olhando ESQUERDA' : 'olhando DIREITA'
            });
          }
        }

        fetch('/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(analysis, null, 2)
        });
      })();
    </script></body></html>`);
  }
});

server.listen(8094, () => {
  spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--disable-gpu', 'http://localhost:8094']);
});

