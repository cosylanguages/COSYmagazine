#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const REPO_ROOT = path.resolve(__dirname, '..');
const SOURCE_HTML = path.join(REPO_ROOT, 'private-issues', 'august-2026.html');
const DEFAULT_OUTPUT = path.join(REPO_ROOT, 'private-issues', 'august-2026.pdf');
const BUCKET = process.env.SUPABASE_BUCKET || 'magazine-editions';
const ISSUE_VOLUME_NUMBER = 'Vol. 2026.08';

function parseArgs() {
  const args = process.argv.slice(2);
  const options = { output: DEFAULT_OUTPUT, generateOnly: false };

  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === '--generate-only') {
      options.generateOnly = true;
    } else if (args[index] === '--output' && args[index + 1]) {
      options.output = path.resolve(process.cwd(), args[++index]);
    } else {
      throw new Error('Usage: npm run publish:issue:pdf [-- --generate-only] [--output <file>]');
    }
  }

  return options;
}

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the trusted environment to upload.');
  }
  if (serviceRoleKey.split('.').length !== 3) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY must be the JWT-formatted service_role key, not an sb_secret API key.');
  }

  const parsedUrl = new URL(url);
  if (parsedUrl.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(parsedUrl.hostname)) {
    throw new Error('SUPABASE_URL must use HTTPS.');
  }

  return { url: url.replace(/\/+$/, ''), serviceRoleKey };
}

async function generatePdf(outputPath) {
  if (!fs.existsSync(SOURCE_HTML)) throw new Error(`Missing source HTML: ${SOURCE_HTML}`);

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(pathToFileURL(SOURCE_HTML).href, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);

    const pageCount = await page.locator('section.page').count();
    if (pageCount !== 24) throw new Error(`Expected 24 magazine pages; found ${pageCount}.`);

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    await page.pdf({
      path: outputPath,
      printBackground: true,
      preferCSSPageSize: true
    });
  } finally {
    await browser.close();
  }

  const pdf = fs.readFileSync(outputPath);
  if (pdf.length < 10_000 || pdf.subarray(0, 5).toString() !== '%PDF-') {
    throw new Error('Generated output is not a valid PDF.');
  }
  console.log(`Generated ${outputPath} (${pdf.length} bytes).`);
}

async function ensurePrivateBucket(url, headers) {
  const bucketUrl = `${url}/storage/v1/bucket/${encodeURIComponent(BUCKET)}`;
  const response = await fetch(bucketUrl, { headers });
  const details = await response.json().catch(() => ({}));

  if (response.ok) {
    if (details.public === true) {
      throw new Error(`Bucket "${BUCKET}" is public; refusing to upload a premium issue.`);
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
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: false })
  });
  if (!createResponse.ok) {
    const message = (await createResponse.text()).slice(0, 300);
    throw new Error(`Could not create private bucket (${createResponse.status}): ${message}`);
  }
  console.log(`Created private bucket "${BUCKET}".`);
}

async function getIssueConfig(url, headers) {
  const query = new URLSearchParams({
    select: 'id,volume_number,is_published,pdf_storage_path',
    volume_number: `eq.${ISSUE_VOLUME_NUMBER}`
  });
  const response = await fetch(`${url}/rest/v1/magazine_issues?${query}`, { headers });
  if (!response.ok) {
    const message = (await response.text()).slice(0, 300);
    throw new Error(`Could not read issue configuration (${response.status}): ${message}`);
  }

  const rows = await response.json();
  if (!Array.isArray(rows) || rows.length !== 1) {
    throw new Error(`Expected one magazine_issues row for "${ISSUE_VOLUME_NUMBER}"; found ${rows?.length ?? 0}.`);
  }

  const objectPath = rows[0].pdf_storage_path;
  if (
    typeof objectPath !== 'string' ||
    !objectPath.startsWith('issues/') ||
    !objectPath.toLowerCase().endsWith('.pdf') ||
    objectPath.includes('..')
  ) {
    throw new Error(`Set pdf_storage_path for "${ISSUE_VOLUME_NUMBER}" to a PDF path under issues/.`);
  }
  return objectPath;
}

async function uploadPdf(url, headers, pdfPath, objectPath) {
  const encodedPath = objectPath.split('/').map(encodeURIComponent).join('/');
  const response = await fetch(`${url}/storage/v1/object/${encodeURIComponent(BUCKET)}/${encodedPath}`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/pdf',
      'x-upsert': 'true'
    },
    body: fs.readFileSync(pdfPath)
  });

  if (!response.ok) {
    const message = (await response.text()).slice(0, 300);
    throw new Error(`PDF upload failed (${response.status}): ${message}`);
  }
  console.log(`Uploaded ${BUCKET}/${objectPath} to private storage.`);
}

async function main() {
  const options = parseArgs();
  if (!options.generateOnly) getSupabaseConfig();

  await generatePdf(options.output);
  if (options.generateOnly) return;

  const { url, serviceRoleKey } = getSupabaseConfig();
  const headers = { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` };
  await ensurePrivateBucket(url, headers);
  const objectPath = await getIssueConfig(url, headers);
  await uploadPdf(url, headers, options.output, objectPath);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});