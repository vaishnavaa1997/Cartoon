/**
 * MODULE 08: UNIVERSAL SCIENCE, SPACE, HISTORY & TECH BREAKDOWN CREATOR (engine/08_diagrams.js)
 * 100% Composable Diagram Engine for explaining how ANY machine, software,
 * biological system, physical force, supply chain, or orbital system works.
 */
(function () {
  const C = window.CORE;

  /**
   * 1. NODE & ANIMATED PIPE/PACKET FLOW NETWORK (`DIAGRAM.flow(g, lt, opts)`)
   * Explains software architectures, APIs, supply chains, money flows, or plumbing.
   *
   * Usage:
   *   DIAGRAM.flow(g, lt, {
   *     nodes: [
   *       { id: 'a', x: 420, y: 540, w: 220, h: 120, label: 'INPUT', sub: 'Raw Data', color: '#DBEAFE' },
   *       { id: 'b', x: 960, y: 540, w: 240, h: 140, label: 'ENGINE', sub: 'Processing', color: '#FEF08A' },
   *       { id: 'c', x: 1500, y: 540, w: 220, h: 120, label: 'OUTPUT', sub: 'Result', color: '#DCFCE7' }
   *     ],
   *     links: [
   *       { from: 'a', to: 'b', label: 'API Call', packetColor: '#3B82F6', style: 'pipe' },
   *       { from: 'b', to: 'c', label: 'Response', packetColor: '#22C55E', style: 'pipe' }
   *     ]
   *   });
   */
  function flow(g, lt, opts) {
    const o = opts || {};
    const nodes = o.nodes || [];
    const links = o.links || [];
    const nodeMap = {};
    nodes.forEach((n) => { if (n.id) nodeMap[n.id] = n; });

    g.save();

    // 1. Draw pipes/links + animated flowing packets
    links.forEach((lk, idx) => {
      const n0 = typeof lk.from === 'object' ? lk.from : nodeMap[lk.from];
      const n1 = typeof lk.to === 'object' ? lk.to : nodeMap[lk.to];
      if (!n0 || !n1) return;

      const x0 = n0.x, y0 = n0.y, x1 = n1.x, y1 = n1.y;
      const style = lk.style || 'pipe';

      if (style === 'pipe') {
        C.line(g, x0, y0, x1, y1, { lw: lk.lw || 18, color: C.PAL.ink });
        C.line(g, x0, y0, x1, y1, { lw: (lk.lw || 18) - 6, color: lk.pipeColor || '#CBD5E1' });
      } else {
        C.arrow(g, x0, y0, x1, y1, {
          lw: lk.lw || 4.5,
          color: lk.color || C.PAL.ink,
          dash: style === 'dashed' ? [12, 10] : undefined,
          curve: lk.curve,
          curveY: lk.curveY
        });
      }

      // Animated data/fluid/money packets traveling along the link
      if (lk.packets !== false) {
        const count = lk.packetCount || 3;
        const speed = lk.speed || 0.55;
        for (let i = 0; i < count; i++) {
          const u = ((lt * speed + i / count + idx * 0.17) % 1);
          const px = C.lerp(x0, x1, u);
          const py = C.lerp(y0, y1, u);
          C.circle(g, px, py, lk.packetR || 9, {
            fill: lk.packetColor || '#3B82F6',
            lw: 2.5
          });
        }
      }

      if (lk.label) {
        const mx = (x0 + x1) / 2;
        const my = (y0 + y1) / 2 - 26;
        g.font = '800 20px "Nunito", sans-serif';
        g.fillStyle = C.PAL.ink;
        g.textAlign = 'center';
        g.fillText(lk.label, mx, my);
      }
    });

    // 2. Draw nodes
    nodes.forEach((n, idx) => {
      const sc = C.pop(lt, n.t0 !== undefined ? n.t0 : idx * 0.1, 0.28);
      if (sc <= 0.01) return;
      const w = n.w || 210, h = n.h || 115;

      g.save();
      g.translate(n.x, n.y);
      g.scale(sc, sc);

      if (n.shape === 'circle') {
        C.circle(g, 0, 0, w / 2, { fill: n.color || '#FFFFFF', lw: 4, shadow: true });
      } else {
        C.roundRect(g, -w / 2, -h / 2, w, h, n.rad || 14, {
          fill: n.color || '#FFFFFF',
          hatch: n.hatch,
          lw: 4,
          shadow: true
        });
      }

      if (n.parts && window.CHAR) {
        window.CHAR.renderParts(g, n.parts, lt);
      }

      if (n.label) {
        g.font = '900 ' + (n.size || 26) + 'px "Nunito", sans-serif';
        g.fillStyle = n.textColor || C.PAL.ink;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(n.label, 0, n.sub ? -14 : 0);
      }
      if (n.sub) {
        g.font = '700 19px "Space Mono", monospace';
        g.fillStyle = '#475569';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(n.sub, 0, 18);
      }
      g.restore();
    });

    g.restore();
  }

  /**
   * 2. UNIVERSAL X-RAY / EXPLODED LAYER CUTAWAY CREATOR (`DIAGRAM.cutaway(g, lt, opts)`)
   * Explains internal layers or parts of ANY machine, hardware chip, organ, building, or planet.
   *
   * Usage:
   *   DIAGRAM.cutaway(g, lt, {
   *     x: 960, y: 520, explode: C.seg(lt, 0.2, 1.0),
   *     layers: [
   *       { label: 'COOLING SHELL', sub: 'Titanium Alloy', w: 420, h: 70, color: '#94A3B8' },
   *       { label: 'LOGIC CORE', sub: '3nm Silicon', w: 360, h: 65, color: '#38BDF8', highlight: true },
   *       { label: 'POWER BASE', sub: '1200W Bus', w: 420, h: 75, color: '#475569' }
   *     ]
   *   });
   */
  function cutaway(g, lt, opts) {
    const o = opts || {};
    const cx = o.x !== undefined ? o.x : 960;
    const cy = o.y !== undefined ? o.y : 520;
    const explode = o.explode !== undefined ? o.explode : C.seg(lt, o.t0 || 0.2, (o.t0 || 0.2) + 0.8, C.ease.outCubic);
    const layers = o.layers || [];
    const gap = (o.gap || 58) * explode;

    g.save();
    const totalH = layers.reduce((acc, l) => acc + (l.h || 70), 0) + Math.max(0, layers.length - 1) * gap;
    let curY = cy - totalH / 2;

    layers.forEach((l, idx) => {
      const lw = l.w || 420;
      const lh = l.h || 70;
      const ly = curY + lh / 2;
      const isDimmed = o.isolateIdx !== undefined && o.isolateIdx !== null && o.isolateIdx !== idx;

      g.save();
      g.globalAlpha = isDimmed ? 0.25 : 1.0;

      C.roundRect(g, cx - lw / 2, curY, lw, lh, l.rad || 10, {
        fill: l.color || '#CBD5E1',
        hatch: l.hatch,
        lw: l.highlight ? 5 : 3.8,
        stroke: l.highlight ? '#FACC15' : C.PAL.ink,
        shadow: true
      });

      if (l.parts && window.CHAR) {
        g.save();
        g.translate(cx, ly);
        window.CHAR.renderParts(g, l.parts, lt);
        g.restore();
      }

      // Leader-line technical callout on alternating or right side
      if (l.label && explode > 0.35) {
        const side = l.side || (idx % 2 === 0 ? 1 : -1);
        const startX = cx + side * (lw / 2 + 10);
        const endX = cx + side * (lw / 2 + 140);
        C.line(g, startX, ly, endX, ly, { lw: 3, color: C.PAL.ink });
        C.circle(g, startX, ly, 5, { fill: C.PAL.ink, stroke: false });

        g.font = '900 24px "Nunito", sans-serif';
        g.fillStyle = C.PAL.ink;
        g.textAlign = side > 0 ? 'left' : 'right';
        g.textBaseline = 'bottom';
        g.fillText(l.label, endX + side * 12, ly - 2);

        if (l.sub) {
          g.font = '700 18px "Space Mono", monospace';
          g.fillStyle = '#475569';
          g.textBaseline = 'top';
          g.fillText(l.sub, endX + side * 12, ly + 4);
        }
      }

      g.restore();
      curY += lh + gap;
    });
    g.restore();
  }

  /**
   * 3. CIRCULAR FEEDBACK LOOP / CYCLE CREATOR (`DIAGRAM.cycle(g, lt, opts)`)
   * Perfect for economic loops (Video 2 "Round-Trip Investing"), biological cycles, or physics loops.
   */
  function cycle(g, lt, opts) {
    const o = opts || {};
    const cx = o.x !== undefined ? o.x : 960;
    const cy = o.y !== undefined ? o.y : 520;
    const r = o.r || 260;
    const steps = o.steps || [];
    const n = steps.length;
    if (!n) return;

    g.save();
    // Dashed ring
    g.strokeStyle = 'rgba(24,24,27,0.22)';
    g.lineWidth = 4;
    g.setLineDash([12, 10]);
    g.beginPath();
    g.arc(cx, cy, r, 0, Math.PI * 2);
    g.stroke();
    g.setLineDash([]);

    // Center title
    if (o.centerLabel) {
      g.font = '900 32px "Caveat", cursive';
      g.fillStyle = C.PAL.ink;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(o.centerLabel, cx, cy);
    }

    steps.forEach((st, i) => {
      const a0 = (i / n) * Math.PI * 2 - Math.PI / 2;
      const a1 = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2;
      const sx = cx + Math.cos(a0) * r;
      const sy = cy + Math.sin(a0) * r;
      const nx = cx + Math.cos(a1) * r;
      const ny = cy + Math.sin(a1) * r;

      // Arrow to next step
      const midX = (sx + nx) / 2 + Math.cos((a0 + a1) / 2) * 35;
      const midY = (sy + ny) / 2 + Math.sin((a0 + a1) / 2) * 35;
      C.arrow(g, sx, sy, nx, ny, {
        lw: 4.5,
        color: st.arrowColor || C.PAL.ink,
        curve: true,
        curveX: (midX - (sx + nx) / 2),
        curveY: (midY - (sy + ny) / 2)
      });

      const w = st.w || 200, h = st.h || 95;
      C.roundRect(g, sx - w / 2, sy - h / 2, w, h, 14, {
        fill: st.color || '#FFFFFF',
        lw: 3.8,
        shadow: true
      });
      g.font = '900 22px "Nunito", sans-serif';
      g.fillStyle = C.PAL.ink;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(st.label || '', sx, sy - (st.sub ? 10 : 0));
      if (st.sub) {
        g.font = '700 18px "Space Mono", monospace';
        g.fillStyle = '#475569';
        g.fillText(st.sub, sx, sy + 16);
      }
    });
    g.restore();
  }

  /**
   * 4. SIDE-BY-SIDE SCALE COMPARISON ARENA (`DIAGRAM.scaleCompare(g, lt, opts)`)
   */
  function scaleCompare(g, lt, opts) {
    const o = opts || {};
    const fy = o.floorY !== undefined ? o.floorY : 820;
    const items = o.items || [];
    if (!items.length) return;

    let maxH = 0;
    items.forEach((it) => { if ((it.size || 1) > maxH) maxH = it.size || 1; });

    g.save();
    const span = 1360;
    const startX = 960 - span / 2;

    items.forEach((it, i) => {
      const ix = items.length === 1 ? 960 : startX + (i / (items.length - 1)) * span;
      const sc = C.pop(lt, it.t0 !== undefined ? it.t0 : i * 0.2, 0.35);
      const pixelH = Math.max(48, ((it.size || 1) / maxH) * 520) * sc;
      const pixelW = it.w || Math.min(220, Math.max(64, pixelH * 0.45));

      C.roundRect(g, ix - pixelW / 2, fy - pixelH, pixelW, pixelH, 8, {
        fill: it.color || '#3B82F6',
        hatch: true,
        lw: 3.8,
        shadow: true
      });

      // Dimension bracket & label
      g.font = '900 26px "Nunito", sans-serif';
      g.fillStyle = C.PAL.ink;
      g.textAlign = 'center';
      g.fillText(it.label || '', ix, fy + 42);

      if (it.metric) {
        g.font = '700 34px "Caveat", cursive';
        g.fillStyle = it.color || C.PAL.red;
        g.fillText(it.metric, ix, fy - pixelH - 20);
      }
    });
    g.restore();
  }

  /**
   * 5. UNIVERSAL ORBITAL / ATOMIC / SOLAR SYSTEM CREATOR (`DIAGRAM.orbit(g, t, opts)`)
   * Works for Solar Systems, Black Hole Accretion Disks, Satellites, or Atomic Bohr Models!
   */
  function orbit(g, t, opts) {
    const o = opts || {};
    const cx = o.x !== undefined ? o.x : 960;
    const cy = o.y !== undefined ? o.y : 540;
    const coreR = o.coreR || 64;
    const rings = o.rings || [
      { rx: 180, ry: 180, rot: 0, bodies: [{ r: 16, color: '#38BDF8', speed: 1.5, label: 'e-' }] },
      { rx: 310, ry: 310, rot: 0, bodies: [{ r: 22, color: '#4ADE80', speed: 0.9 }] }
    ];

    g.save();
    g.translate(cx, cy);

    // Draw orbit tracks
    rings.forEach((rg) => {
      g.save();
      if (rg.rot) g.rotate((rg.rot * Math.PI) / 180);
      g.strokeStyle = rg.trackColor || 'rgba(148, 163, 184, 0.45)';
      g.lineWidth = 3;
      g.setLineDash(rg.dash || [10, 8]);
      g.beginPath();
      g.ellipse(0, 0, rg.rx || 200, rg.ry || rg.rx || 200, 0, 0, Math.PI * 2);
      g.stroke();
      g.setLineDash([]);
      g.restore();
    });

    // Central Core (Star / Planet / Nucleus)
    C.circle(g, 0, 0, coreR, { fill: o.coreColor || '#FACC15', lw: 4, shadow: true });
    if (o.coreLabel) {
      g.font = '900 26px "Nunito", sans-serif';
      g.fillStyle = o.coreTextColor || C.PAL.ink;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(o.coreLabel, 0, 0);
    }

    // Orbiting Bodies
    rings.forEach((rg, rIdx) => {
      const rx = rg.rx || 200, ry = rg.ry || rx;
      const rotRad = ((rg.rot || 0) * Math.PI) / 180;
      (rg.bodies || []).forEach((b, bIdx) => {
        const ang = (b.phase || bIdx * 2.1 + rIdx) + t * (b.speed !== undefined ? b.speed : 1.2);
        const lx = Math.cos(ang) * rx;
        const ly = Math.sin(ang) * ry;
        const bx = lx * Math.cos(rotRad) - ly * Math.sin(rotRad);
        const by = lx * Math.sin(rotRad) + ly * Math.cos(rotRad);

        C.circle(g, bx, by, b.r || 16, { fill: b.color || '#38BDF8', lw: 3.5 });
        if (b.label) {
          g.font = '800 18px "Nunito", sans-serif';
          g.fillStyle = b.labelColor || '#FFFFFF';
          g.textAlign = 'center';
          g.textBaseline = 'middle';
          g.fillText(b.label, bx, by - (b.r || 16) - 16);
        }
      });
    });

    g.restore();
  }

  window.DIAGRAM = {
    flow,
    cutaway,
    cycle,
    scaleCompare,
    orbit
  };
})();