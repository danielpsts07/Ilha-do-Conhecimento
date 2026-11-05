/* Gerenciador central de trilhas musicais (Ilha do Conhecimento).
   Suporta registro de faixas, mapeamento cena -> faixa, loop contínuo e fades suaves. */
window.Music = (() => {
  'use strict';

  const MUSIC_GANHO_MESTRE = 0.8;
  const LOOP_MODO = 'nativo'; // Loop nativo (audio.loop = true). 90s a 96 BPM (36 compassos) repete perfeitamente.
  const FAIXA_CENA_CHAVE = 'labirinto'; // Permite trocar a música da câmara da chave no futuro se desejado

  // Registro de faixas de áudio disponíveis
  const FAIXAS = {
    labirinto: {
      arquivos: ['assets/audio/musica-labirinto.ogg', 'assets/audio/musica-labirinto.mp3'],
      ganho: 1.0
    },
    geometria: {
      arquivos: ['assets/audio/musica-geometria.ogg', 'assets/audio/musica-geometria.mp3'],
      ganho: 1.0
    }
  };

  // Mapeamento de cenas do jogo para a faixa correspondente
  const CENAS = {
    labirinto: 'labirinto',
    logica: 'labirinto',
    forest: 'labirinto',
    camara: FAIXA_CENA_CHAVE
  };

  const audios = {}; // faixaId -> HTMLAudioElement (instância única reutilizada)
  let cenaAtual = null;
  let faixaAtualId = null;
  let elementoAtual = null;

  let fadeToken = 0;
  let fadeRaf = null;
  let emFade = false;
  let volumeAlvoFade = 0;

  let aguardandoGesto = false;
  let gestoArmado = false;
  let gestoHandler = null;
  const gestoOpts = { capture: true, passive: true };

  let settingsRegistrado = false;

  function isCalm() {
    return Boolean(window.GameSettings?.calm) ||
      (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function escolherArquivo(arquivos) {
    if (typeof Audio === 'undefined') return arquivos[0];
    try {
      const probe = new Audio();
      if (probe.canPlayType) {
        const ogg = probe.canPlayType('audio/ogg; codecs="opus"') || probe.canPlayType('audio/ogg');
        if (ogg === 'probably' || ogg === 'maybe') {
          const oggSrc = arquivos.find(a => a.endsWith('.ogg'));
          if (oggSrc) return oggSrc;
        }
        const mp3 = probe.canPlayType('audio/mpeg');
        if (mp3 === 'probably' || mp3 === 'maybe') {
          const mp3Src = arquivos.find(a => a.endsWith('.mp3'));
          if (mp3Src) return mp3Src;
        }
      }
    } catch (_) {}
    return arquivos[0];
  }

  function obterAudio(faixaId) {
    if (audios[faixaId]) return audios[faixaId];
    const config = FAIXAS[faixaId];
    if (!config || !config.arquivos || !config.arquivos.length) return null;
    if (typeof Audio === 'undefined') return null;

    try {
      const audio = new Audio();
      audio.loop = (LOOP_MODO === 'nativo');
      audio.preload = 'auto';
      audio.src = escolherArquivo(config.arquivos);
      audio.onerror = () => {
        // Tenta fallback para mp3 se ogg falhou
        if (audio.src && audio.src.endsWith('.ogg')) {
          const mp3 = config.arquivos.find(a => a.endsWith('.mp3'));
          if (mp3 && !audio.src.endsWith('.mp3')) {
            audio.src = mp3;
            audio.load();
            return;
          }
        }
        console.warn(`[Music] Não foi possível carregar a música da faixa '${faixaId}'.`);
      };
      audios[faixaId] = audio;
      return audio;
    } catch (e) {
      console.warn(`[Music] Falha ao criar áudio para '${faixaId}':`, e);
      return null;
    }
  }

  function calcularVolume(faixaId, overrideMusicVol, overrideMute) {
    const config = FAIXAS[faixaId];
    const ganhoFaixa = config?.ganho ?? 1.0;
    const isMuted = (overrideMute !== undefined)
      ? Boolean(overrideMute)
      : Boolean(typeof window.GameSettings?.get === 'function' ? window.GameSettings.get('mute') : false);
    const rawMusicVol = (overrideMusicVol !== undefined)
      ? overrideMusicVol
      : (typeof window.GameSettings?.get === 'function' ? window.GameSettings.get('music') : 35);
    const musicVol = Number.isFinite(Number(rawMusicVol)) ? Number(rawMusicVol) : 35;
    return Math.max(0, Math.min(1, (musicVol / 100) * (isMuted ? 0 : 1) * MUSIC_GANHO_MESTRE * ganhoFaixa));
  }

  function cancelarFade() {
    if (fadeRaf) {
      cancelAnimationFrame(fadeRaf);
      fadeRaf = null;
    }
    emFade = false;
  }

  function fazerFadeVolume(audio, fromVol, toVol, duracaoMs, token, onEnd) {
    cancelarFade();
    if (!audio) { if (onEnd) onEnd(); return; }

    volumeAlvoFade = Math.max(0, Math.min(1, toVol));
    if (duracaoMs <= 0 || isCalm()) {
      audio.volume = volumeAlvoFade;
      if (onEnd) onEnd();
      return;
    }

    emFade = true;
    const startVol = Math.max(0, Math.min(1, fromVol));
    const startTime = (typeof performance !== 'undefined' ? performance.now() : Date.now());

    function step(now) {
      if (token !== fadeToken) {
        emFade = false;
        return;
      }
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duracaoMs);
      const curVol = startVol + (volumeAlvoFade - startVol) * progress;
      audio.volume = Math.max(0, Math.min(1, curVol));

      if (progress < 1 && emFade) {
        fadeRaf = requestAnimationFrame(step);
      } else {
        emFade = false;
        fadeRaf = null;
        audio.volume = volumeAlvoFade;
        if (onEnd && token === fadeToken) onEnd();
      }
    }
    fadeRaf = requestAnimationFrame(step);
  }

  function desarmarGesto() {
    if (!gestoArmado || !gestoHandler) return;
    window.removeEventListener('pointerdown', gestoHandler, gestoOpts);
    window.removeEventListener('keydown', gestoHandler, gestoOpts);
    window.removeEventListener('touchstart', gestoHandler, gestoOpts);
    gestoArmado = false;
    gestoHandler = null;
    aguardandoGesto = false;
  }

  function armarGesto() {
    if (gestoArmado) return;
    gestoArmado = true;
    gestoHandler = function onGesture() {
      if (aguardandoGesto && cenaAtual && elementoAtual) {
        aguardandoGesto = false;
        elementoAtual.play().then(() => {
          const target = calcularVolume(faixaAtualId);
          fazerFadeVolume(elementoAtual, elementoAtual.volume, target, 800, fadeToken);
        }).catch(() => {});
      }
      desarmarGesto();
    };
    window.addEventListener('pointerdown', gestoHandler, gestoOpts);
    window.addEventListener('keydown', gestoHandler, gestoOpts);
    window.addEventListener('touchstart', gestoHandler, gestoOpts);
  }

  function tentarRegistrarSettings() {
    if (settingsRegistrado) return true;
    if (typeof window !== 'undefined' && window.GameSettings && typeof window.GameSettings.onChange === 'function') {
      try {
        window.GameSettings.onChange((key) => {
          if (key === 'music' || key === 'mute' || key === 'calm') {
            atualizarVolume();
          }
        });
        settingsRegistrado = true;
        return true;
      } catch (_) {}
    }
    return false;
  }

  function entrarNaCena(nome) {
    if (!nome) return;
    tentarRegistrarSettings();

    const faixaId = CENAS[nome] || nome;
    if (!FAIXAS[faixaId]) return;

    // Se já estiver na mesma cena ou mesma faixa tocando sem estar saindo, não reinicia
    if (cenaAtual !== null && (cenaAtual === nome || faixaAtualId === faixaId) && elementoAtual && !elementoAtual.paused) {
      cenaAtual = nome;
      return;
    }

    cenaAtual = nome;
    faixaAtualId = faixaId;
    const token = ++fadeToken;

    // Para música sintetizada de teste se estiver ligada
    window.GameAudio?.stopMusic?.();

    // Se geometria estiver tocando via GameAudio, encerra para evitar sobreposição
    if (window.GameAudio?.isGeometryMusicPlaying?.()) {
      window.GameAudio?.stopGeometryMusic?.();
    }

    const audio = obterAudio(faixaId);
    if (!audio) return;
    elementoAtual = audio;

    cancelarFade();

    try {
      audio.currentTime = 0;
    } catch (_) {}

    const targetVol = calcularVolume(faixaId);
    audio.volume = 0;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        if (token === fadeToken && cenaAtual) {
          aguardandoGesto = true;
          armarGesto();
        }
      });
    }

    fazerFadeVolume(audio, 0, targetVol, 800, token);
  }

  function sairDaCena(nome) {
    tentarRegistrarSettings();
    if (nome && nome !== cenaAtual && nome !== faixaAtualId && CENAS[nome] !== faixaAtualId) {
      return;
    }

    cenaAtual = null;
    const token = ++fadeToken;
    desarmarGesto();

    const audio = elementoAtual;
    if (!audio) {
      faixaAtualId = null;
      return;
    }

    const startVol = audio.volume;
    fazerFadeVolume(audio, startVol, 0, 600, token, () => {
      if (token === fadeToken) {
        try {
          audio.pause();
          audio.currentTime = 0;
        } catch (_) {}
        if (elementoAtual === audio) {
          elementoAtual = null;
          faixaAtualId = null;
        }
      }
    });
  }

  function atualizarVolume(overrideMusicVol, overrideMute) {
    tentarRegistrarSettings();
    if (!elementoAtual || !faixaAtualId) return;
    const targetVol = calcularVolume(faixaAtualId, overrideMusicVol, overrideMute);
    if (emFade) {
      if (cenaAtual !== null) {
        volumeAlvoFade = targetVol;
      }
    } else {
      elementoAtual.volume = targetVol;
    }
  }

  function precarregarFaixa(faixaId) {
    const audio = obterAudio(faixaId);
    if (audio && typeof audio.load === 'function') {
      try { audio.load(); } catch (_) {}
    }
  }

  function precarregarCena(nome) {
    const faixaId = CENAS[nome] || nome;
    if (faixaId) precarregarFaixa(faixaId);
  }

  // Pausa ao ocultar a aba e retoma suavemente ao voltar
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (elementoAtual && !elementoAtual.paused) {
          elementoAtual.pause();
        }
      } else {
        if (cenaAtual && elementoAtual && elementoAtual.paused) {
          elementoAtual.play().then(() => {
            const target = calcularVolume(faixaAtualId);
            fazerFadeVolume(elementoAtual, elementoAtual.volume, target, 400, fadeToken);
          }).catch(() => {
            aguardandoGesto = true;
            armarGesto();
          });
        }
      }
    });

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', tentarRegistrarSettings, { once: true });
    } else {
      tentarRegistrarSettings();
    }
  }

  return {
    entrarNaCena,
    sairDaCena,
    atualizarVolume,
    precarregarFaixa,
    precarregarCena,
    isTocando: () => Boolean(elementoAtual && !elementoAtual.paused),
    getCenaAtual: () => cenaAtual,
    getFaixaAtual: () => faixaAtualId,
    FAIXAS,
    CENAS,
    FAIXA_CENA_CHAVE,
    LOOP_MODO,
    MUSIC_GANHO_MESTRE
  };
})();
