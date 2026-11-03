/**
 * js/editor-blocks.js
 * Template Building Blocks & Presets for COSYmagazine Studio.
 * Conforms 100% to SCHEMA.md and scripts/validate-blog-schema.js.
 */

(function (root, factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory();
  } else {
    root.CosyEditorBlocks = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * Block Type Definitions & Factory Functions
   */
  const BLOCK_DEFINITIONS = [
    {
      type: 'heading',
      label: 'Editorial Heading',
      icon: '🏷️',
      description: 'Section heading with level 1-6',
      create: () => ({
        type: 'heading',
        level: 2,
        text: 'New Section Title',
        say: 'Moving on to the next key principle.'
      })
    },
    {
      type: 'paragraph',
      label: 'Paragraph Text',
      icon: '✍️',
      description: 'Rich narrative prose (drop-cap applied on first paragraph)',
      create: () => ({
        type: 'paragraph',
        text: 'Write your educational editorial story here. You can use markdown like **bold**, *italics*, or `code`.',
        say: 'Write your educational editorial story here.'
      })
    },
    {
      type: 'mistake-card',
      label: 'Saturday Mistake Card',
      icon: '🗓️',
      description: 'Wrong vs Right comparative side-by-side card with rule and quiz',
      create: () => ({
        type: 'mistake-card',
        number: 1,
        title: 'Common Expression Mistake',
        wrong: '"I have 25 years."',
        right: '"I am 25 years old."',
        why: 'In many Romance and Slavic languages, age is expressed with the verb to have.',
        rule: 'Always use the verb "to be" when talking about age.',
        examples: [
          'She is 18 years old.',
          'How old are you?'
        ],
        quiz: {
          question: 'Which sentence is natural?',
          options: [
            'I am 30 years old.',
            'I have 30 years.'
          ],
          correctIndex: 0,
          explanation: 'Age uses the verb "to be".'
        },
        labels: {
          wrong: 'Not quite',
          right: 'Say this',
          why: 'Why it happens',
          rule: 'The COSY rule',
          examples: 'More examples',
          turn: 'Your turn'
        },
        say: 'Here is mistake number one: saying I have 25 years instead of I am 25 years old.'
      })
    },
    {
      type: 'example',
      label: 'Vocabulary Example Box',
      icon: '💬',
      description: 'Target sentence with monolingual gloss and context',
      create: () => ({
        type: 'example',
        targetText: 'Prendre le taureau par les cornes.',
        gloss: 'Affronter une situation difficile avec détermination dès le début.',
        context: 'Utilisé au travail ou lors d’une négociation importante.',
        say: 'Prendre le taureau par les cornes means facing a challenge head on.'
      })
    },
    {
      type: 'pronunciation',
      label: 'Pronunciation & IPA Card',
      icon: '🗣️',
      description: 'Target word, IPA phonetic transcription, and optional audio',
      create: () => ({
        type: 'pronunciation',
        word: 'unbelievable',
        ipa: 'ˌʌnbɪˈliːvəbl',
        audioUrl: '',
        say: 'Pronounce it as unbelievable: un-be-lieve-a-ble.'
      })
    },
    {
      type: 'table',
      label: 'Grammar / Vocabulary Table',
      icon: '📊',
      description: 'Tabular data with headers, rows, and optional printable full-list toolbar',
      create: () => ({
        type: 'table',
        caption: 'Core Conjugation / Usage Matrix',
        printable: false,
        headers: ['Pronoun', 'Verb Form', 'Usage Note'],
        rows: [
          ['I / You', 'speak', 'Everyday informal'],
          ['He / She / It', 'speaks', 'Third-person singular marker']
        ],
        say: 'Review the conjugation table to see how verb endings change.'
      })
    },
    {
      type: 'quiz',
      label: 'Interactive Check Quiz',
      icon: '❓',
      description: 'Interactive multiple choice question with immediate pedagogical feedback',
      create: () => ({
        type: 'quiz',
        question: 'What is the most natural way to agree with someone?',
        options: [
          'I am totally agree with you.',
          'I completely agree with you.',
          'I make agreement.'
        ],
        correctIndex: 1,
        explanation: '"Agree" is already a verb, so you do not need "to be" or "to make".',
        say: 'Test your knowledge: which sentence is the natural way to agree?'
      })
    },
    {
      type: 'culture-bite',
      label: 'Culture & Context Marginalia',
      icon: '📌',
      description: 'Cultural nuance, etiquette tip, or background context note',
      create: () => ({
        type: 'culture-bite',
        title: 'Cultural Etiquette & Subtleties',
        content: 'In Paris, greeting the baker with a warm "Bonjour" before ordering is not optional etiquette—it is essential politeness.',
        say: 'Here is a quick cultural note on daily greetings.'
      })
    },
    {
      type: 'pullquote',
      label: 'Vogue Pullquote',
      icon: '❝',
      description: 'Stylized editorial quote banner with attribution',
      create: () => ({
        type: 'pullquote',
        quote: 'Language learning is not memorization; it is the joyful expansion of identity.',
        attribution: 'COSY Founder JY DM',
        say: 'As we always say: language learning is the joyful expansion of identity.'
      })
    },
    {
      type: 'quote-wall',
      label: 'Quote Wall Mosaic',
      icon: '🏛️',
      description: 'Mosaic grid of inspiring quotes from literature or language thinkers',
      create: () => ({
        type: 'quote-wall',
        quotes: [
          {
            quote: 'To have another language is to possess a second soul.',
            author: 'Charlemagne'
          },
          {
            quote: 'One language sets you in a corridor for life. Two languages open every door along the way.',
            author: 'Frank Smith'
          }
        ],
        say: 'Reflect on these perspectives about speaking multiple languages.'
      })
    },
    {
      type: 'list-item',
      label: 'List or Phrase Upgrades',
      icon: '📋',
      description: 'Bullet list or arrow-delimited phrase upgrade cards',
      create: () => ({
        type: 'list-item',
        ordered: false,
        items: [
          'Very tired → Exhausted / Beat',
          'Very happy → Overjoyed / Thrilled',
          'Very busy → Swamped / Tied up'
        ],
        say: 'Upgrade your vocabulary with these high-frequency alternatives.'
      })
    },
    {
      type: 'image',
      label: 'Editorial Figure & Photo',
      icon: '🖼️',
      description: 'Image with alt text and caption',
      create: () => ({
        type: 'image',
        url: 'images/visuals/editorial-study.jpg',
        alt: 'Editorial language study scene',
        caption: 'Language immersion in an authentic, cosy setting.',
        say: 'Take a look at how context shapes every spoken interaction.'
      })
    },
    {
      type: 'links',
      label: 'Ecosystem Gateway Link',
      icon: '🌐',
      description: 'Direct outbound link to COSYtools, COSYpractice, or COSYlanguages',
      create: () => ({
        type: 'links',
        destination: 'cosytools',
        url: 'https://cosylanguages.github.io/COSYtools/',
        label: 'Explore Complete Verb Conjugation Tables in COSYtools',
        say: 'You can test full conjugation tables in COSYtools.'
      })
    }
  ];

  /**
   * Complete Quick-Start Article Presets
   */
  const ARTICLE_PRESETS = [
    {
      id: 'preset-saturday-mistakes',
      name: 'Saturday Mistakes',
      description: 'Signature 5-mistake issue with comparative wrong/right cards, explanations, and quizzes',
      create: (opts = {}) => {
        const lang = opts.language || 'en';
        const date = opts.date || new Date().toISOString().slice(0, 10);
        return {
          id: `post-saturday-mistakes-${Date.now()}`,
          slug: `saturday-mistakes-new-edition-${lang}`,
          language: lang,
          draft: true,
          desk: 'Saturday Mistakes',
          format: 'list',
          level: 'A0–A1 / A2',
          issue: {
            number: 'Vol. 2026.12',
            title: 'December Editorial Issue'
          },
          date: date,
          title: '5 Common Saturday Mistakes Learners Make (and How to Fix Them)',
          kicker: 'SATURDAY MISTAKES',
          dek: 'Clear, memorable fixes for 5 persistent conversational slips that learners encounter every week.',
          tags: ['SaturdayMistakes', 'SpeakingFirst', 'Fluency'],
          readingTime: 4,
          podcast: {
            episode: 1,
            audioUrl: null
          },
          artDirection: {
            palette: ['#b45309', '#fdfbf7', '#1c1917', '#d97706'],
            fonts: { display: 'Fraunces', text: 'DM Sans', accent: 'Fraunces Italic' },
            layout: 'magazine-spread',
            motif: 'editorial-stars',
            seed: 'sat-mistakes-seed',
            coverOverride: null
          },
          blocks: [
            {
              type: 'paragraph',
              text: 'Every Saturday, we look at the conversational slips that happen when thinking in one language and speaking in another.',
              say: 'Welcome to Saturday Mistakes. Today we look at five conversational slips and how to fix them effortlessly.'
            },
            {
              type: 'mistake-card',
              number: 1,
              title: 'Expressing Age',
              wrong: '"I have 30 years."',
              right: '"I am 30 years old."',
              why: 'Learners translate directly from native languages where age is viewed as something you have.',
              rule: 'Always use "to be" for age in English.',
              examples: [
                'She is 25.',
                'We are the same age.'
              ],
              quiz: {
                question: 'Select the natural sentence:',
                options: ['I am 28 years old.', 'I have 28 years.'],
                correctIndex: 0,
                explanation: 'Age uses the verb "to be".'
              },
              labels: {
                wrong: 'Not quite',
                right: 'Say this',
                why: 'Why it happens',
                rule: 'The COSY rule',
                examples: 'More examples',
                turn: 'Your turn'
              },
              say: 'Mistake number one: expressing age. In English, you are your age, you do not have it.'
            },
            {
              type: 'links',
              destination: 'practice',
              url: 'https://cosylanguages.github.io/COSYpractice/',
              label: 'Practice this week’s spoken mistakes on COSYpractice',
              say: 'Head over to COSYpractice to reinforce these speaking patterns.'
            }
          ]
        };
      }
    },
    {
      id: 'preset-top10-verbs',
      name: 'Top 10 Verbs & Lexical Set',
      description: 'Lexical guide with pronunciation, conjugation tables, and real spoken examples',
      create: (opts = {}) => {
        const lang = opts.language || 'en';
        const date = opts.date || new Date().toISOString().slice(0, 10);
        return {
          id: `post-top-10-verbs-${Date.now()}`,
          slug: `top-10-verbs-edition-${lang}`,
          language: lang,
          draft: true,
          desk: 'Words',
          format: 'ranking',
          level: 'A0–A1',
          issue: {
            number: 'Vol. 2026.11',
            title: 'November Editorial Issue'
          },
          date: date,
          title: 'The Top 10 High-Frequency Verbs for Confident Speech',
          kicker: 'CORE VOCABULARY',
          dek: 'Master the ten verbs that unlock 80% of everyday speaking situations with zero hesitation.',
          tags: ['Vocabulary', 'Top10', 'Verbs'],
          readingTime: 5,
          podcast: {
            episode: 2,
            audioUrl: null
          },
          artDirection: {
            palette: ['#047857', '#faf8f5', '#1e293b', '#10b981'],
            fonts: { display: 'Fraunces', text: 'DM Sans', accent: 'Fraunces Italic' },
            layout: 'magazine-spread',
            motif: 'editorial-stars',
            seed: 'top10-seed',
            coverOverride: null
          },
          blocks: [
            {
              type: 'paragraph',
              text: 'When starting in a new language, ten well-chosen verbs give you an immediate voice in real-world conversations.',
              say: 'When learning a language, ten high frequency verbs allow you to build hundreds of daily sentences.'
            },
            {
              type: 'heading',
              level: 2,
              text: '1. To Want / Would Like',
              say: 'First verb: to want and would like.'
            },
            {
              type: 'example',
              targetText: 'I would like a coffee, please.',
              gloss: 'Polite spoken request for cafes and restaurants.',
              context: 'Daily ordering',
              say: 'I would like a coffee, please.'
            },
            {
              type: 'table',
              caption: 'Quick Conjugation Summary',
              printable: true,
              headers: ['Person', 'Present Form', 'Past Form'],
              rows: [
                ['I', 'want', 'wanted'],
                ['You', 'want', 'wanted'],
                ['He / She', 'wants', 'wanted']
              ],
              say: 'Notice how the third person takes an s in the present.'
            },
            {
              type: 'links',
              destination: 'cosytools',
              url: 'https://cosylanguages.github.io/COSYtools/',
              label: 'Explore all verb conjugations in COSYtools',
              say: 'Visit COSYtools for complete conjugation tables.'
            }
          ]
        };
      }
    },
    {
      id: 'preset-grammar-made-cosy',
      name: 'Grammar Made Cosy',
      description: 'Pedagogical timeline breakdown demystifying complex grammar rules into simple frameworks',
      create: (opts = {}) => {
        const lang = opts.language || 'en';
        const date = opts.date || new Date().toISOString().slice(0, 10);
        return {
          id: `post-grammar-cosy-${Date.now()}`,
          slug: `demystifying-grammar-guide-${lang}`,
          language: lang,
          draft: true,
          desk: 'Grammar Made Cosy',
          format: 'essay',
          level: 'A1–A2',
          issue: {
            number: 'Vol. 2026.10',
            title: 'October Editorial Issue'
          },
          date: date,
          title: 'Demystifying Verb Tenses: A Visual Timeline Guide',
          kicker: 'GRAMMAR MADE COSY',
          dek: 'Understanding time, aspect, and completion without memorizing confusing grammatical jargon.',
          tags: ['Grammar', 'Timelines', 'CosyGuides'],
          readingTime: 6,
          podcast: {
            episode: 3,
            audioUrl: null
          },
          artDirection: {
            palette: ['#0284c7', '#faf7f2', '#0f172a', '#38bdf8'],
            fonts: { display: 'Fraunces', text: 'DM Sans', accent: 'Fraunces Italic' },
            layout: 'magazine-spread',
            motif: 'editorial-stars',
            seed: 'grammar-cosy-seed',
            coverOverride: null
          },
          blocks: [
            {
              type: 'paragraph',
              text: 'Grammar becomes intuitive when viewed as a spatial timeline rather than an arbitrary list of rules.',
              say: 'Grammar becomes intuitive when you visualize where an action sits on a timeline.'
            },
            {
              type: 'pullquote',
              quote: 'Tense tells you when; aspect tells you how an action unfolds.',
              attribution: 'COSY Grammar Atelier',
              say: 'Remember: tense tells you when, and aspect tells you how the action unfolds.'
            },
            {
              type: 'heading',
              level: 2,
              text: 'The Present: Ongoing vs Habitual',
              say: 'Let us examine ongoing actions versus habitual routines.'
            },
            {
              type: 'example',
              targetText: 'I am reading a book right now vs I read every evening.',
              gloss: 'Point in time (ongoing) vs recurring habit.',
              context: 'Spoken distinction',
              say: 'Compare: I am reading right now versus I read every evening.'
            },
            {
              type: 'quiz',
              question: 'Which sentence describes a permanent routine?',
              options: [
                'She is working at the library today.',
                'She works at the library.',
                'She worked at the library.'
              ],
              correctIndex: 1,
              explanation: 'Simple present indicates regular routines and general facts.',
              say: 'Check your intuition with this quick question.'
            }
          ]
        };
      }
    },
    {
      id: 'preset-fluency-culture',
      name: 'Fluency & Cultural Insights',
      description: 'Nuanced article featuring cultural marginalia, quote wall, and phrase upgrades',
      create: (opts = {}) => {
        const lang = opts.language || 'en';
        const date = opts.date || new Date().toISOString().slice(0, 10);
        return {
          id: `post-fluency-culture-${Date.now()}`,
          slug: `the-art-of-spoken-confidence-${lang}`,
          language: lang,
          draft: true,
          desk: 'Say It',
          format: 'photo-essay',
          level: 'A2–B1',
          issue: {
            number: 'Vol. 2026.09',
            title: 'September Editorial Issue'
          },
          date: date,
          title: 'The Art of Spoken Confidence: Going Beyond the Script',
          kicker: 'SPEAKING FIRST',
          dek: 'How to manage pauses, keep conversations moving, and embrace the rhythm of everyday speech.',
          tags: ['SpeakingFirst', 'Culture', 'Fluency'],
          readingTime: 4,
          podcast: {
            episode: 4,
            audioUrl: null
          },
          artDirection: {
            palette: ['#7c3aed', '#faf8f5', '#18181b', '#c084fc'],
            fonts: { display: 'Fraunces', text: 'DM Sans', accent: 'Fraunces Italic' },
            layout: 'magazine-spread',
            motif: 'editorial-stars',
            seed: 'fluency-culture-seed',
            coverOverride: null
          },
          blocks: [
            {
              type: 'paragraph',
              text: 'Conversations rarely follow textbook scripts. True fluency starts when you feel comfortable responding off the cuff.',
              say: 'Real conversations rarely follow textbook scripts. Confidence comes from learning how to pivot naturally.'
            },
            {
              type: 'culture-bite',
              title: 'Conversational Silence Across Cultures',
              content: 'In French or Italian conversations, a short silence is immediately filled with a friendly gesture or conversational bridge. In Nordic speech, a thoughtful pause indicates deep respect for what was said.',
              say: 'Notice how different cultures interpret a thoughtful pause during a chat.'
            },
            {
              type: 'heading',
              level: 2,
              text: 'Natural Phrase Upgrades',
              say: 'Here are natural phrase upgrades to keep conversational momentum.'
            },
            {
              type: 'list-item',
              ordered: false,
              items: [
                'I don’t know → Let me think about that for a second',
                'What? → Could you say that again? I missed the last word',
                'Yes, I understand → That makes complete sense'
              ],
              say: 'Upgrade basic responses to maintain warm rapport with your interlocutor.'
            },
            {
              type: 'quote-wall',
              quotes: [
                {
                  quote: 'Language is the road map of a culture. It tells you where its people come from and where they are going.',
                  author: 'Rita Mae Brown'
                }
              ],
              say: 'Rita Mae Brown noted that language is the roadmap of a culture.'
            }
          ]
        };
      }
    }
  ];

  /**
   * Helper to deep clone an object
   */
  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Generates a new blank block of a given type
   */
  function createBlock(type) {
    const def = BLOCK_DEFINITIONS.find((b) => b.type === type);
    if (!def) {
      throw new Error(`Unknown block type "${type}". Allowed types: ${BLOCK_DEFINITIONS.map(b => b.type).join(', ')}`);
    }
    return def.create();
  }

  return {
    BLOCK_DEFINITIONS,
    ARTICLE_PRESETS,
    createBlock,
    clone
  };
});
