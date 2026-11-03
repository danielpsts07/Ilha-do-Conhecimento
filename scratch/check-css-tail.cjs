const fs = require('fs');

const css = fs.readFileSync('css/settings.css', 'utf8');
const lines = css.split('\n');
console.log(lines.slice(lines.length - 40).join('\n'));

