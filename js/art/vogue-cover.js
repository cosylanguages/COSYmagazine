/**
 * js/art/vogue-cover.js
 * Issue covers built on the editorial formula of a fashion magazine cover:
 *
 *   - Masthead: high-contrast Didone serif spanning ~88% of the width, near the top edge.
 *   - Head-overlap: the subject's head crosses the masthead. Outer letters are re-drawn
 *     over the subject, middle letters sit behind it, which gives the logo its depth.
 *   - Cover lines: four, strictly on the left and right margins, leaving the centre clear.
 *   - Anchor headline: one dominant serif block in the bottom fifth.
 *   - Ink discipline: cream text plus a single accent colour per issue.
 *
 * No portrait photography exists in this repository, so the subject is drawn as
 * editorial line art. Illustrated covers are part of the fashion-magazine tradition,
 * and line art keeps the covers honest: it never pretends to be a photograph of a
 * real person.
 */

import { createPRNG } from './rng.js';

const SERIF = "Fraunces, 'Lora', Georgia, 'Times New Roman', serif";
const SANS = "Commissioner, 'DM Sans', Helvetica, Arial, sans-serif";

const MASTHEAD_TEXT = 'COSYMAGAZINE';

/** Per-issue art direction. Keyed by `Vol. YYYY.MM`. */
const ISSUE_COVERS = {
  'Vol. 2026.08': {
    accent: '#C8703F',
    backdrop: '#241C18',
    subjectTone: '#7A6250',
    pose: 'close',
    coverLines: {
      left: [['LESSON ONE FEAR', 'Unlearning the red pen'], ['SAY IT OUT LOUD', 'A classroom rebuilt']],
      right: [['SPEAK FROM MINUTE ONE', 'No silent first term'], ['THE COSY METHOD', 'Warmth over drills']]
    }
  },
  'Vol. 2026.09': {
    accent: '#C9A227',
    backdrop: '#1E2318',
    subjectTone: '#6E7C58',
    pose: 'medium',
    coverLines: {
      left: [['ME VS PLATEAU', 'Why progress stalls'], ['RETIRE 50 PHRASES', 'The upgrade habit']],
      right: [['THE B1 WALL', 'What actually breaks it'], ['PLATEAU, REFRAMED', 'A measurement error']]
    }
  },
  'Vol. 2026.10': {
    accent: '#D4573F',
    backdrop: '#2A1A1D',
    subjectTone: '#82525C',
    pose: 'close',
    coverLines: {
      left: [['FOUNDER\u2019S EDITION', 'His favourite things'], ['TEN FRAMES', 'Fourteen languages']],
      right: [['PLAY BEATS DISCIPLINE', 'The messy first draft'], ['ANOTHER YEAR', 'What changed']]
    }
  },
  'Vol. 2026.11': {
    accent: '#8C8AD9',
    backdrop: '#1A1B33',
    subjectTone: '#585A8C',
    pose: 'medium',
    coverLines: {
      left: [['NOVEMBER ACADEMIA', 'How language rewires'], ['BEYOND SWITCHING', 'Living in five tongues']],
      right: [['THE PLASTIC BRAIN', 'What the evidence says'], ['MEMORY & RHYTHM', 'A timeline for fluency']]
    }
  },
  'Vol. 2026.12': {
    accent: '#C9A227',
    backdrop: '#1B241F',
    subjectTone: '#5C7162',
    pose: 'close',
    coverLines: {
      left: [['WINTER SOLSTICE', 'The quiet season'], ['PHRASAL VERBS', 'Decoded at last']],
      right: [['RITUAL & RETENTION', 'Tea, rhythm, repeat'], ['END THE YEAR', 'Without a grade']]
    }
  },
  'Vol. 2027.02': {
    accent: '#C4727F',
    backdrop: '#261A20',
    subjectTone: '#7E5763',
    pose: 'medium',
    coverLines: {
      left: [['ROMANCE & NUANCE', 'The spectrum of affection'], ['GENTLE NOUNS', 'Tenderness, translated']],
      right: [['SAY IT SOFTLY', 'Vulnerability aloud'], ['NEGOTIATE', 'Money and feeling']]
    }
  },
  'Podcast Special': {
    accent: '#D9A441',
    backdrop: '#201C16',
    subjectTone: '#6E614C',
    pose: 'close',
    coverLines: {
      left: [['SATURDAY MISTAKES', 'The podcast series'], ['EVERY WEEK', 'Out loud']],
      right: [['LEARN FROM THE SLIP', 'Errors as material'], ['THE ROUTINE', 'One habit at a time']]
    }
  }
};

