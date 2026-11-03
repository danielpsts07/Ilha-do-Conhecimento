const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const artifactDir = 'C:\\Users\\gpjac\\.gemini\\antigravity\\brain\\8f76a54d-2cb1-4716-aac0-2a47eab4da56';

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.json': 'application/json'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(rootDir, reqPath);

  if (req.url === '/report' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      const data = JSON.parse(body);
      console.log(`\n==================================================`);
      console.log(`RESOLUÇÃO: ${data.res}`);
      console.log(`  D-Pad:`);
      console.log(`    Dimensões container: ${data.dpad.w} × ${data.dpad.h} px`);
      console.log(`    Ocupação vertical: ${data.dpad.pctHeight}% da altura da tela (limite ~25%)`);
      console.log(`    Tamanho de cada botão: ${data.dpad.btnW} × ${data.dpad.btnH} px (alvo de toque ≥ 48px)`);
      console.log(`    Posição: left=${data.dpad.left}px, bottom=${data.dpad.bottom}px`);
      console.log(`  Joystick:`);
      console.log(`    Dimensões container: ${data.joystick.w} × ${data.joystick.h} px`);
      console.log(`    Ocupação vertical: ${data.joystick.pctHeight}% da altura da tela`);
      console.log(`    Base: ${data.joystick.baseW} × ${data.joystick.baseH} px`);
      console.log(`    Manche: ${data.joystick.stickW} × ${data.joystick.stickH} px`);
      console.log(`    Proporção Manche / Base: ${data.joystick.ratio}% (alvo ~48%)`);
      console.log(`  Botão Interagir:`);
      console.log(`    Dimensões: ${data.interact.w} × ${data.interact.h} px (alvo de toque ≥ 56px, limite 64 a 80px)`);
      console.log(`    Posição: right=${data.interact.right}px, bottom=${data.interact.bottom}px`);
      console.log(`    Opacidade repouso (desabilitado): ${data.interact.opacity} (alvo 0.45)`);
      console.log(`    Rótulo visível desabilitado: ${data.interact.labelVisibleDisabled ? 'Sim' : 'Não (oculto)'}`);
      console.log(`    Opacidade ativo (habilitado): ${data.interact.activeOpacity} (alvo 1.0)`);
      console.log(`    Rótulo visível ativo: ${data.interact.labelVisibleActive ? 'Sim ("' + data.interact.labelText + '")' : 'Não'}`);

      res.writeHead(200);
      res.end('ok');
    });
    return;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(9007, async () => {
  console.log('Server ready at http://localhost:9007');

  const auditSnippet = `
    window.addEventListener('load', async () => {
      // Start game
      const startBtn = document.querySelector('[data-open="start"]');
      if (startBtn) startBtn.click();
      await new Promise(r => setTimeout(r, 700));

      const h = window.innerHeight;
      const w = window.innerWidth;

      // 1. D-Pad measures
      const dpad = document.querySelector('.island-direction-pad');
      const btn = document.querySelector('.island-direction-pad button[data-walk="up"]');
      const dpadRect = dpad.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();

      // 2. Interact button disabled
      const interact = document.getElementById('island-interact');
      const label = document.getElementById('island-interact-label');
      const actRect = interact.getBoundingClientRect();
      const disabledOpacity = window.getComputedStyle(interact).opacity;
      const labelVisibleDisabled = window.getComputedStyle(label).visibility !== 'hidden' && window.getComputedStyle(label).opacity !== '0';

      // 2b. Interact button active
      interact.disabled = false;
      label.textContent = 'E — Interagir';
      await new Promise(r => setTimeout(r, 50));
      const activeOpacity = window.getComputedStyle(interact).opacity;
      const labelVisibleActive = window.getComputedStyle(label).visibility !== 'hidden' && window.getComputedStyle(label).opacity !== '0';

      // 3. Joystick measures
      document.body.classList.remove('touch-arrows');
      document.body.classList.add('touch-joystick');
      await new Promise(r => setTimeout(r, 50));

      const joystick = document.getElementById('island-joystick');
      const base = document.querySelector('.joystick-base');
      const stick = document.getElementById('joystick-stick');
      const joyRect = joystick.getBoundingClientRect();
      const baseRect = base.getBoundingClientRect();
      const stickRect = stick.getBoundingClientRect();

      const report = {
        res: w + 'x' + h,
        dpad: {
          w: Math.round(dpadRect.width),
          h: Math.round(dpadRect.height),
          btnW: Math.round(btnRect.width),
          btnH: Math.round(btnRect.height),
          pctHeight: ((dpadRect.height / h) * 100).toFixed(1),
          left: Math.round(dpadRect.left),
          bottom: Math.round(h - dpadRect.bottom)
        },
        joystick: {
          w: Math.round(joyRect.width),
          h: Math.round(joyRect.height),
          baseW: Math.round(baseRect.width),
          baseH: Math.round(baseRect.height),
          stickW: Math.round(stickRect.width),
          stickH: Math.round(stickRect.height),
          ratio: ((stickRect.width / baseRect.width) * 100).toFixed(1),
          pctHeight: ((joyRect.height / h) * 100).toFixed(1)
        },
        interact: {
          w: Math.round(actRect.width),
          h: Math.round(actRect.height),
          right: Math.round(w - actRect.right),
          bottom: Math.round(h - actRect.bottom),
          opacity: disabledOpacity,
          labelVisibleDisabled,
          activeOpacity,
          labelVisibleActive,
          labelText: label.textContent
        }
      };

      await fetch('/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      });
    });
  `;

  const indexContent = fs.readFileSync('index.html', 'utf8');
  fs.writeFileSync('temp_index.html', indexContent.replace('</body>', `<script>${auditSnippet}</script></body>`));

  const resolutionsToTest = [
    { w: 667, h: 375 },
    { w: 740, h: 360 },
    { w: 844, h: 390 },
    { w: 915, h: 412 },
    { w: 1024, h: 768 }
  ];

  for (const r of resolutionsToTest) {
    const shotPath = path.join(artifactDir, `shot-controls-dpad-${r.w}x${r.h}.png`);
    await new Promise(resolve => {
      const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        '--force-device-scale-factor=1',
        `--window-size=${r.w},${r.h}`,
        `--screenshot=${shotPath}`,
        'http://localhost:9007/temp_index.html?toque'
      ]);
      setTimeout(() => {
        chrome.kill();
        resolve();
      }, 2500);
    });
    console.log(`Saved screenshot: shot-controls-dpad-${r.w}x${r.h}.png`);
  }

  // Also capture Joystick mode at 844x390
  const joySnippet = `
    window.addEventListener('load', async () => {
      const startBtn = document.querySelector('[data-open="start"]');
      if (startBtn) startBtn.click();
      await new Promise(r => setTimeout(r, 600));
      document.body.classList.remove('touch-arrows');
      document.body.classList.add('touch-joystick');
      const interact = document.getElementById('island-interact');
      if (interact) {
        interact.disabled = false;
        document.getElementById('island-interact-label').textContent = 'E — Interagir';
      }
    });
  `;
  fs.writeFileSync('temp_joy.html', indexContent.replace('</body>', `<script>${joySnippet}</script></body>`));
  const joyShot = path.join(artifactDir, 'shot-controls-joystick-844x390.png');
  await new Promise(resolve => {
    const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--force-device-scale-factor=1',
      '--window-size=844,390',
      `--screenshot=${joyShot}`,
      'http://localhost:9007/temp_joy.html?toque'
    ]);
    setTimeout(() => {
      chrome.kill();
      resolve();
    }, 2500);
  });
  console.log(`Saved screenshot: shot-controls-joystick-844x390.png`);

  // Settings page 2 screenshot
  const settingsSnippet = `
    window.addEventListener('load', async () => {
      const gear = document.querySelector('[data-open="settings"]');
      if (gear) gear.click();
      await new Promise(r => setTimeout(r, 500));
      const contCard = document.querySelector('[data-settings-target="controls"]');
      if (contCard) contCard.click();
      await new Promise(r => setTimeout(r, 500));
      const nextP = document.getElementById('controls-next-page');
      if (nextP) nextP.click();
    });
  `;
  fs.writeFileSync('temp_settings.html', indexContent.replace('</body>', `<script>${settingsSnippet}</script></body>`));
  const setShot = path.join(artifactDir, 'shot-controls-settings-page2.png');
  await new Promise(resolve => {
    const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--force-device-scale-factor=1',
      '--window-size=844,390',
      `--screenshot=${setShot}`,
      'http://localhost:9007/temp_settings.html'
    ]);
    setTimeout(() => {
      chrome.kill();
      resolve();
    }, 2500);
  });
  console.log(`Saved screenshot: shot-controls-settings-page2.png`);

  if (fs.existsSync('temp_index.html')) fs.unlinkSync('temp_index.html');
  if (fs.existsSync('temp_joy.html')) fs.unlinkSync('temp_joy.html');
  if (fs.existsSync('temp_settings.html')) fs.unlinkSync('temp_settings.html');
  server.close();
  console.log('\nAll tests and screenshots completed successfully!');
  process.exit(0);
});
