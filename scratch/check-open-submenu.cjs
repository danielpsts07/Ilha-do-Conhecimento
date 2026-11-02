const fs = require('fs');

const js = fs.readFileSync('js/settings-book.js', 'utf8');
const lines = js.split('\n');
const idx = lines.findIndex(l => l.includes('function openSubmenu'));
console.log(lines.slice(idx, idx + 40).join('\n'));

