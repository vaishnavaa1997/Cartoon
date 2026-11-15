/**
 * CARTOON ENGINE — Root Synchronous Module Loader
 * Loaded via <script src="../../engine.js"></script>
 * Each module lives in its own standalone file inside /engine/ for easy editing.
 */
(function () {
  // 1. Inject Google Fonts used by the Editorial Cartoon style
  //    - Caveat & Kalam: Handwritten italic text on black screens, charts & arrows
  //    - Fredoka & Nunito: Clean bold UI labels, stamps & speech bubbles
  //    - Space Mono: Tickers, timestamps, code & counters
  //    - Merriweather: Newspaper clippings, legal documents & quotes
  if (typeof document !== 'undefined' && document.head && !document.getElementById('cartoon-engine-fonts')) {
    const link = document.createElement('link');
    link.id = 'cartoon-engine-fonts';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Fredoka:wght@600;700&family=Kalam:wght@400;700&family=Merriweather:ital,wght@0,700;1,400&family=Nunito:wght@600;700;800;900&family=Space+Mono:wght@400;700&display=swap';
    document.head.appendChild(link);
  }

  // 2. Resolve base path relative to engine.js
  const scripts = typeof document !== 'undefined' ? document.getElementsByTagName('script') : [];
  let basePath = '../../engine/';
  for (let i = scripts.length - 1; i >= 0; i--) {
    const src = scripts[i].getAttribute('src') || '';
    if (src.indexOf('engine.js') !== -1) {
      basePath = src.replace(/engine\.js(\?.*)?$/, '') + 'engine/';
      break;
    }
  }

  // 3. Single-purpose modules (1 file = 1 responsibility)
  const MODULES = [
    '01_core.js',      // Math, Easing, RNG, Palettes, Ink Outlines & Hatching
    '02_camera.js',    // 2D Camera, Spotlights, Vignette & 2/3-Panel Comic Splits
    '03_text.js',      // Black Kinetic Screens, Bubbles, Subtitles, Stamps & Quotes
    '04_char.js',      // General Capsule+Stick Characters, Animals & Living Mascots
    '05_env.js',       // Studio Curve, Parametric Rooms, Exteriors & Sky/Space
    '06_props.js',     // General Props (Desks, Calendars, Scales, Conveyors, Docs)
    '07_charts.js',    // Hand-Drawn Hatched Bar/Line/Pie Charts & Endless Receipts
    '08_diagrams.js',  // Science, Space & Technical Machine/Software Cutaways
    '09_maps.js',      // Clean 2D Vector Maps, Routes, Pins & Globes
    '10_sound.js'      // Tactile Cartoon Foley SFX, Ambient Beds & BGM Composer
  ];

  MODULES.forEach(function (file) {
    if (typeof document !== 'undefined') {
      document.write('<script src="' + basePath + file + '"><\/script>');
    }
  });
})();