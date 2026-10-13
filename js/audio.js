/* Áudio sintetizado só para testar volumes, sem arquivos ou bibliotecas. */
window.GameAudio = (() => {
  let context, effectsGain, musicGain, musicTimer;
  let soundVolume = 70, musicVolume = 35, enabled = false, noteIndex = 0;
  const melody = [261.63,329.63,392,329.63,293.66,349.23,440,349.23,261.63,329.63,392,523.25,440,392,329.63,293.66];
  function prepare() {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return false;
    if (!context) {
      context = new Audio();
      effectsGain = context.createGain(); musicGain = context.createGain();
      effectsGain.connect(context.destination); musicGain.connect(context.destination);
      setVolumes(soundVolume,musicVolume);
    }
    if (context.state === 'suspended') context.resume().catch(() => {});
    return true;
  }
  function tone(frequency,duration,gain,type='sine') {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = type; oscillator.frequency.value = frequency;
    const now = context.currentTime;
    envelope.gain.setValueAtTime(0,now);
    envelope.gain.linearRampToValueAtTime(.45,now+.025);
    envelope.gain.exponentialRampToValueAtTime(.001,now+duration);
    oscillator.connect(envelope); envelope.connect(gain);
    oscillator.start(now); oscillator.stop(now+duration+.02);
    oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
  }
  function click() { if (prepare()) tone(660,.09,effectsGain,'triangle'); }
  function success() { if (prepare()) { tone(523.25,.25,effectsGain); setTimeout(() => tone(783.99,.3,effectsGain),110); } }
  function setVolumes(sound,music) {
    soundVolume = sound; musicVolume = music;
    if (context) {
      effectsGain.gain.setTargetAtTime(sound/100*.16,context.currentTime,.03);
      musicGain.gain.setTargetAtTime(enabled ? music/100*.12 : 0,context.currentTime,.06);
    }
  }
  function nextNote() {
    if (!enabled) return;
    if (!document.hidden) tone(melody[noteIndex++ % melody.length],.75,musicGain);
    musicTimer = setTimeout(nextNote,620);
  }
  function toggleMusic() {
    if (!prepare()) return false;
    enabled = !enabled;
    clearTimeout(musicTimer);
    setVolumes(soundVolume,musicVolume);
    if (enabled) nextNote();
    return enabled;
  }
  function stopMusic() { enabled=false; clearTimeout(musicTimer); setVolumes(soundVolume,musicVolume); }
  return { click, success, setVolumes, toggleMusic, stopMusic };
})();
