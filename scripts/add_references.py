#!/usr/bin/env python3
"""
Adds a "Further reading" block (heading + list) to the end of articles, chosen by topic.

  python3 scripts/add_references.py            # rewrite posts/*.json
  python3 scripts/add_references.py --dry-run  # only report

- Replaces the generic "Academic Bibliography & SLA References" list that was pasted into unrelated articles.
- Leaves articles that already carry their own curated list (beyond-code-switching, creative-writing, go-off-script).
- References are web-only blocks (`webOnly`), so the teleprompter and stage mode do not read them out.
- Re-running replaces the previous block (marked with listId 'refs').

Entries are standard, widely cited works. Check page numbers against the publisher before print.
"""
import glob
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POSTS = os.path.join(ROOT, 'posts')
DRY = '--dry-run' in sys.argv

E = {
    'long83': "**Long, M. H. (1983).** Native speaker/non-native speaker conversation and the negotiation of comprehensible input. *Applied Linguistics, 4*(2), 126–141.",
    'swain85': "**Swain, M. (1985).** Communicative competence: Some roles of comprehensible input and comprehensible output in its development. In S. Gass & C. Madden (Eds.), *Input in Second Language Acquisition* (pp. 235–253). Newbury House.",
    'swain95': "**Swain, M. (1995).** Three functions of output in second language learning. In G. Cook & B. Seidlhofer (Eds.), *Principle and Practice in Applied Linguistics* (pp. 125–144). Oxford University Press.",
    'thornbury05': "**Thornbury, S. (2005).** *How to Teach Speaking.* Longman.",
    'krashen82': "**Krashen, S. (1982).** *Principles and Practice in Second Language Acquisition.* Pergamon.",
    'horwitz86': "**Horwitz, E. K., Horwitz, M. B., & Cope, J. (1986).** Foreign language classroom anxiety. *The Modern Language Journal, 70*(2), 125–132.",
    'macintyre94': "**MacIntyre, P. D., & Gardner, R. C. (1994).** The subtle effects of language anxiety on cognitive processing in the second language. *Language Learning, 44*(2), 283–305.",
    'coe20': "**Council of Europe (2020).** *Common European Framework of Reference for Languages: Learning, Teaching, Assessment – Companion Volume.* Council of Europe Publishing.",
    'ellis03': "**Ellis, R. (2003).** *Task-based Language Learning and Teaching.* Oxford University Press.",
    'willis96': "**Willis, J. (1996).** *A Framework for Task-Based Learning.* Longman.",
    'cepeda06': "**Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., & Rohrer, D. (2006).** Distributed practice in verbal recall tasks: A review and quantitative synthesis. *Psychological Bulletin, 132*(3), 354–380.",
    'lightbown13': "**Lightbown, P. M., & Spada, N. (2013).** *How Languages Are Learned* (4th ed.). Oxford University Press.",
    'scrivener11': "**Scrivener, J. (2011).** *Learning Teaching* (3rd ed.). Macmillan.",
    'richards08': "**Richards, J. C. (2008).** *Moving Beyond the Plateau: From Intermediate to Advanced Levels in Language Learning.* Cambridge University Press.",
    'selinker72': "**Selinker, L. (1972).** Interlanguage. *International Review of Applied Linguistics, 10*(3), 209–231.",
    'lewis93': "**Lewis, M. (1993).** *The Lexical Approach: The State of ELT and a Way Forward.* Language Teaching Publications.",
    'nation01': "**Nation, I. S. P. (2001).** *Learning Vocabulary in Another Language.* Cambridge University Press.",
    'schmitt10': "**Schmitt, N. (2010).** *Researching Vocabulary: A Vocabulary Research Manual.* Palgrave Macmillan.",
    'pawley83': "**Pawley, A., & Syder, F. H. (1983).** Two puzzles for linguistic theory: Nativelike selection and nativelike fluency. In J. C. Richards & R. W. Schmidt (Eds.), *Language and Communication* (pp. 191–226). Longman.",
    'wray02': "**Wray, A. (2002).** *Formulaic Language and the Lexicon.* Cambridge University Press.",
    'sinclair91': "**Sinclair, J. (1991).** *Corpus, Concordance, Collocation.* Oxford University Press.",
    'hoey05': "**Hoey, M. (2005).** *Lexical Priming: A New Theory of Words and Language.* Routledge.",
    'laufer95': "**Laufer, B., & Nation, P. (1995).** Vocabulary size and use: Lexical richness in L2 written production. *Applied Linguistics, 16*(3), 307–322.",
    'biber99': "**Biber, D., Johansson, S., Leech, G., Conrad, S., & Finegan, E. (1999).** *Longman Grammar of Spoken and Written English.* Longman.",
    'ellisn02': "**Ellis, N. C. (2002).** Frequency effects in language processing: A review with implications for theories of implicit and explicit language acquisition. *Studies in Second Language Acquisition, 24*(2), 143–188.",
    'davies10': "**Davies, M., & Gardner, D. (2010).** *A Frequency Dictionary of Contemporary American English.* Routledge.",
    'lonsdale09': "**Lonsdale, D., & Le Bras, Y. (2009).** *A Frequency Dictionary of French: Core Vocabulary for Learners.* Routledge.",
    'sharoff13': "**Sharoff, S., Umanskaya, E., & Wilson, J. (2013).** *A Frequency Dictionary of Russian: Core Vocabulary for Learners.* Routledge.",
    'dornyei97': "**Dörnyei, Z., & Scott, M. L. (1997).** Communication strategies in a second language: Definitions and taxonomies. *Language Learning, 47*(1), 173–210.",
    'tarone80': "**Tarone, E. (1980).** Communication strategies, foreign talk, and repair in interlanguage. *Language Learning, 30*(2), 417–431.",
    'bialystok90': "**Bialystok, E. (1990).** *Communication Strategies: A Psychological Analysis of Second-Language Use.* Blackwell.",
    'corder67': "**Corder, S. P. (1967).** The significance of learners' errors. *International Review of Applied Linguistics, 5*(4), 161–170.",
    'james98': "**James, C. (1998).** *Errors in Language Learning and Use: Exploring Error Analysis.* Longman.",
    'lyster97': "**Lyster, R., & Ranta, L. (1997).** Corrective feedback and learner uptake: Negotiation of form in communicative classrooms. *Studies in Second Language Acquisition, 19*(1), 37–66.",
    'hattie07': "**Hattie, J., & Timperley, H. (2007).** The power of feedback. *Review of Educational Research, 77*(1), 81–112.",
    'roediger06': "**Roediger, H. L., & Karpicke, J. D. (2006).** Test-enhanced learning: Taking memory tests improves long-term retention. *Psychological Science, 17*(3), 249–255.",
    'swan16': "**Swan, M. (2016).** *Practical English Usage* (4th ed.). Oxford University Press.",
    'carter06': "**Carter, R., & McCarthy, M. (2006).** *Cambridge Grammar of English.* Cambridge University Press.",
    'leech04': "**Leech, G. N. (2004).** *Meaning and the English Verb* (3rd ed.). Longman.",
    'quirk85': "**Quirk, R., Greenbaum, S., Leech, G., & Svartvik, J. (1985).** *A Comprehensive Grammar of the English Language.* Longman.",
    'comrie76': "**Comrie, B. (1976).** *Aspect: An Introduction to the Study of Verbal Aspect and Related Problems.* Cambridge University Press.",
    'comrie85': "**Comrie, B. (1985).** *Tense.* Cambridge University Press.",
    'klein94': "**Klein, W. (1994).** *Time in Language.* Routledge.",
    'dahl85': "**Dahl, Ö. (1985).** *Tense and Aspect Systems.* Blackwell.",
    'riegel94': "**Riegel, M., Pellat, J.-C., & Rioul, R. (1994).** *Grammaire méthodique du français.* Presses Universitaires de France.",
    'serianni88': "**Serianni, L. (1988).** *Grammatica italiana: Italiano comune e lingua letteraria.* UTET.",
    'maiden13': "**Maiden, M., & Robustelli, C. (2013).** *A Reference Grammar of Modern Italian* (2nd ed.). Routledge.",
    'wade10': "**Wade, T. (2010).** *A Comprehensive Russian Grammar* (3rd ed.). Wiley-Blackwell.",
    'timberlake04': "**Timberlake, A. (2004).** *A Reference Grammar of Russian.* Cambridge University Press.",
    'holton12': "**Holton, D., Mackridge, P., Philippaki-Warburton, I., & Manolessou, I. (2012).** *Greek: A Comprehensive Grammar* (2nd ed.). Routledge.",
    'doidge07': "**Doidge, N. (2007).** *The Brain That Changes Itself.* Viking.",
    'martensson12': "**Mårtensson, J., Eriksson, J., Bodammer, N. C., Lindgren, M., Johansson, M., Nyberg, L., & Lövdén, M. (2012).** Growth of language-related brain areas after foreign language learning. *NeuroImage, 63*(1), 240–244.",
    'kuhl10': "**Kuhl, P. K. (2010).** Brain mechanisms in early language acquisition. *Neuron, 67*(5), 713–727.",
    'bialystok12': "**Bialystok, E., Craik, F. I. M., & Luk, G. (2012).** Bilingualism: Consequences for mind and brain. *Trends in Cognitive Sciences, 16*(4), 240–250.",
    'huizinga55': "**Huizinga, J. (1955).** *Homo Ludens: A Study of the Play-Element in Culture.* Beacon Press.",
    'vygotsky78': "**Vygotsky, L. S. (1978).** *Mind in Society: The Development of Higher Psychological Processes.* Harvard University Press.",
}