const DEFAULT_COVER = {
  accent: '#C9A227',
  backdrop: '#221C1A',
  subjectTone: '#6B6058',
  pose: 'medium',
  coverLines: {
    left: [['THE NEW ISSUE', 'Words, voices, culture'], ['INSIDE', 'This edition']],
    right: [['SPEAK FROM DAY ONE', 'From the first page'], ['THE METHOD', 'Cosy by design']]
  }
};

function escapeXml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Stable, XML-id-safe token so several covers can share one page without id collisions. */
function idToken(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  return 'c' + Math.abs(h).toString(36);
}

/**
 * Greedy wrap on word boundaries, breaking when the estimated rendered width would
 * exceed `maxWidth`. Character counts do not work across scripts: 20 Cyrillic characters
 * are far wider than 20 Latin ones.
 */
function wrapToWidth(text, size, maxWidth, maxLines, tracking = 0) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (!current || estimateWidth(candidate, size, tracking) <= maxWidth) {
      current = candidate;
      continue;
    }
    lines.push(current);
    // A single word wider than the column (common in Greek and German) has to be split,
    // otherwise it can never fit no matter how small the type gets.
    if (estimateWidth(word, size, tracking) > maxWidth) {
      let chunk = '';
      for (const ch of word) {
        if (chunk && estimateWidth(chunk + ch, size, tracking) > maxWidth) {
          lines.push(chunk);
          chunk = ch;
        } else {
          chunk += ch;
        }
      }
      current = chunk;
    } else {
      current = word;
    }
  }
  if (current) lines.push(current);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = kept[maxLines - 1].replace(/[.,;:]?$/, '') + '\u2026';
    return kept;
  }
  return lines;
}


// Average advance per character class, measured from the real fonts. Scripts differ a
// lot: Cyrillic caps are ~0.93em against ~0.80em for Latin, so a single average would
// let Russian and Greek covers overflow their columns.
const ADVANCE = {
  upperLatin: 0.80,
  upperCyrillic: 0.93,
  upperGreek: 0.81,
  lowerLatin: 0.57,
  lowerCyrillic: 0.84,
  lowerGreek: 0.82,
  digit: 0.56,
  space: 0.26,
  punct: 0.34
};

function charAdvance(ch) {
  if (ch === ' ') return ADVANCE.space;
  const c = ch.codePointAt(0);
  if (c >= 0x0410 && c <= 0x044F) {
    return c <= 0x042F ? ADVANCE.upperCyrillic : ADVANCE.lowerCyrillic;
  }
  if (c >= 0x0370 && c <= 0x03FF) {
    return (c >= 0x0391 && c <= 0x03A9) ? ADVANCE.upperGreek : ADVANCE.lowerGreek;
  }
  if (c >= 0x41 && c <= 0x5A) return ADVANCE.upperLatin;
  if (c >= 0x61 && c <= 0x7A) return ADVANCE.lowerLatin;
  if (c >= 0x30 && c <= 0x39) return ADVANCE.digit;
  return ADVANCE.punct;
}

/**
 * Estimated rendered width of a string. Used only to fit text inside the cover's fixed
 * columns, so it needs to be conservative rather than exact: over-estimating shrinks a
 * line slightly, under-estimating spills it into the centre band.
 */
function estimateWidth(text, size, tracking = 0) {
  let units = 0;
  for (const ch of String(text)) units += charAdvance(ch);
  // Calibrated against the real fonts across Latin, Cyrillic and Greek: the worst case
  // measured 1.24x the raw estimate (Greek caps), so the factor leaves a small margin.
  return (units * size + String(text).length * tracking) * 1.32;
}

