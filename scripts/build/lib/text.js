/**
 * scripts/build/lib/text.js
 * Inline text formatting for rendered article blocks.
 *
 * Free-text fields in posts/*.json may contain a little inline HTML or Markdown
 * emphasis. Everything that reaches the page goes through here so escaping rules
 * stay in one place.
 */

let marked;
try {
  const markedModule = require('marked');
  marked = markedModule.marked || markedModule;
} catch (e) {
  // Without `marked`, inline HTML in paragraphs (<mark>, <span class="doodle-circle">)
  // is escaped and shows up as literal text on the page. Fail loudly rather than
  // publishing broken pages.
  console.error('❌ The "marked" package is missing. Run `npm install` before `npm run build`.');
  process.exit(1);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

function parseFormattedText(text) {
  if (!text) return '';
  if (/^\s*<[a-zA-Z][\s\S]*>/i.test(text)) {
    return text;
  }
  if (marked && typeof marked.parseInline === 'function') {
    return marked.parseInline(text);
  }
  let html = escapeHtml(text);
  html = html.replace(/&lt;code&gt;(.*?)&lt;\/code&gt;/g, '<code>$1</code>');
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');
  html = html.replace(/\\\*/g, '&#42;');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  return html;
}

// <title> is capped so long headlines are not truncated mid-word by search engines.
function getDocumentTitle(title, maxLength = 70) {
  const fullTitle = `${title} — COSYmagazine`;
  const characters = Array.from(fullTitle);
  if (characters.length <= maxLength) return fullTitle;

  const limit = maxLength - 1; // reserve the ellipsis
  const slice = characters.slice(0, limit).join('');
  const lastSpace = slice.lastIndexOf(' ');
  const stem = (lastSpace > Math.floor(limit * 0.4) ? slice.slice(0, lastSpace) : slice).trimEnd();
  return `${stem}…`;
}

function getMetaDescription(text, maxLength = 160) {
  const characters = Array.from(String(text || '').trim());
  if (characters.length <= maxLength) return characters.join('');

  const limit = maxLength - 1; // reserve the ellipsis
  const slice = characters.slice(0, limit).join('');
  const lastSpace = slice.lastIndexOf(' ');
  const stem = (lastSpace > Math.floor(limit * 0.5) ? slice.slice(0, lastSpace) : slice).trimEnd();
  return `${stem}…`;
}

module.exports = { escapeHtml, parseFormattedText, getDocumentTitle, getMetaDescription };
