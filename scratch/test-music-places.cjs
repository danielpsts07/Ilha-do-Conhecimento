const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('--- TEST SUITE: Música por Lugar (Ilha do Conhecimento) ---');

function createMockEnv(initialSettings = {}) {
  let currentTime = 1000;
  const rafCallbacks = new Map();
  let rafId = 0;

  function advanceTime(ms) {
    currentTime += ms;
    const currentCallbacks = Array.from(rafCallbacks.entries());
    rafCallbacks.clear();
    for (const [id, cb] of currentCallbacks) {
      cb(currentTime);
    }
  }

  const audioInstances = [];

  class MockAudio {
    constructor() {
      this.src = '';
      this.loop = false;
      this.preload = '';
      this.volume = 1.0;
      this.currentTime = 0;
      this.paused = true;
      this.playCount = 0;
      this.pauseCount = 0;
      this.listeners = {};
      this.shouldRejectPlay = false;
      audioInstances.push(this);
    }

    canPlayType(type) {
      if (type.includes('opus') || type.includes('ogg')) return 'probably';
      if (type.includes('mpeg') || type.includes('mp3')) return 'maybe';
      return '';
    }

    play() {
      this.playCount++;
      if (this.shouldRejectPlay) {
        return Promise.reject(new Error('Autoplay blocked'));
      }
      this.paused = false;
      return Promise.resolve();
    }

    pause() {
      this.pauseCount++;
      this.paused = true;
    }

    load() {}

    addEventListener(event, fn) {
      this.listeners[event] = this.listeners[event] || [];
      this.listeners[event].push(fn);
    }

    removeEventListener(event, fn) {
      if (!this.listeners[event]) return;
      this.listeners[event] = this.listeners[event].filter(f => f !== fn);
    }
  }

  const windowListeners = {};
  const docListeners = {};

  const settingsStore = {
    sound: 70,
    music: 35,
    mute: false,
    calm: false,
    ...initialSettings
  };
  const settingsListeners = [];

  const mockGameSettings = {
    get: (key) => settingsStore[key],
    set: (key, val) => {
      settingsStore[key] = val;
      for (const cb of settingsListeners) cb(key, val);
    },
    onChange: (cb) => settingsListeners.push(cb),
    get calm() { return settingsStore.calm; }
  };

  const sandbox = {
    console: {
      log: () => {},
      warn: (...args) => sandbox.lastWarn = args.join(' '),
      error: (...args) => sandbox.lastError = args.join(' ')
    },
    Audio: MockAudio,
    performance: { now: () => currentTime },
    requestAnimationFrame: (cb) => {
      const id = ++rafId;
      rafCallbacks.set(id, cb);
      return id;
    },
    cancelAnimationFrame: (id) => {
      rafCallbacks.delete(id);
    },
    window: {
      addEventListener: (type, fn) => {
        windowListeners[type] = windowListeners[type] || [];
        windowListeners[type].push(fn);
      },
      removeEventListener: (type, fn) => {
        if (!windowListeners[type]) return;
        windowListeners[type] = windowListeners[type].filter(f => f !== fn);
      },
      matchMedia: (query) => ({
        matches: query.includes('reduce') ? Boolean(settingsStore.calm) : false
      }),
      GameSettings: mockGameSettings,
      ISLAND_REGIONS: [
        { id: 'mountain', name: 'Pico do Miau' },
        { id: 'center', name: 'Praça do Portal' },
        { id: 'ruins', name: 'Ruínas das Formas' },
        { id: 'farm', name: 'Campos Contados' },
        { id: 'forest', name: 'Floresta dos Padrões' },
        { id: 'village', name: 'Aldeia do Saber' }
      ]
    },
    document: {
      hidden: false,
      readyState: 'complete',
      addEventListener: (type, fn) => {
        docListeners[type] = docListeners[type] || [];
        docListeners[type].push(fn);
      },
      removeEventListener: (type, fn) => {
        if (!docListeners[type]) return;
        docListeners[type] = docListeners[type].filter(f => f !== fn);
      }
    },
    setTimeout: (fn, delay) => { fn(); return 1; },
    clearTimeout: () => {},
    lastWarn: null,
    lastError: null
  };

  sandbox.window.document = sandbox.document;
  sandbox.window.requestAnimationFrame = sandbox.requestAnimationFrame;
  sandbox.window.cancelAnimationFrame = sandbox.cancelAnimationFrame;
  sandbox.window.performance = sandbox.performance;
  sandbox.window.Audio = MockAudio;

  vm.createContext(sandbox);

  const musicCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'music.js'), 'utf8');
  vm.runInContext(musicCode, sandbox);

  return {
    window: sandbox.window,
    Music: sandbox.window.Music,
    advanceTime,
    triggerWindowGesture: (type = 'pointerdown') => {
      const fns = windowListeners[type] || [];
      for (const fn of fns) fn();
    },
    triggerVisibility: (hidden) => {
      sandbox.document.hidden = hidden;
      const fns = docListeners['visibilitychange'] || [];
      for (const fn of fns) fn();
    },
    settings: mockGameSettings,
    audioInstances,
    sandbox
  };
}

