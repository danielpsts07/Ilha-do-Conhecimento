const fs = require('fs');

let js = fs.readFileSync('js/main.js', 'utf8').replace(/\r\n/g, '\n');

// Add support for ?tutorial to js/main.js
const target = `    if (params.has('settings')) {`;
const repl = `    if (params.has('tutorial')) {
      window.addEventListener('load', () => {
        if (params.has('largeText') && window.GameSettings) {
          window.GameSettings.set('largeText', true);
        }
        openBook('tutorial');
        const st = params.get('step');
        if (st !== null) {
          step = Number(st);
          renderPage();
        }
      });
    }
    if (params.has('settings')) {`;

if (!js.includes(target)) {
  console.error('Target not found');
} else {
  js = js.replace(target, repl);
  fs.writeFileSync('js/main.js', js.replace(/\n/g, '\r\n'), 'utf8');
  console.log('main.js updated with ?tutorial support');
}

