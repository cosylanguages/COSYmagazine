/**
 * js/issue-studio.js
 * Issue assembly for the magazine studio: what an issue contains, in what
 * order, and whether it is ready to go to press. Pure logic, no DOM, so the
 * same rules run in the browser and in tests.
 *
 * Rules come from docs/MAGAZINE_ISSUE_STRUCTURE.md ("Current Editorial Model").
 */
(function (root, factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory(require('./studio-core.js'));
  } else {
    root.CosyIssueStudio = factory(root.CosyStudioCore);
  }
})(typeof self !== 'undefined' ? self : this, function (Core) {
  'use strict';

  /** Sections every issue must carry. The rest are optional per the issue's promise. */
  const REQUIRED_SECTIONS = [
    'front_cover',
    'editor_letter',
    'founder_dispatch',
    'wonder_column',
    'founder_interview',
    'thematic_crossword'
  ];

  /** Words & Creativity: exactly one of these per issue. */
  const WORDS_FORMATS = ['stop_translating', 'go_creative', 'go_diverse'];

  /** Canonical running order. Sections not listed sort after, in the order given. */
  const SECTION_ORDER = [
    'front_cover', 'editor_letter', 'founder_dispatch', 'wonder_column',
    'founder_interview', 'student_teacher_spotlight', 'debatable_relatable',
    'words_desk', 'science_expander', 'mind_matters', 'life_with_without',
    'if_you_were', 'grammar_made_cosy', 'greatest_quotes', 'culinary_salon',
    'cultural_salon', 'thematic_crossword'
  ];

  function filled(v) { return typeof v === 'string' && v.trim() !== ''; }

  /** "Vol. 2026.08" -> "vol-2026-08". Matches the id the PDF uploader writes. */
  function issueIdFromVolume(volume) {
    return String(volume || '').toLowerCase()
      .replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }

  /** Validate the issue record itself (not its articles). */
  function validateIssue(issue) {
    const errors = [];
    if (!issue || typeof issue !== 'object') return ['No issue.'];
    if (!filled(issue.number)) errors.push('Volume number is required.');
    else if (!/^Vol\.\s\d{4}\.\d{2}$/.test(issue.number.trim())) {
      errors.push('Volume must look like "Vol. 2026.08".');
    }
    if (!filled(issue.title)) errors.push('Title is required.');
    if (issue.date && !/^\d{4}-\d{2}-\d{2}$/.test(issue.date)) errors.push('Date must be YYYY-MM-DD.');
    return errors;
  }

  /** Posts belonging to an issue, matched on volume number. */
  function articlesOf(issue, posts) {
    const num = filled(issue && issue.number) ? issue.number.trim().toLowerCase() : '';
    if (!num) return [];
    return (posts || []).filter(function (p) {
      const vol = String((p && (p.issue_volume || (p.issue && p.issue.number))) || '').trim().toLowerCase();
      return vol === num;
    });
  }

  function sectionOf(post) {
    return (post && post.section) || '';
  }

  /** Sort articles into the canonical running order; `pageOrder` (print.order) wins when set. */
  function orderArticles(articles) {
    const rank = function (p) {
      const explicit = p && p.print && typeof p.print.order === 'number' ? p.print.order : null;
      if (explicit !== null) return explicit;
      const i = SECTION_ORDER.indexOf(sectionOf(p));
      return i === -1 ? 1000 : 100 + i;
    };
    return (articles || []).slice().sort(function (a, b) {
      const d = rank(a) - rank(b);
      return d !== 0 ? d : String(a.slug || '').localeCompare(String(b.slug || ''));
    });
  }

  /**
   * Which sections the issue has and which it lacks.
   * `posts` need full section data (the loaded posts, not the slim index).
   */
  function sectionCoverage(articles) {
    const present = {};
    (articles || []).forEach(function (a) { const s = sectionOf(a); if (s) present[s] = (present[s] || 0) + 1; });
    return {
      present: present,
      missing: REQUIRED_SECTIONS.filter(function (s) { return !present[s]; })
    };
  }

  /** Count how many Words & Creativity formats the issue uses. */
  function wordsFormatsUsed(articles) {
    const used = [];
    (articles || []).forEach(function (a) {
      const tags = Array.isArray(a && a.tags) ? a.tags : [];
      const hay = [sectionOf(a), String((a && a.slug) || ''), tags.join(' ')].join(' ').toLowerCase().replace(/[\s-]+/g, '_');
      WORDS_FORMATS.forEach(function (f) { if (hay.indexOf(f) !== -1 && used.indexOf(f) === -1) used.push(f); });
    });
    return used;
  }

  /**
   * Readiness of a whole issue. `articles` are full posts of this issue.
   * Same check shape as the article readiness, so one publish dialog serves both.
   */
  function getIssueReadiness(issue, articles) {
    const checks = [];
    const add = function (id, level, label, detail) { checks.push(Core.makeCheck(id, level, label, detail)); };

    const issueErrors = validateIssue(issue);
    add('issue', issueErrors.length ? 'error' : 'ok', 'Issue details', issueErrors.join(' '));

    const list = articles || [];
    add('articles', list.length ? 'ok' : 'error', 'Articles',
      list.length ? list.length + ' in this issue' : 'No articles are assigned to this issue yet.');

    const cover = sectionCoverage(list);
    add('sections', cover.missing.length ? 'warn' : 'ok', 'Required sections',
      cover.missing.length ? 'Missing: ' + cover.missing.join(', ') + '.' : 'All required sections present.');

    const formats = wordsFormatsUsed(list);
    if (formats.length > 1) {
      add('words-exclusive', 'error', 'Words & Creativity',
        'Exactly one format per issue; found ' + formats.join(', ') + '.');
    } else {
      add('words-exclusive', 'ok', 'Words & Creativity', formats.length ? formats[0] : 'No Words format yet.');
    }

    const unpublished = list.filter(function (a) { return a.status && a.status !== 'published' && a.draft !== false; });
    add('unpublished', unpublished.length ? 'warn' : 'ok', 'Article status',
      unpublished.length ? unpublished.length + ' article(s) not yet published.' : 'All articles published.');

    const consentOpen = list.filter(function (a) {
      const w = a && a.workflow;
      return w && w.featuresRealPerson && !(w.ledger && w.ledger.consentOnFile === 'done');
    });
    add('consent', consentOpen.length ? 'error' : 'ok', 'Consent on file',
      consentOpen.length
        ? 'Real people named without consent recorded in: ' + consentOpen.map(function (a) { return a.slug; }).join(', ') + '.'
        : 'No open consent items.');

    return checks;
  }

  return {
    REQUIRED_SECTIONS: REQUIRED_SECTIONS,
    WORDS_FORMATS: WORDS_FORMATS,
    SECTION_ORDER: SECTION_ORDER,
    issueIdFromVolume: issueIdFromVolume,
    validateIssue: validateIssue,
    articlesOf: articlesOf,
    orderArticles: orderArticles,
    sectionCoverage: sectionCoverage,
    wordsFormatsUsed: wordsFormatsUsed,
    getIssueReadiness: getIssueReadiness
  };
});