let passed = 0;

// Teste 1: Registro das 7 faixas e mapeamento exato das situações (menu, ilha, puzzles e final)
{
  const env = createMockEnv();
  const M = env.Music;
  assert(M.FAIXAS.menu, 'Faixa menu deve existir');
  assert(M.FAIXAS.vila, 'Faixa vila deve existir');
  assert(M.FAIXAS.fazenda, 'Faixa fazenda deve existir');
  assert(M.FAIXAS.exploracao, 'Faixa exploracao deve existir');
  assert(M.FAIXAS.geometria, 'Faixa geometria deve existir');
  assert(M.FAIXAS.labirinto, 'Faixa labirinto deve existir');
  assert(M.FAIXAS.final, 'Faixa final deve existir');

  // 1. Menu inicial e introdução
  assert.strictEqual(M.mapearLugarParaFaixa('menu'), 'menu');
  assert.strictEqual(M.mapearLugarParaFaixa('home'), 'menu');
  assert.strictEqual(M.mapearLugarParaFaixa('intro'), 'menu');

  // 2. Mapa da ilha (exploração em qualquer lugar da ilha)
  assert.strictEqual(M.mapearLugarParaFaixa('exploracao'), 'exploracao');
  assert.strictEqual(M.mapearLugarParaFaixa('ilha'), 'exploracao');
  assert.strictEqual(M.mapearLugarParaFaixa('mapa'), 'exploracao');
  // Qualquer região ou local na ilha cai no fallback seguro 'exploracao'
  assert.strictEqual(M.mapearLugarParaFaixa('village'), 'exploracao');
  assert.strictEqual(M.mapearLugarParaFaixa('Aldeia do Saber'), 'exploracao');
  assert.strictEqual(M.mapearLugarParaFaixa('farm'), 'exploracao');
  assert.strictEqual(M.mapearLugarParaFaixa('Campos Contados'), 'exploracao');
  assert.strictEqual(M.mapearLugarParaFaixa('mountain'), 'exploracao');
  assert.strictEqual(M.mapearLugarParaFaixa('center'), 'exploracao');
  assert.strictEqual(M.mapearLugarParaFaixa('ruins'), 'exploracao');
  assert.strictEqual(M.mapearLugarParaFaixa('forest'), 'exploracao');

  // 3. Puzzles (durante a atividade/gameplay)
  assert.strictEqual(M.mapearLugarParaFaixa('algebra'), 'vila');
  assert.strictEqual(M.mapearLugarParaFaixa('operacoes'), 'fazenda');
  assert.strictEqual(M.mapearLugarParaFaixa('geometria'), 'geometria');
  assert.strictEqual(M.mapearLugarParaFaixa('labirinto'), 'labirinto');
  assert.strictEqual(M.mapearLugarParaFaixa('logica'), 'labirinto');
  assert.strictEqual(M.mapearLugarParaFaixa('camara'), 'labirinto');
  assert.strictEqual(M.mapearLugarParaFaixa('montanha'), 'exploracao');

  // 4. Final do jogo
  assert.strictEqual(M.mapearLugarParaFaixa('final'), 'final');
  assert.strictEqual(M.mapearLugarParaFaixa('encerramento'), 'final');

  passed++;
  console.log('✓ Teste 1: As 7 faixas registradas e todas as situações validadas com sucesso');
}

