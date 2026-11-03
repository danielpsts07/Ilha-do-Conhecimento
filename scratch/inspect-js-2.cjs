const fs = require('fs');

const js = fs.readFileSync('js/settings-book.js', 'utf8');
const lines = js.split('\n');
console.log('Lines 300 to 450 of js/settings-book.js:');
console.log(lines.slice(300, 450).join('\n'));

