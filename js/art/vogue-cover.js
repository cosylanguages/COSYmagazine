/**
 * js/art/vogue-cover.js
 * Issue covers built on the editorial formula of a fashion magazine cover:
 *
 *   - Masthead: high-contrast Didone serif spanning ~88% of the width, near the top edge.
 *   - Cover lines: four, strictly on the left and right margins, leaving the centre clear.
 *   - Anchor headline: one dominant serif block in the bottom fifth.
 *   - Ink discipline: cream text plus a single accent colour per issue.
 *
 * Each cover is a real photograph from Wikimedia Commons, restricted to CC0 or public
 * domain so the covers can be sold inside the paid editions without attribution
 * obligations. The image is a subject, not a portrait: covers show rooms, objects and
 * place, never a drawn or photographed face, which is what made the earlier
 * parametric line-art bust read as uncanny.
 *
 * Provenance for every file is recorded in images/covers/CREDITS.json, and
 * `tests/test_cover_art.mjs` fails the build if a cover file, its credit entry, or its
 * licence is missing.
 */


const SERIF = "Fraunces, 'Lora', Georgia, 'Times New Roman', serif";
const SANS = "Commissioner, 'DM Sans', Helvetica, Arial, sans-serif";

const MASTHEAD_TEXT = 'COSYMAGAZINE';

/** Per-issue art direction. Keyed by `Vol. YYYY.MM`. */
const ISSUE_COVERS = {
  'Vol. 2026.08': {
    accent: '#E8A05C',
    backdrop: '#241C18',
    subjectTone: '#7A6250',
    photo: 'images/covers/2026-08.jpg',
    coverLines: {
      left: [['LESSON ONE FEAR', 'Unlearning the red pen'], ['SAY IT OUT LOUD', 'A classroom rebuilt']],
      right: [['SPEAK FROM MINUTE ONE', 'No silent first term'], ['THE COSY METHOD', 'Warmth over drills']]
    }
  },
  'Vol. 2026.09': {
    accent: '#D9B84A',
    backdrop: '#1E2318',
    subjectTone: '#6E7C58',
    photo: 'images/covers/2026-09.jpg',
    coverLines: {
      left: [['ME VS PLATEAU', 'Why progress stalls'], ['RETIRE 50 PHRASES', 'The upgrade habit']],
      right: [['THE B1 WALL', 'What actually breaks it'], ['PLATEAU, REFRAMED', 'A measurement error']]
    }
  },
  'Vol. 2026.10': {
    accent: '#E0705A',
    backdrop: '#2A1A1D',
    subjectTone: '#82525C',
    photo: 'images/covers/2026-10.jpg',
    coverLines: {
      left: [['FOUNDER\u2019S EDITION', 'His favourite things'], ['TEN FRAMES', 'Fourteen languages']],
      right: [['PLAY BEATS DISCIPLINE', 'The messy first draft'], ['ANOTHER YEAR', 'What changed']]
    }
  },
  'Vol. 2026.11': {
    accent: '#A9A6F0',
    backdrop: '#1A1B33',
    subjectTone: '#585A8C',
    photo: 'images/covers/2026-11.jpg',
    coverLines: {
      left: [['NOVEMBER ACADEMIA', 'How language rewires'], ['BEYOND SWITCHING', 'Living in five tongues']],
      right: [['THE PLASTIC BRAIN', 'What the evidence says'], ['MEMORY & RHYTHM', 'A timeline for fluency']]
    }
  },
  'Vol. 2026.12': {
    accent: '#E3C06A',
    backdrop: '#1B241F',
    subjectTone: '#5C7162',
    photo: 'images/covers/2026-12.jpg',
    coverLines: {
      left: [['WINTER SOLSTICE', 'The quiet season'], ['PHRASAL VERBS', 'Decoded at last']],
      right: [['RITUAL & RETENTION', 'Tea, rhythm, repeat'], ['END THE YEAR', 'Without a grade']]
    }
  },
  'Vol. 2027.02': {
    accent: '#E08D9B',
    backdrop: '#261A20',
    subjectTone: '#7E5763',
    photo: 'images/covers/2027-02.jpg',
    coverLines: {
      left: [['ROMANCE & NUANCE', 'The spectrum of affection'], ['GENTLE NOUNS', 'Tenderness, translated']],
      right: [['SAY IT SOFTLY', 'Vulnerability aloud'], ['NEGOTIATE', 'Money and feeling']]
    }
  },
  'Podcast Special': {
    accent: '#E8B75C',
    backdrop: '#201C16',
    subjectTone: '#6E614C',
    photo: 'images/covers/podcast.jpg',
    coverLines: {
      left: [['SATURDAY MISTAKES', 'The podcast series'], ['EVERY WEEK', 'Out loud']],
      right: [['LEARN FROM THE SLIP', 'Errors as material'], ['THE ROUTINE', 'One habit at a time']]
    }
  }
};