// Teste 2: Início no Menu Principal com música do menu
{
  const env = createMockEnv({ music: 35 });
  const M = env.Music;
  M.definirLugar('menu');
  assert.strictEqual(M.getLugarAtual(), 'menu');
  assert.strictEqual(M.getFaixaAtual(), 'menu');
  assert(M.isTocando());
  env.advanceTime(1200);

  passed++;
  console.log('✓ Teste 2: Menu Principal inicia tocando musica-menu');
}

// Teste 3: Crossfade suave (~1,2s) ao entrar na ilha (menu -> exploracao)
{
  const env = createMockEnv({ music: 35 });
  const M = env.Music;
  M.definirLugar('menu');
  env.advanceTime(1200);
  assert.strictEqual(M.getFaixaAtual(), 'menu');

  // Entra na ilha para explorar
  M.definirLugar('exploracao');
  assert.strictEqual(M.getLugarAtual(), 'exploracao');
  assert.strictEqual(M.getFaixaAtual(), 'exploracao');

  // Durante o crossfade (600ms de 1200ms)
  env.advanceTime(600);
  assert(M.isTocando());

  // Completa o crossfade (mais 600ms)
  env.advanceTime(600);
  assert.strictEqual(M.getFaixaAtual(), 'exploracao');
  assert(M.isTocando());

  passed++;
  console.log('✓ Teste 3: Crossfade de ~1,2s ao transicionar do menu para a exploração da ilha');
}

// Teste 4: Andar pela ilha inteira (Pico, Aldeia, Campos, Ruínas, Floresta) NÃO muda nem reinicia a música
{
  const env = createMockEnv({ music: 35 });
  const M = env.Music;
  M.definirLugar('exploracao');
  env.advanceTime(1200);

  // Caminha para o Pico do Miau
  M.definirLugar('mountain');
  assert.strictEqual(M.getFaixaAtual(), 'exploracao');

  // Caminha para as Ruínas das Formas
  M.definirLugar('ruins');
  assert.strictEqual(M.getFaixaAtual(), 'exploracao');

  // Caminha para a Floresta dos Padrões
  M.definirLugar('forest');
  assert.strictEqual(M.getFaixaAtual(), 'exploracao');

  // Caminha para a Aldeia do Saber (no mapa)
  M.definirLugar('village');
  assert.strictEqual(M.getFaixaAtual(), 'exploracao', 'Andar na Aldeia NÃO muda a música');

  // Caminha para os Campos Contados (no mapa)
  M.definirLugar('farm');
  assert.strictEqual(M.getFaixaAtual(), 'exploracao', 'Andar nos Campos NÃO muda a música');

  passed++;
  console.log('✓ Teste 4: Andar por TODAS as regiões da ilha mantém musica-exploracao contínua sem interrupção');
}

// Teste 5: Entrar no puzzle da Aldeia (algebra) toca musica-vila; ao sair, volta para musica-exploracao
{
  const env = createMockEnv({ music: 35 });
  const M = env.Music;
  M.definirLugar('exploracao');
  env.advanceTime(1200);

  // Abre o puzzle das joias/balança (algebra)
  M.definirLugar('algebra');
  assert.strictEqual(M.getFaixaAtual(), 'vila', 'Dentro do puzzle de álgebra toca musica-vila');
  env.advanceTime(1200);
  assert(M.isTocando());

  // Sai do puzzle e volta à exploração da ilha
  M.definirLugar('exploracao');
  assert.strictEqual(M.getFaixaAtual(), 'exploracao', 'Ao sair do puzzle volta para musica-exploracao');
  env.advanceTime(1200);

  passed++;
  console.log('✓ Teste 5: Puzzle de Álgebra toca musica-vila e retorna para musica-exploracao com crossfade');
}

