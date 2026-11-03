const fs = require('fs');

const css = fs.readFileSync('css/settings.css', 'utf8');
const lines = css.split('\n');
console.log('Lines 750 to 950:');
console.log(lines.slice(750, 950).join('\n'));

