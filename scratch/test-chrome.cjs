const { execSync } = require('child_process');
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
console.log('Testing Chrome...');
try {
  const version = execSync(`"${chromePath}" --version`).toString();
  console.log('Chrome version:', version);
} catch (e) {
  console.error('Error:', e.message);
}

