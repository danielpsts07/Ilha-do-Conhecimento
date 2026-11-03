const { execFileSync } = require('child_process');
const path = require('path');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const out = path.resolve('scratch/test-controls2.png');
// We can use javascript evaluation or a test page that clicks next
const testHtml = `
<!DOCTYPE html>
<html>
<body>
<iframe id="frame" src="index.html?settings=controls" style="width:844px; height:390px; border:0;"></iframe>
<script>
window.addEventListener('message', () => {});
const frame = document.getElementById('frame');
frame.onload = () => {
  setTimeout(() => {
    const doc = frame.contentDocument;
    const nextBtn = doc.getElementById('sheet-next-page');
    if (nextBtn) {
      nextBtn.click();
      console.log('Clicked next!');
    }
  }, 300);
};
</script>
</body>
</html>
`;
fs.writeFileSync('scratch/test-controls2-runner.html', testHtml, 'utf8');

const url = 'file:///' + path.resolve('scratch/test-controls2-runner.html').replace(/\\/g, '/');
execFileSync(chromePath, [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  '--window-size=844,390',
  `--screenshot=${out}`,
  url
]);
console.log('Done test-controls2');

