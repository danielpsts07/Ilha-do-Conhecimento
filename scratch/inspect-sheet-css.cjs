const fs = require('fs');

const css = fs.readFileSync('css/settings.css', 'utf8');
const lines = css.split('\n');

// Find where .mural-sheet or submenus start
let sheetIdx = lines.findIndex(l => l.includes('.mural-sheet'));
console.log('Sheet CSS starts around line:', sheetIdx);
console.log(lines.slice(sheetIdx, sheetIdx + 120).join('\n'));

