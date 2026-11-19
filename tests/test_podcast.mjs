import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { validatePodcastReadiness } from '../scripts/ops/validate-podcast-readiness.js';
import { generatePodcastRss } from '../scripts/build/generate-podcast-rss.js';
import { ScriptController } from '../js/stage/script.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

test('validatePodcastReadiness script returns valid report structure', () => {
  const result = validatePodcastReadiness();
  assert.ok(result.totalPosts > 0, 'Total posts examined should be greater than 0');
  assert.ok(typeof result.podcastReadyCount === 'number', 'podcastReadyCount should be a number');
  assert.ok(Array.isArray(result.reports), 'reports should be an array');

  const stageDemoReport = result.reports.find(r => r.file === 'stage-demo-podcast.json');
  assert.ok(stageDemoReport, 'stage-demo-podcast.json report should exist');
  assert.equal(stageDemoReport.isPodcastReady, true, 'stage-demo-podcast.json should be podcast ready');
  assert.equal(stageDemoReport.sayReadinessPct, 100, 'stage-demo-podcast.json should have 100% say readiness');
});

test('generatePodcastRss builds valid podcast.xml', () => {
  generatePodcastRss();
  const rssPath = path.join(ROOT_DIR, 'podcast.xml');
  assert.ok(fs.existsSync(rssPath), 'podcast.xml should exist');

  const xmlContent = fs.readFileSync(rssPath, 'utf-8');
  assert.ok(xmlContent.length > 0, 'RSS file should not be empty');
  assert.ok(xmlContent.includes('<rss version="2.0"'), 'XML should contain rss 2.0 tag');
  assert.ok(xmlContent.includes('<title>cosylanguages / такиеязыки</title>'), 'XML should contain channel title');
  assert.ok(xmlContent.includes('<itunes:author>JY DM</itunes:author>'), 'XML should contain iTunes author');
  assert.ok(xmlContent.includes('<item>'), 'XML should contain podcast items');
  assert.ok(xmlContent.includes('<enclosure'), 'XML should contain audio enclosures');
});

test('ScriptController processes post blocks into beats, markdown, and text script exports', () => {
  const mockPost = {
    slug: 'test-podcast-post',
    title: 'Test Podcast Article',
    date: '2026-10-18',
    level: 'B1–B2',
    language: 'en',
    podcast: { episode: 12 },
    blocks: [
      { type: 'heading', text: 'Intro', say: 'Welcome to this episode.' },
      { type: 'paragraph', text: 'Body paragraph', say: 'Today we discuss "fluent" speech in <em>French</em>.' }
    ]
  };

  const controller = new ScriptController(null, mockPost);
  assert.equal(controller.beats.length, 2, 'Should process 2 beats');
  assert.equal(controller.beats[0].say, 'Welcome to this episode.');
  assert.equal(controller.beats[1].say, 'Today we discuss "fluent" speech in <em>French</em>.');

  const mdExport = controller.generateMarkdownScript();
  assert.equal(mdExport.filename, 'test-podcast-post-script.md');
  assert.ok(mdExport.content.includes('# Test Podcast Article'));
  assert.ok(mdExport.content.includes('Welcome to this episode.'));

  const txtExport = controller.generateTextScript();
  assert.equal(txtExport.filename, 'test-podcast-post-script.txt');
  assert.ok(txtExport.content.includes('TEST PODCAST ARTICLE — PODCAST TELEPROMPTER SCRIPT'));
  assert.ok(txtExport.content.includes('Welcome to this episode.'));
});
