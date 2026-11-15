/**
 * MODULE 05: UNIVERSAL COMPOSABLE ENVIRONMENT CREATOR (engine/05_env.js)
 * Zero pre-made rooms. Builds ANY interior, exterior, era, biome, planet,
 * subterranean cutaway, or microscopic environment from universal layer primitives.
 */
(function () {
  const C = window.CORE;

  /**
   * 1. THE SIGNATURE STUDIO CURVE (`ENV.studio(g, opts)`)
   * Minimalist curved horizon backdrop used for metaphors, charts, and skits.
   * Accepts any custom `wall` and `floor` color or shorthand palette.
   */
  function studio(g, opts) {
    const o = opts || {};
    const palettes = {
      warm:      { wall: '#D8D2C5', floor: '#9E9789' },
      paper:     { wall: '#EFECE4', floor: '#C8C2B4' },
      parchment: { wall: '#E8DFC8', floor: '#B8A98A' },
      cool:      { wall: '#CBD5E1', floor: '#64748B' },
      mint:      { wall: '#D1FAE5', floor: '#6EE7B7' },
      rose:      { wall: '#FFE4E6', floor: '#FDA4AF' },
      amber:     { wall: '#FEF3C7', floor: '#FCD34D' },
      slate:     { wall: '#334155', floor: '#1E293B' },
      noir:      { wall: '#18181B', floor: '#09090B' },
      danger:    { wall: '#450A0A', floor: '#280505' },
      blueprint: { wall: '#1E3A8A', floor: '#172554', grid: true }
    };
    const pal = palettes[o.theme || 'warm'] || palettes.warm;
    const wallCol = o.wall || pal.wall;
    const floorCol = o.floor || pal.floor;
    const fy = o.floorY !== undefined ? o.floorY : 820;
    const curve = o.curve !== undefined ? o.curve : -22;

    g.save();
    g.fillStyle = wallCol;
    g.fillRect(0, 0, C.W, C.H);

    if (o.grid || pal.grid) {
      const gCol = o.gridColor || (pal.grid ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.05)');
      const step = o.gridStep || 60;
      for (let x = 0; x < C.W; x += step) C.line(g, x, 0, x, C.H, { lw: 1.2, color: gCol });
      for (let y = 0; y < C.H; y += step) C.line(g, 0, y, C.W, y, { lw: 1.2, color: gCol });
    }

    if (o.stripes) {
      g.fillStyle = o.stripeColor || 'rgba(0,0,0,0.035)';
      for (let x = 0; x < C.W; x += 80) g.fillRect(x, 0, 40, fy + 20);
    }

    if (o.spotlight !== false) {
      const grd = g.createRadialGradient(960, fy - 240, 60, 960, fy - 200, 860);
      grd.addColorStop(0, o.glowColor || 'rgba(255, 255, 255, 0.20)');
      grd.addColorStop(1, 'rgba(255, 255, 255, 0)');
      g.fillStyle = grd;
      g.fillRect(0, 0, C.W, C.H);
    }

    if (o.showFloor !== false) {
      g.fillStyle = floorCol;
      g.beginPath();
      g.moveTo(-20, fy);
      g.quadraticCurveTo(960, fy + curve, C.W + 20, fy);
      g.lineTo(C.W + 20, C.H + 20);
      g.lineTo(-20, C.H + 20);
      g.closePath();
      g.fill();

      C.inkStyle(g, 3.8, C.PAL.ink);
      g.beginPath();
      g.moveTo(-20, fy);
      g.quadraticCurveTo(960, fy + curve, C.W + 20, fy);
      g.stroke();
    }
    g.restore();
  }

  /**
   * 2. UNIVERSAL 1-CALL COMPOSABLE SCENE CREATOR (`ENV.create(g, recipe)`)
   * Builds any custom interior or exterior scene from a declarative recipe object.
   *
   * Example Recipe (can be defined in Step 10 `DICT.ENVS` or inline):
   *   ENV.create(g, {
   *     floorY: 820, t: gt,
   *     sky: { topColor: '#0F172A', botColor: '#1E293B', stars: 60, moon: { x: 1500, y: 180, r: 50 } },
   *     horizon: [{ type: 'peaks', count: 4, maxH: 380, color: '#334155', snow: true }],
   *     wall: { color: '#64748B', pattern: 'stone' }, // Omit `wall` for outdoor scenes
   *     structures: [
   *       { type: 'pillar', x: 240, w: 70 },
   *       { type: 'window', x: 1400, y: 340, w: 320, h: 300, shape: 'arched', view: 'night' }
   *     ],
   *     ground: { color: '#475569', style: 'cobblestone' },
   *     parts: [...], // Optional custom cartoon shapes
   *     particles: { shape: 'snow', count: 35 }
   *   });
   */
  function create(g, recipe) {
    const r = recipe || {};
    const fy = r.floorY !== undefined ? r.floorY : 820;
    const t = r.t !== undefined ? r.t : 0;

    g.save();

    // Layer 1: Sky / Space / Backdrop (if specified)
    if (r.sky) {
      sky(g, Object.assign({ floorY: r.ground === false ? C.H : fy, t: t }, r.sky));
    }

    // Layer 2: Distant Horizon Silhouettes (Mountains, Hills, Skylines, Waves, Craters, Stalactites)
    if (r.horizon) {
      horizon(g, Array.isArray(r.horizon) ? r.horizon : [r.horizon], fy, t);
    }

    // Layer 3: Interior Wall Surface (if indoor scene)
    if (r.wall) {
      wall(g, Object.assign({ floorY: fy, t: t }, typeof r.wall === 'string' ? { color: r.wall } : r.wall));
    }

    // Layer 4: Architectural & Midground Structures (Pillars, Arches, Beams, Windows, Doors, Trees, Lamps)
    if (Array.isArray(r.structures)) {
      structures(g, r.structures, fy, t);
    }

    // Layer 5: Custom Declarative Background Parts (via CHAR.renderParts)
    if (Array.isArray(r.parts) && window.CHAR && typeof window.CHAR.renderParts === 'function') {
      window.CHAR.renderParts(g, r.parts, t);
    }
    if (typeof r.drawBack === 'function') {
      r.drawBack(g, fy, t);
    }

    // Layer 6: Ground / Floor / Road / Water / Subterranean Strata
    if (r.ground !== false && r.ground) {
      ground(g, Object.assign({ y: fy, t: t }, typeof r.ground === 'string' ? { color: r.ground } : r.ground));
    }

    // Layer 7: Ambient Particles / Weather
    if (r.particles) {
      particles(g, t, r.particles);
    }

    g.restore();
  }

  /**
   * 3. SKY, SPACE, UNDERWATER & CELESTIAL LAYER (`ENV.sky`)
   */
  function sky(g, opts) {
    const o = opts || {};
    const fy = o.floorY !== undefined ? o.floorY : 820;
    const t = o.t || 0;

    g.save();
    if (o.topColor && o.botColor) {
      const grd = g.createLinearGradient(0, 0, 0, fy);
      grd.addColorStop(0, o.topColor);
      grd.addColorStop(1, o.botColor);
      g.fillStyle = grd;
    } else {
      g.fillStyle = o.color || o.topColor || '#E0F2FE';
    }
    g.fillRect(0, 0, C.W, fy);

    // Stars
    if (o.stars) {
      const count = typeof o.stars === 'number' ? o.stars : 75;
      const rand = C.rng(o.seed || 17);
      for (let i = 0; i < count; i++) {
        const sx = rand() * C.W;
        const sy = rand() * fy;
        const sr = 1.2 + rand() * 2.2;
        const alpha = 0.35 + 0.65 * Math.abs(Math.sin(t * 2.5 + i));
        g.fillStyle = 'rgba(255,255,255,' + alpha + ')';
        g.beginPath();
        g.arc(sx, sy, sr, 0, Math.PI * 2);
        g.fill();
      }
    }

    // Light Rays / Underwater Sunbeams
    if (o.rays) {
      g.fillStyle = o.rayColor || 'rgba(255,255,255,0.09)';
      for (let rx = 180; rx < 1750; rx += 380) {
        g.beginPath();
        g.moveTo(rx, 0); g.lineTo(rx + 110, 0);
        g.lineTo(rx + 270, fy); g.lineTo(rx - 50, fy);
        g.closePath(); g.fill();
      }
    }

    // Sun / Moon / Distant Planet in Sky
    if (o.celestial || o.sun || o.moon) {
      const cel = typeof (o.celestial || o.sun || o.moon) === 'object'
        ? (o.celestial || o.sun || o.moon)
        : { x: 1560, y: 175, r: 56, color: o.moon ? '#F8FAFC' : '#FACC15' };
      const cx = cel.x !== undefined ? cel.x : 1560;
      const cy = cel.y !== undefined ? cel.y : 175;
      const cr = cel.r || 56;
      C.circle(g, cx, cy, cr, { fill: cel.color || '#FACC15', lw: 3.5 });
      if (cel.rings) {
        g.strokeStyle = cel.ringColor || '#FDE68A';
        g.lineWidth = 10;
        g.beginPath();
        g.ellipse(cx, cy, cr * 1.75, cr * 0.35, -0.2, 0, Math.PI * 2);
        g.stroke();
      }
    }

    // Drifting Cartoon Clouds
    if (o.clouds) {
      const count = typeof o.clouds === 'number' ? o.clouds : 3;
      const cCol = o.cloudColor || '#FFFFFF';
      for (let i = 0; i < count; i++) {
        const cx = ((i * 620 + 280 + t * (10 + i * 3)) % (C.W + 260)) - 130;
        const cy = 130 + (i % 2) * 55;
        const sc = 0.85 + (i % 3) * 0.12;
        g.save();
        g.translate(cx, cy);
        g.scale(sc, sc);
        C.roundRect(g, -65, -18, 130, 38, 19, { fill: cCol, lw: 3.2 });
        C.circle(g, -22, -22, 24, { fill: cCol, lw: 3.2 });
        C.circle(g, 18, -26, 28, { fill: cCol, lw: 3.2 });
        g.fillStyle = cCol;
        g.fillRect(-58, -15, 116, 30);
        g.restore();
      }
    }
    g.restore();
  }

  /**
   * 4. PARAMETRIC HORIZON SILHOUETTE GENERATOR (`ENV.horizon`)
   * Supports:
   *   type: 'hills' | 'peaks' | 'skyline' | 'stepped' | 'craters' | 'stalactites' | 'waves' | 'poly'
   */
  function horizon(g, layers, floorY, t) {
    const fy = floorY !== undefined ? floorY : 820;
    (layers || []).forEach((l) => {
      if (!l) return;
      const type = l.type || 'hills';
      const col = l.color || '#94A3B8';
      const base = l.y !== undefined ? l.y : fy;

      g.save();
      C.inkStyle(g, 3.5, C.PAL.ink, col);

      if (type === 'hills' || type === 'dunes') {
        const amp = l.amp || 160;
        g.beginPath();
        g.moveTo(-20, base);
        g.quadraticCurveTo(480, base - amp, 960, base - amp * 0.3);
        g.quadraticCurveTo(1440, base - amp * 1.15, C.W + 20, base);
        g.closePath();
        g.fill(); g.stroke();
      } else if (type === 'peaks' || type === 'pyramids') {
        const count = l.count || 3;
        const maxH = l.maxH || 360;
        const span = C.W / count;
        for (let i = 0; i < count; i++) {
          const x0 = i * span - 60;
          const x1 = (i + 1) * span + 60;
          const mx = (x0 + x1) / 2;
          const ph = maxH * (0.75 + ((i * 37) % 35) / 100);
          g.fillStyle = col;
          g.beginPath();
          g.moveTo(x0, base);
          g.lineTo(mx, base - ph);
          g.lineTo(x1, base);
          g.closePath();
          g.fill(); g.stroke();

          if (l.snow) {
            g.fillStyle = '#F8FAFC';
            g.beginPath();
            g.moveTo(mx, base - ph);
            g.lineTo(mx - (x1 - x0) * 0.14, base - ph * 0.72);
            g.lineTo(mx + (x1 - x0) * 0.14, base - ph * 0.72);
            g.closePath();
            g.fill(); g.stroke();
          }
        }
      } else if (type === 'skyline') {
        // Parametric building skyline (works for modern cities, factories, or fortress walls)
        const count = l.count || 7;
        const rand = C.rng(l.seed || 23);
        const step = C.W / count;
        for (let i = 0; i < count; i++) {
          const bw = step * 0.78;
          const bh = (l.minH || 220) + rand() * ((l.maxH || 460) - (l.minH || 220));
          const bx = i * step + (step - bw) / 2;
          C.roundRect(g, bx, base - bh, bw, bh, 4, { fill: col, lw: 3.5 });

          if (l.windows !== false) {
            for (let wx = bx + 24; wx < bx + bw - 32; wx += 48) {
              for (let wy = base - bh + 32; wy < base - 50; wy += 60) {
                C.roundRect(g, wx, wy, 26, 34, 3, {
                  fill: l.windowColor || '#F8FAFC',
                  lw: 2
                });
              }
            }
          }
          if (l.chimneys && i % 2 === 0) {
            C.roundRect(g, bx + 30, base - bh - 120, 36, 120, 2, { fill: C.shadeColor(col, -15), lw: 3.5 });
            C.circle(g, bx + 48 + Math.sin((t || 0) * 2 + i) * 16, base - bh - 150, 26, { fill: '#64748B', lw: 2.5 });
          }
        }
      } else if (type === 'stepped') {
        // Stepped structures (Ancient temples, ziggurats, tiered monuments)
        const spots = l.positions || [320, 960, 1600];
        spots.forEach((sx, idx) => {
          const tiers = l.tiers || (idx === 1 ? 5 : 4);
          const baseW = l.baseW || 240;
          const tierH = l.tierH || 56;
          for (let j = 0; j < tiers; j++) {
            const tw = baseW - j * (baseW / (tiers + 1));
            C.roundRect(g, sx - tw / 2, base - (j + 1) * tierH, tw, tierH, 4, { fill: col, lw: 3.5 });
          }
        });
      } else if (type === 'craters') {
        [320, 980, 1560].forEach((cx, idx) => {
          g.beginPath();
          g.ellipse(cx, base, 160 - idx * 20, 36, 0, Math.PI, Math.PI * 2);
          g.fill(); g.stroke();
        });
      } else if (type === 'stalactites') {
        for (let sx = 60; sx < C.W; sx += 150) {
          const sh = 65 + ((sx * 37) % 95);
          g.beginPath();
          g.moveTo(sx - 35, 0); g.lineTo(sx, sh); g.lineTo(sx + 35, 0);
          g.closePath(); g.fill(); g.stroke();
        }
      } else if (type === 'poly' && Array.isArray(l.pts)) {
        if (window.CHAR) window.CHAR.renderParts(g, [{ type: 'poly', pts: l.pts, fill: col, lw: 3.5 }], t);
      }
      g.restore();
    });
  }

  /**
   * 5. PROCEDURAL INTERIOR WALL CREATOR (`ENV.wall`)
   * Supports `pattern`: 'plain' | 'brick' | 'stone' | 'wood' | 'tile' | 'metal' | 'wainscot' | 'acoustic' | 'grid' | 'bio'
   */
  function wall(g, opts) {
    const o = opts || {};
    const fy = o.floorY !== undefined ? o.floorY : 820;
    const col = o.color || '#D6CFC2';
    const pat = o.pattern || 'plain';

    g.save();
    g.fillStyle = col;
    g.fillRect(0, 0, C.W, fy);

    const lineCol = o.patternColor || 'rgba(0,0,0,0.14)';

    if (pat === 'stone') {
      for (let y = 80; y < fy; y += 80) {
        C.line(g, 0, y, C.W, y, { lw: 2.5, color: lineCol });
        const off = (Math.floor(y / 80) % 2) * 80;
        for (let x = off; x < C.W; x += 160) C.line(g, x, y - 80, x, y, { lw: 2.5, color: lineCol });
      }
    } else if (pat === 'brick') {
      for (let y = 42; y < fy; y += 42) {
        C.line(g, 0, y, C.W, y, { lw: 2, color: lineCol });
        const off = (Math.floor(y / 42) % 2) * 45;
        for (let x = off; x < C.W; x += 90) C.line(g, x, y - 42, x, y, { lw: 2, color: lineCol });
      }
    } else if (pat === 'tile' || pat === 'grid') {
      const step = o.step || 80;
      for (let x = 0; x < C.W; x += step) C.line(g, x, 0, x, fy, { lw: 1.5, color: lineCol });
      for (let y = 0; y < fy; y += step) C.line(g, 0, y, C.W, y, { lw: 1.5, color: lineCol });
    } else if (pat === 'wood') {
      for (let y = 0; y < fy; y += 64) C.line(g, 0, y, C.W, y, { lw: 2.5, color: lineCol });
    } else if (pat === 'metal') {
      for (let x = 240; x < C.W; x += 240) {
        C.line(g, x, 0, x, fy, { lw: 3, color: lineCol });
        for (let y = 60; y < fy; y += 120) {
          C.circle(g, x - 12, y, 3, { fill: 'rgba(255,255,255,0.25)', stroke: false });
          C.circle(g, x + 12, y, 3, { fill: 'rgba(255,255,255,0.25)', stroke: false });
        }
      }
    } else if (pat === 'wainscot') {
      const wy = fy - 220;
      g.fillStyle = o.wainscotColor || '#78350F';
      g.fillRect(0, wy, C.W, 220);
      C.line(g, 0, wy, C.W, wy, { lw: 4 });
      for (let x = 80; x < C.W; x += 240) {
        C.roundRect(g, x, wy + 28, 160, 150, 4, { fill: 'rgba(0,0,0,0.14)', lw: 2.5 });
      }
    } else if (pat === 'acoustic') {
      for (let ax = 160; ax < 1760; ax += 140) {
        for (let ay = 160; ay < 520; ay += 140) {
          C.roundRect(g, ax, ay, 110, 110, 6, { fill: C.shadeColor(col, -12), hatch: true, hatchColor: 'rgba(255,255,255,0.06)', lw: 2.5 });
        }
      }
    } else if (pat === 'bio') {
      for (let x = 0; x <= C.W; x += 160) {
        C.circle(g, x, 25, 85, { fill: C.shadeColor(col, 10), lw: 3 });
        C.circle(g, x, fy, 65, { fill: C.shadeColor(col, 10), lw: 3 });
      }
    }

    if (o.baseboard !== false && pat !== 'bio') {
      C.roundRect(g, -10, fy - 18, C.W + 20, 18, 0, {
        fill: o.baseboardColor || C.shadeColor(col, -30),
        lw: 3.5
      });
    }
    g.restore();
  }

  /**
   * 6. ARCHITECTURAL & MIDGROUND STRUCTURE PLACER (`ENV.structures`)
   * Places pillars, arches, ceiling beams, windows, doors, or trees at exact X positions.
   */
  function structures(g, list, floorY, t) {
    const fy = floorY !== undefined ? floorY : 820;
    (list || []).forEach((s) => {
      if (!s) return;
      const type = s.type || 'pillar';
      const x = s.x !== undefined ? s.x : 960;
      const col = s.color || '#94A3B8';

      if (type === 'pillar') {
        const w = s.w || 72;
        const topY = s.topY !== undefined ? s.topY : 50;
        C.roundRect(g, x - w / 2, topY, w, fy - topY, 4, { fill: col, lw: 3.5 });
        C.roundRect(g, x - w * 0.68, topY - 16, w * 1.36, 26, 4, { fill: C.shadeColor(col, -10), lw: 3.5 });
        C.roundRect(g, x - w * 0.68, fy - 28, w * 1.36, 28, 4, { fill: C.shadeColor(col, -10), lw: 3.5 });
      } else if (type === 'arch') {
        const w = s.w || 320, h = s.h || 640;
        C.roundRect(g, x - w / 2, fy - h, w, h, w / 2, { fill: s.fill || 'rgba(0,0,0,0.14)', lw: 4 });
      } else if (type === 'window') {
        drawWindow(g, Object.assign({ floorY: fy, t: t }, s));
      } else if (type === 'door') {
        const w = s.w || 180, h = s.h || 380;
        C.roundRect(g, x - w / 2, fy - h, w, h, s.arched ? w / 2 : 6, { fill: col, lw: 4, shadow: true });
        C.circle(g, x + w * 0.32, fy - h * 0.45, 7, { fill: '#FACC15', lw: 2.5 });
      } else if (type === 'tree') {
        const kind = s.style || 'oak';
        if (kind === 'pine') {
          C.roundRect(g, x - 10, fy - 60, 20, 60, 2, { fill: '#78350F', lw: 3.5 });
          if (window.CHAR) {
            window.CHAR.renderParts(g, [{ type: 'poly', pts: [[x - 55, fy - 50], [x, fy - 195], [x + 55, fy - 50]], fill: s.color || '#15803D' }], t);
          }
        } else if (kind === 'palm') {
          C.roundRect(g, x - 10, fy - 150, 20, 150, 6, { fill: '#92400E', lw: 3.5 });
          C.roundRect(g, x - 65, fy - 165, 60, 18, 9, { fill: '#16A34A', lw: 3 });
          C.roundRect(g, x + 5, fy - 165, 60, 18, 9, { fill: '#16A34A', lw: 3 });
        } else {
          C.roundRect(g, x - 12, fy - 110, 24, 110, 4, { fill: '#78350F', lw: 3.5 });
          C.circle(g, x, fy - 145, s.r || 58, { fill: s.color || '#22C55E', lw: 3.5 });
        }
      } else if (type === 'torch') {
        const ty = s.y || 350;
        C.roundRect(g, x - 8, ty, 16, 54, 4, { fill: '#78350F', lw: 3 });
        C.circle(g, x, ty - 16, 80, { fill: 'rgba(251, 146, 60, 0.18)', stroke: false });
        C.circle(g, x, ty - 14 + Math.sin(t * 14 + x) * 3, 18, { fill: '#F97316', lw: 2.5 });
        C.circle(g, x, ty - 12, 9, { fill: '#FACC15', stroke: false });
      }
    });
  }

  /**
   * 7. UNIVERSAL WINDOW BUILDER (`ENV.window`)
   * Supports `shape`: 'rect' | 'arched' | 'porthole' | 'barred'
   */
  function drawWindow(g, opts) {
    const o = opts || {};
    const x = o.x !== undefined ? o.x : 1360;
    const y = o.y !== undefined ? o.y : 340;
    const w = o.w || 340;
    const h = o.h || 300;
    const shape = o.shape || 'rect';
    const skyCol = o.skyColor || (o.view === 'night' || o.view === 'space' ? '#0F172A' : '#BAE6FD');

    g.save();
    if (shape === 'porthole') {
      const r = w / 2;
      C.circle(g, x, y, r + 16, { fill: '#64748B', lw: 4, shadow: true });
      C.circle(g, x, y, r, { fill: skyCol, lw: 4 });
      g.restore();
      return;
    }

    const left = x - w / 2, top = y - h / 2;
    const rad = shape === 'arched' ? w / 2 : 8;

    C.pathRoundRect(g, left, top, w, h, rad);
    g.fillStyle = skyCol;
    g.fill();
    g.clip();

    if (o.buildings) {
      const bCol = o.view === 'night' ? '#1E293B' : '#94A3B8';
      [[left + 20, top + 110, 65, h], [left + 95, top + 65, 85, h], [left + 195, top + 125, 70, h]].forEach((b) => {
        C.roundRect(g, b[0], b[1], b[2], b[3], 2, { fill: bCol, lw: 2.5 });
      });
    }

    if (shape === 'barred') {
      for (let bx = left + 40; bx < left + w - 20; bx += 45) {
        C.line(g, bx, top, bx, top + h, { lw: 6, color: '#475569' });
      }
    } else if (o.crossbars !== false) {
      C.line(g, x, top, x, top + h, { lw: 4, color: C.PAL.ink });
      C.line(g, left, y, left + w, y, { lw: 4, color: C.PAL.ink });
    }
    g.restore();

    C.roundRect(g, left, top, w, h, rad, { fill: false, lw: 4.5 });
    C.roundRect(g, left - 12, top + h - 6, w + 24, 16, 4, { fill: o.sillColor || '#F8FAFC', lw: 3.5 });
  }

  /**
   * 8. PROCEDURAL GROUND / FLOOR / STRATA BUILDER (`ENV.ground`)
   * Supports `style`: 'solid' | 'curved' | 'planks' | 'tiles' | 'cobblestone' | 'road' | 'water' | 'strata'
   */
  function ground(g, opts) {
    const o = opts || {};
    const fy = o.y !== undefined ? o.y : 820;
    const col = o.color || '#8C7A6B';
    const style = o.style || 'solid';

    g.save();
    if (style === 'road') {
      g.fillStyle = o.sidewalkColor || '#CBD5E1';
      g.fillRect(0, fy, C.W, 65);
      C.line(g, 0, fy, C.W, fy, { lw: 4 });
      g.fillStyle = col || '#475569';
      g.fillRect(0, fy + 65, C.W, C.H - fy - 65);
      C.line(g, 0, fy + 65, C.W, fy + 65, { lw: 4 });
      C.line(g, 0, fy + 165, C.W, fy + 165, { lw: 5, color: o.stripeColor || '#FACC15', dash: [48, 36] });
    } else if (style === 'strata') {
      // Underground geological / excavation layers
      const bands = o.bands || [
        { h: 70, color: '#65A30D' },
        { h: 160, color: '#A16207' },
        { h: 220, color: '#78350F' },
        { h: 400, color: '#44403C' }
      ];
      let curY = fy;
      bands.forEach((b) => {
        g.fillStyle = b.color;
        g.fillRect(0, curY, C.W, b.h);
        C.line(g, 0, curY, C.W, curY, { lw: 3.5 });
        curY += b.h;
      });
    } else if (style === 'curved') {
      g.fillStyle = col;
      g.beginPath();
      g.moveTo(-20, fy);
      g.quadraticCurveTo(960, fy + (o.curve || -22), C.W + 20, fy);
      g.lineTo(C.W + 20, C.H + 20);
      g.lineTo(-20, C.H + 20);
      g.closePath();
      g.fill();
      C.inkStyle(g, 3.8, C.PAL.ink);
      g.stroke();
    } else {
      g.fillStyle = col;
      g.fillRect(0, fy, C.W, C.H - fy);
      C.line(g, 0, fy, C.W, fy, { lw: 4 });

      if (style === 'planks' || style === 'tiles' || style === 'cobblestone') {
        for (let y = fy + 45; y < C.H; y += 50) {
          C.line(g, 0, y, C.W, y, { lw: 2, color: 'rgba(0,0,0,0.15)' });
        }
      }
    }
    g.restore();
  }

  /**
   * 9. UNIVERSAL AMBIENT PARTICLE GENERATOR (`ENV.particles`)
   * Supports `shape`: 'rain' | 'snow' | 'paper' | 'confetti' | 'bubbles' | 'embers' | 'dust' | 'cells'
   */
  function particles(g, t, opts) {
    const o = opts || {};
    const shape = o.shape || o.kind || 'dust';
    const count = o.count || 28;
    const r = C.rng(o.seed || 77);

    g.save();
    for (let i = 0; i < count; i++) {
      const vx = o.speedX !== undefined ? o.speedX : (shape === 'rain' ? -120 : 22);
      const vy = o.speedY !== undefined ? o.speedY : (shape === 'rain' ? 680 : (shape === 'bubbles' || shape === 'embers' ? -90 : 120));
      const px = ((r() * C.W + t * vx + Math.sin(t * 2 + i) * 28) % C.W + C.W) % C.W;
      const py = ((r() * C.H + t * vy) % C.H + C.H) % C.H;

      if (shape === 'rain') {
        C.line(g, px, py, px - 10, py + 28, { lw: 2, color: o.color || 'rgba(147, 197, 253, 0.55)' });
      } else if (shape === 'paper') {
        g.save();
        g.translate(px, py);
        g.rotate(Math.sin(t * 3 + i) * 0.6);
        C.roundRect(g, -12, -8, 24, 16, 2, { fill: o.color || '#FFFFFF', lw: 2 });
        g.restore();
      } else if (shape === 'confetti') {
        const cols = ['#EF4444', '#3B82F6', '#10B981', '#FACC15', '#EC4899'];
        g.save();
        g.translate(px, py);
        g.rotate(t * 4 + i);
        C.roundRect(g, -7, -4, 14, 8, 2, { fill: cols[i % cols.length], lw: 1.5 });
        g.restore();
      } else if (shape === 'bubbles') {
        C.circle(g, px, py, 6 + (i % 8), { fill: 'rgba(255,255,255,0.22)', stroke: 'rgba(255,255,255,0.6)', lw: 2 });
      } else {
        // 'snow', 'embers', 'dust', 'cells'
        const col = o.color || (shape === 'embers' ? '#F97316' : (shape === 'cells' ? '#EF4444' : '#FFFFFF'));
        C.circle(g, px, py, o.r || (shape === 'cells' ? 10 : 3.5), {
          fill: col,
          stroke: shape === 'cells' ? C.PAL.ink : false,
          lw: 2
        });
      }
    }
    g.restore();
  }

  window.ENV = {
    studio,
    create,
    sky,
    horizon,
    wall,
    structures,
    window: drawWindow,
    ground,
    particles,
    // Backward-compatible aliases routing to the universal creator
    room: create,
    exterior: create,
    weather: particles
  };
})();