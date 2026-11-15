/**
 * MODULE 10: UNIVERSAL CARTOON FOLEY SFX, AMBIENCE & GENERATIVE MUSIC ENGINE (engine/10_sound.js)
 * - In Shot Batches (shots_XX_YY.html): Renders Action-Synced SFX + Ambient Beds ONLY (mixMode: 'sfxOnly').
 * - In Master Music (bgm_master.html): Renders Universal Generative Music ONLY (mixMode: 'bgmOnly' | 'bgmFull').
 * 100% compatible with Studio Player and headless Puppeteer/FFmpeg render_shots.js.
 */
(function () {
  const C = window.CORE || { clamp: (v, a, b) => Math.max(a, Math.min(b, v)), rng: () => Math.random };

  // --- 1. Musical Scales (Semitone offsets from root) ---
  const SCALES = {
    dorian:            [0, 2, 3, 5, 7, 9, 10],
    aeolian:           [0, 2, 3, 5, 7, 8, 10],
    harmonicMinor:     [0, 2, 3, 5, 7, 8, 11],
    phrygianDominant:  [0, 1, 4, 5, 7, 8, 10],
    lydian:            [0, 2, 4, 6, 7, 9, 11],
    mixolydian:        [0, 2, 4, 5, 7, 9, 10],
    ionian:            [0, 2, 4, 5, 7, 9, 11],
    pentatonicMinor:   [0, 3, 5, 7, 10],
    pentatonicMajor:   [0, 2, 4, 7, 9],
    blues:             [0, 3, 5, 6, 7, 10],
    hirajoshi:         [0, 2, 3, 7, 8],
    carnatic:          [0, 1, 4, 5, 7, 8, 11],
    wholeTone:         [0, 2, 4, 6, 8, 10]
  };

  // --- 2. Chord Progressions (Scale degree indices) ---
  const PROGRESSIONS = {
    editorialQuirky:   [0, 3, 4, 3],   // Classic Paper Billions / OverSimplified bounce
    investigative:     [0, 5, 3, 4],   // Curious documentary groove
    tickingSurvival:   [0, 1, 0, 4],   // Tense ticking thriller
    cinematicMinor:    [0, 5, 2, 6],   // Emotional / dramatic
    cosmicLydian:      [0, 1, 0, 1],   // Space / wonder float
    heroicTriumph:     [0, 4, 5, 3],   // Uplifting resolution
    royalGrandeur:     [0, 3, 6, 4],   // Historical / empire
    darkDread:         [0, 1, 4, 0],   // Crisis / danger
    heistGroove:       [0, 2, 3, 4]    // Clever scheme / smuggling
  };

  const NOTE_OFFSETS = {
    C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5,
    'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11
  };

  function parseRootMidi(keyStr) {
    if (!keyStr) return 50; // D3 default
    const m = String(keyStr).trim().match(/^([A-G][#b]?)/i);
    const semi = m && NOTE_OFFSETS[m[1]] !== undefined ? NOTE_OFFSETS[m[1]] : 2;
    return 48 + semi;
  }

  function midiToFreq(m) {
    return 440 * Math.pow(2, (m - 69) / 12);
  }

  // Deterministic noise buffer generator
  function createNoiseBuffer(ctx, dur, seed) {
    const sr = ctx.sampleRate;
    const len = Math.max(1, Math.floor(sr * (dur || 2.0)));
    const buf = ctx.createBuffer(1, len, sr);
    const data = buf.getChannelData(0);
    const rand = C.rng(seed || 101);
    for (let i = 0; i < len; i++) {
      data[i] = rand() * 2 - 1;
    }
    return buf;
  }

  /**
   * Analyzes a BGM cue object and fills in smart defaults for any situation/setting
   * (Used by both `bgm_master.html` UI and the synthesizer).
   */
  function analyzeCueDNA(cue) {
    const c = cue || {};
    const sit = String(c.situation || c.mood || 'editorial').toLowerCase();

    let scaleName = c.scale || 'dorian';
    let progName = c.progression || 'editorialQuirky';
    let leadVoice = c.lead || 'pizzicato';
    let padVoice = c.pad || 'warmPad';
    let bassVoice = c.bass || 'uprightBass';
    let percStyle = c.perc || 'editorial';
    let bpm = c.bpm || 112;

    if (sit.includes('tension') || sit.includes('crisis') || sit.includes('crash') || sit.includes('dark')) {
      scaleName = c.scale || 'harmonicMinor';
      progName = c.progression || 'tickingSurvival';
      leadVoice = c.lead || 'feltPiano';
      bassVoice = c.bass || 'subPulse';
      percStyle = c.perc || 'ticking';
      bpm = c.bpm || 118;
    } else if (sit.includes('space') || sit.includes('cosmic') || sit.includes('science') || sit.includes('wonder')) {
      scaleName = c.scale || 'lydian';
      progName = c.progression || 'cosmicLydian';
      leadVoice = c.lead || 'marimba';
      padVoice = c.pad || 'glassPad';
      percStyle = c.perc || 'softShaker';
      bpm = c.bpm || 98;
    } else if (sit.includes('history') || sit.includes('empire') || sit.includes('ancient') || sit.includes('war')) {
      scaleName = c.scale || 'aeolian';
      progName = c.progression || 'royalGrandeur';
      leadVoice = c.lead || 'cello';
      percStyle = c.perc || 'march';
      bpm = c.bpm || 104;
    } else if (sit.includes('heist') || sit.includes('smuggl') || sit.includes('scheme')) {
      scaleName = c.scale || 'dorian';
      progName = c.progression || 'heistGroove';
      leadVoice = c.lead || 'pizzicato';
      bassVoice = c.bass || 'uprightBass';
      percStyle = c.perc || 'editorial';
      bpm = c.bpm || 116;
    }

    return {
      scaleName,
      progName,
      leadVoice,
      padVoice,
      bassVoice,
      percStyle,
      bpm,
      key: c.key || 'D Minor',
      tension: c.tension !== undefined ? c.tension : 0.4,
      valence: c.valence !== undefined ? c.valence : 0.1
    };
  }

  /**
   * Builds the Scheduling Kernel `k` passed to `s.sfx(k, bt0)` and `scoreBGM(k)`.
   */
  function createKernel(ctx, dest, opts) {
    const o = opts || {};
    const mixMode = o.mixMode || 'sfxOnly'; // 'sfxOnly' | 'bgmOnly' | 'bgmFull'
    const timeOffset = o.timeOffset || 0;
    const maxDuration = o.duration || 600;

    // Master Buses
    const sfxBus = ctx.createGain();
    const bedBus = ctx.createGain();
    const bgmBus = ctx.createGain();

    sfxBus.gain.value = mixMode.startsWith('bgm') ? 0.0 : 0.85;
    bedBus.gain.value = mixMode.startsWith('bgm') ? 0.0 : 0.25;
    bgmBus.gain.value = mixMode === 'sfxOnly' ? 0.0 : 1.0;

    sfxBus.connect(dest);
    bedBus.connect(dest);
    bgmBus.connect(dest);

    const sharedNoise = createNoiseBuffer(ctx, 3.0, 777);

    // Helper: Convert timeline time `t` to AudioContext time
    function toCtxTime(t) {
      return t - timeOffset;
    }

    // Helper: Envelope generator
    function makeEnv(gainParam, t0, attack, hold, release, peak) {
      const pk = Math.max(0.0001, peak || 0.3);
      const start = Math.max(0, t0);
      gainParam.setValueAtTime(0.0001, start);
      gainParam.linearRampToValueAtTime(pk, start + Math.max(0.002, attack));
      if (hold > 0) {
        gainParam.setValueAtTime(pk, start + attack + hold);
      }
      gainParam.exponentialRampToValueAtTime(0.0001, start + attack + hold + Math.max(0.01, release));
    }

    // Low-level tone helper
    function playTone(bus, freq0, freq1, t0, dur, type, gain, filterFreq) {
      const ct = toCtxTime(t0);
      if (ct + dur < 0 || ct > maxDuration) return;
      const start = Math.max(0, ct);

      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type || 'triangle';
      osc.frequency.setValueAtTime(Math.max(20, freq0), start);
      if (freq1 && freq1 !== freq0) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq1), start + dur);
      }

      makeEnv(g.gain, start, Math.min(0.01, dur * 0.15), dur * 0.25, dur * 0.6, gain || 0.25);

      if (filterFreq) {
        const flt = ctx.createBiquadFilter();
        flt.type = 'lowpass';
        flt.frequency.setValueAtTime(filterFreq, start);
        osc.connect(flt);
        flt.connect(g);
      } else {
        osc.connect(g);
      }

      g.connect(bus);
      osc.start(start);
      osc.stop(start + dur + 0.03);
    }

    // Low-level filtered noise burst helper
    function playNoise(bus, t0, dur, filterType, freq0, freq1, Q, gain, attack) {
      const ct = toCtxTime(t0);
      if (ct + dur < 0 || ct > maxDuration) return;
      const start = Math.max(0, ct);

      const src = ctx.createBufferSource();
      src.buffer = sharedNoise;
      src.loop = true;

      const flt = ctx.createBiquadFilter();
      flt.type = filterType || 'bandpass';
      flt.Q.value = Q || 1.5;
      flt.frequency.setValueAtTime(Math.max(40, freq0 || 800), start);
      if (freq1 && freq1 !== freq0) {
        flt.frequency.exponentialRampToValueAtTime(Math.max(40, freq1), start + dur);
      }

      const g = ctx.createGain();
      const att = attack !== undefined ? attack : Math.min(0.01, dur * 0.15);
      makeEnv(g.gain, start, att, dur * 0.2, Math.max(0.015, dur - att), gain || 0.25);

      src.connect(flt);
      flt.connect(g);
      g.connect(bus);

      src.start(start, (Math.abs(Math.sin(t0 * 37)) * 1.5) % 2.0);
      src.stop(start + dur + 0.03);
    }

    /**
     * 1. ACTION-SYNCED CARTOON & EDITORIAL FOLEY SFX (`k.play(nameOrRecipe, t, opts)`)
     */
    function play(nameOrRecipe, t, opts) {
      if (mixMode.startsWith('bgm')) return;
      const o = opts || {};
      const vol = (o.gain !== undefined ? o.gain : 0.45) * (o.volume !== undefined ? o.volume : 1.0);
      const t0 = t || 0;

      // Support custom parametric synth recipes directly: k.play({ type: 'impact', freq: 120, ... }, bt0 + 0.5)
      if (typeof nameOrRecipe === 'object' && nameOrRecipe !== null) {
        const r = nameOrRecipe;
        if (r.type === 'noise' || r.type === 'whoosh') {
          playNoise(sfxBus, t0, r.dur || 0.25, 'bandpass', r.freq || 400, r.endFreq || 1200, r.Q || 2, vol);
        } else {
          playTone(sfxBus, r.freq || 220, r.endFreq || r.freq || 110, t0, r.dur || 0.2, r.wave || 'triangle', vol);
        }
        return;
      }

      const n = String(nameOrRecipe || 'pop').toLowerCase();

      // --- A. EDITORIAL PAPER, STAMPS, TEXT & COMIC SPLITS ---
      if (n.includes('stamp') || n === 'thud' || n === 'impact' || n === 'gavelbang') {
        // Heavy rubber stamp slam / gavel: Sub punch + mid paper slap + dust burst
        playTone(sfxBus, 145, 38, t0, 0.22, 'sine', vol * 1.15);
        playTone(sfxBus, 280, 65, t0, 0.09, 'triangle', vol * 0.7);
        playNoise(sfxBus, t0, 0.11, 'bandpass', 1400, 420, 1.2, vol * 0.65, 0.002);
      } else if (n.includes('flip') || n.includes('page') || n.includes('calendar') || n.includes('card')) {
        // Crisp calendar/page flip
        playNoise(sfxBus, t0, 0.085, 'bandpass', 1800, 4200, 2.2, vol * 0.6, 0.004);
        playTone(sfxBus, 600, 1200, t0 + 0.01, 0.04, 'sine', vol * 0.2);
      } else if (n.includes('tear') || n.includes('rip')) {
        playNoise(sfxBus, t0, 0.24, 'bandpass', 2400, 900, 3.0, vol * 0.65, 0.01);
      } else if (n.includes('highlight') || n.includes('marker') || n.includes('swipe')) {
        // Soft felt highlighter marker stroke
        playNoise(sfxBus, t0, o.dur || 0.28, 'bandpass', 1600, 2200, 3.5, vol * 0.4, 0.03);
      } else if (n.includes('write') || n.includes('pen') || n.includes('scratch') || n.includes('scribble')) {
        for (let i = 0; i < 4; i++) {
          playNoise(sfxBus, t0 + i * 0.06, 0.045, 'bandpass', 2600 + (i % 2) * 600, 3200, 4.0, vol * 0.35, 0.003);
        }
      } else if (n.includes('type') || n.includes('key') || n === 'tick' || n === 'click') {
        // Crisp typewriter / keyboard click for black kinetic text screens
        playNoise(sfxBus, t0, 0.025, 'highpass', 2200, 2200, 1.5, vol * 0.5, 0.001);
        playTone(sfxBus, 1400, 450, t0, 0.022, 'triangle', vol * 0.35);
      } else if (n.includes('split') || n.includes('panel') || n.includes('slide')) {
        // Comic panel slide-in + crisp border snap
        playNoise(sfxBus, t0, 0.16, 'bandpass', 400, 1400, 1.8, vol * 0.45, 0.02);
        playTone(sfxBus, 320, 110, t0 + 0.12, 0.06, 'triangle', vol * 0.5);

      // --- B. CHARTS, COUNTERS, MONEY & UI BADGES ---
      } else if (n.includes('counter') || n.includes('ticker')) {
        const count = o.count || 8;
        const step = (o.dur || 0.65) / count;
        for (let i = 0; i < count; i++) {
          playTone(sfxBus, 900 + i * 45, 1100 + i * 45, t0 + i * step, 0.028, 'sine', vol * 0.32);
        }
      } else if (n.includes('cash') || n.includes('chaching') || n.includes('register')) {
        // Mechanical drawer + bright double bell
        playNoise(sfxBus, t0, 0.07, 'bandpass', 1200, 2400, 2.0, vol * 0.45, 0.003);
        playTone(sfxBus, 2093, 2093, t0 + 0.06, 0.22, 'sine', vol * 0.55);
        playTone(sfxBus, 2637, 2637, t0 + 0.14, 0.38, 'sine', vol * 0.65);
      } else if (n.includes('coin')) {
        playTone(sfxBus, 2400, 2400, t0, 0.12, 'sine', vol * 0.45);
        playTone(sfxBus, 3150, 3150, t0 + 0.04, 0.18, 'sine', vol * 0.45);
      } else if (n.includes('pop') || n.includes('bubble') || n.includes('badge')) {
        // Classic cartoon speech-bubble / badge pop
        playTone(sfxBus, 340, 920, t0, 0.075, 'sine', vol * 0.55);
      } else if (n.includes('ding') || n.includes('chime') || n.includes('bell')) {
        playTone(sfxBus, 1568, 1568, t0, 0.45, 'sine', vol * 0.5);
        playTone(sfxBus, 3136, 3136, t0, 0.25, 'sine', vol * 0.2);
      } else if (n.includes('alarm') || n.includes('beep') || n.includes('alert')) {
        playTone(sfxBus, 880, 880, t0, 0.11, 'square', vol * 0.35, 2400);
        playTone(sfxBus, 880, 880, t0 + 0.15, 0.11, 'square', vol * 0.35, 2400);
      } else if (n.includes('crash') || n.includes('collapse') || n.includes('shatter') || n.includes('break')) {
        playTone(sfxBus, 180, 36, t0, 0.35, 'sawtooth', vol * 0.7, 600);
        playNoise(sfxBus, t0, 0.42, 'bandpass', 1800, 380, 1.0, vol * 0.75, 0.003);

      // --- C. COMEDY, SKITS & TRANSITIONS ---
      } else if (n.includes('whoosh') || n.includes('swish')) {
        playNoise(sfxBus, t0, o.dur || 0.22, 'bandpass', 320, 1450, 2.2, vol * 0.55, 0.04);
      } else if (n.includes('record') || n.includes('scratch')) {
        playNoise(sfxBus, t0, 0.18, 'bandpass', 2200, 600, 4.0, vol * 0.65, 0.005);
        playTone(sfxBus, 950, 180, t0, 0.18, 'sawtooth', vol * 0.45, 1800);
      } else if (n.includes('rimshot')) {
        playNoise(sfxBus, t0, 0.06, 'bandpass', 900, 900, 1.5, vol * 0.55, 0.002);
        playTone(sfxBus, 160, 90, t0 + 0.12, 0.12, 'sine', vol * 0.65);
        playNoise(sfxBus, t0 + 0.28, 0.32, 'highpass', 3500, 3500, 1.2, vol * 0.4, 0.003);
      } else if (n.includes('trombone') || n.includes('sad') || n.includes('fail')) {
        const notes = [293.6, 277.2, 261.6, 246.9];
        notes.forEach((f, idx) => {
          playTone(sfxBus, f, idx === 3 ? f * 0.88 : f, t0 + idx * 0.26, idx === 3 ? 0.48 : 0.22, 'sawtooth', vol * 0.4, 1100);
        });
      } else if (n.includes('boing') || n.includes('spring')) {
        playTone(sfxBus, 180, 620, t0, 0.28, 'sine', vol * 0.5);
      } else if (n.includes('cricket')) {
        for (let c = 0; c < 2; c++) {
          for (let i = 0; i < 3; i++) {
            playTone(sfxBus, 4200, 4350, t0 + c * 0.35 + i * 0.035, 0.025, 'sine', vol * 0.28);
          }
        }

      // --- D. MACHINES, SCIENCE, SPACE & ERA ACTIONS ---
      } else if (n.includes('explos') || n.includes('boom') || n.includes('cannon')) {
        playTone(sfxBus, 110, 28, t0, 0.55, 'sine', vol * 1.1);
        playNoise(sfxBus, t0, 0.65, 'lowpass', 900, 140, 1.0, vol * 0.85, 0.005);
      } else if (n.includes('fire') || n.includes('flame') || n.includes('torch')) {
        playNoise(sfxBus, t0, 0.35, 'bandpass', 500, 1100, 1.4, vol * 0.5, 0.03);
      } else if (n.includes('spark') || n.includes('zap') || n.includes('laser') || n.includes('electric')) {
        playTone(sfxBus, 1600, 240, t0, 0.14, 'sawtooth', vol * 0.4, 2800);
        playNoise(sfxBus, t0, 0.09, 'highpass', 2400, 1200, 2.0, vol * 0.4, 0.002);
      } else if (n.includes('sword') || n.includes('clash') || n.includes('metal') || n.includes('anvil')) {
        playTone(sfxBus, 1850, 1820, t0, 0.25, 'triangle', vol * 0.5);
        playTone(sfxBus, 2780, 2740, t0, 0.18, 'sine', vol * 0.4);
        playNoise(sfxBus, t0, 0.06, 'highpass', 3000, 3000, 2.0, vol * 0.5, 0.001);
      } else if (n.includes('step') || n.includes('walk') || n.includes('march')) {
        const count = o.count || 4;
        const step = (o.dur || 0.9) / count;
        for (let i = 0; i < count; i++) {
          playNoise(sfxBus, t0 + i * step, 0.055, 'lowpass', 480, 220, 1.2, vol * 0.4, 0.003);
        }
      } else {
        // Universal semantic fallback based on string hash so ANY sound name produces a clean cue
        let hash = 0;
        for (let i = 0; i < n.length; i++) hash = (hash * 31 + n.charCodeAt(i)) % 1000;
        const baseFreq = 260 + (hash % 520);
        playTone(sfxBus, baseFreq, baseFreq * 1.35, t0, 0.09, 'triangle', vol * 0.45);
      }
    }

    /**
     * 2. UNIVERSAL SITUATIONAL AMBIENT BED (`k.bed(envType, t0, t1, opts)`)
     */
    function bed(envType, t0, t1, opts) {
      if (mixMode.startsWith('bgm')) return;
      const o = opts || {};
      const start = Math.max(0, toCtxTime(t0 || 0));
      const end = Math.min(maxDuration, toCtxTime(t1 !== undefined ? t1 : (t0 || 0) + 4));
      const dur = end - start;
      if (dur <= 0.05) return;

      const gainVal = o.gain !== undefined ? o.gain : 0.16;
      const kind = String(envType || 'studio').toLowerCase();

      const src = ctx.createBufferSource();
      src.buffer = sharedNoise;
      src.loop = true;

      const flt = ctx.createBiquadFilter();
      if (kind.includes('rain') || kind.includes('water') || kind.includes('ocean')) {
        flt.type = 'bandpass';
        flt.frequency.value = 650;
        flt.Q.value = 0.8;
      } else if (kind.includes('server') || kind.includes('lab') || kind.includes('space') || kind.includes('machine')) {
        flt.type = 'lowpass';
        flt.frequency.value = 180;
      } else if (kind.includes('wind') || kind.includes('nature') || kind.includes('outdoor')) {
        flt.type = 'bandpass';
        flt.frequency.value = 380;
        flt.Q.value = 1.5;
      } else {
        // Subtle warm studio / room tone
        flt.type = 'lowpass';
        flt.frequency.value = 240;
      }

      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, start);
      g.gain.linearRampToValueAtTime(gainVal * 0.35, start + Math.min(0.15, dur * 0.2));
      g.gain.setValueAtTime(gainVal * 0.35, Math.max(start + 0.05, end - 0.15));
      g.gain.linearRampToValueAtTime(0.0001, end);

      src.connect(flt);
      flt.connect(g);
      g.connect(bedBus);

      src.start(start);
      src.stop(end + 0.02);
    }

    /**
     * 3. UNIVERSAL GENERATIVE MUSIC COMPOSER (`k.bgmScore(BGM_SCORE)`)
     * Composes full multi-instrument situational BGM for `bgm_master.html`.
     */
    function bgmScore(scoreObj) {
      if (mixMode === 'sfxOnly' || !scoreObj) return;
      const cues = scoreObj.cues || [];
      const auto = scoreObj.volume_automation || [];
      const baseDuck = mixMode === 'bgmFull' ? 1.0 : 0.48;

      // Apply master volume automation (supports VO ducking, swells, and 0.00 punchline drops)
      if (auto.length > 0) {
        auto.forEach((pt, idx) => {
          const ct = toCtxTime(pt[0]);
          const val = Math.max(0.0001, pt[1] * (mixMode === 'bgmFull' ? 1.35 : 1.0));
          if (ct >= 0 && ct <= maxDuration) {
            if (idx === 0) bgmBus.gain.setValueAtTime(val, ct);
            else bgmBus.gain.linearRampToValueAtTime(val, ct);
          }
        });
      } else {
        bgmBus.gain.setValueAtTime(0.22 * baseDuck, 0);
      }

      cues.forEach((cue, cIdx) => {
        const dna = analyzeCueDNA(cue);
        const scale = SCALES[dna.scaleName] || SCALES.dorian;
        const prog = PROGRESSIONS[dna.progName] || PROGRESSIONS.editorialQuirky;
        const rootMidi = parseRootMidi(dna.key);
        const beatSec = 60 / C.clamp(dna.bpm || 110, 60, 180);
        const barSec = beatSec * 4;

        const tStart = cue.start_time || 0;
        const tEnd = cue.end_time || (tStart + 15);
        const rand = C.rng((cIdx + 1) * 97);

        for (let barT = tStart, barIdx = 0; barT < tEnd; barT += barSec, barIdx++) {
          const deg = prog[barIdx % prog.length] || 0;
          const chordRootSemi = scale[deg % scale.length];
          const chordThirdSemi = scale[(deg + 2) % scale.length] + (deg + 2 >= scale.length ? 12 : 0);
          const chordFifthSemi = scale[(deg + 4) % scale.length] + (deg + 4 >= scale.length ? 12 : 0);

          // 1. Warm Harmonic Pad (1 chord per bar)
          const padDur = Math.min(barSec, tEnd - barT);
          [chordRootSemi, chordThirdSemi, chordFifthSemi].forEach((semi) => {
            playTone(bgmBus, midiToFreq(rootMidi + semi), midiToFreq(rootMidi + semi), barT, padDur, 'sine', 0.065, 900);
          });

          // 2. Bassline (Walking upright bass / sub pulse on beats)
          for (let b = 0; b < 4; b++) {
            const bt = barT + b * beatSec;
            if (bt >= tEnd) break;
            const bSemi = b === 2 ? chordFifthSemi : chordRootSemi;
            const bFreq = midiToFreq(rootMidi - 12 + bSemi);
            playTone(bgmBus, bFreq, bFreq * 0.99, bt, beatSec * 0.72, 'triangle', 0.15, 380);
          }

          // 3. Lead Melody / Ostinato (Pizzicato / Marimba / Felt Piano / Pluck)
          const steps = 8; // Eighth notes
          const stepSec = barSec / steps;
          for (let s = 0; s < steps; s++) {
            const st = barT + s * stepSec;
            if (st >= tEnd) break;
            if (s === 0 || s === 2 || s === 3 || s === 5 || (s === 7 && rand() > 0.35)) {
              const noteChoices = [chordRootSemi, chordThirdSemi, chordFifthSemi, scale[(deg + 1) % scale.length] + 12];
              const pickSemi = noteChoices[(s + barIdx) % noteChoices.length];
              const mFreq = midiToFreq(rootMidi + 12 + pickSemi);
              const isShort = dna.leadVoice.includes('pizz') || dna.leadVoice.includes('marimba') || dna.leadVoice.includes('pluck');
              playTone(
                bgmBus,
                mFreq,
                mFreq,
                st,
                isShort ? stepSec * 0.55 : stepSec * 1.15,
                isShort ? 'triangle' : 'sine',
                0.12,
                1800
              );
            }
          }

          // 4. Situational Percussion Groove (Woodblock, Shaker, Ticking Clock, or Kick/Snare)
          if (dna.percStyle !== 'none') {
            for (let b = 0; b < 4; b++) {
              const bt = barT + b * beatSec;
              if (bt >= tEnd) break;
              if (dna.percStyle === 'ticking') {
                playTone(bgmBus, b % 2 === 0 ? 1100 : 850, 400, bt, 0.025, 'triangle', 0.09);
                playTone(bgmBus, 950, 400, bt + beatSec * 0.5, 0.02, 'triangle', 0.05);
              } else {
                // Soft kick on 1 & 3, crisp woodblock/rim on 2 & 4, shaker on 8ths
                if (b === 0 || b === 2) {
                  playTone(bgmBus, 115, 42, bt, 0.12, 'sine', 0.16);
                } else {
                  playTone(bgmBus, 780, 420, bt, 0.035, 'triangle', 0.08);
                }
                playNoise(bgmBus, bt + beatSec * 0.5, 0.035, 'highpass', 4500, 4500, 1.2, 0.04, 0.002);
              }
            }
          }
        }
      });
    }

    return {
      play,
      bed,
      bgmScore,
      situationalCue: (c) => bgmScore({ cues: [c] })
    };
  }

  /**
   * Live WebAudio playback for Studio Player (`shots_XX_YY.html` & `bgm_master.html`)
   */
  function live(scoreFn, startOffset, opts) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx || typeof scoreFn !== 'function') return function () {};

    const ctx = new AudioCtx();
    const o = Object.assign({ timeOffset: startOffset || 0, duration: 900 }, opts || {});
    const k = createKernel(ctx, ctx.destination, o);
    scoreFn(k);

    return function stop() {
      try { ctx.close(); } catch (e) {}
    };
  }

  /**
   * Deterministic Offline 48kHz Audio Rendering for `render_shots.js` and `.wav` export
   */
  async function renderOffline(scoreFn, duration, sampleRate, opts) {
    const sr = sampleRate || 48000;
    const dur = Math.max(0.1, duration || 1.0);
    const totalFrames = Math.ceil(dur * sr);
    const OfflineCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;

    const ctx = new OfflineCtx(2, totalFrames, sr);
    const o = Object.assign({ timeOffset: 0, duration: dur }, opts || {});
    const k = createKernel(ctx, ctx.destination, o);
    if (typeof scoreFn === 'function') scoreFn(k);

    const rendered = await ctx.startRendering();
    const chL = rendered.getChannelData(0);
    const chR = rendered.numberOfChannels > 1 ? rendered.getChannelData(1) : chL;
    const inter = new Float32Array(rendered.length * 2);

    for (let i = 0; i < rendered.length; i++) {
      inter[i * 2] = C.clamp(chL[i], -1, 1);
      inter[i * 2 + 1] = C.clamp(chR[i], -1, 1);
    }

    return { inter, sr, buffer: rendered };
  }

  /**
   * Encodes stereo interleaved Float32 PCM into a standard 16-bit WAV Blob
   */
  function encodeWAV(interleaved, sampleRate) {
    const sr = sampleRate || 48000;
    const buffer = new ArrayBuffer(44 + interleaved.length * 2);
    const view = new DataView(buffer);

    function writeStr(offset, str) {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    }

    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + interleaved.length * 2, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 2, true);
    view.setUint32(24, sr, true);
    view.setUint32(28, sr * 4, true);
    view.setUint16(32, 4, true);
    view.setUint16(34, 16, true);
    writeStr(36, 'data');
    view.setUint32(40, interleaved.length * 2, true);

    let offset = 44;
    for (let i = 0; i < interleaved.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, interleaved[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }

    return new Blob([view], { type: 'audio/wav' });
  }

  window.SOUND = {
    analyzeCueDNA,
    live,
    renderOffline,
    encodeWAV
  };
})();