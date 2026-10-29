#!/usr/bin/env node
/**
 * scripts/validate-blog-schema.js
 * Validates post JSON objects against the COSYlanguages Blog Post Schema (blog/SCHEMA.md).
 *
 * Usage: node scripts/validate-blog-schema.js [filepath]
 */

const fs = require('fs');
const path = require('path');

const ALLOWED_DESKS = new Set([
  'Front Page',
  'Words',
  'Grammar',
  'Saturday Mistakes',
  'COSYtalks',
  'Grammar Made Cosy',
  'Say It',
  'Culture & Quotes',
  'Long Reads',
  'Cosy Events',
  'The Podcast',
  'Back Issues',
  'Reflections'
]);

const ALLOWED_FORMATS = new Set([
  'list',
  'essay',
  'qa',
  'ranking',
  'photo-essay',
  'quiz',
  'quote-wall'
]);

const ALLOWED_BLOCK_TYPES = new Set([
  'heading',
  'paragraph',
  'list-item',
  'table',
  'example',
  'pronunciation',
  'pullquote',
  'image',
  'quiz',
  'culture-bite',
  'mistake-card',
  'quote-wall',
  'links'
]);

const ALLOWED_LANGUAGES = new Set([
  'en', 'fr', 'it', 'ru', 'el', 'tt', 'ba', 'br', 'pt', 'es', 'de', 'hy', 'ka', 'cv'
]);

