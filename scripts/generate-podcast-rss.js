#!/usr/bin/env node
/**
 * scripts/generate-podcast-rss.js
 * Generates canonical RSS 2.0 + iTunes Podcast feed (`podcast.xml`)
 * from blog post JSON schema files with podcast metadata.
 *
 * Usage: node scripts/generate-podcast-rss.js
 */

const fs = require('fs');
const path = require('path');

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
  console.log('📡 Generating RSS Feed (podcast.xml)...');

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
          : `https://cosylanguages.github.io/COSYmagazine/${audioUrl}`;

        const postUrl = `https://cosylanguages.github.io/COSYmagazine/${post.slug}.html`;
        const scriptUrl = `${postUrl}?script=1`;
        const stageUrl = `${postUrl}?stage=1`;

        const pubDate = new Date(post.date || Date.now()).toUTCString();
        const epNum = podcast.episode || 1;
        const durationSec = Math.max(120, (post.blocks || []).length * 45);

        // Enclosure metadata: the MIME type follows the file extension, and the byte
        // length is only declared when the audio is a real file in this repo.
        const audioExt = path.extname(audioUrl).toLowerCase();
        const audioMime = audioExt === '.mp3' ? 'audio/mpeg'
          : audioExt === '.m4a' ? 'audio/mp4'
          : audioExt === '.ogg' ? 'audio/ogg'
          : 'audio/mpeg';
        let audioLength = null;
        if (!/^https?:/.test(rawAudio)) {
          try {
            audioLength = fs.statSync(path.join(BLOG_DIR, rel)).size;
          } catch {
            audioLength = null;
          }
        }

        items.push({
          title: post.title,
          slug: post.slug,
          description: post.dek || post.summary || post.title,
          url: postUrl,
          audioUrl: absoluteAudioUrl,
          audioMime,
          audioLength,
          pubDate,
          epNum,
          durationSec,
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
  const channelLink = 'https://cosylanguages.github.io/COSYmagazine/podcast.html';
  const logoUrl = 'https://cosylanguages.github.io/COSYlanguages/images/logos/cosylanguages.png';

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(channelTitle)}</title>
    <link>${escapeXml(channelLink)}</link>
    <atom:link href="${escapeXml(channelLink.replace('podcast.html', 'podcast.xml'))}" rel="self" type="application/rss+xml" />
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
      <enclosure url="${escapeXml(item.audioUrl)}" type="${item.audioMime}"${item.audioLength != null ? ` length="${item.audioLength}"` : ''} />
      <itunes:episode>${item.epNum}</itunes:episode>
      <itunes:author>${escapeXml(item.author)}</itunes:author>
      <itunes:duration>${item.durationSec}</itunes:duration>
      <itunes:explicit>false</itunes:explicit>
    </item>`).join('\n')}
  </channel>
</rss>
`;

  fs.writeFileSync(RSS_FILE, rssXml, 'utf-8');
  console.log(`✅ Successfully generated podcast.xml with ${items.length} episode items.`);
}

if (require.main === module) {
  generatePodcastRss();
}

module.exports = { generatePodcastRss };
