#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const REPO_ROOT = path.resolve(__dirname, '..');
const SOURCE_HTML = path.join(REPO_ROOT, 'private-issues', 'august-2026.html');
const VERB_GUIDE_HTML = path.join(REPO_ROOT, 'top-10-verbs-en.html');
const OUTPUT_HTML = path.join(REPO_ROOT, 'private-issues', 'august-2026-full-draft.html');
const OUTPUT_PDF = path.join(REPO_ROOT, 'private-issues', 'august-2026-full-draft.pdf');

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function newPage(number, section, kicker, title, body, folioLabel, pageClass = '') {
  return `<section class="page${pageClass ? ` ${escapeHtml(pageClass)}` : ''}">
  <div class="mast"><span>${escapeHtml(section)}</span><span>${number}</span></div>
  <p class="kicker">${escapeHtml(kicker)}</p><h2>${escapeHtml(title)}</h2>
  ${body}
  <div class="folio"><span>${escapeHtml(folioLabel)}</span><span>${number}</span></div>
</section>`;
}

function reframePage(sectionHtml, number, section, folioLabel, title) {
  let output = sectionHtml.replace(
    /<div class="mast"><span>[\s\S]*?<\/span><span>\d+<\/span><\/div>/,
    `<div class="mast"><span>${escapeHtml(section)}</span><span>${number}</span></div>`
  );

  if (title) {
    output = output.replace(/<h2([^>]*)>[\s\S]*?<\/h2>/, `<h2$1>${title}</h2>`);
  }

  output = output.replace(
    /<div class="folio"><span>[\s\S]*?<\/span><span>\d+<\/span><\/div>/,
    `<div class="folio"><span>${escapeHtml(folioLabel)}</span><span>${number}</span></div>`
  );
  return output;
}

const GUIDE_SPLIT_PLAN = {
  2: [[0, 1], [2, 3], [4, 5, 6, 7], [8, 9]],
  3: [[0, 1, 2, 3], [4, 5, 6], [7, 8, 9]],
  5: [[0, 1, 2, 3], [4, 5, 6, 7], [8, 9]],
  6: [[0, 1, 2], [3, 4, 5], [6]]
};

async function extractGuidePageData(html) {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    return await page.evaluate(() => Array.from(document.querySelectorAll('section.gazette-page-spread')).map((section) => {
      const number = Number((section.id.match(/page-(\d+)/) || [])[1]);
      const title = section.querySelector(':scope > h2')?.textContent?.trim() || `Verb guide ${number}`;
      const groups = [[]];

      for (const child of section.children) {
        if (child.matches('h3.editorial-heading') && groups[groups.length - 1].length) groups.push([]);
        groups[groups.length - 1].push(child.outerHTML);
      }

      return { number, title, groups: groups.filter((group) => group.length) };
    }));
  } finally {
    await browser.close();
  }
}

function buildVerbGuidePages(guide, firstIssuePage) {
  const parts = GUIDE_SPLIT_PLAN[guide.number] || [guide.groups.map((_, index) => index)];
  const flattened = parts.flat();
  if (flattened.length !== guide.groups.length || new Set(flattened).size !== guide.groups.length) {
    throw new Error(`Invalid split plan for guide page ${guide.number}: ${guide.groups.length} content groups.`);
  }

  return parts.map((groupIndexes, partIndex) => {
    const issuePage = firstIssuePage + partIndex;
    let content = groupIndexes.map((groupIndex) => guide.groups[groupIndex].join('\n')).join('\n')
      .replace(/<div class="print-running-header">[\s\S]*?<\/div>/g, '')
      .replace(/<div class="fulllist-bar"[\s\S]*?<\/div>/g, '')
      .replace(/\bid="page-(\d+)-heading"/g, 'id="verb-guide-heading-$1"')
      .replace(/\baria-labelledby="page-(\d+)-heading"/g, 'aria-labelledby="verb-guide-heading-$1"')
      .replace(/\bid="page-(\d+)"/g, 'id="verb-guide-$1"')
      .replace(/href="#page-(\d+)"/g, 'href="#verb-guide-$1"');

    if (guide.number === 1 && partIndex === 0) {
      content += `<div class="note"><strong>Word of the Issue · belong</strong><br>To feel accepted or part of a group. <em>Complete:</em> “I feel that I belong when ____.”</div>`;
    }
    if (guide.number === 4 && partIndex === 0) {
      content += `<div class="grid2"><div class="col"><strong>Idiom of the Issue:</strong> think outside the box · approach an idea creatively.</div><div class="col"><strong>Idiom of the Issue:</strong> make up your mind · decide what you think or want.</div></div><div class="note"><strong>Complete the idea:</strong> Finish “I think ___ because ___.” Start with this ending: “…but I can see another side.” Fill the gap: “I need to make up my mind about ___, so I will ___.”</div>`;
    }

    const partLabel = parts.length > 1 ? ` · ${partIndex + 1}/${parts.length}` : '';
    const continuation = partIndex > 0
      ? `<p class="verb-guide-continuation">${escapeHtml(guide.title)} · continued</p>`
      : '';
    return `<section class="page verb-guide-page" id="verb-guide-${guide.number}${partIndex ? `-part-${partIndex + 1}` : ''}">
  <div class="mast"><span>Words Desk · English Verb Guide · ${guide.number}/12${partLabel}</span><span>${issuePage}</span></div>
  ${continuation}${content}
  <div class="folio"><span>Top 10 English Verbs · ${guide.number}/12${partLabel}</span><span>${issuePage}</span></div>
</section>`;
  });
}

function renumberMagazinePages(pages) {
  return pages.map((page, index) => {
    const number = index + 1;
    return page
      .replace(/(<div class="mast"><span>[\s\S]*?<\/span><span>)\d+(<\/span><\/div>)/, `$1${number}$2`)
      .replace(/(<div class="folio"><span>[\s\S]*?<\/span><span>)\d+(<\/span><\/div>)/, `$1${number}$2`);
  });
}

