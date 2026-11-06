# Build Pipeline

## Sources and generated files

Article content is authored in `posts/*.json`. The JSON post files are the source of truth; published HTML and metadata files are checked in because GitHub Pages serves the repository directly.

`npm run build` runs three steps:

1. `scripts/build-blog.js` validates posts and creates root-level `<slug>.html` pages, `posts.json`, `index.json`, and `podcast.xml`.
2. `scripts/generate-blog-art.js` creates Open Graph cover artwork in `og/`.
3. `scripts/generate-sitemap.js` creates `sitemap.xml` from the generated post index.

Draft posts (`"draft": true`) are excluded from published output.

## Checks

- `npm run validate` validates post JSON and required interface translations in `js/i18n/`.
- `npm test` runs the Node.js tests in `tests/*.mjs`.
- `npm run build` writes generated files. Review its diff before committing, especially if generated files already have local changes.

## Runtime assets

The article shell and shared styles live in `css/`; browser behavior lives in `js/`, including `js/stage/` for presentation and script modes. Interface translations live in `js/i18n/`. The video export utility is `scripts/export-stage-video.js` and requires FFmpeg plus Playwright Chromium.
