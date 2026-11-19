# Documentation

Everything about writing, building and publishing COSYmagazine. Start with the
folder that matches what you are trying to do.

| Folder | Read this when you want to… |
|---|---|
| [`authoring/`](authoring/) | write or edit an article, or understand the build pipeline |
| [`issues/`](issues/) | plan a monthly issue or check the August roster |
| [`publishing/`](publishing/) | upload a magazine PDF or set up Supabase |
| [`reference/`](reference/) | look up a field, a print rule, or the database schema |
| [`templates/`](templates/) | grab the podcast episode deck template |

## authoring

| File | What it covers |
|---|---|
| [BLOG_AUTHORING.md](authoring/BLOG_AUTHORING.md) | How to write a post JSON: blocks, presets, fields |
| [BLOG_PIPELINE.md](authoring/BLOG_PIPELINE.md) | What `npm run build` does, step by step |
| [BLOG_STATE.md](authoring/BLOG_STATE.md) | Where the editorial content currently stands |

## issues

| File | What it covers |
|---|---|
| [MAGAZINE_ISSUE_STRUCTURE.md](issues/MAGAZINE_ISSUE_STRUCTURE.md) | The editorial model: sections, editions, page counts |
| [ISSUE_08_AUGUST_COMPLETE_BLUEPRINT.md](issues/ISSUE_08_AUGUST_COMPLETE_BLUEPRINT.md) | The authoritative 31-page August roster |

`MAGAZINE_ISSUE_STRUCTURE.md` arbitrates disagreements between the blueprint,
the PDF builder and the catalog. When two sources disagree, it wins.

## publishing

| File | What it covers |
|---|---|
| [MAGAZINE_PDF_UPLOAD.md](publishing/MAGAZINE_PDF_UPLOAD.md) | Publishing a magazine PDF to Supabase storage |
| [SUPABASE_INTEGRATION_GUIDE.md](publishing/SUPABASE_INTEGRATION_GUIDE.md) | Auth, storage and RLS setup |

## reference

| File | What it covers |
|---|---|
| [SCHEMA.md](reference/SCHEMA.md) | The canonical post JSON schema |
| [PRINT_SPEC.md](reference/PRINT_SPEC.md) | Page geometry and print rules |
| [PODCAST_VIDEO.md](reference/PODCAST_VIDEO.md) | Rendering the stage/podcast video |
| [SUPABASE_SCHEMA.sql](reference/SUPABASE_SCHEMA.sql) | Database schema (mirror of `supabase/schema.sql`) |

## templates

`templates/CosyLanguages_Saturday_Mistakes_Episode_Template.pptx` — the deck used
to record a Saturday Mistakes episode.

---

For how the repository itself is laid out, see the top-level
[README](../README.md). For agent-facing build and test rules, see
[AGENTS.md](../AGENTS.md).
