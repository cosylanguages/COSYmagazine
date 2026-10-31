#!/usr/bin/env python3
"""
Adds the Top 10 "full list" table (printable, downloadable as CSV) to Top 10 articles.

  python3 scripts/add_fulllists.py            # rewrite posts/*.json
  python3 scripts/add_fulllists.py --dry-run  # only report

The table is derived from the article's own content, so it never drifts from the text.
It is a normal `table` block with `printable: true` (see build-blog.js: bar + table, split over book pages).
Running it again replaces the previous table instead of adding a second one.
"""
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POSTS = os.path.join(ROOT, 'posts')
DRY = '--dry-run' in sys.argv

HEAD_VERBS = {
    'en': ['#', 'Verb', 'What it is for', 'Example', 'Useful phrases'],
    'fr': ['#', 'Verbe', 'À quoi il sert', 'Exemple', 'Expressions utiles'],
    'it': ['#', 'Verbo', 'A cosa serve', 'Esempio', 'Espressioni utili'],
    'ru': ['#', 'Глагол', 'Для чего нужен', 'Пример', 'Полезные выражения'],
    'el': ['#', 'Ρήμα', 'Τι εκφράζει', 'Παράδειγμα', 'Χρήσιμες εκφράσεις'],
    'es': ['#', 'Verbo', 'Para qué sirve', 'Ejemplo', 'Expresiones útiles'],
    'de': ['#', 'Verb', 'Wofür es dient', 'Beispiel', 'Nützliche Wendungen'],
    'pt': ['#', 'Verbo', 'Para que serve', 'Exemplo', 'Expressões úteis'],
}
HEAD_SYN = {
    'en': ['#', 'Common verb', 'You really mean…', 'Say instead', 'Example'],
    'fr': ['#', 'Verbe courant', 'Vous voulez dire…', 'Dites plutôt', 'Exemple'],
    'it': ['#', 'Verbo comune', 'Vuoi dire…', 'Meglio', 'Esempio'],
    'ru': ['#', 'Частый глагол', 'Вы хотите сказать…', 'Скажите точнее', 'Пример'],
    'el': ['#', 'Συνηθισμένο ρήμα', 'Θέλεις να πεις…', 'Πες καλύτερα', 'Παράδειγμα'],
}
TITLE = {  # shown on the toolbar
    'en': 'The full list', 'fr': 'La liste complète', 'it': 'L’elenco completo', 'ru': 'Полный список',
    'el': 'Ολόκληρη η λίστα', 'es': 'La lista completa', 'de': 'Die vollständige Liste', 'pt': 'A lista completa',
}
PHRASE_WORDS = re.compile(r'(expression|espression|выражен|εκφράσ|phrase|frase|wendung|redewendung|expresi|expressõ|useful|courant)', re.I)

# English part 1 is a long hand-written grammar guide: its summary rows are defined here.
EN_PART1 = [
    ('To be (am / is / are)', 'Identity, age, feelings, place', 'I am a student. / He is at home.', 'be on time, be quiet, be right'),
    ('To have (have / has)', 'Possession, family, states', 'I have a car. / She has a sister.', 'have breakfast, have a shower, have a good day'),
    ('To think', 'Opinions and thoughts', 'I think so. / What do you think?', 'think twice, think about, think of'),
    ('To know', 'Facts, people, skills', 'I know the answer. / I know how to drive.', 'let me know, as far as I know, you know'),
    ('To like', 'Preferences and taste', 'I like coffee. / Do you like sports?', 'like very much, would like, look like'),
    ('To want / would like', 'Wishes and polite requests', 'I want water. / I would like tea, please.', 'want to learn, would like to order, if you want'),
    ('To go / be going to', 'Movement and plans', 'I go to work. / We are going to eat.', 'go home, go shopping, go on foot'),
    ('Can (modal)', 'Ability and permission', 'I can speak English. / Can you help me?', 'can I have…, as fast as I can, can do'),
    ('To eat', 'Food and meals', 'I eat fruit. / Let’s eat out.', 'eat healthy, eat out, something to eat'),
    ('To drink', 'Drinks and hydration', 'I drink water. / He drinks coffee.', 'drink water, a hot drink, something to drink'),
]


def clean(s):
    s = re.sub(r'<[^>]+>', '', s or '')
    s = re.sub(r'\*\*(.+?)\*\*', r'\1', s)
    s = re.sub(r'(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)', r'\1', s)
    s = s.replace('\n', ' ')
    return re.sub(r'\s+', ' ', s).strip()


