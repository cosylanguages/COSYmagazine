/**
 * scripts/build/lib/catalog.js
 * Builds the two generated mirrors of posts/*.json:
 *
 *   posts.json  flat catalog consumed by js/editor.js
 *   index.json  newsstand feed consumed by index.html
 *
 * Both are derived data. posts/*.json stays the source of truth.
 */

const DESKS_CATALOG = [
  { key: 'Front Page', i18n_key: 'desk_front_page', icon: '📰', order: 1 },
  { key: 'Saturday Mistakes', i18n_key: 'desk_saturday_mistakes', icon: '🗓️', order: 2 },
  { key: 'COSYtalks', i18n_key: 'desk_cosytalks', icon: '🎙️', order: 3 },
  { key: 'Grammar', i18n_key: 'desk_grammar', icon: '📐', order: 4 },
  { key: 'Words', i18n_key: 'desk_words', icon: '🔤', order: 5 },
  { key: 'Grammar Made Cosy', i18n_key: 'desk_grammar_made_cosy', icon: '📐', order: 6 },
  { key: 'Say It', i18n_key: 'desk_say_it', icon: '🗣️', order: 7 },
  { key: 'Culture & Quotes', i18n_key: 'desk_culture_quotes', icon: '🎭', order: 8 },
  { key: 'Long Reads', i18n_key: 'desk_long_reads', icon: '📖', order: 9 },
  { key: 'Cosy Events', i18n_key: 'desk_cosy_events', icon: '🎉', order: 10 },
  { key: 'The Podcast', i18n_key: 'desk_the_podcast', icon: '🎙️', order: 11 },
  { key: 'Back Issues', i18n_key: 'desk_back_issues', icon: '🗄️', order: 12 },
  { key: 'Reflections', i18n_key: 'desk_reflections', icon: '💭', order: 13 }
];

const DESK_KEY_MAP = {
  'Front Page': 'front_page',
  'Saturday Mistakes': 'saturday_mistakes',
  'COSYtalks': 'cosytalks',
  'Grammar': 'grammar',
  'Words': 'words',
  'Grammar Made Cosy': 'grammar_made_cosy',
  'Say It': 'say_it',
  'Culture & Quotes': 'culture_quotes',
  'Long Reads': 'long_reads',
  'Cosy Events': 'cosy_events',
  'The Podcast': 'the_podcast',
  'Back Issues': 'back_issues',
  'Reflections': 'reflections'
};

// Only posts with a real player keep `podcast`, so the Podcast page lists real episodes only.
function stripUnplayablePodcast(post, hasPlayer) {
  if (post.podcast && !hasPlayer(post)) delete post.podcast;
  return post;
}

function buildPostsCatalog(publishedPosts, guides, hasPlayer) {
  const list = [
    ...publishedPosts.map((p) => ({
      slug: p.slug,
      title: p.title,
      date: p.date,
      updated: p.updated || null,
      category: p.desk || 'Words',
      summary: p.dek || '',
      author: 'JY DM',
      reading_time: p.readingTime || 5,
      cover_image: p.artDirection?.coverOverride || '',
      tags: p.tags || [],
      featured: Boolean(p.featured),
      type: 'post',
      url: `${p.slug}.html`,
      issue_volume: p.issue?.number || '',
      issue_title: p.issue?.title || 'COSY Editorial',
      content_type: p.contentType || (p.issue ? 'issue-article' : 'evergreen'),
      cefr_level: p.level || 'A0\u2013B2',
      vibe: 'Editorial Vibe',
      founder_notes: `Target-language guidance by JY DM for COSYmagazine ${p.issue?.title || 'COSY Editorial'} edition.`,
      audio_podcast: hasPlayer(p),
      artDirection: p.artDirection
    })),
    ...guides.map((g) => ({
      slug: g.slug,
      title: g.title,
      date: g.date,
      updated: g.updated || null,
      category: g.category || 'Resource List',
      summary: g.summary,
      author: g.author || 'JY DM',
      reading_time: g.reading_time || 10,
      cover_image: g.cover_image || '',
      tags: g.tags || [],
      featured: Boolean(g.featured),
      type: 'guide',
      url: g.url || `${g.slug}.html`,
      issue_volume: g.issue_volume || 'Vol. 2026 \u2014 August Issue',
      issue_title: g.issue_title || 'Get ready for school',
      cefr_level: g.cefr_level || 'A0\u2013A1 / A2',
      vibe: g.vibe || 'Curriculum Vibe',
      founder_notes: g.founder_notes || 'A0\u2013A1 / A2 target-language guidance by JY DM for COSYmagazine Get ready for school edition.',
      audio_podcast: Boolean(g.audio_podcast !== false)
    }))
  ];

  list.sort((a, b) => {
    const dA = new Date(a.date).getTime() || 0;
    const dB = new Date(b.date).getTime() || 0;
    return dB - dA;
  });
  return list;
}

function guidesAsIndexPosts(guides) {
  return guides.map((g) => ({
    id: `guide-${g.slug}`,
    slug: g.slug,
    language: 'en',
    desk: 'Long Reads',
    format: 'essay',
    level: g.cefr_level || 'A0\u2013A1 / A2',
    issue: {
      number: (g.issue_volume && g.issue_volume.includes('August')) ? 'Vol. 2026.08' : (g.issue_volume || 'Vol. 2026.08'),
      title: g.issue_title || 'Get ready for school'
    },
    date: g.date || '2026-08-01',
    title: g.title,
    kicker: 'GUIDE',
    dek: g.summary || '',
    tags: g.tags || [],
    readingTime: g.reading_time || 10,
    podcast: { episode: 1, audioUrl: null },
    artDirection: {
      palette: ['#0d9488', '#faf7f2', '#1e293b'],
      fonts: { display: 'Fraunces', text: 'DM Sans', accent: 'Fraunces Italic' },
      layout: 'magazine-spread',
      motif: 'editorial-stars',
      seed: g.slug,
      coverOverride: g.cover_image || null
    },
    blocks: [
      {
        type: 'paragraph',
        text: g.summary || g.title
      }
    ]
  }));
}

function buildIndexFeed({ publishedPosts, guides, issues, hasPlayer }) {
  const indexPostsList = [
    ...publishedPosts,
    ...guidesAsIndexPosts(guides)
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Sorted so the feed does not depend on which post filename the loader met first:
  // adding a source would otherwise reshuffle this list. Podcast specials go last,
  // matching the ordering the issues catalog uses.
  const issuesList = Array.from(issues.values()).sort((a, b) => {
    const isPodcast = (n) => n === 'Podcast Special';
    if (isPodcast(a.number)) return 1;
    if (isPodcast(b.number)) return -1;
    return b.number.localeCompare(a.number);
  });

  return {
    version: '2.0.0',
    generatedAt: new Date().toISOString(),
    stats: {
      totalPosts: indexPostsList.length,
      totalDesks: DESKS_CATALOG.length,
      totalIssues: issuesList.length
    },
    desks: DESKS_CATALOG,
    issues: issuesList,
    posts: indexPostsList.map(({ blocks, ...meta }) => stripUnplayablePodcast(meta, hasPlayer))
  };
}

module.exports = {
  DESKS_CATALOG,
  DESK_KEY_MAP,
  buildPostsCatalog,
  buildIndexFeed
};
