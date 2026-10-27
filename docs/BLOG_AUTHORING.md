# COSYlanguages Blog Post Authoring Guide (`docs/BLOG_AUTHORING.md`)

This document is the definitive authoring specification and schema reference for creating, editing, and publishing blog posts on the COSYlanguages platform.

---

## 1. Overview & Architecture

Blog publishing in COSYlanguages follows a **zero-code, single-source-of-truth JSON pipeline**:

- **Source Location**: `blog/posts/*.json`
- **Canonical Format**: Every article is written as a structured JSON object adhering to `blog/SCHEMA.md`.
- **Zero-Code Publishing**: Adding a new blog post requires **zero code changes** to index files, CSS, or JS templates. Simply add a JSON file under `blog/posts/` and run the build script.
- **Build Pipeline**: Executing `node scripts/build-blog.js` automatically:
  1. Validates post schema and field constraints.
  2. Renders standalone, static HTML post pages in `blog/{slug}.html`.
  3. Compiles the newsstand index at `blog/posts.json` and `blog/index.json`.
  4. Generates Open Graph procedural cover art in `blog/og/{slug}.svg`.
  5. Updates the podcast RSS feed at `blog/podcast.xml`.

---

## 2. Top-Level Metadata Fields

Each post JSON file MUST contain the following top-level fields:

| Field | Type | Required | Description | Allowed / Example Values |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `string` | Yes | Unique string identifier. | `"post-2026-top100-en"` |
| `slug` | `string` | Yes | URL-friendly slug used for HTML page and SVG cover. | `"top-100-a0-a1-english"` |
| `language` | `string` | Yes | ISO 639-1 code of the article content. | `"en"`, `"fr"`, `"it"`, `"ru"`, `"el"`, `"es"`, `"de"`, `"pt"`, `"hy"`, `"ka"`, `"tt"`, `"ba"`, `"br"` |
| `translationOf` | `string` | No | Base post slug if this is a language variant. | `"top-100-a0-a1"` |
| `draft` | `boolean` | No | When `true`, post is excluded from production builds. | `false` |
| `desk` | `string` | Yes | Editorial desk classification. | `"Front Page"`, `"Words"`, `"Grammar Made Cosy"`, `"Say It"`, `"Culture & Quotes"`, `"Long Reads"`, `"Cosy Events"`, `"The Podcast"`, `"Back Issues"`, `"Reflections"` |
| `format` | `string` | Yes | Vogue/Gazette layout format. | `"list"`, `"essay"`, `"qa"`, `"ranking"`, `"photo-essay"`, `"quiz"`, `"quote-wall"` |
| `level` | `string` | Yes | CEFR target level. | `"A0–A1"`, `"A1"`, `"A2"`, `"B1"`, `"B2"`, `"C1"`, `"C2"`, `"A0–B2"` |
| `issue` | `object` | Yes | Magazine volume and issue title object. | `{ "number": "Vol. 2026.08", "title": "Get ready for school" }` |
| `date` | `string` | Yes | Publication date (`YYYY-MM-DD`). | `"2026-08-15"` |
| `title` | `string` | Yes | Primary headline title. | `"Top 100 Essential Words for Beginners"` |
| `kicker` | `string` | Yes | Uppercase editorial category kicker. | `"FOUNDATIONAL VOCABULARY"` |
| `dek` | `string` | Yes | Article subheadline / summary deck. | `"Master the core 100 words every learner needs for everyday conversation."` |
| `tags` | `string[]` | Yes | Topic tags for filtering. | `["Vocabulary", "Top 10 / Top 100", "A0–A1"]` |
| `readingTime` | `number` | Yes | Reading time in minutes. | `5` |
| `podcast` | `object` | Yes | Podcast metadata or audio player reference. | `{ "episode": 1, "audioUrl": "audio/top100-en.mp3" }` |
| `artDirection` | `object` | Yes | Design system palette, typography, and motif. | See Art Direction Object below |
| `blocks` | `block[]` | Yes | Sequential array of content blocks. | See Content Block Types below |

### Art Direction Object (`artDirection`)
```json
"artDirection": {
  "palette": ["#0d9488", "#faf7f2", "#1e293b"],
  "fonts": {
    "display": "Fraunces",
    "text": "DM Sans",
    "accent": "Fraunces Italic"
  },
  "layout": "magazine-spread",
  "motif": "paper-cut",
  "seed": "top-100-en-2026",
  "coverOverride": null
}
```

---

## 3. Content Block Types & Stage Directions

Articles are composed of an ordered array of block objects.

### Stage Directions (`say` & `beat`)
Every block MAY include optional stage direction properties for automated audio narration and Stage Mode presentation decks:
- `say` (`string`): Spoken text script for teleprompter mode (`?script=1`) and audio narration.
- `beat` (`object`): Visual camera and animation directions for Stage Mode (`?stage=1`):
  ```json
  "beat": {
    "duration": 1500,
    "camera": "pan-zoom",
    "reveal": "fade-in",
    "target": "#block-3"
  }
  ```

### Valid Block Types

1. **`heading`**: Section headers.
   - `level` (1–6), `text` (string).
2. **`paragraph`**: Body paragraphs.
   - `text` (string, supports semantic HTML elements like `<strong>` or `<em>`).
3. **`list-item`**: Bulleted or numbered lists.
   - `ordered` (boolean), `items` (array of strings).
4. **`table`**: Data or comparison tables.
   - `headers` (string[]), `rows` (string[][]), `caption` (optional string).
5. **`example`**: Target language usage examples.
   - `targetText` (string), `gloss` (string), `context` (optional string).
6. **`pronunciation`**: Phonetic transcriptions and audio triggers.
   - `word` (string), `ipa` (string), `audioUrl` (optional string).
