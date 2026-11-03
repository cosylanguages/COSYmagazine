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

test('CosyEditorBlocks - All article presets pass scripts/validate-blog-schema.js', () => {
  assert.ok(Blocks.ARTICLE_PRESETS.length >= 4);

  Blocks.ARTICLE_PRESETS.forEach(preset => {
    const postData = preset.create({ language: 'en' });
    const errors = validatePostSchema(postData, `${preset.id}.json`);
    assert.equal(errors.length, 0, `Preset ${preset.id} failed schema validation: ${errors.join(', ')}`);
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
