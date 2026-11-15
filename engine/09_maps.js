/**
 * MODULE 09: UNIVERSAL 2D EDITORIAL VECTOR MAP & GLOBE CREATOR (engine/09_maps.js)
 * Zero external tile servers, zero lag. Renders clean editorial maps, custom regions/empires,
 * animated travel routes (ships/planes/trucks/arrows), pulsing pins, and 2.5D globes.
 */
(function () {
  const C = window.CORE;

  // Clean Simplified Editorial Continent Polygons (Normalized [lon: -180..180, lat: -90..90])
  const CONTINENTS = {
    northAmerica: [[-165,65],[-130,70],[-75,68],[-55,48],[-80,25],[-90,18],[-80,8],[-105,20],[-125,48]],
    southAmerica: [[-80,10],[-60,10],[-35,-6],[-48,-28],[-68,-54],[-75,-45],[-72,-18],[-81,-4]],
    europe: [[-10,36],[0,44],[-5,58],[15,70],[45,68],[55,50],[30,42],[24,36],[12,38]],
    africa: [[-17,15],[-5,35],[12,37],[33,31],[50,12],[40,-12],[20,-34],[12,-18],[8,4],[-8,5]],
    asia: [[30,40],[55,50],[70,72],[140,70],[145,45],[122,22],[104,2],[96,16],[88,22],[78,8],[68,24],[55,24],[45,12],[35,30]],
    india: [[68,24],[77,34],[88,27],[88,22],[78,8],[72,18]],
    australia: [[114,-22],[132,-12],[153,-26],[146,-40],[130,-33],[115,-34]]
  };

  function projectLonLat(lon, lat, box) {
    const minLon = box.minLon !== undefined ? box.minLon : -180;
    const maxLon = box.maxLon !== undefined ? box.maxLon : 180;
    const minLat = box.minLat !== undefined ? box.minLat : -65;
    const maxLat = box.maxLat !== undefined ? box.maxLat : 78;
    const u = (lon - minLon) / ((maxLon - minLon) || 1);
    const v = 1 - (lat - minLat) / ((maxLat - minLat) || 1);
    return [box.x + u * box.w, box.y + v * box.h];
  }

  /**
   * 1. EDITORIAL 2D VECTOR MAP CREATOR (`MAP.draw(g, lt, opts)`)
   * Supports world/regional [lon,lat] bounding boxes OR custom screen-space polygons,
   * highlighted territories with diagonal hatching, animated routes, and location pins.
   *
   * Usage:
   *   MAP.draw(g, lt, {
   *     title: 'THE SMUGGLING ROUTE',
   *     bbox: [60, -12, 145, 45], // [minLon, minLat, maxLon, maxLat] (Optional — defaults to World)
   *     highlight: ['india'],     // Or custom `regions: [{ pts: [[x,y],...], color, label, hatch }]`
   *     routes: [
   *       { from: [103.8, 1.3], to: [114.1, 22.3], label: 'CHIP SHIPMENT', color: '#EF4444', t0: 0.2, dur: 1.2 }
   *     ],
   *     pins: [
   *       { lonLat: [103.8, 1.3], label: 'SINGAPORE', color: '#FACC15', pulse: true, t0: 0.1 },
   *       { lonLat: [114.1, 22.3], label: 'SHENZHEN', color: '#EF4444', t0: 0.8 }
   *     ]
   *   });
   */
  function draw(g, lt, opts) {
    const o = opts || {};
    const mx = o.x !== undefined ? o.x : 120;
    const my = o.y !== undefined ? o.y : 100;
    const mw = o.w !== undefined ? o.w : 1680;
    const mh = o.h !== undefined ? o.h : 860;
    const bb = o.bbox || [-170, -60, 175, 78];
    const box = { x: mx, y: my, w: mw, h: mh, minLon: bb[0], minLat: bb[1], maxLon: bb[2], maxLat: bb[3] };

    g.save();

    // Ocean frame
    C.roundRect(g, mx, my, mw, mh, 16, {
      fill: o.oceanColor || '#BAE6FD',
      lw: 4.5,
      shadow: true
    });

    g.save();
    C.pathRoundRect(g, mx, my, mw, mh, 16);
    g.clip();

    // Subtle latitude/longitude grid lines
    const gridCol = 'rgba(15, 23, 42, 0.08)';
    for (let gx = mx + 140; gx < mx + mw; gx += 180) C.line(g, gx, my, gx, my + mh, { lw: 1.5, color: gridCol, dash: [8, 8] });
    for (let gy = my + 120; gy < my + mh; gy += 160) C.line(g, mx, gy, mx + mw, gy, { lw: 1.5, color: gridCol, dash: [8, 8] });

    // Base Continents
    if (o.continents !== false) {
      const hiList = (o.highlight || []).map((s) => String(s).toLowerCase());
      Object.keys(CONTINENTS).forEach((name) => {
        const poly = CONTINENTS[name];
        const isHi = hiList.indexOf(name.toLowerCase()) !== -1;
        const screenPts = poly.map((pt) => projectLonLat(pt[0], pt[1], box));

        g.beginPath();
        screenPts.forEach((p, idx) => {
          if (idx === 0) g.moveTo(p[0], p[1]);
          else g.lineTo(p[0], p[1]);
        });
        g.closePath();
        g.fillStyle = isHi ? (o.highlightColor || '#FCA5A5') : (o.landColor || '#E7E0D0');
        g.fill();
        C.inkStyle(g, 3.5, C.PAL.ink);
        g.stroke();
      });
    }

    // Custom Polygons / Regions / Empires (`regions: [{ pts: [[x,y] or [lon,lat]], useLonLat, color, label }]`)
    (o.regions || o.territories || []).forEach((reg) => {
      if (!Array.isArray(reg.pts) || reg.pts.length < 3) return;
      const pts = reg.pts.map((pt) => (reg.useLonLat ? projectLonLat(pt[0], pt[1], box) : pt));
      g.beginPath();
      pts.forEach((p, idx) => (idx === 0 ? g.moveTo(p[0], p[1]) : g.lineTo(p[0], p[1])));
      g.closePath();
      g.fillStyle = reg.color || 'rgba(239, 68, 68, 0.35)';
      g.fill();
      C.inkStyle(g, 3.8, reg.border || C.PAL.ink);
      g.stroke();

      if (reg.label) {
        const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length;
        const cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
        g.font = '900 24px "Nunito", sans-serif';
        g.fillStyle = C.PAL.ink;
        g.textAlign = 'center';
        g.fillText(reg.label, cx, cy);
      }
    });

    // Animated Travel Routes (`from` / `to` can be `[lon, lat]` or screen `[x, y]`)
    (o.routes || []).forEach((rt) => {
      const p0 = (rt.screen || Math.abs(rt.from[0]) > 180) ? rt.from : projectLonLat(rt.from[0], rt.from[1], box);
      const p1 = (rt.screen || Math.abs(rt.to[0]) > 180) ? rt.to : projectLonLat(rt.to[0], rt.to[1], box);
      const rp = C.seg(lt, rt.t0 || 0.2, (rt.t0 || 0.2) + (rt.dur || 1.0), C.ease.inOutCubic);

      C.arrow(g, p0[0], p0[1], p1[0], p1[1], {
        p: rp,
        lw: rt.lw || 5,
        color: rt.color || C.PAL.red,
        dash: rt.dash !== false ? [12, 8] : undefined,
        curve: rt.curve !== false,
        curveY: rt.curveY !== undefined ? rt.curveY : -65
      });

      if (rt.label && rp > 0.45) {
        const lx = (p0[0] + p1[0]) / 2;
        const ly = (p0[1] + p1[1]) / 2 - 48;
        g.font = '700 32px "Caveat", cursive';
        g.fillStyle = rt.color || C.PAL.red;
        g.textAlign = 'center';
        g.fillText(rt.label, lx, ly);
      }
    });

    // Location Pins & Pulsing Radar Rings
    (o.pins || []).forEach((pin, idx) => {
      const t0 = pin.t0 !== undefined ? pin.t0 : idx * 0.18;
      if (lt < t0) return;
      const sc = C.pop(lt, t0, 0.3);
      const raw = pin.lonLat || pin.pos || [0, 0];
      const pt = (pin.screen || Math.abs(raw[0]) > 180) ? raw : projectLonLat(raw[0], raw[1], box);
      const px = pt[0], py = pt[1];
      const col = pin.color || C.PAL.red;

      if (pin.pulse) {
        const pulseP = ((lt * 1.1) % 1);
        C.circle(g, px, py, 14 + pulseP * 48, {
          fill: false,
          stroke: C.rgba(col, 1 - pulseP),
          lw: 3
        });
      }

      g.save();
      g.translate(px, py);
      g.scale(sc, sc);
      C.circle(g, 0, 0, 11, { fill: col, lw: 3.5 });
      C.circle(g, 0, 0, 4, { fill: '#FFFFFF', stroke: false });

      if (pin.label) {
        g.font = '900 22px "Nunito", sans-serif';
        const tw = g.measureText(pin.label).width + 28;
        C.roundRect(g, -tw / 2, -52, tw, 34, 8, { fill: '#FFFFFF', lw: 3, shadow: true });
        g.fillStyle = C.PAL.ink;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(pin.label, 0, -34);
      }
      g.restore();
    });

    g.restore();

    // Optional Map Title Header Pill
    if (o.title && window.TEXT) {
      window.TEXT.badge(g, lt, {
        x: mx + mw / 2,
        y: my + 48,
        text: o.title,
        size: 30,
        fill: '#FFFFFF'
      });
    }

    g.restore();
  }

  /**
   * 2. ORTHOGRAPHIC 2.5D EDITORIAL GLOBE (`MAP.globe(g, lt, opts)`)
   */
  function globe(g, lt, opts) {
    const o = opts || {};
    const cx = o.x !== undefined ? o.x : 960;
    const cy = o.y !== undefined ? o.y : 540;
    const r = o.r || 340;
    const rotLon = (o.lon || 0) + (o.spin ? lt * o.spin : 0);

    g.save();
    C.circle(g, cx, cy, r, { fill: o.oceanColor || '#38BDF8', lw: 5, shadow: true });

    g.save();
    g.beginPath();
    g.arc(cx, cy, r, 0, Math.PI * 2);
    g.clip();

    // Graticule rings
    g.strokeStyle = 'rgba(255,255,255,0.25)';
    g.lineWidth = 2;
    [-0.5, 0, 0.5].forEach((latK) => {
      C.line(g, cx - r, cy + latK * r, cx + r, cy + latK * r, { lw: 2, color: 'rgba(255,255,255,0.25)' });
      g.beginPath();
      g.ellipse(cx, cy, r * Math.abs(latK || 0.25), r, 0, 0, Math.PI * 2);
      g.stroke();
    });

    // Simplified rotating continent blobs on globe
    Object.keys(CONTINENTS).forEach((name) => {
      const poly = CONTINENTS[name];
      g.beginPath();
      let visible = false;
      poly.forEach((pt, idx) => {
        const dLon = ((pt[0] - rotLon + 540) % 360) - 180;
        if (Math.abs(dLon) < 95) visible = true;
        const gx = cx + Math.sin((dLon * Math.PI) / 180) * r * Math.cos((pt[1] * Math.PI) / 180);
        const gy = cy - Math.sin((pt[1] * Math.PI) / 180) * r;
        if (idx === 0) g.moveTo(gx, gy);
        else g.lineTo(gx, gy);
      });
      if (visible) {
        g.closePath();
        g.fillStyle = o.landColor || '#4ADE80';
        g.fill();
        C.inkStyle(g, 3, C.PAL.ink);
        g.stroke();
      }
    });

    g.restore();
    C.circle(g, cx, cy, r, { fill: false, lw: 5 });
    g.restore();
  }

  // Instant 0ms preloader stub for Studio Player / Renderer compatibility
  function preloadAll() {
    return Promise.resolve();
  }

  window.MAP = {
    draw,
    world: draw,
    region: draw,
    globe,
    preloadAll
  };
})();