/**
 * Editorial line-art bust. Drawn parametrically from the head centre and radii so the
 * same figure scales to any cover size. Eyes are rendered as open contours so the
 * subject reads as looking straight at the reader.
 */
function renderSubject({ cx, cy, rx, ry, shoulderY, shoulderW, tone, accent, pose, clipId }) {
  const eyeY = cy + ry * 0.12;
  const eyeDx = rx * 0.42;
  const eyeRx = rx * 0.13;
  const eyeRy = ry * 0.075;

  const browY = eyeY - ry * 0.17;
  const noseY = cy + ry * 0.42;
  const lipY = cy + ry * 0.66;

  const hairSweep = pose === 'close' ? 1.12 : 1.0;

  return `
    <g class="vc-subject">
      <!-- shoulders and neck -->
      <path d="M ${cx - shoulderW} ${shoulderY + (ry * 2.6)}
               C ${cx - shoulderW * 0.62} ${shoulderY + ry * 0.55},
                 ${cx - rx * 0.72} ${shoulderY + ry * 0.1},
                 ${cx - rx * 0.46} ${cy + ry * 0.96}
               L ${cx - rx * 0.46} ${cy + ry * 1.02}
               L ${cx + rx * 0.46} ${cy + ry * 1.02}
               L ${cx + rx * 0.46} ${cy + ry * 0.96}
               C ${cx + rx * 0.72} ${shoulderY + ry * 0.1},
                 ${cx + shoulderW * 0.62} ${shoulderY + ry * 0.55},
                 ${cx + shoulderW} ${shoulderY + (ry * 2.6)}"
            fill="${tone}" />
      <!-- hair mass behind the face -->
      <path d="M ${cx - rx * hairSweep} ${cy + ry * 0.1}
               C ${cx - rx * hairSweep} ${cy - ry * 1.28},
                 ${cx + rx * hairSweep} ${cy - ry * 1.28},
                 ${cx + rx * hairSweep} ${cy + ry * 0.1}
               C ${cx + rx * hairSweep} ${cy + ry * 0.86},
                 ${cx + rx * 0.8} ${cy + ry * 1.02},
                 ${cx + rx * 0.46} ${cy + ry * 1.02}
               L ${cx - rx * 0.46} ${cy + ry * 1.02}
               C ${cx - rx * 0.8} ${cy + ry * 1.02},
                 ${cx - rx * hairSweep} ${cy + ry * 0.86},
                 ${cx - rx * hairSweep} ${cy + ry * 0.1} Z"
            fill="${tone}" />
      <!-- face plane, lifted a step so the contour reads -->
      <path d="M ${cx} ${cy - ry}
               C ${cx + rx * 0.86} ${cy - ry},
                 ${cx + rx * 0.98} ${cy + ry * 0.2},
                 ${cx + rx * 0.62} ${cy + ry * 0.72}
               C ${cx + rx * 0.4} ${cy + ry * 1.02},
                 ${cx - rx * 0.4} ${cy + ry * 1.02},
                 ${cx - rx * 0.62} ${cy + ry * 0.72}
               C ${cx - rx * 0.98} ${cy + ry * 0.2},
                 ${cx - rx * 0.86} ${cy - ry},
                 ${cx} ${cy - ry} Z"
            fill="${tone}" stroke="${accent}" stroke-opacity="0.5" stroke-width="${Math.max(1, rx * 0.012)}" />
      <!-- brows -->
      <path d="M ${cx - eyeDx - eyeRx} ${browY} Q ${cx - eyeDx} ${browY - eyeRy * 0.8} ${cx - eyeDx + eyeRx} ${browY}"
            fill="none" stroke="${accent}" stroke-opacity="0.85" stroke-width="${Math.max(1.4, rx * 0.022)}" stroke-linecap="round" />
      <path d="M ${cx + eyeDx - eyeRx} ${browY} Q ${cx + eyeDx} ${browY - eyeRy * 0.8} ${cx + eyeDx + eyeRx} ${browY}"
            fill="none" stroke="${accent}" stroke-opacity="0.85" stroke-width="${Math.max(1.4, rx * 0.022)}" stroke-linecap="round" />
      <!-- eyes: open, direct -->
      <ellipse cx="${cx - eyeDx}" cy="${eyeY}" rx="${eyeRx}" ry="${eyeRy}" fill="#FCF9F2" />
      <ellipse cx="${cx + eyeDx}" cy="${eyeY}" rx="${eyeRx}" ry="${eyeRy}" fill="#FCF9F2" />
      <circle cx="${cx - eyeDx}" cy="${eyeY}" r="${eyeRy * 0.82}" fill="#1A1512" />
      <circle cx="${cx + eyeDx}" cy="${eyeY}" r="${eyeRy * 0.82}" fill="#1A1512" />
      <circle cx="${cx - eyeDx + eyeRx * 0.24}" cy="${eyeY - eyeRy * 0.26}" r="${eyeRy * 0.22}" fill="#FFFFFF" />
      <circle cx="${cx + eyeDx + eyeRx * 0.24}" cy="${eyeY - eyeRy * 0.26}" r="${eyeRy * 0.22}" fill="#FFFFFF" />
      <!-- nose -->
      <path d="M ${cx - rx * 0.05} ${eyeY + ry * 0.2} Q ${cx - rx * 0.1} ${noseY} ${cx + rx * 0.03} ${noseY}"
            fill="none" stroke="${accent}" stroke-opacity="0.55" stroke-width="${Math.max(1, rx * 0.014)}" stroke-linecap="round" />
      <!-- lips -->
      <path d="M ${cx - rx * 0.2} ${lipY} Q ${cx} ${lipY - ry * 0.06} ${cx + rx * 0.2} ${lipY}
               Q ${cx} ${lipY + ry * 0.09} ${cx - rx * 0.2} ${lipY} Z"
            fill="${accent}" fill-opacity="0.75" />
      <!-- accent: single earring -->
      <circle cx="${cx + rx * 0.9}" cy="${cy + ry * 0.5}" r="${rx * 0.055}" fill="${accent}" />
    </g>
  `;
}

