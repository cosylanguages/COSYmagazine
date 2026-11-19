/**
 * scripts/build/lib/blocks.js
 * Renders article content blocks (headings, paragraphs, lists, quotes, quiz cards)
 * to the HTML that appears inside the reading spread.
 *
 * Callers pass `{ isFirstParagraph, slug, lang }` so the same renderer can be used
 * for any post without shared mutable state.
 */

const { escapeHtml, parseFormattedText } = require('./text.js');
const { blockAudioUrl } = require('./audio.js');

// Labels for the Top 10 "full list" toolbar (languages without a native entry fall back to English)
const FULLLIST_LABELS = {
  en: { list: 'The full list', print: '🖨 Print', pdf: '📄 Save as PDF', csv: '⬇ Table (CSV)' },
  fr: { list: 'La liste complète', print: '🖨 Imprimer', pdf: '📄 Enregistrer en PDF', csv: '⬇ Tableau (CSV)' },
  it: { list: 'L’elenco completo', print: '🖨 Stampa', pdf: '📄 Salva in PDF', csv: '⬇ Tabella (CSV)' },
  ru: { list: 'Полный список', print: '🖨 Печать', pdf: '📄 Сохранить в PDF', csv: '⬇ Таблица (CSV)' },
  el: { list: 'Ολόκληρη η λίστα', print: '🖨 Εκτύπωση', pdf: '📄 Αποθήκευση σε PDF', csv: '⬇ Πίνακας (CSV)' },
  es: { list: 'La lista completa', print: '🖨 Imprimir', pdf: '📄 Guardar como PDF', csv: '⬇ Tabla (CSV)' },
  de: { list: 'Die vollständige Liste', print: '🖨 Drucken', pdf: '📄 Als PDF speichern', csv: '⬇ Tabelle (CSV)' },
  pt: { list: 'A lista completa', print: '🖨 Imprimir', pdf: '📄 Guardar como PDF', csv: '⬇ Tabela (CSV)' }
};

function renderQuizCardHtml(q) {
  const optionsHtml = (q.options || []).map((opt, i) => `
        <button type="button" class="quiz-option-btn" data-correct="${i === q.correctIndex ? 'true' : 'false'}">
          <span class="quiz-mark" aria-hidden="true">⚪</span> <span>${parseFormattedText(opt)}</span>
        </button>
      `).join('');
  return `
<div class="gazette-quiz-card" data-quiz>
  <h4 class="quiz-question">❓ ${parseFormattedText(q.question)}</h4>
  <div class="quiz-options-list" role="group">${optionsHtml}</div>
  ${q.explanation ? `<p class="quiz-explanation" hidden aria-live="polite">${parseFormattedText(q.explanation)}</p>` : ''}
</div>`;
}