def strip_label(item):
    """'**Expressions courantes:** 'x', 'y'.' -> "'x', 'y'." """
    item = re.sub(r'^\s*[•\-]\s*', '', item)
    item = re.sub(r'^\*\*[^*]+\*\*:?\s*', '', item)
    item = re.sub(r'^\*[^*]+:\*\s*', '', item)
    return clean(item)


def rows_numbered_headings(blocks):
    """Part 1 of the per-language verb guides: heading '1. Être (To Be)', paragraph, conjugation table, usage list."""
    rows = []
    i = 0
    n = len(blocks)
    while i < n:
        b = blocks[i]
        m = re.match(r'^\s*(\d+)\.\s+(.+)$', b.get('text', '')) if b.get('type') == 'heading' else None
        if m and int(m.group(1)) <= 10:
            num, name = m.group(1), clean(m.group(2))
            desc = example = phrases = ''
            j = i + 1
            while j < n and not (blocks[j].get('type') == 'heading' and re.match(r'^\s*\d+\.\s', blocks[j].get('text', ''))):
                bj = blocks[j]
                if bj['type'] == 'heading' and bj.get('level', 3) <= 2:
                    break
                if bj['type'] == 'paragraph' and not desc and not bj.get('html'):
                    desc = clean(bj.get('text', ''))
                elif bj['type'] == 'table' and not example and bj.get('rows'):
                    r = bj['rows'][2] if len(bj['rows']) > 2 else bj['rows'][0]
                    example = clean(r[-1])
                elif bj['type'] == 'list-item' and not phrases and bj.get('items'):
                    items = bj['items']
                    pick = next((it for it in items if PHRASE_WORDS.search(it.split(':')[0])), items[-1])
                    phrases = strip_label(pick)
                j += 1
            rows.append([num, name, desc, example, phrases])
            i = j
            continue
        i += 1
    return rows if len(rows) >= 8 else []


def rows_list_items(blocks):
    """Parts 2 and 3: one list-item block, '**1. Title:** desc\\n  • *Usage:* ...\\n  • *Phrases:* ...'."""
    rows = []
    for b in blocks:
        if b.get('type') != 'list-item':
            continue
        for it in b.get('items', []):
            m = re.match(r'^\s*\*\*\s*(\d+)\.\s*(.+?)\s*:?\s*\*\*\s*:?\s*(.*)$', it.split('\n')[0])
            if not m:
                continue
            bullets = [strip_label(x) for x in it.split('\n')[1:] if x.strip()]
            rows.append([m.group(1), clean(m.group(2)), clean(m.group(3)),
                         bullets[0] if bullets else '', bullets[1] if len(bullets) > 1 else ''])
    return rows if len(rows) >= 8 else []


def rows_synonyms(blocks):
    """Verb-synonym cards: one row per 'what you mean' line."""
    rows = []
    for b in blocks:
        h = b.get('html') or ''
        if 'class="vcard"' not in h:
            continue
        for sec in re.findall(r'<section class="vcard".*?</section>', h, flags=re.S):
            num = re.search(r'vcard-num[^>]*>(\d+)<', sec)
            title = re.search(r'vcard-title[^>]*>(.*?)</h4>', sec)
            if not (num and title):
                continue
            for li in re.findall(r'<li class="vrow">.*?</li>', sec, flags=re.S):
                meaning = re.search(r'vrow-meaning">(.*?)</div>', li, flags=re.S)
                verbs = re.search(r'vrow-verbs">(.*?)</div>', li, flags=re.S)
                ex = re.search(r'vrow-ex">(.*?)</div>', li, flags=re.S)
                if not (meaning and verbs):
                    continue
                tags = [clean(re.sub(r'<span class="vtag-ic".*?</span>', '', t, flags=re.S)) for t in re.findall(r'<span class="vtag[^"]*"[^>]*>(.*?)</span>(?=<span class="vtag|$)', verbs.group(1), flags=re.S)]
                tags = [t for t in tags if t] or [clean(re.sub(r'<span class="vtag-ic".*?</span>', '', verbs.group(1), flags=re.S))]
                example = ''
                if ex:
                    example = clean(ex.group(1).replace('→', '→ '))
                # the verb is repeated on every row so a CSV or a printout of any part of the list is complete
                rows.append([num.group(1), clean(title.group(1)), clean(meaning.group(1)), ' / '.join(tags), example])
    return rows if len(rows) >= 10 else []


