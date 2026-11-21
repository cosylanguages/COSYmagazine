#!/usr/bin/env python3
"""
COSYmagazine, Vol. 2026.08 "Get ready for school" -> Vogue-inspired PDF (English edition)

Content : fetched from github.com/cosylanguages/COSYmagazine (article HTML)
Fonts   : Bodoni Moda, Fraunces, EB Garamond, Jost, Caveat  (all SIL OFL 1.1)
Images  : none generated. Drop your own / public-domain images into ./images as
          cover.jpg, essay.jpg, interview.jpg and re-run; empty slots draw a placeholder.
"""
import os, re, html, sys
from bs4 import BeautifulSoup, NavigableString, Tag
from PIL import Image
from fontTools.ttLib import TTFont as FTFont
from pypdf import PdfReader, PdfWriter
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas as rl_canvas
from reportlab.platypus import (CondPageBreak, BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer,
                                NextPageTemplate, PageBreak, FrameBreak, Flowable,
                                KeepTogether, Table, TableStyle, HRFlowable)

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.environ.get('COSY_REPO', os.path.join(HERE, 'repo'))   # repo root: generated <slug>.html
FONTS = os.path.join(HERE, 'fonts')
IMG = os.path.join(HERE, 'images')
OUT = os.path.join(HERE, 'out'); os.makedirs(OUT, exist_ok=True)

# ------------------------------------------------------------------ page + palette
W, H = 210 * 72 / 25.4, 275 * 72 / 25.4
ML = MR = 54; MT = 62; MB = 72; GUT = 22
CW = (W - ML - MR - GUT) / 2
FULLW = W - ML - MR
INK = HexColor('#1a1a18'); CREAM = HexColor('#faf7f2'); MUTED = HexColor('#6b6b66')
FIELD = HexColor('#0F6E56')          # one accent per issue: August teal
ACC = HexColor('#0F6E56')            # accent as text on cream
MINT = HexColor('#bfe6df'); TINT = HexColor('#e8f2ef'); RULE = HexColor('#c9ddd8')
ACC_HEX = '#0F6E56'

ISSUE = 'VOL. 2026.08'

# ------------------------------------------------------------------ fonts
def reg(name, f): pdfmetrics.registerFont(TTFont(name, os.path.join(FONTS, f)))
reg('Bodoni-M', 'BodoniMasthead.ttf'); reg('Bodoni-N', 'BodoniNumeral.ttf'); reg('Bodoni-I', 'BodoniItalic.ttf')
reg('FrD', 'FrauncesDisplay.ttf'); reg('FrI', 'FrauncesItalic.ttf')
reg('EBG', 'EBG-Regular.ttf'); reg('EBG-B', 'EBG-Bold.ttf'); reg('EBG-I', 'EBG-Italic.ttf'); reg('EBG-BI', 'EBG-BoldItalic.ttf')
reg('Jost', 'Jost-Regular.ttf'); reg('Jost-M', 'Jost-Medium.ttf'); reg('Caveat', 'Caveat-SemiBold.ttf')
pdfmetrics.registerFontFamily('EBG', normal='EBG', bold='EBG-B', italic='EBG-I', boldItalic='EBG-BI')
pdfmetrics.registerFontFamily('FrD', normal='FrD', bold='FrD', italic='FrI', boldItalic='FrI')
pdfmetrics.registerFontFamily('Jost', normal='Jost', bold='Jost-M', italic='Jost', boldItalic='Jost-M')

def cap_height(fontfile):
    f = FTFont(os.path.join(FONTS, fontfile))
    return f['OS/2'].sCapHeight / f['head'].unitsPerEm

try:
    import pyphen  # noqa
    HY = dict(hyphenationLang='en_GB', hyphenationMinWordLength=6, uriWasteReduce=0.0)
    BODY_ALIGN = TA_JUSTIFY
except Exception:
    HY = {}; BODY_ALIGN = TA_LEFT

# ------------------------------------------------------------------ styles
def S(name, **kw):
    base = dict(fontName='EBG', fontSize=10.3, leading=14.6, textColor=INK, alignment=TA_LEFT)
    base.update(kw); return ParagraphStyle(name, **base)

BODY = S('body', alignment=BODY_ALIGN, spaceAfter=6.5, allowWidows=0, allowOrphans=0, **HY)
BODY_NI = S('bodyni', parent=BODY) if False else S('bodyni', alignment=BODY_ALIGN, spaceAfter=6.5, **HY)
QUESTION = S('q', fontName='EBG-I', textColor=ACC, spaceBefore=4, spaceAfter=3.5, alignment=TA_LEFT)
KICK = S('kick', fontName='Jost-M', fontSize=7.4, leading=10, textColor=ACC, charSpace=1.7)
TITLE = S('title', fontName='FrD', fontSize=37, leading=39.5, textColor=INK)
TITLE_L = S('titlel', fontName='FrD', fontSize=44, leading=46, textColor=INK)
DEK = S('dek', fontName='FrI', fontSize=15, leading=20.5, textColor=HexColor('#33332f'))
BYLINE = S('by', fontName='Jost-M', fontSize=7.2, leading=10, textColor=MUTED, charSpace=1.4)
H2N = S('h2n', fontName='Jost-M', fontSize=7.2, leading=9, textColor=ACC, charSpace=1.8, spaceBefore=15)
H2 = S('h2', fontName='FrD', fontSize=15.5, leading=18.5, spaceAfter=7)
SMALL = S('small', fontSize=8.8, leading=12, spaceAfter=3, alignment=TA_LEFT)
CTA = S('cta', fontName='Jost-M', fontSize=7.2, leading=11, textColor=ACC, charSpace=1.3, spaceBefore=4, spaceAfter=2)

H3 = S('h3', fontName='Jost-M', fontSize=7.2, leading=10, textColor=ACC, charSpace=1.6, spaceBefore=9, spaceAfter=4)
TITLE_M = S('titlem', fontName='FrD', fontSize=31, leading=34, textColor=INK)
TITLE_S = S('titles', fontName='FrD', fontSize=26, leading=29, textColor=INK)

def roman(n): return ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][n]

# ------------------------------------------------------------------ text cleaning
EMOJI = re.compile('[\U0001F000-\U0001FAFF\u2600-\u27BF\u2B00-\u2BFF\u25A0-\u25FF\uFE0F\u200D\u20E3]')

def clean(s):
    s = s.replace('\u2794', '\u2192')                 # ➔ -> →
    s = EMOJI.sub('', s)
    return s

