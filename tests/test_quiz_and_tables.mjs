import fs from 'fs';
import assert from 'assert';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { initQuizzes } = require('../js/quiz.js');

console.log('Running quiz and table tests...');

// ---- 1. Quiz behaviour (real js/quiz.js against a minimal DOM stand-in) ----
class El {
  constructor(attrs = {}, children = {}) {
    this.attrs = attrs; this.children = children; this.listeners = {}; this.hidden = false; this.disabled = false;
    this.textContent = ''; this._classes = new Set();
    this.classList = { add: (c) => this._classes.add(c), contains: (c) => this._classes.has(c) };
  }
  getAttribute(n) { return this.attrs[n]; }
  addEventListener(t, fn) { this.listeners[t] = fn; }
  click() { if (this.listeners.click) this.listeners.click(); }
  querySelector(sel) { return this.children[sel] || null; }
}
const mk = (correct) => new El({ 'data-correct': String(correct) }, { '.quiz-mark': new El() });
const wrong = mk(false), right = mk(true), wrong2 = mk(false);
const explanation = new El(), feedback = new El();
const card = new El({}, { '.quiz-explanation': explanation, '.quiz-feedback': feedback });
card.querySelectorAll = () => [wrong, right, wrong2];
initQuizzes({ querySelectorAll: () => [card] });

assert.ok(card.classList.contains('quiz-ready'));
assert.strictEqual(explanation.hidden, true, 'explanation hidden before answering');
assert.strictEqual(right.querySelector('.quiz-mark').textContent, '\u26AA', 'correct answer not revealed before answering');
wrong.click();
assert.ok(wrong.classList.contains('is-wrong') && wrong.disabled);
assert.strictEqual(wrong.querySelector('.quiz-mark').textContent, '\u274C');
assert.strictEqual(explanation.hidden, true, 'explanation stays hidden after a wrong answer');
assert.ok(/try again/i.test(feedback.textContent));
right.click();
assert.ok(right.classList.contains('is-correct'));
assert.strictEqual(right.querySelector('.quiz-mark').textContent, '\u2705');
assert.strictEqual(explanation.hidden, false, 'explanation shown after the correct answer');
assert.ok([wrong, right, wrong2].every((b) => b.disabled), 'all options locked after finishing');
assert.strictEqual(feedback.textContent, 'Correct!');
wrong2.click();
assert.ok(!wrong2.classList.contains('is-wrong'), 'no changes after finishing');
console.log('OK: quiz hides answers, allows retry, reveals the explanation on success');

// ---- 2. Generated pages ----
const page = fs.readFileSync('demystifying-english-tenses-timeline-guide.html', 'utf8');
assert.strictEqual((page.match(/class="gazette-quiz-card"/g) || []).length, 7);
assert.strictEqual((page.match(/data-correct="true"/g) || []).length, 7, 'exactly one correct option per quiz');
assert.ok(page.includes('src="js/quiz.js"'), 'quiz script is loaded');
assert.ok(!/<h4 class="quiz-question"/.test(page), 'quiz questions are not headings');
assert.ok(page.includes('<table class="gazette-editorial-table">'), 'tenses guide uses real data tables');
assert.ok(page.includes('<th scope="col">') && page.includes('<caption>'), 'tables have column scopes and captions');
assert.strictEqual((page.match(/role="img" aria-label="Timeline for /g) || []).length, 12, 'a labelled timeline for each of the 12 forms');
console.log('OK: generated pages');
