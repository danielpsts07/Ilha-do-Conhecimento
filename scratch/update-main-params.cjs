const fs = require('fs');

const mainJsPath = 'js/main.js';
let content = fs.readFileSync(mainJsPath, 'utf8');

const needle = "if (params.has('iniciar')) {";
const idx = content.indexOf(needle);
if (idx === -1) {
  console.error('Needle not found');
} else {
  const injection = `if (params.has('settings')) {
      window.addEventListener('load', () => {
        const sec = params.get('settings') || 'index';
        openBook('settings', sec);
      });
    }\n    `;
  content = content.slice(0, idx) + injection + content.slice(idx);
  fs.writeFileSync(mainJsPath, content, 'utf8');
  console.log('Inserted successfully!');
}