7. **`pullquote`**: Editorial quote blocks.
   - `quote` (string), `attribution` (optional string).
8. **`image`**: Visual assets with captions and accessibility tags.
   - `url` (string), `alt` (string), `caption` (optional string).
9. **`quiz`**: Embedded Concept Checking Questions (CCQs) and practice items.
   - `question` (string), `options` (string[]), `correctIndex` (number), `explanation` (string).
10. **`culture-bite`**: Cultural background or regional notes.
    - `title` (string), `content` (string).
11. **`quote-wall`**: Multi-quote editorial grids.
    - `quotes` (array of `{ "quote": string, "author": string }`).
12. **`links`**: Ecosystem navigation callouts.
    - `destination` ("cosydata" | "cosytools" | "events" | "practice"), `url` (string), `label` (string).

---

## 4. Step-by-Step Publishing & Validation Workflow

1. **Create the JSON file**:
   Save a new JSON file in `blog/posts/{slug}.json`.

2. **Validate Schema**:
   Run the schema validator to verify syntax, required fields, and block structures:
   ```bash
   node scripts/validate-blog-schema.js
   ```

3. **Build Blog HTML & Assets**:
   Execute the static blog compiler:
   ```bash
   node scripts/build-blog.js
   ```
   This generates the HTML page in `blog/{slug}.html`, updates `blog/posts.json` and `blog/index.json`, and generates procedural cover art in `blog/og/{slug}.svg`.

4. **Verify Tests**:
   Run the automated blog test suite:
   ```bash
   node --test tests/test_blog_schema.mjs tests/test_blog_index.mjs tests/test_blog_magazine.mjs
   ```

---

## 5. Worked Example Post

Below is a complete, minimal, valid example of a blog post JSON file (`blog/posts/sample-authoring-guide.json`):

```json
{
  "id": "post-sample-authoring-001",
  "slug": "sample-authoring-guide",
  "language": "en",
  "draft": false,
  "desk": "Front Page",
  "format": "essay",
  "level": "A0–A1",
  "issue": {
    "number": "Vol. 2026.08",
    "title": "Get ready for school"
  },
  "date": "2026-08-01",
  "title": "Welcome to COSYmagazine Publishing",
  "kicker": "EDITORIAL GUIDE",
  "dek": "A practical walkthrough of creating content with the COSY single-source JSON pipeline.",
  "tags": ["Guide", "Top 10 / Top 100", "EcosystemUpdate"],
  "readingTime": 2,
  "podcast": {
    "episode": 1,
    "audioUrl": "audio/sample-authoring-guide.mp3"
  },
  "artDirection": {
    "palette": ["#0d9488", "#faf7f2", "#1e293b"],
    "fonts": {
      "display": "Fraunces",
      "text": "DM Sans",
      "accent": "Fraunces Italic"
    },
    "layout": "magazine-spread",
    "motif": "paper-cut",
    "seed": "sample-guide-2026",
    "coverOverride": null
  },
  "blocks": [
    {
      "type": "heading",
      "level": 2,
      "text": "1. Simple, Single-Source Publishing",
      "say": "Section one: Simple, Single-Source Publishing.",
      "beat": {
        "duration": 1000,
        "camera": "pan-zoom",
        "reveal": "fade-in"
      }
    },
    {
      "type": "paragraph",
      "text": "Publishing on COSYmagazine requires no HTML coding. Authors create a structured JSON post in <code>blog/posts/</code> and run the build script.",
      "say": "Publishing on COSYmagazine requires no HTML coding. Authors create a structured JSON post and run the build script."
    },
    {
      "type": "example",
      "targetText": "Bonjour, comment ça va ?",
      "gloss": "Hello, how are you?",
      "context": "Informal greeting among peers.",
      "say": "Example: Bonjour, comment ça va?"
    },
    {
      "type": "quiz",
      "question": "Which folder holds the canonical source JSON files for blog posts?",
      "options": ["/blog/posts/", "/blog/html/", "/blog/src/"],
      "correctIndex": 0,
      "explanation": "All canonical post JSON files are located in blog/posts/.",
      "say": "Quick check: Which folder holds canonical post files?"
    }
  ]
}
```

## Rich blocks: diagrams, cards and page breaks

Any block may carry optional fields that only affect the **web page**. Stage mode and the Teleprompter always use the plain `text` / `items`, so these blocks stay readable everywhere.

| Field | Where | What it does |
| --- | --- | --- |
| `html` | any block | Rich web rendering (verb cards, figures, scales). `text` / `items` remain the plain fallback for Stage & Script. |
| `webOnly: true` | any block | Shown on the page only; removed from Stage / Script data (use for page-break hints). |
| `stageOnly: true` | any block | Used by Stage / Script only; not rendered on the page (use for headings already inside an `html` card). |

Ready-made component classes live in `css/article-visuals.css`: `vcard` (verb card), `cosy-fig` (figure frame), `flow3`, `dtree`, `collo`, `scale`, `ba` (before/after), `plan7`.
To force a page turn in the flipbook, add a block `{ "type": "paragraph", "webOnly": true, "html": "<div class=\"page-break-hint\"></div>", "text": "" }`.

Quiz blocks are interactive: the answer is revealed only after the reader taps an option.

## Podcast episodes are always embedded

Paste **one link** per episode in `podcast`: `externalUrl` (Spotify, Spotify for Podcasters, Apple Podcasts, YouTube) or `iframeUrl` (an existing embed address such as Mave).
`js/podcast-embed.js` turns it into the right player for both the static page and the browser. If no valid link is set, the page shows the "recording in production" notice and the build prints a warning.

## Newsstand languages

The home page shows cards in **English, French, Italian, Russian and Greek**, following the language selected in the site navigation. Articles with no version in that language show the original, tagged "Only in English".
