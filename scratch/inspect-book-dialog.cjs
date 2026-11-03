const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const lines = html.split('\n');
const bookIdx = lines.findIndex(l => l.includes('id="book-dialog"'));
console.log('book-dialog starts at line:', bookIdx);
console.log(lines.slice(bookIdx, bookIdx + 50).join('\n'));

