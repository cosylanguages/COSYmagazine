#!/usr/bin/env python3
"""
COSYmagazine Vol. 2026.08 "Get ready for school" -- English edition, Vogue-inspired PDF, v2.

Follows the issue's real running order (docs/issues/ISSUE_08_AUGUST_COMPLETE_BLUEPRINT.md):
every published English post, sorted by `printOrder`, drafts excluded.
Content is read from the repo: content/issues/2026-08/posts/*.json (metadata) and <slug>.html (text).
"""
import glob, json, os, re, html
import build_august as B
from build_august import *      # helpers, styles, fonts, palette

REPO = B.SRC
POSTS = os.path.join(REPO, 'content', 'issues', '2026-08', 'posts')
OUTDIR = B.OUT

DEPT = {
    'wonder_column': "I Couldn\u2019t Help But Wonder", 'founder_interview': 'In Conversation: Founder',
    'debatable_relatable': 'Debatable & Relatable', 'mind_matters': 'Mind Matters', 'words_desk': 'Words Desk',
    'if_you_were': 'If You Were', 'science_expander': 'Keeping Up with Science', 'life_with_without': 'My Life With & Without',
    'idiom_detective': 'Idiom Detective', 'cosy_sightings': 'COSY Sightings', 'greatest_quotes': 'The Greatest Quotes',
    'cultural_salon': "The Month\u2019s List", 'culinary_salon': 'Culinary Salon', 'thematic_crossword': 'The Thematic Crossword'}

# which English post stands for each department (the near-duplicate "-en"/"-english" twins are not printed twice)
SKIP = {'top-10-verbs-en', 'top-100-a0-a1-english'}

def load_edition():
    posts = []
    for f in glob.glob(os.path.join(POSTS, '*.json')):
        d = json.load(open(f, encoding='utf-8'))
        if d.get('draft') or d.get('language') != 'en' or d.get('printOrder') is None or d['slug'] in SKIP: continue
        posts.append(d)
    return sorted(posts, key=lambda d: d['printOrder'])

def title_style(t):
    n = len(t)
    return TITLE if n <= 38 else TITLE_M if n <= 62 else TITLE_S

def header_for(d, byline=None):
    by = byline or f"{d.get('readingTime', '')} min read  \u00b7  {d.get('level', '')}"
    dek = d.get('dek', '')
    return (d.get('kicker') or DEPT.get(d['section'], ''), d['title'], dek, by)

def header_flow(d, byline=None):
    k, t, dek, by = header_for(d, byline)
    ds = DEK if len(dek) < 150 else S('dek2', parent=DEK, fontSize=13, leading=17.5)
    return [P(k.upper(), KICK), Spacer(1, 10), P(t, title_style(t)), Spacer(1, 11), rule(60, ACC, 1.2, 0, 11),
            P(dek, ds), Spacer(1, 11), P(by.upper(), BYLINE), FrameBreak()]