def typo(markup):
    """typographic quotes outside tags; route arrows/≠ to EB Garamond (other faces lack them)"""
    parts = re.split(r'(<[^>]+>)', markup); out = []; prev = ' '
    for p in parts:
        if p.startswith('<') and p.endswith('>'):
            out.append(p); continue
        buf = []
        for ch in p:
            if ch == '"':
                ch = '\u201c' if (prev.isspace() or prev in '([{\u2014\u2013\u2018\u201c/') else '\u201d'
            elif ch == "'":
                ch = '\u2019' if (prev.isalnum() or prev in '.,!?)\u201d') else '\u2018'
            buf.append(ch); prev = ch
        out.append(''.join(buf))
    m = ''.join(out)
    m = re.sub(r'([\u2192\u2260\u2197])', r'<font name="EBG">\1</font>', m)
    return re.sub(r'\s+', ' ', m).strip()

def esc(t): return html.escape(clean(t), quote=False)

def inline(node, size=10.3):
    out = []
    for ch in node.children:
        if isinstance(ch, NavigableString):
            out.append(esc(str(ch)))
        elif isinstance(ch, Tag):
            n = ch.name; cls = ' '.join(ch.get('class', []))
            inner = inline(ch, size)
            if n in ('em', 'i'): out.append(f'<i>{inner}</i>')
            elif n in ('strong', 'b'): out.append(f'<b>{inner}</b>')
            elif n == 'mark': out.append(f'<font name="Caveat" color="{ACC_HEX}" size="{size*1.28:.1f}">{inner}</font>')
            elif 'doodle' in cls: out.append(f'<font color="{ACC_HEX}"><i>{inner}</i></font>')
            elif n == 'a':
                href = ch.get('href', '')
                if href.startswith('http'): out.append(f'<a href="{html.escape(href)}" color="{ACC_HEX}">{inner}</a>')
                else: out.append(inner)
            elif n == 'br': out.append('<br/>')
            else: out.append(inner)
    return ''.join(out)

def P(markup, style): return Paragraph(typo(markup), style)

# ------------------------------------------------------------------ low-level drawing helpers
def tracked(c, text, x, y, font, size, space=1.5, color=INK, align='l'):
    w = stringWidth(text, font, size) + space * max(len(text) - 1, 0)
    if align == 'r': x -= w
    elif align == 'c': x -= w / 2
    c.saveState()
    t = c.beginText(x, y); t.setFont(font, size); t.setCharSpace(space); t.setFillColor(color); t.textOut(text); t.setCharSpace(0); c.drawText(t)
    c.restoreState()
    return w

def arch_path(c, x, y, w, h):
    r = w / 2; p = c.beginPath(); p.moveTo(x, y); p.lineTo(x, y + h - r)
    p.arcTo(x, y + h - 2 * r, x + w, y + h, startAng=180, extent=-180); p.lineTo(x + w, y); p.close(); return p

def shape_path(c, shape, x, y, w, h):
    if shape == 'arch': return arch_path(c, x, y, w, h)
    p = c.beginPath()
    if shape == 'circle': p.circle(x + w / 2, y + h / 2, min(w, h) / 2)
    else: p.rect(x, y, w, h)
    return p

def ruled(c, x0, y0, x1, y1, gap=21, alpha=0.10, color=CREAM, width=0.6):
    c.saveState(); c.setStrokeColor(color); c.setStrokeAlpha(alpha); c.setLineWidth(width)
    y = y1 - gap * 2
    while y > y0: c.line(x0, y, x1, y); y -= gap
    c.restoreState()

def draw_slot(c, shape, x, y, w, h, key):
    """image slot: real photo if images/<key>.(jpg|png) exists, otherwise a quiet placeholder"""
    c.saveState(); p = shape_path(c, shape, x, y, w, h); found = None
    for ext in ('jpg', 'jpeg', 'png'):
        fp = os.path.join(IMG, f'{key}.{ext}')
        if os.path.exists(fp): found = fp
    if found:
        c.clipPath(p, stroke=0, fill=0)
        iw, ih = Image.open(found).size; s = max(w / iw, h / ih)
        c.drawImage(found, x + (w - iw * s) / 2, y + (h - ih * s) / 2, iw * s, ih * s)
    else:
        c.setFillColor(HexColor('#3a9a85')); c.drawPath(p, stroke=0, fill=1)
        c.clipPath(p, stroke=0, fill=0)
        ruled(c, x, y, x + w, y + h, gap=21, alpha=0.20)
    c.restoreState()
    if not found:   # inset keyline, in the manner of a photo mount
        c.saveState(); c.setStrokeColor(CREAM); c.setStrokeAlpha(0.55); c.setLineWidth(0.7)
        inset = 9
        c.drawPath(shape_path(c, shape, x + inset, y + inset, w - 2 * inset, h - 2 * inset), stroke=1, fill=0)
        c.restoreState()

# ------------------------------------------------------------------ footers / page chrome
class Doc(BaseDocTemplate):
    first_page = 1; section = ''

def folio(c, doc, dark=False):
    n = doc.page + doc.first_page - 1
    col = CREAM if dark else INK; sub = MINT if dark else MUTED
    c.saveState()
    c.setStrokeColor(CREAM if dark else RULE); c.setStrokeAlpha(0.45 if dark else 1); c.setLineWidth(0.5)
    c.line(ML, 52, W - MR, 52)
    if n % 2 == 0:
        c.setFont('Bodoni-N', 12); c.setFillColor(col); c.drawString(ML, 36, str(n))
        tracked(c, 'COSY  \u00b7  ' + ISSUE, ML + 26, 37.5, 'Jost-M', 6.4, 1.6, sub)
    else:
        c.setFont('Bodoni-N', 12); c.setFillColor(col); c.drawRightString(W - MR, 36, str(n))
        tracked(c, (doc.section or 'COSY').upper(), W - MR - 26, 37.5, 'Jost-M', 6.4, 1.6, sub, 'r')
    c.restoreState()

def bg_cream(c, doc):
    c.saveState(); c.setFillColor(CREAM); c.rect(0, 0, W, H, stroke=0, fill=1); c.restoreState()
    folio(c, doc)

