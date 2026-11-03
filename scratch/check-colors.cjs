const http = require('http');
const fs = require('fs');
const { spawn } = require('child_process');

const html = `<!DOCTYPE html><html><body><canvas id="c"></canvas><script>
const img = new Image();
img.onload = () => {
  const c = document.getElementById("c");
  c.width = img.width; c.height = img.height;
  const ctx = c.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(0, 0, img.width, img.height).data;
  const colors = {};
  for (let i = 0; i < d.length; i += 4) {
    if (d[i+3] > 0) {
      const k = d[i] + "," + d[i+1] + "," + d[i+2];
      colors[k] = (colors[k] || 0) + 1;
    }
  }
  const sorted = Object.entries(colors).sort((a,b) => b[1] - a[1]).slice(0, 10);
  fetch("/report", { method: "POST", body: JSON.stringify(sorted) });
};
img.src = "/assets/hud/controles/seta-cima.webp";
</script></body></html>`;

const s = http.createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(html);
  } else if (req.url === '/assets/hud/controles/seta-cima.webp') {
    res.writeHead(200, {'Content-Type': 'image/webp'});
    fs.createReadStream('assets/hud/controles/seta-cima.webp').pipe(res);
  } else if (req.url === '/report') {
    let b = '';
    req.on('data', c => b += c);
    req.on('end', () => {
      console.log('Colors in seta-cima:', b);
      res.end('ok');
      process.exit(0);
    });
  }
});
s.listen(9001, () => {
  spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new', '--disable-gpu', '--no-sandbox', 'http://localhost:9001/'
  ]);
});

