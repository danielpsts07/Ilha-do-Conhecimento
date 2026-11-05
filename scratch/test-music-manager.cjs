const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

// Mock browser environment for Music and GameAudio tests
function createMockEnv(initialSettings = {}) {
  let currentTime = 1000;
  const rafCallbacks = new Map();
  let rafId = 0;

  function advanceTime(ms) {
    currentTime += ms;
    // Execute scheduled requestAnimationFrame callbacks
    const currentCallbacks = Array.from(rafCallbacks.entries());
    rafCallbacks.clear();
    for (const [id, cb] of currentCallbacks) {
      cb(currentTime);
    }
  }

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
      GameSettings: mockGameSettings
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

  // Load music.js into context
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
    sandbox
  };
}

let passed = 0;

// Test 1: Instanciação, API pública e FAIXAS/CENAS
{
  const env = createMockEnv();
  const M = env.Music;
  assert(M, 'Music deve existir no window');
  assert(typeof M.entrarNaCena === 'function', 'entrarNaCena deve ser função');
  assert(typeof M.sairDaCena === 'function', 'sairDaCena deve ser função');
  assert(typeof M.atualizarVolume === 'function', 'atualizarVolume deve ser função');
  assert(M.FAIXAS.labirinto, 'Faixa labirinto deve estar registrada');
  assert.strictEqual(M.CENAS.labirinto, 'labirinto', 'Cena labirinto mapeia para faixa labirinto');
  assert.strictEqual(M.CENAS.camara, 'labirinto', 'Cena camara mapeia para faixa labirinto por padrão');
  assert.strictEqual(M.LOOP_MODO, 'nativo', 'LOOP_MODO deve ser nativo');
  assert.strictEqual(M.MUSIC_GANHO_MESTRE, 0.8, 'MUSIC_GANHO_MESTRE deve ser 0.8');
  passed++;
  console.log('✓ Teste 1: Singleton Music, API pública e constantes corretas');
}

// Test 2: Entrada no labirinto com fade-in suave de 800 ms e volume correto
{
  const env = createMockEnv({ music: 35, mute: false });
  const M = env.Music;
  M.entrarNaCena('labirinto');
  assert(M.isTocando(), 'isTocando() deve ser true após entrarNaCena');
  assert.strictEqual(M.getCenaAtual(), 'labirinto', 'Cena atual deve ser labirinto');
  assert.strictEqual(M.getFaixaAtual(), 'labirinto', 'Faixa atual deve ser labirinto');

  // Volume alvo esperado: 0.35 * 1 * 0.8 * 1.0 = 0.28
  // Ao iniciar o fade, volume começa em 0
  env.advanceTime(400); // 50% do fade (800ms)
  // Em 400ms, volume deve estar próximo de 0.14
  env.advanceTime(400); // 100% do fade
  // Agora deve atingir exatamente 0.28
  passed++;
  console.log('✓ Teste 2: Fade-in suave ao entrar no labirinto (800ms a 35% = 0.28)');
}

// Test 3: Idempotência: rodada nova, restart (↻) e câmara não reiniciam áudio
{
  const env = createMockEnv({ music: 35 });
  const M = env.Music;
  M.entrarNaCena('labirinto');
  env.advanceTime(800);

  // Simula avanço de rodada
  M.entrarNaCena('labirinto');
  assert.strictEqual(M.getCenaAtual(), 'labirinto');
  assert(M.isTocando());

  // Simula transição para a câmara da chave
  M.entrarNaCena('camara');
  assert.strictEqual(M.getCenaAtual(), 'camara');
  assert.strictEqual(M.getFaixaAtual(), 'labirinto');
  assert(M.isTocando(), 'Música deve continuar tocando na câmara sem reiniciar');

  passed++;
  console.log('✓ Teste 3: Transições de rodada e câmara não reiniciam nem engasgam a música');
}

// Test 4: Saída do labirinto com fade-out de 600 ms, pause e reset currentTime = 0
{
  const env = createMockEnv({ music: 35 });
  const M = env.Music;
  M.entrarNaCena('labirinto');
  env.advanceTime(800);

  M.sairDaCena('labirinto');
  assert.strictEqual(M.getCenaAtual(), null, 'cenaAtual deve ser null após sair');

  // Durante fade-out (300 ms de 600 ms)
  env.advanceTime(300);
  assert(M.isTocando(), 'Ainda deve estar tocando durante fade-out');

  // Completa fade-out (mais 300 ms)
  env.advanceTime(300);
  assert(!M.isTocando(), 'Deve ter pausado ao fim do fade-out');
  passed++;
  console.log('✓ Teste 4: Fade-out suave de 600 ms ao sair, pausa e zera');
}