# ------------------------------------------------------------------ builders
def build_dept(path, first, d, qa=False, visual=None, byline=None, compact=True):
    """one department: optional full-page visual opener (left page), then header + two-column text"""
    z = dict(leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    section = DEPT.get(d['section'], 'COSY')
    temps = [T_('first', 'first', bg_cream), T_('body', 'body', bg_cream)]
    story = []
    if visual:
        shape, key = visual
        temps.insert(0, PageTemplate(id='opener', frames=[Frame(0, 0, 2, 2, id='x', **z)], onPage=make_opener(shape, key, section.upper())))
        story += [NextPageTemplate('first'), Spacer(1, 1), PageBreak()]
    story += [NextPageTemplate('body')]
    story += header_flow(d, byline)
    keep = B.BODY
    if compact: B.BODY = S('bodyc', alignment=BODY_ALIGN, fontSize=9.8, leading=13.6, spaceAfter=5.2, allowWidows=0, allowOrphans=0, **HY)
    try: story += render_article(load(d['slug']), qa=qa)
    finally: B.BODY = keep
    return run(path, first, section, story, temps)

def build_crossword(path, first, d):
    art = load(d['slug']); fig = art.find('figure')
    cols = int(re.search(r'--cw-cols:(\d+)', fig['style']).group(1)); rows = int(re.search(r'--cw-rows:(\d+)', fig['style']).group(1))
    cells = []
    for sp in fig.find(class_='crossword-grid').find_all('span', class_='cw-cell', recursive=False):
        if 'cw-blank' in sp.get('class', []): cells.append(None)
        else:
            n = sp.find(class_='cw-num'); cells.append(n.get_text(strip=True) if n else '')
    clues = {}
    for col in fig.find(class_='crossword-clues').find_all(class_='crossword-clue-col'):
        head = col.find('h5').get_text(strip=True)
        clues[head] = [(li.find(class_='cw-clue-num').get_text(strip=True), clean(li.get_text(' ', strip=True)).strip()[len(li.find(class_='cw-clue-num').get_text(strip=True)):].strip()) for li in col.find_all('li')]
    key = [l.strip() for l in fig.find(class_='crossword-answers-body').get_text('\n').split('\n') if l.strip()]
    title = fig.find(class_='crossword-title').get_text(strip=True)

    class Grid(Flowable):
        def wrap(self, aw, ah): self.w, self.h = aw, ah; return aw, ah
        def draw(self):
            c = self.canv; cell = 24.6; gw = cols * cell; gh = rows * cell
            x0 = (self.w - gw) / 2; ytop = self.h - 46
            tracked(c, 'THE THEMATIC CROSSWORD  \u00b7  FULL-PAGE SPREAD', 0, self.h - 8, 'Jost-M', 7.2, 1.7, ACC)
            c.setFont('FrD', 21); c.setFillColor(INK); c.drawString(0, self.h - 34, title)
            gy = ytop - gh - 6
            c.setStrokeColor(INK); c.setLineWidth(0.8)
            for i, v in enumerate(cells):
                if v is None: continue
                r, k = divmod(i, cols); x = x0 + k * cell; y = gy + (rows - 1 - r) * cell
                c.setFillColor(HexColor('#ffffff')); c.rect(x, y, cell, cell, stroke=1, fill=1)
                if v: c.setFillColor(ACC); c.setFont('Jost-M', 6.2); c.drawString(x + 2, y + cell - 7.6, v)
            # clues
            cw_ = (self.w - 24) / 2; y = gy - 18
            for j, head in enumerate(('Across', 'Down')):
                x = j * (cw_ + 24); yy = y
                tracked(c, head.upper(), x, yy, 'Jost-M', 6.8, 1.6, ACC); yy -= 12
                for n, txt in clues.get(head, []):
                    p = Paragraph(f'<font name="Jost-M" size="6.6" color="{ACC_HEX}">{n}</font>&nbsp;&nbsp;{html.escape(txt)}',
                                  S('cl', fontSize=8.8, leading=11.2, leftIndent=14, firstLineIndent=-14))
                    pw, ph = p.wrap(cw_, 100); p.drawOn(c, x, yy - ph); yy -= ph + 1.6
            # answer key, printed upside down at the foot, as puzzle pages do
            c.saveState(); c.translate(self.w, 8); c.rotate(180)
            c.setFillColor(MUTED); c.setFont('EBG-I', 7.2)
            for i, l in enumerate(key[:4]): c.drawString(0, 18 - i * 9, l)
            c.restoreState()

    z = dict(leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    story = [NextPageTemplate('body'), *header_flow(d), *render_article(art), NextPageTemplate('cw'), PageBreak(), Grid()]
    temps = [T_('first', 'first_s', bg_cream), T_('body', 'body', bg_cream), T_('cw', 'wide', bg_cream)]
    return run(path, first, DEPT['thematic_crossword'], story, temps)

def build_interlude2(path, first, quote, cap):
    return B.build_interlude(path, first, quote, cap)

# ---- cover (real departments, documented subtitle)
def build_cover2(path):
    c = rl_canvas.Canvas(path, pagesize=(W, H)); c.setTitle('COSY Magazine, Vol. 2026.08')
    c.setFillColor(FIELD); c.rect(0, 0, W, H, stroke=0, fill=1); m = 30
    tracked(c, ISSUE + '  \u00b7  AUGUST 2026', m, H - 36, 'Jost-M', 6.8, 1.8, MINT)
    tracked(c, 'BACK TO SCHOOL ISSUE', W - m, H - 36, 'Jost-M', 6.8, 1.8, MINT, 'r')
    target = W - 2 * m - 6; size = target / stringWidth('COSY', 'Bodoni-M', 1)
    capH = cap_height('BodoniMasthead.ttf') * size; base = H - 62 - capH
    c.setFillColor(CREAM); c.setFont('Bodoni-M', size); c.drawCentredString(W / 2, base, 'COSY')
    aw = 262; ax = (W - aw) / 2; atop = base + capH * 0.42; ay = 196
    draw_slot(c, 'arch', ax, ay, aw, atop - ay, 'cover')
    c.setFillColor(CREAM); c.setFont('Caveat', 22)
    c.saveState(); c.translate(W / 2, ay + 44); c.rotate(-3); c.drawCentredString(0, 0, 'speak before you feel ready'); c.restoreState()
    def coverline(x, ytop, w, kick, text):
        k = ParagraphStyle('k', fontName='Jost-M', fontSize=6.5, leading=9, textColor=MINT, charSpace=1.5)
        t = ParagraphStyle('t', fontName='FrD', fontSize=15.5, leading=18, textColor=CREAM)
        pk = Paragraph(kick, k); pt = Paragraph(typo(text), t); _, hk = pk.wrap(w, 100); _, ht = pt.wrap(w, 200)
        pk.drawOn(c, x, ytop - hk); pt.drawOn(c, x, ytop - hk - 5 - ht)
    lw = ax - m - 14; rx = ax + aw + 14; rw = W - m - rx
    coverline(m, 540, lw, 'THE OPENING QUESTION', 'Who decided you were bad at languages?')
    coverline(m, 340, lw, 'IN CONVERSATION', 'The founder on the fear of lesson one')
    coverline(rx, 540, rw, 'WORDS DESK', 'Ten verbs and a hundred words to begin with')
    coverline(rx, 400, rw, 'CULINARY SALON', 'Five breakfasts, five kitchens')
    c.setFillColor(CREAM); c.setFont('FrD', 58); c.drawString(m, 128, 'Get ready')
    c.setFont('FrI', 58); c.drawString(m, 72, 'for school')
    tracked(c, 'A NEW LANGUAGE, A NEW BEGINNING.  SPEAK BEFORE YOU FEEL READY.', m, 50, 'Jost-M', 6.4, 1.5, MINT)
    c.setFont('EBG-I', 9.4); c.setFillColor(MINT); c.drawRightString(W - m, 128, 'cosy  /\u02c8ko\u028azi/')
    c.setFont('EBG-I', 8.6)
    c.drawRightString(W - m, 112, 'Pr\u00eats pour la rentr\u00e9e')
    c.drawRightString(W - m, 100, '\u0413\u043e\u0442\u043e\u0432\u0438\u043c\u0441\u044f \u043a \u0448\u043a\u043e\u043b\u0435')
    c.drawRightString(W - m, 88, '\u0395\u03c4\u03bf\u03b9\u03bc\u03b1\u03c3\u03c4\u03b5\u03af\u03c4\u03b5 \u03b3\u03b9\u03b1 \u03c4\u03bf \u03c3\u03c7\u03bf\u03bb\u03b5\u03af\u03bf')
    c.showPage(); c.save()

# ---- contents (p.2) + letter from the editor (p.3)
def build_front(path, entries, pg):
    z = dict(leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    rows = []
    for n, (slug, dept, title) in enumerate(entries, 1):
        folio_ = pg[slug]
        rows.append([P(f'<font name="Bodoni-N" size="17" color="{ACC_HEX}">{folio_:02d}</font>', S('f', leading=20)),
                     P(dept.upper(), S('td', fontName='Jost-M', fontSize=6.2, leading=8.6, textColor=ACC, charSpace=1.2)),
                     P(esc(title), S('tt', fontName='FrD', fontSize=11.4, leading=13.2))])
    t = Table(rows, colWidths=[38, 138, FULLW - 176])
    t.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP'), ('LEFTPADDING', (0, 0), (-1, -1), 0), ('LINEBELOW', (0, 0), (-1, -2), 0.4, RULE),
                           ('TOPPADDING', (0, 0), (-1, -1), 4.6), ('BOTTOMPADDING', (0, 0), (-1, -1), 4.6)]))
    s = [P('CONTENTS', KICK), Spacer(1, 6), P('In this issue', S('c', fontName='FrD', fontSize=30, leading=33)), Spacer(1, 3),
         P(ISSUE + '  \u00b7  GET READY FOR SCHOOL', BYLINE), Spacer(1, 10), rule(FULLW, ACC, 0.9, 0, 2), t,
         NextPageTemplate('letter'), PageBreak()]
    # p.3 -- the letter is JY DM's to write: the page is designed and held
    class Ruled(Flowable):
        def wrap(self, aw, ah): return aw, 300
        def draw(self):
            c = self.canv; c.setStrokeColor(RULE); c.setLineWidth(0.5)
            for i in range(11): c.line(0, 300 - 20 - i * 27, FULLW, 300 - 20 - i * 27)
    s += [P("L\u2019\u00c9DITO  \u00b7  LETTER FROM THE EDITOR", KICK), Spacer(1, 12),
          P('A letter for the first day.', S('lt', fontName='FrD', fontSize=36, leading=40)), Spacer(1, 12), rule(60, ACC, 1.2, 0, 12),
          P('A welcome from JY DM, founder and editor, to open the issue.', DEK), Spacer(1, 26),
          P('Dear reader,', S('dr', fontName='Caveat', fontSize=22, leading=26, textColor=ACC)), Spacer(1, 6), Ruled(), Spacer(1, 10),
          P('PAGE RESERVED  \u00b7  THE LETTER IS TO BE WRITTEN BY JY DM', BYLINE)]
    return run(path, 2, 'Contents', s, [T_('toc', 'wide', bg_cream), T_('letter', 'wide', bg_cream)])

