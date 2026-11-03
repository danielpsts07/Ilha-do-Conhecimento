const { execFileSync } = require('child_process');
const path = require('path');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

[0, 1, 2].forEach(st => {
  const out = path.resolve(`scratch/current-tutorial-step${st}-844x390.png`);
  const url = 'file:///' + path.resolve(`index.html?tutorial&step=${st}`).replace(/\\/g, '/');
  execFileSync(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--window-size=844,390',
    `--screenshot=${out}`,
    url
  ]);
  console.log(`Captured step ${st} to ${out}`);
});

