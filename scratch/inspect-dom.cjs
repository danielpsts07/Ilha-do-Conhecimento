const { spawn } = require('child_process');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const path = require('path');

// Run headless Chrome and evaluate script to inspect bounding rects
function inspectPage(section) {
  const url = 'file:///' + path.resolve(`index.html?settings=${section}&calibrar`).replace(/\\/g, '/');
  // We can write a quick page dump script
}

