/**
 * MODULE 02: CAMERA & COMIC SPLIT-SCREENS (engine/02_camera.js)
 * 2D/2.5D camera pan/zoom/focus, screen shake, radial & cone spotlights,
 * edge vignette, and 2-Panel / 3-Panel Comic Split-Screen layouts.
 */
(function () {
  const C = window.CORE;

  /**
   * Begins a camera transform on the 1920x1080 canvas.
   * Usage:
   *   CAM.begin(g, { zoom: 1.15, focusX: 960, focusY: 500, x: 0, y: 0, shake: 0, t: gt });
   *   ... draw scene ...
   *   CAM.end(g, { vignette: 0.32, spotlight: true });
   */
  function begin(g, cam) {
    const c = cam || {};
    const zoom = c.zoom !== undefined ? c.zoom : (c.z !== undefined ? c.z : 1.0);
    const fx = c.focusX !== undefined ? c.focusX : 960;
    const fy = c.focusY !== undefined ? c.focusY : 540;
    const panX = c.x || 0;
    const panY = c.y || 0;
    const rot = c.rot || 0;
    const shk = c.shake ? C.shake(c.t || 0, c.shake, 30, c.seed || 1) : { x: 0, y: 0 };

    g.save();
    g.translate(960 + shk.x, 540 + shk.y);
    if (rot) g.rotate(rot);
    g.scale(zoom, zoom);
    g.translate(-fx - panX, -fy - panY);
  }

  /**
   * Ends the camera transform and applies optional studio lighting,
   * cone spotlight, vignette, and paper grain in screen space.
   */
  function end(g, opts) {
    g.restore();
    const o = opts || {};

    if (o.spotlight) {
      spotlight(g, typeof o.spotlight === 'object' ? o.spotlight : {});
    }
    if (o.vignette !== false) {
      vignette(g, o.vignette !== undefined ? o.vignette : 0.30);
    }
    if (o.grain) {
      paperGrain(g, o.t || 0, o.grain === true ? 0.025 : o.grain);
    }
  }

  /**
   * Draws either a soft radial studio glow OR a dramatic overhead cone spotlight
   * (like the interrogation/handler scenes in Video 3 05:42).
   */
  function spotlight(g, opts) {
    const o = opts || {};
    const x = o.x !== undefined ? o.x : 960;
    const y = o.y !== undefined ? o.y : 520;

    g.save();
    if (o.cone) {
      // Dramatic overhead cone beam + darkened room around it
      const topX = o.topX !== undefined ? o.topX : x;
      const topY = o.topY !== undefined ? o.topY : -40;
      const topW = o.topW !== undefined ? o.topW : 90;
      const botW = o.botW !== undefined ? o.botW : 680;
      const botY = o.botY !== undefined ? o.botY : 960;

      // Warm light beam
      const beamGrd = g.createLinearGradient(topX, topY, x, botY);
      beamGrd.addColorStop(0, 'rgba(255, 248, 210, 0.32)');
      beamGrd.addColorStop(1, 'rgba(255, 248, 210, 0.03)');
      g.fillStyle = beamGrd;
      g.beginPath();
      g.moveTo(topX - topW / 2, topY);
      g.lineTo(topX + topW / 2, topY);
      g.lineTo(x + botW / 2, botY);
      g.lineTo(x - botW / 2, botY);
      g.closePath();
      g.fill();
    } else {
      // Soft radial center glow
      const r = o.r || 780;
      const grd = g.createRadialGradient(x, y, r * 0.05, x, y, r);
      grd.addColorStop(0, o.color || 'rgba(255, 253, 245, 0.16)');
      grd.addColorStop(1, 'rgba(255, 253, 245, 0)');
      g.fillStyle = grd;
      g.fillRect(0, 0, C.W, C.H);
    }
    g.restore();
  }

  /**
   * Soft dark radial vignette around the 1920x1080 frame edges.
   */
  function vignette(g, intensity) {
    const a = C.clamp(intensity !== undefined ? intensity : 0.30, 0, 0.9);
    if (a <= 0.01) return;
    g.save();
    const grd = g.createRadialGradient(960, 540, 420, 960, 540, 1140);
    grd.addColorStop(0, 'rgba(0,0,0,0)');
    grd.addColorStop(1, 'rgba(10,12,16,' + a + ')');
    g.fillStyle = grd;
    g.fillRect(0, 0, C.W, C.H);
    g.restore();
  }

  /**
   * Subtle animated editorial paper texture overlay.
   */
  function paperGrain(g, t, alpha) {
    const a = alpha || 0.025;
    const rand = C.rng(Math.floor((t || 0) * 12) + 101);
    g.save();
    g.fillStyle = 'rgba(20, 20, 20, ' + a + ')';
    for (let i = 0; i < 90; i++) {
      const gx = rand() * C.W;
      const gy = rand() * C.H;
      g.fillRect(gx, gy, 2, 2);
    }
    g.restore();
  }

  /**
   * COMIC SPLIT-SCREEN ENGINE (2-Panel, 3-Panel, 2-Row, 4-Grid, or Picture-in-Picture)
   * Matches Video 1 (00:45, 03:14, 04:30, 05:06, 08:08).
   *
   * Inside each panel's `draw(g, pw, ph)` callback:
   * - By default, `(960, 540)` is automatically mapped to the center of that panel!
   *   So you can draw characters at `x: 960, y: 780` inside every panel without recalculating coordinates!
   * - Also passes `(pw, ph)` if you want panel dimensions.
   *
   * Usage:
   *   CAM.split(g, lt, {
   *     layout: '3col', // '2col' | '3col' | '2row' | 'grid4'
   *     panels: [
   *       { t0: 0.0, bg: '#D8D2C5', title: '1. CODE', draw: (g) => { ... } },
   *       { t0: 0.6, bg: '#CBD5E1', title: '2. CLOUD', draw: (g) => { ... } },
   *       { t0: 1.2, bg: '#E5E7EB', title: '3. USERS', draw: (g) => { ... } }
   *     ]
   *   });
   */
  function split(g, lt, opts) {
    const o = opts || {};
    const layout = o.layout || (o.panels && o.panels.length === 3 ? '3col' : '2col');
    const panels = o.panels || [];
    const borderLw = o.borderLw !== undefined ? o.borderLw : 6;
    const borderCol = o.borderColor || C.PAL.ink;

    // Compute panel rectangles
    let rects = [];
    if (layout === '2col') {
      rects = [
        { x: 0, y: 0, w: 960, h: 1080 },
        { x: 960, y: 0, w: 960, h: 1080 }
      ];
    } else if (layout === '3col') {
      rects = [
        { x: 0, y: 0, w: 640, h: 1080 },
        { x: 640, y: 0, w: 640, h: 1080 },
        { x: 1280, y: 0, w: 640, h: 1080 }
      ];
    } else if (layout === '2row') {
      rects = [
        { x: 0, y: 0, w: 1920, h: 540 },
        { x: 0, y: 540, w: 1920, h: 540 }
      ];
    } else if (layout === 'grid4') {
      rects = [
        { x: 0, y: 0, w: 960, h: 540 },
        { x: 960, y: 0, w: 960, h: 540 },
        { x: 0, y: 540, w: 960, h: 540 },
        { x: 960, y: 540, w: 960, h: 540 }
      ];
    }

    // Background behind hidden panels
    g.fillStyle = o.backdrop || '#0B0D12';
    g.fillRect(0, 0, C.W, C.H);

    rects.forEach((r, idx) => {
      const p = panels[idx];
      if (!p) return;

      const t0 = p.t0 || 0;
      if (lt < t0) return;

      const enterP = C.seg(lt, t0, t0 + (p.enterDur || 0.28), C.ease.outCubic);
      const slideY = p.slide === false ? 0 : (1 - enterP) * 60;

      g.save();
      g.beginPath();
      g.rect(r.x, r.y, r.w, r.h);
      g.clip();

      g.translate(0, slideY);
      g.globalAlpha = enterP;

      // Panel background
      if (p.bg !== false) {
        g.fillStyle = p.bg || C.PAL.studioWall;
        g.fillRect(r.x, r.y, r.w, r.h);

        // Default subtle studio floor curve inside each panel unless disabled
        if (p.floor !== false) {
          const fy = r.y + r.h * 0.76;
          g.fillStyle = p.floorColor || C.PAL.studioFloor;
          g.beginPath();
          g.moveTo(r.x, fy);
          g.quadraticCurveTo(r.x + r.w / 2, fy - 18, r.x + r.w, fy);
          g.lineTo(r.x + r.w, r.y + r.h);
          g.lineTo(r.x, r.y + r.h);
          g.closePath();
          g.fill();

          C.line(g, r.x, fy, r.x + r.w, fy, { lw: 3.5, color: C.PAL.ink });
        }
      }

      // Draw panel content with (960, 540) mapped to panel center
      if (typeof p.draw === 'function') {
        g.save();
        const cx = r.x + r.w / 2;
        const cy = r.y + r.h / 2;
        const s = p.scale !== undefined ? p.scale : 1.0;
        g.translate(cx, cy);
        g.scale(s, s);
        g.translate(-960, -540);
        p.draw(g, r.w, r.h);
        g.restore();
      }

      // Optional top label pill inside panel
      if (p.title) {
        g.save();
        g.font = '800 28px "Nunito", sans-serif';
        const tw = g.measureText(p.title).width + 44;
        const bx = r.x + (r.w - tw) / 2;
        const by = r.y + 36;
        C.roundRect(g, bx, by, tw, 50, 12, {
          fill: p.titleBg || '#FFFFFF',
          stroke: C.PAL.ink,
          lw: 3.5,
          shadow: true
        });
        g.fillStyle = p.titleColor || C.PAL.ink;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(p.title, r.x + r.w / 2, by + 26);
        g.restore();
      }

      g.restore();

      // Crisp black divider border around panel
      g.save();
      g.strokeStyle = borderCol;
      g.lineWidth = borderLw;
      g.strokeRect(r.x, r.y, r.w, r.h);
      g.restore();
    });

    // Subtle overall vignette
    vignette(g, 0.24);
  }

  /**
   * Simple Shot End Transitions ('fadeBlack', 'wipeLeft', 'iris')
   */
  function transition(g, lt, duration, type) {
    if (!type || type === 'cut') return;
    const dur = 0.25;
    if (lt < duration - dur) return;
    const p = C.seg(lt, duration - dur, duration, C.ease.inOutQuad);

    g.save();
    if (type === 'fadeBlack') {
      g.fillStyle = 'rgba(0,0,0,' + p + ')';
      g.fillRect(0, 0, C.W, C.H);
    } else if (type === 'wipeLeft') {
      g.fillStyle = '#07080A';
      g.fillRect(C.W * (1 - p), 0, C.W * p, C.H);
    } else if (type === 'iris') {
      const maxR = 1150;
      const r = Math.max(1, maxR * (1 - p));
      g.fillStyle = '#07080A';
      g.beginPath();
      g.rect(0, 0, C.W, C.H);
      g.arc(960, 540, r, 0, Math.PI * 2, true);
      g.fill();
    }
    g.restore();
  }

  window.CAM = {
    begin,
    end,
    spotlight,
    vignette,
    paperGrain,
    split,
    transition
  };
})();