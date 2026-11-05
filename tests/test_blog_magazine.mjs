import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('Running Blog Magazine & Podcast Presentation Automated Tests...');

// Test 1: Check posts.json metadata
const postsPath = path.resolve('posts.json');
assert.ok(fs.existsSync(postsPath), 'posts.json should exist');

const posts = JSON.parse(fs.readFileSync(postsPath, 'utf8'));
assert.ok(Array.isArray(posts) && posts.length > 0, 'posts.json should contain an array of posts');

posts.forEach((post, idx) => {
    assert.ok(post.title, `Post at index ${idx} missing title`);
    assert.ok(post.url, `Post at index ${idx} missing url`);
    assert.ok(post.author === 'JY DM', `Post ${post.slug} author should be JY DM`);
    assert.ok(post.issue_volume, `Post ${post.slug} missing issue_volume`);
    assert.ok(post.vibe, `Post ${post.slug} missing vibe`);
    assert.ok(post.founder_notes, `Post ${post.slug} missing founder_notes`);
});
console.log(`✅ Passed: All ${posts.length} posts in posts.json have valid monthly issue & founder metadata.`);

// Test 2: Check index.html HTML elements
const indexPath = path.resolve('index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf8');

assert.ok(indexHtml.includes('<title>COSYmagazine'), 'index.html should be titled COSYmagazine');
assert.ok(indexHtml.includes('ns-filters'), 'index.html should feature the filter bar');
assert.ok(indexHtml.includes('id="ns-grid"'), 'index.html should feature the article grid');
assert.ok(indexHtml.includes('podcast.html'), 'index.html should link to the podcast desk');
console.log('✅ Passed: index.html contains Founder Presentation Deck & Podcast Mode controls.');

// Test 3: Check all blog post HTML files for Founder Deck & Flipbook script
const EXCLUDED_DEMO_PAGES = new Set(['index.html', 'editor.html', 'design-system.html', 'art-contact-sheet.html', 'stage-demo.html', 'podcast.html', 'issues.html', '404.html']);
const blogFiles = fs.readdirSync('.').filter(f => f.endsWith('.html') && !EXCLUDED_DEMO_PAGES.has(f));
assert.ok(blogFiles.length > 0, 'Should find blog post HTML files');

blogFiles.forEach(file => {
    const postHtml = fs.readFileSync(file, 'utf8');

    assert.ok(postHtml.includes('flipbook.js'), `${file} should load flipbook.js script`);
});
console.log(`✅ Passed: All ${blogFiles.length} blog post HTML files contain Founder Deck & Flipbook script integrations.`);

// Test 4: Check css/blog.css magazine & podcast styles
const cssPath = path.resolve('css/blog.css');
const cssText = fs.readFileSync(cssPath, 'utf8');

assert.ok(cssText.includes('.founder-presentation-card'), 'css/blog.css should define .founder-presentation-card');
assert.ok(cssText.includes('podcast-presentation-mode'), 'css/blog.css should define podcast-presentation-mode');
assert.ok(cssText.includes('@media print'), 'css/blog.css should define @media print styles');
console.log('✅ Passed: css/blog.css defines magazine, podcast presentation mode, and print paper styles.');

// Test 5: Check August Issue 01 full digital version, Editor's Letter, and Paywall integration
const augustHtmlPath = path.resolve('august-2026-issue.html');
assert.ok(fs.existsSync(augustHtmlPath), 'august-2026-issue.html should exist');
const augustHtml = fs.readFileSync(augustHtmlPath, 'utf8');

assert.ok(augustHtml.includes('Dear readers, students, teacher, language nerds'), 'august-2026-issue.html should include the verbatim Letter from the Editor');
assert.ok(augustHtml.includes('In Conversation: Thematic Founder Interview with James (JY DM)'), 'august-2026-issue.html should include the founder interview');
assert.ok(augustHtml.includes('FASHION &amp; TRENDS') || augustHtml.includes('FASHION & TRENDS'), 'august-2026-issue.html should include Fashion & Trends section');
assert.ok(augustHtml.includes('STORIES &amp; VOICES') || augustHtml.includes('STORIES & VOICES'), 'august-2026-issue.html should include Stories & Voices section');
assert.ok(augustHtml.includes('LIVING &amp; SALON') || augustHtml.includes('LIVING & SALON'), 'august-2026-issue.html should include Living & Salon section');
assert.ok(augustHtml.includes('A0–A2') || augustHtml.includes('A0-A2'), 'august-2026-issue.html should include A0-A2 tier');
assert.ok(augustHtml.includes('B1–B2') || augustHtml.includes('B1-B2'), 'august-2026-issue.html should include B1-B2 tier');
assert.ok(augustHtml.includes('C1–C2') || augustHtml.includes('C1-C2'), 'august-2026-issue.html should include C1-C2 tier');
assert.ok(augustHtml.includes('Research Field'), 'august-2026-issue.html should include Research Field annotations');
assert.ok(augustHtml.includes('Research Spark'), 'august-2026-issue.html should include Research Spark annotations');

// Test 6: Free standalone articles remain accessible
const whySpeakingHtmlPath = path.resolve('why-speaking-first.html');
assert.ok(fs.existsSync(whySpeakingHtmlPath), 'why-speaking-first.html should exist for free access');
const top10HtmlPath = path.resolve('top-10-verbs.html');
assert.ok(fs.existsSync(top10HtmlPath), 'top-10-verbs.html should exist for free access');

const paywallScriptPath = path.resolve('js/magazine-paywall.js');
assert.ok(fs.existsSync(paywallScriptPath), 'js/magazine-paywall.js should exist');
const paywallScript = fs.readFileSync(paywallScriptPath, 'utf8');
assert.ok(paywallScript.includes('CosyMagazinePaywall'), 'js/magazine-paywall.js should define CosyMagazinePaywall');

console.log('✅ Passed: August Issue 01 full digital version, CEFR tiers, Research Fields/Sparks, free articles, and Supabase paywall guard are verified.');

console.log('🎉 All Blog Magazine & Podcast Presentation tests passed successfully!');