def build_credits2(path, first, slots):
    h = lambda t: [Spacer(1, 16), rule(FULLW, ACC, 0.9, 0, 6), P(t, KICK), Spacer(1, 7)]
    b = S('cb', fontSize=10.5, leading=15, spaceAfter=3.5)
    s = [P('BACK MATTER', KICK), Spacer(1, 8), P('Credits & colophon', TITLE_L), Spacer(1, 6)]
    s += h('EDITORIAL') + [P('Founder, author and editor: JY DM. Conversations: Alfinur M. with JY DM. Articles are set from the live COSYmagazine pages (cosylanguages.github.io/COSYmagazine).', b)]
    s += h('TYPEFACES  \u00b7  ALL OPEN-SOURCE (SIL OFL 1.1)')
    s += [P('<font name="Bodoni-M" size="13">Bodoni Moda</font> for the masthead and numerals. <font name="FrD" size="12">Fraunces</font> for headlines. EB Garamond for text. '
            '<font name="Jost-M" size="8.5">JOST</font> for labels and kickers. <font name="Caveat" size="14" color="%s">Caveat</font> for margin notes.' % ACC_HEX, b)]
    s += h('IMAGE CREDITS')
    s += [P('This proof contains no photographs. Image slots are reserved for COSY\u2019s own photography or public-domain / openly licensed work. '
            'Each image added later is listed here with its source, licence and author.', b), Spacer(1, 8)]
    rows = [['Slot', 'Source / author', 'Licence', 'Page']] + [[n, '\u2014', '\u2014', str(p)] for n, p in slots]
    cs = S('tc', fontName='Jost', fontSize=8, leading=11)
    t = Table([[P(esc(x), S('th', fontName='Jost-M', fontSize=6.6, leading=9, textColor=ACC, charSpace=1.2) if i == 0 else cs) for x in r] for i, r in enumerate(rows)],
              colWidths=[130, FULLW - 270, 90, 50])
    t.setStyle(TableStyle([('LINEBELOW', (0, 0), (-1, -1), 0.5, RULE), ('LEFTPADDING', (0, 0), (-1, -1), 0), ('TOPPADDING', (0, 0), (-1, -1), 6), ('BOTTOMPADDING', (0, 0), (-1, -1), 6)]))
    s += [t] + h('RIGHTS') + [P('\u00a9 2020\u20132026 COSY Languages. All rights reserved.', b)]
    return run(path, first, 'Back of Book', s, [T_('cred', 'wide', bg_cream)])

