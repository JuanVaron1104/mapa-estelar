/**
 * Audio module - Ambient space sound generator using Web Audio API
 */
const AudioManager = (() => {
  let ctx = null;
  let masterGain = null;
  let isPlaying = false;
  let isMuted = true;
  let nodes = [];

  function init() {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0;
      masterGain.connect(ctx.destination);
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  function createDrone(freq, detune, gainVal) {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.detune.value = detune;

    filter.type = 'lowpass';
    filter.frequency.value = 400;
    filter.Q.value = 1;

    gain.gain.value = gainVal;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    osc.start();

    nodes.push({ osc, gain, filter });
    return { osc, gain, filter };
  }

  function createNoise(gainVal) {
    if (!ctx) return;
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.01;
    }

    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    source.buffer = buffer;
    source.loop = true;

    filter.type = 'bandpass';
    filter.frequency.value = 200;
    filter.Q.value = 0.5;

    gain.gain.value = gainVal;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    source.start();

    nodes.push({ osc: source, gain, filter });
  }

  function start() {
    if (!ctx || isPlaying) return;
    if (ctx.state === 'suspended') ctx.resume();

    createDrone(55, 0, 0.08);
    createDrone(82.5, 5, 0.05);
    createDrone(110, -3, 0.03);
    createDrone(165, 7, 0.02);
    createNoise(0.15);

    isPlaying = true;
  }

  function toggleMute() {
    if (!ctx) {
      init();
      start();
    }

    isMuted = !isMuted;

    if (isMuted) {
      masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
    } else {
      if (!isPlaying) start();
      if (ctx.state === 'suspended') ctx.resume();
      masterGain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 1);
    }

    return isMuted;
  }

  function setIntensity(val) {
    if (!ctx || !masterGain || isMuted) return;
    const target = Math.max(0, Math.min(1, val)) * 0.6;
    masterGain.gain.linearRampToValueAtTime(target, ctx.currentTime + 0.3);
  }

  return { init, start, toggleMute, setIntensity, isMuted: () => isMuted };
})();
