# content/

Post sources, grouped the way the magazine is actually organised.

```
content/
  issues/
    2026-08/            # one folder per published volume
      posts/*.json      # articles that belong to that issue (built)
      drafts/*.json     # staged variants for that issue (never built)
  website/
    front-page/         # evergreen site-only pages
    saturday-mistakes/  # site-only series, not part of any issue
```

## Rules

- A post belongs in the folder that matches its `issue.number`. Monthly volumes use
  `YYYY-MM` (`Vol. 2026.08` → `issues/2026-08`). Content with no issue — the Saturday
  Mistakes series, the welcome page — lives under `website/<desk>/`.
- `drafts/` is never read by the build. `scripts/build/lib/content-paths.js` skips any
  directory with that name, so staged files cannot leak into the site.
- The **generated output is independent of these folders.** Pages are written to
  `<slug>.html` at the repository root, so moving a source file never changes a URL.
  `tests/test_build_integrity.mjs` and `tests/test_blog_equivalence.mjs` guard this.
- `content-manifest.json` (generated) maps each slug to its source path so the studio
  in `editor.html` can load posts. Do not hand-edit it.

## Adding a new issue

Create `content/issues/<YYYY-MM>/posts/`, add the posts with a matching
`issue.number`, then register the volume in `ISSUE_META`
(`scripts/build/lib/issues.js`). Run `npm run build`.
