/**
 * MODULE 07: UNIVERSAL HAND-DRAWN CHARTS, COUNTERS, RECEIPTS & TIMELINES (engine/07_charts.js)
 * 100% Data-Driven Editorial Cartoon Visualizations with diagonal hatching,
 * bold ink outlines, trend arrows, live counters, and crash/fire animations.
 */
(function () {
  const C = window.CORE;

  /**
   * 1. HAND-DRAWN HATCHED BAR CHART (`CHART.bar(g, lt, opts)`)
   * Supports positive & negative bars (zero-baseline), diagonal hatching,
   * jagged trend arrows, and crumbling/burning crash effects!
   *
   * Usage:
   *   CHART.bar(g, lt, {
   *     x: 960, y: 500, w: 980, h: 480,
   *     title: 'ANNUAL CASH FLOW',
   *     unit: '$', suffix: 'B',
   *     bars: [
   *       { label: '2023', value: 12.4, color: '#22C55E', hatch: true },
   *       { label: '2025', value: -31.4, color: '#EF4444', hatch: true },
   *       { label: '2026', value: -80.7, color: '#DC2626', hatch: true, fire: true }
   *     ],
   *     trendArrow: { color: '#DC2626', t0: 0.8 },
   *     t0: 0.1, dur: 1.0
   *   });
   */
  function bar(g, lt, opts) {
    const o = opts || {};
    const cx = o.x !== undefined ? o.x : 960;
    const cy = o.y !== undefined ? o.y : 480;
    const w = o.w || 960;
    const h = o.h || 460;
    const left = cx - w / 2;
    const top = cy - h / 2;
    const bars = o.bars || o.data || [];
    const t0 = o.t0 !== undefined ? o.t0 : 0.1;
    const dur = o.dur !== undefined ? o.dur : 0.9;

    if (!bars.length) return;

    // Determine min & max values to position the zero baseline
    let minVal = 0, maxVal = 0;
    bars.forEach((b) => {
      if (b.value < minVal) minVal = b.value;
      if (b.value > maxVal) maxVal = b.value;
    });
    if (maxVal === 0 && minVal === 0) maxVal = 100;

    const totalSpan = (maxVal - minVal) || 1;
    const zeroRatio = maxVal / totalSpan; // 1.0 if all positive, 0.0 if all negative
    const zeroY = top + C.clamp(zeroRatio, 0.15, 0.88) * h;

    g.save();

    // Title
    if (o.title) {
      g.font = '900 ' + (o.titleSize || 38) + 'px "Nunito", sans-serif';
      g.fillStyle = o.titleColor || C.PAL.ink;
      g.textAlign = 'center';
      g.fillText(o.title, cx, top - 48);
    }

    // Subtle horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const gy = top + (i / 4) * h;
      C.line(g, left, gy, left + w, gy, { lw: 1.5, color: 'rgba(0,0,0,0.08)', dash: [8, 8] });
    }

    const slotW = w / bars.length;
    const barW = Math.min(o.barW || 120, slotW * 0.58);
    const barTops = [];

    bars.forEach((b, i) => {
      const bt0 = b.t0 !== undefined ? b.t0 : t0 + i * (dur / Math.max(1, bars.length)) * 0.45;
      const p = C.seg(lt, bt0, bt0 + dur * 0.65, C.ease.outBack);
      const val = b.value * p;
      const bh = (Math.abs(val) / totalSpan) * (h * 0.82);
      const bx = left + i * slotW + (slotW - barW) / 2;
      const isNeg = b.value < 0;
      const by = isNeg ? zeroY : zeroY - bh;
      const col = b.color || (isNeg ? C.PAL.red : C.PAL.green);

      barTops.push({ x: bx + barW / 2, y: isNeg ? zeroY + bh : zeroY - bh });

      if (bh > 1) {
        C.roundRect(g, bx, by, barW, bh, 6, {
          fill: col,
          hatch: b.hatch !== false,
          hatchColor: 'rgba(0,0,0,0.22)',
          lw: 3.8,
          shadow: true
        });
      }

      // Optional flames on crashing/hot bar
      if (b.fire && p > 0.6 && window.PROP) {
        const fy = isNeg ? by + bh : by;
        window.PROP.build(g, {
          x: bx + barW / 2,
          y: fy,
          shadow: false,
          t: lt,
          parts: [
            { type: 'flame', x: -18, y: 0, r: 22 },
            { type: 'flame', x: 16, y: 4, r: 18 },
            { type: 'flame', x: 0, y: -6, r: 26 }
          ]
        });
      }

      // Value label (handwritten style)
      if (p > 0.1) {
        const dispVal = (b.value * C.clamp(p, 0, 1)).toFixed(b.decimals !== undefined ? b.decimals : (Math.abs(b.value) % 1 !== 0 ? 1 : 0));
        const sign = b.value < 0 ? '-' : (b.plus ? '+' : '');
        const valStr = b.displayValue || (sign + (o.unit || '') + Math.abs(dispVal) + (o.suffix || ''));

        g.font = '700 ' + (o.valueSize || 42) + 'px "Caveat", "Kalam", cursive';
        g.fillStyle = b.valueColor || col;
        g.textAlign = 'center';
        g.textBaseline = isNeg ? 'top' : 'bottom';
        g.fillText(valStr, bx + barW / 2, isNeg ? by + bh + 12 : by - 10);
      }

      // Category label on X-axis
      if (b.label) {
        g.font = '800 ' + (o.labelSize || 24) + 'px "Nunito", sans-serif';
        g.fillStyle = C.PAL.ink;
        g.textAlign = 'center';
        g.textBaseline = isNeg ? 'bottom' : 'top';
        g.fillText(b.label, bx + barW / 2, isNeg ? zeroY - 12 : zeroY + 14);
      }
    });

    // Bold L-Axis & Zero Baseline
    C.line(g, left, top - 15, left, top + h + 10, { lw: 5, color: C.PAL.ink });
    C.line(g, left - 10, zeroY, left + w + 15, zeroY, { lw: 5, color: C.PAL.ink });

    // Optional Trend Arrow across bar tops
    if (o.trendArrow && barTops.length >= 2) {
      const ta = typeof o.trendArrow === 'object' ? o.trendArrow : {};
      const ap = C.seg(lt, ta.t0 || (t0 + dur * 0.5), (ta.t0 || (t0 + dur * 0.5)) + 0.5, C.ease.outCubic);
      const first = barTops[0];
      const last = barTops[barTops.length - 1];
      C.arrow(g, first.x, first.y - 35, last.x, last.y - 35, {
        p: ap,
        lw: 6,
        headSize: 22,
        color: ta.color || (last.y > first.y ? C.PAL.red : C.PAL.green)
      });
    }

    g.restore();
  }

  /**
   * 2. JAGGED EDITORIAL LINE GRAPH (`CHART.line(g, lt, opts)`)
   * Supports multi-series lines, hatched/shaded area fills, live playhead dot, and anomaly callouts.
   */
  function line(g, lt, opts) {
    const o = opts || {};
    const cx = o.x !== undefined ? o.x : 960;
    const cy = o.y !== undefined ? o.y : 500;
    const w = o.w || 1020;
    const h = o.h || 460;
    const left = cx - w / 2;
    const top = cy - h / 2;
    const bottom = top + h;
    const t0 = o.t0 !== undefined ? o.t0 : 0.1;
    const dur = o.dur !== undefined ? o.dur : 1.1;
    const p = C.seg(lt, t0, t0 + dur, C.ease.outCubic);

    const seriesList = o.series || [{ values: o.values || [10, 40, 30, 80, 20], color: o.color || C.PAL.green, area: true }];
    let minV = o.min !== undefined ? o.min : Infinity;
    let maxV = o.max !== undefined ? o.max : -Infinity;
    seriesList.forEach((s) => {
      (s.values || []).forEach((v) => {
        if (v < minV) minV = v;
        if (v > maxV) maxV = v;
      });
    });
    if (minV === Infinity) { minV = 0; maxV = 100; }
    const span = (maxV - minV) || 1;

    g.save();

    if (o.title) {
      g.font = '900 38px "Nunito", sans-serif';
      g.fillStyle = C.PAL.ink;
      g.textAlign = 'center';
      g.fillText(o.title, cx, top - 45);
    }

    // Grid
    for (let i = 0; i <= 4; i++) {
      const gy = top + (i / 4) * h;
      C.line(g, left, gy, left + w, gy, { lw: 1.5, color: 'rgba(0,0,0,0.08)', dash: [8, 8] });
    }

    // X-Axis Labels
    if (Array.isArray(o.xLabels)) {
      g.font = '800 22px "Nunito", sans-serif';
      g.fillStyle = C.PAL.ink;
      g.textAlign = 'center';
      o.xLabels.forEach((lbl, i) => {
        const lx = left + (i / Math.max(1, o.xLabels.length - 1)) * w;
        g.fillText(lbl, lx, bottom + 34);
      });
    }

    seriesList.forEach((s) => {
      const vals = s.values || [];
      if (vals.length < 2) return;
      const col = s.color || C.PAL.red;
      const pts = vals.map((v, i) => ({
        x: left + (i / (vals.length - 1)) * w,
        y: bottom - ((v - minV) / span) * (h * 0.86) - h * 0.06
      }));

      g.save();
      g.beginPath();
      g.rect(left, top - 30, w * p, h + 60);
      g.clip();

      // Area fill underneath line
      if (s.area !== false) {
        g.beginPath();
        g.moveTo(pts[0].x, bottom);
        pts.forEach((pt) => g.lineTo(pt.x, pt.y));
        g.lineTo(pts[pts.length - 1].x, bottom);
        g.closePath();
        g.fillStyle = C.rgba(col, 0.20);
        g.fill();
      }

      // Thick jagged line
      C.inkStyle(g, s.lw || 6, col);
      g.beginPath();
      pts.forEach((pt, idx) => {
        if (idx === 0) g.moveTo(pt.x, pt.y);
        else g.lineTo(pt.x, pt.y);
      });
      g.stroke();

      // Vertex dots
      pts.forEach((pt) => {
        C.circle(g, pt.x, pt.y, 7, { fill: '#FFFFFF', stroke: col, lw: 3.5 });
      });

      g.restore();

      // Anomaly / Event Pin
      if (s.anomalyIdx !== undefined && pts[s.anomalyIdx] && p >= s.anomalyIdx / (vals.length - 1)) {
        const apt = pts[s.anomalyIdx];
        C.circle(g, apt.x, apt.y, 11, { fill: col, stroke: C.PAL.ink, lw: 3.5 });
        if (s.anomalyLabel && window.TEXT) {
          window.TEXT.badge(g, lt, {
            x: apt.x,
            y: apt.y - 48,
            text: s.anomalyLabel,
            fill: col,
            color: '#FFFFFF',
            size: 22,
            t0: t0 + 0.3
          });
        }
      }
    });

    // Axes
    C.line(g, left, top - 15, left, bottom, { lw: 5, color: C.PAL.ink });
    C.line(g, left, bottom, left + w + 15, bottom, { lw: 5, color: C.PAL.ink });

    g.restore();
  }

  /**
   * 3. EXPLODED PIE / DONUT CHART (`CHART.pie(g, lt, opts)`)
   */
  function pie(g, lt, opts) {
    const o = opts || {};
    const cx = o.x !== undefined ? o.x : 960;
    const cy = o.y !== undefined ? o.y : 540;
    const r = o.r || 210;
    const t0 = o.t0 || 0.1;
    const p = C.seg(lt, t0, t0 + (o.dur || 0.9), C.ease.outCubic);
    const slices = o.slices || [];
    const total = slices.reduce((acc, s) => acc + (s.value || 1), 0) || 1;

    g.save();
    let curAngle = -Math.PI / 2;

    slices.forEach((s, idx) => {
      const span = ((s.value || 1) / total) * Math.PI * 2 * p;
      const midA = curAngle + span / 2;
      const explode = s.explode ? 22 * p : 0;
      const sx = cx + Math.cos(midA) * explode;
      const sy = cy + Math.sin(midA) * explode;

      g.beginPath();
      g.moveTo(sx, sy);
      g.arc(sx, sy, r, curAngle, curAngle + span);
      g.closePath();
      g.fillStyle = s.color || ['#3B82F6', '#22C55E', '#FACC15', '#EF4444', '#A855F7'][idx % 5];
      g.fill();
      C.inkStyle(g, 3.8, C.PAL.ink);
      g.stroke();

      if (s.label && p > 0.6) {
        const lx = sx + Math.cos(midA) * (r + 56);
        const ly = sy + Math.sin(midA) * (r + 56);
        g.font = '800 24px "Nunito", sans-serif';
        g.fillStyle = C.PAL.ink;
        g.textAlign = Math.cos(midA) >= 0 ? 'left' : 'right';
        g.textBaseline = 'middle';
        g.fillText(s.label, lx, ly);
      }

      curAngle += span;
    });

    if (o.donut) {
      C.circle(g, cx, cy, r * (typeof o.donut === 'number' ? o.donut : 0.48), {
        fill: o.holeColor || C.PAL.studioWall,
        lw: 3.8
      });
    }
    g.restore();
  }

  /**
   * 4. LIVE COUNTING SCOREBOARD / BIG NUMBER TICKER (`CHART.counter(g, lt, opts)`)
   * Matches Video 1 (`-$80.7B`, `$18,000,000 / hr`) with optional card or raw handwritten text.
   */
  function counter(g, lt, opts) {
    const o = opts || {};
    const x = o.x !== undefined ? o.x : 960;
    const y = o.y !== undefined ? o.y : 460;
    const t0 = o.t0 || 0.1;
    const dur = o.dur || 1.0;
    const p = C.seg(lt, t0, t0 + dur, C.ease.outCubic);
    const val = C.lerp(o.from || 0, o.to !== undefined ? o.to : 100, p);
    const dec = o.decimals !== undefined ? o.decimals : 0;
    const formatted = (o.prefix || '') + val.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + (o.suffix || '');

    g.save();
    if (o.card) {
      const cw = o.w || 540, ch = o.h || 200;
      C.roundRect(g, x - cw / 2, y - ch / 2, cw, ch, 16, {
        fill: o.bg || '#FFFFFF',
        hatch: o.hatch,
        lw: 4,
        shadow: true
      });
    }

    if (o.label) {
      g.font = '800 ' + (o.labelSize || 28) + 'px "Nunito", sans-serif';
      g.fillStyle = o.labelColor || '#475569';
      g.textAlign = 'center';
      g.fillText(o.label, x, y - (o.size || 96) * 0.68);
    }

    g.font = '700 ' + (o.size || 104) + 'px ' + (o.font || '"Caveat", "Kalam", cursive');
    g.fillStyle = o.color || C.PAL.ink;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(formatted, x, y);

    if (o.sub) {
      g.font = '700 28px "Nunito", sans-serif';
      g.fillStyle = o.subColor || '#64748B';
      g.fillText(o.sub, x, y + (o.size || 96) * 0.65);
    }
    g.restore();
  }

  /**
   * 5. ENDLESS UNROLLING RECEIPT / BILL / LEDGER (`CHART.receipt(g, lt, opts)`)
   * Matches Video 2 (02:30 unrolling $895B cloud receipt).
   */
  function receipt(g, lt, opts) {
    const o = opts || {};
    const x = o.x !== undefined ? o.x : 960;
    const topY = o.topY !== undefined ? o.topY : 120;
    const w = o.w || 420;
    const maxH = o.h || 720;
    const p = C.seg(lt, o.t0 || 0.1, (o.t0 || 0.1) + (o.dur || 1.1), C.ease.outCubic);
    const curH = Math.max(90, maxH * p);
    const items = o.items || [];

    g.save();
    // Paper strip with zig-zag bottom tear
    g.fillStyle = '#FAF7F0';
    g.strokeStyle = C.PAL.ink;
    g.lineWidth = 3.8;
    g.beginPath();
    g.moveTo(x - w / 2, topY);
    g.lineTo(x + w / 2, topY);
    g.lineTo(x + w / 2, topY + curH);
    const teeth = 12;
    const step = w / teeth;
    for (let i = teeth; i >= 0; i--) {
      const tx = x - w / 2 + i * step;
      const ty = topY + curH + (i % 2 === 0 ? 0 : -14);
      g.lineTo(tx, ty);
    }
    g.closePath();
    g.fill();
    g.stroke();

    // Clip content to unrolled height
    g.clip();

    g.font = '900 30px "Space Mono", monospace';
    g.fillStyle = C.PAL.ink;
    g.textAlign = 'center';
    g.fillText(o.title || 'INVOICE / RECEIPT', x, topY + 48);
    C.line(g, x - w / 2 + 28, topY + 72, x + w / 2 - 28, topY + 72, { lw: 2.5, dash: [8, 6] });

    g.font = '700 22px "Space Mono", monospace';
    items.forEach((it, idx) => {
      const iy = topY + 115 + idx * 48;
      g.textAlign = 'left';
      g.fillStyle = C.PAL.ink;
      g.fillText(it.label || '', x - w / 2 + 32, iy);
      g.textAlign = 'right';
      g.fillStyle = it.color || C.PAL.ink;
      g.fillText(it.cost || '', x + w / 2 - 32, iy);
    });

    if (o.total) {
      const ty = topY + maxH - 70;
      C.line(g, x - w / 2 + 28, ty - 34, x + w / 2 - 28, ty - 34, { lw: 3 });
      g.fillStyle = C.PAL.highlighter;
      g.fillRect(x - w / 2 + 24, ty - 22, w - 48, 44);
      g.font = '900 28px "Space Mono", monospace';
      g.fillStyle = C.PAL.red;
      g.textAlign = 'center';
      g.fillText('TOTAL: ' + o.total, x, ty + 8);
    }

    // Bottom paper roll cylinder
    C.roundRect(g, x - w / 2 - 8, topY + curH - 18, w + 16, 28, 14, { fill: '#E2E8F0', lw: 3.5 });
    g.restore();
  }

  /**
   * 6. HORIZONTAL TIMELINE / ERA PROGRESSION (`CHART.timeline(g, lt, opts)`)
   */
  function timeline(g, lt, opts) {
    const o = opts || {};
    const y = o.y !== undefined ? o.y : 540;
    const x0 = o.x0 !== undefined ? o.x0 : 240;
    const x1 = o.x1 !== undefined ? o.x1 : 1680;
    const events = o.events || [];
    const p = C.seg(lt, o.t0 || 0.1, (o.t0 || 0.1) + (o.dur || 1.0), C.ease.outCubic);

    g.save();
    C.arrow(g, x0, y, x1, y, { p: p, lw: 6, color: C.PAL.ink });

    events.forEach((ev, i) => {
      const u = events.length > 1 ? i / (events.length - 1) : 0.5;
      if (p < u) return;
      const ex = C.lerp(x0 + 60, x1 - 80, u);
      const above = i % 2 === 0;
      const cardY = above ? y - 110 : y + 110;

      C.line(g, ex, y, ex, cardY, { lw: 3.5, dash: [6, 6] });
      C.circle(g, ex, y, 12, { fill: ev.color || '#FACC15', lw: 3.8 });

      C.roundRect(g, ex - 110, cardY - 42, 220, 84, 12, {
        fill: '#FFFFFF',
        lw: 3.5,
        shadow: true
      });
      g.font = '900 24px "Fredoka", sans-serif';
      g.fillStyle = ev.color || C.PAL.red;
      g.textAlign = 'center';
      g.fillText(ev.year || ev.date || '', ex, cardY - 10);

      g.font = '700 20px "Nunito", sans-serif';
      g.fillStyle = C.PAL.ink;
      g.fillText(ev.label || '', ex, cardY + 20);
    });
    g.restore();
  }

  window.CHART = {
    bar,
    line,
    pie,
    counter,
    receipt,
    timeline
  };
})();