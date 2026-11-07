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
  assert.equal(detachedPost.issue.number, 'Website / Standalone');

  // Retick "Part of a Magazine"
  Editor.setMagazinePart(true);
  assert.equal(Editor.getIsMagazinePart(), true);
  const reattachedPost = Editor.getCurrentPost();
  assert.ok(reattachedPost.issue.number.startsWith('Vol.'));
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
