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
    if (geometryActive || window.Music?.isTocando?.()) return false; // Não sobrepor música em execução
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
    window.Music?.sairDaCena?.();
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
    window.Music?.atualizarVolume?.();
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
/* Áudio reutilizável com ciclo explícito: init no gesto, update no loop e dispose na saída.
   Mantém GameAudio intacto e preserva o construtor nativo window.Audio. */
window.IntroAudio = (() => {
  'use strict';
  const melody = [60, 64, 67, 69, 67, 64, 62, 60, 64, 67, 74, 69, 67, 62, 64, 60];
  let ctx, music, effects, envelope, synth, media, source, pad, notes = new Set();
  let playing = false, stopping = false, next = 0, position = 0, lastSound = -1, lastMusic = -1;
  function resume() {
    if (ctx?.state === 'suspended' && !document.hidden) ctx.resume().catch(() => {});
    if (media?.paused && playing && !stopping && !document.hidden) media.play().catch(() => {});
  }
  function visibility() {
    if (document.hidden) { ctx?.suspend().catch(() => {}); media?.pause(); }
    else { if (ctx) next = Math.max(next, ctx.currentTime); resume(); }
  }
  function syncVolumes() {
    if (!ctx) return;
    const get = window.GameSettings?.get, muted = Boolean(get?.('mute'));
    const sound = muted ? 0 : Math.max(0, Math.min(100, get?.('sound') ?? 70)) / 100;
    const volume = muted ? 0 : Math.max(0, Math.min(100, get?.('music') ?? get?.('sound') ?? 70)) / 100;
    if (sound !== lastSound) { effects.gain.setValueAtTime(sound, ctx.currentTime); lastSound = sound; }
    if (volume !== lastMusic) { music.gain.setValueAtTime(volume, ctx.currentTime); lastMusic = volume; }
  }
  function init() {
    if (ctx) { resume(); return; }
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return;
    try {
      ctx = new Context(); music = ctx.createGain(); effects = ctx.createGain();
      envelope = ctx.createGain(); synth = ctx.createGain(); envelope.gain.value = 0;
      synth.connect(envelope); envelope.connect(music); music.connect(ctx.destination); effects.connect(ctx.destination);
      document.addEventListener('visibilitychange', visibility);
      document.addEventListener('pointerdown', resume, true); document.addEventListener('keydown', resume, true);
      document.addEventListener('touchstart', resume, true); syncVolumes(); resume();
    } catch { dispose(); }
  }
  function note(midi, time, duration, gain, bus, type = 'triangle') {
    const oscillator = ctx.createOscillator(), level = ctx.createGain();
    oscillator.type = type;
    // MIDI para hertz: Lá4 (nota 69) vale 440 Hz; cada semitom multiplica por 2^(1/12).
    oscillator.frequency.value = 440 * 2 ** ((midi - 69) / 12);
    level.gain.setValueAtTime(0, time); level.gain.linearRampToValueAtTime(gain, time + .02);
    level.gain.exponentialRampToValueAtTime(.0001, time + duration);
    oscillator.connect(level); level.connect(bus); notes.add(oscillator);
    oscillator.onended = () => { oscillator.disconnect(); level.disconnect(); notes.delete(oscillator); };
    oscillator.start(time); oscillator.stop(time + duration);
    return oscillator;
  }
  function fallback() {
    if (!ctx || stopping) return;
    synth.gain.value = 1; next = ctx.currentTime; position = 0;
    if (!pad) {
      const oscillator = pad = ctx.createOscillator(), level = ctx.createGain(); pad.type = 'sine';
      pad.frequency.value = 440 * 2 ** ((48 - 69) / 12); level.gain.value = .04;
      pad.connect(level); level.connect(synth);
      pad.onended = () => { oscillator.disconnect(); level.disconnect(); }; pad.start();
    }
  }
  function playMusic(id) {
    if (!ctx || playing) return;
    playing = true; stopping = false; fallback();
    const now = ctx.currentTime;
    envelope.gain.cancelScheduledValues(now); envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(.15, now + .8);
    if (!id) return;
    // O arquivo é opcional; até carregar, a melodia sintetizada já acompanha a história.
    try {
      const player = media = new window.Audio(); media.loop = true; media.preload = 'auto';
      source = ctx.createMediaElementSource(media); source.connect(envelope);
      media.oncanplay = () => {
        if (!playing || stopping || media !== player) return;
        player.play().then(() => { if (media === player && synth && !stopping) synth.gain.value = 0; }).catch(() => {});
      };
      media.onerror = () => { if (media === player && playing && !stopping) { player.pause(); if (synth.gain.value === 0) fallback(); } };
      media.src = id; media.load();
    } catch { fallback(); }
  }
  function stopMusic(fadeMs = 600) {
    if (!ctx || stopping) return;
    stopping = true; const now = ctx.currentTime;
    const gain = envelope.gain;
    if (gain.cancelAndHoldAtTime) gain.cancelAndHoldAtTime(now);
    else { gain.cancelScheduledValues(now); gain.setValueAtTime(gain.value, now); }
    gain.linearRampToValueAtTime(0, now + fadeMs / 1000);
  }
  function sfx(id) {
    if (!ctx || document.hidden || stopping) return;
    syncVolumes(); const now = ctx.currentTime;
    if (id === 'final') {
      note(60, now, .4, .08, effects); note(64, now, .4, .08, effects); note(67, now, .4, .08, effects);
    } else { note(72, now, .15, .25, effects); note(79, now + .10, .15, .25, effects); }
  }
  function update(dt) {
    if (!ctx) return;
    syncVolumes(); if (!playing || stopping || document.hidden || ctx.state !== 'running' || synth.gain.value === 0) return;
    // Janela de 200 ms baseada no relógio de áudio; o game loop fornece as oportunidades de agendamento.
    if (next < ctx.currentTime) next = ctx.currentTime;
    while (next < ctx.currentTime + .2) {
      note(melody[position], next, .4, .35, synth); position = (position + 1) % melody.length; next += .45;
    }
  }
  function dispose() {
    document.removeEventListener('visibilitychange', visibility);
    document.removeEventListener('pointerdown', resume, true); document.removeEventListener('keydown', resume, true);
    document.removeEventListener('touchstart', resume, true);
    if (media) { media.oncanplay = media.onerror = null; media.pause(); media.removeAttribute('src'); media.load(); }
    for (const oscillator of notes) { try { oscillator.stop(); } catch {} oscillator.onended?.(); oscillator.onended = null; }
    notes.clear(); if (pad) { try { pad.stop(); } catch {} pad.onended?.(); pad.onended = null; pad = null; }
    source?.disconnect(); synth?.disconnect(); envelope?.disconnect(); music?.disconnect(); effects?.disconnect();
    if (ctx && ctx.state !== 'closed') ctx.close().catch(() => {});
    ctx = music = effects = envelope = synth = media = source = null;
    playing = stopping = false; lastSound = lastMusic = -1;
  }
  return {init, playMusic, stopMusic, sfx, update, dispose};
})();