/**
 * Renders one issue cover.
 *
 * @param {object} issue  { number, title, tag, month, i18nKey, hero, fitTexts }.
 *   `number` selects the art; `title` seeds the drawing and labels the image. Cover copy
 *   comes from `fitTexts` when given, so the drawn text is the text that was measured.
 * @param {object} [options]
 * @param {number} [options.width]   default 900 (portrait 3:4)
 * @param {number} [options.height]  default 1200
 * @param {boolean} [options.showText] default true
 * @param {object} [options.art]     overrides for accent/backdrop/subjectTone/pose/coverLines
 */
export function renderIssueCover(issue, options = {}) {
  const width = options.width || 900;
  const height = options.height || 1200;
  const showText = options.showText !== false;

  const number = (issue && issue.number) || 'Vol. 2026.01';
  const title = (issue && issue.title) || 'COSYmagazine';
  const tag = (issue && issue.tag) || '';
  const month = (issue && issue.month) || '';
  // Dictionary namespace for this issue's cover text, e.g. "catalog.covers.2026_09".
  // When present, every string is also emitted with data-i18n so shell.js can swap it
  // as the reader changes interface language.
  const i18nBase = (issue && issue.i18nKey) || '';
  // Widest translation of each string across all interface languages. Text is swapped at
  // runtime by shell.js, so sizing must assume the longest variant or a translation will
  // overflow the column the English text fit into.
  const fitTexts = (issue && issue.fitTexts) || {};
  // Always an array of candidate strings for the key, falling back to the built text.
  const fitOf = (key, fallback) => {
    const list = fitTexts[key];
    return Array.isArray(list) && list.length ? list : [fallback];
  };

  const art = { ...(ISSUE_COVERS[number] || DEFAULT_COVER), ...(options.art || {}) };
  const { accent, backdrop, subjectTone, pose } = art;
  // Rendered cover text comes from the dictionary, never from ISSUE_COVERS: art data and
  // copy drifted apart once already, and the copy that is drawn must be the copy that was
  // measured. The first variant is English, which is what the static HTML ships.
  const pick = (key, fallback) => {
    const list = fitTexts[key];
    return Array.isArray(list) && list.length ? list[0] : fallback;
  };
  const coverLines = {
    left: [
      [pick('kicker1', art.coverLines.left[0][0]), pick('sub1', art.coverLines.left[0][1])],
      [pick('kicker2', art.coverLines.left[1][0]), pick('sub2', art.coverLines.left[1][1])]
    ],
    right: [
      [pick('kicker3', art.coverLines.right[0][0]), pick('sub3', art.coverLines.right[0][1])],
      [pick('kicker4', art.coverLines.right[1][0]), pick('sub4', art.coverLines.right[1][1])]
    ]
  };

  const uid = idToken(`${number}|${title}`);
  const clipId = `vc-${uid}-split`;

  const prng = createPRNG(`vogue|${number}|${title}`);

  const M = width * 0.05;              // 5% safe margin
  // The face sits above the cover lines, so the centre only needs a gutter between the
  // two columns. Reserving a full subject band squeezed the type down to ~7px.
  const centerLeft = width * 0.42;
  const centerRight = width * 0.58;

  // ---- Masthead: sized so the word spans ~88% of the width ----
  // 0.6676 is the measured advance of Fraunces 900 at this tracking, so the masthead
  // fills its intended span instead of bleeding past the canvas edges.
  const MASTHEAD_ADVANCE = 0.6676;
  const mastheadSize = Math.round((width * 0.88) / (MASTHEAD_TEXT.length * MASTHEAD_ADVANCE));
  const mastheadBaseline = Math.round(height * 0.163);

  // ---- Subject geometry: head must cross the masthead baseline ----
  const headCx = width * 0.5;
  const headRy = height * (pose === 'close' ? 0.135 : 0.115);
  const headRx = headRy * 0.78;
  const headCy = height * 0.175;
  const shoulderY = height * 0.40;
  const shoulderW = width * (pose === 'close' ? 0.42 : 0.38);

  const subject = renderSubject({
    cx: headCx,
    cy: headCy,
    rx: headRx,
    ry: headRy,
    shoulderY,
    shoulderW,
    tone: subjectTone,
    accent,
    pose,
    clipId
  });

  // textLength pins the masthead to its span regardless of which serif the client has,
  // so the "logo nearly fills the width" rule holds on every machine.
  const mastheadSpan = Math.round(width * 0.88);
  const mastheadText = (fill, extra = '') => `
    <text x="${width / 2}" y="${mastheadBaseline}" text-anchor="middle"
          font-family="${SERIF}" font-size="${mastheadSize}" font-weight="900"
          letter-spacing="${-mastheadSize * 0.012}" fill="${fill}"
          textLength="${mastheadSpan}" lengthAdjust="spacingAndGlyphs" ${extra}>${escapeXml(MASTHEAD_TEXT)}</text>
  `;

  // The head sits between these two cuts: letters left of it and right of it are
  // redrawn in front, which is what produces the overlap.
  const leftCut = headCx - headRx * 0.92;
  const rightCut = headCx + headRx * 0.92;

  const mastheadFront = showText ? `
    <g clip-path="url(#${clipId})">${mastheadText('#FCF9F2')}</g>
  ` : '';

  // ---- Cover lines: two upper-left, two lower-right, never in the centre ----
  const colWidth = centerLeft - M;
  const kickerTrackRatio = 0.16;

  /**
   * Sizes the kicker and subhead down until both fit the column. This is what keeps
   * long issue titles from spilling into the centre band, which must stay clear.
   */
  /**
   * Sizes a kicker and its subhead so both fit the column on ONE line, in every language.
   * They must be single text nodes: shell.js swaps textContent on the element carrying
   * data-i18n, so a wrapped line would keep its built language on the extra nodes and the
   * translated string would land in one node and overflow the column.
   */
  function fitCoverLine(kicker, sub, kickers, subs) {
    const fitOne = (primary, variants, startSize, trackingRatio, minSize) => {
      let size = startSize;
      const measure = (v) => estimateWidth(v, size, size * trackingRatio);
      for (let i = 0; i < 80; i++) {
        const widest = Math.max(...[primary, ...variants].map(measure));
        if (widest <= colWidth || size <= minSize) break;
        size *= 0.94;
      }
      return Math.round(size * 10) / 10;
    };
    const kickerSize = fitOne(kicker, kickers, width * 0.0215, kickerTrackRatio, width * 0.013);
    const subSize = fitOne(sub, subs, width * 0.0255, 0, width * 0.014);
    return { kickerSize, subSize };
  }

  function coverLineBlock(items, side, startY) {
    return items.map(([kicker, sub], i) => {
      const idx = i + (side === 'left' ? 1 : 3);
      const { kickerSize, subSize } = fitCoverLine(
        kicker, sub, fitOf(`kicker${idx}`, kicker), fitOf(`sub${idx}`, sub)
      );
      const y = startY + i * (subSize * 4.6);
      const anchor = side === 'left' ? 'start' : 'end';
      const x = side === 'left' ? M : width - M;
      const kickerTrack = (kickerSize * kickerTrackRatio).toFixed(2);
      const kickerKey = i18nBase ? ` data-i18n="${escapeXml(i18nBase)}.kicker${idx}"` : '';
      const subKey = i18nBase ? ` data-i18n="${escapeXml(i18nBase)}.sub${idx}"` : '';
      return `
        <g class="vc-cover-line">
          <text x="${x}" y="${y.toFixed(1)}" text-anchor="${anchor}" font-family="${SANS}"
                font-size="${kickerSize}" font-weight="700" letter-spacing="${kickerTrack}"
                fill="${accent}"${kickerKey}>${escapeXml(kicker)}</text>
          <text x="${x}" y="${(y + subSize * 1.45).toFixed(1)}" text-anchor="${anchor}"
                font-family="${SERIF}" font-size="${subSize}" font-style="italic"
                fill="#FCF9F2"${subKey}>${escapeXml(sub)}</text>
        </g>
      `;
    }).join('');
  }

  const leftLines = showText
    ? coverLineBlock(coverLines.left, 'left', height * 0.315)
    : '';
  const rightLines = showText
    ? coverLineBlock(coverLines.right, 'right', height * 0.545)
    : '';

  // ---- Anchor headline in the bottom fifth ----
  // The anchor headline is a short theme phrase, not the article title. Vogue's bottom
  // line is a name plus an evocative phrase; a full article title cannot do that job and
  // would also leak English onto localized covers.
  // The hero is ONE text node on purpose: shell.js replaces textContent on the element
  // carrying data-i18n, so a wrapped hero would keep its built language on the extra
  // lines. It is therefore sized to fit a single line.
  const heroText = (issue && issue.hero) || title;
  const heroVariants = fitOf('hero', heroText);
  const heroMeasure = width * 0.90;
  let heroSize = width * 0.078;
  for (let i = 0; i < 80; i++) {
    const widest = Math.max(...heroVariants.map((t) => estimateWidth(t, heroSize)));
    if (widest <= heroMeasure) break;
    if (heroSize <= width * 0.012) break;
    heroSize *= 0.94;
  }
  heroSize = Math.round(heroSize);
  const heroBottom = height - height * 0.055;

  const hero = showText ? `
    <g class="vc-hero">
      <text x="${width / 2}" y="${heroBottom}" text-anchor="middle"
            font-family="${SERIF}" font-size="${heroSize}" font-weight="700"
            fill="#FCF9F2"${i18nBase ? ` data-i18n="${escapeXml(i18nBase)}.hero"` : ''}>${escapeXml(heroText)}</text>
      <line x1="${width * 0.30}" y1="${heroBottom + height * 0.018}"
            x2="${width * 0.70}" y2="${heroBottom + height * 0.018}"
            stroke="${accent}" stroke-width="${Math.max(1.5, width * 0.0022)}" />
    </g>
  ` : '';

  // ---- Corner metadata: issue number and month, small serif ----
  const metaSize = Math.round(width * 0.0195);
  const issueNumeral = (number.match(/(\d{4})\.(\d{2})/) || [])[1]
    ? `N\u00B0 ${(number.match(/(\d{4})\.(\d{2})/) || [])[2]} \u00B7 ${(number.match(/(\d{4})\.(\d{2})/) || [])[1]}`
    : number.toUpperCase();

  const corner = showText ? `
    <g class="vc-meta">
      <text x="${M}" y="${height * 0.045}" font-family="${SERIF}"
            font-size="${metaSize}" letter-spacing="${(metaSize * 0.22).toFixed(2)}"
            fill="#FCF9F2" fill-opacity="0.85">${escapeXml(issueNumeral)}</text>
      ${month ? `<text x="${M}" y="${height * 0.045 + metaSize * 1.55}" font-family="${SANS}"
            font-size="${Math.round(metaSize * 0.8)}" font-weight="600"
            letter-spacing="${(metaSize * 0.3).toFixed(2)}" fill="${accent}"
            fill-opacity="0.95"${i18nBase ? ` data-i18n="${escapeXml(i18nBase)}.month"` : ''}>${escapeXml(String(month).toUpperCase())}</text>` : ''}
    </g>
  ` : '';

  // Tag sits in the gutter between the upper-left and lower-right cover lines. Placing it
  // just below the chin put it on the same line as the first left cover line, so a long
  // Russian or Greek tag ran into that column.
  const tagY = Math.round(height * 0.455);
  const tagLine = showText && tag ? `
    <text x="${width / 2}" y="${tagY}" text-anchor="middle" font-family="${SANS}"
          font-size="${Math.round(width * 0.0205)}" font-weight="600"
          letter-spacing="${(width * 0.0042).toFixed(2)}" fill="${accent}"
          fill-opacity="0.9"${i18nBase ? ` data-i18n="${escapeXml(i18nBase)}.tag"` : ''}>${escapeXml(String(tag).toUpperCase())}</text>
  ` : '';

  const grainId = `vc-${uid}-grain`;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%"
         preserveAspectRatio="xMidYMid slice" class="cosy-issue-cover"
         data-issue="${escapeXml(number)}" data-vogue-cover="true" role="img"
         aria-label="${escapeXml(`${title} — ${number} cover`)}">
      <defs>
        <clipPath id="${clipId}">
          <rect x="0" y="0" width="${leftCut}" height="${height}" />
          <rect x="${rightCut}" y="0" width="${width - rightCut}" height="${height}" />
        </clipPath>
        <linearGradient id="vc-${uid}-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${backdrop}" />
          <stop offset="62%" stop-color="${backdrop}" />
          <stop offset="100%" stop-color="${subjectTone}" stop-opacity="0.55" />
        </linearGradient>
        <radialGradient id="vc-${uid}-halo" cx="50%" cy="34%" r="62%">
          <stop offset="0%" stop-color="${accent}" stop-opacity="0.20" />
          <stop offset="100%" stop-color="${accent}" stop-opacity="0" />
        </radialGradient>
        <filter id="${grainId}" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="n" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer><feFuncA type="linear" slope="0.06" /></feComponentTransfer>
          <feBlend mode="multiply" in="SourceGraphic" />
        </filter>
      </defs>

      <rect width="${width}" height="${height}" fill="url(#vc-${uid}-bg)" />
      <rect width="${width}" height="${height}" fill="url(#vc-${uid}-halo)" />

      ${showText ? `<g class="vc-masthead vc-masthead--behind">${mastheadText('#FCF9F2')}</g>` : ''}
      ${subject}
      ${mastheadFront}
      ${tagLine}
      ${corner}
      ${leftLines}
      ${rightLines}
      ${hero}

      <rect width="${width}" height="${height}" filter="url(#${grainId})" opacity="0.16" pointer-events="none" />
    </svg>
  `.trim();
}

export { ISSUE_COVERS, MASTHEAD_TEXT };