def mk_frames(kind):
    z = dict(leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    hh = H - MT - MB
    if kind == 'wide':  return [Frame(ML, MB, FULLW, hh, id='w', **z)]
    if kind == 'body':  return [Frame(ML, MB, CW, hh, id='c1', **z), Frame(ML + CW + GUT, MB, CW, hh, id='c2', **z)]
    if kind in ('first', 'first_s'):
        HEAD = 240 if kind == 'first' else 168; bh = hh - HEAD - 14
        return [Frame(ML, H - MT - HEAD, FULLW, HEAD, id='h', **z),
                Frame(ML, MB, CW, bh, id='c1', **z), Frame(ML + CW + GUT, MB, CW, bh, id='c2', **z)]

def T_(name, kind, on): return PageTemplate(id=name, frames=mk_frames(kind) if kind else [Frame(0, 0, 1, 1, id='x')], onPage=on)

def make_opener(shape, key, kicker):
    def draw(c, doc):
        c.saveState(); c.setFillColor(FIELD); c.rect(0, 0, W, H, stroke=0, fill=1); c.restoreState()
        ruled(c, 0, 0, W, H, gap=21, alpha=0.07)
        aw = 372 if shape == 'arch' else 340; ah = 540 if shape == 'arch' else 340
        x = (W - aw) / 2; y = 150 if shape == 'arch' else 215
        draw_slot(c, shape, x, y, aw, ah, key)
        tracked(c, kicker, ML, H - 46, 'Jost-M', 7.2, 1.8, MINT)
        tracked(c, ISSUE, W - MR, H - 46, 'Jost-M', 7.2, 1.8, MINT, 'r')
        folio(c, doc, dark=True)
    return draw

# ------------------------------------------------------------------ flowable furniture
class CapFlow(Flowable):
    def __init__(self, ch, size, height, ascent, leading):
        super().__init__(); self.ch = ch; self.size = size; self.h = height; self.asc = ascent; self.lead = leading
        self.w = stringWidth(ch, 'Bodoni-N', size) + 8
    def wrap(self, aw, ah): return self.w, self.h
    def draw(self):
        c = self.canv; c.setFont('Bodoni-N', self.size); c.setFillColor(ACC)
        c.drawString(0, self.h - self.asc - 2 * self.lead, self.ch)

def split_markup(tokens, i):
    stack = []
    for t in tokens[:i]:
        if t.startswith('</'):
            if stack: stack.pop()
        elif t.startswith('<') and not t.endswith('/>'): stack.append(t)
    nm = lambda t: re.match(r'<\s*([a-zA-Z0-9]+)', t).group(1)
    head = ''.join(tokens[:i]) + ''.join(f'</{nm(t)}>' for t in reversed(stack))
    tail = ''.join(stack) + ''.join(tokens[i:])
    return head, tail

def dropcap(markup, width, style, lines=3, size=None):
    size = size or round(style.leading * 3.42)
    markup = typo(markup)
    m = re.match(r'^([^<\s])(.*)$', markup, re.S)
    if not m: return [Paragraph(markup, style)]
    letter, rest = m.group(1), m.group(2)
    capw = stringWidth(letter, 'Bodoni-N', size) + 8; nw = width - capw
    toks = re.findall(r'<[^>]+>|\s+|[^<\s]+', rest)
    def nlines(i):
        h, _ = split_markup(toks, i); p = Paragraph(h, style); p.wrap(nw, 10000); return len(p.blPara.lines)
    lo, hi = 1, len(toks)
    while lo < hi:
        mid = (lo + hi + 1) // 2
        if nlines(mid) <= lines: lo = mid
        else: hi = mid - 1
    head, tail = split_markup(toks, lo)
    asc = pdfmetrics.getAscentDescent(style.fontName, style.fontSize)[0]
    cap = CapFlow(letter, size, lines * style.leading, asc, style.leading)
    hs = ParagraphStyle('hd', parent=style, justifyLastLine=1 if style.alignment == TA_JUSTIFY else 0)
    t = Table([[cap, Paragraph(head, hs)]], colWidths=[capw, nw])
    t.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP'), ('LEFTPADDING', (0, 0), (-1, -1), 0),
                           ('RIGHTPADDING', (0, 0), (-1, -1), 0), ('TOPPADDING', (0, 0), (-1, -1), 0), ('BOTTOMPADDING', (0, 0), (-1, -1), 0)]))
    out = [t]
    if tail.strip(): out.append(Paragraph(tail, style))
    return out

def box(content, bg=TINT, rule=ACC, w=CW, pad=9):
    t = Table([[content]], colWidths=[w])
    t.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, -1), bg), ('LINEBEFORE', (0, 0), (0, -1), 2.2, rule),
                           ('LEFTPADDING', (0, 0), (-1, -1), pad + 2), ('RIGHTPADDING', (0, 0), (-1, -1), pad),
                           ('TOPPADDING', (0, 0), (-1, -1), pad - 1), ('BOTTOMPADDING', (0, 0), (-1, -1), pad)]))
    return t

def rule(w=CW, color=ACC, t=0.7, sb=0, sa=0): return HRFlowable(width=w, thickness=t, color=color, spaceBefore=sb, spaceAfter=sa, hAlign='LEFT')

def chapter(num, text):
    return KeepTogether([CondPageBreak(75), P(roman(num) if isinstance(num, int) else num, H2N), P(text, H2)])

def header_block(kicker, title, dek, byline, tstyle=TITLE):
    return [P(kicker.upper(), KICK), Spacer(1, 10), P(title, tstyle), Spacer(1, 11), rule(60, ACC, 1.2, 0, 11),
            P(dek, DEK), Spacer(1, 11), P(byline.upper(), BYLINE), FrameBreak()]

# ------------------------------------------------------------------ article HTML -> flowables
def load(slug):
    return BeautifulSoup(open(os.path.join(SRC, slug + '.html'), encoding='utf-8').read(), 'html.parser').find('article')

