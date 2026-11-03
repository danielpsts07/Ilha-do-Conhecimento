const fs = require('fs');
const mainJs = fs.readFileSync('js/main.js', 'utf8');
console.log('Search in main.js for URLSearchParams:');
const matches = mainJs.split('\n').filter(l => l.includes('URLSearchParams') || l.includes('SettingsBook') || l.includes('book-dialog'));
console.log(matches.join('\n'));

