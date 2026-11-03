const fs = require('fs');
const { execFileSync } = require('child_process');
const path = require('path');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const resolutions = [
  { w: 667, h: 375, name: '667x375' },
  { w: 740, h: 360, name: '740x360' },
  { w: 844, h: 390, name: '844x390' },
  { w: 915, h: 412, name: '915x412' },
  { w: 1024, h: 768, name: '1024x768' },
  { w: 1366, h: 768, name: '1366x768' },
  { w: 1920, h: 1080, name: '1920x1080' }
];

console.log('--- STARTING RESOLUTION & OVERFLOW VERIFICATION ---');

for (const res of resolutions) {
  // Test directly against index.html with query parameters
  const sections = ['audio', 'controls', 'language', 'access', 'howto', 'about', 'credits'];
  let totalOverflows = 0;
  for (const sec of sections) {
    const url = 'file:///' + path.resolve(`index.html?calibrar&settings=${sec}`).replace(/\\/g, '/');
    const htmlOut = execFileSync(chromePath, [
      '--headless=new',
      '--disable-gpu',
      `--window-size=${res.w},${res.h}`,
      '--dump-dom',
      url
    ]).toString();

    // Check if class calibrar-overflow is present
    if (htmlOut.includes('calibrar-overflow')) {
      totalOverflows++;
      console.warn(`[${res.name}] Overflow found in section: ${sec}`);
    }
  }
  if (totalOverflows === 0) {
    console.log(`[PASS] Resolution ${res.name}: 0 overflows across all 7 submenus!`);
  }
}