function withDraftStyles(documentHead) {
  const styles = `<style>
:root{
  --paper:#f8f4ee;
  --paper-strong:#f2eee7;
  --ink:#1d1a1a;
  --muted:#5e5250;
  --rust:#2b1d1b;
  --teal:#1f5d58;
  --gold:#c7a25f;
  --line:rgba(72,65,56,.28);
}
html,body{margin:0;padding:0;background:#ddd4ca;color:var(--ink);font-family:Georgia,Times,serif;font-size:10.4pt;line-height:1.52}
body{letter-spacing:.01em}
.page{background:linear-gradient(180deg,#fffefb 0%,#f6f0e7 100%);box-shadow:0 2mm 10mm rgba(17,18,19,.12);border:1px solid rgba(80,71,58,.15)}
.page:before{opacity:.28;background:repeating-linear-gradient(0deg,transparent 0,transparent 7.7mm,rgba(126,108,72,.06) 7.8mm,rgba(126,108,72,.06) 7.95mm)}
.mast{border-bottom:1px solid var(--line);color:#6d554e;letter-spacing:.14em;padding-bottom:2.4mm;margin-bottom:7.5mm}
.kicker{color:var(--teal);letter-spacing:.18em;font-size:7.4pt;font-weight:800;text-transform:uppercase}
h1,h2,h3,.interview-question,.deck,.cover-title,.cover-deck{font-family:Fraunces,Georgia,serif;letter-spacing:-.015em}
h2{font-size:24pt;line-height:1.04;color:var(--rust);margin:0 0 4mm}
h3{font-size:15pt;line-height:1.08;color:var(--teal);margin:5mm 0 2mm}
p{margin:0 0 4mm;line-height:1.55}
blockquote{border-left:3px solid var(--gold);background:rgba(253,248,236,.8);padding:4mm 5mm 3mm 5mm;max-width:100%;font-style:italic}
.note,.spark,.quote-card,.editorial-placard{border:1px solid rgba(119,110,86,.22);box-shadow:0 0 0 1px rgba(255,255,255,.45) inset}
.note{background:rgba(234,240,236,.95)}
.spark{background:rgba(250,243,221,.9)}
.quote-card{background:rgba(255,255,255,.7)}
.grid2{gap:5mm}
.col{border-top:2px solid rgba(199,162,95,.65);padding-top:2mm}
.table th{background:#e2eee8;color:#14362f}
.table td,.table th{padding:2.1mm 2.3mm}
.draft-note{border:1px dashed #993c1d;background:#fff8ed;padding:3mm 4mm;margin:4mm 0;color:#71351f;font-size:8.5pt}
.editorial-placard{border:1px solid var(--teal);background:#e8f2ed;padding:4mm;margin:3mm 0}
.interview-scene{display:grid;grid-template-columns:1fr 27mm;gap:5mm;align-items:center;padding:3mm 4mm;margin:0 0 5mm;background:#edf4f2;border-left:1mm solid var(--gold);font-size:8.5pt;line-height:1.4}
.interview-scene p{margin:0}
.interview-scene svg{width:26mm;height:26mm;display:block}
.interview-spread{display:grid;grid-template-columns:1fr 1fr;gap:7mm;align-items:start}
.interview-column{min-width:0}
.interview-pair{margin:0 0 4mm;break-inside:avoid}
.interview-question{font:700 11.5pt/1.2 Fraunces,Georgia,serif;color:var(--rust);margin:0 0 1.5mm}
.interview-answer{font-size:9pt;line-height:1.42;margin:0}
.interview-answer em{font-style:italic}
.interview-pullquote{margin:4mm 0;padding:3mm 4mm;border-left:3px solid var(--gold);background:#f1eee5;font:italic 13pt/1.25 Fraunces,Georgia,serif;color:var(--teal)}
.interview-credit{margin:4mm 0 0;text-align:right;font-size:7.5pt;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--rust)}
.school-interview .interview-answer{font-size:8.7pt;line-height:1.36}
.school-interview .interview-question{font-size:10.8pt}
.school-interview .interview-pair{margin-bottom:3mm}
.school-memory-doodle{display:block;width:100%;height:62mm;margin:3mm 0 0}
.verb-guide-page{padding-top:15mm}
.verb-guide-page .editorial-heading{font-family:Fraunces,Georgia,serif;color:var(--rust);line-height:1.12}
.verb-guide-page h2.editorial-heading{font-size:20pt;margin:0 0 3mm;padding:0 0 2mm;border:0;border-bottom:2px solid var(--gold)}
.verb-guide-page h3.editorial-heading,.verb-guide-page .verb-map-title{font-size:11pt;color:var(--teal);margin:3mm 0 1.5mm}
.verb-guide-page p{font-size:8.3pt;line-height:1.32;margin:0 0 2mm}
.verb-guide-page ul,.verb-guide-page ol{font-size:8pt;line-height:1.25;margin:1.5mm 0 2.5mm;padding-left:5mm}
.verb-guide-page li{margin-bottom:1mm}
.verb-guide-page .table-responsive-container{overflow:hidden;margin:2mm 0}
.verb-guide-page .gazette-editorial-table,.verb-guide-page .cefr-roadmap-table,.verb-guide-page .fulllist-table table{width:100%;border-collapse:collapse;table-layout:auto;font-size:7pt;line-height:1.18;background:#fff}
.verb-guide-page .gazette-editorial-table th,.verb-guide-page .gazette-editorial-table td,.verb-guide-page .cefr-roadmap-table th,.verb-guide-page .cefr-roadmap-table td,.verb-guide-page .fulllist-table th,.verb-guide-page .fulllist-table td{border:1px solid #c8d3cb;padding:1mm;vertical-align:top}
.verb-guide-page .gazette-editorial-table th,.verb-guide-page .cefr-roadmap-table th,.verb-guide-page .fulllist-table th{background:#e2eee8;color:#172a2a;font-weight:700}
.verb-guide-page .verb-map-container{margin:2mm 0;padding:2.5mm;background:#f4f7f2;border:1px solid #c8d3cb;break-inside:avoid}
.verb-guide-page .verb-map-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1.5mm;margin-top:2mm}
.verb-guide-page .verb-node-card{display:block;padding:1.5mm;border-left:2px solid var(--teal);background:#fff;color:var(--ink);font-size:7pt;line-height:1.2;text-decoration:none}
.verb-guide-page .cefr-roadmap-table{font-size:6.8pt;margin:2mm 0}
.verb-guide-page .cefr-badge{font-size:6.5pt;font-weight:700}
.verb-guide-page .fulllist-bar{display:none}
.verb-guide-page .fulllist-table{overflow:visible;margin:2mm 0}
.verb-guide-page .gazette-quiz-card,.verb-guide-page .warning-callout,.verb-guide-page .verb-why-box,.verb-guide-page .gazette-marginalia,.verb-guide-page .phrase-upgrade-card{margin:2mm 0;padding:2mm;border:1px solid #c8d3cb;background:#fff}
.verb-guide-page .phrase-upgrade-grid,.verb-guide-page .instead-try-spread{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:2mm}
.verb-guide-page .cosy-journey-link{margin-top:3mm;padding:2mm;border-top:1px solid #c8d3cb;color:var(--teal);font-size:7.5pt}
.verb-guide-page .gazette-drop-cap::first-letter{float:left;font:900 2.5em/.8 Fraunces,Georgia,serif;color:var(--teal);padding-right:1mm}
.verb-guide-page mark.example-chip{background:#fff0c4;padding:0 1mm}
.verb-guide-page .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.crossword-grid{border-collapse:collapse;margin:5mm auto}
.crossword-grid td{width:13mm;height:13mm;border:1px solid var(--teal);text-align:center;font-weight:700}
.answer-list li{margin-bottom:3mm}
.draft-cover-note{font-size:7.5pt;font-weight:700;color:var(--rust);letter-spacing:.1em}
</style>`;
  return documentHead.replace('</head>', `${styles}\n</head>`);
}

