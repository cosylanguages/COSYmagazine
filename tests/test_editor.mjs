import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Blocks = require('../js/editor-blocks.js');
const Auth = require('../js/cms-auth.js');
const { validatePostSchema } = require('../scripts/validate-blog-schema.js');

test('CosyEditorBlocks - All 13 canonical block definitions exist and instantiate valid payloads', () => {
  const expectedTypes = [
    'heading',
    'paragraph',
    'mistake-card',
    'example',
    'pronunciation',
    'table',
    'quiz',
    'culture-bite',
    'pullquote',
    'quote-wall',
    'list-item',
    'image',
    'links'
  ];

  assert.equal(Blocks.BLOCK_DEFINITIONS.length, 13);

  expectedTypes.forEach(type => {
    const block = Blocks.createBlock(type);
    assert.equal(block.type, type, `Block type mismatch for ${type}`);
    assert.ok(block.say, `Block ${type} must support stage narration say field`);
  });
});

test('CosyEditorBlocks - All article presets pass scripts/validate-blog-schema.js and include image & link blocks', () => {
  assert.ok(Blocks.ARTICLE_PRESETS.length >= 4);

  Blocks.ARTICLE_PRESETS.forEach(preset => {
    const postData = preset.create({ language: 'en' });
    const errors = validatePostSchema(postData, `${preset.id}.json`);
    assert.equal(errors.length, 0, `Preset ${preset.id} failed schema validation: ${errors.join(', ')}`);

    // Verify presence of visual image blocks and ecosystem link blocks
    const hasImage = postData.blocks.some(b => b.type === 'image' && typeof b.url === 'string' && typeof b.alt === 'string');
    const hasLink = postData.blocks.some(b => b.type === 'links' && typeof b.url === 'string' && typeof b.label === 'string');
    assert.ok(hasImage, `Preset ${preset.name} must feature an image building block`);
    assert.ok(hasLink, `Preset ${preset.name} must feature an ecosystem links building block`);
  });
});

test('CosyEditorBlocks - Article presets support multi-language codes', () => {
  ['fr', 'it', 'ru', 'el', 'es', 'de', 'pt', 'hy', 'ka', 'cv'].forEach(lang => {
    const postData = Blocks.ARTICLE_PRESETS[0].create({ language: lang });
    assert.equal(postData.language, lang);
    assert.ok(postData.slug.endsWith(`-${lang}`));
    const errors = validatePostSchema(postData, `saturday-${lang}.json`);
    assert.equal(errors.length, 0);
  });
});

test('CosyCMSAuth - Founder role recognition', () => {
  assert.equal(Auth.isFounderRole('founder'), true);
  assert.equal(Auth.isFounderRole('Founder'), true);
  assert.equal(Auth.isFounderRole('admin'), true);
  assert.equal(Auth.isFounderRole('owner'), true);
  assert.equal(Auth.isFounderRole('teacher'), false);
  assert.equal(Auth.isFounderRole('student'), false);
  assert.equal(Auth.isFounderRole(''), false);
  assert.equal(Auth.isFounderRole(null), false);
});

test('CosyEditor - Canonical Issues and 19-part Section Templates generate valid SCHEMA.md payloads', () => {
  const issues = Blocks.CANONICAL_ISSUES;
  assert.ok(Array.isArray(issues) && issues.length >= 7, 'Must define canonical magazine issues');

  const sections = Blocks.CANONICAL_SECTIONS;
  assert.equal(sections.length, 19, 'Must define 19 standardized canonical magazine sections');

  sections.forEach(sec => {
    const postPayload = Blocks.createSectionTemplate(sec.id, {
      language: 'en',
      issueNumber: 'Vol. 2026.08',
      issueTitle: 'Get Ready for School'
    });

    assert.equal(postPayload.section, sec.id);
    assert.ok(postPayload.blocks.length > 0, `Section ${sec.id} must have content blocks`);

    const errors = validatePostSchema(postPayload, `${sec.id}.json`);
    assert.equal(errors.length, 0, `Section template ${sec.id} failed schema validation: ${errors.join('; ')}`);
  });
});

