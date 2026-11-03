const fs = require('fs');

// Inspect index.html from lines 190 to 550
const html = fs.readFileSync('index.html', 'utf8');
const htmlLines = html.split('\n');
console.log('HTML Lines 190 to 450:');
console.log(htmlLines.slice(190, 450).join('\n'));

