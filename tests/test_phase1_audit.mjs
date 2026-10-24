import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('Running Blog Build Phase 1 Audit Automated Tests...');

// 1. Test top-5-favourite-grammar-rules HTML for missing audio players
const grammarRulesHtmlPath = path.resolve('top-5-favourite-grammar-rules.html');
assert.ok(fs.existsSync(grammarRulesHtmlPath), 'top-5-favourite-grammar-rules.html should exist');
const grammarRulesHtml = fs.readFileSync(grammarRulesHtmlPath, 'utf8');

assert.strictEqual(
  grammarRulesHtml.includes('src="audio/top-5-favourite-grammar-rules-page-'),
  false,
  'top-5-favourite-grammar-rules.html should not contain broken audio player src references'
);
assert.ok(
  grammarRulesHtml.includes('Audio recording in production'),
  'top-5-favourite-grammar-rules.html should render podcast-audio-notice notice for unavailable recordings'
);
console.log('✅ Passed: top-5-favourite-grammar-rules.html has no broken audio elements.');

// 2. Test Heading Hierarchy in Generated Pages
const blogFiles = fs.readdirSync('.').filter(f => f.endsWith('.html') && !['index.html', '404.html', 'podcast.html'].includes(f));
assert.ok(blogFiles.length > 0, 'Should find blog post HTML files');

blogFiles.forEach(file => {
  const html = fs.readFileSync(file, 'utf8');

  // Verify masthead title is not an h2
  assert.strictEqual(
    html.includes('<h2 class="gazette-masthead-title">'),
    false,
    `${file} masthead title should not use <h2> before primary <h1>`
  );
  assert.ok(
    html.includes('<p class="gazette-masthead-title">COSYMAGAZINE</p>'),
    `${file} masthead title should use <p class="gazette-masthead-title">`
  );

  // Check document tree: <p class="gazette-masthead-title"> precedes <h1 class="cover-headline">
  const mastheadPos = html.indexOf('gazette-masthead-title');
  const h1Pos = html.indexOf('<h1 class="cover-headline">');
  assert.ok(h1Pos > -1, `${file} must contain <h1 class="cover-headline">`);
  assert.ok(mastheadPos < h1Pos, `${file} masthead should precede <h1> in document order`);
});
console.log(`✅ Passed: All ${blogFiles.length} generated article pages maintain a correct heading hierarchy.`);

// 3. Test Metadata HTML Entity Escaping
const adjectivesHtmlPath = path.resolve('replace-very-50-stronger-adjectives.html');
assert.ok(fs.existsSync(adjectivesHtmlPath), 'replace-very-50-stronger-adjectives.html should exist');
const adjectivesHtml = fs.readFileSync(adjectivesHtmlPath, 'utf8');

assert.strictEqual(
  adjectivesHtml.includes('&amp;#39;') || adjectivesHtml.includes('&amp;quot;'),
  false,
  'replace-very-50-stronger-adjectives.html should not double-escape HTML entities in title tag'
);
assert.ok(
  adjectivesHtml.includes('<title>Stronger Adjectives: When &quot;Very&quot; Is Not Enough'),
  'replace-very-50-stronger-adjectives.html title tag should be properly escaped once'
);
console.log('✅ Passed: replace-very-50-stronger-adjectives.html title tag correctly formatted.');

console.log('🎉 All Blog Build Phase 1 Audit tests passed successfully!');