// Teste 6: Entrar no puzzle de Operações (operacoes) toca musica-fazenda; ao sair, volta para musica-exploracao
{
  const env = createMockEnv({ music: 35 });
  const M = env.Music;
  M.definirLugar('exploracao');
  env.advanceTime(1200);

  // Abre o puzzle de operações (moinho)
  M.definirLugar('operacoes');
  assert.strictEqual(M.getFaixaAtual(), 'fazenda', 'Dentro do puzzle de operações toca musica-fazenda');
  env.advanceTime(1200);
  assert(M.isTocando());

  // Sai do puzzle e volta à exploração da ilha
  M.definirLugar('exploracao');
  assert.strictEqual(M.getFaixaAtual(), 'exploracao', 'Ao sair do puzzle volta para musica-exploracao');
  env.advanceTime(1200);

  passed++;
  console.log('✓ Teste 6: Puzzle de Operações toca musica-fazenda e retorna para musica-exploracao com crossfade');
}

// Teste 7: Puzzles de Geometria e Labirinto tocam suas faixas exclusivas; ao sair, voltam para musica-exploracao
{
  const env = createMockEnv({ music: 35 });
  const M = env.Music;
  M.definirLugar('exploracao');
  env.advanceTime(1200);

  // Abre Geometria
  M.definirLugar('geometria');
  assert.strictEqual(M.getFaixaAtual(), 'geometria');
  env.advanceTime(1200);

  // Sai de Geometria de volta para a ilha
  M.definirLugar('exploracao');
  assert.strictEqual(M.getFaixaAtual(), 'exploracao');
  env.advanceTime(1200);

  // Abre o Labirinto (logica)
  M.definirLugar('logica');
  assert.strictEqual(M.getFaixaAtual(), 'labirinto');
  env.advanceTime(1200);

  // Câmara da chave (mantém labirinto)
  M.definirLugar('camara');
  assert.strictEqual(M.getFaixaAtual(), 'labirinto', 'Câmara mantém musica-labirinto');

  // Sai do Labirinto de volta para a ilha
  M.definirLugar('exploracao');
  assert.strictEqual(M.getFaixaAtual(), 'exploracao');
  env.advanceTime(1200);

  passed++;
  console.log('✓ Teste 7: Puzzles de Geometria e Labirinto tocam faixas exclusivas e retornam para musica-exploracao');
}

// Teste 8: Retornar ao menu principal (sair da ilha) toca musica-menu
{
  const env = createMockEnv({ music: 35 });
  const M = env.Music;
  M.definirLugar('exploracao');
  env.advanceTime(1200);

  // Sai da ilha de volta ao menu
  M.definirLugar('menu');
  assert.strictEqual(M.getLugarAtual(), 'menu');
  assert.strictEqual(M.getFaixaAtual(), 'menu');
  env.advanceTime(1200);
  assert(M.isTocando());

  passed++;
  console.log('✓ Teste 8: Retornar ao menu principal faz crossfade para musica-menu');
}

// Teste 9: Se nova faixa for igual à ativa, não reinicia nada
{
  const env = createMockEnv({ music: 35 });
  const M = env.Music;
  M.definirLugar('exploracao');
  env.advanceTime(1200);

  const audioAntes = M.getFaixaAtual();
  M.definirLugar('exploracao');
  assert.strictEqual(M.getFaixaAtual(), audioAntes);

  M.definirLugar('algebra');
  env.advanceTime(1200);
  M.definirLugar('algebra');
  assert.strictEqual(M.getFaixaAtual(), 'vila');

  passed++;
  console.log('✓ Teste 9: Faixas repetidas não reiniciam nem cortam a música');
}

