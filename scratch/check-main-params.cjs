const fs = require('fs');
const mainJs = fs.readFileSync('js/main.js', 'utf8');
const lines = mainJs.split('\n');
const idx = lines.findIndex(l => l.includes('const params = new URLSearchParams'));
console.log(lines.slice(idx, idx + 40).join('\n'));

