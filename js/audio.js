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
  // Folhear: ruído curto filtrado, com o filtro descendo como o papel assentando.
  function page() {
    if (!prepare()) return;
    const length = Math.floor(context.sampleRate*.32), buffer = context.createBuffer(1,length,context.sampleRate), data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random()*2-1)*Math.sin(Math.PI*i/length);
    const source = context.createBufferSource(), filter = context.createBiquadFilter(), envelope = context.createGain(), now = context.currentTime;
    source.buffer = buffer; filter.type = 'bandpass'; filter.Q.value = .9;
    filter.frequency.setValueAtTime(2600,now); filter.frequency.exponentialRampToValueAtTime(700,now+.3);
    envelope.gain.value = .55;
    source.connect(filter); filter.connect(envelope); envelope.connect(effectsGain);
    source.start(now);
    source.onended = () => { source.disconnect(); filter.disconnect(); envelope.disconnect(); };
  }
  // Interruptores: nota subindo ao ligar e descendo ao desligar.
  function toggle(on) {
    if (!prepare()) return;
    tone(on?587.33:659.25,.1,effectsGain,'triangle');
    setTimeout(() => tone(on?880:440,.14,effectsGain,'triangle'),70);
  }
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
  return { click, success, page, toggle, setVolumes, toggleMusic, stopMusic };
})();