def render_article(art, qa=False):
    fl = []; n_h2 = 0; first = True
    for el in art.find_all(recursive=False):
        cls = ' '.join(el.get('class', [])); name = el.name
        if name == 'p' and 'gazette-drop-cap' in cls and first:
            fl += dropcap(inline(el), CW, BODY); first = False; continue
        first = False
        if name == 'p':
            strong = el.find('strong')
            if qa and strong and strong.get_text().strip().endswith(':') and el.contents and el.contents[0] is strong:
                who = strong.get_text().strip().rstrip(':'); strong.extract()
                label = f'<font name="Jost-M" size="6.6" color="{ACC_HEX}">{esc(who).upper()}</font><br/>'
                fl.append(P(label + inline(el), QUESTION if who.startswith('Alfinur') else BODY))
            else: fl.append(P(inline(el), BODY))
        elif name == 'h2':
            txt = clean(el.get_text(' ', strip=True)).strip()
            if txt.lower().startswith('further reading'):
                fl += [Spacer(1, 6), rule(CW, RULE, 0.6, 4, 6), P('FURTHER READING', KICK), Spacer(1, 5)]
            else:
                m = re.match(r'^Part\s+([IVX]+):\s*(.*)$', txt)
                if m: fl.append(chapter(m.group(1), m.group(2)))
                else: n_h2 += 1; fl.append(chapter(n_h2, txt))
        elif 'gazette-pullquote' in cls:
            q = el.find('p').get_text(' ', strip=True); cite = el.find('cite').get_text(' ', strip=True)
            qs = S('pq', fontName='FrI', fontSize=17.5, leading=22.5, textColor=INK, alignment=TA_LEFT, spaceBefore=4, spaceAfter=7)
            cs = S('pqc', fontName='Jost-M', fontSize=6.8, leading=9, textColor=ACC, charSpace=1.4)
            fl.append(KeepTogether([Spacer(1, 6), rule(CW, ACC, 0.9, 0, 9), P(esc(q), qs), P(esc(cite.lstrip('\u2014 ').upper()), cs), rule(CW, ACC, 0.9, 9, 10)]))
        elif 'gazette-example-box' in cls:
            tgt = el.find(class_='example-target'); gl = el.find(class_='example-gloss'); cx = el.find(class_='example-context')
            tg = S('ex1', fontName='EBG-I', fontSize=11.6, leading=15, textColor=ACC, spaceAfter=3)
            gs = S('ex2', fontSize=9.3, leading=12.8, spaceAfter=3); cs = S('ex3', fontName='Jost-M', fontSize=6.5, leading=9, textColor=MUTED, charSpace=1.1)
            inner = [P(inline(tgt), tg)]
            if gl: inner.append(P(inline(gl), gs))
            if cx: inner.append(P(esc(cx.get_text(' ', strip=True)).upper(), cs))
            fl += [KeepTogether([box(inner), Spacer(1, 9)])]
        elif 'gazette-marginalia' in cls:
            ti = el.find(class_='gazette-marginalia-title'); bo = el.find(class_='marginalia-body')
            ts = S('mg1', fontName='Jost-M', fontSize=7, leading=10, textColor=ACC, charSpace=1.3, spaceAfter=4)
            bs = S('mg2', fontName='EBG-I', fontSize=10, leading=13.8)
            fl += [KeepTogether([box([P(esc(ti.get_text(' ', strip=True)).upper(), ts), P(inline(bo), bs)], bg=TINT), Spacer(1, 9)])]
        elif name == 'h3':
            fl.append(KeepTogether([CondPageBreak(60), P(esc(el.get_text(' ', strip=True)).upper(), H3)]))
        elif 'format-quote-wall' in cls:
            qs = S('qw', fontName='FrI', fontSize=14, leading=18.5, spaceAfter=4)
            cs = S('qwc', fontName='Jost-M', fontSize=6.6, leading=9, textColor=ACC, charSpace=1.3)
            for tile in el.find_all(class_='quote-tile'):
                qt = tile.find(class_='quote-tile-text').get_text(' ', strip=True); au = tile.find(class_='quote-tile-author').get_text(' ', strip=True)
                fl.append(KeepTogether([rule(CW, ACC, 0.8, 3, 6), P(esc(qt), qs), P(esc(au.lstrip('\u2014 ')).upper(), cs), Spacer(1, 3)]))
        elif 'table-responsive-container' in cls:
            rows = []
            for ri, tr in enumerate(el.find('table').find_all('tr')):
                cells = [clean(c.get_text(' ', strip=True)).strip() for c in tr.find_all(['th', 'td'])]
                st = S('th2', fontName='Jost-M', fontSize=6.5, leading=9, textColor=ACC, charSpace=1.1) if ri == 0 else S('td2', fontSize=9.4, leading=12.4)
                rows.append([P(esc(c).upper() if ri == 0 else esc(c), st) for c in cells])
            t = Table(rows, colWidths=[CW * 0.44, CW * 0.56])
            t.setStyle(TableStyle([('LINEBELOW', (0, 0), (-1, -1), 0.5, RULE), ('VALIGN', (0, 0), (-1, -1), 'TOP'), ('LEFTPADDING', (0, 0), (-1, -1), 0),
                                   ('TOPPADDING', (0, 0), (-1, -1), 3.5), ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5)]))
            fl += [KeepTogether([t, Spacer(1, 8)])]
        elif name in ('ol', 'ul'):
            small = bool(re.search('further', ' '.join(art.get('class', []))))  # not used; further-reading handled below
            items = el.find_all('li', recursive=False)
            is_ref = len(items) > 3 and 'Horwitz' in items[0].get_text()
            st = S('li', fontSize=8.7 if is_ref else 10.3, leading=11.8 if is_ref else 14.2, leftIndent=17, bulletIndent=0,
                   spaceAfter=3.2 if is_ref else 4.5, bulletFontName='FrD', bulletFontSize=11, bulletColor=ACC, alignment=TA_LEFT)
            for i, li in enumerate(items, 1):
                fl.append(Paragraph(typo(inline(li)), st, bulletText=(f'{i}' if name == 'ol' else '\u2013')))
            fl.append(Spacer(1, 4))
        elif 'gazette-quiz-card' in cls:
            q = clean(el.find(class_='quiz-question').get_text(' ', strip=True)).strip()
            opts = el.find_all('button'); ex = el.find(class_='quiz-explanation')
            qs = S('qz1', fontName='FrI', fontSize=12.2, leading=16, spaceAfter=6)
            os_ = S('qz2', fontSize=9.6, leading=12.8, leftIndent=15, firstLineIndent=-15, spaceAfter=3)
            ks = S('qz3', fontName='Jost-M', fontSize=7, leading=10, textColor=ACC, charSpace=1.4, spaceAfter=5)
            inner = [P('QUICK CHECK', ks), P(esc(q), qs)]; right = ''
            for L, b in zip('ABCD', opts):
                txt = clean(b.find_all('span')[-1].get_text(' ', strip=True)).strip()
                inner.append(P(f'<font name="Jost-M" color="{ACC_HEX}">{L}</font>&nbsp;&nbsp;{esc(txt)}', os_))
                if b.get('data-correct') == 'true': right = L
            if ex: inner.append(P(f'<i><font name="Jost-M" size="7" color="{ACC_HEX}">ANSWER {right}.</font> {esc(ex.get_text(" ", strip=True))}</i>', S('qz4', fontSize=9, leading=12.2, spaceBefore=4)))
            fl += [KeepTogether([box(inner, bg=HexColor('#f1ece3'), rule=HexColor('#b8892b')), Spacer(1, 9)])]
        elif 'gazette-link-block' in cls:
            a = el.find('a'); href = a.get('href', '') if a else ''
            lab = clean(a.get_text(' ', strip=True)).strip().upper() if a else ''
            fl.append(KeepTogether([rule(CW, RULE, 0.6, 2, 2), Paragraph(typo(f'<a href="{href}" color="{ACC_HEX}">{html.escape(lab)}</a>'), CTA),
                                    Paragraph(typo(html.escape(href.replace('https://', '').rstrip('/'))), S('url', fontName='EBG-I', fontSize=8.5, textColor=MUTED, spaceAfter=6))]))
    return fl

