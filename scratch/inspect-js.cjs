const fs = require('fs');

const js = fs.readFileSync('js/settings-book.js', 'utf8');
console.log('js/settings-book.js length:', js.length);
console.log('First 100 lines:');
console.log(js.split('\n').slice(0, 100).join('\n'));

