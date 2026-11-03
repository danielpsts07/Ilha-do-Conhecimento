const fs = require('fs');
const config = fs.readFileSync('js/config.js', 'utf8');
const lines = config.split('\n');
let maskUrls = [];
for (let i = 217; i < 225; i++) {
  const line = lines[i] || '';
  if (line.includes('data:image/png;base64,')) {
    const b64 = line.split('data:image/png;base64,')[1].replace(/["',;]/g, '').trim();
    const buf = Buffer.from(b64, 'base64');
    maskUrls.push({ line: i + 1, width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) });
  }
}
console.log('LABIRINTO_MASKS_LOCAL PNGs:', maskUrls);