# ------------------------------------------------------------------ PART BUILDERS
def run(path, first_page, section, story, templates):
    doc = Doc(path, pagesize=(W, H), leftMargin=0, rightMargin=0, topMargin=0, bottomMargin=0,
              title='COSY Magazine, Vol. 2026.08, Get ready for school', author='COSY Languages')
    doc.first_page = first_page; doc.section = section
    doc.addPageTemplates(templates); doc.build(story)
    return len(PdfReader(path).pages)

# ---- cover
def build_cover(path):
    c = rl_canvas.Canvas(path, pagesize=(W, H)); c.setTitle('COSY Magazine, Vol. 2026.08')
    c.setFillColor(FIELD); c.rect(0, 0, W, H, stroke=0, fill=1)
    m = 30
    tracked(c, ISSUE + '  \u00b7  AUGUST 2026', m, H - 36, 'Jost-M', 6.8, 1.8, MINT)
    tracked(c, 'THE BACK TO SCHOOL ISSUE', W - m, H - 36, 'Jost-M', 6.8, 1.8, MINT, 'r')
    # masthead (Didone) \u2013 spans ~92% of width
    target = W - 2 * m - 6; size = target / stringWidth('COSY', 'Bodoni-M', 1)
    capH = cap_height('BodoniMasthead.ttf') * size
    base = H - 62 - capH
    c.setFillColor(CREAM); c.setFont('Bodoni-M', size); c.drawCentredString(W / 2, base, 'COSY')
    c.setFont('Bodoni-I', 15); c.setFillColor(MINT)
    # photo window overlaps the masthead (the 'head-overlap' trick), then cover lines flank it
    aw = 262; ax = (W - aw) / 2; atop = base + capH * 0.42; ay = 196
    draw_slot(c, 'arch', ax, ay, aw, atop - ay, 'cover')
    c.setFillColor(CREAM); c.setFont('Caveat', 22)
    c.saveState(); c.translate(W / 2, ay + 44); c.rotate(-3); c.drawCentredString(0, 0, 'say it out loud'); c.restoreState()
    # cover lines: 4, two per flank, centre kept clear
    def coverline(x, ytop, w, kick, text, align=TA_LEFT):
        k = ParagraphStyle('k', fontName='Jost-M', fontSize=6.5, leading=9, textColor=MINT, charSpace=1.5, alignment=align)
        t = ParagraphStyle('t', fontName='FrD', fontSize=15.5, leading=18, textColor=CREAM, alignment=align)
        pk = Paragraph(kick, k); pt = Paragraph(typo(text), t)
        _, hk = pk.wrap(w, 100); _, ht = pt.wrap(w, 200)
        pk.drawOn(c, x, ytop - hk); pt.drawOn(c, x, ytop - hk - 5 - ht)
        return hk + 5 + ht
    lw = ax - m - 14; rx = ax + aw + 14; rw = W - m - rx
    coverline(m, 540, lw, 'THE LEAD ESSAY', 'Why speaking first is the only way to true fluency')
    coverline(m, 340, lw, 'IN CONVERSATION', 'The fear of lesson one, and the red pen')
    coverline(rx, 540, rw, 'THE LEXICON', 'Ten verbs to begin with', TA_LEFT)
    coverline(rx, 400, rw, 'THE MASTER LIST', 'One hundred chains of words for day one', TA_LEFT)
    # anchor headline (bottom third)
    c.setFillColor(CREAM); c.setFont('FrD', 58); c.drawString(m, 128, 'Get ready')
    c.setFont('FrI', 58); c.drawString(m, 72, 'for school')
    tracked(c, 'UNLEARNING THE RED PEN  \u00b7  SPEAKING FROM LESSON ONE', m, 50, 'Jost-M', 6.6, 1.7, MINT)
    # linguistic metadata
    c.setFont('EBG-I', 9.4); c.setFillColor(MINT)
    c.drawRightString(W - m, 128, 'cosy  /\u02c8ko\u028azi/')
    c.setFont('EBG-I', 8.6)
    c.drawRightString(W - m, 112, 'Pr\u00eats pour la rentr\u00e9e')
    c.drawRightString(W - m, 100, '\u0413\u043e\u0442\u043e\u0432\u0438\u043c\u0441\u044f \u043a \u0448\u043a\u043e\u043b\u0435')
    c.drawRightString(W - m, 88, '\u0395\u03c4\u03bf\u03b9\u03bc\u03b1\u03c3\u03c4\u03b5\u03af\u03c4\u03b5 \u03b3\u03b9\u03b1 \u03c4\u03bf \u03c3\u03c7\u03bf\u03bb\u03b5\u03af\u03bf')
    c.showPage(); c.save()