TOPICS = {
    'speaking': ['long83', 'swain85', 'swain95', 'thornbury05', 'krashen82'],
    'anxiety': ['horwitz86', 'macintyre94'],
    'curriculum': ['coe20', 'ellis03', 'willis96', 'cepeda06', 'lightbown13', 'scrivener11'],
    'plateau': ['richards08', 'selinker72', 'lewis93', 'nation01', 'schmitt10'],
    'vocab_chunks': ['pawley83', 'wray02', 'sinclair91', 'hoey05', 'laufer95'],
    'verbs': ['nation01', 'biber99', 'ellisn02'],
    'strategies': ['dornyei97', 'tarone80', 'bialystok90'],
    'errors': ['corder67', 'james98', 'lyster97', 'hattie07', 'roediger06'],
    'grammar': ['swan16', 'carter06', 'leech04', 'quirk85'],
    'tenses': ['comrie76', 'comrie85', 'klein94', 'dahl85'],
    'tenses_en': ['swan16', 'leech04'],
    'tenses_fr': ['riegel94'],
    'tenses_it': ['serianni88', 'maiden13'],
    'tenses_ru': ['wade10', 'timberlake04'],
    'tenses_el': ['holton12'],
    'brain': ['doidge07', 'martensson12', 'kuhl10', 'bialystok12', 'huizinga55', 'vygotsky78', 'krashen82'],
}
LANG_EXTRA = {  # frequency dictionaries exist for these languages
    ('verbs', 'en'): ['davies10'], ('verbs', 'fr'): ['lonsdale09'], ('verbs', 'ru'): ['sharoff13'],
}

