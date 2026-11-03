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

        // Escalas relativas:
        // img1: cellW = 877 / 4 = 219.25, cellH = 1024 / 4 = 256. SCALE = 0.20
        // img2: cellW = 1024 / 4 = 256, cellH = 606 / 2 = 303. SCALE = 0.20 * (256 / 303) = 0.1689769
        const SCALE1 = 0.20;
        const SCALE2 = 0.20 * (256 / 303);

        const PIVOT_X = 24, PIVOT_Y = 52;
        const FW = 48, FH = 56;

        // Renderiza células da img2 para 48x56 e analisa os pixels
        function renderCell(img, col, row, totalCols, totalRows, scale) {
          const cellW = img.naturalWidth / totalCols;
          const cellH = img.naturalHeight / totalRows;

          const sx = col * cellW;
          const sy = row * cellH;
          const sw = cellW;
          const sh = cellH;

          // Isola a célula
          const tempC = document.createElement('canvas');
          tempC.width = sw;
          tempC.height = sh;
          const tempCtx = tempC.getContext('2d');
          tempCtx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

          // Localiza o pé mais baixo e central dentro da célula
          const tempImgData = tempCtx.getImageData(0, 0, sw, sh).data;
          let footY = 0, feetX = [];
          for (let y = sh - 1; y >= 0; y--) {
            for (let x = 0; x < sw; x++) {
              if (tempImgData[(y * sw + x) * 4 + 3] > 20) {
                if (!footY) footY = y;
                if (y === footY) feetX.push(x);
              }
            }
            if (footY) break;
          }
          const footX = feetX.length ? (feetX[0] + feetX[feetX.length - 1]) / 2 : sw / 2;

          // Renderiza no destino 48x56 com vizinho mais próximo
          const dstC = document.createElement('canvas');
          dstC.width = FW;
          dstC.height = FH;
          const dstCtx = dstC.getContext('2d');
          dstCtx.imageSmoothingEnabled = false;

          const dstX = PIVOT_X - footX * scale;
          const dstY = PIVOT_Y - footY * scale;

          dstCtx.drawImage(tempC, 0, 0, sw, sh, dstX, dstY, sw * scale, sh * scale);

          // Limpa alfa para 1-bit puro
          const dstImgData = dstCtx.getImageData(0, 0, FW, FH);
          const dData = dstImgData.data;
          let minY = FH, maxY = 0, minX = FW, maxX = 0;
          for (let y = 0; y < FH; y++) {
            for (let x = 0; x < FW; x++) {
              const idx = (y * FW + x) * 4;
              if (dData[idx + 3] < 128) {
                dData[idx] = dData[idx + 1] = dData[idx + 2] = dData[idx + 3] = 0;
              } else {
                dData[idx + 3] = 255;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
              }
            }
          }
          dstCtx.putImageData(dstImgData, 0, 0);

          return {
            canvas: dstC,
            minX, maxX, minY, maxY,
            height: maxY - minY + 1,
            width: maxX - minX + 1,
            footY: maxY,
            headTopY: minY
          };
        }

        // Medições:
        // Cima-esquerda (current8 linha 2, coluna 0)
        // Cima-direita (current8 linha 3, coluna 0)
        // Baixo-esquerda nova (img2 linha 0, coluna 0)
        // Baixo-direita nova (img2 linha 1, coluna 0)
        const cellBaixoEsq = renderCell(i2, 0, 0, 4, 2, SCALE2);
        const cellBaixoDir = renderCell(i2, 0, 1, 4, 2, SCALE2);

        // Analisa current8 diretamente
        const c3 = document.createElement('canvas');
        c3.width = i3.naturalWidth;
        c3.height = i3.naturalHeight;
        const ctx3 = c3.getContext('2d');
        ctx3.drawImage(i3, 0, 0);
        const d3 = ctx3.getImageData(0, 0, c3.width, c3.height).data;

        function getMeasure(row, col) {
          let minY = FH, maxY = 0;
          for (let y = 0; y < FH; y++) {
            for (let x = 0; x < FW; x++) {
              const a = d3[((row * FH + y) * c3.width + (col * FW + x)) * 4 + 3];
              if (a > 128) {
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }
            }
          }
          return { headTopY: minY, footY: maxY, height: maxY - minY + 1 };
        }

        const cimaEsq = getMeasure(2, 0);
        const cimaDir = getMeasure(3, 0);

        fetch('/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cimaEsq,
            cimaDir,
            baixoEsqNova: { headTopY: cellBaixoEsq.headTopY, footY: cellBaixoEsq.footY, height: cellBaixoEsq.height },
            baixoDirNova: { headTopY: cellBaixoDir.headTopY, footY: cellBaixoDir.footY, height: cellBaixoDir.height },
            scaleUsed: SCALE2
          }, null, 2)
        });
      })();
    </script></body></html>`);
  }
});

server.listen(8092, () => {
  spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--disable-gpu', 'http://localhost:8092']);
});

