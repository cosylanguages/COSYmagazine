import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const CATALOG = pathToFileURL(path.join(process.cwd(), 'issues-catalog.html')).href;
const LANGS = ['en', 'fr', 'it', 'ru', 'el'];

// The cover fits its text with an estimate, and the real fonts can differ from it. These
// assertions measure the rendered glyphs, so a bad estimate or an untranslated line fails
// here instead of shipping a cover whose text runs over the subject or off the canvas.
for (const lang of LANGS) {
  test(`issue covers keep their layout in ${lang}`, async ({ page }) => {
    await page.goto(CATALOG);
    await page.evaluate((l) => localStorage.setItem('cosy_ui_lang', l), lang);
    await page.reload();
    await page.waitForTimeout(600);

    const problems = await page.evaluate(() => {
      const issues = [];
      document.querySelectorAll('.cat-issue-cover').forEach((cover) => {
        const svg = cover.querySelector('svg');
        if (!svg) {
          issues.push({ issue: '?', problem: 'no svg' });
          return;
        }
        const W = svg.viewBox.baseVal.width;
        const name = cover.closest('.cat-issue')?.dataset.issue || '?';

        cover.querySelectorAll('text').forEach((t) => {
          const bb = t.getBBox();
          if (bb.width === 0) return;
          if (bb.x < -1 || bb.x + bb.width > W + 1) {
            issues.push({ issue: name, problem: `text off canvas: ${t.textContent.slice(0, 24)}` });
          }
        });

        cover.querySelectorAll('.vc-cover-line text').forEach((t) => {
          const bb = t.getBBox();
          if (bb.width === 0) return;
          const anchor = t.getAttribute('text-anchor');
          if (anchor === 'start' && bb.x + bb.width > W * 0.42 + 3) {
            issues.push({ issue: name, problem: `left line past centre: ${t.textContent.slice(0, 24)}` });
          }
          if (anchor === 'end' && bb.x < W * 0.58 - 3) {
            issues.push({ issue: name, problem: `right line past centre: ${t.textContent.slice(0, 24)}` });
          }
        });

        // The hero is HTML inside a foreignObject, so getBBox does not cover it. Measure
        // its painted lines instead: it must wrap inside its box and never be clipped.
        const hero = cover.querySelector('.vc-hero-text');
        if (!hero) {
          issues.push({ issue: name, problem: 'no hero' });
          return;
        }
        const fo = hero.closest('foreignObject').getBoundingClientRect();
        const range = document.createRange();
        range.selectNodeContents(hero);
        const lines = [...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0);
        if (!lines.length) {
          issues.push({ issue: name, problem: 'hero painted nothing' });
        } else {
          const top = Math.min(...lines.map((r) => r.top));
          const bottom = Math.max(...lines.map((r) => r.bottom));
          if (top < fo.top - 1 || bottom > fo.bottom + 1) {
            issues.push({ issue: name, problem: `hero escapes its box: ${hero.textContent.slice(0, 24)}` });
          }
        }
        const heroPx = parseFloat(getComputedStyle(hero).fontSize);
        if (!(heroPx >= 30)) {
          issues.push({ issue: name, problem: `hero is only ${heroPx}px` });
        }
      });
      return issues;
    });

    expect(problems, JSON.stringify(problems, null, 2)).toEqual([]);
  });
}

test('issue covers are portrait and every issue has one', async ({ page }) => {
  await page.goto(CATALOG);
  await page.waitForTimeout(600);

  const result = await page.evaluate(() => {
    const sections = [...document.querySelectorAll('.cat-issue')];
    return {
      issues: sections.length,
      covers: sections.filter((s) => s.querySelector('.cat-issue-cover svg')).length,
      ratios: sections.map((s) => {
        const c = s.querySelector('.cat-issue-cover');
        if (!c) return null;
        const b = c.getBoundingClientRect();
        return +(b.width / b.height).toFixed(2);
      })
    };
  });

  expect(result.covers).toBe(result.issues);
  expect(result.issues).toBeGreaterThan(0);
  for (const ratio of result.ratios) {
    expect(ratio).toBeCloseTo(0.75, 1);
  }
});