# ---- contents + note (pp. 2\u20133)
def build_toc(path, pg):
    def nums(k): return f'{pg[k]:02d}'
    ent = lambda folio_, title, sub, meta: [
        Table([[P(f'<font name="Bodoni-N" size="30" color="{ACC_HEX}">{folio_}</font>', S('x', leading=34)),
                [P(title, S('tt', fontName='FrD', fontSize=16.5, leading=19.5, spaceAfter=3)),
                 P(sub, S('ts', fontName='EBG-I', fontSize=10.8, leading=14, textColor=HexColor('#44443f'), spaceAfter=3)),
                 P(meta.upper(), S('tm', fontName='Jost-M', fontSize=6.5, leading=9, textColor=MUTED, charSpace=1.4))]]],
              colWidths=[58, FULLW - 58], style=TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP'), ('LEFTPADDING', (0, 0), (-1, -1), 0),
                                                            ('TOPPADDING', (0, 0), (-1, -1), 0), ('BOTTOMPADDING', (0, 0), (-1, -1), 12)]))]
    sec = lambda t: [Spacer(1, 6), rule(FULLW, ACC, 0.9, 0, 6), P(t, KICK), Spacer(1, 12)]
    s = [P('CONTENTS', KICK), Spacer(1, 6), P('In this issue', S('c', fontName='FrD', fontSize=40, leading=44)),
         Spacer(1, 4), P(ISSUE + '  \u00b7  GET READY FOR SCHOOL', BYLINE), Spacer(1, 22)]
    s += sec('FRONT OF BOOK')
    s += ent(nums('lex'), 'The Lexicon: ten verbs to begin with', 'The first ten high-frequency verbs, each with one true sentence to say out loud.', 'Words  \u00b7  A0\u2013A1')
    s += sec('THE WELL')
    s += ent(nums('essay'), 'Why speaking-first is the only way to true fluency', 'Grammar tables feel safe. Confidence comes when you open your mouth in lesson one.', 'Lead essay  \u00b7  6 min  \u00b7  A0\u2013B2')
    s += ent(nums('interview'), 'In conversation: Founder James on the fear of lesson one', 'Why articulate, accomplished adults freeze at the classroom door.', 'COSYtalks  \u00b7  7 min  \u00b7  A2\u2013C1')
    s += ent(nums('master'), 'The Master List: top 100 A0\u2013A1', 'One hundred progressive chains of words across ten domains, each with a can-do milestone.', 'Long read  \u00b7  12 min')
    s += sec('BACK OF BOOK')
    s += ent(nums('practice'), 'Your first three sentences', 'A page to write on.', 'Practice')
    s += ent(nums('credits'), 'Credits & colophon', 'Typefaces, image credits, and the next issue.', 'Back matter')
    s.append(NextPageTemplate('note')); s.append(PageBreak())
    # p3: note
    s += [P('A NOTE BEFORE YOU START', KICK), Spacer(1, 14),
          P('This is the Back to School issue.', S('n1', fontName='FrD', fontSize=30, leading=34)), Spacer(1, 14), rule(60, ACC, 1.2, 0, 14)]
    note = ('Its subject is the first lesson, and the fear that so often arrives before it. Inside, founder James (JY DM) talks about '
            'unlearning the red pen; the lead essay makes the case for speaking from minute one; and the Lexicon and the Master List '
            'give you the first words to say out loud.')
    s += [P(note, S('n2', fontName='EBG', fontSize=13.5, leading=20, spaceAfter=18)),
          Spacer(1, 30), rule(FULLW, ACC, 0.9, 0, 12),
          P('\u201cSchool taught us to stay silent until we were perfect. Life teaches us that perfection never speaks.\u201d', S('n3', fontName='FrI', fontSize=24, leading=30, spaceAfter=10)),
          P('JAMES (JY DM), FOUNDER OF COSY LANGUAGES', BYLINE), Spacer(1, 12), rule(FULLW, ACC, 0.9, 0, 0)]
    wide = lambda name: T_(name, 'wide', bg_cream)
    return run(path, 2, 'Contents', s, [wide('toc'), wide('note')])

# ---- Front of Book: the Lexicon (pp. 4\u20135)
def build_lexicon(path, first):
    tb = load('top-10-verbs').find('table'); rows = []
    for tr in tb.find_all('tr')[1:]:
        c = [clean(td.get_text(' ', strip=True)).strip() for td in tr.find_all('td')]; rows.append(c)
    def row(c):
        n, verb, meaning, ex = c
        exs = '<br/>'.join(P_ for P_ in [esc(x.strip()) for x in ex.split(' / ')])
        left = [P(esc(verb), S('v', fontName='FrD', fontSize=19, leading=22, spaceAfter=3)),
                P(esc(meaning).upper(), S('vm', fontName='Jost-M', fontSize=6.4, leading=9.2, textColor=MUTED, charSpace=1.1))]
        right = P(exs, S('ve', fontName='EBG-I', fontSize=13, leading=17.5, textColor=ACC))
        num = P(f'<font name="Bodoni-N" size="34" color="{ACC_HEX}">{int(n):02d}</font>', S('vn', leading=38))
        t = Table([[num, left, right]], colWidths=[58, 190, FULLW - 248])
        t.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP'), ('LINEABOVE', (0, 0), (-1, 0), 0.6, RULE), ('LEFTPADDING', (0, 0), (-1, -1), 0),
                               ('TOPPADDING', (0, 0), (-1, -1), 11), ('BOTTOMPADDING', (0, 0), (-1, -1), 12)])); return t
    s = [P('WORDS DESK  \u00b7  A0\u2013A1', KICK), Spacer(1, 10),
         P('Top 10 Essential Verbs for Absolute Beginners', TITLE), Spacer(1, 11), rule(60, ACC, 1.2, 0, 11),
         P('The ten essential verbs every beginner needs first: be, have, think, know, like, want, work and study, go, can, eat and drink. '
           'Say each example out loud before you read on.', DEK), Spacer(1, 22)]
    s += [row(r) for r in rows[:5]]
    s += [PageBreak()]
    s += [Spacer(1, 4)] + [row(r) for r in rows[5:]]
    s += [Spacer(1, 6), rule(FULLW, RULE, 0.6, 0, 0), Spacer(1, 16),
          box([P('TRY IT', S('t1', fontName='Jost-M', fontSize=7, leading=10, textColor=ACC, charSpace=1.5, spaceAfter=4)),
               P('Choose any verb from the list and say one true sentence about yourself, out loud. Then change one word and say it again.', S('t2', fontName='EBG-I', fontSize=12.5, leading=17))], w=FULLW),
          Spacer(1, 12), P('CONJUGATION TABLES FOR EVERY LANGUAGE: COSYTOOLS', CTA)]
    return run(path, first, 'Words Desk', s, [T_('lex', 'wide', bg_cream)])

