const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const lines = html.split('\n');
const idx = lines.findIndex(l => l.includes('id="settings-back"'));
console.log(lines.slice(idx - 3, idx + 15).join('\n'));

