const { spawn } = require('child_process');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const cp = spawn(chromePath, ['--headless=new', '--disable-gpu', '--dump-dom', 'about:blank']);
let out = '';
cp.stdout.on('data', d => out += d);
cp.on('close', code => {
  console.log('Exited code:', code, 'Output length:', out.length);
});

