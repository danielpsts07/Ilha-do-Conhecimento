const fs = require('fs');

const js = fs.readFileSync('js/settings-book.js', 'utf8');
const lines = js.split('\n');
console.log('Lines 450 to 530 of js/settings-book.js:');
console.log(lines.slice(450, 530).join('\n'));

