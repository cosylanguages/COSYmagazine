/**
 * COSYmagazine press specification (js/print-spec.js)
 *
 * One place for the numbers a printer needs and the arithmetic the Studio uses
 * to plan the paper edition: how many pages an article takes, how many pages an
 * issue needs, and which images are too small for press.
 *
 * Works in the browser (window.CosyPrintSpec) and in Node (require).
 *
 * IMPORTANT: page counts are ESTIMATES from word counts and block types. They
 * are good enough to plan an issue and to spot an article that is far too long
 * or short, not to replace a layout proof. After the first proof, set
 * `print.pages` on an article to the real number (it then wins over the
 * estimate), and tune LAYOUT below if the estimates drift.
 * See docs/PRINT_SPEC.md.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CosyPrintSpec = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /** What we ask the printer for. Confirm each line with the chosen printer. */
  const PRESS_SPEC = Object.freeze({
    name: 'COSYmagazine A4, perfect-bound',
    trimMm: Object.freeze({ width: 210, height: 297 }), // finished page size (A4)
    bleedMm: 3,            // artwork that touches the edge extends this far past the trim
    safeMarginMm: 10,      // keep text and logos at least this far inside the trim
    gutterExtraMm: 5,      // extra inner margin lost to the binding
    footerMm: 8,           // running foot / folio band inside the bottom margin
    dpi: 300,              // minimum resolution of raster images at print size
    signaturePages: 4,     // inside page count must be a multiple of 4
    efficientSignaturePages: 16, // sheetfed presses are most economical in 16s
    coverPages: 4,         // C1-C4 are printed on separate cover stock
    colorMode: 'CMYK',     // convert at export; RGB images shift colour on press
    pdfStandard: 'PDF/X-4',
    maxInkCoveragePct: 300 // total area coverage limit, a common coated-paper default
  });

  /** Typography assumptions behind the page estimates. */
  const LAYOUT = Object.freeze({
    bodyPt: 9.5,
    leadingPt: 13.5,
    columns: 2,
    columnGapMm: 5,
    avgCharWidthEm: 0.5,   // average character width as a fraction of the font size
    avgWordChars: 6.0,     // characters per word including the space
    fillEfficiency: 0.78,  // paragraph spacing, ragged lines, widows and orphans
    openerPages: 0.3,      // kicker, headline and dek at the top of an article
    paragraphGapPages: 0.006
  });

  const PT_TO_MM = 25.4 / 72;

  // Fraction of a page that each non-prose block occupies (tuned by eye; recalibrate after a proof).
  const BLOCK_PAGES = Object.freeze({
    heading: 0.035,
    pullquote: 0.12,
    image: 0.3,
    quiz: 0.2,
    'mistake-card': 0.22,
    'culture-bite': 0.18,
    example: 0.07,
    pronunciation: 0.06,
    links: 0.03,
    'list-item': 0.02,        // per item, plus its words
    table: 0.03,              // per row including the header, plus its words
    'quote-wall': 0.1,        // per quote, plus its words
    other: 0.1
  });

  // Keys that never print: spoken script, beats, URLs and bookkeeping.
  const NON_PRINT_KEYS = new Set([
    'type', 'url', 'src', 'alt', 'say', 'beat', 'medium', 'id', 'destination',
    'level', 'number', 'ordered', 'printable', 'correctIndex', 'webOnly'
  ]);

  function round(n, places) {
    const f = Math.pow(10, places == null ? 2 : places);
    return Math.round(n * f) / f;
  }

  function ceilTo(n, step) {
    return Math.ceil(n / step) * step;
  }

  function countWords(text) {
    const t = String(text || '').replace(/<[^>]*>/g, ' ').replace(/[*_`#>]/g, ' ').trim();
    return t === '' ? 0 : t.split(/\s+/).length;
  }

  /** Words that appear on paper for one block (walks nested fields, skips non-printing keys). */
  function blockWords(block) {
    let words = 0;
    (function walk(value, key) {
      if (value == null) return;
      if (typeof value === 'string') {
        if (!NON_PRINT_KEYS.has(key)) words += countWords(value);
      } else if (Array.isArray(value)) {
        value.forEach(v => walk(v, key));
      } else if (typeof value === 'object') {
        Object.keys(value).forEach(k => {
          if (!NON_PRINT_KEYS.has(k)) walk(value[k], k);
        });
      }
    })(block, '');
    return words;
  }

  /** The text frame on a page and how many words fit in it. */
  function textFrame(spec, layout) {
    const s = spec || PRESS_SPEC;
    const l = layout || LAYOUT;
    const widthMm = s.trimMm.width - 2 * s.safeMarginMm - s.gutterExtraMm;
    const heightMm = s.trimMm.height - 2 * s.safeMarginMm - s.footerMm;
    const columnMm = (widthMm - l.columnGapMm * (l.columns - 1)) / l.columns;
    const charMm = l.bodyPt * PT_TO_MM * l.avgCharWidthEm;
    const wordsPerLine = columnMm / charMm / l.avgWordChars;
    const linesPerColumn = heightMm / (l.leadingPt * PT_TO_MM);
    const wordsPerPage = l.columns * linesPerColumn * wordsPerLine * l.fillEfficiency;
    return { widthMm, heightMm, columnMm: round(columnMm, 1), wordsPerPage: Math.round(wordsPerPage) };
  }

  function wordsPerPage(spec, layout) {
    return textFrame(spec, layout).wordsPerPage;
  }

  /** Whether a block is printed in the paper edition. */
  function appearsInPrint(block) {
    return !!block && block.medium !== 'digital';
  }

  function blockPages(block, spec, layout) {
    const wpp = wordsPerPage(spec, layout);
    const words = blockWords(block);
    const textPages = words / wpp;
    switch (block.type) {
      case 'paragraph':
        return textPages + LAYOUT.paragraphGapPages;
      case 'list-item':
        return (Array.isArray(block.items) ? block.items.length : 0) * BLOCK_PAGES['list-item'] + textPages;
      case 'table':
        return ((Array.isArray(block.rows) ? block.rows.length : 0) + 1) * BLOCK_PAGES.table + textPages;
      case 'quote-wall':
        return Math.max(1, Array.isArray(block.quotes) ? block.quotes.length : 1) * BLOCK_PAGES['quote-wall'] + textPages;
      case 'image':
        return BLOCK_PAGES.image + textPages;
      default:
        return (BLOCK_PAGES[block.type] != null ? BLOCK_PAGES[block.type] : BLOCK_PAGES.other) + textPages;
    }
  }

  function isRasterUrl(url) {
    return typeof url === 'string' && /\.(jpe?g|png|webp|gif|tiff?)(?:[?#].*)?$/i.test(url);
  }

  /** Pixels needed to print `widthMm` of an image at `dpi`. */
  function requiredPixels(widthMm, dpi) {
    return Math.ceil((widthMm / 25.4) * (dpi || PRESS_SPEC.dpi));
  }

  /**
   * Raster images in the print edition. We cannot see their pixel size from a
   * URL, so each one is a "check this" item with the pixel width it needs.
   * SVG images are vector and always fine.
   */
  function rasterImageChecks(blocks, spec) {
    const s = spec || PRESS_SPEC;
    const frame = textFrame(s);
    return (blocks || [])
      .filter(b => b && b.type === 'image' && appearsInPrint(b) && isRasterUrl(b.url))
      .map(b => ({
        url: b.url,
        minPixelsFrameWidth: requiredPixels(frame.widthMm, s.dpi),
        minPixelsFullBleed: requiredPixels(s.trimMm.width + 2 * s.bleedMm, s.dpi)
      }));
  }

  /**
   * How many pages an article takes in print.
   * `print.pages` on the article overrides the estimate.
   */
  const SPREAD_OPEN = /<section\s+id="page-(\d+)"/;

  /**
   * Guides built as numbered spreads (`<section id="page-N">`) start every spread on a
   * new page, in print as on screen. Returns the pages each spread takes, or null for
   * an article without spreads.
   */
  function spreadPages(blocks, spec, layout) {
    const groups = [];
    let current = null;
    blocks.forEach(b => {
      const m = b.type === 'paragraph' && typeof b.text === 'string' ? b.text.match(SPREAD_OPEN) : null;
      if (m) {
        current = { id: Number(m[1]), exact: 0 };
        groups.push(current);
      }
      if (current) current.exact += blockPages(b, spec, layout);
      else if (groups.length === 0) { groups.lead = (groups.lead || 0) + blockPages(b, spec, layout); }
    });
    if (groups.length < 2) return null;
    const lead = groups.lead || 0;
    // text before the first spread counts on its own pages, never shared with a spread
    const spreads = groups.map(g => ({ id: g.id, exact: round(g.exact, 2), pages: Math.max(1, Math.ceil(round(g.exact, 2) - 0.0001)) }));
    return { spreads, lead: round(lead, 2), total: spreads.reduce((sum, g) => sum + g.pages, 0) };
  }

  function estimateArticlePages(post, spec, layout) {
    const blocks = ((post && post.blocks) || []).filter(appearsInPrint);
    const breakdown = blocks.map(b => ({ type: b.type, pages: round(blockPages(b, spec, layout), 3) }));
    let exact = LAYOUT.openerPages + breakdown.reduce((sum, b) => sum + b.pages, 0);
    const override = post && post.print && typeof post.print.pages === 'number' && post.print.pages > 0
      ? post.print.pages : null;
    const sp = spreadPages(blocks, spec, layout);
    let wholePages = Math.max(1, Math.ceil(round(exact, 2) - 0.0001));
    if (sp) {
      wholePages = Math.max(1, Math.ceil(round(LAYOUT.openerPages + sp.lead, 2) - 0.0001)) + sp.total;
      exact = wholePages; // each spread breaks to a new page: whole pages only
    }
    return {
      exact: round(exact, 2),
      pages: override != null ? override : wholePages,
      estimatedPages: wholePages,
      source: override != null ? 'override' : (sp ? 'spreads' : 'estimate'),
      spreads: sp ? sp.spreads : null,
      emptyOnLastPage: round(wholePages - exact, 2),
      words: blocks.reduce((sum, b) => sum + blockWords(b), 0),
      images: blocks.filter(b => b.type === 'image').length,
      printOnlyBlocks: blocks.filter(b => b.medium === 'print').length,
      digitalOnlyBlocks: ((post && post.blocks) || []).filter(b => b && b.medium === 'digital').length,
      rasterImages: rasterImageChecks(blocks, spec),
      breakdown
    };
  }

  /**
   * Page plan for an issue.
   * `articles`: [{ slug, title, pages }]. In "fresh" mode (default) every article
   * starts on a new page, so each counts as whole pages; "flow" lets articles
   * share pages and sums the exact estimates.
   * Inside pages must be a multiple of `signaturePages`; the shortfall is the
   * number of pages to fill with other content (the next-issue preview, a puzzle, an ad).
   */
  function planIssue(articles, options, spec) {
    const s = spec || PRESS_SPEC;
    const opts = options || {};
    const list = (articles || []).map(a => ({
      slug: a.slug,
      title: a.title,
      pages: typeof a.pages === 'number' && a.pages > 0 ? a.pages : 1
    }));
    const raw = list.reduce((sum, a) => sum + (opts.mode === 'flow' ? a.pages : Math.ceil(a.pages)), 0);
    const contentPages = Math.ceil(round(raw, 2) - 0.0001);
    const insidePages = Math.max(s.signaturePages, ceilTo(contentPages, s.signaturePages));
    const efficientPages = Math.max(s.efficientSignaturePages, ceilTo(contentPages, s.efficientSignaturePages));
    return {
      articles: list,
      contentPages,
      insidePages,
      fillPages: insidePages - contentPages,
      totalWithCover: insidePages + s.coverPages,
      efficientInsidePages: efficientPages,
      fillToEfficient: efficientPages - contentPages,
      signaturePages: s.signaturePages
    };
  }

  /**
   * Estimate every article of an issue and plan the pages.
   * `posts`: full post objects (with blocks). Returns { rows, plan } where each row
   * has { slug, title, words, pages, exact, source }.
   */
  const LANGUAGE_NAMES = {
    en: 'English', fr: 'French', it: 'Italian', es: 'Spanish', pt: 'Portuguese', de: 'German',
    ru: 'Russian', el: 'Greek', br: 'Breton', hy: 'Armenian', ka: 'Georgian',
    tt: 'Tatar', ba: 'Bashkir', cv: 'Chuvash'
  };

  /** A post's language; posts without one are English. */
  function postLanguage(post) {
    return (post && post.language) || 'en';
  }

  /** Languages present in a list of posts, English first, then alphabetical. */
  function languagesOf(posts) {
    const set = new Set((posts || []).map(postLanguage));
    return Array.from(set).sort((a, b) => (a === 'en' ? -1 : b === 'en' ? 1 : a.localeCompare(b)));
  }

  /**
   * One paper edition is printed in one language. With `options.language`, posts in
   * other languages are left out of the page count and returned in `excluded`
   * (they stay on the website or go into that language's own edition).
   */
  function summarizeIssue(allPosts, options, spec) {
    const wanted = options && options.language;
    const posts = (allPosts || []).filter(p => !wanted || postLanguage(p) === wanted);
    const excluded = wanted
      ? (allPosts || []).filter(p => postLanguage(p) !== wanted).map(p => ({ slug: p.slug, title: p.title, language: postLanguage(p) }))
      : [];
    const rows = (posts || []).map(post => {
      const e = estimateArticlePages(post, spec);
      return {
        slug: post.slug,
        title: post.title,
        words: e.words,
        pages: e.pages,
        exact: e.exact,
        source: e.source,
        spreads: e.spreads ? e.spreads.length : 0
      };
    });
    const opts = options || {};
    const plan = planIssue(
      rows.map(r => ({ slug: r.slug, title: r.title, pages: opts.mode === 'flow' ? (r.source === 'override' ? r.pages : r.exact) : r.pages })),
      opts,
      spec
    );
    return { rows, plan, excluded };
  }

  /** Rows for the Studio and docs: what we send the printer. */
  function describePressSpec(spec) {
    const s = spec || PRESS_SPEC;
    const frame = textFrame(s);
    return [
      ['Trim size', `${s.trimMm.width} × ${s.trimMm.height} mm (A4)`],
      ['Bleed', `${s.bleedMm} mm on every side (${s.trimMm.width + 2 * s.bleedMm} × ${s.trimMm.height + 2 * s.bleedMm} mm artwork)`],
      ['Safe margin', `${s.safeMarginMm} mm inside the trim, plus ${s.gutterExtraMm} mm at the binding`],
      ['Text area', `${frame.widthMm} × ${frame.heightMm} mm, ${LAYOUT.columns} columns of ${frame.columnMm} mm`],
      ['Images', `${s.dpi} dpi or more at print size (vector SVG is fine)`],
      ['Colour', `${s.colorMode}, total ink at most ${s.maxInkCoveragePct}%`],
      ['File', `${s.pdfStandard} PDF with fonts embedded`],
      ['Page count', `Inside pages in multiples of ${s.signaturePages} (${s.efficientSignaturePages} is most economical), plus ${s.coverPages} cover pages`]
    ];
  }

  return {
    PRESS_SPEC,
    LAYOUT,
    BLOCK_PAGES,
    countWords,
    blockWords,
    textFrame,
    wordsPerPage,
    appearsInPrint,
    blockPages,
    isRasterUrl,
    requiredPixels,
    rasterImageChecks,
    estimateArticlePages,
    spreadPages,
    spreadPages,
    planIssue,
    summarizeIssue,
    postLanguage,
    languagesOf,
    LANGUAGE_NAMES,
    describePressSpec
  };
});
