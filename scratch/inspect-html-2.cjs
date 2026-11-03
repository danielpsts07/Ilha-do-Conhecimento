const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const htmlLines = html.split('\n');
console.log('HTML Lines 450 to 550:');
console.log(htmlLines.slice(450, 550).join('\n'));

