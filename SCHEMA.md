# COSYmagazine Post Schema

This document specifies the canonical JSON/Object schema for blog posts within the COSYlanguages static publishing platform.

---

## 1. Top-Level Fields

| Field | Type | Required | Description | Example / Allowed Values |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `string` | Yes | Unique UUID or canonical string identifier for the post. | `"post-welcome-2026-001"` |
| `slug` | `string` | Yes | URL-friendly post slug (lowercase, hyphenated). | `"sample-authoring-guide"` |
| `language` | `string` | Yes | Language code of the post content. | `"en"`, `"fr"`, `"it"`, `"ru"`, `"el"`, `"es"`, `"de"`, `"pt"`, `"hy"`, `"ka"`, `"tt"`, `"ba"`, `"br"`, `"cv"` |
| `translationOf` | `string` | No | Slug of the base post of which this post is a translation variant. | `"replace-50-overused-phrases"` |
| `draft` | `boolean` | No | Whether the post is a draft (skipped in builds if `true`). | `true`, `false` |
| `desk` | `string` | Yes | Primary editorial desk key (localisable via UI i18n). | `"Front Page"`, `"Saturday Mistakes"`, `"COSYtalks"`, `"Grammar"`, `"Words"`, `"Grammar Made Cosy"`, `"Say It"`, `"Culture & Quotes"`, `"Long Reads"`, `"Cosy Events"`, `"The Podcast"`, `"Back Issues"`, `"Reflections"` |
| `format` | `string` | Yes | Article presentation format type. | `"list"`, `"essay"`, `"qa"`, `"ranking"`, `"photo-essay"`, `"quiz"`, `"quote-wall"` |
| `section` | `string` | No | Specific magazine section taxonomy (see `docs/MAGAZINE_ISSUE_STRUCTURE.md`). | `"founder_interview"`, `"learner_spotlight"`, `"words_core"`, `"grammar_cosy"`, `"saturday_mistakes"`, `"debatable_relatable"`, `"science_expander"`, `"greatest_quotes"`, `"wonder_column"`, `"mind_matters"`, `"life_with_without"`, `"if_you_were"`, `"cultural_salon"` |
| `level` | `string` | Yes | CEFR proficiency level targeted by the content. | `"A1"`, `"A2"`, `"B1"`, `"B2"`, `"C1"`, `"C2"`, `"A0–A1"`, `"A1–A2"`, `"B1–B2"`, `"C1–C2"`, `"A0–B2"` |
| `issue` | `object` | Yes for issue articles, optional for `evergreen` and `podcast-companion` | Magazine issue volume & title metadata object. Omit it entirely for standalone blog articles (do not invent a fake issue). | `{ "number": "Vol. 2026.08", "title": "Get ready for school" }` |
| `date` | `string` | Yes | Publication date in `YYYY-MM-DD` ISO format. | `"2026-09-10"` |
| `title` | `string` | Yes | Full article headline title. | `"Welcome to the COSY Editorial & Learning Corner"` |
| `kicker` | `string` | Yes | Uppercase editorial kicker tag line above title. | `"EDITORIAL ROOM"` |
| `dek` | `string` | Yes | Subheadline / article deck / summary description. | `"Welcome to our editorial room! Explore personal journal notes..."` |
| `tags` | `string[]` | Yes | Array of topic tags for filtering. | `["Welcome", "EcosystemUpdate", "LanguageLearning"]` |
| `readingTime` | `number` | Yes | Calculated reading duration in minutes. | `1` |
| `podcast` | `object` | No | Optional episode metadata. The validator requires a numeric `episode` when this object is present. | `{ "episode": 1, "audioUrl": "audio/welcome-podcast.mp3" }` |
| `artDirection`| `object` | Yes | Visual styling & stage direction metadata. | `{ "palette": ["#0d9488", "#faf7f2", "#1e293b"], "fonts": { "display": "Fraunces", "text": "DM Sans", "accent": "Fraunces Italic" }, "layout": "magazine-spread", "motif": "editorial-stars", "seed": "cosy-001", "coverOverride": null }` |
| `blocks` | `block[]` | Yes | Array of structured content blocks forming the body. | See Block Types below |
| `contentType` | `string` | No | What kind of piece this is. Posts without it are treated as issue articles. | `"issue-article"`, `"evergreen"`, `"podcast-companion"` |
| `status` | `string` | No | Editorial workflow stage. Anything other than `"published"` must also have `"draft": true`. | `"idea"`, `"assigned"`, `"drafting"`, `"in-review"`, `"fact-checked"`, `"approved"`, `"published"` |
| `workflow` | `object` | No | Owner, notes and the rights / fact-check ledger. See "Editorial workflow". | `{ "owner": "JY DM", "featuresRealPerson": false, "ledger": { "quotesVerified": "done" } }` |
| `print` | `object` | No | Press metadata for the paper edition. | `{ "pages": 2 }` |

---

## 2. Block Types (`blocks[]`)

Every block object MUST contain a `type` field matching one of the 13 valid block types listed below, plus type-specific payload properties.

In addition, **every block MAY include optional stage direction fields**:
- `say` (`string`): Spoken script text for audio narration/podcast read-aloud.
- `beat` (`object`): Stage directions for camera movement and visual animations, e.g.:
  ```json
  "beat": {
    "duration": 1200,
    "camera": "pan-zoom",
    "reveal": "fade-in",
    "target": "#block-1"
  }
  ```