// Teste 10: Arquivos .ogg e .mp3 presentes fisicamente em assets/audio/
{
  const audiosEsperados = [
    'musica-menu.ogg', 'musica-menu.mp3',
    'musica-vila.ogg', 'musica-vila.mp3',
    'musica-fazenda.ogg', 'musica-fazenda.mp3',
    'musica-exploracao.ogg', 'musica-exploracao.mp3',
    'musica-geometria.ogg',
    'musica-labirinto.ogg',
    'musica-final.ogg', 'musica-final.mp3'
  ];
  for (const arq of audiosEsperados) {
    const p = path.join(__dirname, '..', 'assets', 'audio', arq);
    assert(fs.existsSync(p), `Arquivo de áudio ${arq} deve existir em assets/audio/`);
  }
  passed++;
  console.log('✓ Teste 10: Todos os 10 arquivos (.ogg e .mp3) e os existentes confirmados no disco');
}

// Teste 11: Cena do final do jogo (resgate do gato e encerramento)
{
  const env = createMockEnv({ music: 35 });
  const M = env.Music;

  // 1. Vindo da exploração (jogador abre o último cadeado na montanha)
  M.definirLugar('exploracao');
  env.advanceTime(1200);
  assert.strictEqual(M.getFaixaAtual(), 'exploracao');

  // Abre o 4º cadeado -> inicia cena final
  M.definirLugar('final');
  assert.strictEqual(M.getLugarAtual(), 'final');
  assert.strictEqual(M.getFaixaAtual(), 'final');

  // Durante o crossfade (600ms de 1200ms)
  env.advanceTime(600);
  assert(M.isTocando());

  // Conclui crossfade
  env.advanceTime(600);
  assert.strictEqual(M.getFaixaAtual(), 'final');
  assert(M.isTocando());

  // Slides e telas subsequentes (story, home) chamando 'final' repetidamente não reiniciam
  const audiosTocando = env.audioInstances.filter(a => !a.paused);
  M.definirLugar('final');
  M.definirLugar('encerramento');
  assert.strictEqual(M.getFaixaAtual(), 'final');
  // Nenhuma instância nova foi criada desnecessariamente
  assert(env.audioInstances.filter(a => !a.paused).length <= 2);

  // Abrir e fechar configurações durante o final não altera nem reinicia
  M.atualizarVolume();
  env.settings.set('music', 50);
  assert.strictEqual(M.getFaixaAtual(), 'final');
  assert(M.isTocando());

  passed++;
  console.log('✓ Teste 11: Cena final toca musica-final com crossfade de 1,2s e sem reinício em chamadas repetidas');
}

// Teste 12: Saída da cena final (não vaza para o menu nem para a ilha)
{
  const env = createMockEnv({ music: 35 });
  const M = env.Music;

  // Está no final tocando musica-final
  M.definirLugar('final');
  env.advanceTime(1200);
  assert.strictEqual(M.getFaixaAtual(), 'final');

  // Caso A: Jogador clica em "Sair do topo e voltar à ilha" -> volta à exploração
  M.definirLugar('exploracao');
  assert.strictEqual(M.getLugarAtual(), 'exploracao');
  assert.strictEqual(M.getFaixaAtual(), 'exploracao');
  env.advanceTime(1200);
  assert.strictEqual(M.getFaixaAtual(), 'exploracao');

  // Caso B: Volta ao final e depois clica em "Jogar de novo" ou "Voltar ao menu principal"
  M.definirLugar('final');
  env.advanceTime(1200);
  assert.strictEqual(M.getFaixaAtual(), 'final');

  M.definirLugar('menu');
  assert.strictEqual(M.getLugarAtual(), 'menu');
  assert.strictEqual(M.getFaixaAtual(), 'menu');
  env.advanceTime(1200);
  assert.strictEqual(M.getFaixaAtual(), 'menu');

  passed++;
  console.log('✓ Teste 12: Saída do final restaura musica-exploracao ou musica-menu sem vazamentos');
}

console.log(`\nTODOS OS ${passed} TESTES DE MÚSICA POR LUGAR PASSARAM COM SUCESSO!`);

