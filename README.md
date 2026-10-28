# COSYmagazine 🌿

**COSYmagazine**: short, speaking-first reads for language learners (words, grammar made cosy, sentence frames, podcast), in English, French, Italian, Russian and Greek.

**Live:** https://cosylanguages.github.io/COSYmagazine/

Part of the COSY ecosystem. Hub: [COSYlanguages](https://github.com/cosylanguages/COSYlanguages) · Practice: [COSYpractice](https://github.com/cosylanguages/COSYpractice) · Tools: [COSYtools](https://github.com/cosylanguages/COSYtools).

## How it works
Every article is one JSON file in `posts/`, validated against `SCHEMA.md`. A build turns them into static pages. **Adding an article needs no code change.**

```bash
npm install
npm run build      # posts → <slug>.html, index.json, posts.json, covers (og/), podcast.xml, sitemap.xml
npm test           # node --test style checks in tests/*.mjs
```

1. Add `posts/<slug>.json` (see `docs/BLOG_AUTHORING.md`; a translation sets `translationOf` to the base slug).
2. `npm run build`, then commit the generated files (GitHub Pages serves them as they are).

Set `"draft": true` to keep a post out of the site.

## Structure
| Path | What |
|---|---|
| `index.html` | Newsstand: latest issue, search, filters (desk, language, issue). State lives in the URL (`?desk=Words&lang=fr`). Translations are grouped under their article |
| `podcast.html` | Podcast desk |
| `posts/*.json` | Source of truth |
| `<slug>.html`, `index.json`, `posts.json`, `og/` | Generated, do not edit by hand |
| `scripts/` | Build, validation, cover art, RSS, sitemap |
| `css/`, `js/`, `fonts/` | Design layer (shared COSY tokens, self-hosted Fraunces, Literata, Commissioner), shell, stage mode, flipbook |
| `js/i18n/*.json` | Interface strings for the newsstand and post chrome |
| `dev/` | Dev-only pages (cover art contact sheet, stage demo) |

## Reading modes
Append `?stage=1` (16:9 presentation) or `?script=1` (teleprompter) to any article URL.

## Audio
Episodes are linked only when the file exists at `audio/<slug>.mp3` (or `podcast.audioUrl` is an absolute URL). Until then an article shows "recording in production" and is left out of `podcast.xml`.

© 2020–2026 COSY Languages. All rights reserved.
