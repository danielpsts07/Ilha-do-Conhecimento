const fs = require('fs');

const css = fs.readFileSync('css/settings.css', 'utf8');
const lines = css.split('\n');
console.log('Lines 1250 to 1500:');
console.log(lines.slice(1250, 1500).join('\n'));

