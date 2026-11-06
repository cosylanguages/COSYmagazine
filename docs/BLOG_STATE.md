# Repository Map

## Content and publishing

- `posts/*.json` is the canonical source for article content.
- Root-level article HTML, `posts.json`, `index.json`, `podcast.xml`, `sitemap.xml`, and `og/` artwork are generated publishing artifacts and are checked in for GitHub Pages.
- `index.html`, `podcast.html`, and `issues.html` are the main editorial views. `editor.html` is the in-repository authoring interface.

## Application assets

- `css/` contains shared styles and page-specific styling.
- `js/` contains the newsstand, article shell, editor, internationalization, podcast, flipbook, and stage-mode code.
- `fonts/` and `images/` hold local type and editorial artwork.
- `dev/` contains development demos; `audio-scripts/` contains recording scripts.

## Maintenance

- `scripts/` contains build, generation, validation, and content-maintenance utilities.
- `tests/` contains Node.js and Playwright coverage.
- `docs/` contains authoring, schema, pipeline, issue-structure, and media-export guidance.

The generated HTML alongside JSON sources is intentional: JSON is edited, while the HTML is the deployable static site. Do not remove either side as a presumed duplicate.
