const fs = require('fs');

const css = fs.readFileSync('css/settings.css', 'utf8');
const lines = css.split('\n');
console.log('Lines 1500 to 1668:');
console.log(lines.slice(1500).join('\n'));