def build_notes(path, first):
    class Ruled(Flowable):
        def wrap(self, aw, ah): return aw, 470
        def draw(self):
            c = self.canv; c.setStrokeColor(RULE); c.setLineWidth(0.5)
            for i in range(17): c.line(0, 470 - 14 - i * 27, FULLW, 470 - 14 - i * 27)
    s = [P('YOUR NOTES', KICK), Spacer(1, 10), P('Words I want to say out loud', S('nt', fontName='FrD', fontSize=30, leading=34)), Spacer(1, 10), rule(60, ACC, 1.2, 0, 16), Ruled()]
    return run(path, first, 'Notes', s, [T_('notes', 'wide', bg_cream)])

FILL = [('\u201cThe limits of my language mean the limits of my world.\u201d', 'Ludwig Wittgenstein, 1921'),
        ('\u201cOne language sets you in a corridor for life. Two languages open every door along the way.\u201d', 'Frank Smith')]

def main():
    posts = load_edition(); p = lambda n: os.path.join(OUTDIR, n + '.pdf')
    by_slug = {d['slug']: d for d in posts}
    print('running order:'); [print('  ', d['printOrder'], d['section'], d['slug']) for d in posts]
    book = ['00_cover', '01_front']; pg = {}; slots = [('Cover', 1)]; fills = list(FILL); page = 4
    build_cover2(p('00_cover'))
    def add(name, builder, *a, **k):
        nonlocal page
        n = builder(p(name), page, *a, **k); book.append(name); page += n
    def need_even():
        nonlocal page
        if page % 2 == 1:
            q, cp = fills.pop(0); add(f'fill{page}', build_interlude2, q, cp)
    VISUAL = {'wonder_column': ('arch', 'wonder'), 'founder_interview': ('circle', 'founder'), 'culinary_salon': ('arch', 'culinary')}
    for d in posts:
        sec = d['section']; slug = d['slug']
        if sec in VISUAL: need_even(); slots.append((DEPT[sec] + ' opener', page))
        pg[slug] = page
        if slug == 'top-10-verbs': add(f'p_{slug}', B.build_lexicon)
        elif slug == 'top-100-a0-a1': add(f'p_{slug}', B.build_master)
        elif sec == 'thematic_crossword': add(f'p_{slug}', build_crossword, d)
        elif sec == 'founder_interview': add(f'p_{slug}', build_dept, d, qa=True, visual=VISUAL[sec], byline='Alfinur M. with James (JY DM)  \u00b7  7 min read', compact=False)
        else: add(f'p_{slug}', build_dept, d, visual=VISUAL.get(sec))
    while (page + 1) % 4 != 0:
        add(f'pad{page}', build_notes)
    add('98_credits', build_credits2, slots)
    build_back(p('99_back')); book.append('99_back'); page += 1
    entries = [(d['slug'], DEPT[d['section']], d['title']) for d in posts]
    build_front(p('01_front'), entries, pg)
    w = PdfWriter()
    for name in book:
        for pgo in PdfReader(p(name)).pages: w.add_page(pgo)
    w.add_metadata({'/Title': 'COSY Magazine, Vol. 2026.08, Get ready for school (English edition, proof)', '/Author': 'COSY Languages'})
    final = os.path.join(HERE, 'COSYmagazine_2026-08_Get-ready-for-school_EN_v2.pdf')
    with open(final, 'wb') as f: w.write(f)
    print('pages', len(w.pages), '->', final); print(pg)

if __name__ == '__main__':
    main()