BASE_TOPICS = {
    'why-speaking-first': ['speaking', 'anxiety'],
    'building-cosy-master-curriculum': ['curriculum'],
    'top-10-verbs': ['verbs', 'vocab_chunks'],
    'top-10-verbs-part-2': ['verbs', 'vocab_chunks'],
    'top-10-verbs-part-3': ['verbs', 'vocab_chunks'],
    'top-10-verb-synonyms-intermediate-plateau': ['plateau', 'vocab_chunks'],
    'replace-50-overused-phrases': ['plateau', 'vocab_chunks'],
    'replace-very-50-stronger-adjectives': ['plateau', 'vocab_chunks'],
    'overcoming-intermediate-plateau': ['plateau', 'vocab_chunks'],
    'stop-translating-10-sentence-frames': ['strategies', 'vocab_chunks'],
    'top-5-favourite-grammar-rules': ['grammar'],
    'saturday-mistakes-5-english-mistakes': ['errors'],
    'neuroplasticity-and-the-playful-brain': ['brain'],
    'demystifying-english-tenses-timeline-guide': ['tenses', 'tenses_LANG'],
}
KEEP_OWN = {'beyond-code-switching-and-translation', 'creative-writing-in-language-learning',
            'why-do-we-freeze-when-conversations-go-off-script', 'welcome-to-cosy-blog', 'stage-demo-podcast'}

