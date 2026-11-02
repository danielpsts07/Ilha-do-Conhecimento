const fs = require('fs');

const css = fs.readFileSync('css/settings.css', 'utf8');
const lines = css.split('\n');
console.log('Total CSS lines:', lines.length);
console.log('Lines 560 to 750:');
console.log(lines.slice(560, 750).join('\n'));

