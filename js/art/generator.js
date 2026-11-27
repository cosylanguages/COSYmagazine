/**
 * js/art/generator.js
 * Primary entry point for rendering cover art, section dividers, pull-quote cards,
 * and word cards for COSY magazine posts.
 */

import { createPRNG } from './rng.js';
import { MOTIFS, DEFAULT_PALETTES } from './motifs.js';

function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const MOTIF_KEYS = Object.keys(MOTIFS);

// 14 COSY Target Languages with AA-compliant warm accent colors for light paper bases
const LANG_ACCENTS = {
  en: '#225B58', // Tea Sage / Teal
  fr: '#274B7D', // Vintage French Navy
  it: '#3A6332', // Olive Laurel
  ru: '#A03224', // Brick Red
  el: '#236583', // Aegean Blue
  es: '#B05322', // Terracotta Orange
  de: '#A86C1B', // Warm Ochre Gold
  pt: '#246342', // Portuguese Fern
  hy: '#633353', // Armenian Plum
  ka: '#832222', // Georgian Crimson
  tt: '#1A6360', // Tatar Turquoise
  ba: '#205634', // Bashkir Pine
  br: '#254E63', // Breton Slate
  cv: '#9E5B15'  // Chuvash Gold
};

/** Extracts base slug for language translation family matching */
export function getBaseSlug(post) {
  if (!post) return 'cosy-post';
  if (post.translationOf) return post.translationOf;
  const slug = post.slug || 'cosy-post';
  return slug.replace(/-(fr|it|ru|el|es|de|pt|hy|ka|tt|ba|br|cv)$/, '');
}

/** Detects post language code */
export function getPostLanguage(post) {
  if (!post) return 'en';
  if (post.language) return post.language.toLowerCase();
  const slug = post.slug || '';
  const match = slug.match(/-(fr|it|ru|el|es|de|pt|hy|ka|tt|ba|br|cv)$/);
  return match ? match[1] : 'en';
}

/** The notebook look of the issue a post belongs to (mirrors css/notebook.css): [ink, highlight, spare, paper] */
const ISSUE_COVER_PALETTES = {
  aug: ['#1e46a0', '#ffe250', '#2d9cdb', '#fffef8'],
  sep: ['#0f6e66', '#a0ebd2', '#2fbfa8', '#fbfffd'],
  oct: ['#b0245f', '#ffbed7', '#e0678f', '#f6ead4'],
  sat: ['#c62828', '#ffe296', '#f0795f', '#fffdf8'],
  nov: ['#6b4423', '#f5c878', '#c98a4b', '#fbf3e2'],
  dec: ['#2a5d9f', '#bedcff', '#6fa6e0', '#f3f8ff'],
  feb: ['#2c7a45', '#bee9aa', '#6bbd7f', '#f4faef']
};
export function issueKeyOf(post) {
  const n = String((post && post.issue && post.issue.number) || '');
  if (post && post.desk === 'Saturday Mistakes') return 'sat';
  if (/2026\.08|August/.test(n)) return 'aug';
  if (/2026\.09|September/.test(n)) return 'sep';
  if (/2026\.10|October/.test(n)) return 'oct';
  if (/2026\.11|November/.test(n)) return 'nov';
  if (/2026\.12|December/.test(n)) return 'dec';
  if (/February|2027\.02/.test(n)) return 'feb';
  return null;
}

/** Resolves artDirection configuration with sensible defaults */
export function resolveArtDirection(post) {
  const art = (post && post.artDirection) || {};
  const desk = post ? (post.desk || 'Front Page') : 'Front Page';
  const slug = post ? (post.slug || 'cosy-post') : 'cosy-post';
  const baseSlug = getBaseSlug(post);
  const lang = getPostLanguage(post);

  // Derive palette
  const defaultPalette = [...(DEFAULT_PALETTES[desk] || DEFAULT_PALETTES['Front Page'])];
  let palette = (art.palette && art.palette.length >= 2) ? [...art.palette] : defaultPalette;

  // Light, cheerful covers: use the palette of the issue the article belongs to
  const issueKey = issueKeyOf(post);
  if (issueKey && !(art.palette && art.keepPalette)) {
    palette = [...ISSUE_COVER_PALETTES[issueKey]];
  }

  // Apply language accent override (kept as a mid-tone so covers do not get muddy)
  if (LANG_ACCENTS[lang] && !issueKey) {
    const accent = LANG_ACCENTS[lang];
    if (palette.length >= 3) {
      palette[2] = accent;
    } else {
      palette.push(accent);
    }
  }

  // Deterministic motif selection from baseSlug if art.motif is not explicitly set
  let motif = art.motif;
  if (!motif) {
    let hash = 0;
    for (let i = 0; i < baseSlug.length; i++) {
      hash = (Math.imul(31, hash) + baseSlug.charCodeAt(i)) | 0;
    }
    const idx = Math.abs(hash) % MOTIF_KEYS.length;
    motif = MOTIF_KEYS[idx];
  }

  const seed = art.seed || baseSlug;
  const coverOverride = art.coverOverride || null;

  return { palette, motif, seed, coverOverride, desk, slug, baseSlug, lang };
}

