const { execFileSync } = require('child_process');
const fs = require('fs');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const resolutions = [
  { w: 667, h: 375, name: '667x375' },
  { w: 740, h: 360, name: '740x360' },
  { w: 844, h: 390, name: '844x390' },
  { w: 915, h: 412, name: '915x412' },
  { w: 1024, h: 768, name: '1024x768' },
  { w: 1366, h: 768, name: '1366x768' },
  { w: 1920, h: 1080, name: '1920x1080' }
];

for (const res of resolutions) {
  const runner = `
  <!DOCTYPE html><html><body>
  <iframe id="f" src="file:///C:/Users/gpjac/Ilha-do-Conhecimento/index.html?tutorial&step=0" style="width:${res.w}px;height:${res.h}px;border:0;"></iframe>
  <script>
  window.onload = () => {
    setTimeout(() => {
      try {
        const win = document.getElementById('f').contentWindow;
        const tut = win.document.getElementById('tutorial-view');
        document.title = 'SZ:' + tut.clientWidth + 'x' + tut.clientHeight;
      } catch(e) {
        document.title = 'ERR:' + e.message;
      }
    }, 400);
  };
  </script>
  </body></html>
  `;
  fs.writeFileSync('scratch/size-test.html', runner);
  const out = execFileSync(chromePath, ['--headless=new', '--disable-gpu', '--allow-file-access-from-files', '--virtual-time-budget=2000', '--dump-dom', 'file:///C:/Users/gpjac/Ilha-do-Conhecimento/scratch/size-test.html'], { encoding: 'utf8' });
  const m = out.match(/<title>(SZ:[^<]+|ERR:[^<]+)<\/title>/);
  console.log(res.name, m ? m[1] : 'not found');
}

