#!/usr/bin/env node
/**
 * Generates one PDF edition per language for an issue and uploads each to the
 * private Supabase bucket.
 *
 * Editions are sold separately, so every language is its own object and its own
 * `magazine_issues` row:
 *
 *   issues/cosymagazine-2026.08-en.pdf  ->  (Vol. 2026.08, en)
 *   issues/cosymagazine-2026.08-fr.pdf  ->  (Vol. 2026.08, fr)
 *
 * Usage:
 *   node scripts/ops/publish-issue-pdf.js --volume 2026.08                # all languages
 *   node scripts/ops/publish-issue-pdf.js --volume 2026.08 --lang en
 *   node scripts/ops/publish-issue-pdf.js --volume 2026.08 --generate-only
 */

const fs = require('fs');
const path = require('path');

const { buildPdf, editionLanguages } = require('./build-issue-pdf.js');

const ROOT = path.resolve(__dirname, '..', '..');
const BUCKET = process.env.SUPABASE_BUCKET || 'magazine-editions';

function parseArgs(argv) {
  const options = { volume: '', lang: '', generateOnly: false, publish: true, keep: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--volume') options.volume = argv[++i];
    else if (arg === '--lang') options.lang = argv[++i];
    else if (arg === '--generate-only') options.generateOnly = true;
    else if (arg === '--no-publish') options.publish = false;
    else if (arg === '--keep') options.keep = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!/^\d{4}\.\d{2}$/.test(options.volume)) {
    throw new Error('Usage: --volume YYYY.MM (e.g. 2026.08) [--lang en] [--generate-only]');
  }
  return options;
}

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to upload.');
  }
  if (serviceRoleKey.split('.').length !== 3) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY must be the JWT service_role key, not an sb_secret API key.');
  }
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(parsed.hostname)) {
    throw new Error('SUPABASE_URL must use HTTPS.');
  }
  return { url: url.replace(/\/+$/, ''), serviceRoleKey };
}

function objectPath(volume, lang) {
  return `issues/cosymagazine-${volume}-${lang}.pdf`;
}

async function ensurePrivateBucket(url, headers) {
  const bucketUrl = `${url}/storage/v1/bucket/${encodeURIComponent(BUCKET)}`;
  const response = await fetch(bucketUrl, { headers });
  const details = await response.json().catch(() => ({}));

  if (response.ok) {
    if (details.public === true) {
      throw new Error(`Bucket "${BUCKET}" is public; refusing to upload a paid edition.`);
    }
    return;
  }

  const missing = response.status === 404 ||
    (response.status === 400 && (details.code === 'NoSuchBucket' || details.statusCode === '404'));
  if (!missing) {
    throw new Error(`Could not inspect bucket (${response.status}): ${JSON.stringify(details).slice(0, 300)}`);
  }

  const created = await fetch(`${url}/storage/v1/bucket`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: false })
  });
  if (!created.ok) {
    throw new Error(`Could not create private bucket (${created.status}): ${(await created.text()).slice(0, 300)}`);
  }
  console.log(`Created private bucket "${BUCKET}".`);
}

/** Upserts the magazine_issues row so the edge function can resolve the edition. */
async function upsertIssueRow(url, headers, volume, lang, title, publish) {
  const volumeNumber = `Vol. ${volume}`;
  const row = {
    id: `vol-${volume.replace('.', '-')}-${lang}`,
    volume_number: volumeNumber,
    language: lang,
    title,
    is_published: publish,
    pdf_storage_path: objectPath(volume, lang)
  };

  const response = await fetch(`${url}/rest/v1/magazine_issues?on_conflict=volume_number,language`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal'
    },
    body: JSON.stringify(row)
  });

  if (!response.ok) {
    throw new Error(`Could not upsert ${volumeNumber}/${lang} (${response.status}): ${(await response.text()).slice(0, 300)}`);
  }
  console.log(`Registered ${volumeNumber} ${lang} (published: ${publish}).`);
}

async function uploadPdf(url, headers, pdfPath, target) {
  const encoded = target.split('/').map(encodeURIComponent).join('/');
  const response = await fetch(`${url}/storage/v1/object/${encodeURIComponent(BUCKET)}/${encoded}`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/pdf', 'x-upsert': 'true' },
    body: fs.readFileSync(pdfPath)
  });

  if (!response.ok) {
    throw new Error(`Upload failed for ${target} (${response.status}): ${(await response.text()).slice(0, 300)}`);
  }
  console.log(`Uploaded ${BUCKET}/${target}.`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const langs = options.lang ? [options.lang] : editionLanguages(options.volume);
  if (!langs.length) throw new Error(`No published editions found for ${options.volume}`);

  const config = options.generateOnly ? null : getSupabaseConfig();
  const headers = config
    ? { apikey: config.serviceRoleKey, Authorization: `Bearer ${config.serviceRoleKey}` }
    : null;
  if (config) await ensurePrivateBucket(config.url, headers);

  const outDir = path.join(ROOT, 'private-issues');
  fs.mkdirSync(outDir, { recursive: true });

  for (const lang of langs) {
    const pdfPath = path.join(outDir, `cosymagazine-${options.volume}-${lang}.pdf`);
    const { pages, bytes } = await buildPdf(options.volume, lang, pdfPath, false);
    console.log(`Built ${path.basename(pdfPath)} — ${pages} pages, ${(bytes / 1024).toFixed(0)} KB`);

    if (!config) continue;
    await uploadPdf(config.url, headers, pdfPath, objectPath(options.volume, lang));
    await upsertIssueRow(config.url, headers, options.volume, lang, `COSYmagazine ${options.volume} (${lang})`, options.publish);
    if (!options.keep) fs.unlinkSync(pdfPath);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`❌ ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { objectPath };
