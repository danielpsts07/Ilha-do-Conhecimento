const { execFileSync } = require('child_process');
const path = require('path');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const out = path.resolve('scratch/current-controls2-844x390.png');
const url = 'file:///' + path.resolve('index.html?settings=controls&subpage=2&calibrar').replace(/\\/g, '/');
execFileSync(chromePath, [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  '--window-size=844,390',
  `--screenshot=${out}`,
  url
]);
console.log('Saved to', out);

