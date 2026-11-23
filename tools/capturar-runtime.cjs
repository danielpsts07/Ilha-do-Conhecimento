/* Auditoria externa por CDP. Não altera arquivos nem lógica do jogo. Node 22+. */
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { pathToFileURL, fileURLToPath } = require('node:url');
const { spawn } = require('node:child_process');
const root = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const output = path.resolve(process.argv[3] || path.join(os.tmpdir(), 'ilha-runtime'));
const chrome = process.env.CHROME_PATH;
if (!chrome || !fs.existsSync(chrome)) throw Error('Defina CHROME_PATH para o Edge instalado.');
fs.mkdirSync(output, { recursive: true });
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ilha-auditoria-edge-'));
const port = 9437;
const browser = spawn(chrome, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--allow-file-access-from-files', '--disable-gpu', '--no-first-run', '--no-default-browser-check', 'about:blank'], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
let stderr = '';
browser.stderr.on('data', d => stderr += d);
let browserError;
browser.on('error', e => browserError = e);
const pause = ms => new Promise(r => setTimeout(r, ms));
let ws, stage = 'setup', seq = 0;
const pending = new Map(), events = [], requests = new Map(), checkpoints = [];
const cell = v => String(v ?? '').replace(/[\t\r\n]/g, ' ');
const tsv = (rows, cols) => [cols.join('\t'), ...rows.map(r => cols.map(k => cell(r[k])).join('\t'))].join('\n') + '\n';
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++seq;
    const timeout = setTimeout(() => { pending.delete(id); reject(Error(`CDP timeout: ${method}`)); }, 20000);
    pending.set(id, { resolve: r => { clearTimeout(timeout); resolve(r); }, reject: e => { clearTimeout(timeout); reject(e); } });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true });
  if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails));
  return r.result.value;
}
async function key(key, code = key) {
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code });
}
async function click(selector) {
  const r = await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Elemento ausente');const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', ...r, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...r, button: 'left', clickCount: 1 });
}
async function shot(name) {
  await pause(600);
  const r = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(output, name + '.png'), Buffer.from(r.data, 'base64'));
  const state = await evaluate(`({island:!!window.GameIsland?.active,intro:!!window.IntroStory?.active,settings:!!document.querySelector('#book-dialog')?.open,dialogs:[...document.querySelectorAll('[role="dialog"]')].filter(e=>e.getBoundingClientRect().width).map(e=>e.getAttribute('aria-label')),text:document.body.innerText.slice(-600)})`);
  checkpoints.push({ stage, name, state: JSON.stringify(state) });
  console.log('Capturado:', name);
}
async function run() {
  let target;
  for (let i = 0; i < 80; i++) {
    if (browserError) throw browserError;
    try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t => t.type === 'page'); if (target) break; } catch {}
    await pause(150);
  }
  if (!target) throw Error('Edge não abriu CDP: ' + stderr.slice(-1000));
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  ws.onmessage = event => {
    const m = JSON.parse(event.data);
    if (m.id) { const p = pending.get(m.id); if (p) { pending.delete(m.id); m.error ? p.reject(Error(m.error.message)) : p.resolve(m.result); } return; }
    const p = m.params || {};
    if (m.method === 'Network.requestWillBeSent') requests.set(p.requestId, p.request.url);
    events.push({ stage, event: m.method, id: p.requestId, url: p.request?.url || p.response?.url || requests.get(p.requestId) || '', status: p.response?.status, error: p.errorText || '', detail: JSON.stringify(p) });
  };
  await send('Page.enable'); await send('Network.enable'); await send('Runtime.enable');
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
  stage = 'menu';
  await send('Page.navigate', { url: pathToFileURL(path.join(root, 'index.html')).href });
  await pause(1600); await shot('01-menu');
  stage = 'configuracoes'; await click('[data-open="settings"]'); await shot('02-configuracoes');
  for (const section of ['audio', 'controls', 'accessibility', 'about']) {
    await evaluate(`window.SettingsBook?.go(${JSON.stringify(section)})`);
    await pause(150);
  }
  await evaluate(`document.querySelector('#book-dialog').close()`);
  stage = 'intro'; await click('[data-open="start"]'); await shot('03-intro');
  await key('Escape'); await pause(900);
  stage = 'ilha'; await evaluate('window.GameIsland.start()'); await pause(3000); await shot('04-ilha');
  for (const [id, loader] of [['algebra', 'loadAlgebra'], ['geometria', 'loadGeometria'], ['operacoes', 'loadOperacoes'], ['logica', 'loadMemoryMaze']]) {
    stage = id;
    await evaluate(`(async()=>{window.__auditScene=await window.${loader}();window.__auditScene.open({state:{},debug:()=>false,toggleDebug:()=>{},onExit:()=>{}});})()`);
    await shot('05-' + id + '-tutorial');
    await evaluate('window.TutorialCard?.fechar?.()'); await pause(350);
    await shot('06-' + id + '-puzzle');
    await evaluate(`(()=>{if(window.ActivePuzzle?.close)window.ActivePuzzle.close();else {const c=[...document.querySelectorAll('canvas')].at(-1);c?.focus();document.dispatchEvent(new KeyboardEvent('keydown',{key:'x',code:'KeyX',bubbles:true}));}})()`);
    await pause(400);
  }
  stage = 'final';
  await evaluate(`(async()=>{await window.loadFinal();window.FinalPuzzle.open({state:{keys:{logica:true,algebra:true,geometria:true,operacoes:true},cadeados:{}},onExit:()=>{}});})()`);
  await shot('07-final-resgate');
  await key('F3'); await key('g', 'KeyG'); await shot('08-final-historia');
  await pause(21000); await shot('09-final-encerramento');
  stage = 'concluido';
}
run().then(() => { console.log('Captura completa.'); }).catch(error => { process.exitCode = 1; fs.writeFileSync(path.join(output, 'ERRO.txt'), error.stack); console.error(error); }).finally(async () => {
  fs.writeFileSync(path.join(output, 'eventos.tsv'), tsv(events, ['stage', 'event', 'id', 'url', 'status', 'error', 'detail']));
  fs.writeFileSync(path.join(output, 'checkpoints.tsv'), tsv(checkpoints, ['stage', 'name', 'state']));
  const relevant = events.filter(e => e.event === 'Network.requestWillBeSent' || e.event === 'Network.loadingFailed' || e.status >= 400);
  fs.writeFileSync(path.join(output, 'requisicoes-e-falhas.tsv'), tsv(relevant, ['stage', 'event', 'url', 'status', 'error']));
  const relative = events.filter(e => e.event === 'Network.requestWillBeSent' && e.url.startsWith('file:')).map(e => path.relative(root, fileURLToPath(e.url)).replaceAll('\\', '/'));
  fs.writeFileSync(path.join(output, 'arquivos-solicitados.txt'), [...new Set(relative)].sort().join('\n') + '\n');
  fs.writeFileSync(path.join(output, 'edge-stderr.txt'), stderr);
  fs.writeFileSync(path.join(output, 'perfil.txt'), profile + '\n');
  if (ws?.readyState === WebSocket.OPEN) { try { await send('Browser.close'); } catch {} ws.close(); }
  if (browser.exitCode === null) browser.kill();
});