function validatePostSchema(postObj, sourceName = 'object') {
  const errors = [];

  if (!postObj || typeof postObj !== 'object') {
    return [`[${sourceName}] Post data must be a non-null object.`];
  }

  // 1. Required Top-Level String Fields
  const stringFields = ['id', 'slug', 'language', 'desk', 'format', 'level', 'date', 'title', 'kicker', 'dek'];
  stringFields.forEach(field => {
    if (typeof postObj[field] !== 'string' || postObj[field].trim() === '') {
      errors.push(`[${sourceName}] Missing or invalid required string field "${field}".`);
    }
  });

  // Optional translationOf check
  if (postObj.translationOf !== undefined) {
    if (typeof postObj.translationOf !== 'string' || postObj.translationOf.trim() === '') {
      errors.push(`[${sourceName}] Optional field "translationOf" must be a non-empty string.`);
    }
  }

  // Optional draft check
  if (postObj.draft !== undefined && typeof postObj.draft !== 'boolean') {
    errors.push(`[${sourceName}] Optional field "draft" must be a boolean.`);
  }

  // Language check
  if (postObj.language && !ALLOWED_LANGUAGES.has(postObj.language)) {
    errors.push(`[${sourceName}] Invalid language "${postObj.language}". Must be one of: ${Array.from(ALLOWED_LANGUAGES).join(', ')}.`);
  }

  // Desk check
  if (postObj.desk && !ALLOWED_DESKS.has(postObj.desk)) {
    errors.push(`[${sourceName}] Invalid desk "${postObj.desk}". Must be one of: ${Array.from(ALLOWED_DESKS).join(', ')}.`);
  }

  // Format check
  if (postObj.format && !ALLOWED_FORMATS.has(postObj.format)) {
    errors.push(`[${sourceName}] Invalid format "${postObj.format}". Must be one of: ${Array.from(ALLOWED_FORMATS).join(', ')}.`);
  }

  // Date format YYYY-MM-DD
  if (postObj.date && (!/^\d{4}-\d{2}-\d{2}$/.test(postObj.date) || isNaN(Date.parse(postObj.date)))) {
    errors.push(`[${sourceName}] Invalid date format "${postObj.date}". Must be YYYY-MM-DD.`);
  }

  // tags
  if (!Array.isArray(postObj.tags)) {
    errors.push(`[${sourceName}] Field "tags" must be an array of strings.`);
  }

  // readingTime
  if (typeof postObj.readingTime !== 'number' || postObj.readingTime < 1) {
    errors.push(`[${sourceName}] Field "readingTime" must be a positive number.`);
  }

  // issue
  if (!postObj.issue || typeof postObj.issue !== 'object' || typeof postObj.issue.number !== 'string' || typeof postObj.issue.title !== 'string') {
    errors.push(`[${sourceName}] Field "issue" must be an object with "number" and "title" string properties.`);
  }

  // podcast
  // `podcast` is optional: posts without a published episode show no badge and no player.
  if (postObj.podcast !== undefined && (typeof postObj.podcast !== 'object' || postObj.podcast === null || typeof postObj.podcast.episode !== 'number')) {
    errors.push(`[${sourceName}] Field "podcast" must be an object containing number "episode".`);
  }

  // artDirection
  if (!postObj.artDirection || typeof postObj.artDirection !== 'object') {
    errors.push(`[${sourceName}] Field "artDirection" must be an object.`);
  } else {
    const art = postObj.artDirection;
    if (!Array.isArray(art.palette) || art.palette.length === 0) {
      errors.push(`[${sourceName}] "artDirection.palette" must be a non-empty array of color strings.`);
    }
    if (!art.fonts || typeof art.fonts.display !== 'string' || typeof art.fonts.text !== 'string') {
      errors.push(`[${sourceName}] "artDirection.fonts" must specify "display" and "text" string font names.`);
    }
  }

  // blocks
  if (!Array.isArray(postObj.blocks) || postObj.blocks.length === 0) {
    errors.push(`[${sourceName}] Field "blocks" must be a non-empty array of block objects.`);
  } else {
    postObj.blocks.forEach((block, idx) => {
      const blockRef = `${sourceName} -> blocks[${idx}]`;
      if (!block || typeof block !== 'object') {
        errors.push(`[${blockRef}] Block must be an object.`);
        return;
      }
      if (!block.type || !ALLOWED_BLOCK_TYPES.has(block.type)) {
        errors.push(`[${blockRef}] Invalid or missing block "type" "${block.type}". Allowed: ${Array.from(ALLOWED_BLOCK_TYPES).join(', ')}.`);
      }

      // Optional beat check
      if (block.beat !== undefined) {
        if (typeof block.beat !== 'object' || block.beat === null) {
          errors.push(`[${blockRef}] Optional field "beat" must be an object.`);
        }
      }

      // Optional say check
      if (block.say !== undefined && typeof block.say !== 'string') {
        errors.push(`[${blockRef}] Optional field "say" must be a string.`);
      }

      // Specific block type requirements
      switch (block.type) {
        case 'heading':
          if (typeof block.text !== 'string' || typeof block.level !== 'number') {
            errors.push(`[${blockRef}] Block "heading" requires string "text" and number "level".`);
          }
          break;
        case 'paragraph':
          if (typeof block.text !== 'string') {
            errors.push(`[${blockRef}] Block "paragraph" requires string "text".`);
          }
          break;
        case 'list-item':
          if (!Array.isArray(block.items) || typeof block.ordered !== 'boolean') {
            errors.push(`[${blockRef}] Block "list-item" requires boolean "ordered" and string array "items".`);
          }
          break;
        case 'table':
          if (!Array.isArray(block.headers) || !Array.isArray(block.rows)) {
            errors.push(`[${blockRef}] Block "table" requires "headers" array and "rows" 2D array.`);
          }
          break;
        case 'example':
          if (typeof block.targetText !== 'string' || typeof block.gloss !== 'string') {
            errors.push(`[${blockRef}] Block "example" requires string "targetText" and string "gloss".`);
          }
          break;
        case 'pronunciation':
          if (typeof block.word !== 'string' || typeof block.ipa !== 'string') {
            errors.push(`[${blockRef}] Block "pronunciation" requires string "word" and string "ipa".`);
          }
          break;
        case 'pullquote':
          if (typeof block.quote !== 'string') {
            errors.push(`[${blockRef}] Block "pullquote" requires string "quote".`);
          }
          break;
        case 'image':
          if (typeof block.url !== 'string' || typeof block.alt !== 'string') {
            errors.push(`[${blockRef}] Block "image" requires string "url" and string "alt".`);
          }
          break;
        case 'quiz':
          if (typeof block.question !== 'string' || !Array.isArray(block.options) || typeof block.correctIndex !== 'number') {
            errors.push(`[${blockRef}] Block "quiz" requires "question", "options" array, and "correctIndex" number.`);
          }
          break;
        case 'culture-bite':
          if (typeof block.title !== 'string' || typeof block.content !== 'string') {
            errors.push(`[${blockRef}] Block "culture-bite" requires string "title" and string "content".`);
          }
          break;
        case 'mistake-card': {
          for (const k of ['title', 'wrong', 'right', 'rule']) {
            if (typeof block[k] !== 'string' || !block[k].trim()) errors.push(`[${blockRef}] Block "mistake-card" requires non-empty string "${k}".`);
          }
          if (block.why !== undefined && typeof block.why !== 'string') errors.push(`[${blockRef}] Block "mistake-card" "why" must be a string.`);
          if (block.examples !== undefined && (!Array.isArray(block.examples) || block.examples.some((e) => typeof e !== 'string'))) errors.push(`[${blockRef}] Block "mistake-card" "examples" must be an array of strings.`);
          if (block.labels !== undefined && (typeof block.labels !== 'object' || Array.isArray(block.labels))) errors.push(`[${blockRef}] Block "mistake-card" "labels" must be an object.`);
          if (block.quiz !== undefined) {
            const q = block.quiz;
            if (!q || typeof q.question !== 'string' || !Array.isArray(q.options) || q.options.length < 2 || typeof q.correctIndex !== 'number' || q.correctIndex < 0 || q.correctIndex >= q.options.length) {
              errors.push(`[${blockRef}] Block "mistake-card" "quiz" requires "question", an "options" array (2+) and a valid "correctIndex".`);
            }
          }
          break;
        }
        case 'quote-wall':
          if (!Array.isArray(block.quotes)) {
            errors.push(`[${blockRef}] Block "quote-wall" requires "quotes" array.`);
          }
          break;
        case 'links':
          if (typeof block.destination !== 'string' || typeof block.url !== 'string' || typeof block.label !== 'string') {
            errors.push(`[${blockRef}] Block "links" requires "destination", "url", and "label" strings.`);
          }
          break;
      }
    });
  }

  return errors;
}

