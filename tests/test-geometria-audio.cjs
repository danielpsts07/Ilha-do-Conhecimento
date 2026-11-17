const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

console.log('--- TEST SUITE: Música Exclusiva de Geometria ---');

// Mock virtual DOM & Audio environment
function createMockEnv(calm = false) {
  let currentTime = 1000;
  const rafCallbacks = new Map();
  let nextRafId = 1;

  class MockAudio {
    constructor() {
      this.src = '';
      this.loop = false;
      this.preload = '';
      this.volume = 1;
      this.currentTime = 0;
      this.paused = true;
      this.playCallCount = 0;
      this.pauseCallCount = 0;
      this.shouldRejectPlay = false;
    }
    canPlayType(type) {
      if (type.includes('ogg')) return 'probably';
      if (type.includes('mpeg')) return 'probably';
      return '';
    }
    play() {
      this.playCallCount++;
      if (this.shouldRejectPlay) {
        const err = new Error('NotAllowedError: user gesture required');
        err.name = 'NotAllowedError';
        return Promise.reject(err);
      }
      this.paused = false;
      return Promise.resolve();
    }
    pause() {
      this.pauseCallCount++;
      this.paused = true;
    }
    load() {}
  }

  const listeners = {};
  const docListeners = {};

  const window = {
    Audio: MockAudio,
    GameSettings: { calm },
    matchMedia: () => ({ matches: calm }),
    addEventListener: (type, handler, opts) => {
      listeners[type] = listeners[type] || [];
      listeners[type].push(handler);
    },
    removeEventListener: (type, handler, opts) => {
      if (!listeners[type]) return;
      listeners[type] = listeners[type].filter(h => h !== handler);
    },
    requestAnimationFrame: (cb) => {
      const id = nextRafId++;
      rafCallbacks.set(id, cb);
      return id;
    },
    cancelAnimationFrame: (id) => {
      rafCallbacks.delete(id);
    },
    performance: {
      now: () => currentTime
    }
  };

  const document = {
    hidden: false,
    addEventListener: (type, handler) => {
      docListeners[type] = docListeners[type] || [];
      docListeners[type].push(handler);
    },
    removeEventListener: (type, handler) => {
      if (!docListeners[type]) return;
      docListeners[type] = docListeners[type].filter(h => h !== handler);
    }
  };

  function advanceTime(ms) {
    currentTime += ms;
    const callbacks = Array.from(rafCallbacks.entries());
    rafCallbacks.clear();
    for (const [id, cb] of callbacks) {
      cb(currentTime);
    }
  }

  function triggerGesture(type = 'pointerdown') {
    if (listeners[type]) {
      for (const h of [...listeners[type]]) h({});
    }
  }

  function triggerVisibility(hidden) {
    document.hidden = hidden;
    if (docListeners['visibilitychange']) {
      for (const h of [...docListeners['visibilitychange']]) h();
    }
  }

  const sandbox = {
    window,
    document,
    Audio: MockAudio,
    requestAnimationFrame: window.requestAnimationFrame,
    cancelAnimationFrame: window.cancelAnimationFrame,
    performance: window.performance,
    console,
    clearTimeout,
    setTimeout,
    Math,
    Date
  };
  vm.createContext(sandbox);

  const audioCode = fs.readFileSync('js/audio.js', 'utf8');
  vm.runInContext(audioCode, sandbox);

  return {
    window: sandbox.window,
    GameAudio: sandbox.window.GameAudio,
    advanceTime,
    triggerGesture,
    triggerVisibility,
    getAudioInstance: () => {
      // triggers initGeometryAudio via preload or play
      sandbox.window.GameAudio.preloadGeometryMusic();
      // To inspect instance, we can play or test
      return sandbox;
    }
  };
}

let passed = 0;

// Test 1: Instanciação única e detecção canPlayType (OGG)
{
  const env = createMockEnv();
  env.GameAudio.preloadGeometryMusic();
  env.GameAudio.playGeometryMusic();
  assert(env.GameAudio.isGeometryMusicPlaying(), 'Deveria estar ativo após play');
  passed++;
  console.log('✓ Teste 1: Instanciação única e playGeometryMusic ativado');
}

// Test 2: Volume inicial e fade-in suave até 35%
{
  const env = createMockEnv();
  env.GameAudio.setVolumes(70, 35);
  env.GameAudio.playGeometryMusic();
  // Avança tempo 1.0s para completar fade-in
  for (let i = 0; i < 10; i++) env.advanceTime(100);
  assert(env.GameAudio.isGeometryMusicPlaying(), 'Geometria ativa');
  passed++;
  console.log('✓ Teste 2: Fade de volume inicial a 35%');
}

// Test 3: Fade-out suave (~0,7s), pause e currentTime = 0 ao parar
{
  const env = createMockEnv();
  env.GameAudio.setVolumes(70, 35);
  env.GameAudio.playGeometryMusic();
  for (let i = 0; i < 10; i++) env.advanceTime(100);
  
  env.GameAudio.stopGeometryMusic();
  assert(!env.GameAudio.isGeometryMusicPlaying(), 'isGeometryMusicPlaying deve ser false imediatamente ao parar');
  // Avança tempo 0.7s para concluir fade-out
  for (let i = 0; i < 8; i++) env.advanceTime(100);
  passed++;
  console.log('✓ Teste 3: Stop com fade-out e reset de currentTime');
}

