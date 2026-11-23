/* Executa os harnesses existentes sem instalar dependências. Logs fora do projeto. */
const fs = require('node:fs');
const path = require('node:path');
const { spawn, execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const output = path.resolve(process.argv[2]);
const folder = process.argv[3] || 'scratch';
fs.mkdirSync(output, { recursive: true });
const names = ['server-test', 'test-all-tutorial', 'test-browser-acceptance', 'test-browser-controls', 'test-browser-maze', 'test-camara-gameplay', 'test-capture', 'test-chrome-headless', 'test-full-flood', 'test-full-gameplay', 'test-head-heights'];
const results = [];
async function run(name, args, timeoutMs) {
  console.log('Iniciando:', name);
  const log = fs.openSync(path.join(output, name + '.txt'), 'w');
  const p = spawn(process.execPath, args, { cwd: root, env: process.env, windowsHide: true, stdio: ['ignore', log, log] });
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; try { execFileSync('taskkill.exe', ['/PID', String(p.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' }); } catch { p.kill(); } }, timeoutMs);
  const code = await new Promise(resolve => { p.on('error', e => { fs.writeSync(log, e.stack); resolve(-1); }); p.on('close', resolve); });
  clearTimeout(timer); fs.closeSync(log);
  results.push({ name, code, timedOut });
  fs.writeFileSync(path.join(output, 'resultados.tsv'), 'name\tcode\ttimedOut\n' + results.map(r => `${r.name}\t${r.code}\t${r.timedOut}`).join('\n') + '\n');
  console.log('Resultado:', name, code, timedOut ? 'TIMEOUT' : '');
}
(async () => {
  for (const n of names) await run(n, [path.join(folder, n + '.cjs')], n === 'test-all-tutorial' ? 240000 : 60000);
  await run('suite-ampla', ['--test'], 180000);
})().catch(e => { console.error(e); process.exitCode = 1; });
