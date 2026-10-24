#!/usr/bin/env node
/**
 * scripts/generate-podcast-rss.js
 * Generates canonical RSS 2.0 + iTunes Podcast feed (`blog/podcast.xml`)
 * from blog post JSON schema files with podcast metadata.
 *
 * Usage: node scripts/generate-podcast-rss.js
 */

const fs = require('fs');
const path = require('path');
const { SITE_BASE } = require('./site-config');

const BLOG_DIR = path.join(__dirname, '..');
const POSTS_DIR = path.join(BLOG_DIR, 'posts');
const RSS_FILE = path.join(BLOG_DIR, 'podcast.xml');

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generatePodcastRss() {
  console.log('📡 Generating RSS Feed (blog/podcast.xml)...');

  const items = [];

  if (fs.existsSync(POSTS_DIR)) {
    const jsonFiles = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.json'));

    jsonFiles.forEach(file => {
      const filePath = path.join(POSTS_DIR, file);
      try {
        const post = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const podcast = post.podcast || {};
        const rawAudio = podcast.audioUrl || null;
        const rel = rawAudio ? rawAudio.replace(/^(\.\.\/)+/, '').replace(/^audio\/blog\//, 'audio/') : null;
        // Only episodes whose audio is hosted (absolute URL) or present in this repo go into the feed.
        const audioUrl = rawAudio && (/^https?:/.test(rawAudio) || fs.existsSync(path.join(BLOG_DIR, rel))) ? (/^https?:/.test(rawAudio) ? rawAudio : rel) : null;

        if (!audioUrl) return;

        const absoluteAudioUrl = audioUrl.startsWith('http')
          ? audioUrl
          : `${SITE_BASE}${audioUrl}`;

        const postUrl = `${SITE_BASE}${post.slug}.html`;
        const scriptUrl = `${postUrl}?script=1`;
        const stageUrl = `${postUrl}?stage=1`;

        const pubDate = new Date(post.date || Date.now()).toUTCString();
        const epNum = podcast.episode || 1;
        const durationSec = Math.max(120, (post.blocks || []).length * 45);

        // Language code mapping
        const langCode = post.language || 'en';

        items.push({
          title: post.title,
          slug: post.slug,
          description: post.dek || post.summary || post.title,
          url: postUrl,
          audioUrl: absoluteAudioUrl,
          pubDate,
          epNum,
          durationSec,
          level: post.level || 'A0–B2',
          langCode,
          author: post.author || 'JY DM',
          scriptUrl,
          stageUrl
        });
      } catch (e) {
        console.warn(`⚠️ Error reading ${file} for RSS:`, e.message);
      }
    });
  }

  // Sort episodes in ascending or descending order (newest first for RSS)
  items.sort((a, b) => b.epNum - a.epNum);

  const channelTitle = 'cosylanguages / такиеязыки';
  const channelDesc = 'Official podcast for natural, speaking-first language acquisition. Every post includes teleprompter scripts, read-along sync, and 16:9 stage mode decks.';
  const channelLink = `${SITE_BASE}podcast.html`;
  const logoUrl = 'https://cosylanguages.github.io/COSYlanguages/images/logos/cosylanguages.png';

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:atom="http://www.w3.org/2000/svg">
  <channel>
    <title>${escapeXml(channelTitle)}</title>
    <link>${escapeXml(channelLink)}</link>
    <description>${escapeXml(channelDesc)}</description>
    <language>en</language>
    <copyright>© 2020–2026 COSYlanguages</copyright>
    <itunes:author>JY DM</itunes:author>
    <itunes:summary>${escapeXml(channelDesc)}</itunes:summary>
    <itunes:owner>
      <itunes:name>JY DM</itunes:name>
      <itunes:email>cosylanguages@gmail.com</itunes:email>
    </itunes:owner>
    <itunes:image href="${escapeXml(logoUrl)}" />
    <itunes:category text="Education">
      <itunes:category text="Language Learning" />
    </itunes:category>
    <itunes:explicit>false</itunes:explicit>

    ${items.map(item => `
    <item>
      <title>${escapeXml(item.title)} (Ep. ${item.epNum})</title>
      <link>${escapeXml(item.url)}</link>
      <guid isPermaLink="true">${escapeXml(item.url)}</guid>
      <pubDate>${item.pubDate}</pubDate>
      <description>${escapeXml(item.description)}</description>
      <content:encoded><![CDATA[<p>${escapeXml(item.description)}</p><p>📜 <a href="${item.scriptUrl}">Teleprompter Script</a> | 📺 <a href="${item.stageUrl}">16:9 Stage Deck</a></p>]]></content:encoded>
      <enclosure url="${escapeXml(item.audioUrl)}" length="3145728" type="audio/mpeg" />
      <itunes:episode>${item.epNum}</itunes:episode>
      <itunes:author>${escapeXml(item.author)}</itunes:author>
      <itunes:duration>${item.durationSec}</itunes:duration>
      <itunes:explicit>false</itunes:explicit>
    </item>`).join('\n')}
  </channel>
</rss>
`;

  fs.writeFileSync(RSS_FILE, rssXml, 'utf-8');
  console.log(`✅ Successfully generated blog/podcast.xml with ${items.length} episode items.`);
}

if (require.main === module) {
  generatePodcastRss();
}

module.exports = { generatePodcastRss };
