const { execFileSync } = require('child_process');
const path = require('path');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outPath = path.resolve('scratch/test-initial.png');
const url = 'file:///' + path.resolve('index.html').replace(/\\/g, '/');

console.log('Capturing:', url);
execFileSync(chromePath, [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  '--window-size=1024,572',
  `--screenshot=${outPath}`,
  url
]);
console.log('Done! Captured to:', outPath);