# ---- long reads
def build_article(path, first, section, slug, opener, header, qa=False):
    shape, key, ok = opener
    z = dict(leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    temps = [PageTemplate(id='opener', frames=[Frame(0, 0, 2, 2, id='x', **z)], onPage=make_opener(shape, key, ok)),
             T_('first', 'first', bg_cream), T_('body', 'body', bg_cream)]
    story = [NextPageTemplate('first'), Spacer(1, 1), PageBreak(), NextPageTemplate('body')]
    story += header_block(*header[:4])
    story += render_article(load(slug), qa=qa)
    return run(path, first, section, story, temps)

def build_master(path, first):
    art = load('top-100-a0-a1'); story = [NextPageTemplate('body')]
    story += header_block('Words Desk  \u00b7  Long read  \u00b7  A0\u2013A1', 'Top 100 A0\u2013A1: The Semantic Master List', 
                          'One hundred progressive chains of words across ten ordered domains, each with a can-do milestone. Read each chain aloud, left to right.',
                          '12 min read  \u00b7  A0\u2013A1  \u00b7  14 languages online', tstyle=TITLE_M)
    secs = art.find_all('section', class_='domain-section')
    chain_st = S('ch', fontSize=11, leading=14, spaceAfter=0)
    lab_st = S('chl', fontName='Jost-M', fontSize=6.2, leading=8.4, textColor=MUTED, charSpace=1.1)
    for si, sec in enumerate(secs, 1):
        goal = clean(sec.find(class_='domain-goal').get_text(' ', strip=True)).strip()
        goal = re.sub(r'^Domain\s+\d+:\s*', '', goal)
        title = sec.find('h2').get_text(strip=True); desc = clean(sec.find(class_='domain-desc').get_text(' ', strip=True)).strip()
        head = KeepTogether([
            Table([[P(f'<font name="Bodoni-N" size="38" color="{ACC_HEX}">{si:02d}</font>', S('dn', leading=40)),
                    [P(esc(goal).upper(), S('dg', fontName='Jost-M', fontSize=6.4, leading=9, textColor=ACC, charSpace=1.3, spaceAfter=3)),
                     P(esc(title), S('dt', fontName='FrD', fontSize=17, leading=20))]]],
                  colWidths=[66, CW - 66], style=TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP'), ('LEFTPADDING', (0, 0), (-1, -1), 0),
                                                             ('TOPPADDING', (0, 0), (-1, -1), 0), ('BOTTOMPADDING', (0, 0), (-1, -1), 4)])),
            P(esc(desc), S('dd', fontName='EBG-I', fontSize=9.6, leading=13, textColor=HexColor('#44443f'), spaceAfter=7))])
        story += [Spacer(1, 12 if si > 1 else 0), rule(CW, ACC, 0.9, 0, 8), head]
        for card in sec.find_all(class_='chain-card'):
            lab = clean(card.find(class_='chain-head').find('span').get_text(' ', strip=True)).strip()
            m = re.match(r'Chain\s+(\d+)\s*\u00b7\s*(.*)', lab); num, nm = (m.group(1), m.group(2)) if m else ('', lab)
            body = card.find(class_='chain-body'); parts = []
            for sp in body.find_all('span', recursive=False):
                t = clean(sp.get_text(' ', strip=True)).strip()
                if 'chain-rel' in ' '.join(sp.get('class', [])):
                    parts.append(f'<font name="EBG-B" color="{ACC_HEX}">{"\u2260" if "\u2260" in t else "\u2192"}</font>')
                else: parts.append(esc(t))
            story.append(KeepTogether([P(f'{int(num):02d}  \u00b7  {esc(nm).upper()}', lab_st), Spacer(1, 1.5), P(' '.join(parts), chain_st), Spacer(1, 6.5)]))
        mb = sec.find(class_='milestone-box')
        if mb:
            ptxt = clean(mb.find('p').get_text(' ', strip=True)).strip()
            story.append(KeepTogether([Spacer(1, 3), box([P(f'MILESTONE {si}  \u00b7  CAN-DO GOAL', S('ml', fontName='Jost-M', fontSize=6.4, leading=9, textColor=ACC, charSpace=1.3, spaceAfter=3)),
                                                           P(esc(ptxt), S('mt', fontName='EBG-I', fontSize=10, leading=13.4))])]))
    return run(path, first, 'Words Desk', story, [T_('first', 'first_s', bg_cream), T_('body', 'body', bg_cream)])

# ---- interludes + back of book
def build_interlude(path, first, quote, cap):
    def on(c, doc):
        bg_cream(c, doc); ruled(c, 0, 0, W, H, gap=21, alpha=0.0)
    s = [Spacer(1, 190), P(esc(quote), S('iq', fontName='FrI', fontSize=34, leading=42, alignment=TA_LEFT)), Spacer(1, 18), rule(60, ACC, 1.2, 0, 12), P(esc(cap).upper(), BYLINE)]
    return run(path, first, 'The Well', s, [T_('inter', 'wide', on)])

def build_practice(path, first):
    def on(c, doc):
        bg_cream(c, doc)
    st = [P('BACK OF BOOK  \u00b7  PRACTICE', KICK), Spacer(1, 10), P('Your first three sentences', TITLE_L), Spacer(1, 11), rule(60, ACC, 1.2, 0, 11),
          P('Say each one out loud, then write it. Mistakes welcome: every sentence you cannot finish shows you what to learn next.', DEK), Spacer(1, 18)]
    class Lines(Flowable):
        def __init__(self, n, w, gap=30, prompt=None):
            super().__init__(); self.n = n; self.w = w; self.gap = gap; self.prompt = prompt
        def wrap(self, aw, ah): return self.w, self.n * self.gap + 6
        def draw(self):
            c = self.canv; c.setStrokeColor(RULE); c.setLineWidth(0.6)
            for i in range(self.n):
                y = self.n * self.gap - (i + 1) * self.gap + 6; c.line(0, y, self.w, y)
            if self.prompt:
                c.setFont('Caveat', 15); c.setFillColor(ACC); c.drawString(0, self.n * self.gap - self.gap + 10, self.prompt)
    prompts = ['Hi! I\u2019m ______________. I\u2019m from ______________. And you?', 'One thing I could not say today:', 'Sorry, can you say that again, please?']
    for i, pr in enumerate(prompts, 1):
        st += [P(roman(i), H2N), Lines(3 if i != 1 else 2, FULLW, 32, prompt=pr), Spacer(1, 10)]
    st += [Spacer(1, 6), box([P('TRY IT TODAY', S('tt', fontName='Jost-M', fontSize=7, leading=10, textColor=ACC, charSpace=1.5, spaceAfter=4)),
                              P('Say three sentences about yourself out loud in your target language, even if you are alone. Then pick one thing you could not say, look it up, and say the sentence again.', S('tt2', fontName='EBG-I', fontSize=12, leading=16.5))], w=FULLW)]
    return run(path, first, 'Back of Book', st, [T_('prac', 'wide', on)])