### Allowed Block Types & Payloads

1. **`heading`**
   - `level` (`number`, 1-6): Heading hierarchy level.
   - `text` (`string`): Heading text content.
2. **`paragraph`**
   - `text` (`string`): Paragraph text content (may contain inline HTML/Markdown formatting).
3. **`list-item`**
   - `ordered` (`boolean`): Whether part of an ordered or unordered list.
   - `items` (`string[]`): List item strings.
4. **`table`**
   - `headers` (`string[]`): Table header column labels.
   - `rows` (`string[][]`): Table row cells array.
   - `caption` (`string`, optional): Display caption text.
5. **`example`**
   - `targetText` (`string`): Sentence or phrase in the target language.
   - `gloss` (`string`): Monolingual explanation or structural gloss.
   - `context` (`string`, optional): Usage context or situation.
6. **`pronunciation`**
   - `word` (`string`): Target word or phrase.
   - `ipa` (`string`): International Phonetic Alphabet transcript.
   - `audioUrl` (`string`, optional): Relative URL to audio file.
7. **`pullquote`**
   - `quote` (`string`): Quote text.
   - `attribution` (`string`, optional): Speaker or author name.
8. **`image`**
   - `url` (`string`): Relative image URL.
   - `alt` (`string`): Alt text for accessibility.
   - `caption` (`string`, optional): Display caption text.
9. **`quiz`**
   - `question` (`string`): Quiz question prompt.
   - `options` (`string[]`): Answer option choices.
   - `correctIndex` (`number`): Zero-based index of correct answer.
   - `explanation` (`string`): Pedagogical explanation.
10. **`culture-bite`**
    - `title` (`string`): Title of the cultural note.
    - `content` (`string`): Cultural context description.
11. **`quote-wall`**
    - `quotes` (`object[]`): Array of `{ "quote": string, "author": string }` objects.
12. **`mistake-card`** (Saturday Mistakes pattern)
    - `title` (`string`): Name of the mistake, e.g. "Future forms".
    - `wrong` (`string`): The "not quite" sentence (include quotation marks).
    - `right` (`string`): The corrected sentence.
    - `rule` (`string`): One-sentence rule.
    - `number` (`number | string`, optional): Shown as 01, 02…
    - `why` (`string`, optional): Why learners make this mistake.
    - `examples` (`string[]`, optional): Short extra examples.
    - `quiz` (`object`, optional): `{ question, options[], correctIndex, explanation }`, rendered as an interactive "Your turn".
    - `labels` (`object`, optional): Localised UI labels `{ wrong, right, why, rule, examples, turn }` (defaults are English).
13. **`links`**
    - `destination` (`string`): Ecosystem destination (`"cosydata"`, `"cosytools"`, `"events"`, `"practice"`).
    - `url` (`string`): Target link URL.
    - `label` (`string`): Link anchor display label.

---

## 3. Standalone articles, editorial workflow and print

### Standalone articles

Set `"contentType": "evergreen"` (or `"podcast-companion"`) and leave `issue` out. The build never files such a post under a volume, and the website shows only the article's own title in the masthead. Issue articles keep `"contentType": "issue-article"` (or no `contentType`) and must have an `issue`.

### Editorial workflow

`status` moves an article from idea to publication: `idea → assigned → drafting → in-review → fact-checked → approved → published`. The build still uses `draft` as its only gate, so the validator enforces that every status other than `published` has `"draft": true`, and that `published` is not a draft. An article therefore cannot go live by accident while it is still in review.

`workflow` holds the rest of the editorial record:

- `owner` (`string`): who is responsible for the article.
- `notes` (`string`): free-form editorial notes.
- `featuresRealPerson` (`boolean`): set to `true` for interviews, spotlights and any story about a real learner or teacher. When `status` is `published`, the validator requires `ledger.consentOnFile` to be `"done"`.
- `ledger` (`object`): each key is `"todo"`, `"done"` or `"na"`: `quotesVerified`, `claimsAttributed`, `consentOnFile`, `imageLicencesRecorded`, `noProtectedLyrics`, `proofread`. These mirror the verification rules in `docs/MAGAZINE_ISSUE_STRUCTURE.md`. Only `consentOnFile` blocks publication in the validator; the Studio warns about the rest.

### Paper edition

- `print.pages` (`number`, optional): overrides the Studio's page estimate once a layout proof exists.
- Block `medium` (`"both"` | `"digital"` | `"print"`, optional, default `both`): `print` blocks (for example a printable crossword) are left out of the website and the read-aloud script; `digital` blocks (audio, interactive quizzes) are left out of the print preview.

The full press specification is in `docs/PRINT_SPEC.md`.

---

## 4. Validation Enforcement

The validator checks required fields, allowed languages/desks/formats/block types, content type, status/draft consistency, the consent rule for real people, and block-specific structure. Run it with:

```bash
node scripts/validate-blog-schema.js
```
The script inspects JSON post files in `posts/` and required interface keys in `js/i18n/`. It exits with code `0` if validation passes, or `1` if validation fails. Some descriptive conventions in this document (for example, tag element types and optional block properties) are not currently enforced by the validator.