async function main() {
  const source = fs.readFileSync(SOURCE_HTML, 'utf8');
  const guideSource = fs.readFileSync(VERB_GUIDE_HTML, 'utf8');
  const bodyStart = source.indexOf('<body>');
  const bodyEnd = source.lastIndexOf('</body>');
  const sections = [...source.matchAll(/<section class="page(?: [^"]*)?">[\s\S]*?<\/section>/g)].map((match) => match[0]);
  const guidePages = await extractGuidePageData(guideSource);
  if (bodyStart < 0 || bodyEnd < bodyStart || sections.length !== 24) {
    throw new Error(`Expected a 24-page source document; found ${sections.length} pages.`);
  }
  if (guidePages.length !== 12 || guidePages.some((guide, index) => guide.number !== index + 1)) {
    throw new Error(`Expected the full 12-page English verb guide; found ${guidePages.length} spreads.`);
  }

  const pages = [];
  let cover = sections[0]
    .replace('English edition · 24 pages', 'English edition · 50 pages<br><br>EDITORIAL DRAFT · NOT FOR RELEASE');
  cover = reframePage(cover, 1, '', 'COSYmagazine · August 2026', null);
  pages.push(cover);
  pages.push(reframePage(sections[1], 2, "Letter from the Editor · JY DM", 'Get Ready for School', null));
  pages.push(reframePage(sections[2], 3, "Founder's Editorial Dispatch · 1 of 2", 'Speaking-first · Listen, try, notice', 'Why Speaking-First is the Only Way to True Fluency'));
  pages.push(reframePage(sections[3], 4, "Founder's Editorial Dispatch · 2 of 2", 'Dispatch · Small turns count', null));

  pages.push(newPage(5, 'In Conversation · Founder Interview · 1 of 2', 'How COSY Languages began', 'From comparative linguistics to a learning project', `
  <div class="interview-scene"><p><strong>On camera:</strong> In a phone-camera call from home, James sits with a vinyl player, books, and Lana Del Rey's <em>Born to Die</em> album in the background.</p><svg viewBox="0 0 100 100" role="img" aria-label="A vinyl record and book doodle"><circle cx="48" cy="50" r="39" fill="#172a2a"/><circle cx="48" cy="50" r="25" fill="none" stroke="#e7f1ed" stroke-width="1.5"/><circle cx="48" cy="50" r="13" fill="none" stroke="#e7f1ed" stroke-width="1.5"/><circle cx="48" cy="50" r="4" fill="#d79b25"/><path d="M72 12v23l-13 5V17zM17 76q12-6 24 0v13q-12-6-24 0zM41 76q12-6 24 0v13q-12-6-24 0z" fill="none" stroke="#0f6e56" stroke-width="2" stroke-linejoin="round"/></svg></div>
  <div class="interview-spread">
    <div class="interview-column">
      <div class="interview-pair"><p class="interview-question"><strong>When did the idea for COSY Languages first come to you?</strong></p><p class="interview-answer"><em>The idea came to me in 2020, during COVID, when I began learning Italian and Spanish simultaneously. By then, I already knew Tatar, Bashkir, Russian, English, and French. I wanted to create something rooted in comparative linguistics, then grow it into a language-exchange community. The name COSYlanguages came to me at that early stage.</em></p></div>
      <blockquote class="interview-pullquote">“It began with comparative linguistics—and a name.”</blockquote>
    </div>
    <div class="interview-column">
      <div class="interview-pair"><p class="interview-question"><strong>How did it become a language-learning project?</strong></p><p class="interview-answer"><em>When I later began teaching professionally, I reshaped the idea into a language-learning project. It still doesn't feel completely real because I keep striving for perfection. I don't know whether I'll ever get there. I'm a Libra—and yes, I believe in astrology, but only when it's about Libras.</em></p></div>
      <div class="interview-pair"><p class="interview-question"><strong>What drew you to Italian and Spanish, and how did you begin?</strong></p><p class="interview-answer"><em>I had free time, and I love music and songs in both languages. I began with Duolingo, which can be a useful starting point. Alongside that, I compared cognates and similar words with French, English, and Russian.</em></p></div>
    </div>
  </div>
  <p class="small">Answers supplied by the founder; lightly edited for clarity. Review required before release.</p>`, 'Founder interview · 1 of 2'));

  pages.push(newPage(6, 'In Conversation · Founder Interview · 2 of 2', 'Motivation, mistakes, and momentum', 'How do you keep going?', `
  <div class="interview-spread">
    <div class="interview-column">
      <div class="interview-pair"><p class="interview-question"><strong>What would you tell people to avoid when they start learning languages?</strong></p><p class="interview-answer"><em>Don't take on two very similar languages at once—although that's exactly what I did. I'd wait until the first one is at least upper-intermediate, then add another gradually. I was constantly trying to stop one language from overtaking the other; in the end, Italian won.</em></p></div>
      <div class="interview-pair"><p class="interview-question"><strong>What would you do differently, and what practice would you keep?</strong></p><p class="interview-answer"><em>I wouldn't study two languages at the same time. But I would keep handwriting every day: conjugate verbs, write a story or a few sentences, or journal. Songs are wonderful listening practice, but they aren't reliable grammar lessons and can sometimes mislead you about pronunciation.</em></p></div>
    </div>
    <div class="interview-column">
      <div class="interview-pair"><p class="interview-question"><strong>What keeps you motivated, and what would you tell someone waiting to feel ready?</strong></p><p class="interview-answer"><em>Motivation is hard to pin down, and I think scientists still have a lot to learn about it. For me, it comes from enjoying the process, loving the language, discovering new things, and making unusual—often odd—associations. There is also the pleasure of understanding, speaking, and being understood in another language.</em></p></div>
      <blockquote class="interview-pullquote">“You'll never be completely ready. So why wait?”</blockquote>
      <p class="interview-answer"><em>Start. Otherwise, you'll never know whether you like it, need it, or might later regret not trying.</em></p>
      <div class="interview-pair"><p class="interview-question"><strong>How do you decide when to continue, change direction, or pause?</strong></p><p class="draft-note"><strong>RESPONSE PENDING:</strong> JY DM would like time to reflect. Add his answer when he sends it; do not infer it.</p></div>
    </div>
  </div>
  <p class="interview-credit">Interview by Alfinur M. with JY DM</p>
`, 'Founder interview · 2 of 2'));

  pages.push(reframePage(
    sections[4], 7, "I Couldn't Help But Wonder", 'Wonder · Begin with curiosity', 'Why Do Adults Freeze at the Classroom Door?'
  ));

  pages.push(newPage(8, 'Research Spark · Speaking Clubs', 'Question, not finding', 'What makes a first turn feel possible?', `
  <p><strong>Research question:</strong> When adult language learners can rehearse, use a sentence starter, or pass before speaking, does their willingness to take a first turn change?</p>
  <p>This is an investigable question, not an established result. A small classroom inquiry could compare voluntary task formats while keeping the language goal similar. Participation, learner choice, and short reflections may offer useful observations, but they would not prove that one routine works for everyone.</p>
  <div class="grid2">
    <div class="col"><h3>B1–B2 speaking club</h3><p>Discuss encouragement versus pressure. Use: <em>“A low-stakes first turn might…”</em> and <em>“It could depend on…”</em> Choose a fictional learner or pass on personal disclosure.</p></div>
    <div class="col"><h3>C1–C2 speaking club</h3><p>Distinguish willingness, confidence, and proficiency. Ask what evidence would support a causal claim, and what a learner's decision to pass can tell us.</p></div>
  </div>
  <div class="spark"><strong>Fields to explore:</strong> applied linguistics, foreign-language classroom anxiety, classroom interaction, learner autonomy. Consider consent, class size, task design, and the limits of self-report.</div>
  <p class="small">Starting points: Horwitz, Horwitz &amp; Cope (1986); MacIntyre &amp; Gardner (1994). Full references and relevance checks are still required.</p>`, 'Speaking clubs · B1–B2 / C1–C2'));

  pages.push(newPage(9, 'In Conversation · School memories · 1 of 2', 'School, teachers, and absence', 'What stayed with you from school?', `
  <div class="draft-note"><strong>SETTING TO CONFIRM:</strong> Add the approved place, weather, sounds, and gestures for this conversation. Teacher names are withheld here; verify the account and approve any identifying details before publication.</div>
  <div class="interview-spread">
    <div class="interview-column">
      <div class="interview-pair"><p class="interview-question"><strong>How would you describe yourself as a pupil?</strong></p><p class="interview-answer"><em>I was a pretty average pupil. Languages were the one area I was good at. Maybe I wasn't interested in the other subjects, or maybe the teachers didn't make them interesting to me. From around fourteen, I started skipping many classes. I think that says something about what school felt like for me.</em></p></div>
      <blockquote class="interview-pullquote">“Languages were the one area I was good at.”</blockquote>
    </div>
    <div class="interview-column">
      <div class="interview-pair"><p class="interview-question"><strong>How did teachers affect the way you felt about learning?</strong></p><p class="interview-answer"><em>I had a complicated relationship with my English teacher. I felt supported in class and usually earned good marks, but I remember her opposing my choice to take English as a state exam. We could choose our exam subjects, apart from maths and Russian. I was stubborn and rebellious, so I chose English anyway and passed it reasonably well for the time. That complicated relationship made me want to improve and prove myself.</em></p></div>
      <div class="interview-pair"><p class="interview-answer"><em>Maths and geometry were different. One teacher made me feel miserable and useless, so I skipped almost all her classes in high school. With English, I fought to prove myself; with maths, I avoided the subject. That's how I remember it—my account of the experience, not a diagnosis of anyone's motives.</em></p></div>
    </div>
  </div>
  <blockquote class="interview-pullquote">“I either fought to prove myself or avoided the subject.”</blockquote>
  <svg class="school-memory-doodle" viewBox="0 0 700 180" role="img" aria-label="An open classroom door with a path leading toward daylight">
    <g fill="none" stroke="#0f6e56" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M34 151 H665 M94 151 V25 H264 V151 M264 30 L344 46 V151 M126 46 H231 V132 H126 Z"/>
      <circle cx="214" cy="90" r="3" fill="#d79b25"/>
      <path d="M300 151 Q384 129 471 151 M345 133 Q399 116 451 133 M382 116 Q418 104 448 116"/>
      <path d="M516 78 Q542 55 569 78 M542 55 V31 M594 57 L607 44 M492 57 L479 44 M624 94 L639 94 M460 94 H475"/>
      <path d="M578 126 Q602 111 626 126 V148 Q602 134 578 148 Z M602 121 V143"/>
    </g>
    <circle cx="542" cy="79" r="25" fill="#f2c660" stroke="#0f6e56" stroke-width="3"/>
    <path d="M414 92 q7 -9 14 0 M446 77 q7 -9 14 0 M475 105 q7 -9 14 0" fill="none" stroke="#d79b25" stroke-width="3" stroke-linecap="round"/>
  </svg>
  <p class="small">A memory of one student's school experience; not a diagnosis or a claim that one response fits every learner.</p>`, 'School memories · Personal account', 'school-interview'));

  pages.push(newPage(10, 'In Conversation · School memories · 2 of 2', 'Pressure, support, and starting again', 'How do you rise like a phoenix?', `
  <div class="interview-spread">
    <div class="interview-column">
      <div class="interview-pair"><p class="interview-question"><strong>When does pressure stop helping?</strong></p><p class="interview-answer"><em>I think pressure has a limit. Once you cross it, the person being pressured may stop trusting or respecting you.</em></p></div>
      <div class="interview-pair"><p class="interview-question"><strong>What helped you through your teenage years?</strong></p><p class="interview-answer"><em>Music, my interests, and my friends were the main things that carried me through adolescence.</em></p></div>
      <div class="interview-pair"><p class="interview-question"><strong>What does beginning again mean to you?</strong></p><p class="interview-answer"><em>To me, it means returning to something you once loved, still love, and can't really live without. For me, that was English. I listened mostly to English-language music and watched English-speaking vloggers and bloggers, so I couldn't leave the language behind.</em></p></div>
    </div>
    <div class="interview-column">
      <div class="interview-pair"><p class="interview-question"><strong>What should a teacher say to a learner who is struggling?</strong></p><p class="interview-answer"><em>Support them and offer a hug, if that's welcome. Never say, “You're the worst.” Say, “You're different, so you may need a different way to understand this.” People think, notice, and remember differently; a teacher can try another explanation and ask what helps.</em></p></div>
      <div class="draft-note"><strong>EDITORIAL NOTE:</strong> This is JY DM's perspective, not a clinical account. “Rise like a phoenix” does not mean everyone has fully overcome a painful experience.</div>
      <h3>A reader invitation</h3>
      <p class="interview-answer">If you choose, share one thing that helped you begin again—or one kind of support you wish you had received. You do not need to name anyone, use the word “trauma,” or claim that everything is resolved.</p>
      <div class="draft-note"><strong>CONTEST DETAILS PENDING:</strong> Confirm platform, deadline, entry length, privacy, moderation, judging, and permission before inviting submissions publicly.</div>
    </div>
  </div>
  <p class="interview-credit">Interview by Alfinur M. with JY DM</p>`, 'School memories · Personal account', 'school-interview'));

  pages.push(newPage(11, 'Fashion & Trends · The Debate · 1 of 2', 'Modern schools', 'Typing vs Handwriting: which helps learning?', `
  <p>There is no single winner for every learner, task, or context. The useful question is what a particular method makes easier, and what it makes harder.</p>
  <div class="grid2">
    <div class="col"><h3>Three cases for typing</h3><ol><li>Digital notes are easier to revise, reorganize, search, and share.</li><li>Assistive tools such as speech-to-text or adjustable text can improve access for some learners.</li><li>Typing can match tasks that already happen on screens, including collaborative drafting.</li></ol></div>
    <div class="col"><h3>Three cases for handwriting</h3><ol><li>Handwriting can slow note-taking and encourage selection rather than verbatim capture.</li><li>It remains useful when devices, power, or connectivity are unavailable.</li><li>Drawing, annotation, and personal layouts can make some notes easier to revisit.</li></ol></div>
  </div>
  <div class="spark"><strong>Evidence note:</strong> Findings depend on the task, age, access needs, device, and what “learning” measures. Do not turn a classroom debate into a universal rule.</div>`, 'Debate · Compare the task, not the person'));

  pages.push(newPage(12, 'Fashion & Trends · The Debate · 2 of 2', 'Speaking placards', 'Make the case, then make room', `
  <div class="editorial-placard"><strong>PLACARD A:</strong> “The best note-taking method is the one that lets this learner use the notes later.”</div>
  <div class="editorial-placard"><strong>PLACARD B:</strong> “A classroom should teach both methods because students need to choose by task.”</div>
  <h3>Try it at three levels</h3>
  <p><strong>A0–A2:</strong> “I prefer ____ because ____.” “For this task, I choose ____.”</p>
  <p><strong>B1–B2:</strong> Give one advantage and one limitation of each method. Name the task you have in mind.</p>
  <p><strong>C1–C2:</strong> What evidence would change your position? How should accessibility and student choice affect a school-wide policy?</p>
  <h3>Three questions for the room</h3>
  <ol><li>Are you recording, thinking, planning, or revising?</li><li>Which tools make a method more accessible?</li><li>How could a teacher assess understanding without grading handwriting or typing speed?</li></ol>
  <div class="note"><strong>Complete the idea:</strong> Finish: “I remember more when I…” Start with this ending: “…because I can rearrange my notes.” Fill the gap: “For this task, I prefer ___ because ___.”</div>
  <p class="small">Source check required before publication: cite current reviews or studies rather than relying on a viral summary.</p>`, 'Debate · Speaking placards'));

  pages.push(newPage(13, 'Words & Creativity Desk · Stop Translating · Pillar 1', 'High-frequency verbs across five languages', 'Five verbs for a first conversation', `
  <p>These are useful starting forms, not one-to-one translation rules. Compare how each language builds a simple message.</p>
  <table class="table"><thead><tr><th>Language</th><th>Be</th><th>Have / possession</th><th>Want</th><th>Go</th><th>Can</th></tr></thead><tbody>
  <tr><td>English</td><td>be</td><td>have</td><td>want</td><td>go</td><td>can</td></tr>
  <tr><td>French</td><td>être</td><td>avoir</td><td>vouloir</td><td>aller</td><td>pouvoir</td></tr>
  <tr><td>Italian</td><td>essere</td><td>avere</td><td>volere</td><td>andare</td><td>potere</td></tr>
  <tr><td>Russian</td><td>быть</td><td>иметь / у меня есть</td><td>хотеть</td><td>идти / ехать</td><td>мочь</td></tr>
  <tr><td>Greek</td><td>είμαι</td><td>έχω</td><td>θέλω</td><td>πηγαίνω</td><td>μπορώ</td></tr>
  </tbody></table>
  <div class="quote-card"><strong>One idea, natural forms:</strong><br>EN: I have a book. · FR: J'ai un livre. · IT: Ho un libro.<br>RU: У меня есть книга. · EL: Έχω ένα βιβλίο.</div>
  <div class="note"><strong>Notice:</strong> Russian commonly expresses possession with <em>у меня есть</em> (“at me there is”), rather than a direct present-tense equivalent of English <em>have</em>. The verb list shows dictionary forms; use natural sentence frames.</div>
  <div class="spark"><strong>Word of the issue · belong</strong><br>To feel accepted or to feel that you are part of a group.<br><em>Complete:</em> “I feel that I belong when ____.”</div>
  <p class="small">Language review required before print, especially for context, aspect, inflection, and the intended learner level.</p>`, 'Stop Translating · Pillar 1 · Core verbs'));

  pages.push(newPage(14, 'Words & Creativity Desk · Stop Translating · Pillars 2–3', 'Gesture, describe, notice', 'Keep the meaning moving', `
  <div class="grid2">
    <div class="col"><h3>Pillar 2 · Mime &amp; circumlocution</h3><p>Choose one verb from page 13. Mime it without speaking; your partner guesses. Then describe an object without naming it:</p><div class="quote-card"><em>“You use it when…”</em><br><em>“It is a kind of…”</em><br><em>“It looks like…”</em></div><p>A gesture or simple description can keep the conversation alive.</p></div>
    <div class="col"><h3>Pillar 3 · Sensory upgrades</h3><p>Move beyond <em>good</em> or <em>nice</em>. Choose one word for texture, temperature, smell, sound, or taste.</p><div class="quote-card"><strong>EN</strong> warm · crisp · fragrant<br><strong>FR</strong> chaud · croquant · parfumé<br><strong>IT</strong> caldo · croccante · profumato<br><strong>RU</strong> тёплый · хрустящий · ароматный<br><strong>EL</strong> ζεστό · τραγανό · αρωματικό</div></div>
  </div>
  <div class="spark"><strong>Try it:</strong> Describe a late-summer snack using one sense word. Your partner guesses the food, then adds a different detail. Adjectives above are dictionary forms; agreement and natural phrasing depend on the noun and context.</div>
  <div class="grid2">
    <div class="col"><h3>Idiom of the issue</h3><p><strong>Turn over a new leaf:</strong> make a fresh start or change how you do something.</p></div>
    <div class="col"><h3>Idiom of the issue</h3><p><strong>Find your feet:</strong> become more confident in a new situation.</p></div>
  </div>
  <div class="note"><strong>Complete the idea:</strong> Finish: “The last time I tried something new, I…” Start with this ending: “…and that helped me find my feet.” Fill the gaps: “I took the plunge when ___; at first I felt ___, then ___.”</div>
`, 'Stop Translating · Pillars 2–3 · Gesture and senses'));

  pages.push(newPage(15, 'Science & Cognition · 1 of 2', 'A claim to examine', 'Do multilingual people have younger brains?', `
  <p>“Younger brains” is not a single research measure. Brain structure, cognitive performance, and the age at which symptoms appear are different outcomes; none can be inferred from a headline alone.</p>
  <p>Researchers have studied whether multilingual experience relates to cognitive reserve and to the timing of dementia symptoms. These questions are difficult: people differ in education, health, work, migration, language use, and access to diagnosis. Observational associations cannot by themselves show that multilingualism caused an outcome.</p>
  <h3>What can we responsibly say?</h3>
  <ul><li>Multilingual experience varies; “bilingual” is not one uniform exposure.</li><li>Cognitive reserve is a research framework, not a guarantee of protection.</li><li>Evidence about dementia risk and symptom onset is mixed and debated.</li><li>Language learning is valuable for communication, culture, relationships, work, identity, and enjoyment without a medical promise.</li></ul>
  <div class="spark"><strong>Editorial decision:</strong> Keep the provocative phrase as a question only. Do not state that multilingual people literally have younger brains unless a specific, well-designed study supports that exact claim.</div>
  <p class="small">Research review required: define the population and outcome, distinguish brain-age estimates from clinical outcomes, and include limitations and conflicting evidence.</p>`, 'Science & Cognition · Claim check'));

  pages.push(reframePage(
    sections[13], 16, 'Science & Cognition · 2 of 2 · Research desk', 'Evidence, limits, and sources', 'What research can—and cannot—say'
  ));

  pages.push(newPage(17, 'Stories & Voices · Mind Matters', 'The first-day inner critic', 'Impostor feelings at the classroom door', `
  <p>A learner may think, “Everyone else belongs here,” or “I should already know this.” These thoughts can show up during a new beginning, but a short passage cannot diagnose impostor phenomenon or any mental-health condition.</p>
  <p>Psychological safety is about whether people can ask, try, and make mistakes without expecting humiliation. In language learning, a predictable task, respectful feedback, planning time, and permission to pass can make participation feel more manageable. They do not remove every worry, and they will not fit every learner.</p>
  <h3>A small classroom experiment</h3>
  <div class="grid2"><div class="col"><strong>Before:</strong><p>Write one sentence you might want to say. Circle one word you already know.</p></div><div class="col"><strong>After:</strong><p>Notice one condition that helped: a model, time, a partner, a choice, or a pause.</p></div></div>
  <div class="note"><strong>Language note:</strong> “Affective filter” is a hypothesis/metaphor used in language-learning discussions, not a clinical measure or a complete explanation of silence.</div>
  <p class="small">Review sources and wording with an educational-psychology specialist before publication.</p>`, 'Mind Matters · Support without diagnosis'));

  pages.push(newPage(18, 'Stories & Voices · Reader Showcase', '100-word micro-essay contest', 'A place for the winning voices', `
  <div class="draft-note"><strong>SUBMISSIONS AND WINNERS NOT YET PROVIDED.</strong> This is a layout placeholder. Do not invent, translate, or attribute contest entries.</div>
  <p>Reserve this space for the selected 100-word micro-essays in the target languages. Each entry should appear in the writer's submitted language, with a short approved note about the writer and an editorial translation only if the writer agrees.</p>
  <h3>Publication checklist</h3>
  <ol><li>Confirm the original text and count the words using the announced rules.</li><li>Record the selection process and notify each writer.</li><li>Obtain written permission from the author or guardian where required.</li><li>Approve spelling, translation, byline, and any identifying detail with the writer.</li></ol>
  <div class="note"><strong>Optional writing starts:</strong> Finish “A small beginning for me was…” or fill the gaps: “At first I felt ___; then ___ helped me ___.” Entries may use a fictional character; no personal disclosure is required.</div>
  <p class="small">If no eligible entries are cleared, replace this page with an open prompt and submission invitation.</p>`, 'Reader showcase · Awaiting cleared entries'));

  pages.push(newPage(19, 'Stories & Voices · Narrative Ledger', 'An explicitly imagined scene', 'My Life With & Without Fear of Evaluation', `
  <div class="draft-note"><strong>FICTIONAL COMPOSITE-FREE EXERCISE:</strong> The following paired scenes are invented for language practice; they are not a reader testimonial.</div>
  <div class="grid2">
    <div class="col"><h3>With fear of evaluation</h3><p>I rehearse the sentence silently while the conversation moves on. I choose a safer word, then wonder whether it sounds childish. When the teacher looks my way, I smile and let the turn pass. Later, I remember the answer I wanted to give.</p><p class="small">Narrative lens: observation, hesitation, and one missed turn.</p></div>
    <div class="col"><h3>Without fear of evaluation</h3><p>I still pause to find a word. This time I say, “Give me a second,” and keep the turn. I try a phrase, notice what is missing, and ask for help. The sentence is not perfect, but it belongs to the conversation.</p><p class="small">Narrative lens: not a cure, but one imagined moment with more room to try.</p></div>
  </div>
  <h3>Write your own contrast</h3><p>Use a fictional character if you prefer. Try: <em>“I used to…, but now…”</em> and <em>“If I had more time, I might…”</em></p>`, 'Narrative ledger · Imagined, not testimonial'));

  pages.push(newPage(20, 'Living & Salon · If You Were', 'A culturally careful hypothetical', 'If You Were a Kindergarten Teacher in Tokyo', `
  <p><strong>Scenario:</strong> Imagine you are designing a welcoming first language activity for a fictional group of young children in Tokyo. This is a thought experiment, not a description of typical Japanese classrooms or families.</p>
  <h3>Design for choice</h3>
  <p>Offer a picture, an object, a short model, and more than one way to respond. A child might point, move a card, repeat a phrase, speak with a partner, or watch first. Ask what languages children use at home rather than assuming a shared background.</p>
  <h3>Try the language</h3>
  <p><strong>A0–A2:</strong> “I would show ____.”<br><strong>B1–B2:</strong> “One way to invite a first turn could be…”<br><strong>C1–C2:</strong> “How would you adapt the activity after speaking with families and observing the group?”</p>
  <div class="spark"><strong>Research and culture check:</strong> Learn about the specific school and community before making claims. Avoid treating Tokyo, Japan, or childhood as culturally uniform.</div>
  <p class="small">A real-world version requires cultural review by someone familiar with the specific context.</p>`, 'If You Were · Imagine, then ask'));

  pages.push(reframePage(sections[16], 21, 'Living & Salon · Grammar Made Cosy · 1 of 2', 'Grammar · Routine and right now', null));
  pages.push(reframePage(sections[17], 22, 'Living & Salon · Grammar Made Cosy · 2 of 2', 'Grammar · Compare, do not equate', null));

  pages.push(newPage(23, 'Living & Salon · Philosophy Café', 'Curiosity and beginnings', '“I am only passionately curious”', `
  <div class="draft-note"><strong>ATTRIBUTION CHECK REQUIRED:</strong> The wording supplied for this brief is used provisionally. Confirm the exact wording and source before printing it as an Einstein quotation.</div>
  <blockquote>“I am only passionately curious.”</blockquote>
  <p>Curiosity can be a reason to ask a question before we know the answer. In a new language, that might mean asking someone to repeat a word, noticing a pattern, or staying with a conversation after a mistake.</p>
  <h3>Philosophy-café prompts</h3>
  <ol><li>Is curiosity a feeling, a habit, or a decision?</li><li>Can a person be curious and still feel nervous?</li><li>What is one question you would like to ask in a language you are learning?</li></ol>
  <p class="small">Do not imply that this quotation is verified until an authoritative source is recorded.</p>`, 'Philosophy Café · Attribution pending'));

  pages.push(newPage(24, 'Living & Salon · Cinema Pick', 'One screen, one conversation', 'Dead Poets Society', `
  <p>Peter Weir's film follows students and a teacher whose unconventional approach changes how some of them see school, poetry, and their own choices. Use it as a story to discuss—not as evidence about what every teacher or classroom is like.</p>
  <h3>Watch with a question</h3><p>When does encouragement help someone find a voice, and when might adult pressure make a student's choices harder?</p>
  <div class="spark"><strong>Content note:</strong> The film includes suicide and intense school/family pressure. Check age suitability and viewer comfort before recommending or screening it.</div>
  <p class="small">Regional availability and screening rights vary. Discuss the film's artistic choices separately from real-world research on teaching and student wellbeing.</p>`, 'Cultural Salon · Cinema'));

  pages.push(newPage(25, 'Living & Salon · Monthly Vibes', 'Five languages, five listening stops', 'A soundtrack for beginning again', `
  <p>Choose one track, listen for its mood and point of view, then describe the feeling in your own words. No lyrics are printed here.</p>
  <table class="table"><thead><tr><th>Language</th><th>Track</th><th>Listening lens</th></tr></thead><tbody>
  <tr><td>English</td><td>“Unwritten” · Natasha Bedingfield</td><td>A blank page and an open future.</td></tr>
  <tr><td>French</td><td>“Nouveau départ” · Émilie Simon</td><td>What does a new start sound like?</td></tr>
  <tr><td>Italian</td><td>“Un buon inizio” · Laura Pausini</td><td>Notice how a beginning is framed.</td></tr>
  <tr><td>Greek</td><td>“Δυο παράλληλοι δρόμοι” · Νίκος Πορτοκάλογλου &amp; Άλκηστις Πρωτοψάλτη</td><td>Two paths; compare the images the title suggests.</td></tr>
  <tr><td>Russian</td><td>“Хочу перемен!” · Кино</td><td>A song about wanting change; consider its original historical and cultural context.</td></tr>
  </tbody></table>
  <h3>Book of the issue · Educated</h3><p>Tara Westover's memoir explores education, family, and remaking a life. It is a powerful but difficult read; it includes abuse and family violence. Recommend it with a content note, especially to teen readers.</p>
  <h3>Book Lovers Day</h3><p>Use the observance as an invitation to share a book that made you curious. Confirm the local date and observance before adding it to a public calendar.</p>
  <div class="note"><strong>Production checks:</strong> verify track metadata and cultural context with fluent readers; check age suitability, regional availability, and any public-playback rights. Confirm the date and local observance of Book Lovers Day before adding it to a calendar.</div>`, 'Cultural Salon · Music and books'));

  pages.push(newPage(26, 'Living & Salon · Culinary Salon', 'Five kitchens, five language turns', 'An end-of-summer table', `
  <p>These home-style recipes offer a starting point for conversation, not a claim that one dish represents an entire country. Families and regions adapt ingredients, names, and methods.</p>
  <div class="grid2">
    <div class="col"><h3>English</h3><p>Apple crumble · peel, slice, sprinkle.</p><h3>French</h3><p>Quiche Lorraine-inspired tart · whisk, pour, bake.</p><h3>Italian</h3><p>Pasta al pomodoro · simmer, toss, serve.</p></div>
    <div class="col"><h3>Russian</h3><p>Syrniki · mix, shape, pan-fry.</p><h3>Greek</h3><p>Spanakopita-inspired pie · wilt, fold, bake.</p><h3>At the table</h3><p>Which dish would you share at a new beginning?</p></div>
  </div>
  <div class="spark"><strong>Before print:</strong> Review regional context, ingredient quantities, safe cooking guidance, translations, and allergy notes with knowledgeable readers.</div>`, 'Culinary Salon · Five-language menu'));

  pages.push(reframePage(sections[19], 27, 'Culinary Salon · English', 'Apple crumble · English', null));
  pages.push(reframePage(sections[20], 28, 'Culinary Salon · France & Italy', 'Quiche and pasta · French / Italian', null));
  pages.push(reframePage(sections[21], 29, 'Culinary Salon · Russia & Greece', 'Syrniki and spanakopita · Russian / Greek', null));

  pages.push(newPage(30, 'End-of-Issue Crossword & Puzzle · 1 of 2', 'A four-word word square', 'Find the shared language of a new beginning', `
  <p>Fill each row with a four-letter answer. The same four words should also read down the columns, so check every crossing.</p>
  <table class="crossword-grid" aria-label="Blank four by four word-square grid"><tbody>
    <tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
    <tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
    <tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
    <tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
  </tbody></table>
  <h3>Across and down</h3>
  <ol class="answer-list"><li>Thinking and understanding.</li><li>A thought or plan.</li><li>Tidy and in good order.</li><li>Facts collected for study.</li></ol>
  <h3>Sentence puzzle</h3><p>Put these words in order to make a useful first-day sentence: <strong>again / can / I / begin</strong>.</p>
  <p class="small">Answer key on the next page. All clues use common English words; adapt the activity with a teacher for another language.</p>`, 'Puzzle · Try the crossings'));

  pages.push(reframePage(sections[23], 31, 'End-of-Issue Crossword & Puzzle · 2 of 2', 'Last word · September preview', 'Answer key, last word, and next issue'));
  const lastIndex = pages.length - 1;
  const lastFolio = '<div class="folio"><span>Last word · September preview</span><span>31</span></div>';
  const lastPageBody = `
  <p class="kicker">Answer key, last word, and next issue</p>
  <h2>Curiosity takes practice, too</h2>
  <p><strong>Word square:</strong> Across and down: MIND, IDEA, NEAT, DATA.</p>
  <table class="crossword-grid" aria-label="Solved four by four word square"><tbody>
    <tr><td>M</td><td>I</td><td>N</td><td>D</td></tr>
    <tr><td>I</td><td>D</td><td>E</td><td>A</td></tr>
    <tr><td>N</td><td>E</td><td>A</td><td>T</td></tr>
    <tr><td>D</td><td>A</td><td>T</td><td>A</td></tr>
  </tbody></table>
  <p><strong>Sentence puzzle:</strong> “I can begin again.”</p>
  <blockquote>A beginning can be small, chosen, and entirely your own.</blockquote>
  <p>The next issue turns to persistence, visible progress, and the intermediate plateau. Bring one question you are still curious about.</p>
  <p class="small">COSYmagazine · Vol. 2026.08 · English edition · Editorial draft. Puzzle checked in both directions.</p>`;
  pages[lastIndex] = pages[lastIndex].replace(/<div class="mast">[\s\S]*?<div class="folio">[\s\S]*?<\/div>/, `<div class="mast"><span>End-of-Issue Crossword &amp; Puzzle · 2 of 2</span><span>31</span></div>${lastPageBody}${lastFolio}`);

  const fullGuidePages = [];
  let nextIssuePage = 13;
  for (const guide of guidePages) {
    const printedPages = buildVerbGuidePages(guide, nextIssuePage);
    fullGuidePages.push(...printedPages);
    nextIssuePage += printedPages.length;
  }
  pages.splice(12, 2, ...fullGuidePages);

  if (pages.length !== 50) throw new Error(`Expected 50 assembled pages; found ${pages.length}.`);

  const head = withDraftStyles(source.slice(0, bodyStart));
  const finalPages = renumberMagazinePages(pages);
  const outputHtml = `${head}<body>\n${finalPages.join('\n')}\n</body>\n</html>`;
  fs.writeFileSync(OUTPUT_HTML, outputHtml);

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(pathToFileURL(OUTPUT_HTML).href, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const pageCount = await page.locator('section.page').count();
    if (pageCount !== 50) throw new Error(`Expected 50 rendered pages; found ${pageCount}.`);
    await page.pdf({ path: OUTPUT_PDF, printBackground: true, preferCSSPageSize: true });
  } finally {
    await browser.close();
  }

  console.log(`Draft HTML: ${OUTPUT_HTML}`);
  console.log(`Draft PDF: ${OUTPUT_PDF}`);
  console.log(`${pages.length} pages generated. This editorial draft is not approved for release or upload.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});