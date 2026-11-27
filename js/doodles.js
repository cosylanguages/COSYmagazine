/**
 * COSYmagazine: hand-drawn doodle library for the "editor's notebook" layer.
 * Each doodle is a small stroke-only SVG (viewBox 120x80, currentColor) that a CSS filter
 * (#cosy-wobble) roughens so it looks drawn, not stamped. Doodles are decoration only: aria-hidden.
 *
 *   COSYDoodles.filler(theme, seed, lang)  -> HTML for the empty bottom of a page
 *   COSYDoodles.svg(name)                  -> one doodle
 *   COSYDoodles.themeOf(bodyDataset)       -> theme key used by css/notebook.css
 */
(function () {
  'use strict';

  const P = {
    pencil: '<path d="M16 66 L22 48 L82 14 L92 30 L32 62 Z"/><path d="M22 48 L32 62"/><path d="M74 18 L86 34"/><path d="M16 66 L20 56"/><path d="M26 74 q10 -6 20 0 t20 0 t20 0"/>',
    ruler: '<path d="M12 52 L88 14 L100 36 L24 74 Z"/><path d="M26 46 l6 10 M38 40 l6 10 M50 34 l6 10 M62 28 l6 10 M74 22 l6 10"/>',
    star: '<path d="M60 8 L70 34 L98 36 L76 54 L84 78 L60 64 L36 78 L44 54 L22 36 L50 34 Z"/><path d="M104 12 l0 10 M99 17 l10 0 M14 60 l0 8 M10 64 l8 0"/>',
    bookstack: '<path d="M18 58 h84 v12 h-84 z"/><path d="M24 44 h72 v14 h-72 z"/><path d="M16 30 h78 v14 h-78 z"/><path d="M30 64 h22 M34 51 h24 M26 37 h20"/>',
    apple: '<path d="M60 24 C30 10 14 46 34 66 C44 76 54 66 60 68 C66 66 76 76 86 66 C106 46 90 10 60 24 Z"/><path d="M60 24 C60 14 66 10 72 8"/><path d="M70 12 q12 -6 18 2 q-10 6 -18 -2"/>',
    mountain: '<path d="M8 68 L40 28 L58 50 L72 36 L112 36"/><path d="M40 28 l-4 -14 l12 4 z"/><path d="M82 30 q8 -10 18 0"/><path d="M14 74 h98"/>',
    ladder: '<path d="M40 8 L36 72 M80 8 L84 72"/><path d="M38 24 H81 M37 40 H82 M36 56 H83"/><path d="M96 14 l8 -8 m-8 0 l8 8"/>',
    arrowup: '<path d="M60 72 V18"/><path d="M38 38 L60 14 L82 38"/><path d="M24 74 q36 -6 72 0"/>',
    steps: '<path d="M10 70 H34 V52 H58 V34 H82 V16 H110"/><path d="M88 8 l10 8 l-10 8"/>',
    cake: '<path d="M24 64 H96 V44 H24 Z"/><path d="M24 44 q9 -10 18 0 t18 0 t18 0 t18 0"/><path d="M60 44 V28"/><path d="M60 12 q8 8 0 14 q-8 -6 0 -14"/><path d="M14 70 H106"/>',
    balloon: '<path d="M60 10 c24 0 28 32 0 42 c-28 -10 -24 -42 0 -42"/><path d="M60 52 q-8 10 0 22 q6 -6 -2 -12"/><path d="M48 24 q2 -6 8 -8"/>',
    heart: '<path d="M60 68 C12 38 34 6 60 30 C86 6 108 38 60 68"/><path d="M90 14 l6 -6 M98 22 l8 -2"/>',
    confetti: '<path d="M14 20 l8 6 M40 10 l2 10 M74 14 l9 -5 M100 26 l-8 7 M28 56 l9 4 M66 60 l3 10 M96 56 l8 -6"/><circle cx="52" cy="38" r="3"/><circle cx="84" cy="44" r="3"/><circle cx="20" cy="40" r="3"/><circle cx="106" cy="64" r="3"/>',
    ticket: '<path d="M14 20 H106 V34 a7 7 0 0 0 0 14 V62 H14 V48 a7 7 0 0 0 0 -14 Z"/><path d="M80 20 V62" stroke-dasharray="4 5"/><path d="M26 34 h38 M26 46 h28"/>',
    check: '<path d="M18 42 L46 68 L102 12"/><path d="M16 74 q40 -6 88 0"/>',
    cross: '<path d="M26 14 L94 66 M94 14 L26 66"/>',
    redpen: '<path d="M14 68 L20 50 L84 14 L94 30 L30 64 Z"/><path d="M20 50 L30 64"/><path d="M78 18 l12 16"/><path d="M30 76 q12 -8 24 0 t24 0"/>',
    bubble: '<path d="M14 12 H106 V54 H58 L38 70 V54 H14 Z"/><path d="M26 26 h54 M26 38 h36"/>',
    wave: '<path d="M8 42 q13 -18 26 0 t26 0 t26 0 t26 0"/><path d="M14 58 q10 -10 20 0 t20 0"/>',
    leaf: '<path d="M18 66 C18 26 58 10 104 14 C102 54 68 74 18 66 Z"/><path d="M18 66 L82 30"/><path d="M44 52 l-2 -14 M62 44 l0 -14"/>',
    quill: '<path d="M18 72 L96 12 C110 36 82 62 44 64 Z"/><path d="M18 72 L62 40"/><path d="M60 30 q6 6 4 14"/>',
    coffee: '<path d="M26 32 H84 V52 a22 22 0 0 1 -22 22 H48 a22 22 0 0 1 -22 -22 Z"/><path d="M84 38 h8 a8 8 0 0 1 0 16 h-8"/><path d="M44 24 q-6 -8 0 -14 M62 24 q-6 -8 0 -14"/>',
    lightbulb: '<path d="M60 8 a26 26 0 0 1 14 48 v10 H46 V56 A26 26 0 0 1 60 8 Z"/><path d="M48 72 H72 M52 78 H68"/><path d="M96 20 l8 -6 M24 20 l-8 -6 M104 44 h8 M8 44 h8"/>',
    snowflake: '<path d="M60 8 V72 M32 24 L88 56 M32 56 L88 24"/><path d="M52 14 l8 6 l8 -6 M52 66 l8 -6 l8 6"/>',
    sprout: '<path d="M60 74 V36"/><path d="M60 50 C40 50 32 36 36 24 C52 24 62 34 60 50"/><path d="M60 42 C78 42 86 28 82 16 C68 16 58 28 60 42"/><path d="M40 74 h40"/>',
    flower: '<circle cx="60" cy="34" r="8"/><path d="M60 26 c-10 -14 -22 -4 -12 6 M68 34 c14 -10 22 4 8 12 M60 42 c10 14 24 4 12 -6 M52 34 c-14 10 -22 -4 -8 -12"/><path d="M60 42 V74 M60 60 q-14 -2 -16 -14"/>',
    sun: '<circle cx="60" cy="40" r="16"/><path d="M60 8 v10 M60 62 v10 M28 40 h10 M82 40 h10 M38 18 l7 7 M75 55 l7 7 M82 18 l-7 7 M45 55 l-7 7"/>',
    scribble: '<path d="M10 52 C30 20 40 70 56 38 S84 62 110 24"/>'
  };

  const THEMES = {
    aug: ['pencil', 'star', 'ruler', 'apple', 'bookstack', 'check'],
    sep: ['mountain', 'ladder', 'arrowup', 'steps', 'star', 'lightbulb'],
    oct: ['cake', 'balloon', 'confetti', 'heart', 'ticket', 'star'],
    sat: ['redpen', 'check', 'cross', 'bubble', 'wave', 'star'],
    nov: ['leaf', 'quill', 'bookstack', 'coffee', 'lightbulb', 'scribble'],
    dec: ['snowflake', 'star', 'coffee', 'bookstack', 'heart'],
    feb: ['sprout', 'flower', 'sun', 'leaf', 'heart'],
    other: ['star', 'scribble', 'heart', 'leaf']
  };

  // Short margin notes, only for languages we can write natively (others get doodles only).
  const NOTES = {
    en: ['say it out loud!', 'try it today ✓', 'key idea ★', "don't skip this one", 'read it twice', 'practice makes cosy'],
    fr: ['à dire à voix haute !', "à essayer aujourd'hui ✓", 'idée clé ★', 'ne saute pas ça !', 'relis-moi'],
    it: ['dillo ad alta voce!', 'provalo oggi ✓', 'idea chiave ★', 'non saltare questa!', 'rileggi!'],
    ru: ['скажи вслух!', 'попробуй сегодня ✓', 'главная мысль ★', 'не пропускай!', 'перечитай!'],
    el: ['πες το φωναχτά!', 'δοκίμασέ το σήμερα ✓', 'βασική ιδέα ★', 'μην το προσπεράσεις!', 'διάβασέ το ξανά!']
  };

  function rng(seed) {
    let a = 0;
    const str = String(seed);
    for (let i = 0; i < str.length; i++) a = (a * 31 + str.charCodeAt(i)) >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function svg(name, extraClass) {
    const body = P[name] || P.star;
    return '<svg class="doodle ' + (extraClass || '') + '" viewBox="0 0 120 80" fill="none" stroke="currentColor" ' +
      'stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + body + '</svg>';
  }

  function ensureFilter() {
    if (document.getElementById('cosy-doodle-defs')) return;
    const host = document.createElement('div');
    host.id = 'cosy-doodle-defs';
    host.setAttribute('aria-hidden', 'true');
    host.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    host.innerHTML = '<svg width="0" height="0"><filter id="cosy-wobble" x="-5%" y="-5%" width="110%" height="110%">' +
      '<feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4" result="n"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" xChannelSelector="R" yChannelSelector="G"/></filter></svg>';
    document.body.appendChild(host);
  }

  function themeOf(ds) {
    return (ds && ds.issue) || 'other';
  }

  // One or two doodles plus (for supported languages) a handwritten note, seeded so each page keeps its own drawing.
  function filler(theme, seed, lang) {
    const r = rng(theme + ':' + seed);
    const set = THEMES[theme] || THEMES.other;
    const a = set[Math.floor(r() * set.length)];
    let b = set[Math.floor(r() * set.length)];
    if (b === a) b = set[(set.indexOf(a) + 1) % set.length];
    const notes = NOTES[(lang || 'en').toLowerCase().split('-')[0]];
    const note = notes ? notes[Math.floor(r() * notes.length)] : '';
    const tilt = (r() * 6 - 3).toFixed(1);
    return '<div class="page-filler" aria-hidden="true">' +
      '<span class="filler-doodle filler-a" style="--tilt:' + tilt + 'deg">' + svg(a) + '</span>' +
      (note ? '<span class="filler-note" style="--tilt:' + (-tilt) + 'deg">' + note + '</span>' : '') +
      '<span class="filler-doodle filler-b" style="--tilt:' + (tilt * -1.4).toFixed(1) + 'deg">' + svg(b) + '</span>' +
      '</div>';
  }

  window.COSYDoodles = { svg: svg, filler: filler, themeOf: themeOf, ensureFilter: ensureFilter, THEMES: THEMES };
})();