HEAD = {
    'en': 'Further reading', 'fr': 'Pour aller plus loin', 'it': 'Per approfondire', 'ru': 'Что почитать дальше',
    'el': 'Για περαιτέρω ανάγνωση', 'es': 'Lecturas recomendadas', 'de': 'Weiterführende Literatur', 'pt': 'Leituras recomendadas',
    'hy': 'Լրացուցիչ ընթերցանություն', 'ka': 'დამატებითი საკითხავი', 'tt': 'Өстәмә укырга', 'ba': 'Өҫтәмә уҡырға',
}
INTRO = {
    'en': 'The ideas in this article rest on published research and teaching practice. Start with any of these:',
    'fr': 'Les idées de cet article s’appuient sur des travaux publiés et sur la pratique de l’enseignement. Pour commencer :',
    'it': 'Le idee di questo articolo si basano su ricerche pubblicate e sulla pratica didattica. Per cominciare:',
    'ru': 'Идеи этой статьи опираются на научные работы и опыт преподавания. С чего начать:',
    'el': 'Οι ιδέες αυτού του άρθρου στηρίζονται σε δημοσιευμένη έρευνα και διδακτική πρακτική. Ξεκινήστε από εδώ:',
    'es': 'Las ideas de este artículo se apoyan en investigación publicada y en la práctica docente. Para empezar:',
    'de': 'Die Ideen dieses Artikels stützen sich auf veröffentlichte Forschung und Unterrichtspraxis. Zum Einstieg:',
    'pt': 'As ideias deste artigo apoiam-se em investigação publicada e na prática de ensino. Para começar:',
}


def author_key(entry):
    return entry.lower().replace('*', '')


def entries_for(base, lang):
    keys = []
    for t in BASE_TOPICS[base]:
        if t == 'tenses_LANG':
            t = 'tenses_' + lang
        keys += TOPICS.get(t, [])
        if base.startswith('top-10-verbs'):
            keys += LANG_EXTRA.get((t, lang), [])
    seen, out = set(), []
    for k in keys:
        if k not in seen:
            seen.add(k)
            out.append(E[k])
    return sorted(out, key=author_key)[:8]


def strip_old(blocks):
    """Remove the generic pasted bibliography (heading + the paragraph and list that follow) and any block of an earlier run."""
    out, i = [], 0
    while i < len(blocks):
        b = blocks[i]
        if b.get('listId') == 'refs':
            i += 1
            continue
        if b.get('type') == 'heading' and 'Academic Bibliography' in b.get('text', ''):
            i += 1
            while i < len(blocks) and blocks[i].get('type') in ('paragraph', 'list-item') and not blocks[i].get('listId'):
                i += 1
            continue
        out.append(b)
        i += 1
    return out


def process(path):
    d = json.load(open(path, encoding='utf-8'))
    slug, lang = d['slug'], d['language']
    base = d.get('translationOf') or slug
    if slug in KEEP_OWN or base in KEEP_OWN or base not in BASE_TOPICS or d.get('draft'):
        return None
    if len(d['blocks']) < 3:
        return None
    blocks = strip_old(d['blocks'])
    entries = entries_for(base, lang)
    if not entries:
        return slug, 0
    head = HEAD.get(lang, HEAD['en'])
    new = [{'type': 'heading', 'level': 2, 'text': '📚 ' + head, 'webOnly': True, 'listId': 'refs'}]
    if lang in INTRO:
        new.append({'type': 'paragraph', 'text': INTRO[lang], 'webOnly': True, 'listId': 'refs'})
    new.append({'type': 'list-item', 'ordered': False, 'items': entries, 'webOnly': True, 'listId': 'refs', 'refs': True})
    d['blocks'] = blocks + new
    if not DRY:
        json.dump(d, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
        open(path, 'a').write('\n')
    return slug, len(entries)


if __name__ == '__main__':
    done = [r for r in (process(p) for p in sorted(glob.glob(os.path.join(POSTS, '*.json')))) if r]
    for slug, n in done:
        print(f'{n:2} refs  {slug}')
    print(f'\n{len(done)} articles carry a reference list.')
