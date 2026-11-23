/* Grafo conservador: literais, CSS, JSON, catálogos e caminhos dinâmicos conhecidos. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function inventory(root) {
  const files = [];
  function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name === '.git') continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.isFile()) { const b = fs.readFileSync(full); files.push({ path: path.relative(root, full).replaceAll('\\', '/'), bytes: b.length, hash: crypto.createHash('sha256').update(b).digest('hex') }); }
    }
  }
  walk(root); return files;
}
function discover(root, observed = []) {
  const files = inventory(root), disk = new Map(files.map(f => [f.path, f]));
  const reached = new Set(['index.html']), queue = ['index.html'], edges = [], unresolved = [];
  const add = (from, to, line, kind, expression = to) => {
    to = path.posix.normalize(to);
    if (!/^(assets|intro|js|css|data)\//.test(to)) return;
    edges.push({ from, line, to, kind, expression });
    if (disk.has(to) && !reached.has(to)) { reached.add(to); if (/\.(html|css|js|json)$/.test(to)) queue.push(to); }
  };
  for (const p of observed) add('(Edge file baseline)', p, 0, 'runtime');
  while (queue.length) {
    const from = queue.shift(), text = fs.readFileSync(path.join(root, from), 'utf8');
    const lines = text.split(/\r?\n/);
    lines.forEach((line, i) => {
      for (const m of line.matchAll(/(?:assets|intro|js|css|data)\/[\w./-]+\.(?:json|png|webp|jpeg|jpg|svg|gif|ogg|mp3|woff2?|ttf|js|css|mp4)(?![a-z])/g)) add(from, m[0], i + 1, 'literal');
      for (const m of line.matchAll(/`((?:assets|intro)\/[^`]+)`/g)) {
        if (!m[1].includes('${') || !/\.(?:png|webp|jpe?g|ogg|mp3)$/.test(m[1])) continue;
        const re = new RegExp('^' + escape(m[1]).replace(/\\\$\\\{.*?\\\}/g, '[^/]+') + '$');
        const matches = files.filter(f => re.test(f.path));
        for (const f of matches) add(from, f.path, i + 1, 'template conservador', m[1]);
        unresolved.push({ from, line: i + 1, expression: m[1], matched: matches.length, note: 'Universo de arquivos existentes; conferir domínio do catálogo e runtime.' });
      }
      if (from.endsWith('.css')) for (const m of line.matchAll(/url\(\s*["']?([^\s)"']+)/g)) if (!/^(data:|https?:)/.test(m[1])) add(from, path.posix.join(path.posix.dirname(from), m[1]), i + 1, 'CSS url');
      for (const m of line.matchAll(/["'`]((?:ilha|personagem|puzzles|final)\/[\w./-]+\.(?:png|webp|jpg|jpeg))["'`]/g)) add(from, 'assets/' + m[1], i + 1, 'prefixo assets');
    });
    if (from === 'js/island-art.js') {
      const context = vm.createContext({ window: {} }); vm.runInContext(text, context, { timeout: 1000 });
      for (const p of Object.values(context.window.IslandArt.sources)) add(from, 'assets/' + p, 12, 'catálogo IslandArt');
    }
    if (from === 'js/labirinto-puzzle.js') for (const m of text.matchAll(/base\s*\+\s*['"]([^'"]+\.(?:png|webp|jpg|jpeg))['"]/g)) add(from, 'assets/puzzles/labirinto/' + m[1], text.slice(0, m.index).split('\n').length, 'concatenação base');
    if (['js/algebra-puzzle.js', 'js/operacoes-puzzle.js'].includes(from)) {
      const match = text.match(/const names=(\[[^\]]+\])/), category = from.includes('algebra') ? 'algebra' : 'operacoes';
      if (!match) throw Error('Lista names mudou em ' + from);
      for (const name of vm.runInNewContext(match[1], {}, { timeout: 1000 })) add(from, name === 'chave' ? 'assets/hud/chave_algebra.png' : `assets/puzzles/${category}/${name}.${/^fundo_/.test(name) ? 'webp' : 'png'}`, category === 'algebra' ? 53 : 23, 'names e extensão condicional');
    }
  }
  return { files, reached: [...reached].sort(), edges: [...new Map(edges.map(e => [[e.from, e.to, e.line, e.kind].join('|'), e])).values()], missing: [...new Set(edges.filter(e => !disk.has(e.to)).map(e => e.to))].sort(), templates: unresolved };
}
const tsv = (rows, cols) => [cols.join('\t'), ...rows.map(r => cols.map(k => String(r[k] ?? '').replace(/[\t\r\n]/g, ' ')).join('\t'))].join('\n') + '\n';
if (require.main === module) {
  const root = path.resolve(process.argv[2] || path.join(__dirname, '..')), out = path.resolve(process.argv[3]);
  const observed = process.argv[4] ? fs.readFileSync(process.argv[4], 'utf8').trim().split(/\r?\n/) : [];
  const g = discover(root, observed); fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'inventario.tsv'), tsv(g.files, ['path', 'bytes', 'hash']));
  fs.writeFileSync(path.join(out, 'grafo.tsv'), tsv(g.edges, ['from', 'line', 'to', 'kind', 'expression']));
  fs.writeFileSync(path.join(out, 'templates.tsv'), tsv(g.templates, ['from', 'line', 'expression', 'matched', 'note']));
  fs.writeFileSync(path.join(out, 'alcance.txt'), g.reached.join('\n') + '\n');
  fs.writeFileSync(path.join(out, 'ausentes.txt'), g.missing.join('\n') + '\n');
  console.log(`Inventário ${g.files.length}; alcance ${g.reached.length}; arestas ${g.edges.length}; ausentes ${g.missing.length}`); console.log(g.missing.join('\n'));
}
module.exports = { inventory, discover, tsv };
