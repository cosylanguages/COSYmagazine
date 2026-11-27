/**
 * COSYmagazine three-act pacing model (js/pacing.js)
 *
 * A magazine is not a list of articles, it is a sequence with a rhythm: quick
 * pieces at the front, one uninterrupted long read in the middle, a reflective
 * closer at the back. This module names those three zones and works out which
 * zone an article belongs to, so the build can group the contents page, and the
 * Studio can report where an issue has no rhythm at all.
 *
 * Zone comes from editorial intent first (the `zone` field, then `section`) and
 * from length second, because a 5,000-word "Words Desk" list is still a Well
 * piece even though the desk says vocabulary.
 *
 * Works in the browser (window.CosyPacing) and in Node (require).
 * See docs/reference/PACING.md.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CosyPacing = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /** The three zones, in the order they print. */
  const ZONES = Object.freeze(['fob', 'well', 'bob']);

  /** Word-count thresholds, taken from the editorial brief. */
  const LIMITS = Object.freeze({
    fobMaxWords: 600,      // Front of Book: 150-600 words
    wellMinWords: 2500,    // The Well: 2,500-6,000+ words
    longReadWords: 2500    // at or above this, an article gets long-read treatment
  });

  /**
   * Sections that are Front of Book by intent: fast, short, visual, at the front.
   * Anything the brief calls "quick grids", "one-page interviews" or "street radar".
   */
  const FOB_SECTIONS = new Set([
    'front_cover', 'editor_letter', 'founder_dispatch', 'debatable_relatable',
    'if_you_were', 'greatest_quotes', 'community_challenge', 'wonder_column',
    'idiom_detective', 'cosy_sightings'
  ]);

  /**
   * Sections that are the Well by intent: the immersive cultural core.
   */
  const WELL_SECTIONS = new Set([
    'founder_interview', 'student_teacher_spotlight', 'in_conversation',
    'words_desk', 'grammar_made_cosy', 'grammar', 'science_expander', 'science',
    'philosophy', 'mind_matters', 'cultural_salon', 'culture', 'culinary_salon',
    'recipes', 'fiction', 'poetry', 'wonder_contest_showcase'
  ]);

  /**
   * Sections that are Back of Book by intent: the reflective closer.
   */
  const BOB_SECTIONS = new Set([
    'life_with_without', 'the_last_word', 'lost_in_translation', 'essay',
    'archive', 'horoscope'
  ]);

  const ZONE_LABELS = Object.freeze({
    fob: 'Front of Book',
    well: 'The Well',
    bob: 'Back of Book'
  });

  /** Words that print for one post. Delegates to print-spec when it is loaded. */
  function wordsFor(post, printSpec) {
    const spec = printSpec || (typeof require === 'function' ? tryRequirePrintSpec() : null);
    if (spec && typeof spec.blockWords === 'function') {
      return ((post && post.blocks) || []).reduce((sum, block) => sum + spec.blockWords(block), 0);
    }
    return String(JSON.stringify((post && post.blocks) || []))
      .replace(/<[^>]+>/g, ' ')
      .split(/\s+/)
      .filter(Boolean).length;
  }

  function tryRequirePrintSpec() {
    try {
      return require('./print-spec.js');
    } catch (error) {
      return null;
    }
  }

  /**
   * Which zone does this article belong to?
   *
   * Order of authority:
   *   1. an explicit `zone` field (an editor overriding the guess)
   *   2. the section, because a section is a promise to the reader
   *   3. length, so a long piece never sits in Front of Book
   */
  function zoneFor(post, options) {
    const opts = options || {};
    const words = typeof opts.words === 'number' ? opts.words : wordsFor(post, opts.printSpec);

    const explicit = String((post && post.zone) || '').toLowerCase();
    if (ZONES.includes(explicit)) return explicit;

    const section = String((post && post.section) || '').toLowerCase();
    if (FOB_SECTIONS.has(section) && words < LIMITS.wellMinWords) return 'fob';
    if (BOB_SECTIONS.has(section)) return 'bob';
    if (WELL_SECTIONS.has(section)) return 'well';

    if (words < LIMITS.fobMaxWords) return 'fob';
    if (words >= LIMITS.wellMinWords) return 'well';
    // Mid-length pieces with no strong section belong to the Well: they are the
    // body of the issue, and putting them at the back would promise reflection
    // the article does not deliver.
    return 'well';
  }

  /** True when the article is long enough for the Well's long-read treatment. */
  function isLongRead(post, options) {
    const opts = options || {};
    const words = typeof opts.words === 'number' ? opts.words : wordsFor(post, opts.printSpec);
    return words >= LIMITS.longReadWords;
  }

  /** Annotate one post with its pacing facts. */
  function classify(post, options) {
    const opts = options || {};
    const words = wordsFor(post, opts.printSpec);
    return {
      slug: (post && post.slug) || '',
      language: (post && post.language) || '',
      section: (post && post.section) || '',
      words,
      zone: zoneFor(post, { words, printSpec: opts.printSpec }),
      longRead: isLongRead(post, { words }),
      label: ZONE_LABELS[zoneFor(post, { words, printSpec: opts.printSpec })]
    };
  }

  /**
   * Split an edition into its three zones, keeping the caller's order inside
   * each zone. Returns zones in print order, empty zones included, so a missing
   * zone is visible rather than silently absent.
   */
  function groupByZone(posts, options) {
    const opts = options || {};
    const groups = { fob: [], well: [], bob: [] };
    (posts || []).forEach((post) => {
      const item = Object.assign({ post }, classify(post, opts));
      groups[item.zone].push(item);
    });
    return ZONES.map((zone) => ({
      zone,
      label: ZONE_LABELS[zone],
      articles: groups[zone],
      words: groups[zone].reduce((sum, item) => sum + item.words, 0)
    }));
  }

  /**
   * How well does this edition follow the three-act rhythm?
   *
   * The build cannot invent a Front of Book piece or a closing essay, so this
   * report exists to make the gap loud instead of letting a reference dump pass
   * as a magazine.
   */
  function pacingReport(posts, options) {
    const groups = groupByZone(posts, options);
    const byZone = {};
    groups.forEach((group) => { byZone[group.zone] = group; });

    const totalWords = groups.reduce((sum, group) => sum + group.words, 0);
    const longReads = groups.reduce(
      (sum, group) => sum + group.articles.filter((item) => item.longRead).length, 0
    );

    const gaps = [];
    if (!byZone.fob.articles.length) {
      gaps.push('no front-of-book piece: the issue opens straight into the body');
    }
    if (!byZone.bob.articles.length) {
      gaps.push('no back-of-book essay: the issue ends without a closing note');
    }
    if (!longReads) {
      gaps.push('no long read: nothing in the issue gets the immersive treatment');
    }
    if (byZone.fob.articles.length && byZone.fob.words / Math.max(totalWords, 1) > 0.5) {
      gaps.push('front of book carries over half the words: the fast zone is not fast');
    }

    return {
      zones: groups,
      byZone,
      totalArticles: (posts || []).length,
      totalWords,
      longReads,
      gaps,
      ok: gaps.length === 0
    };
  }

  return {
    ZONES,
    LIMITS,
    ZONE_LABELS,
    FOB_SECTIONS,
    WELL_SECTIONS,
    BOB_SECTIONS,
    wordsFor,
    zoneFor,
    isLongRead,
    classify,
    groupByZone,
    pacingReport
  };
});
