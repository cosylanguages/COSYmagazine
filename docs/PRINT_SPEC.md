# COSYmagazine print specification

The numbers behind the paper edition. They live in code in `js/print-spec.js`
(one source of truth for the Studio, the page estimates and the tests). Confirm
every line with the chosen printer before the first run; printers differ.

## What we send the printer

| Item | Value |
| --- | --- |
| Trim size | A4, 210 × 297 mm |
| Bleed | 3 mm on every side (artwork 216 × 303 mm) |
| Safe margin | 10 mm inside the trim, plus 5 mm extra at the binding |
| Text area | 185 × 269 mm, two columns of about 90 mm |
| Body type | about 9.5 pt on 13.5 pt leading |
| Images | 300 dpi or more at print size. Vector SVG is fine |
| Colour | CMYK, total ink at most 300% |
| File | PDF/X-4 with fonts embedded |
| Inside pages | A multiple of 4 (16 is the most economical for sheetfed presses) |
| Cover | 4 pages (C1 to C4), separate from the inside page count |

Minimum raster image width: **2186 px** for a picture across the text area,
**2552 px** for a full-bleed picture across the page.

## One article, two editions

Every block can be set to **Digital and paper**, **Digital only** or **Paper only**
(the "Appears in" field on each block). Digital-only blocks (audio script lines,
quizzes that need clicking, link lists) are left out of the paper estimate and
the Print preview; paper-only blocks are left out of the website. Blocks with no
setting appear in both.

## Page estimates are estimates

The Studio estimates how many pages an article takes from its word count and the
kinds of blocks in it (images, quizzes, cards, tables). About 790 words fill a
text page after allowing for spacing and ragged lines. This is good enough to plan
an issue and to notice an article that is far too long or short. It is **not** a
layout proof.

After the first laid-out proof, enter the real page count in **Editorial, Paper
edition, Pages after layout proof**. That value is saved as `print.pages` and
replaces the estimate. If estimates are consistently off, adjust `LAYOUT` and
`BLOCK_PAGES` in `js/print-spec.js`.

## Planning an issue

Inside pages must be a multiple of 4. `planIssue` takes the page count of each
article and returns the inside page total, how many pages are left to fill (a
next-issue preview, a puzzle, an advertisement) and the total with cover.

## What is not automated

Be clear about these so nobody assumes otherwise:

- **No CMYK conversion.** The Studio does not convert colours or images. Convert
  in your layout tool when exporting.
- **No PDF/X preflight.** Run the printer's preflight profile or a preflight tool
  on the exported PDF.
- **No raster size check.** The Studio cannot read an image's pixel size from its
  URL, so it lists the width each raster image needs; check the files yourself.
- **No PDF export of the paper edition.** The Print preview shows the A4 text
  frame, safe area and estimated page breaks; the final layout is done in a
  layout tool.
- **Signature size** (4, 8 or 16 pages) and binding depend on the printer.
  Confirm before fixing the page count of an issue.

## Editorial workflow

Each article has a `status`: idea, assigned, drafting, in-review, fact-checked,
approved, published. Only `published` is live (`draft` is derived from it). A
signed-in user can set a status up to their role's limit (guest: drafting,
contributor: in-review, editor: approved, founder: published). The Studio only
reflects this; the database policy is the real gate.

The fact-check ledger (quotes verified, claims attributed, consent on file, image
licences recorded, no protected lyrics, proofread) is saved with the article. An
article about a real person cannot be published until consent is marked done. The
build validator enforces this too. See `SCHEMA.md`.
