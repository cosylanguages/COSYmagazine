# Drafts awaiting native-speaker review

Expanded versions of the Top 10 verbs articles (and later the sentence frames) for Bashkir (ba), Breton (br),
Chuvash (cv), Armenian (hy), Georgian (ka) and Tatar (tt). They follow the structure of the fully expanded
French/Italian/Spanish articles but were written by an AI in languages where it is less reliable.

- These files are **not** built or published; the shorter articles in `posts/` stay live.
- Passages the writer was unsure of end with `⚠` — check those first.
- When a reviewer has approved a file, copy it over the matching file in `posts/`, remove any `⚠`, then run
  `python3 scripts/add_fulllists.py && python3 scripts/add_references.py && npm run build && node scripts/validate-blog-schema.js`.

## Status

| Language | Part 1 draft | Notes |
|---|---|---|
| Bashkir (ba) | ready for review | many ⚠ |
| Breton (br) | ready for review | very many ⚠ — low confidence, mutations need checking |
| Chuvash (cv) | ready for review | |
| Armenian (hy) | ready for review | |
| Georgian (ka) | ready for review | |
| Tatar (tt) | ready for review | |

Parts 2 and 3 and the "Stop translating" sentence frames have not been drafted for these languages.
The live Armenian, Georgian and Tatar Top 10 tables had their "go/can" rows shifted; row 8 ("go") was rewritten and marked ⚠.