test('CosyEditor - Constructor Mode Switching & Website Mode "Part of a Magazine" toggle', () => {
  const Editor = require('../js/editor.js');

  // Test Mode Switching
  Editor.setConstructorMode('website');
  assert.equal(Editor.getConstructorMode(), 'website');

  Editor.setConstructorMode('magazine');
  assert.equal(Editor.getConstructorMode(), 'magazine');

  // Load sample post
  const sample = Blocks.ARTICLE_PRESETS[0].create({ language: 'en' });
  Editor.setCurrentPost(sample);

  // Switch to Website mode
  Editor.setConstructorMode('website');

  // Untick "Part of a Magazine"
  Editor.setMagazinePart(false);
  assert.equal(Editor.getIsMagazinePart(), false);
  const detachedPost = Editor.getCurrentPost();
  assert.equal(detachedPost.issue, undefined);
  assert.equal(detachedPost.contentType, 'evergreen');

  // Retick "Part of a Magazine"
  Editor.setMagazinePart(true);
  assert.equal(Editor.getIsMagazinePart(), true);
  const reattachedPost = Editor.getCurrentPost();
  assert.ok(reattachedPost.issue.number.startsWith('Vol.'));
  assert.equal(reattachedPost.contentType, 'issue-article');
});

test('CosyEditor - Direct Issue Management (create and edit new issues)', () => {
  const Editor = require('../js/editor.js');

  const initialIssues = Editor.getManagedIssues();
  assert.ok(initialIssues.length >= 7);

  // Test setting active issue
  const customIssue = {
    id: 'vol-2027-04',
    number: 'Vol. 2027.04',
    title: 'Spring Renaissance',
    theme: 'Exploration and communicative flowering',
    date: '2027-04-15',
    palette: ['#059669', '#faf7f2', '#1c1917', '#10b981']
  };

  Editor.setActiveIssue(customIssue);
  assert.equal(Editor.getActiveIssue().number, 'Vol. 2027.04');
});

test('CosyEditor - capabilities: everyone drafts and exports, only founders publish and upload PDFs', () => {
  const Editor = require('../js/editor.js');

  const guest = Editor.getCapabilities(null);
  assert.equal(guest.signedIn, false);
  assert.equal(guest.draft && guest.exportJson && guest.importJson, true);
  assert.equal(guest.publishLive, false);
  assert.equal(guest.uploadPdf, false);

  const member = Editor.getCapabilities({ email: 'editor@example.com', role: 'editor', isFounder: false });
  assert.equal(member.signedIn, true);
  assert.equal(member.publishLive, false);
  assert.equal(member.uploadPdf, false);

  const founder = Editor.getCapabilities({ email: 'founder@example.com', role: 'founder', isFounder: true });
  assert.equal(founder.publishLive, true);
  assert.equal(founder.uploadPdf, true);
});

test('CosyEditor - readiness checks mirror the schema validator and flag editorial gaps', () => {
  const Editor = require('../js/editor.js');
  const byId = (checks, id) => checks.find(c => c.id === id);

  // A complete, valid article has no errors
  const good = Blocks.ARTICLE_PRESETS[0].create({ language: 'en', date: '2026-11-07' });
  const goodChecks = Editor.getReadiness(good);
  assert.equal(goodChecks.filter(c => c.level === 'error').length, 0, JSON.stringify(goodChecks.filter(c => c.level === 'error')));

  // Missing required fields are errors
  const broken = Blocks.clone(good);
  broken.title = '  ';
  broken.slug = 'Not A Slug';
  broken.kicker = '';
  broken.dek = '';
  broken.date = '07/11/2026';
  broken.issue = { number: '', title: '' };
  broken.blocks = [];
  const brokenChecks = Editor.getReadiness(broken);
  for (const id of ['title', 'slug', 'kicker', 'dek', 'date', 'issue', 'blocks']) {
    assert.equal(byId(brokenChecks, id).level, 'error', `${id} should be an error`);
  }

  // Slug rules: lowercase, digits, single hyphens
  for (const slug of ['ok-slug-2', 'a']) {
    const p = Blocks.clone(good); p.slug = slug;
    assert.equal(byId(Editor.getReadiness(p), 'slug').level, 'ok', slug);
  }
  for (const slug of ['Bad', 'two  words', 'double--hyphen', '-lead', 'trail-', 'под']) {
    const p = Blocks.clone(good); p.slug = slug;
    assert.equal(byId(Editor.getReadiness(p), 'slug').level, 'error', slug);
  }

  // Warnings: images without alt text and missing tags do not block publishing
  const warned = Blocks.clone(good);
  warned.tags = [];
  warned.blocks.push({ type: 'image', url: 'images/x.svg', alt: '', caption: '' });
  const warnedChecks = Editor.getReadiness(warned);
  assert.equal(byId(warnedChecks, 'alt').level, 'warn');
  assert.equal(byId(warnedChecks, 'tags').level, 'warn');
  assert.equal(warnedChecks.filter(c => c.level === 'error').length, 0);

  // No article at all
  assert.equal(Editor.getReadiness(null)[0].level, 'error');
});

