const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const lines = html.split('\n');
const tutIdx = lines.findIndex(l => l.includes('id="tutorial-view"'));
console.log('tutorial-view starts at line:', tutIdx);
console.log(lines.slice(tutIdx, tutIdx + 120).join('\n'));