/** Fallback photograph for an issue with no art direction of its own. */
const DEFAULT_PHOTO = 'images/covers/2026-08.jpg';

const DEFAULT_COVER = {
  accent: '#C9A227',
  backdrop: '#221C1A',
  subjectTone: '#6B6058',
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
 * Full-bleed photographic subject. The image is the cover's backdrop, so the cover is
 * read as an editorial photograph with type set over it rather than as a drawn figure.
 * A warm ink wash plus a vertical scrim is laid on top: the scrim darkens the top and
 * bottom fifths where the masthead and hero sit, which is what keeps cream type legible
 * over an unpredictable photograph.
 */
function renderPhoto({ photo, backdrop, accent, uid, height }) {
  const scrimId = `vc-${uid}-scrim`;
  return `
    <g class="vc-subject vc-photo">
      <defs>
        <linearGradient id="${scrimId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${backdrop}" stop-opacity="0.86" />
          <stop offset="20%" stop-color="${backdrop}" stop-opacity="0.62" />
          <stop offset="32%" stop-color="${backdrop}" stop-opacity="0.22" />
          <stop offset="56%" stop-color="${backdrop}" stop-opacity="0.18" />
          <stop offset="74%" stop-color="${backdrop}" stop-opacity="0.46" />
          <stop offset="89%" stop-color="${backdrop}" stop-opacity="0.80" />
          <stop offset="100%" stop-color="${backdrop}" stop-opacity="0.92" />
        </linearGradient>
      </defs>
      <image href="${escapeXml(photo)}" x="0" y="0" width="100%" height="${height}"
             preserveAspectRatio="xMidYMid slice" />
      <rect width="100%" height="${height}" fill="${accent}" fill-opacity="0.10" />
      <rect width="100%" height="${height}" fill="url(#${scrimId})" />
    </g>
  `;
}

/**
 * Renders one issue cover.
 *
 * @param {object} issue  { number, title, tag, month, i18nKey, hero, heroI18nKey, fitTexts }.
 *   `number` selects the art; `title` seeds the drawing and labels the image. Cover copy
 *   comes from `fitTexts` when given, so the drawn text is the text that was measured.
 *   `heroI18nKey` points the hero line at the issue name (see `blog.issue_*_title`);
 *   it defaults to `<i18nKey>.hero`.
 * @param {object} [options]
 * @param {number} [options.width]   default 900 (portrait 3:4)
 * @param {number} [options.height]  default 1200
 * @param {boolean} [options.showText] default true
 * @param {object} [options.art]     overrides for accent/backdrop/subjectTone/photo/coverLines
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
  // The hero is the issue's name, and that name lives outside the cover namespace:
  // `blog.issue_<month>_title` is the same key the section heading uses, so cover and
  // heading can never disagree. Fall back to the cover namespace for callers that only
  // supply `i18nKey`.
  const heroI18nKey = (issue && issue.heroI18nKey) || (i18nBase ? `${i18nBase}.hero` : '');
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
  const { accent, backdrop, subjectTone } = art;
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

  // ---- Subject: a full-bleed photograph behind the type ----
  const subject = renderPhoto({
    photo: art.photo || DEFAULT_PHOTO,
    backdrop,
    accent,
    uid,
    height
  });

  // textLength pins the masthead to its span regardless of which serif the client has,
  // so the "logo nearly fills the width" rule holds on every machine.
  const mastheadSpan = Math.round(width * 0.88);
  const mastheadText = (fill, extra = '') => `
    <text x="${width / 2}" y="${mastheadBaseline}" text-anchor="middle"
          font-family="${SERIF}" font-size="${mastheadSize}" font-weight="900"
          letter-spacing="${-mastheadSize * 0.012}" fill="${fill}" paint-order="stroke" stroke="${backdrop}" stroke-opacity="0.55" stroke-width="${Math.max(2, width * 0.006)}" stroke-linejoin="round"
          textLength="${mastheadSpan}" lengthAdjust="spacingAndGlyphs" ${extra}>${escapeXml(MASTHEAD_TEXT)}</text>
  `;

  const masthead = showText ? `<g class="vc-masthead">${mastheadText('#FCF9F2')}</g>` : '';

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
  // The hero is the issue's own name. Names run long ("February Grammar & High Frequency
  // Verbs") and translations run longer still (Greek is 51 characters), so a single line
  // forces the type below the cover lines and inverts the hierarchy. The hero therefore
  // wraps, inside a foreignObject so the browser re-flows it for each language: shell.js
  // swaps textContent on the data-i18n element, and an HTML block re-wraps by itself,
  // whereas stacked <tspan> lines would keep their built language.
  const heroText = (issue && issue.hero) || title;
  const heroVariants = fitOf('hero', heroText);
  const heroMeasure = width * 0.90;
  const heroBoxH = height * 0.17;
  // Start from the single-line display size and shrink only until the longest translation
  // wraps inside the box. Short names stay large; long ones give up a few points, never
  // their hierarchy over the cover lines.
  // The 8px reserve absorbs line-height rounding, so descenders are never clipped.
  const heroLineHeight = 1.08;
  const heroReserve = 8;
  let heroSize = Math.round(width * 0.078);
  const heroFloor = Math.round(width * 0.024);
  const estimateLines = (t, size) => Math.max(1, Math.ceil(estimateWidth(t, size) / heroMeasure));
  while (heroSize > heroFloor) {
    const tallest = Math.max(...heroVariants.map((t) => estimateLines(t, heroSize) * heroSize * heroLineHeight));
    if (tallest <= heroBoxH - heroReserve) break;
    heroSize -= 1;
  }
  const heroBottom = height - height * 0.055;
  const heroTop = heroBottom - heroBoxH;

  const hero = showText ? `
    <g class="vc-hero">
      <foreignObject x="${width * 0.05}" y="${heroTop}" width="${heroMeasure}" height="${heroBoxH}">
        <div xmlns="http://www.w3.org/1999/xhtml" class="vc-hero-text"${heroI18nKey ? ` data-i18n="${escapeXml(heroI18nKey)}"` : ''}
             style="display:flex;align-items:flex-end;justify-content:center;box-sizing:border-box;height:100%;margin:0;padding:0 0 ${Math.round(heroBoxH * 0.04)}px;text-align:center;font-family:${SERIF};font-weight:700;font-size:${heroSize}px;line-height:${heroLineHeight};color:#FCF9F2;text-shadow:0 0 5px ${backdrop},0 0 5px ${backdrop},0 0 3px ${backdrop};">${escapeXml(heroText)}</div>
      </foreignObject>
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
          fill-opacity="0.95" paint-order="stroke" stroke="${backdrop}" stroke-opacity="0.55" stroke-width="${Math.max(2, width * 0.006)}" stroke-linejoin="round"${i18nBase ? ` data-i18n="${escapeXml(i18nBase)}.tag"` : ''}>${escapeXml(String(tag).toUpperCase())}</text>
  ` : '';

  const grainId = `vc-${uid}-grain`;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%"
         preserveAspectRatio="xMidYMid slice" class="cosy-issue-cover"
         data-issue="${escapeXml(number)}" data-vogue-cover="true" role="img"
         aria-label="${escapeXml(`${title} — ${number} cover`)}">
      <defs>
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

      ${subject}
      ${masthead}
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
