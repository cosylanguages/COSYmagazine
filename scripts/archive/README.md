# Archived scripts

These scripts generated the current contents of `posts/*.json` in a single bulk pass.
They are kept because they document how the content was produced, but nothing calls
them and no package script runs them.

| File | What it did |
|---|---|
| `generate_posts_data.py` | Built the initial Top 10 verbs posts for every language |
| `update_all_posts.py` | Rewrote those posts with richer `verbs_data.json` content |
| `update_stop_translating_posts.py` | Generated the "Stop Translating" sentence-frame series |
| `verbs_data.json` | The conjugation data `update_all_posts.py` read |

**Do not run these against the current tree.** They overwrite `posts/*.json`
wholesale and would discard every edit made since, including hand-expanded
articles and the August issue fixes.

For the supported workflow, use `npm run build` and edit `posts/*.json` directly.
Bulk edits that need to stay repeatable belong in `scripts/content/`.
