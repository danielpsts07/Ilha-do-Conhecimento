const fs = require('fs');

const css = fs.readFileSync('css/settings.css', 'utf8');
const lines = css.split('\n');

const sheetStartIdx = lines.findIndex(l => l.includes('.mural-sheet-container {'));
console.log('sheetStartIdx:', sheetStartIdx);

const calibIdx = lines.findIndex(l => l.includes('MODO DE CALIBRAÇÃO'));
console.log('calibIdx:', calibIdx);

