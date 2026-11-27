/**
 * The per-article language switcher.
 *
 * A hub and its same-language translation are one article (for example
 * `top-10-verbs` and `top-10-verbs-en`). Show one pill per language. Keep the
 * current article active when it is in the family; otherwise prefer the hub
 * over a twin.
 */
const { escapeHtml } = require('./text.js');

const LANG_FLAG_MAP = {
  en: '🇬🇧',
  fr: '🇫🇷',
  it: '🇮🇹',
  ru: '🇷🇺',
  el: '🇬🇷',
  es: '🇪🇸',
  de: '🇩🇪',
  pt: '🇵🇹',
  hy: '🇦🇲',
  ka: '🇬🇪',
  tt: '🌐',
  ba: '🌐',
  br: '🌐',
  cv: '🌐'
};

function uniqueLanguageVariants(variants, currentSlug = '') {
  const byLanguage = new Map();
  for (const variant of variants) {
    const current = byLanguage.get(variant.language);
    if (!current) {
      byLanguage.set(variant.language, variant);
      continue;
    }
    if (variant.slug === currentSlug) {
      byLanguage.set(variant.language, variant);
      continue;
    }
    if (current.slug === currentSlug) continue;
    if (!variant.translationOf && current.translationOf) {
      byLanguage.set(variant.language, variant);
    }
  }
  return [...byLanguage.values()].sort((a, b) => a.language.localeCompare(b.language));
}

function baseSlugFor(post) {
  return post.translationOf || post.slug.replace(/-(fr|it|ru|el|tt|ba|br|pt|es|de|hy|ka|cv|en)$/, '');
}

function renderLanguageSwitcherHtml(currentPost, allPosts, langDict) {
  const baseSlug = baseSlugFor(currentPost);
  const variants = uniqueLanguageVariants(
    allPosts.filter((post) => post.slug === baseSlug || post.translationOf === baseSlug),
    currentPost.slug
  );

  if (variants.length <= 1) return '';

  const linksHtml = variants.map((variant) => {
    const flag = LANG_FLAG_MAP[variant.language] || '🌐';
    const langCode = variant.language.toUpperCase();
    if (variant.slug === currentPost.slug) {
      return `<span class="lang-switcher-active">${flag} ${langCode}</span>`;
    }
    return `<a href="${variant.slug}.html" class="lang-switcher-link">${flag} ${langCode}</a>`;
  }).join(' ');

  const readInLabel = (langDict && langDict.blog && langDict.blog.read_in) ? langDict.blog.read_in : 'Read in';

  return `
<div class="language-switcher-bar">
  <span class="lang-switcher-label" data-i18n="blog.read_in">${escapeHtml(readInLabel)}</span>
  ${linksHtml}
</div>`;
}

module.exports = { LANG_FLAG_MAP, uniqueLanguageVariants, baseSlugFor, renderLanguageSwitcherHtml };
