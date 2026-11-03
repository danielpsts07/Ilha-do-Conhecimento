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
      console.log(`\n[Resolução ${data.res}]`);
      console.log(`  D-Pad: container=${data.dpad.w}×${data.dpad.h}px (${data.dpad.pctHeight}% da altura da tela), botão=${data.dpad.btnW}×${data.dpad.btnH}px`);
      console.log(`  Joystick: container=${data.joystick.w}×${data.joystick.h}px (${data.joystick.pctHeight}% da altura da tela), base=${data.joystick.baseW}×${data.joystick.baseH}px, manche=${data.joystick.stickW}×${data.joystick.stickH}px (proporção manche/base=${data.joystick.ratio}%)`);
      console.log(`  Botão Interagir: ${data.interact.w}×${data.interact.h}px, opacity=${data.interact.opacity}, labelVisible=${data.interact.labelVisible}`);
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

server.listen(9002, async () => {
  console.log('Test server ready at http://localhost:9002');

  const resolutionsToTest = [
    { w: 667, h: 375, name: '667x375' },
    { w: 740, h: 360, name: '740x360' },
    { w: 844, h: 390, name: '844x390' },
    { w: 915, h: 412, name: '915x412' },
    { w: 1024, h: 768, name: '1024x768' }
  ];

  for (const r of resolutionsToTest) {
    // Generate test html
    const testHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
<iframe id="frame" src="/index.html?toque" style="width:${r.w}px;height:${r.h}px;border:none;"></iframe>
<script>
window.addEventListener('message', () => {});
const frame = document.getElementById('frame');
frame.onload = async () => {
  const doc = frame.contentDocument;
  const win = frame.contentWindow;

  // Start game
  const startBtn = doc.getElementById('home-start');
  if (startBtn) startBtn.click();
  await new Promise(res => setTimeout(res, 800));

  // Measure D-Pad
  const dpad = doc.querySelector('.island-direction-pad');
  const btn = doc.querySelector('.island-direction-pad button[data-walk="up"]');
  const dpadRect = dpad.getBoundingClientRect();
  const btnRect = btn.getBoundingClientRect();

  // Switch to joystick
  doc.body.classList.remove('touch-arrows');
  doc.body.classList.add('touch-joystick');
  await new Promise(res => setTimeout(res, 100));

  const joystick = doc.getElementById('island-joystick');
  const base = doc.querySelector('.joystick-base');
  const stick = doc.getElementById('joystick-stick');
  const joyRect = joystick.getBoundingClientRect();
  const baseRect = base.getBoundingClientRect();
  const stickRect = stick.getBoundingClientRect();

  // Test interact button
  const interact = doc.getElementById('island-interact');
  const label = doc.getElementById('island-interact-label');
  const actRect = interact.getBoundingClientRect();
  const style = win.getComputedStyle(interact);
  const labelStyle = win.getComputedStyle(label);

  const report = {
    res: '${r.name}',
    dpad: {
      w: Math.round(dpadRect.width),
      h: Math.round(dpadRect.height),
      btnW: Math.round(btnRect.width),
      btnH: Math.round(btnRect.height),
      pctHeight: ((dpadRect.height / ${r.h}) * 100).toFixed(1)
    },
    joystick: {
      w: Math.round(joyRect.width),
      h: Math.round(joyRect.height),
      baseW: Math.round(baseRect.width),
      baseH: Math.round(baseRect.height),
      stickW: Math.round(stickRect.width),
      stickH: Math.round(stickRect.height),
      ratio: ((stickRect.width / baseRect.width) * 100).toFixed(1),
      pctHeight: ((joyRect.height / ${r.h}) * 100).toFixed(1)
    },
    interact: {
      w: Math.round(actRect.width),
      h: Math.round(actRect.height),
      opacity: style.opacity,
      labelVisible: labelStyle.visibility !== 'hidden' && labelStyle.opacity !== '0'
    }
  };

  await fetch('/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(report)
  });
  window.parent.postMessage('done', '*');
};
</script>
</body>
</html>`;

    fs.writeFileSync(path.join(__dirname, 'temp_test.html'), testHtml);

    const shotPath = path.join(artifactDir, `shot-controls-dpad-${r.name}.png`);
    await new Promise(resolve => {
      const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        '--force-device-scale-factor=1',
        `--window-size=${r.w},${r.h}`,
        `--screenshot=${shotPath}`,
        'http://localhost:9002/scratch/temp_test.html'
      ]);
      chrome.on('exit', () => {
        console.log(`Saved screenshot: shot-controls-dpad-${r.name}.png`);
        resolve();
      });
    });
  }

  // Capture Joystick and Settings Page 2 screenshots at 844x390
  const joyHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
<iframe id="frame" src="/index.html?toque" style="width:844px;height:390px;border:none;"></iframe>
<script>
const frame = document.getElementById('frame');
frame.onload = async () => {
  const doc = frame.contentDocument;
  const startBtn = doc.getElementById('home-start');
  if (startBtn) startBtn.click();
  await new Promise(res => setTimeout(res, 800));
  doc.body.classList.remove('touch-arrows');
  doc.body.classList.add('touch-joystick');
  // Enable interact button to show active state
  const interact = doc.getElementById('island-interact');
  if (interact) {
    interact.disabled = false;
    doc.getElementById('island-interact-label').textContent = 'E — Interagir';
  }
};
</script>
</body>
</html>`;
  fs.writeFileSync(path.join(__dirname, 'temp_joy.html'), joyHtml);

  const joyShot = path.join(artifactDir, 'shot-controls-joystick-844x390.png');
  await new Promise(resolve => {
    const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--force-device-scale-factor=1',
      '--window-size=844,390',
      `--screenshot=${joyShot}`,
      'http://localhost:9002/scratch/temp_joy.html'
    ]);
    chrome.on('exit', () => {
      console.log('Saved screenshot: shot-controls-joystick-844x390.png');
      resolve();
    });
  });

  // Settings Page 2 Screenshot
  const settingsHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
<iframe id="frame" src="/index.html" style="width:844px;height:390px;border:none;"></iframe>
<script>
const frame = document.getElementById('frame');
frame.onload = async () => {
  const doc = frame.contentDocument;
  const gear = doc.getElementById('settings-button');
  if (gear) gear.click();
  await new Promise(res => setTimeout(res, 500));
  const contCard = doc.querySelector('[data-settings-target="controls"]');
  if (contCard) contCard.click();
  await new Promise(res => setTimeout(res, 500));
  const nextP = doc.getElementById('controls-next-page');
  if (nextP) nextP.click();
};
</script>
</body>
</html>`;
  fs.writeFileSync(path.join(__dirname, 'temp_settings.html'), settingsHtml);

  const setShot = path.join(artifactDir, 'shot-controls-settings-page2.png');
  await new Promise(resolve => {
    const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--force-device-scale-factor=1',
      '--window-size=844,390',
      `--screenshot=${setShot}`,
      'http://localhost:9002/scratch/temp_settings.html'
    ]);
    chrome.on('exit', () => {
      console.log('Saved screenshot: shot-controls-settings-page2.png');
      resolve();
    });
  });

  server.close();
  console.log('\nAll tests and screenshots completed successfully!');
  process.exit(0);
});
