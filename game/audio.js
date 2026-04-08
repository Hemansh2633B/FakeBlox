// game/audio.js — AudioManager (Howler.js + OfflineAudioContext synthesis)
import { Howl, Howler } from 'howler';

function encodeWAV(samples, sampleRate=44100) {
  const buf = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buf);
  const writeString = (v, o) => { for (let i = 0; i < v.length; i++) view.setUint8(o + i, v.charCodeAt(i)); };
  writeString('RIFF', 0); view.setUint32(4, 36 + samples.length * 2, true);
  writeString('WAVE', 8); writeString('fmt ', 12);
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  writeString('data', 36); view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  let bin = '';
  const bytes = new Uint8Array(buf);
  for(let i=0; i<bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
  return 'data:audio/wav;base64,' + btoa(bin);
}

async function synthToHowl(duration, renderFn) {
  const sr = 44100;
  const ctx = new OfflineAudioContext(1, sr * duration, sr);
  renderFn(ctx);
  const buf = await ctx.startRendering();
  return new Howl({ src: [encodeWAV(buf.getChannelData(0), sr)], format: ['wav'] });
}

export class AudioManager {
  constructor() {
    this.musicVol = 0.5;
    this.sfxVol = 0.8;
    this.ready = false;
    this.sounds = {};
    this.userInteracted = false;
    Howler.pos(0, 0, 0); // Listener pos
  }

  resumeContext() {
    if (Howler.ctx && Howler.ctx.state === 'suspended') {
      Howler.ctx.resume();
    }
  }

  async init() {
    if (this.ready) return;
    
    // PlayTone offline helper
    const playT = (ctx, freq, dur, type, vol, start) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(vol, start);
      g.gain.exponentialRampToValueAtTime(0.001, start + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(start); o.stop(start + dur + 0.05);
    };

    // PlayNoise offline helper
    const playN = (ctx, dur, vol, start) => {
      const bufSize = ctx.sampleRate * dur;
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource(); src.buffer = buf;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol, start);
      g.gain.exponentialRampToValueAtTime(0.001, start + dur);
      src.connect(g); g.connect(ctx.destination);
      src.start(start);
    };

    this.sounds.jump = await synthToHowl(0.3, ctx => {
      playT(ctx, 350, 0.15, 'sine', 0.25, 0);
      playT(ctx, 500, 0.1, 'sine', 0.2, 0.03);
    });
    this.sounds.land = await synthToHowl(0.15, ctx => playN(ctx, 0.08, 0.15, 0));
    this.sounds.landHard = await synthToHowl(0.3, ctx => {
      playN(ctx, 0.15, 0.25, 0);
      playT(ctx, 80, 0.1, 'sine', 0.15, 0);
    });
    this.sounds.death = await synthToHowl(0.6, ctx => {
      playT(ctx, 300, 0.3, 'sawtooth', 0.3, 0);
      playT(ctx, 150, 0.4, 'sawtooth', 0.2, 0.1);
      playN(ctx, 0.2, 0.2, 0);
    });
    this.sounds.checkpoint = await synthToHowl(1.0, ctx => {
      [523, 659, 784, 1047].forEach((f, i) => playT(ctx, f, 0.3, 'triangle', 0.25, i * 0.1));
    });
    this.sounds.collectStar = await synthToHowl(0.4, ctx => {
      playT(ctx, 880, 0.12, 'sine', 0.2, 0);
      playT(ctx, 1100, 0.15, 'sine', 0.2, 0.06);
    });
    this.sounds.bounce = await synthToHowl(0.4, ctx => {
      playT(ctx, 200, 0.2, 'sine', 0.3, 0);
      playT(ctx, 600, 0.15, 'sine', 0.2, 0);
    });
    this.sounds.levelComplete = await synthToHowl(1.5, ctx => {
      [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => playT(ctx, f, 0.4, 'triangle', 0.2, i * 0.12));
    });
    this.sounds.uiClick = await synthToHowl(0.1, ctx => playT(ctx, 800, 0.05, 'square', 0.1, 0));
    this.sounds.uiHover = await synthToHowl(0.1, ctx => playT(ctx, 600, 0.03, 'sine', 0.05, 0));
    this.sounds.achievement = await synthToHowl(1.0, ctx => {
      [784, 988, 1175, 1568].forEach((f, i) => playT(ctx, f, 0.35, 'sine', 0.2, i * 0.15));
    });

    this.setMusicVol(this.musicVol);
    this.setSfxVol(this.sfxVol);
    this.ready = true;
  }

  setMusicVol(v) {
    this.musicVol = v;
    if (this.musicOscGroup) this.musicOscGroup.gain.value = v;
  }

  setSfxVol(v) {
    this.sfxVol = v;
    Howler.volume(v);
  }

  playSpatial(id, pos) {
    if (!this.ready || !this.sounds[id] || !this.userInteracted) return;
    const sId = this.sounds[id].play();
    if (pos) {
      this.sounds[id].pos(pos.x, pos.y, pos.z, sId);
      this.sounds[id].pannerAttr({ panningModel: 'HRTF', distanceModel: 'inverse', refDistance: 3, maxDistance: 30, rolloffFactor: 1 });
    }
  }

  jump() { this.playSpatial('jump'); }
  land(pos) { this.playSpatial('land', pos); }
  landHard(pos) { this.playSpatial('landHard', pos); }
  death(pos) { this.playSpatial('death', pos); }
  checkpoint(pos) { this.playSpatial('checkpoint', pos); }
  collectStar(pos) { this.playSpatial('collectStar', pos); }
  bounce(pos) { this.playSpatial('bounce', pos); }
  levelComplete() { this.playSpatial('levelComplete'); }
  uiClick() { this.playSpatial('uiClick'); }
  uiHover() { this.playSpatial('uiHover'); }
  achievement() { this.playSpatial('achievement'); }

  musicOsc = null;
  musicOscGroup = null;

  startMusic(theme) {
    this.stopMusic();
    const actx = Howler.ctx;
    if (!actx) return;
    const freqs = {
      grasslands: [130, 196], lava: [73, 110], ice: [165, 247],
      space: [55, 82], factory: [98, 147], neon: [110, 165],
    };
    const f = freqs[theme] || freqs.grasslands;
    this.musicOsc = [];
    
    this.musicOscGroup = actx.createGain();
    this.musicOscGroup.gain.value = this.musicVol;
    this.musicOscGroup.connect(actx.destination);

    f.forEach(freq => {
      const o = actx.createOscillator();
      const g = actx.createGain();
      o.type = 'sine'; o.frequency.value = freq;
      g.gain.value = 0.06;
      o.connect(g); g.connect(this.musicOscGroup);
      o.start();
      this.musicOsc.push({ o, g });
    });
    const lfo = actx.createOscillator();
    const lfoG = actx.createGain();
    lfo.type = 'sine'; lfo.frequency.value = 0.2;
    lfoG.gain.value = 3;
    lfo.connect(lfoG);
    if (this.musicOsc[0]) lfoG.connect(this.musicOsc[0].o.frequency);
    lfo.start();
    this.musicOsc.push({ o: lfo, g: lfoG });
  }

  stopMusic() {
    if (this.musicOsc) {
      this.musicOsc.forEach(m => { try { m.o.stop(); } catch (e) {} });
      this.musicOsc = null;
    }
  }

  updateListener(pos, dir) {
    if (pos) Howler.pos(pos.x, pos.y, pos.z);
    if (dir) Howler.orientation(dir.x, dir.y, dir.z, 0, 1, 0); // Assuming up is (0,1,0)
  }
}

export const audio = new AudioManager();
