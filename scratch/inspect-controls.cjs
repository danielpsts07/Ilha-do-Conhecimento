const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const htmlLines = html.split('\n');
console.log('HTML Lines 280 to 370:');
console.log(htmlLines.slice(280, 370).join('\n'));

