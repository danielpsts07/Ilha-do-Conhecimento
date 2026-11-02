const { execFileSync } = require('child_process');
const fs = require('fs');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const html = `
<!DOCTYPE html>
<html><body>
<iframe id="f" src="file:///C:/Users/gpjac/Ilha-do-Conhecimento/index.html?tutorial&step=0" style="width:390px;height:844px;border:0;"></iframe>
<script>
window.onload = () => {
  setTimeout(() => {
    const doc = document.getElementById('f').contentDocument;
    const stage = doc.querySelector('.mural-stage').getBoundingClientRect();
    const cortica = doc.querySelector('.mural-cortica').getBoundingClientRect();
    const tut = doc.querySelector('#tutorial-view').getBoundingClientRect();
    const title = doc.querySelector('#tutorial-title').getBoundingClientRect();
    const chapter = doc.querySelector('.chapter').getBoundingClientRect();
    document.title = 'RECTS:' + JSON.stringify({ stage, cortica, tut, title, chapter });
  }, 500);
};
</script>
</body></html>
`;
fs.writeFileSync('scratch/rect-test.html', html, 'utf8');

const out = execFileSync(chromePath, [
  '--headless=new',
  '--disable-gpu',
  '--window-size=450,900',
  '--virtual-time-budget=2000',
  '--dump-dom',
  'file:///C:/Users/gpjac/Ilha-do-Conhecimento/scratch/rect-test.html'
], { encoding: 'utf8' });

const m = out.match(/<title>RECTS:([^<]+)<\/title>/);
if (m) {
  console.log(JSON.stringify(JSON.parse(m[1]), null, 2));
} else {
  console.log('Not found');
}

