#!/usr/bin/env node

/**
 * Upload Magazine PDF directly to Supabase Storage & Database
 *
 * Can be run from GitHub Actions, automated CI/CD pipelines, or scripts.
 *
 * Usage:
 *   node scripts/upload-pdf-to-supabase.js --file <path-to-pdf> [--volume "Vol. 2026.08"] [--title "Issue Title"]
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_BUCKET = process.env.SUPABASE_BUCKET || 'magazine-editions';

function parseArgs(args = process.argv.slice(2)) {
  const options = {
    file: null,
    volume: null,
    title: null,
    storagePath: null,
    publish: true
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--file' && args[i + 1]) {
      options.file = path.resolve(process.cwd(), args[++i]);
    } else if (arg === '--volume' && args[i + 1]) {
      options.volume = args[++i];
    } else if (arg === '--title' && args[i + 1]) {
      options.title = args[++i];
    } else if (arg === '--storage-path' && args[i + 1]) {
      options.storagePath = args[++i];
    } else if (arg === '--draft') {
      options.publish = false;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Usage: node scripts/upload-pdf-to-supabase.js --file <path-to-pdf> [options]

Options:
  --file <path>          Path to the PDF file to upload (required)
  --volume <string>      Volume number (e.g. "Vol. 2026.08")
  --title <string>       Title of the issue
  --storage-path <path>  Target storage path (defaults to issues/<filename>.pdf)
  --draft                Do not mark issue as published
`);
      process.exit(0);
    }
  }

  return options;
}

function deriveVolumeFromFilename(filepath) {
  const basename = path.basename(filepath, path.extname(filepath));
  // Matches patterns like "2026-08", "2026.08", "vol-2026-08", "Vol-2026.08"
  const match = basename.match(/(?:vol[-._]?)?(\d{4})[-._](\d{2})/i);
  if (match) {
    return `Vol. ${match[1]}.${match[2]}`;
  }
  return null;
}

function validatePdfFile(filepath) {
  if (!filepath) {
    throw new Error('A PDF file path must be provided via --file <path>');
  }
  if (!fs.existsSync(filepath)) {
    throw new Error(`File does not exist: ${filepath}`);
  }
  const stat = fs.statSync(filepath);
  if (stat.size < 100) {
    throw new Error(`File is too small (${stat.size} bytes) to be a valid PDF: ${filepath}`);
  }
  const buffer = fs.readFileSync(filepath);
  if (buffer.subarray(0, 5).toString() !== '%PDF-') {
    throw new Error(`File is not a valid PDF (missing %PDF- magic bytes): ${filepath}`);
  }
  return buffer;
}

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables to upload.');
  }

  const parsedUrl = new URL(url);
  if (parsedUrl.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(parsedUrl.hostname)) {
    throw new Error('SUPABASE_URL must use HTTPS.');
  }

  return {
    url: url.replace(/\/+$/, ''),
    serviceRoleKey,
    bucket: DEFAULT_BUCKET
  };
}

async function ensurePrivateBucket(url, headers, bucket) {
  const bucketUrl = `${url}/storage/v1/bucket/${encodeURIComponent(bucket)}`;
  const response = await fetch(bucketUrl, { headers });
  const details = await response.json().catch(() => ({}));

  if (response.ok) {
    if (details.public === true) {
      throw new Error(`Bucket "${bucket}" is public; refusing to upload a premium issue.`);
    }
    return;
  }

  const missing = response.status === 404 ||
    (response.status === 400 && (details.code === 'NoSuchBucket' || details.statusCode === '404'));
  if (!missing) {
    throw new Error(`Could not inspect bucket (${response.status}): ${JSON.stringify(details).slice(0, 300)}`);
  }

  const createResponse = await fetch(`${url}/storage/v1/bucket`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: bucket, name: bucket, public: false })
  });
  if (!createResponse.ok) {
    const message = (await createResponse.text()).slice(0, 300);
    throw new Error(`Could not create private bucket (${createResponse.status}): ${message}`);
  }
  console.log(`Created private bucket "${bucket}".`);
}

async function uploadPdfBuffer(url, headers, bucket, objectPath, buffer) {
  const encodedPath = objectPath.split('/').map(encodeURIComponent).join('/');
  const response = await fetch(`${url}/storage/v1/object/${encodeURIComponent(bucket)}/${encodedPath}`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/pdf',
      'x-upsert': 'true'
    },
    body: buffer
  });

  if (!response.ok) {
    const message = (await response.text()).slice(0, 300);
    throw new Error(`PDF upload failed (${response.status}): ${message}`);
  }
  console.log(`✅ Uploaded ${bucket}/${objectPath} (${buffer.length} bytes) to Supabase Storage.`);
}

async function syncMagazineIssueRecord(url, headers, { volumeNumber, objectPath, title, publish }) {
  if (!volumeNumber) return;

  const query = new URLSearchParams({
    select: 'id,volume_number,is_published,pdf_storage_path',
    volume_number: `eq.${volumeNumber}`
  });
  const getRes = await fetch(`${url}/rest/v1/magazine_issues?${query}`, { headers });
  if (!getRes.ok) {
    console.warn(`Could not query magazine_issues (${getRes.status}); skipping issue table update.`);
    return;
  }

  const rows = await getRes.json();
  if (Array.isArray(rows) && rows.length > 0) {
    const issueId = rows[0].id;
    const patchRes = await fetch(`${url}/rest/v1/magazine_issues?id=eq.${encodeURIComponent(issueId)}`, {
      method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify({
        pdf_storage_path: objectPath,
        is_published: publish
      })
    });
    if (patchRes.ok) {
      console.log(`✅ Updated magazine_issues entry for ${volumeNumber} (path: ${objectPath}).`);
    } else {
      console.warn(`Could not update magazine_issues entry (${patchRes.status}).`);
    }
  } else {
    // Generate canonical id from volume number e.g. "vol-2026-08"
    const canonicalId = volumeNumber.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const insertRes = await fetch(`${url}/rest/v1/magazine_issues`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify({
        id: canonicalId || `issue-${Date.now()}`,
        volume_number: volumeNumber,
        title: title || volumeNumber,
        pdf_storage_path: objectPath,
        is_published: publish
      })
    });
    if (insertRes.ok) {
      console.log(`✅ Created magazine_issues entry for ${volumeNumber} (path: ${objectPath}).`);
    } else {
      console.warn(`Could not insert magazine_issues entry (${insertRes.status}).`);
    }
  }
}

async function uploadMagazinePdf(options = {}) {
  const buffer = validatePdfFile(options.file);
  const config = getSupabaseConfig();
  const headers = {
    apikey: config.serviceRoleKey,
    Authorization: `Bearer ${config.serviceRoleKey}`
  };

  const volumeNumber = options.volume || deriveVolumeFromFilename(options.file);
  let objectPath = options.storagePath;
  if (!objectPath) {
    const filename = path.basename(options.file);
    objectPath = `issues/${filename}`;
  }
  if (!objectPath.startsWith('issues/')) {
    objectPath = `issues/${objectPath}`;
  }

  await ensurePrivateBucket(config.url, headers, config.bucket);
  await uploadPdfBuffer(config.url, headers, config.bucket, objectPath, buffer);
  await syncMagazineIssueRecord(config.url, headers, {
    volumeNumber,
    objectPath,
    title: options.title,
    publish: options.publish !== false
  });

  return {
    bucket: config.bucket,
    storagePath: objectPath,
    volumeNumber
  };
}

if (require.main === module) {
  const options = parseArgs();
  uploadMagazinePdf(options).catch((err) => {
    console.error(`❌ Upload failed: ${err.message}`);
    process.exit(1);
  });
}

module.exports = {
  parseArgs,
  deriveVolumeFromFilename,
  validatePdfFile,
  getSupabaseConfig,
  uploadMagazinePdf
};
