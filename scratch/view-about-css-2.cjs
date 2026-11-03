const fs = require('fs');
const css = fs.readFileSync('css/settings.css', 'utf8');
const lines = css.split('\n');
console.log(lines.slice(1400, 1430).join('\n'));

