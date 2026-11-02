const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const lines = html.split('\n');
const audioIdx = lines.findIndex(l => l.includes('data-page-section="audio"'));
console.log(lines.slice(audioIdx + 25, audioIdx + 45).join('\n'));