def build_credits(path, first, pg):
    h = lambda t: [Spacer(1, 16), rule(FULLW, ACC, 0.9, 0, 6), P(t, KICK), Spacer(1, 7)]
    b = S('cb', fontSize=10.5, leading=15, spaceAfter=3.5)
    s = [P('BACK MATTER', KICK), Spacer(1, 8), P('Credits & colophon', TITLE_L), Spacer(1, 6)]
    s += h('EDITORIAL')
    s += [P('Founder, author and editor: JY DM. The interview is conducted by Alfinur M. with James (JY DM). Articles originate on COSYmagazine (cosylanguages.github.io/COSYmagazine).', b)]
    s += h('TYPEFACES  \u00b7  ALL OPEN-SOURCE (SIL OFL 1.1)')
    s += [P('<font name="Bodoni-M" size="13">Bodoni Moda</font> for the masthead and numerals. <font name="FrD" size="12">Fraunces</font> for headlines. EB Garamond for text. '
            '<font name="Jost-M" size="8.5">JOST</font> for labels and kickers. <font name="Caveat" size="14" color="%s">Caveat</font> for margin notes.' % ACC_HEX, b)]
    s += h('IMAGE CREDITS')
    s += [P('This pilot edition contains no photographs. Three image slots are reserved (cover, lead essay opener, interview opener). '
            'Every image added later is listed here with its source, licence and author; public-domain and CC0 works need no credit but are recorded anyway.', b), Spacer(1, 8)]
    rows = [['Slot', 'Source / author', 'Licence', 'Page'], ['Cover', '\u2014', '\u2014', '1'],
            ['Lead essay opener', '\u2014', '\u2014', str(pg['essay'])], ['Interview opener', '\u2014', '\u2014', str(pg['interview'])]]
    cs = S('tc', fontName='Jost', fontSize=8, leading=11)
    t = Table([[P(esc(x), S('th', fontName='Jost-M', fontSize=6.6, leading=9, textColor=ACC, charSpace=1.2) if i == 0 else cs) for x in r] for i, r in enumerate(rows)],
              colWidths=[120, FULLW - 260, 90, 50])
    t.setStyle(TableStyle([('LINEBELOW', (0, 0), (-1, -1), 0.5, RULE), ('LEFTPADDING', (0, 0), (-1, -1), 0), ('TOPPADDING', (0, 0), (-1, -1), 6), ('BOTTOMPADDING', (0, 0), (-1, -1), 6)]))
    s += [t]
    s += h('RIGHTS')
    s += [P('\u00a9 2020\u20132026 COSY Languages. All rights reserved. Text is set from the live COSYmagazine articles; the typefaces remain the property of their designers under the SIL Open Font License.', b)]
    return run(path, first, 'Back of Book', s, [T_('cred', 'wide', bg_cream)])

def build_back(path):
    c = rl_canvas.Canvas(path, pagesize=(W, H))
    c.setFillColor(FIELD); c.rect(0, 0, W, H, stroke=0, fill=1); ruled(c, 0, 0, W, H, gap=21, alpha=0.07)
    c.setFillColor(CREAM)
    tracked(c, 'NEXT ISSUE', W / 2, H - 250, 'Jost-M', 7.4, 2.4, MINT, 'c')
    tracked(c, 'VOL. 2026.09', W / 2, H - 272, 'Jost-M', 7.4, 2.4, CREAM, 'c')
    c.setFont('FrI', 40); c.drawCentredString(W / 2, H - 330, 'Me vs')
    c.setFont('FrI', 40); c.drawCentredString(W / 2, H - 376, 'Intermediate Plateau')
    tracked(c, 'THE AUTUMN BREAKTHROUGH ISSUE', W / 2, H - 406, 'Jost-M', 6.8, 2.0, MINT, 'c')
    size = 74; c.setFont('Bodoni-M', size); c.drawCentredString(W / 2, 112, 'COSY')
    tracked(c, 'COSYLANGUAGES.GITHUB.IO/COSYMAGAZINE', W / 2, 78, 'Jost-M', 6.6, 1.8, MINT, 'c')
    c.showPage(); c.save()

# ------------------------------------------------------------------ assemble
FILL = [('\u201cEvery sentence you cannot finish is a map of what to learn next.\u201d', 'JY DM, founder of COSY Languages'),
        ('\u201cSorry, can you say that again, please?\u201d', 'The most important survival sentence for a beginner'),
        ('\u201cYour first words do not need to be perfect to be welcome.\u201d', 'From the lead essay')]

ESSAY = ('arch', 'essay', 'THE WELL  \u00b7  LEAD ESSAY')
ESSAY_H = ('The Well  \u00b7  Lead essay  \u00b7  A0\u2013B2', 'Why speaking-first is the only way to true fluency',
           'When you start learning a language, grammar tables feel safe. But true confidence comes when you open your mouth in lesson one, and treat mistakes as stepping stones.',
           'By JY DM  \u00b7  6 min read')
INTV = ('circle', 'interview', 'THE WELL  \u00b7  IN CONVERSATION')
INTV_H = ('The Well  \u00b7  COSYtalks  \u00b7  A2\u2013C1', 'In conversation: Founder James on the fear of lesson one',
          'Why do articulate, accomplished adults freeze at the classroom door? Founder James (JY DM) deconstructs childhood red ink, the myth of grammatical readiness, and how speaking from minute one heals the fear.',
          'Alfinur M. with James (JY DM)  \u00b7  7 min read')

def main():
    p = lambda n: os.path.join(OUT, n + '.pdf')
    book = ['00_cover', '01_toc']; pg = {}; fills = list(FILL)
    build_cover(p('00_cover'))
    page = 4                                            # contents + note occupy pp. 2-3
    def add(name, builder, *a, **k):
        nonlocal page
        n = builder(p(name), page, *a, **k); book.append(name); page += n
    def need_even():                                    # an opener visual must land on a left-hand page
        nonlocal page
        if page % 2 == 1:
            q, cp = fills.pop(0); add(f'fill{page}', build_interlude, q, cp)
    pg['lex'] = page;       add('02_lex', build_lexicon)
    need_even(); pg['essay'] = page;     add('03_essay', build_article, 'The Well', 'why-speaking-first', ESSAY, ESSAY_H)
    need_even(); pg['interview'] = page; add('04_interview', build_article, 'The Well', 'in-conversation-founder-august-school', INTV, INTV_H, qa=True)
    pg['master'] = page;    add('05_master', build_master)
    pg['practice'] = page;  add('06_practice', build_practice)
    while (page + 1) % 4 != 0:                          # book closes on a multiple of 4: credits + back cover = last two pages
        q, cp = fills.pop(0) if fills else ('\u201cSay it again. The second go is always smoother.\u201d', 'The lead essay')
        add(f'pad{page}', build_interlude, q, cp)
    pg['credits'] = page;   add('07_credits', build_credits, pg)
    build_back(p('08_back')); book.append('08_back'); page += 1
    build_toc(p('01_toc'), pg)
    w = PdfWriter()
    for name in book:
        for pgobj in PdfReader(p(name)).pages: w.add_page(pgobj)
    w.add_metadata({'/Title': 'COSY Magazine, Vol. 2026.08, Get ready for school (English edition)', '/Author': 'COSY Languages', '/Subject': 'Back to School Issue'})
    final = os.path.join(HERE, 'COSYmagazine_2026-08_Get-ready-for-school_EN.pdf')
    with open(final, 'wb') as f: w.write(f)
    print('pages', len(w.pages), pg, '->', final)

if __name__ == '__main__':
    main()
