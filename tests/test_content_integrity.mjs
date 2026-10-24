import fs from 'fs';
import assert from 'assert';

console.log('Running content integrity tests...');
const problems = [];
for (const f of fs.readdirSync('posts').filter((x) => x.endsWith('.json'))) {
  const post = JSON.parse(fs.readFileSync(`posts/${f}`, 'utf8'));
  (post.blocks || []).forEach((b, i) => {
    const ref = `${f} block ${i}`;
    if (b.type === 'quiz') {
      if (!Array.isArray(b.options) || b.options.length < 2) problems.push(`${ref}: quiz needs at least 2 options`);
      else {
        if (!Number.isInteger(b.correctIndex) || b.correctIndex < 0 || b.correctIndex >= b.options.length) problems.push(`${ref}: correctIndex out of range`);
        if (new Set(b.options.map((o) => String(o).trim().toLowerCase())).size !== b.options.length) problems.push(`${ref}: duplicate quiz options`);
      }
    }
    if (b.type === 'table' && Array.isArray(b.rows)) {
      b.rows.forEach((r, ri) => { if (r.length !== b.headers.length) problems.push(`${ref}: row ${ri} has ${r.length} cells, expected ${b.headers.length}`); });
    }
  });
  const raw = JSON.stringify(post);
  // Mixed scripts inside a single word are almost always a typing error (e.g. Armenian letters in Georgian text)
  if (/[\u10A0-\u10FF][\u0530-\u058F]|[\u0530-\u058F][\u10A0-\u10FF]/.test(raw)) problems.push(`${f}: Armenian and Georgian letters mixed in one word`);
}
assert.deepStrictEqual(problems, [], `Content problems:\n${problems.join('\n')}`);
console.log('OK: quizzes, tables and scripts are consistent in all posts');
