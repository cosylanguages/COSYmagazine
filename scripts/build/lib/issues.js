/**
 * scripts/build/lib/issues.js
 * Issue identity: canonical volume numbers, editorial metadata, and the notebook
 * look an article gets.
 *
 * ISSUE_META is the single source the newsstand, the catalog and issues.html read.
 * Adding a volume means adding an entry here.
 */

const { tStrict } = require('./i18n.js');

const MONTH_INDEX = {
  january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
  july: '07', august: '08', september: '09', october: '10', november: '11', december: '12'
};

// Editorial identity of each monthly volume, keyed by the canonical "YYYY.MM".
const ISSUE_META = {
  '2026.08': {
    tag: 'Back to School Issue',
    month: 'August',
    anchor: 'august',
    vibe: 'Foundations, beginnings, pedagogy & early acquisition. Overcoming intimidation, unlearning school trauma, and speaking from lesson one.'
  },
  '2026.09': {
    tag: 'Autumn Breakthrough Issue',
    month: 'September',
    anchor: 'september',
    vibe: 'The B1-B2 intermediate plateau, persistence, phrase upgrades, stronger adjectives and precise conversational nuance.'
  },
  '2026.10': {
    tag: "Founder's Edition",
    month: 'October',
    anchor: 'october',
    vibe: 'Playfulness, conversational agility, overcoming freezing, and celebrating messy spoken drafts without self-censorship.'
  },
  '2026.11': {
    tag: 'Cognitive Immersion Issue',
    month: 'November',
    anchor: 'november',
    vibe: 'Cognitive linguistics, neuroplasticity, creative storytelling, tense timelines and exploring how languages rewire the brain.'
  },
  '2026.12': {
    tag: 'Winter Solstice Issue',
    month: 'December',
    anchor: 'december',
    vibe: 'Winter solstice warmth, seasonal rhythms, phrasal verb logic, tea rituals and peaceful introspective living.'
  },
  '2027.02': {
    tag: 'Romance & Nuance Issue',
    month: 'February',
    anchor: 'february',
    vibe: 'Human connection, romance, emotional vulnerability, financial negotiation and the subtle spectrum of affection.'
  }
};

// Normalises issue numbers written as free text ("Vol. 2026 — December Issue")
// to the canonical "Vol. 2026.12" form used across the site.
function normalizeIssueNumber(number) {
  const n = String(number || '');
  const explicit = n.match(/(\d{4})\.(\d{2})/);
  if (explicit) return `Vol. ${explicit[1]}.${explicit[2]}`;
  const yearMonth = n.match(/(\d{4})\s*[—–-]\s*([A-Za-z]+)/);
  if (yearMonth && MONTH_INDEX[yearMonth[2].toLowerCase()]) {
    return `Vol. ${yearMonth[1]}.${MONTH_INDEX[yearMonth[2].toLowerCase()]}`;
  }
  return n;
}

function issueMetaFor(canonicalNumber) {
  const m = String(canonicalNumber || '').match(/(\d{4})\.(\d{2})/);
  if (m && ISSUE_META[`${m[1]}.${m[2]}`]) {
    return ISSUE_META[`${m[1]}.${m[2]}`];
  }
  const monthName = m
    ? Object.keys(MONTH_INDEX).find((k) => MONTH_INDEX[k] === m[2])
    : null;
  return {
    tag: 'Special Issue',
    month: monthName ? monthName.charAt(0).toUpperCase() + monthName.slice(1) : '',
    anchor: 'blueprint',
    vibe: ''
  };
}

// Human, localized label for the volume shown in the masthead/folio.
// Monthly volumes collapse to "Vol. 2026.12" (no language-specific words); special
// editions use their translated name so no English leaks onto non-English pages.
function issueVolumeLabel(post, langDict, lang) {
  const raw = String(post.issue?.number || '');
  if (!raw) return '';
  const m = raw.match(/(\d{4})\.(\d{2})/);
  if (m) return `Vol. ${m[1]}.${m[2]}`;
  if (/podcast special/i.test(raw)) return tStrict(langDict, 'desk.the_podcast', lang);
  return raw;
}

// Which notebook look an article gets (see css/notebook.css)
function issueKey(post) {
  const n = String(post.issue?.number || '');
  if (post.desk === 'Saturday Mistakes') return 'sat';
  if (/2026\.08|August/.test(n)) return 'aug';
  if (/2026\.09|September/.test(n)) return 'sep';
  if (/2026\.10|October/.test(n)) return 'oct';
  if (/2026\.11|November/.test(n)) return 'nov';
  if (/2026\.12|December/.test(n)) return 'dec';
  if (/February|2027\.02/.test(n)) return 'feb';
  return 'other';
}

module.exports = {
  MONTH_INDEX,
  ISSUE_META,
  normalizeIssueNumber,
  issueMetaFor,
  issueVolumeLabel,
  issueKey
};