function runCLI() {
  const targetPath = process.argv[2];
  let jsonFiles = [];

  if (targetPath) {
    if (fs.existsSync(targetPath)) {
      if (fs.statSync(targetPath).isDirectory()) {
        jsonFiles = fs.readdirSync(targetPath).filter(f => f.endsWith('.json')).map(f => path.join(targetPath, f));
      } else {
        jsonFiles = [targetPath];
      }
    } else {
      console.error(`❌ Path not found: ${targetPath}`);
      process.exit(1);
    }
  } else {
    const defaultPostsDir = path.join(__dirname, '..', 'posts');
    if (fs.existsSync(defaultPostsDir)) {
      jsonFiles = fs.readdirSync(defaultPostsDir).filter(f => f.endsWith('.json')).map(f => path.join(defaultPostsDir, f));
    }
  }

  if (jsonFiles.length === 0) {
    console.log('ℹ️ No JSON post files found to validate.');
    process.exit(0);
  }

  console.log(`🔍 Validating ${jsonFiles.length} blog post JSON file(s)...`);
  let totalErrors = 0;

  jsonFiles.forEach(file => {
    try {
      const raw = fs.readFileSync(file, 'utf-8');
      const postData = JSON.parse(raw);
      const errors = validatePostSchema(postData, path.basename(file));
      if (errors.length > 0) {
        console.error(`❌ Validation failed for ${path.basename(file)}:`);
        errors.forEach(err => console.error('   ' + err));
        totalErrors += errors.length;
      } else {
        console.log(`  ✓ ${path.basename(file)} passed schema validation.`);
      }
    } catch (e) {
      console.error(`❌ JSON Parse Error in ${path.basename(file)}: ${e.message}`);
      totalErrors++;
    }
  });

  // Strict i18n key completeness check for blog languages
  const REQUIRED_BLOG_LANGS = ['en', 'fr', 'it', 'ru', 'el'];
  const REQUIRED_BLOG_KEYS = [
    'blog.back_to_hub',
    'blog.script_mode',
    'blog.stage_mode',
    'blog.read_in',
    'blog.written_by',
    'blog.min_read',
    'blog.return_to_index',
    'blog.founder_deck_title',
    'blog.expand_deck',
    'blog.celta_focus_title',
    'blog.celta_focus_text',
    'blog.editorial_notes_title',
    'blog.editorial_notes_text',
    'blog.teleprompter_script_view_mode',
    'blog.stage_view_mode',
    'blog.episode',
    'blog.podcast_in_production',
    'blog.listen_while_reading',
    'blog.readalong_active',
    'blog.ready_to_start',
    'blog.clean_view',
    'blog.outro_title',
    'blog.outro_subtitle',
    'blog.exit_script_view',
    'blog.podcast_script_mode',
    'blog.est_duration',
    'blog.words_count',
    'blog.level_label',
    'blog.font_size',
    'blog.auto_scroll',
    'blog.mirror_glass',
    'blog.flip_mirror',
    'blog.export_script',
    'blog.end_of_script',
    'desk.front_page',
    'desk.words',
    'desk.grammar',
    'desk.saturday_mistakes',
    'desk.cosytalks',
    'desk.grammar_made_cosy',
    'desk.say_it',
    'desk.culture_quotes',
    'desk.long_reads',
    'desk.cosy_events',
    'desk.the_podcast',
    'desk.back_issues',
    'desk.reflections',
    'nav.courses',
    'nav.calculator',
    'nav.blog',
    'nav.placement_quiz'
  ];

  function getValueByPath(obj, keyPath) {
    if (!obj) return undefined;
    const parts = keyPath.split('.');
    let cur = obj;
    for (const p of parts) {
      if (cur && typeof cur === 'object' && p in cur) {
        cur = cur[p];
      } else {
        return undefined;
      }
    }
    return typeof cur === 'string' ? cur : undefined;
  }

  console.log('\n🔍 Validating blog i18n key completeness across supported languages...');
  let i18nErrors = 0;

  REQUIRED_BLOG_LANGS.forEach(lang => {
    const langFile = path.join(__dirname, '..', 'js', 'i18n', `${lang}.json`);
    if (!fs.existsSync(langFile)) {
      console.error(`❌ Missing required i18n translation file: js/i18n/${lang}.json`);
      i18nErrors++;
      return;
    }

    try {
      const translations = JSON.parse(fs.readFileSync(langFile, 'utf-8'));
      const missing = [];
      REQUIRED_BLOG_KEYS.forEach(key => {
        const val = getValueByPath(translations, key);
        if (!val || val.trim() === '') {
          missing.push(key);
        }
      });

      if (missing.length > 0) {
        console.error(`❌ Language "${lang}" (js/i18n/${lang}.json) is missing ${missing.length} required key(s):`);
        missing.forEach(k => console.error(`   - ${k}`));
        i18nErrors += missing.length;
      } else {
        console.log(`  ✓ js/i18n/${lang}.json passed all ${REQUIRED_BLOG_KEYS.length} blog i18n key checks.`);
      }
    } catch (e) {
      console.error(`❌ Failed to parse js/i18n/${lang}.json: ${e.message}`);
      i18nErrors++;
    }
  });

  if (totalErrors > 0 || i18nErrors > 0) {
    console.error(`\n❌ Validation failed with ${totalErrors} schema error(s) and ${i18nErrors} i18n key error(s).`);
    process.exit(1);
  } else {
    console.log('\n✅ All blog JSON post files and blog i18n translation dictionaries passed validation successfully.');
    process.exit(0);
  }
}

if (require.main === module) {
  runCLI();
}

module.exports = { validatePostSchema };
