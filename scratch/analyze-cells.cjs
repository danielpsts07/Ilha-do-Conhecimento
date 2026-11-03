const http = require('http');
const fs = require('fs');
const { spawn } = require('child_process');

const server = http.createServer((req, res) => {
  if (req.url === '/img1') {
    res.writeHead(200, { 'Content-Type': 'image/webp' });
    fs.createReadStream('assets/personagem/menina-diagonais-4x4.webp').pipe(res);
  } else if (req.url === '/img2') {
    res.writeHead(200, { 'Content-Type': 'image/webp' });
    fs.createReadStream('assets/personagem/menina-baixo-diagonais-4x2.webp').pipe(res);
  } else if (req.url === '/current8') {
    res.writeHead(200, { 'Content-Type': 'image/webp' });
    fs.createReadStream('assets/personagem/menina-diagonal-8.webp').pipe(res);
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
        const i1 = await load('/img1');
        const i2 = await load('/img2');
        const i3 = await load('/current8');

        function analyzeGrid(img, cols, rows) {
          const c = document.createElement('canvas');
          c.width = img.naturalWidth;
          c.height = img.naturalHeight;
          const ctx = c.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const data = ctx.getImageData(0, 0, c.width, c.height).data;

          const cellW = c.width / cols;
          const cellH = c.height / rows;

          const cells = [];
          for (let r = 0; r < rows; r++) {
            for (let col = 0; col < cols; col++) {
              let minX = c.width, maxX = 0, minY = c.height, maxY = 0, count = 0;
              const x0 = Math.floor(col * cellW);
              const x1 = Math.floor((col + 1) * cellW);
              const y0 = Math.floor(r * cellH);
              const y1 = Math.floor((r + 1) * cellH);

              for (let y = y0; y < y1; y++) {
                for (let x = x0; x < x1; x++) {
                  const a = data[(y * c.width + x) * 4 + 3];
                  if (a > 20) {
                    count++;
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                  }
                }
              }

              // Centro dos pés (últimos pixels no maxY)
              const feetPixels = [];
              for (let x = minX; x <= maxX; x++) {
                if (data[(maxY * c.width + x) * 4 + 3] > 20) feetPixels.push(x);
              }
              const footCenterX = feetPixels.length ? (feetPixels[0] + feetPixels[feetPixels.length - 1]) / 2 : (minX + maxX) / 2;

              cells.push({
                row: r, col,
                bounds: { minX, maxX, minY, maxY, w: maxX - minX + 1, h: maxY - minY + 1 },
                foot: { x: footCenterX, y: maxY, relX: footCenterX - x0, relY: maxY - y0 },
                cellBox: { x0, x1, y0, y1, cellW, cellH }
              });
            }
          }
          return { imgW: c.width, imgH: c.height, cellW, cellH, cells };
        }

        const rep1 = analyzeGrid(i1, 4, 4);
        const rep2 = analyzeGrid(i2, 4, 2);
        const rep3 = analyzeGrid(i3, 10, 4);

        fetch('/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            img1_4x4: { w: rep1.imgW, h: rep1.imgH, cellW: rep1.cellW, cellH: rep1.cellH, row0_col0: rep1.cells[0], row2_col0: rep1.cells[8] },
            img2_baixo_4x2: { w: rep2.imgW, h: rep2.imgH, cellW: rep2.cellW, cellH: rep2.cellH, row0_col0: rep2.cells[0], row1_col0: rep2.cells[4] },
            current8: {
              w: rep3.imgW, h: rep3.imgH, cellW: rep3.cellW, cellH: rep3.cellH,
              row0_col0: rep3.cells[0], // baixo-esq
              row1_col0: rep3.cells[10], // baixo-dir
              row2_col0: rep3.cells[20], // cima-esq
              row3_col0: rep3.cells[30]  // cima-dir
            }
          }, null, 2)
        });
      })();
    </script></body></html>`);
  }
});

server.listen(8091, () => {
  spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--disable-gpu', 'http://localhost:8091']);
});