def table_frames(blocks):
    """Sentence frames already have a 10-row table: mark the first one printable."""
    for b in blocks:
        if b.get('type') == 'table' and len(b.get('rows', [])) == 10 and b.get('headers', [''])[0].strip() == '#':
            return b
    return None


def rows_frames_list(blocks):
    """Minor-language sentence-frame pages keep the 10 frames in a list: '**1. frame** → *example* (for describing)'."""
    for b in blocks:
        if b.get('type') != 'list-item':
            continue
        rows = []
        for it in b.get('items', []):
            m = re.match(r'^\s*\*\*\s*(\d+)\.\s*(.+?)\s*\*\*\s*→\s*\*(.+?)\*\s*(?:\((.+?)\))?', it)
            if m:
                rows.append([m.group(1), clean(m.group(2)), clean(m.group(3)), clean(m.group(4) or '')])
        if len(rows) == 10:
            return rows
    return []


def insert_index(blocks):
    """The list sits at the start of the article: after the introduction, before the first section heading."""
    for idx, b in enumerate(blocks):
        if idx >= 2 and (b.get('type') == 'heading' or (b.get('webOnly') and 'page-break-hint' in (b.get('html') or ''))):
            return idx
    return min(2, len(blocks))


def process(path):
    d = json.load(open(path, encoding='utf-8'))
    slug, lang, blocks = d['slug'], d['language'], d['blocks']
    blocks[:] = [b for b in blocks if b.get('listId') != 'top10']  # drop the table of a previous run
    kind, block = None, None

    if re.fullmatch(r'top-10-verbs(-part-[23])?(-[a-z]{2})?', slug) and len(blocks) > 3:
        if slug == 'top-10-verbs-en':
            rows = [[str(i + 1), r[0], r[1], r[2], r[3]] for i, r in enumerate(EN_PART1)]
            head = HEAD_VERBS['en']
        elif re.fullmatch(r'top-10-verbs-[a-z]{2}', slug):
            rows = rows_numbered_headings(blocks)
            head = HEAD_VERBS.get(lang, HEAD_VERBS['en'])
        else:
            rows = rows_list_items(blocks)
            head = HEAD_VERBS.get(lang, HEAD_VERBS['en'])
        kind = 'verbs'
    elif slug.startswith('top-10-verb-synonyms-'):
        rows = rows_synonyms(blocks)
        head = HEAD_SYN.get(lang, HEAD_SYN['en'])
        kind = 'synonyms'
    elif slug.startswith('stop-translating-10-sentence-frames'):
        t = table_frames(blocks)
        if t:
            t['printable'] = True
            t['listId'] = 'frames'
            t['listTitle'] = TITLE.get(lang, TITLE['en'])
            t['csvName'] = slug
            if not DRY:
                json.dump(d, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
                open(path, 'a').write('\n')
            return slug, 'frames', 10
        rows = rows_frames_list(blocks)
        if rows:
            blocks.insert(insert_index(blocks), {
                'type': 'table', 'printable': True, 'listId': 'top10', 'csvName': slug,
                'listTitle': TITLE.get(lang, TITLE['en']),
                'headers': ['#', 'Structure', 'Example', 'To describe'], 'rows': rows, 'webOnly': True})
            if not DRY:
                json.dump(d, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
                open(path, 'a').write('\n')
            return slug, 'frames', 10
        return slug, 'frames', 0
    else:
        return None

    if not rows:
        return slug, kind, 0
    block = {
        'type': 'table', 'printable': True, 'listId': 'top10', 'csvName': slug,
        'listTitle': TITLE.get(lang, TITLE['en']),
        'headers': head, 'rows': rows, 'webOnly': True,
    }
    blocks.insert(insert_index(blocks), block)
    if not DRY:
        json.dump(d, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
        open(path, 'a').write('\n')
    return slug, kind, len(rows)


if __name__ == '__main__':
    report = []
    for p in sorted(glob.glob(os.path.join(POSTS, '*.json'))):
        r = process(p)
        if r:
            report.append(r)
    for slug, kind, n in report:
        print(f'{"OK " if n else "-- "} {slug:58} {kind:9} rows={n}')
    print(f'\n{sum(1 for r in report if r[2])}/{len(report)} articles got a full list.')