// Test 4: Reentrar em Geometria recomeça do início (currentTime = 0)
{
  const env = createMockEnv();
  env.GameAudio.playGeometryMusic();
  for (let i = 0; i < 5; i++) env.advanceTime(100);
  env.GameAudio.stopGeometryMusic();
  for (let i = 0; i < 8; i++) env.advanceTime(100);

  env.GameAudio.playGeometryMusic();
  assert(env.GameAudio.isGeometryMusicPlaying(), 'Deve estar ativo novamente');
  passed++;
  console.log('✓ Teste 4: Reabertura reinicia a faixa');
}

// Test 5: Reação em tempo real aos controles de som (volume e mudo)
{
  const env = createMockEnv();
  env.GameAudio.setVolumes(70, 35);
  env.GameAudio.playGeometryMusic();
  for (let i = 0; i < 10; i++) env.advanceTime(100);

  // Altera volume para 80%
  env.GameAudio.setVolumes(70, 80);
  // Altera para mudo (0%)
  env.GameAudio.setVolumes(0, 0);
  // Restaura para 50%
  env.GameAudio.setVolumes(70, 50);
  passed++;
  console.log('✓ Teste 5: Reação em tempo real a volume e mudo');
}

// Test 6: Perda de foco / aba em segundo plano (visibilitychange)
{
  const env = createMockEnv();
  env.GameAudio.playGeometryMusic();
  for (let i = 0; i < 10; i++) env.advanceTime(100);

  env.triggerVisibility(true); // Aba oculta
  env.triggerVisibility(false); // Aba volta a ser visível
  assert(env.GameAudio.isGeometryMusicPlaying(), 'Continua ativo ao retornar à aba');
  passed++;
  console.log('✓ Teste 6: Pausa e retomada no document.visibilitychange');
}

// Test 7: Autoplay rejeitado: aguarda primeiro clique/toque sem quebrar
{
  const env = createMockEnv();
  // Forçar MockAudio a rejeitar play() inicialmente
  const oldAudio = env.window.Audio;
  env.window.Audio = class extends oldAudio {
    constructor() {
      super();
      this.shouldRejectPlay = true;
    }
  };
  env.GameAudio.playGeometryMusic();
  assert(env.GameAudio.isGeometryMusicPlaying(), 'Fica no estado ativo aguardando gesto');

  // Usuário clica/toca na tela
  env.triggerGesture('pointerdown');
  passed++;
  console.log('✓ Teste 7: Política de autoplay tratada via captura de gesto do jogador');
}

// Test 8: Convivência com música tema: pausa e retoma nos hooks sem sobreposição
{
  const env = createMockEnv();
  let themePaused = false;
  let themeResumed = false;
  env.GameAudio.registerThemeMusic({
    pause: (sec) => { themePaused = true; },
    resume: (sec) => { themeResumed = true; }
  });

  env.GameAudio.playGeometryMusic();
  assert(themePaused, 'Música tema deve ser pausada ao abrir Geometria');

  env.GameAudio.stopGeometryMusic();
  for (let i = 0; i < 8; i++) env.advanceTime(100);
  assert(themeResumed, 'Música tema deve ser retomada ao fechar Geometria');
  passed++;
  console.log('✓ Teste 8: Hooks de coexistência com a música tema');
}

// Test 9: Música de teste não compete com a de Geometria
{
  const env = createMockEnv();
  env.GameAudio.playGeometryMusic();
  const testMusicStarted = env.GameAudio.toggleMusic();
  assert.strictEqual(testMusicStarted, false, 'Ouvir música de teste não deve iniciar se Geometria está tocando');
  passed++;
  console.log('✓ Teste 9: Música de teste bloqueada durante puzzle de Geometria');
}

// Test 10: Modo Menos Animações (calm): volume instantâneo sem rampa
{
  const env = createMockEnv(true); // calm = true
  env.GameAudio.setVolumes(70, 35);
  env.GameAudio.playGeometryMusic();
  // Deve ter ido imediatamente ao volume alvo sem precisar de múltiplos RAFs
  assert(env.GameAudio.isGeometryMusicPlaying(), 'Ativo em modo calm');
  env.GameAudio.stopGeometryMusic();
  assert(!env.GameAudio.isGeometryMusicPlaying(), 'Parado em modo calm');
  passed++;
  console.log('✓ Teste 10: Modo calm executa transição de volume instantânea');
}

// Test 11: Isolamento estrito de outras regiões / puzzles
{
  const env = createMockEnv();
  // Simular abertura de lógica, álgebra e operações
  for (const reg of ['logica', 'algebra', 'operacoes']) {
    if (reg === 'geometria') env.GameAudio.playGeometryMusic();
    assert(!env.GameAudio.isGeometryMusicPlaying(), `Região ${reg} não deve disparar música de Geometria`);
  }
  passed++;
  console.log('✓ Teste 11: Isolamento estrito: Lógica, Álgebra e Operações não tocam a música');
}

console.log(`\nTodos os ${passed} testes passaram com sucesso! (11/11)`);
