const fs = require('fs');

let js = fs.readFileSync('js/main.js', 'utf8').replace(/\r\n/g, '\n');
const target = `    if (params.has('settings')) {
      window.addEventListener('load', () => {
        const sec = params.get('settings') || 'index';
        openBook('settings', sec);
      });
    }`;

const repl = `    if (params.has('settings')) {
      window.addEventListener('load', () => {
        const sec = params.get('settings') || 'index';
        openBook('settings', sec);
        if (params.get('page') === '2') {
          setTimeout(() => {
            const next = document.getElementById('sheet-next-page');
            if (next) next.click();
          }, 150);
        }
      });
    }`;

if (!js.includes(target)) {
  console.error('Target not found in main.js');
} else {
  js = js.replace(target, repl);
  fs.writeFileSync('js/main.js', js.replace(/\n/g, '\r\n'), 'utf8');
  console.log('main.js updated with page=2 support');
}

