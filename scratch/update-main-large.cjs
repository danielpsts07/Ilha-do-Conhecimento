const fs = require('fs');

let js = fs.readFileSync('js/main.js', 'utf8').replace(/\r\n/g, '\n');

const target = `    if (params.has('settings')) {
      window.addEventListener('load', () => {
        const sec = params.get('settings') || 'index';
        openBook('settings', sec);`;

const repl = `    if (params.has('settings')) {
      window.addEventListener('load', () => {
        if (params.has('largeText') && window.GameSettings) {
          window.GameSettings.set('largeText', true);
        }
        const sec = params.get('settings') || 'index';
        openBook('settings', sec);`;

if (!js.includes(target)) {
  console.error('Target not found in main.js');
} else {
  js = js.replace(target, repl);
  fs.writeFileSync('js/main.js', js.replace(/\n/g, '\r\n'), 'utf8');
  console.log('main.js updated with largeText URL param support');
}

