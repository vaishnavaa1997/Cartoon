/**
 * MODULE 03: TEXT, BLACK PUNCHLINE SCREENS, BUBBLES & STAMPS (engine/03_text.js)
 * Implements the signature typography of the reference videos:
 *  1. TEXT.blackScreen   -> Pure black screen with handwritten kinetic text & color highlights
 *  2. TEXT.speechBubble  -> Clean speech, thought, and spiky shout bubbles
 *  3. TEXT.subtitle      -> Floating italic character dialogue subtitles
 *  4. TEXT.stamp         -> Heavy slamming rubber stamps ("NO", "BANNED", "PUBLIC") + dust puffs
 *  5. TEXT.highlightQuote-> Document/News quote with animated yellow highlighter marker
 *  6. TEXT.callout / badge / chapter -> Hand-drawn arrows & labels
 */
(function () {
  const C = window.CORE;

  /**
   * 1. BLACK KINETIC TEXT SCREEN (Video 1 00:06, 00:25, 00:37, 01:13, 03:29)
   * Renders a pure dark screen with handwritten script text appearing word-by-word.
   *
   * Supports inline color tags inside text:
   *   "{red:eighty billion}" or "{green:$18M}" or "{yellow:Renting a Brain}"
   *
   * Usage:
   *   TEXT.blackScreen(g, lt, {
   *     text: "That's about {green:eighteen million dollars}\nan hour.",
   *     sub: "— 2026 Run Rate",
   *     t0: 0.1, dur: 0.9, size: 78, underline: true
   *   });
   */
  function blackScreen(g, lt, opts) {
    const o = opts || {};
    const bg = o.bg || '#050608';
    const rawText = String(o.text || '');
    const size = o.size || 78;
    const t0 = o.t0 !== undefined ? o.t0 : 0.08;
    const dur = o.dur !== undefined ? o.dur : 0.85;
    const fontName = o.font || '"Caveat", "Kalam", cursive';

    g.save();
    g.fillStyle = bg;
    g.fillRect(0, 0, C.W, C.H);

    // Parse lines and color tokens: "{red:word here}"
    const lines = rawText.split('\n');
    const parsedLines = [];
    let totalWords = 0;

    const colorMap = {
      red: '#F87171',
      green: '#4ADE80',
      yellow: '#FACC15',
      blue: '#60A5FA',
      orange: '#FB923C',
      white: '#F8FAFC'
    };

    lines.forEach((lineStr) => {
      const words = [];
      // Match either {color:content} or normal space-separated words
      const regex = /\{([a-zA-Z#0-9]+):([^}]+)\}|(\S+)/g;
      let m;
      while ((m = regex.exec(lineStr)) !== null) {
        if (m[1]) {
          const col = colorMap[m[1].toLowerCase()] || m[1];
          const subWords = m[2].trim().split(/\s+/);
          subWords.forEach((sw) => {
            words.push({ text: sw, color: col });
            totalWords++;
          });
        } else if (m[3]) {
          words.push({ text: m[3], color: o.color || '#F8FAFC' });
          totalWords++;
        }
      }
      parsedLines.push(words);
    });

    const p = C.prog(lt, t0, t0 + dur);
    const visibleWords = o.instant ? totalWords : Math.floor(p * totalWords + 0.99);

    g.font = '700 ' + size + 'px ' + fontName;
    g.textBaseline = 'middle';

    const lineH = size * 1.22;
    const startY = (o.y !== undefined ? o.y : 520) - ((parsedLines.length - 1) * lineH) / 2;

    let wordCounter = 0;
    let lastLineW = 0;
    let lastLineY = startY;

    parsedLines.forEach((lineWords, lineIdx) => {
      // Measure full line width so words stay centered in place as they reveal
      const fullLineStr = lineWords.map((w) => w.text).join(' ');
      const fullW = g.measureText(fullLineStr).width;
      let curX = (o.x !== undefined ? o.x : 960) - fullW / 2;
      const curY = startY + lineIdx * lineH;
      lastLineW = fullW;
      lastLineY = curY;

      lineWords.forEach((wObj) => {
        wordCounter++;
        if (wordCounter <= visibleWords) {
          const wordStartT = t0 + ((wordCounter - 1) / Math.max(1, totalWords)) * dur;
          const wp = o.instant ? 1 : C.seg(lt, wordStartT, wordStartT + 0.18, C.ease.outBack);

          g.save();
          const wWidth = g.measureText(wObj.text + ' ').width;
          g.translate(curX + wWidth / 2, curY + (1 - wp) * 14);
          g.scale(0.85 + 0.15 * wp, 0.85 + 0.15 * wp);
          g.globalAlpha = C.clamp(wp, 0, 1);
          g.fillStyle = wObj.color;
          g.textAlign = 'center';
          g.fillText(wObj.text, 0, 0);
          g.restore();

          curX += wWidth;
        }
      });
    });

    // Optional hand-drawn underline scribble
    if (o.underline && p > 0.65) {
      const up = C.seg(lt, t0 + dur * 0.65, t0 + dur + 0.25, C.ease.outCubic);
      const uw = Math.min(lastLineW * 0.9, 760) * up;
      const ux = (o.x !== undefined ? o.x : 960) - lastLineW * 0.45;
      const uy = lastLineY + size * 0.52;
      g.strokeStyle = o.underlineColor || '#FACC15';
      g.lineWidth = 4.5;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(ux, uy);
      g.quadraticCurveTo(ux + uw * 0.5, uy - 8, ux + uw, uy + 3);
      g.stroke();
    }

    // Optional smaller subtitle below
    if (o.sub && lt > t0 + dur * 0.7) {
      const sp = C.seg(lt, t0 + dur * 0.7, t0 + dur + 0.3, C.ease.outCubic);
      g.save();
      g.globalAlpha = sp;
      g.font = '600 ' + Math.round(size * 0.48) + 'px ' + fontName;
      g.fillStyle = o.subColor || '#94A3B8';
      g.textAlign = 'center';
      g.fillText(o.sub, o.x !== undefined ? o.x : 960, lastLineY + lineH * 0.95);
      g.restore();
    }

    g.restore();
  }

  /**
   * 2. SPEECH, THOUGHT & SHOUT BUBBLES
   * Usage:
   *   TEXT.speechBubble(g, lt, {
   *     x: 720, y: 260, tailX: 650, tailY: 410,
   *     text: "Wait. It lost how much?",
   *     kind: 'speech', // 'speech' | 'thought' | 'shout'
   *     t0: 0.2
   *   });
   */
  function speechBubble(g, lt, opts) {
    const o = opts || {};
    const t0 = o.t0 || 0;
    if (lt < t0) return;

    const sc = C.pop(lt, t0, o.dur || 0.28);
    if (sc <= 0.01) return;

    const x = o.x !== undefined ? o.x : 960;
    const y = o.y !== undefined ? o.y : 260;
    const kind = o.kind || 'speech';
    const fontSize = o.size || 30;
    const lines = String(o.text || '').split('\n');

    g.save();
    g.font = (o.italic ? 'italic ' : '') + '700 ' + fontSize + 'px "Nunito", sans-serif';

    let maxW = 0;
    lines.forEach((l) => {
      const w = g.measureText(l).width;
      if (w > maxW) maxW = w;
    });

    const padX = o.padX || 32;
    const padY = o.padY || 22;
    const bw = Math.max(o.minW || 140, maxW + padX * 2);
    const lineH = fontSize * 1.28;
    const bh = lines.length * lineH + padY * 2;

    const tailX = o.tailX !== undefined ? o.tailX : x - 40;
    const tailY = o.tailY !== undefined ? o.tailY : y + bh / 2 + 55;

    g.translate(x, y);
    g.scale(sc, sc);
    g.translate(-x, -y);

    const bx = x - bw / 2;
    const by = y - bh / 2;

    // Tail
    g.fillStyle = o.fill || '#FFFFFF';
    g.strokeStyle = o.stroke || C.PAL.ink;
    g.lineWidth = 3.5;
    g.lineJoin = 'round';

    if (kind === 'thought') {
      C.circle(g, C.lerp(x, tailX, 0.55), C.lerp(y + bh / 2, tailY, 0.45), 11, { fill: o.fill || '#FFFFFF' });
      C.circle(g, C.lerp(x, tailX, 0.82), C.lerp(y + bh / 2, tailY, 0.82), 6, { fill: o.fill || '#FFFFFF' });
    } else if (o.tail !== false) {
      const baseX = C.clamp(tailX, bx + 28, bx + bw - 28);
      const baseY = tailY >= y ? by + bh - 4 : by + 4;
      g.beginPath();
      g.moveTo(baseX - 16, baseY);
      g.lineTo(tailX, tailY);
      g.lineTo(baseX + 16, baseY);
      g.closePath();
      g.fill();
      g.stroke();
    }

    // Bubble Box
    C.roundRect(g, bx, by, bw, bh, kind === 'thought' ? 32 : 18, {
      fill: o.fill || '#FFFFFF',
      stroke: o.stroke || C.PAL.ink,
      lw: 3.5,
      shadow: true
    });

    // Cover seam between tail and bubble
    if (kind !== 'thought' && o.tail !== false) {
      const baseX = C.clamp(tailX, bx + 28, bx + bw - 28);
      const baseY = tailY >= y ? by + bh - 3 : by + 3;
      g.fillStyle = o.fill || '#FFFFFF';
      g.fillRect(baseX - 14, baseY - 4, 28, 8);
    }

    // Text
    g.fillStyle = o.color || C.PAL.ink;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const textStartY = y - ((lines.length - 1) * lineH) / 2;
    lines.forEach((l, i) => {
      g.fillText(l, x, textStartY + i * lineH);
    });

    g.restore();
  }

  /**
   * 3. FLOATING HANDWRITTEN SUBTITLE / DIALOGUE CAPTION
   * Matches Video 1 (00:28 "Wait. It lost how much?", "Eighty billion.")
   */
  function subtitle(g, lt, opts) {
    const o = opts || {};
    const t0 = o.t0 || 0;
    if (lt < t0) return;
    if (o.t1 && lt > o.t1) return;

    const p = C.seg(lt, t0, t0 + 0.22, C.ease.outCubic);
    const x = o.x !== undefined ? o.x : 960;
    const y = o.y !== undefined ? o.y : 880;
    const size = o.size || 48;
    const text = String(o.text || '');

    g.save();
    g.globalAlpha = p;
    g.translate(x, y + (1 - p) * 12);
    g.font = '700 ' + size + 'px "Caveat", "Kalam", cursive';
    g.textAlign = o.align || 'center';
    g.textBaseline = 'middle';

    // Crisp dark outline behind text so it reads on any background
    g.lineWidth = 7;
    g.strokeStyle = o.outline || 'rgba(15, 18, 24, 0.85)';
    g.lineJoin = 'round';
    g.strokeText(text, 0, 0);

    g.fillStyle = o.color || '#FFFFFF';
    g.fillText(text, 0, 0);
    g.restore();
  }

  /**
   * 4. SLAMMING RUBBER STAMP ("NO", "NOP", "BANNED", "PUBLIC", "APPROVED", "LOSS")
   * Matches Video 1 (05:13 "NO", 07:45 "PUBLIC") & Video 3 ("BANNED").
   */
  function stamp(g, lt, opts) {
    const o = opts || {};
    const t0 = o.t0 !== undefined ? o.t0 : 0.4;
    if (lt < t0) return;

    const dt = lt - t0;
    const slamP = C.seg(lt, t0, t0 + 0.18, C.ease.outBack);
    const scale = C.lerp(2.3, 1.0, C.clamp(dt / 0.14, 0, 1));

    const x = o.x !== undefined ? o.x : 960;
    const y = o.y !== undefined ? o.y : 540;
    const angle = (o.angle !== undefined ? o.angle : -12) * (Math.PI / 180);
    const col = o.color || C.PAL.red;
    const text = String(o.text || 'APPROVED').toUpperCase();
    const size = o.size || 58;

    g.save();

    // Dust puff particles on impact (0.05s to 0.45s after t0)
    if (dt > 0.08 && dt < 0.55) {
      const puffP = C.prog(dt, 0.08, 0.55);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const dist = 80 + puffP * 110;
        const px = x + Math.cos(a) * dist;
        const py = y + Math.sin(a) * dist * 0.65;
        const pr = (1 - puffP) * 18;
        g.fillStyle = 'rgba(220, 215, 205, ' + (1 - puffP) * 0.65 + ')';
        g.beginPath();
        g.arc(px, py, pr, 0, Math.PI * 2);
        g.fill();
      }
    }

    g.translate(x, y);
    g.rotate(angle);
    g.scale(scale, scale);
    g.globalAlpha = C.clamp(slamP, 0, 1);

    g.font = '900 ' + size + 'px "Fredoka", "Nunito", sans-serif';
    const tw = g.measureText(text).width;
    const w = Math.max(o.w || 0, tw + 68);
    const h = o.h || size + 38;

    // Backing tint
    C.roundRect(g, -w / 2, -h / 2, w, h, 10, {
      fill: o.fill || 'rgba(255, 250, 245, 0.90)',
      stroke: col,
      lw: 6
    });

    // Inner double border
    C.roundRect(g, -w / 2 + 8, -h / 2 + 8, w - 16, h - 16, 6, {
      fill: false,
      stroke: col,
      lw: 2.5
    });

    g.fillStyle = col;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, 0, 2);

    g.restore();
  }

  /**
   * 5. HIGHLIGHTER QUOTE (Newspaper / Legal Document / Report Quote with Animated Marker)
   * Matches Video 1 (11:46) & Video 3 (DOJ Indictment / Custom forms).
   */
  function highlightQuote(g, lt, opts) {
    const o = opts || {};
    const x = o.x !== undefined ? o.x : 960;
    const y = o.y !== undefined ? o.y : 540;
    const w = o.w || 860;
    const h = o.h || 240;
    const t0 = o.t0 || 0.2;
    const hp = C.seg(lt, t0, t0 + (o.dur || 0.65), C.ease.outCubic);

    g.save();
    // Paper card
    C.roundRect(g, x - w / 2, y - h / 2, w, h, 10, {
      fill: o.paperColor || '#FAF7F0',
      stroke: C.PAL.ink,
      lw: 3.5,
      shadow: true
    });

    // Header / Source line
    if (o.source) {
      g.font = '700 20px "Space Mono", monospace';
      g.fillStyle = '#64748B';
      g.textAlign = 'left';
      g.fillText(o.source.toUpperCase(), x - w / 2 + 36, y - h / 2 + 40);
      C.line(g, x - w / 2 + 36, y - h / 2 + 54, x + w / 2 - 36, y - h / 2 + 54, {
        lw: 1.5,
        color: '#CBD5E1'
      });
    }

    const lines = String(o.text || '').split('\n');
    const fontSize = o.size || 32;
    g.font = 'italic 700 ' + fontSize + 'px "Merriweather", Georgia, serif';
    g.textAlign = 'left';
    g.textBaseline = 'middle';

    const lineH = fontSize * 1.45;
    const startY = y + (o.source ? 16 : 0) - ((lines.length - 1) * lineH) / 2;
    const leftX = x - w / 2 + 44;

    lines.forEach((l, idx) => {
      const ly = startY + idx * lineH;
      const lw = g.measureText(l).width;

      // Animated yellow highlighter bar behind text
      const lineP = C.clamp(hp * lines.length - idx, 0, 1);
      if (lineP > 0) {
        g.fillStyle = o.highlightColor || C.PAL.highlighter;
        g.fillRect(leftX - 6, ly - fontSize * 0.58, (lw + 12) * lineP, fontSize * 1.15);
      }

      g.fillStyle = C.PAL.ink;
      g.fillText(l, leftX, ly);
    });

    g.restore();
  }

  /**
   * 6. HAND-DRAWN CALLOUT ARROW & LABEL
   * Points from `[fromX, fromY]` (where text sits) to `[toX, toY]` (the target object).
   */
  function callout(g, lt, opts) {
    const o = opts || {};
    const t0 = o.t0 || 0;
    if (lt < t0) return;

    const p = C.seg(lt, t0, t0 + 0.35, C.ease.outCubic);
    const from = o.from || [700, 300];
    const to = o.to || [850, 420];
    const col = o.color || C.PAL.ink;

    g.save();
    g.globalAlpha = p;

    // Text label at `from`
    g.font = '700 ' + (o.size || 40) + 'px "Caveat", "Kalam", cursive';
    g.fillStyle = col;
    g.textAlign = o.align || 'center';
    g.textBaseline = 'bottom';
    g.fillText(o.text || '', from[0], from[1] - 8);

    if (o.sub) {
      g.font = '700 ' + Math.round((o.size || 40) * 0.65) + 'px "Nunito", sans-serif';
      g.fillStyle = o.subColor || '#475569';
      g.fillText(o.sub, from[0], from[1] + 20);
    }

    // Curved arrow from label to target
    C.arrow(g, from[0], from[1] + (o.sub ? 26 : 4), to[0], to[1], {
      p: p,
      color: col,
      lw: 3.5,
      curve: o.curve !== false,
      curveY: o.curveY !== undefined ? o.curveY : -35
    });

    g.restore();
  }

  /**
   * 7. CLEAN PILL BADGE / PRICE TAG / CHAPTER HEADER
   */
  function badge(g, lt, opts) {
    const o = opts || {};
    const t0 = o.t0 || 0;
    if (lt < t0) return;

    const sc = C.pop(lt, t0, 0.28);
    const x = o.x !== undefined ? o.x : 960;
    const y = o.y !== undefined ? o.y : 120;
    const size = o.size || 28;
    const text = String(o.text || '');

    g.save();
    g.translate(x, y);
    g.scale(sc, sc);

    g.font = '800 ' + size + 'px "Nunito", sans-serif';
    const tw = g.measureText(text).width;
    const w = Math.max(o.w || 0, tw + 48);
    const h = o.h || size + 26;

    C.roundRect(g, -w / 2, -h / 2, w, h, o.rad !== undefined ? o.rad : h / 2, {
      fill: o.fill || '#FFFFFF',
      stroke: o.stroke || C.PAL.ink,
      lw: 3.5,
      shadow: true
    });

    g.fillStyle = o.color || C.PAL.ink;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, 0, 2);
    g.restore();
  }

  window.TEXT = {
    blackScreen,
    speechBubble,
    subtitle,
    stamp,
    highlightQuote,
    callout,
    badge
  };
})();