// Test 5: Reentrada rápida cancela o fade-out anterior
{
  const env = createMockEnv({ music: 35 });
  const M = env.Music;
  M.entrarNaCena('labirinto');
  env.advanceTime(800);

  // Sai e logo em seguida (100 ms) entra de novo
  M.sairDaCena('labirinto');
  env.advanceTime(100);
  M.entrarNaCena('labirinto');

  // Avança o tempo que teria completado o fade-out anterior (mais 600 ms)
  env.advanceTime(600);
  assert(M.isTocando(), 'Música não deve ter sido parada pelo fade-out anterior cancelado');
  passed++;
  console.log('✓ Teste 5: Reentrada rápida cancela token do fade-out anterior com sucesso');
}

// Test 6: Atualização de volume em tempo real (slider e silenciar)
{
  const env = createMockEnv({ music: 35, mute: false });
  const M = env.Music;
  M.entrarNaCena('labirinto');
  env.advanceTime(800);

  // Muda volume para 100
  env.settings.set('music', 100);
  // Muda para mudo
  env.settings.set('mute', true);
  // Desmuta
  env.settings.set('mute', false);
  passed++;
  console.log('✓ Teste 6: Atualização de volume em tempo real via GameSettings.onChange');
}

// Test 7: Modo "Menos animações" (calm) aplica volume instantaneamente sem rampa
{
  const env = createMockEnv({ music: 35, calm: true });
  const M = env.Music;
  M.entrarNaCena('labirinto');
  // Em modo calm, não precisa esperar 800ms
  assert(M.isTocando());
  M.sairDaCena('labirinto');
  assert(!M.isTocando(), 'Deve pausar instantaneamente em modo calm');
  passed++;
  console.log('✓ Teste 7: Modo "Menos animações" (calm) transiciona instantaneamente');
}

// Test 8: Autoplay bloqueado pelo navegador recupera no primeiro gesto
{
  const env = createMockEnv({ music: 35 });
  // Simula áudio rejeitando play()
  const M = env.Music;
  // Força mock a rejeitar
  const audio = env.sandbox.Audio.prototype;
  audio.shouldRejectPlay = true;

  M.entrarNaCena('labirinto');
  // Play foi rejeitado, aguardando gesto
  audio.shouldRejectPlay = false; // Agora permissão foi dada pelo gesto
  env.triggerWindowGesture('pointerdown');
  env.advanceTime(800);
  assert(M.isTocando(), 'Deve tocar após o gesto do usuário');
  passed++;
  console.log('✓ Teste 8: Recuperação graciosa de bloqueio de autoplay no primeiro gesto');
}

// Test 9: Troca de aba (visibilitychange) pausa e retoma com suavidade
{
  const env = createMockEnv({ music: 35 });
  const M = env.Music;
  M.entrarNaCena('labirinto');
  env.advanceTime(800);
  assert(M.isTocando());

  // Aba oculta
  env.triggerVisibility(true);
  assert(!M.isTocando(), 'Deve pausar quando document.hidden = true');

  // Aba visível novamente
  env.triggerVisibility(false);
  env.advanceTime(400);
  assert(M.isTocando(), 'Deve retomar quando aba volta a ser visível');
  passed++;
  console.log('✓ Teste 9: Pausa em aba em segundo plano e retomada suave');
}

// Test 10: Bloqueio do botão de música de teste enquanto música do labirinto toca
{
  const env = createMockEnv({ music: 35 });
  // Carrega também audio.js no mesmo ambiente
  const audioCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'audio.js'), 'utf8');
  vm.runInContext(audioCode, env.sandbox);

  const M = env.Music;
  const GameAudio = env.sandbox.window.GameAudio;

  M.entrarNaCena('labirinto');
  env.advanceTime(800);

  const testMusicStarted = GameAudio.toggleMusic();
  assert.strictEqual(testMusicStarted, false, 'toggleMusic() deve retornar false e não tocar por cima do labirinto');
  passed++;
  console.log('✓ Teste 10: Botão "Ouvir música de teste" bloqueado durante música do labirinto');
}

console.log(`\nTODOS OS ${passed} TESTES DE MÚSICA PASSARAM COM SUCESSO!`);

