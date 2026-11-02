const fs = require('fs');

const css = fs.readFileSync('css/settings.css', 'utf8');
const lines = css.split('\n');
console.log('Lines 950 to 1250:');
console.log(lines.slice(950, 1250).join('\n'));