/** Wraps text into lines fitting max character count per line */
function wrapTitleText(title, maxCharsPerLine = 32) {
  if (!title) return ['COSYmagazine'];
  const words = title.trim().split(/\s+/);
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    if (!currentLine) {
      currentLine = word;
    } else if ((currentLine + ' ' + word).length <= maxCharsPerLine) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Renders cover artwork as an inline SVG string.
 * Full-bleed without empty side bands.
 * Light, warm paper-based aesthetics with torn-paper edges, washi tape, and hand-drawn doodles.
 */
export function renderCover(post, options = {}) {
  const width = options.width || 800;
  const height = options.height || 450;
  const showText = options.showText !== false;

  const { palette, motif, seed, coverOverride, lang } = resolveArtDirection(post);

  // Handle hand-made artwork override with fallback
  if (coverOverride) {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" class="cosy-cover-art cosy-cover-override">
        <image href="${escapeXml(coverOverride)}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice" />
      </svg>
    `.trim();
  }

  const prng = createPRNG(seed);
  const motifFn = MOTIFS[motif] || MOTIFS['paper-cut'];
  const artworkSvg = motifFn({ width, height, palette, prng });

  const title = post ? (post.title || 'COSYmagazine') : 'COSYmagazine';
  const kicker = post ? (post.kicker || post.category || 'EDITORIAL') : 'EDITORIAL';
  const issueStr = post && post.issue ? (post.issue.number || '') : '';

  const inkColor = palette[0] || '#2B211E';
  const accent1 = palette[1] || '#C86D51';
  const accent2 = palette[2] || '#6B8E7B';
  const paperBg = palette[3] || '#FAF6EE';

  // 1. Torn Paper Edge Shape overlay in corner
  const tornEdgeX = width - prng.rangeInt(180, 260);
  const tornEdgeY = prng.rangeInt(10, 30);
  const tornPoints = [
    `${tornEdgeX},0`,
    `${width},0`,
    `${width},${height * 0.45}`,
    `${width - 15},${height * 0.42}`,
    `${width - 35},${height * 0.46}`,
    `${width - 60},${height * 0.38}`,
    `${width - 90},${height * 0.41}`,
    `${width - 120},${height * 0.35}`,
    `${width - 150},${height * 0.39}`,
    `${width - 180},${height * 0.32}`,
    `${tornEdgeX + 20},${height * 0.25}`,
    `${tornEdgeX},0`
  ].join(' ');

  const tornPaperSvg = `
    <g class="cover-torn-paper" filter="url(#soft-shadow)">
      <polygon points="${tornPoints}" fill="#FCF9F2" opacity="0.9" stroke="${accent2}" stroke-width="0.8" stroke-dasharray="3 2" />
    </g>
  `;

  // 2. Translucent Washi Tape Strips
  const washiX = prng.rangeInt(40, width - 200);
  const washiY = prng.rangeInt(15, 35);
  const washiRot = prng.rangeInt(-8, 8);
  const washiTapeSvg = `
    <g transform="rotate(${washiRot} ${washiX + 60} ${washiY + 12})" filter="url(#soft-shadow)">
      <rect x="${washiX}" y="${washiY}" width="120" height="24" rx="2" fill="${accent1}" opacity="0.45" />
      <line x1="${washiX}" y1="${washiY}" x2="${washiX}" y2="${washiY + 24}" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="2 2" opacity="0.7" />
      <line x1="${washiX + 120}" y1="${washiY}" x2="${washiX + 120}" y2="${washiY + 24}" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="2 2" opacity="0.7" />
    </g>
  `;

  // 3. Tiny Hand-Drawn Doodles (Stars, Sparkles, Tea Cup, Botanical Leaf)
  const doodlePrng = createPRNG(`${seed}-doodles`);
  const starX = doodlePrng.rangeInt(width * 0.7, width * 0.9);
  const starY = doodlePrng.rangeInt(40, 100);
  const leafX = doodlePrng.rangeInt(30, 80);
  const leafY = doodlePrng.rangeInt(60, 120);

  const tinyDoodlesSvg = `
    <g class="cover-tiny-doodles" stroke="${accent2}" stroke-width="1.5" fill="none" opacity="0.7">
      <!-- Four-pointed sparkle doodle -->
      <path d="M ${starX} ${starY - 12} Q ${starX} ${starY} ${starX + 12} ${starY} Q ${starX} ${starY} ${starX} ${starY + 12} Q ${starX} ${starY} ${starX - 12} ${starY} Q ${starX} ${starY} ${starX} ${starY - 12} Z" fill="${accent1}" opacity="0.3" />
      <path d="M ${starX + 45} ${starY + 30} Q ${starX + 45} ${starY + 38} ${starX + 53} ${starY + 38} Q ${starX + 45} ${starY + 38} ${starX + 45} ${starY + 46} Q ${starX + 45} ${starY + 38} ${starX + 37} ${starY + 38} Q ${starX + 45} ${starY + 38} ${starX + 45} ${starY + 30} Z" stroke="${accent1}" stroke-width="1" />
      <!-- Botanical sprig doodle -->
      <path d="M ${leafX} ${leafY + 30} C ${leafX + 10} ${leafY + 15}, ${leafX - 5} ${leafY - 5}, ${leafX + 15} ${leafY - 20}" />
      <circle cx="${leafX + 4}" cy="${leafY + 15}" r="3" fill="${accent2}" opacity="0.5" />
      <circle cx="${leafX + 10}" cy="${leafY - 2}" r="3" fill="${accent1}" opacity="0.5" />
    </g>
  `;

  // 4. Text Overlay Card (Warm cream paper ticket card with AA text contrast)
  let textOverlay = '';
  if (showText) {
    const titleLen = title.length;
    let fontSize = 22;
    let maxCharsPerLine = 36;
    let lineHeight = 28;

    if (titleLen > 90) {
      fontSize = 14;
      maxCharsPerLine = 58;
      lineHeight = 18;
    } else if (titleLen > 65) {
      fontSize = 16;
      maxCharsPerLine = 48;
      lineHeight = 21;
    } else if (titleLen > 40) {
      fontSize = 18;
      maxCharsPerLine = 40;
      lineHeight = 24;
    }

    const scaleFactor = width / 800;
    const finalFontSize = Math.max(12, Math.round(fontSize * scaleFactor));
    const finalLineHeight = Math.max(16, Math.round(lineHeight * scaleFactor));
    const finalMaxChars = Math.max(25, Math.round(maxCharsPerLine / scaleFactor));

    const lines = wrapTitleText(title, finalMaxChars);
    const cappedLines = lines.slice(0, 3);
    if (lines.length > 3) {
      cappedLines[2] = cappedLines[2].slice(0, -3) + '...';
    }

    const padX = Math.round(20 * scaleFactor);
    const padY = Math.round(14 * scaleFactor);
    const kickerFontSize = Math.max(10, Math.round(11 * scaleFactor));

    const textBlockHeight = (cappedLines.length * finalLineHeight) + kickerFontSize + Math.round(10 * scaleFactor);
    const rectHeight = textBlockHeight + (padY * 2);

    const marginX = Math.round(16 * scaleFactor);
    const marginY = Math.round(16 * scaleFactor);
    const rectX = marginX;
    const rectY = height - rectHeight - marginY;
    const rectW = width - (marginX * 2);

    const kickerY = rectY + padY + kickerFontSize;
    const firstLineY = kickerY + Math.round(12 * scaleFactor) + (finalFontSize * 0.75);

    // AA contrast guaranteed: inkColor on #FAF6EE / #FCF9F2 card
    const titleLinesSvg = cappedLines.map((lineText, idx) => {
      const lineY = Math.round(firstLineY + (idx * finalLineHeight));
      return `<text x="${rectX + padX}" y="${lineY}" fill="${inkColor}" font-family="Fraunces, 'Lora', Georgia, serif" font-size="${finalFontSize}" font-weight="bold">${escapeXml(lineText)}</text>`;
    }).join('\n');

    const kickerAccent = LANG_ACCENTS[lang] || accent1;

    textOverlay = `
      <g class="cover-text-overlay" filter="url(#soft-shadow)">
        <!-- Warm paper card overlay -->
        <rect class="cover-overlay-box" x="${rectX}" y="${rectY}" width="${rectW}" height="${rectHeight}" rx="8" fill="#FCF9F2" opacity="0.96" stroke="${accent2}" stroke-width="1.2" />
        <text x="${rectX + padX}" y="${kickerY}" fill="${kickerAccent}" font-family="Fraunces, 'Lora', Georgia, serif" font-size="${kickerFontSize}" font-weight="bold" letter-spacing="1.5">${escapeXml(kicker.toUpperCase())} ${escapeXml(issueStr ? '• ' + issueStr : '')}</text>
        ${titleLinesSvg}
      </g>
    `;
  }

  const collagePrng = createPRNG(`${seed}-collage`);

  // 5. Cut-out collage layer (overlapping paper shapes with soft drop shadow)
  const paperCount = collagePrng.rangeInt(2, 4);
  let paperShapes = '';

  for (let i = 0; i < paperCount; i++) {
    const pw = collagePrng.rangeInt(Math.round(width * 0.25), Math.round(width * 0.42));
    const ph = collagePrng.rangeInt(Math.round(height * 0.32), Math.round(height * 0.55));
    const px = collagePrng.rangeInt(Math.round(width * 0.08), Math.round(width * 0.55));
    const py = collagePrng.rangeInt(Math.round(height * 0.12), Math.round(height * 0.42));
    const rot = collagePrng.rangeInt(-10, 10);
    const color = collagePrng.pick([paperBg, '#FFFFFF', accent1, accent2]);

    paperShapes += `
      <g transform="rotate(${rot} ${px + pw/2} ${py + ph/2})">
        <rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="6" fill="${color}" opacity="0.3" stroke="${accent2}" stroke-width="1" filter="url(#soft-shadow)" />
      </g>
    `;
  }

  // 6. Hand-drawn sketchy underline path
  const ulX1 = collagePrng.rangeInt(40, 100);
  const ulX2 = ulX1 + collagePrng.rangeInt(180, 280);
  const ulY = height - collagePrng.rangeInt(30, 60);
  const midX = Math.round((ulX1 + ulX2) / 2);
  const midY = ulY + collagePrng.rangeInt(-6, 6);
  const underlineSvg = `
    <g class="cover-sketchy-underline">
      <path d="M ${ulX1} ${ulY} Q ${midX} ${midY} ${ulX2} ${ulY + collagePrng.rangeInt(-3, 3)}" stroke="${accent1}" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.75" />
      <path d="M ${ulX1 + 10} ${ulY + 3} Q ${midX} ${midY + 3} ${ulX2 - 10} ${ulY + 2}" stroke="${accent2}" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.5" />
    </g>
  `;

  // 7. Masthead-style label tag
  const desk = post ? (post.desk || 'Front Page') : 'Front Page';
  const labelText = `COSYMAGAZINE • ${desk.toUpperCase()}`;
  const labelW = Math.min(width - 40, Math.max(220, labelText.length * 8 + 36));
  const labelH = 30;
  const labelX = 20;
  const labelY = 20;

  const mastheadLabelSvg = `
    <g class="cover-masthead-label" filter="url(#soft-shadow)">
      <rect x="${labelX}" y="${labelY}" width="${labelW}" height="${labelH}" rx="4" fill="#FCF9F2" opacity="0.95" stroke="${accent1}" stroke-width="1.2" />
      <text x="${labelX + 14}" y="${labelY + 20}" fill="${inkColor}" font-family="Fraunces, 'Lora', Georgia, serif" font-size="11" font-weight="bold" letter-spacing="1.4">${escapeXml(labelText)}</text>
    </g>
  `;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" class="cosy-cover-art" data-motif="${motif}" data-seed="${escapeXml(seed)}" data-lang="${lang}">
      <defs>
        <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="3" stdDeviation="3" flood-color="#3C281E" flood-opacity="0.10" />
        </filter>
        <filter id="paper-grain" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" result="noise" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.05" />
          </feComponentTransfer>
          <feBlend mode="multiply" in="SourceGraphic" result="blend" />
        </filter>
      </defs>
      <style>
        @media (prefers-reduced-motion: reduce) {
          .cosy-cover-art * { animation: none !important; transition: none !important; }
        }
      </style>
      ${artworkSvg}
      ${paperShapes}
      ${tornPaperSvg}
      ${washiTapeSvg}
      ${tinyDoodlesSvg}
      ${underlineSvg}
      ${mastheadLabelSvg}
      ${textOverlay}
      <rect width="${width}" height="${height}" filter="url(#paper-grain)" opacity="0.18" pointer-events="none" />
    </svg>
  `.trim();
}

/** Renders a section divider SVG string */
export function renderSectionDivider(post, options = {}) {
  const width = options.width || 600;
  const height = options.height || 40;

  const { palette, seed } = resolveArtDirection(post);

  const color1 = palette[0] || '#2B211E';
  const color2 = palette[1] || '#C86D51';

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="${height}" preserveAspectRatio="xMidYMid slice" class="cosy-section-divider">
      <line x1="0" y1="${height/2}" x2="${width}" y2="${height/2}" stroke="${color1}" stroke-width="1.2" opacity="0.25" stroke-dasharray="4 4" />
      <circle cx="${width/2}" cy="${height/2}" r="5" fill="${color2}" opacity="0.8" />
      <circle cx="${width/2 - 18}" cy="${height/2}" r="2.5" fill="${color1}" opacity="0.4" />
      <circle cx="${width/2 + 18}" cy="${height/2}" r="2.5" fill="${color1}" opacity="0.4" />
    </svg>
  `.trim();
}

/** Renders a decorative Pull Quote Card SVG string */
export function renderPullQuoteCard(quote, post, options = {}) {
  const width = options.width || 600;
  const height = options.height || 200;

  const { palette, seed } = resolveArtDirection(post);

  const bg = palette[3] || '#FAF6EE';
  const accent = palette[0] || '#2B211E';
  const border = palette[1] || '#C86D51';

  const textStr = typeof quote === 'string' ? quote : (quote.quote || '');
  const authorStr = typeof quote === 'object' && quote.attribution ? quote.attribution : '';

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" class="cosy-pullquote-card">
      <rect x="4" y="4" width="${width - 8}" height="${height - 8}" rx="10" fill="${bg}" stroke="${border}" stroke-width="1.5" stroke-dasharray="5 3" />
      <text x="28" y="48" fill="${border}" font-family="Fraunces, serif" font-size="44" opacity="0.4">“</text>
      <text x="48" y="82" fill="${accent}" font-family="Fraunces, serif" font-size="17" font-style="italic">${escapeXml(textStr.length > 90 ? textStr.slice(0, 87) + '...' : textStr)}</text>
      ${authorStr ? `<text x="${width - 48}" y="${height - 30}" fill="${border}" font-family="DM Sans, sans-serif" font-size="12" font-weight="bold" text-anchor="end">— ${escapeXml(authorStr)}</text>` : ''}
    </svg>
  `.trim();
}

/** Renders a Vocabulary Word Card SVG string */
export function renderWordCard(wordData, post, options = {}) {
  const width = options.width || 320;
  const height = options.height || 180;

  const { palette, seed } = resolveArtDirection(post);

  const bg = palette[3] || '#FAF6EE';
  const textClr = palette[0] || '#2B211E';
  const accent = palette[1] || '#C86D51';

  const word = wordData.word || 'Word';
  const pos = wordData.pos || 'noun';
  const definition = wordData.definition || wordData.meaning || '';

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" class="cosy-word-card">
      <rect width="${width}" height="${height}" rx="8" fill="${bg}" stroke="${accent}" stroke-width="1.2" />
      <rect x="0" y="0" width="${width}" height="6" rx="3" fill="${accent}" />
      <text x="18" y="42" fill="${textClr}" font-family="Fraunces, serif" font-size="20" font-weight="bold">${escapeXml(word)}</text>
      <text x="18" y="64" fill="${accent}" font-family="DM Sans, sans-serif" font-size="12" font-style="italic">${escapeXml(pos)}</text>
      <line x1="18" y1="76" x2="${width - 18}" y2="76" stroke="${accent}" opacity="0.2" />
      <text x="18" y="105" fill="${textClr}" font-family="DM Sans, sans-serif" font-size="12" opacity="0.88">${escapeXml(definition.length > 70 ? definition.slice(0, 67) + '...' : definition)}</text>
    </svg>
  `.trim();
}
