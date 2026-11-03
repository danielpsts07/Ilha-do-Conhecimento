const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const lines = html.split('\n');
console.log('Audio section in index.html:');
const audioIdx = lines.findIndex(l => l.includes('data-page-section="audio"'));
console.log(lines.slice(audioIdx, audioIdx + 30).join('\n'));

console.log('Lang section in index.html:');
const langIdx = lines.findIndex(l => l.includes('data-page-section="language"'));
console.log(lines.slice(langIdx, langIdx + 20).join('\n'));

