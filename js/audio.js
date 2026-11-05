/* Gerenciamento de áudio: sintetizador de efeitos e trilhas sonoras locais. */
window.GameAudio = (() => {
  'use strict';

  let context, effectsGain, musicGain, musicTimer;
  let soundVolume = 70, musicVolume = 35, enabled = false, noteIndex = 0;
  const melody = [261.63,329.63,392,329.63,293.66,349.23,440,349.23,261.63,329.63,392,523.25,440,392,329.63,293.66];

  /* ---------- Efeitos Sintetizados (Web Audio API) ---------- */
  function prepare() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return false;
    if (!context) {
      context = new AudioCtx();
      effectsGain = context.createGain();
      musicGain = context.createGain();
      effectsGain.connect(context.destination);
      musicGain.connect(context.destination);
      setVolumes(soundVolume, musicVolume);
    }
    if (context.state === 'suspended') context.resume().catch(() => {});
    return true;
  }

  function tone(frequency, duration, gain, type = 'sine') {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    const now = context.currentTime;
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(.45, now + .025);
    envelope.gain.exponentialRampToValueAtTime(.001, now + duration);
    oscillator.connect(envelope);
    envelope.connect(gain);
    oscillator.start(now);
    oscillator.stop(now + duration + .02);
    oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
  }

  function click() { if (prepare()) tone(660, .09, effectsGain, 'triangle'); }
  function success() {
    if (prepare()) {
      tone(523.25, .25, effectsGain);
      setTimeout(() => tone(783.99, .3, effectsGain), 110);
    }
  }

  function page() {
    if (!prepare()) return;
    const length = Math.floor(context.sampleRate * .32);
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / length);
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();
    const now = context.currentTime;
    source.buffer = buffer;
    filter.type = 'bandpass';
    filter.Q.value = .9;
    filter.frequency.setValueAtTime(2600, now);
    filter.frequency.exponentialRampToValueAtTime(700, now + .3);
    envelope.gain.value = .55;
    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(effectsGain);
    source.start(now);
    source.onended = () => { source.disconnect(); filter.disconnect(); envelope.disconnect(); };
  }

  function toggle(on) {
    if (!prepare()) return;
    tone(on ? 440 : 587.33, .07, effectsGain, 'triangle');
    setTimeout(() => { if (context) tone(on ? 659.25 : 370, .09, effectsGain, 'triangle'); }, 50);
  }

  function nextNote() {
    if (!enabled || !context) return;
    tone(melody[noteIndex], .28, musicGain, 'sine');
    noteIndex = (noteIndex + 1) % melody.length;
    musicTimer = setTimeout(nextNote, 320);
  }

  function toggleMusic() {
    if (geometryActive) return false; // Não sobrepor música em execução
    if (!prepare()) return false;
    enabled = !enabled;
    clearTimeout(musicTimer);
    setVolumes(soundVolume, musicVolume);
    if (enabled) nextNote();
    return enabled;
  }

  function stopMusic() {
    enabled = false;
    clearTimeout(musicTimer);
    if (context) {
      musicGain.gain.setTargetAtTime(0, context.currentTime, .06);
    }
  }

  /* ---------- Música de Geometria (HTMLAudioElement) ---------- */
  let geometryAudio = null;
  let geometryActive = false;
  let geometryFading = false;
  let geometryFadeRaf = null;
  let geometryPendingPlay = false;
  let geometryTargetVolume = 0.35;
  let gestureArmed = false;
  let gestureHandler = null;
  const gestureOpts = { capture: true, passive: true };

  function chooseGeometrySrc() {
    if (typeof Audio === 'undefined') return 'assets/audio/musica-geometria.ogg';
    try {
      const probe = new Audio();
      if (probe.canPlayType) {
        const ogg = probe.canPlayType('audio/ogg; codecs="opus"') || probe.canPlayType('audio/ogg');
        if (ogg === 'probably' || ogg === 'maybe') return 'assets/audio/musica-geometria.ogg';
        const mp3 = probe.canPlayType('audio/mpeg');
        if (mp3 === 'probably' || mp3 === 'maybe') return 'assets/audio/musica-geometria.mp3';
      }
    } catch (_) {}
    return 'assets/audio/musica-geometria.ogg';
  }

  function initGeometryAudio() {
    if (geometryAudio || typeof Audio === 'undefined') return geometryAudio;
    try {
      geometryAudio = new Audio();
      geometryAudio.loop = true;
      geometryAudio.preload = 'auto';
      geometryAudio.src = chooseGeometrySrc();
      geometryAudio.onerror = () => {
        if (geometryAudio.src && geometryAudio.src.endsWith('.ogg')) {
          geometryAudio.src = 'assets/audio/musica-geometria.mp3';
          geometryAudio.load();
        } else {
          console.warn('[GameAudio] Não foi possível carregar a música de Geometria.');
        }
      };
    } catch (e) {
      console.warn('[GameAudio] Falha ao instanciar áudio de Geometria:', e);
    }
    return geometryAudio;
  }

  function isCalm() {
    return Boolean(window.GameSettings?.calm) ||
      (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function cancelGeometryFade() {
    if (geometryFadeRaf) {
      cancelAnimationFrame(geometryFadeRaf);
      geometryFadeRaf = null;
    }
    geometryFading = false;
  }

  function fadeGeometryVolume(fromVol, toVol, durationSec, onEnd) {
    cancelGeometryFade();
    if (!geometryAudio) { if (onEnd) onEnd(); return; }

    geometryTargetVolume = Math.max(0, Math.min(1, toVol));
    if (durationSec <= 0 || isCalm()) {
      geometryAudio.volume = geometryTargetVolume;
      if (onEnd) onEnd();
      return;
    }

    geometryFading = true;
    const startTime = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const durationMs = durationSec * 1000;
    const startVol = Math.max(0, Math.min(1, fromVol));

    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      const curVol = startVol + (geometryTargetVolume - startVol) * progress;
      if (geometryAudio) {
        geometryAudio.volume = Math.max(0, Math.min(1, curVol));
      }
      if (progress < 1 && geometryFading) {
        geometryFadeRaf = requestAnimationFrame(step);
      } else {
        geometryFading = false;
        geometryFadeRaf = null;
        if (geometryAudio) geometryAudio.volume = geometryTargetVolume;
        if (onEnd) onEnd();
      }
    }
    geometryFadeRaf = requestAnimationFrame(step);
  }

  function disarmPendingGesture() {
    if (!gestureArmed || !gestureHandler) return;
    window.removeEventListener('pointerdown', gestureHandler, gestureOpts);
    window.removeEventListener('keydown', gestureHandler, gestureOpts);
    window.removeEventListener('touchstart', gestureHandler, gestureOpts);
    gestureArmed = false;
    gestureHandler = null;
  }

  function armPendingGesture() {
    if (gestureArmed) return;
    gestureArmed = true;
    gestureHandler = function onGesture() {
      if (geometryPendingPlay && geometryActive && geometryAudio) {
        geometryPendingPlay = false;
        geometryAudio.play().then(() => {
          const targetVol = Math.max(0, Math.min(1, musicVolume / 100));
          fadeGeometryVolume(geometryAudio.volume, targetVol, 1.0);
        }).catch(() => {});
      }
      disarmPendingGesture();
    };
    window.addEventListener('pointerdown', gestureHandler, gestureOpts);
    window.addEventListener('keydown', gestureHandler, gestureOpts);
    window.addEventListener('touchstart', gestureHandler, gestureOpts);
  }

  /* Ponto de extensão para música tema (conforme regra de convivência) */
  let themeMusicHandle = null;
  function pauseThemeMusic(fadeSec = 0.5) {
    if (themeMusicHandle && typeof themeMusicHandle.pause === 'function') {
      themeMusicHandle.pause(fadeSec);
    }
  }
  function resumeThemeMusic(fadeSec = 0.5) {
    if (themeMusicHandle && typeof themeMusicHandle.resume === 'function') {
      themeMusicHandle.resume(fadeSec);
    }
  }
  function registerThemeMusic(handle) {
    themeMusicHandle = handle;
  }

  function playGeometryMusic() {
    if (geometryActive && geometryAudio && !geometryAudio.paused && !geometryFading) return;
    geometryActive = true;
    geometryPendingPlay = false;

    // Se a música de teste sintetizada estiver ligada, para-a
    stopMusic();

    // Pausa a música tema se existir (fade curto de ~0,5 s)
    pauseThemeMusic(0.5);

    const audio = initGeometryAudio();
    if (!audio) return;

    cancelGeometryFade();

    try {
      audio.currentTime = 0;
    } catch (_) {}

    const targetVol = Math.max(0, Math.min(1, musicVolume / 100));
    audio.volume = 0;

    const promise = audio.play();
    if (promise !== undefined) {
      promise.catch(() => {
        if (geometryActive) {
          geometryPendingPlay = true;
          armPendingGesture();
        }
      });
    }

    fadeGeometryVolume(0, targetVol, 1.0);
  }

  function stopGeometryMusic() {
    geometryActive = false;
    geometryPendingPlay = false;
    disarmPendingGesture();

    if (!geometryAudio) {
      resumeThemeMusic(0.5);
      return;
    }

    const currentVol = geometryAudio.volume;
    fadeGeometryVolume(currentVol, 0, 0.7, () => {
      try {
        geometryAudio.pause();
        geometryAudio.currentTime = 0;
      } catch (_) {}
      resumeThemeMusic(0.5);
    });
  }

  function preloadGeometryMusic() {
    const audio = initGeometryAudio();
    if (audio && typeof audio.load === 'function') {
      try { audio.load(); } catch (_) {}
    }
  }

  /* Volume e mudo em tempo real */
  function setVolumes(sound, music) {
    soundVolume = sound;
    musicVolume = music;
    if (context) {
      effectsGain.gain.setTargetAtTime(sound / 100 * .16, context.currentTime, .03);
      musicGain.gain.setTargetAtTime(enabled ? music / 100 * .12 : 0, context.currentTime, .06);
    }
    const target = Math.max(0, Math.min(1, music / 100));
    geometryTargetVolume = target;
    if (geometryActive && geometryAudio) {
      if (geometryFading) {
        cancelGeometryFade();
      }
      geometryAudio.volume = target;
    }
  }

  /* Pausa quando a aba fica oculta e retoma ao voltar */
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (geometryActive && geometryAudio && !geometryAudio.paused) {
          geometryAudio.pause();
        }
      } else {
        if (geometryActive && geometryAudio) {
          geometryAudio.play().catch(() => {
            geometryPendingPlay = true;
            armPendingGesture();
          });
        }
      }
    });
  }

  return {
    click,
    success,
    page,
    toggle,
    setVolumes,
    toggleMusic,
    stopMusic,
    playGeometryMusic,
    stopGeometryMusic,
    preloadGeometryMusic,
    isGeometryMusicPlaying: () => geometryActive,
    pauseThemeMusic,
    resumeThemeMusic,
    registerThemeMusic
  };
})();
