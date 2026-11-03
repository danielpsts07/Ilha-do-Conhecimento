const fs = require('fs');

// 1. Update index.html for #key-guide
let html = fs.readFileSync('index.html', 'utf8').replace(/\r\n/g, '\n');

const oldKeyGuide = `<div class="key-guide" id="key-guide"><div><kbd>W</kbd></div><div><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></div><span>ou as setas do teclado</span></div>`;

const newKeyGuide = `<div class="key-guide" id="key-guide"><div class="wasd-cluster"><div><kbd>W</kbd></div><div><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></div></div><span>ou as setas do teclado</span></div>`;

if (!html.includes(oldKeyGuide)) {
  console.error('oldKeyGuide not matched in index.html');
} else {
  html = html.replace(oldKeyGuide, newKeyGuide);
  fs.writeFileSync('index.html', html.replace(/\n/g, '\r\n'), 'utf8');
  console.log('index.html updated with wasd-cluster');
}

// 2. Update js/main.js for Voltar ao menu
let js = fs.readFileSync('js/main.js', 'utf8').replace(/\r\n/g, '\n');
const oldPrev = `$('#previous-step').textContent=step===0?'Menu':'Voltar';`;
const newPrev = `$('#previous-step').textContent=step===0?'Voltar ao menu':'Voltar';`;

if (!js.includes(oldPrev)) {
  console.error('oldPrev not matched in js/main.js');
} else {
  js = js.replace(oldPrev, newPrev);
  fs.writeFileSync('js/main.js', js.replace(/\n/g, '\r\n'), 'utf8');
  console.log('js/main.js updated with Voltar ao menu');
}

