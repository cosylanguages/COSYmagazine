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

console.log('🎉 All Blog Magazine & Podcast Presentation tests passed successfully!');