test('CosyEditor - Modular Elements Presets instantiate valid blog schema blocks', () => {
  assert.ok(Array.isArray(Blocks.MODULAR_ELEMENT_PRESETS));
  assert.ok(Blocks.MODULAR_ELEMENT_PRESETS.length >= 5);

  Blocks.MODULAR_ELEMENT_PRESETS.forEach(preset => {
    const block = Blocks.createModularElementBlock(preset.id);
    assert.ok(block, `Preset ${preset.id} should return a block`);
    assert.strictEqual(typeof block.type, 'string');

    // Test that embedding into a valid article preset passes validatePostSchema
    const samplePost = Blocks.ARTICLE_PRESETS[0].create({ language: 'en' });
    samplePost.blocks.push(block);
    const errors = validatePostSchema(samplePost, `test-${preset.id}.json`);
    assert.deepStrictEqual(errors, [], `Modular block ${preset.id} failed validation: ${errors.join(', ')}`);
  });
});

test('CosyEditor - getArticlesForIssue correctly identifies and maps published issue articles', () => {
  const fs = require('fs');
  const Editor = require('../js/editor.js');
  const postsCatalog = JSON.parse(fs.readFileSync('posts.json', 'utf8'));

  // Test August Issue mapping (Vol. 2026.08)
  const augustIssue = Blocks.CANONICAL_ISSUES.find(i => i.id === 'vol-2026-08');
  assert.ok(augustIssue, 'August canonical issue should exist');

  const augustArticles = Editor.getArticlesForIssue(augustIssue, postsCatalog);
  assert.equal(augustArticles.length, 17, `Expected 17 articles for August 2026 issue, got ${augustArticles.length}`);

  // Flagship article check
  const augustFlagship = Editor.ISSUE_FLAGSHIPS['vol-2026-08'];
  assert.equal(augustFlagship, 'in-conversation-founder-august-school');
  assert.ok(augustArticles.some(a => a.slug === augustFlagship), 'Flagship must be present in August articles list');

  // Test other published issues
  const septIssue = Blocks.CANONICAL_ISSUES.find(i => i.id === 'vol-2026-09');
  const septArticles = Editor.getArticlesForIssue(septIssue, postsCatalog);
  assert.equal(septArticles.length, 16, `Expected 16 articles for September 2026 issue, got ${septArticles.length}`);

  const octIssue = Blocks.CANONICAL_ISSUES.find(i => i.id === 'vol-2026-10');
  const octArticles = Editor.getArticlesForIssue(octIssue, postsCatalog);
  assert.equal(octArticles.length, 20, `Expected 20 articles for October 2026 issue, got ${octArticles.length}`);

  const decIssue = Blocks.CANONICAL_ISSUES.find(i => i.id === 'vol-2026-12');
  const decArticles = Editor.getArticlesForIssue(decIssue, postsCatalog);
  assert.equal(decArticles.length, 16, `Expected 16 articles for December 2026 issue, got ${decArticles.length}`);

  const febIssue = Blocks.CANONICAL_ISSUES.find(i => i.id === 'vol-2027-02');
  const febArticles = Editor.getArticlesForIssue(febIssue, postsCatalog);
  assert.equal(febArticles.length, 15, `Expected 15 articles for February 2027 issue, got ${febArticles.length}`);
});