function renderBlockToHtml(block, state = { isFirstParagraph: true, slug: '', lang: 'en' }) {
  if (!block || typeof block !== 'object') return '';

  // Stage-only blocks (e.g. plain headings that the rich web card already contains) are skipped on the page.
  if (block.stageOnly) return '';
  // Web-only rich rendering (diagrams, cards). `text`/`items` stay as the plain fallback for Stage & Script modes.
  if (typeof block.html === 'string' && block.html.trim()) return block.html;

  switch (block.type) {
    case 'heading': {
      const lvl = Math.min(6, Math.max(1, block.level || 2));
      return `<h${lvl} class="editorial-heading">${parseFormattedText(block.text)}</h${lvl}>`;
    }
    case 'paragraph': {
      const parsedText = parseFormattedText(block.text);
      const isBlockElement = /^\s*<(div|section|aside|blockquote|table|ul|ol|figure)/i.test(parsedText);
      if (isBlockElement) {
        return parsedText;
      }
      if (state.isFirstParagraph) {
        state.isFirstParagraph = false;
        return `<p class="gazette-drop-cap">${parsedText}</p>`;
      }
      return `<p>${parsedText}</p>`;
    }
    case 'list-item': {
      const tag = block.ordered ? 'ol' : 'ul';
      const items = block.items || [];

      // Detect if items are phrase pairs / overused phrase upgrades
      const isUpgradeList = items.some(item =>
        item.includes('Overused') ||
        item.includes('Natural Upgrades') ||
        item.includes('Замены') ||
        item.includes('Согласие') ||
        item.includes('→') ||
        item.includes('↔')
      );

      if (isUpgradeList) {
        const upgradeItemsHtml = items.map(item => {
          const parsed = parseFormattedText(item);
          return `<div class="phrase-upgrade-card">${parsed}</div>`;
        }).join('\n');
        return `<div class="phrase-upgrade-grid">${upgradeItemsHtml}</div>`;
      }

      const itemsHtml = items.map(item => `<li>${parseFormattedText(item)}</li>`).join('\n');
      return `<${tag} class="editorial-list">\n${itemsHtml}\n</${tag}>`;
    }
    case 'table': {
      const headers = block.headers || [];
      const rows = block.rows || [];

      // Printable "full list": a toolbar plus a table that the book may split over pages (they share data-list)
      if (block.printable) {
        const L = FULLLIST_LABELS[state.lang] || FULLLIST_LABELS.en;
        const listId = `${state.slug}-${escapeHtml(block.listId || 'list')}`;
        const title = escapeHtml(block.listTitle || L.list);
        const fileBase = escapeHtml(block.csvName || state.slug);
        const th = headers.map(h => `<th>${parseFormattedText(h)}</th>`).join('');
        const tr = rows.map(row => `<tr>${row.map(cell => `<td>${parseFormattedText(cell)}</td>`).join('')}</tr>`).join('\n');
        return `
<div class="fulllist-bar" data-list="${listId}" data-file="${fileBase}">
  <span class="fulllist-title">${title}</span>
  <button type="button" class="fulllist-btn" data-act="print">${L.print}</button>
  <button type="button" class="fulllist-btn" data-act="pdf">${L.pdf}</button>
  <button type="button" class="fulllist-btn" data-act="csv">${L.csv}</button>
</div>
<div class="table-responsive-container fulllist-table" data-list="${listId}">
  <table class="gazette-editorial-table">
    <thead><tr>${th}</tr></thead>
    <tbody>
${tr}
    </tbody>
  </table>
</div>`;
      }

      const headersHtml = headers.map(h => `<th>${parseFormattedText(h)}</th>`).join('');
      const rowsHtml = rows.map(row => {
        const cellsHtml = row.map(cell => `<td>${parseFormattedText(cell)}</td>`).join('');
        return `<tr>${cellsHtml}</tr>`;
      }).join('\n');

      return `
<div class="table-responsive-container">
  <table class="gazette-editorial-table">
    ${headers.length > 0 ? `<thead><tr>${headersHtml}</tr></thead>` : ''}
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>
</div>`;
    }
    case 'example': {
      return `
<div class="gazette-example-box">
  <span class="example-target">${parseFormattedText(block.targetText)}</span>
  <p class="example-gloss">${parseFormattedText(block.gloss)}</p>
  ${block.context ? `<p class="example-context">Context: ${parseFormattedText(block.context)}</p>` : ''}
</div>`;
    }
    case 'pronunciation': {
      return `
<div class="gazette-pronunciation-card">
  <span class="pronunciation-word">${parseFormattedText(block.word)}</span>
  <span class="pronunciation-ipa">[${escapeHtml(block.ipa)}]</span>
  ${blockAudioUrl(block.audioUrl) ? `<audio controls src="${escapeHtml(blockAudioUrl(block.audioUrl))}"></audio>` : ''}
</div>`;
    }
    case 'pullquote': {
      return `
<blockquote class="gazette-pullquote">
  <p>“${parseFormattedText(block.quote)}”</p>
  ${block.attribution ? `<cite>— ${escapeHtml(block.attribution)}</cite>` : ''}
</blockquote>`;
    }
    case 'image': {
      return `
<figure class="gazette-figure">
  <img src="${escapeHtml(block.url)}" alt="${escapeHtml(block.alt)}" class="gazette-figure-img">
  ${block.caption ? `<figcaption class="gazette-figure-caption">${parseFormattedText(block.caption)}</figcaption>` : ''}
</figure>`;
    }
    case 'quiz': {
      return renderQuizCardHtml(block);
    }
    case 'mistake-card': {
      // Reusable "Saturday Mistakes" card: wrong / right / why / rule / examples / interactive quiz
      const L = Object.assign({ wrong: 'Not quite', right: 'Say this', why: 'Why it happens', rule: 'The COSY rule', examples: 'More examples', turn: 'Your turn' }, block.labels || {});
      const num = block.number !== undefined && block.number !== null && block.number !== '' ? String(block.number).padStart(2, '0') : '';
      const examplesHtml = Array.isArray(block.examples) && block.examples.length
        ? `<div class="mc-more"><span class="mc-more-label">${escapeHtml(L.examples)}</span><ul>${block.examples.map((e) => `<li>${parseFormattedText(e)}</li>`).join('')}</ul></div>`
        : '';
      const quizHtml = block.quiz
        ? `<div class="mc-turn"><span class="mc-turn-label">${escapeHtml(L.turn)}</span>${renderQuizCardHtml(block.quiz)}</div>`
        : '';
      return `
<article class="mc">
  <header class="mc-head">${num ? `<span class="mc-num" aria-hidden="true">${escapeHtml(num)}</span>` : ''}<h3 class="mc-title">${parseFormattedText(block.title)}</h3></header>
  <div class="mc-compare">
    <div class="mc-side mc-wrong"><span class="mc-label"><span aria-hidden="true">✗</span> ${escapeHtml(L.wrong)}</span><p class="mc-sentence">${parseFormattedText(block.wrong)}</p></div>
    <div class="mc-side mc-right"><span class="mc-label"><span aria-hidden="true">✓</span> ${escapeHtml(L.right)}</span><p class="mc-sentence">${parseFormattedText(block.right)}</p></div>
  </div>
  ${block.why ? `<p class="mc-why"><strong>${escapeHtml(L.why)}.</strong> ${parseFormattedText(block.why)}</p>` : ''}
  <p class="mc-rule"><strong>${escapeHtml(L.rule)}.</strong> ${parseFormattedText(block.rule)}</p>
  ${examplesHtml}
  ${quizHtml}
</article>`;
    }
    case 'culture-bite': {
      return `
<aside class="gazette-marginalia">
  <div class="gazette-marginalia-title">📌 ${parseFormattedText(block.title)}</div>
  <p class="marginalia-body">${parseFormattedText(block.content)}</p>
</aside>`;
    }
    case 'quote-wall': {
      const quotesHtml = (block.quotes || []).map(q => `
        <div class="quote-tile">
          <p class="quote-tile-text">“${parseFormattedText(q.quote)}”</p>
          <div class="quote-tile-author">— ${escapeHtml(q.author)}</div>
        </div>
      `).join('');
      return `<div class="format-quote-wall">${quotesHtml}</div>`;
    }
    case 'links': {
      return `
<div class="gazette-link-block">
  <a href="${escapeHtml(block.url)}" class="read-more-link">${parseFormattedText(block.label)} ↗</a>
</div>`;
    }
    default:
      return '';
  }
}
module.exports = { renderBlockToHtml, renderQuizCardHtml, FULLLIST_LABELS };
