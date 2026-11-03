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
  } else if (req.url === '/img-current-8') {
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
        const i3 = await load('/img-current-8');
        fetch('/report', {
          method: 'POST',
          body: JSON.stringify({
            img1_4x4: { w: i1.naturalWidth, h: i1.naturalHeight },
            img2_baixo_4x2: { w: i2.naturalWidth, h: i2.naturalHeight },
            current_diag_8: { w: i3.naturalWidth, h: i3.naturalHeight }
          }, null, 2)
        });
      })();
    </script></body></html>`);
  }
});

server.listen(8089, () => {
  spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--disable-gpu', 'http://localhost:8089']);
});

