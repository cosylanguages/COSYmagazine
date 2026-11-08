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
      description: 'Visual diagram, editorial illustration, or photograph with caption',
      create: () => ({
        type: 'image',
        url: 'images/stop-translating-flow-en.svg',
        alt: 'Cognitive direct speech workflow diagram',
        caption: 'Connecting thoughts directly to target language structures without intermediate translation.',
        say: 'Take a look at how direct cognitive pathways bypass the translation bottleneck.'
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
   * Canonical Magazine Issues (Archive & Upcoming Arc)
   */
  const CANONICAL_ISSUES = [
    {
      id: 'vol-2026-08',
      number: 'Vol. 2026.08',
      title: 'Get Ready for School',
      theme: 'Foundations, Beginnings, Pedagogy & The Science of Early Acquisition',
      date: '2026-08-15',
      palette: ['#993c1d', '#faf7f2', '#1c1917', '#0f6e56']
    },
    {
      id: 'vol-2026-09',
      number: 'Vol. 2026.09',
      title: 'Me vs Intermediate Plateau',
      theme: 'The B1-B2 Plateau, Persistence, Nuance & Finding One\'s True Voice',
      date: '2026-09-15',
      palette: ['#b45309', '#faf7f2', '#18181b', '#0284c7']
    },
    {
      id: 'vol-2026-10',
      number: 'Vol. 2026.10',
      title: 'JY DM\'s Birthday & His Favs',
      theme: 'Playfulness, Conversational Agility, Overcoming Freezing & Quirky Tangents',
      date: '2026-10-15',
      palette: ['#7c3aed', '#faf7f2', '#0f172a', '#ec4899']
    },
    {
      id: 'vol-2026-11',
      number: 'Vol. 2026.11',
      title: 'November Academia',
      theme: 'Cognitive Linguistics, Neuroplasticity, Creative Storytelling & L2 Identity',
      date: '2026-11-15',
      palette: ['#0f766e', '#faf7f2', '#1e293b', '#14b8a6']
    },
    {
      id: 'vol-2026-12',
      number: 'Vol. 2026.12',
      title: 'Winter Grammar & High Frequency Verbs',
      theme: 'Warmth, Seasonal Rhythms, Phrasal Logic & Introspective Living',
      date: '2026-12-15',
      palette: ['#1e3a8a', '#faf7f2', '#0f172a', '#38bdf8']
    },
    {
      id: 'vol-2027-01',
      number: 'Vol. 2027.01',
      title: 'Fresh Slates & Rebirth',
      theme: 'Identity, Habit Formation, Returning to Goals & The Tabula Rasa',
      date: '2027-01-15',
      palette: ['#047857', '#faf7f2', '#1c1917', '#10b981']
    },
    {
      id: 'vol-2027-02',
      number: 'Vol. 2027.02',
      title: 'February Grammar & High Frequency Verbs',
      theme: 'Human Connection, Romance, Financial Nuance & Emotional Vulnerability',
      date: '2027-02-15',
      palette: ['#be123c', '#faf7f2', '#18181b', '#f43f5e']
    }
  ];

  /**
   * Canonical Magazine Sections (19-part Blueprint from docs/MAGAZINE_ISSUE_STRUCTURE.md)
   */
  const CANONICAL_SECTIONS = [
    {
      id: 'front_cover',
      name: '01 • Front Cover',
      desk: 'Front Page',
      format: 'photo-essay',
      kicker: 'FRONT COVER',
      description: 'Vogue-inspired visual aesthetic, title typography, issue volume motto.',
      createBlocks: (ctx) => [
        {
          type: 'paragraph',
          text: `Welcome to the digital edition of COSYmagazine ${ctx.issueNumber} — "${ctx.issueTitle}". Dedicated to curious language learners and teachers around the globe.`,
          say: `Welcome to the digital edition of COSYmagazine ${ctx.issueNumber}, "${ctx.issueTitle}".`
        },
        {
          type: 'image',
          url: 'images/logo.png',
          alt: `Front cover art for ${ctx.issueTitle}`,
          caption: `${ctx.issueNumber} • ${ctx.issueTitle}: Human-made, communicative learning.`,
          say: 'Our editorial theme motto unfolds across this monthly issue.'
        }
      ]
    },
    {
      id: 'editor_letter',
      name: '02 • Letter from the Editor (L’Édito)',
      desk: 'Front Page',
      format: 'essay',
      kicker: 'L’ÉDITO',
      description: 'Welcoming personal letter from Editor JY DM setting the human vision.',
      createBlocks: (ctx) => [
        {
          type: 'paragraph',
          text: 'Dear readers, students, teachers, and language nerds: welcome to this issue of COSYmagazine. What started as an idea for a simple blog grew into something much more special—a human-made magazine guided by teachers and learners alike.',
          say: 'Dear readers, students, teachers, and language nerds: welcome to this issue of COSYmagazine.'
        },
        {
          type: 'pullquote',
          quote: 'Language learning is not a mechanical drill; it is the joyful expansion of identity.',
          attribution: 'JY DM, Editor-in-Chief',
          say: 'As always: learn languages, have fun, and stay cosy.'
        },
        {
          type: 'paragraph',
          text: `In this edition ("${ctx.issueTitle}"), we explore how open-ended communication creates genuine connection before perfection ever arrives. Learn languages, have fun, and stay cosy.`,
          say: 'In this edition we explore how open-ended communication creates genuine connection.'
        }
      ]
    },
    {
      id: 'founder_dispatch',
      name: '03 • Founder’s Editorial Dispatch',
      desk: 'Front Page',
      format: 'essay',
      kicker: 'EDITORIAL DISPATCH',
      description: 'Philosophical manifesto setting out the communicative rationale.',
      createBlocks: () => [
        {
          type: 'paragraph',
          text: 'Speaking-first is not merely a classroom technique; it is a philosophy of communicative freedom. Waiting until one feels grammatically flawless before uttering a sentence guarantees permanent silence.',
          say: 'Speaking-first is not merely a classroom technique; it is a philosophy of communicative freedom.'
        },
        {
          type: 'pullquote',
          quote: 'Perfectionism is the enemy of speech; communicative courage is its remedy.',
          attribution: 'James (Founder)',
          say: 'Perfectionism is the enemy of speech; communicative courage is its remedy.'
        },
        {
          type: 'paragraph',
          text: 'When we open our mouths on day one, we embrace the natural approximations that make human interaction warm, responsive, and memorable.',
          say: 'When we open our mouths on day one, we embrace the natural approximations of real human speech.'
        }
      ]
    },
    {
      id: 'wonder_column',
      name: '04 • I Couldn’t Help But Wonder',
      desk: 'Reflections',
      format: 'essay',
      kicker: 'I COULDN’T HELP BUT WONDER',
      description: 'Carrie Bradshaw-style introspective column with speaking club sessions and research spark.',
      createBlocks: () => [
        {
          type: 'paragraph',
          text: 'As I sat by the window watching commuters hurry through the evening rain, I couldn’t help but wonder: why do adult speakers freeze at the threshold of simple conversations?',
          say: 'As I sat by the window watching commuters hurry through the rain, I couldn’t help but wonder why adults freeze before speaking.'
        },
        {
          type: 'culture-bite',
          title: '💡 Research Spark: Investigating Conversational Anxiety',
          content: 'This could be a good research question: How does adult foreign language speaking anxiety (FLSA) correlate with early childhood assessment practices across different schooling cultures?',
          say: 'Here is our research spark for this month\'s speaking clubs.'
        },
        {
          type: 'heading',
          level: 3,
          text: 'Speaking Club Sessions',
          say: 'Here are the speaking club discussion prompts for this month.'
        },
        {
          type: 'list-item',
          ordered: false,
          items: [
            '🗣️ Speaking Club 1 (B1–B2): My First Language Lesson & Conquering Anxiety (Frame: "Whenever I have to speak, my instinct is to...")',
            '🗣️ Speaking Club 2 (C1–C2): Pedagogy vs Autodidacticism: Does Formal Schooling Inhibit Natural Fluency?'
          ],
          say: 'Review the speaking club session prompts.'
        }
      ]
    },
    {
      id: 'founder_interview',
      name: '05 • In Conversation: Founder Interview',
      desk: 'COSYtalks',
      format: 'qa',
      kicker: 'IN CONVERSATION',
      description: 'Thematic Q&A interview with Founder James deconstructing the monthly theme.',
      createBlocks: () => [
        {
          type: 'paragraph',
          text: 'In this monthly conversation, we sit down with founder James to deconstruct the emotional barriers of language acquisition and how our communicative philosophy translates into daily practice.',
          say: 'In this conversation, we sit down with founder James.'
        },
        {
          type: 'heading',
          level: 3,
          text: 'Q: What is the single biggest misconception adult beginners carry?',
          say: 'Question: What is the single biggest misconception adult beginners carry?'
        },
        {
          type: 'paragraph',
          text: 'James: "The belief that grammar is a prerequisite for speech rather than an observation of it. Children communicate desires and stories long before they parse subordinate clauses."',
          say: 'James explains that grammar is an observation of speech, not a barrier to starting.'
        },
        {
          type: 'heading',
          level: 3,
          text: 'Q: How should a learner react when a conversation goes off-script?',
          say: 'Question: How should a learner react when a conversation goes off-script?'
        },
        {
          type: 'paragraph',
          text: 'James: "Celebrate! Off-script is where authentic language actually begins. A smile and a clarifying question keep the human bond alive."',
          say: 'Off-script is where authentic language actually begins.'
        }
      ]
    },
    {
      id: 'debatable_relatable',
      name: '06 • Debatable & Relatable',
      desk: 'Cosy Events',
      format: 'essay',
      kicker: 'DEBATABLE & RELATABLE',
      description: 'Provocative debate dilemma with 3 arguments for and 3 against.',
      createBlocks: () => [
        {
          type: 'paragraph',
          text: 'Every month we explore a polarizing dilemma at the intersection of modern culture, learning, and lifestyle. There is rarely a single right answer.',
          say: 'Welcome to Debatable and Relatable, our monthly dilemma forum.'
        },
        {
          type: 'heading',
          level: 2,
          text: '🔥 The Debate: Typing vs Handwriting in Modern Language Education',
          say: 'Today\'s debate: typing versus handwriting in modern language education.'
        },
        {
          type: 'table',
          caption: 'Arguments For & Against',
          printable: false,
          headers: ['Arguments For (Pro)', 'Arguments Against (Contra)'],
          rows: [
            ['Immediate speed and digital spellcheck tools', 'Loss of tactile motor memory for character retention'],
            ['Reflects modern workplace and remote messaging realities', 'Shallow cognitive engagement compared to manual note-taking'],
            ['Enables real-time collaborative editing and translation', 'Increases screen fatigue and digital distraction']
          ],
          say: 'Compare the arguments for and against.'
        },
        {
          type: 'culture-bite',
          title: '💡 Research Spark: Motor Memory in L2 Acquisition',
          content: 'Does tactile motor feedback from cursive handwriting activate deeper lexical recall pathways in the motor cortex than touchscreen keyboarding?',
          say: 'Consider this research question for your speaking debate.'
        }
      ]
    },
    {
      id: 'student_teacher_spotlight',
      name: '07 • In Conversation: Student & Teacher Spotlight',
      desk: 'COSYtalks',
      format: 'qa',
      kicker: 'COMMUNITY VOICE',
      description: 'Heart-to-heart dialogues alternating between student and teacher perspectives.',
      createBlocks: () => [
        {
          type: 'paragraph',
          text: 'This month we spotlight Elena, who transitioned from eight years of hesitant classroom silence to vibrant conversational ease after embracing speaking-first immersion.',
          say: 'This month we spotlight student Elena and her conversational breakthrough.'
        },
        {
          type: 'heading',
          level: 3,
          text: 'Elena’s Breakthrough Story',
          say: 'Elena recounts her breakthrough moment in Paris.'
        },
        {
          type: 'paragraph',
          text: '"The turning point came when I stopped rehearsing sentences five times in my head before speaking. Once I allowed myself to make mistakes with a smile, locals warmly leaned in to help."',
          say: 'Once I allowed myself to make mistakes with a smile, locals warmly leaned in to help.'
        },
        {
          type: 'pullquote',
          quote: 'Fluency arrived not when I knew every verb table, but when I stopped being afraid of being misunderstood.',
          attribution: 'Elena (B2 Learner)',
          say: 'Fluency arrived when I stopped being afraid of being misunderstood.'
        }
      ]
    },
    {
      id: 'mind_matters',
      name: '08 • Mind Matters',
      desk: 'Reflections',
      format: 'essay',
      kicker: 'MIND MATTERS',
      description: 'Psychological deep-dive into cognitive biases and affective filters.',
      createBlocks: () => [
        {
          type: 'paragraph',
          text: 'Language learning is as much a psychological endeavor as a linguistic one. When we hesitate to speak, the obstacle is rarely vocabulary—it is our emotional affective filter.',
          say: 'Language learning is as much a psychological endeavor as a linguistic one.'
        },
        {
          type: 'heading',
          level: 2,
          text: 'The Imposter Syndrome of the First Conversation',
          say: 'Let us examine the imposter syndrome of the first conversation.'
        },
        {
          type: 'culture-bite',
          title: 'The Spotlight Effect in L2 Speech',
          content: 'Psychological studies demonstrate that speakers consistently overestimate how much listeners notice grammatical slips. In reality, native listeners attend almost exclusively to meaning and intent.',
          say: 'Notice how the spotlight effect magnifies our perceived mistakes.'
        },
        {
          type: 'paragraph',
          text: 'Lowering the affective filter requires psychological safety: treating conversational practice as an experimental playground rather than a high-stakes exam.',
          say: 'Lowering the affective filter turns practice into an experimental playground.'
        }
      ]
    },
    {
      id: 'words_desk',
      name: '09 • Words Desk (Stop Translating / Go Creative / Go Diverse)',
      desk: 'Words',
      format: 'ranking',
      kicker: 'WORDS & CREATIVITY',
      description: 'Methodology rotating between Stop Translating, Go Creative, or Go Diverse.',
      createBlocks: () => [
        {
          type: 'paragraph',
          text: 'Our Words Desk rotates between three standalone methodologies: Stop Translating (core verbs and sentence frames), Go Creative (circumlocution and metaphor), and Go Diverse (register and dialectal nuance).',
          say: 'Welcome to this month\'s Words Desk feature.'
        },
        {
          type: 'heading',
          level: 2,
          text: 'Stop Translating: High-Frequency Reflexes',
          say: 'Today we focus on Stop Translating with high frequency reflex verbs.'
        },
        {
          type: 'example',
          targetText: 'I would like to think about it for a moment.',
          gloss: 'Conversational bridge buying cognitive thinking time.',
          context: 'Used when asked a complex question',
          say: 'I would like to think about it for a moment.'
        },
        {
          type: 'links',
          destination: 'cosytools',
          url: 'https://cosylanguages.github.io/COSYtools/',
          label: 'Explore all verb conjugations and sentence frames in COSYtools',
          say: 'Visit COSYtools for complete conjugation tables.'
        }
      ]
    },
    {
      id: 'if_you_were',
      name: '10 • If You Were',
      desk: 'Reflections',
      format: 'essay',
      kicker: 'IF YOU WERE',
      description: 'Hypothetical empathy experiment practicing conditional grammar.',
      createBlocks: () => [
        {
          type: 'paragraph',
          text: 'Hypothetical scenarios invite radical empathy while naturally unlocking second and third conditionals without mechanical drilling.',
          say: 'Step into another perspective with this month\'s hypothetical experiment.'
        },
        {
          type: 'heading',
          level: 2,
          text: 'If You Were a Kindergarten Teacher in Tokyo',
          say: 'If you were a kindergarten teacher in Tokyo.'
        },
        {
          type: 'paragraph',
          text: 'If you had to teach twenty children without sharing their native language, you would rely on melody, facial expression, and shared physical movement. Language would become gesture before it became syntax.',
          say: 'Consider how communication operates when words are secondary to gesture.'
        },
        {
          type: 'quiz',
          question: 'Which sentence correctly expresses this hypothetical condition?',
          options: [
            'If I were a teacher, I would use gestures.',
            'If I will be a teacher, I will use gestures.',
            'If I am a teacher, I would use gestures.'
          ],
          correctIndex: 0,
          explanation: 'Second conditional uses past subjunctive ("were") + modal ("would").',
          say: 'Test your grasp of this conditional pattern.'
        }
      ]
    },
    {
      id: 'grammar_made_cosy',
      name: '11 • Grammar Made Cosy (Comparative)',
      desk: 'Grammar Made Cosy',
      format: 'essay',
      kicker: 'GRAMMAR MADE COSY',
      description: 'Comparative grammar across EN, FR, IT, RU, EL using CELTA inductive discovery.',
      createBlocks: () => [
        {
          type: 'paragraph',
          text: 'Grammar is intuitive when discovered through pattern recognition (Notice 👀 → Concept Check 🧠) across multiple languages rather than memorized in isolation.',
          say: 'Welcome to Grammar Made Cosy: inductive discovery across languages.'
        },
        {
          type: 'heading',
          level: 2,
          text: 'Comparative Matrix: Ongoing vs Habitual Aspect',
          say: 'Review the comparative matrix across our five primary languages.'
        },
        {
          type: 'table',
          caption: 'Aspect Across 5 Languages (EN, FR, IT, RU, EL)',
          printable: true,
          headers: ['Language', 'Ongoing Present', 'Habitual Routine', 'Marker'],
          rows: [
            ['🇬🇧 English', 'I am studying', 'I study every day', 'be + -ing'],
            ['🇫🇷 French', 'Je suis en train d’étudier', 'J’étudie tous les jours', 'en train de'],
            ['🇮🇹 Italian', 'Sto studiando', 'Studio ogni giorno', 'stare + gerundio'],
            ['🇷🇺 Russian', 'Я учусь прямо сейчас', 'Я занимаюсь каждый день', 'Вид глагола'],
            ['🇬🇷 Greek', 'Διαβάζω αυτή τη στιγμή', 'Διαβάζω κάθε μέρα', 'Χρονικά επιρρήματα']
          ],
          say: 'Notice how each language handles the distinction between ongoing and habitual actions.'
        }
      ]
    },
    {
      id: 'science_expander',
      name: '12 • Keeping Up with Science',
      desk: 'Long Reads',
      format: 'essay',
      kicker: 'COSYSCIENCE',
      description: 'Peer-reviewed research study on neurobiology, linguistics, or cognition.',
      createBlocks: () => [
        {
          type: 'paragraph',
          text: 'In our monthly science expander, we look at empirical evidence from neuroimaging and cognitive linguistics that informs modern communicative practice.',
          say: 'Welcome to Keeping Up with Science, our monthly research expander.'
        },
        {
          type: 'heading',
          level: 2,
          text: 'Neuroplasticity: The Bilingual Brain Under the Scanner',
          say: 'Neuroimaging reveals how bilingualism builds cognitive reserve.'
        },
        {
          type: 'paragraph',
          text: 'Recent fMRI investigations indicate that active bilingual speakers develop denser white matter connectivity in the corpus callosum, delaying symptomatic onset of cognitive decline by an average of four to five years.',
          say: 'Active bilingual practice enhances structural connectivity across hemispheres.'
        },
        {
          type: 'culture-bite',
          title: '💡 Research Spark: Cognitive Reserve & L2 Speaking',
          content: 'Does active speaking club participation produce measurable increases in executive control compared to passive vocabulary memorization apps?',
          say: 'Reflect on this empirical question for your next learning cycle.'
        }
      ]
    },
    {
      id: 'wonder_contest_showcase',
      name: '13 • Wonder Writing Contest Showcase',
      desk: 'Reflections',
      format: 'essay',
      kicker: 'WONDER WRITING SHOWCASE',
      description: 'Published winning 100-word micro-essays from global community learners.',
      createBlocks: () => [
        {
          type: 'paragraph',
          text: 'Every month, readers submit 100-word micro-essays in target languages answering the previous edition\'s Wonder prompt. Here is this month’s winning showcase.',
          say: 'Here is this month\'s winning micro-essay from our global community.'
        },
        {
          type: 'pullquote',
          quote: 'I sat on the wooden chair holding my pen. The French sounds felt like stones in my mouth. But when Madame Claire smiled and asked about my cat, the stones melted into words.',
          attribution: 'Mia L. (French A2 Winner)',
          say: 'Mia writes: when Madame Claire smiled, the stones melted into words.'
        },
        {
          type: 'paragraph',
          text: 'Submissions are evaluated on voice, emotional resonance, and communicative courage rather than grammatical perfection.',
          say: 'Congratulations to all our featured learner writers.'
        }
      ]
    },
    {
      id: 'life_with_without',
      name: '14 • My Life With & Without',
      desk: 'Reflections',
      format: 'essay',
      kicker: 'MY LIFE WITH & WITHOUT',
      description: 'Two-column comparative ledger contrasting presence against total absence.',
      createBlocks: () => [
        {
          type: 'paragraph',
          text: 'A comparative ledger examining human habits: what happens when we contrast extreme presence against total absence to explore narrative tenses?',
          say: 'Explore our comparative ledger: My Life With and Without.'
        },
        {
          type: 'heading',
          level: 2,
          text: 'Life With vs Without Fear of Evaluation',
          say: 'Contrasting life with fear of evaluation against life without it.'
        },
        {
          type: 'table',
          caption: 'Comparative Narrative Ledger',
          printable: false,
          headers: ['My Life With Fear of Evaluation', 'My Life Without Fear of Evaluation'],
          rows: [
            ['Silent rehearsing before ordering a coffee', 'Spontaneous banter with the barista'],
            ['Post-conversation regret over misplaced prepositions', 'Joyful memory of a shared laugh'],
            ['Avoidance of group speaking sessions', 'Enthusiastic presence at every conversational table']
          ],
          say: 'Compare the two columns and reflect on your own communicative journey.'
        }
      ]
    },
    {
      id: 'community_challenge',
      name: '15 • Community Challenge & Sightings',
      desk: 'Culture & Quotes',
      format: 'essay',
      kicker: 'COMMUNITY CHALLENGE',
      description: 'Idiom detective riddles and photos of target languages in the wild.',
      createBlocks: () => [
        {
          type: 'paragraph',
          text: 'Our monthly scavenger hunt invites readers to solve an idiom riddle and share snapshots of real target languages encountered in daily life.',
          say: 'Welcome to this month\'s Idiom Detective and community sightings.'
        },
        {
          type: 'culture-bite',
          title: '🕵️ Idiom Riddle of the Month',
          content: 'I smell of old paper and chalk. I ring promptly at 8:00 AM, but I am not an alarm clock. What idiom am I?',
          say: 'Can you crack this month\'s idiom riddle?'
        },
        {
          type: 'paragraph',
          text: 'Submit your solution or photos of quirky street signs and menus through our community channels to be featured in the next edition.',
          say: 'Share your sightings with the COSY community.'
        }
      ]
    },
    {
      id: 'greatest_quotes',
      name: '16 • The Greatest Quotes (Philosophy Café)',
      desk: 'Culture & Quotes',
      format: 'essay',
      kicker: 'THE GREATEST QUOTES',
      description: 'One profound quote unpacked in a café dialogue format.',
      createBlocks: () => [
        {
          type: 'pullquote',
          quote: 'I have no special talents. I am only passionately curious.',
          attribution: 'Albert Einstein',
          say: 'Albert Einstein observed: I have no special talents, I am only passionately curious.'
        },
        {
          type: 'paragraph',
          text: 'Over espresso on a Parisian terrace, philosophers debate whether curiosity is indeed a passive trait or an active practice of communicative vulnerability.',
          say: 'Notice how beginner curiosity consistently outpaces rigid perfectionism.'
        },
        {
          type: 'quote-wall',
          quotes: [
            {
              quote: 'Curiosity is the wick in the candle of learning.',
              author: 'William Arthur Ward'
            },
            {
              quote: 'The mind is not a vessel to be filled, but a fire to be kindled.',
              author: 'Plutarch'
            }
          ],
          say: 'Reflect on these perspectives about lifelong curiosity.'
        }
      ]
    },
    {
      id: 'culinary_salon',
      name: '17 • Culinary Salon (5 Authentic Recipes)',
      desk: 'Culture & Quotes',
      format: 'photo-essay',
      kicker: 'CULINARY SALON',
      description: 'Traditional recipes from EN, FR, IT, RU, EL paired with table speaking prompts.',
      createBlocks: () => [
        {
          type: 'paragraph',
          text: 'Food is language spoken through flavor and ritual. In every issue, our Culinary Salon presents five authentic recipes celebrating our core taught languages: English, French, Italian, Russian, and Greek.',
          say: 'Welcome to the Culinary Salon, celebrating recipes across five languages.'
        },
        {
          type: 'heading',
          level: 2,
          text: '5 Authentic Seasonal Recipes',
          say: 'Here are the five traditional recipes featured this month.'
        },
        {
          type: 'table',
          caption: 'Culinary Highlights & Taught Language Traditions',
          printable: true,
          headers: ['Language', 'Featured Dish', 'Key Ingredients', 'Dinner Table Conversation Prompt'],
          rows: [
            ['🇬🇧 English', 'Warm Apple Crumble', 'Bramley apples, oats, brown sugar, custard', 'What dessert evokes your childhood home?'],
            ['🇫🇷 French', 'Quiche Lorraine Traditionnelle', 'Smoked lardons, crème fraîche, nutmeg, pastry', 'What is your golden rule for entertaining guests?'],
            ['🇮🇹 Italian', 'Pasta al Pomodoro e Basilico', 'San Marzano tomatoes, fresh basil, extra virgin olive oil', 'Which simple dish tests a chef’s true mastery?'],
            ['🇷🇺 Russian', 'Золотистые Сырники', 'Tvorog curd, eggs, vanilla, berry jam', 'What breakfast ritual centers your morning?'],
            ['🇬🇷 Greek', 'Σπανακόπιτα (Spanakopita)', 'Crispy phyllo pastry, wild spinach, feta, dill', 'How do shared family meals differ across cultures?']
          ],
          say: 'Review the five featured culinary dishes and their dinner table prompts.'
        }
      ]
    },
    {
      id: 'cultural_salon',
      name: '18 • Cultural Salon & Monthly Vibes',
      desk: 'Culture & Quotes',
      format: 'photo-essay',
      kicker: 'CULTURAL SALON',
      description: 'Curated monthly vibes: celebrations, cinema, karaoke, and long reads.',
      createBlocks: () => [
        {
          type: 'paragraph',
          text: 'Immerse your senses in this month\'s cultural picks: world celebrations, cinema recommendations, karaoke tracks with lyric breakdowns, and book chapters.',
          say: 'Welcome to the Cultural Salon: films, music, celebrations, and books.'
        },
        {
          type: 'heading',
          level: 2,
          text: 'Cinema, Music & Long Reads',
          say: 'Explore our cultural curation for this month.'
        },
        {
          type: 'list-item',
          ordered: false,
          items: [
            '🎬 Cinema Club: Dead Poets Society (Director: Peter Weir) — An ode to passion and speaking up.',
            '🎵 Karaoke Club: Cass Elliot — "Make Your Own Kind of Music" (Lyrical focus: modal verbs of individuality).',
            '📖 Long Reads: Atomic Habits by James Clear — Tiny changes, remarkable results in language consistency.',
            '🎉 Let’s Celebrate: International Literacy Day & World Translation Day.'
          ],
          say: 'Review the cinema, karaoke, and reading picks.'
        }
      ]
    },
    {
      id: 'thematic_crossword',
      name: '19 • Thematic Crossword & Puzzle',
      desk: 'Cosy Events',
      format: 'quiz',
      kicker: 'FULL-PAGE THEMATIC CROSSWORD',
      description: 'End-of-issue playful consolidation occupying a full page in PDF/print with words extracted directly from the issue.',
      createBlocks: (ctx) => {
        const issueNum = ctx && ctx.issueNumber ? ctx.issueNumber : 'Vol. 2026.08';
        const issueTitle = ctx && ctx.issueTitle ? ctx.issueTitle : 'Get Ready for School';

        // Issue-specific extracted vocabulary sets
        const ISSUE_CROSSWORD_VOCAB = {
          'Vol. 2026.08': [
            ['Across', '1', 'BELONG — Word of the Issue: to feel accepted in a new classroom community', '6 letters'],
            ['Across', '4', 'TRAUMA — School memory interview: unlearning past classroom anxiety', '6 letters'],
            ['Across', '6', 'SYRNIKI — Golden curd pancakes from our Slavic Culinary Salon', '7 letters'],
            ['Down', '2', 'SPEAKING — Founder Dispatch: producing speech from minute one', '8 letters'],
            ['Down', '3', 'NEUROPLASTICITY — Cosyscience expander: adult brain rewiring capability', '15 letters'],
            ['Down', '5', 'CURIOSITY — Einstein quote: being passionately inquisitive beats perfection', '9 letters']
          ],
          'Vol. 2026.09': [
            ['Across', '1', 'PLATEAU — The intermediate fog where effortless beginner gains turn into craftsmanship', '7 letters'],
            ['Across', '3', 'EXHAUSTED — Words Desk phrase upgrade replacing repetitive "very tired"', '9 letters'],
            ['Across', '5', 'DISCOURSE — Comparative grammar: markers that shape conversational nuance', '9 letters'],
            ['Down', '2', 'PERSISTENCE — Quote Café: Beckett\'s mantra to fail better', '11 letters'],
            ['Down', '4', 'BOURGUIGNON — French Culinary Salon: slow-braised pinot reduction stew', '11 letters'],
            ['Down', '6', 'SYNONYM — Narrative Ledger: contrasting a grey world of 20 words against vivid vocabulary', '7 letters']
          ],
          'Vol. 2026.10': [
            ['Across', '1', 'TANGENT — Unscripted detour where authentic laughter and connection spark', '7 letters'],
            ['Across', '4', 'MEDOVIK — Russian layered honey cake from the birthday celebration bakes', '7 letters'],
            ['Across', '6', 'INVERSION — Top 5 Grammar Rules: dramatic sentence structure for expressive flair', '9 letters'],
            ['Down', '2', 'OFFSCRIPT — Editorial Dispatch: navigating speech panic when conversations wander', '9 letters'],
            ['Down', '3', 'DOPAMINE — Science feature: neuropeptide released by humorous conversational play', '8 letters'],
            ['Down', '5', 'FOOLISH — Steve Jobs quote: staying hungry and staying ...', '7 letters']
          ],
          'Vol. 2026.11': [
            ['Across', '1', 'PLASTICITY — Adult synaptic adaptability and structural connectivity', '10 letters'],
            ['Across', '4', 'RELATIVITY — Wonder Column: Sapir-Whorf linguistic shaping of thought', '10 letters'],
            ['Across', '6', 'TIMELINE — Grammar Made Cosy: spatial visualization of verb aspect', '8 letters'],
            ['Down', '2', 'ATTENTION — Feynman Quote Café: the currency required for deep knowledge', '9 letters'],
            ['Down', '3', 'FASOLADA — Nourishing Greek comfort soup from the Culinary Salon', '8 letters'],
            ['Down', '5', 'FILTER — Mind Matters: Krashen\'s emotional barrier in language acquisition', '6 letters']
          ],
          'Vol. 2026.12': [
            ['Across', '1', 'PARTICLE — Editorial Dispatch: directional compass markers (up, down, out, off)', '8 letters'],
            ['Across', '4', 'SOLSTICE — Cultural Salon: the astronomical turning point of winter light', '8 letters'],
            ['Across', '6', 'POLENTA — Italian hearthside comfort bake with fontina cheese', '7 letters'],
            ['Down', '2', 'REPETITION — Founder Interview: the quiet winter rhythm of habit consolidation', '10 letters'],
            ['Down', '3', 'STATIVE — Grammar Made Cosy: verbs describing inner sensory states', '7 letters'],
            ['Down', '5', 'SILENCE — Narrative Ledger: acoustics and presence in winter stillness', '7 letters']
          ],
          'Vol. 2027.02': [
            ['Across', '1', 'AFFECTION — Editorial Dispatch: the nuanced spectrum of human tenderness', '9 letters'],
            ['Across', '4', 'SUBJUNCTIVE — Grammar Made Cosy: expressing wishes, desires, and emotional stance', '11 letters'],
            ['Across', '6', 'PASTITSIO — Greek romantic supper: baked spiced beef & velvet béchamel', '9 letters'],
            ['Down', '2', 'OXYTOCIN — Science Expander: vocal prosody and bonding neuropeptides', '8 letters'],
            ['Down', '3', 'CANDOR — Narrative Ledger: shedding polite evasion for honest emotional truth', '6 letters'],
            ['Down', '5', 'ACCEPTANCE — Dostoevsky Quote: seeing someone as God intended them', '10 letters']
          ]
        };

        const rows = ISSUE_CROSSWORD_VOCAB[issueNum] || ISSUE_CROSSWORD_VOCAB['Vol. 2026.08'];

        return [
          {
            type: 'paragraph',
            text: `Consolidate the vocabulary, idioms, and grammatical discoveries from "${issueTitle}" (${issueNum}). In print and PDF editions, this crossword occupies a full, dedicated A4 page with enlarged cells for comfortable solving.`,
            say: `Consolidate the vocabulary and grammatical discoveries from this edition with our full-page thematic crossword puzzle.`
          },
          {
            type: 'heading',
            level: 2,
            text: `Full-Page Thematic Crossword: "${issueTitle}"`,
            say: 'Here are the across and down clues extracted directly from the issue.'
          },
          {
            type: 'table',
            caption: `Thematic Crossword Clues — ${issueNum}`,
            printable: true,
            headers: ['Direction', 'Number', 'Clue & Issue Context', 'Length'],
            rows: rows,
            say: 'Review the crossword clues extracted from this edition.'
          },
          {
            type: 'quiz',
            question: `Which core philosophy connects every article in ${issueNum}?`,
            options: [
              'Speaking-First from lesson one',
              'Waiting until grammar is 100% perfect',
              'Rote memorization of bilingual flashcards'
            ],
            correctIndex: 0,
            explanation: 'Speaking-first anchors genuine human connection before grammatical perfection.',
            say: 'Confirm your understanding with this final quiz.'
          }
        ];
      }
    }
  ];

  /**
   * Section Factory: creates a canonical section post payload
   */
  function createSectionTemplate(sectionId, opts = {}) {
    const sec = CANONICAL_SECTIONS.find(s => s.id === sectionId) || CANONICAL_SECTIONS[0];
    const lang = opts.language || 'en';
    const issueNumber = opts.issueNumber || 'Vol. 2026.08';
    const issueTitle = opts.issueTitle || 'Get Ready for School';
    const date = opts.date || new Date().toISOString().slice(0, 10);

    const ctx = { issueNumber, issueTitle, language: lang };
    const blocks = sec.createBlocks(ctx);

    return {
      id: `post-${sec.id}-${Date.now()}`,
      slug: `${sec.id.replace(/_/g, '-')}-${lang}`,
      language: lang,
      draft: true,
      desk: sec.desk,
      format: sec.format,
      section: sec.id,
      level: opts.level || 'A1–A2',
      issue: {
        number: issueNumber,
        title: issueTitle
      },
      date: date,
      title: `${sec.name.replace(/^\d+ • /, '')}: ${issueTitle}`,
      kicker: sec.kicker,
      dek: sec.description,
      tags: ['COSYmagazine', sec.desk.replace(/\s+/g, ''), 'SpeakingFirst'],
      readingTime: Math.max(2, Math.round(blocks.length * 1.2)),
      podcast: {
        episode: opts.episode || 1,
        audioUrl: null
      },
      artDirection: {
        palette: opts.palette || ['#993c1d', '#faf7f2', '#1c1917', '#0f6e56'],
        fonts: { display: 'Fraunces', text: 'DM Sans', accent: 'Fraunces Italic' },
        layout: 'magazine-spread',
        motif: 'editorial-stars',
        seed: `${sec.id}-seed`,
        coverOverride: null
      },
      blocks: blocks
    };
  }

  /**
   * Complete Quick-Start Article Presets
   */
  const ARTICLE_PRESETS = [
    {
      id: 'preset-cosytalks',
      name: 'COSYtalks',
      description: 'Reflective essays & Long Reads on language learning psychology, cognitive agility, and creative expression',
      create: (opts = {}) => {
        const lang = opts.language || 'en';
        const date = opts.date || new Date().toISOString().slice(0, 10);
        return {
          id: `post-cosytalks-${Date.now()}`,
          slug: `reflections-off-script-${lang}`,
          language: lang,
          draft: true,
          contentType: 'evergreen',
          desk: 'COSYtalks',
          format: 'essay',
          level: 'B1–B2',
          date: date,
          title: 'Why Do We Freeze When Conversations Go Off Script?',
          kicker: 'COSYTALKS • ESSAYS & LONG READS',
          dek: 'Script theory explains why unexpected answers cause conversational pauses. Explore psychological reflections, neuroplasticity, and practical tools to stay in communicative flow.',
          tags: ['Reflections', 'COSYtalks', 'LongReads', 'PsychologyOfLearning', 'SpeakingClub'],
          readingTime: 8,
          podcast: {
            episode: 1,
            audioUrl: null
          },
          artDirection: {
            palette: ['#0d9488', '#faf7f2', '#1c1917', '#14b8a6'],
            fonts: { display: 'Fraunces', text: 'Commissioner', accent: 'Caveat' },
            layout: 'magazine-spread',
            motif: 'notebook-handwritten',
            seed: 'cosytalks-seed',
            coverOverride: null
          },
          blocks: [
            {
              type: 'paragraph',
              text: 'We spend months memorizing textbook dialogues. Yet the moment a barista answers with an unexpected quip or a colleague pivots the topic, our mind goes completely blank.',
              say: 'Welcome to COSYtalks. Today we reflect on why our minds freeze when conversations go off script, and how to embrace spontaneous communicative agility.'
            },
            {
              type: 'pullquote',
              quote: 'The moment the script ends is the exact moment human connection begins.',
              attribution: 'COSY Reflections Salon',
              say: 'Remember: the moment the script ends is the moment genuine conversation begins.'
            },
            {
              type: 'image',
              url: 'images/off-script-flow-en.svg',
              alt: 'Navigating conversational ambiguity diagram',
              caption: 'Bridging ambiguity: transitioning from rehearsed mental scripts to dynamic conversational presence.',
              say: 'Here is our visual model for navigating cognitive ambiguity when talking off script.'
            },
            {
              type: 'culture-bite',
              title: '💡 Research Spark: Synaptic Plasticity & Error Tolerance',
              content: 'Applied linguistics and neurobiology reveal that the adult brain forms stronger grammatical pathways when speakers take communicative risks without immediate self-censorship.',
              say: 'Consider this research insight: error tolerance accelerates synaptic adaptation far more than mechanical memorization.'
            },
            {
              type: 'heading',
              level: 2,
              text: 'Long Read Reflection: Reframing the Conversational Pause',
              say: 'Let us deconstruct how reframing pauses changes conversation dynamics.'
            },
            {
              type: 'paragraph',
              text: 'Native speakers pause constantly. They fill gaps not with anxious silence, but with reflective phrases, thoughtful eye contact, and melodic bridges. Embracing this shift transforms language from a school exam into a living social art.',
              say: 'Native speakers pause all the time. When we treat pauses as thinking space rather than failure, anxiety evaporates.'
            },
            {
              type: 'quote-wall',
              quotes: [
                {
                  quote: 'Language is not an ornament of the mind; it is the living instrument of human communion.',
                  author: 'COSY Publishing House'
                }
              ],
              say: 'Language is the living instrument of human communion.'
            },
            {
              type: 'links',
              destination: 'practice',
              url: 'https://cosylanguages.github.io/COSYpractice/',
              label: 'Join our Live Spoken Audio Discussions on COSYpractice',
              say: 'Join our Spoken Audio Rooms on COSYpractice to put these reflections into real dialogue.'
            }
          ]
        };
      }
    },
    {
      id: 'preset-grammar-by-cosy',
      name: 'Grammar by COSY',
      description: 'Pedagogical grammar explanations featuring constructing elements: visual timelines and decision trees',
      create: (opts = {}) => {
        const lang = opts.language || 'en';
        const date = opts.date || new Date().toISOString().slice(0, 10);
        return {
          id: `post-grammar-by-cosy-${Date.now()}`,
          slug: `demystifying-tenses-timeline-${lang}`,
          language: lang,
          draft: true,
          contentType: 'evergreen',
          desk: 'Grammar by COSY',
          format: 'essay',
          level: 'A1–A2',
          date: date,
          title: 'Demystifying Verb Tenses: A Visual Timeline Guide',
          kicker: 'GRAMMAR BY COSY',
          dek: 'Understanding time, aspect, and completion without memorizing confusing grammatical jargon.',
          tags: ['Grammar', 'Timelines', 'DecisionTree', 'CosyGuides'],
          readingTime: 6,
          podcast: {
            episode: 2,
            audioUrl: null
          },
          artDirection: {
            palette: ['#0284c7', '#faf7f2', '#0f172a', '#38bdf8'],
            fonts: { display: 'Fraunces', text: 'Commissioner', accent: 'Caveat' },
            layout: 'magazine-spread',
            motif: 'editorial-stars',
            seed: 'grammar-by-cosy-seed',
            coverOverride: null
          },
          blocks: [
            {
              type: 'paragraph',
              text: 'Grammar becomes completely intuitive when visualized along a spatial timeline rather than memorized as abstract rules.',
              say: 'Welcome to Grammar by COSY. Today we make verb tenses intuitive using visual timelines and decision trees.'
            },
            {
              type: 'pullquote',
              quote: 'Tense tells you when; aspect tells you how an action unfolds in time.',
              attribution: 'COSY Grammar Atelier',
              say: 'Keep this core principle in mind: tense tells you when, aspect tells you how the action unfolds.'
            },
            {
              type: 'paragraph',
              text: '<div class="cosy-timeline"><div class="timeline-labels"><span>Past</span><span class="timeline-now-label">NOW</span><span>Future</span></div><div class="timeline-line"><div class="timeline-event" style="left:18%; width:20%;"><div class="timeline-bar"></div><div class="timeline-card"><strong>Past Simple</strong><p>Completed event at a specific past point</p></div></div><div class="timeline-event" style="left:48%; width:4%;"><div class="timeline-bar"></div><div class="timeline-card"><strong>Present Simple</strong><p>Routine, timeless truth, recurring habit</p></div></div><div class="timeline-now"></div></div></div>',
              say: 'Examine the visual timeline: see how completed past points contrast with ongoing present routines.'
            },
            {
              type: 'image',
              url: 'images/off-script-flow-en.svg',
              alt: 'Temporal Timeline and Aspect Architecture',
              caption: 'Temporal timeline architecture: mapping moments, durations, and aspectual loops.',
              say: 'Here is our detailed architectural diagram for visualizing grammatical aspect.'
            },
            {
              type: 'heading',
              level: 2,
              text: 'The Decision Tree: Which Tense Should I Use?',
              say: 'Here is your quick decision tree to select the right verb tense.'
            },
            {
              type: 'paragraph',
              text: '<figure class="cosy-fig"><p class="cosy-fig-kicker">Grammar Decision Tree</p><p class="cosy-fig-title">Choosing the natural form effortlessly</p><div class="dtree-q">Is the action connected to right now?</div><ul class="dtree"><li><span class="dtree-if">Happening <strong>at this exact moment</strong></span><span class="dtree-then"><span class="arr" aria-hidden="true">→</span><span class="vtag is-everyday"><span class="vtag-ic" aria-hidden="true">💬</span>Present Continuous</span></span><span class="dtree-ex">I am writing this guide right now.</span></li><li><span class="dtree-if">Regular <strong>daily routine or habit</strong></span><span class="dtree-then"><span class="arr" aria-hidden="true">→</span><span class="vtag is-everyday"><span class="vtag-ic" aria-hidden="true">💬</span>Present Simple</span></span><span class="dtree-ex">I read a chapter every morning.</span></li><li><span class="dtree-if">Finished completely <strong>in the past</strong></span><span class="dtree-then"><span class="arr" aria-hidden="true">→</span><span class="vtag is-work"><span class="vtag-ic" aria-hidden="true">💼</span>Past Simple</span></span><span class="dtree-ex">We discussed the chapter yesterday.</span></li></ul></figure>',
              say: 'Walk through this decision tree whenever you choose between simple and continuous forms.'
            },
            {
              type: 'quiz',
              question: 'Which sentence describes a permanent routine or habit?',
              options: [
                'She is working at the library today.',
                'She works at the library.',
                'She worked at the library.'
              ],
              correctIndex: 1,
              explanation: 'The present simple form indicates regular routines and general facts.',
              say: 'Test your understanding with this quick quiz.'
            },
            {
              type: 'links',
              destination: 'cosytools',
              url: 'https://cosylanguages.github.io/COSYtools/',
              label: 'Interactive Grammar & Conjugation Engine on COSYtools',
              say: 'Explore our interactive conjugation visualizer on COSYtools.'
            }
          ]
        };
      }
    },
    {
      id: 'preset-words-by-cosy',
      name: 'Words by COSY',
      description: 'Vocabulary master guides featuring "Stop!" sentence frames and "Top Words" frequency tables',
      create: (opts = {}) => {
        const lang = opts.language || 'en';
        const date = opts.date || new Date().toISOString().slice(0, 10);
        return {
          id: `post-words-by-cosy-${Date.now()}`,
          slug: `stop-translating-top-words-${lang}`,
          language: lang,
          draft: true,
          contentType: 'evergreen',
          desk: 'Words by COSY',
          format: 'list',
          level: 'A0–A1 / A2',
          date: date,
          title: 'Words by COSY: Stop Translating & Essential Top Words',
          kicker: 'WORDS BY COSY • VOCABULARY DESK',
          dek: 'Replace word-for-word translation with high-yield sentence frames and high-frequency verb matrices that unlock natural spoken fluency.',
          tags: ['Vocabulary', 'WordsByCOSY', 'StopTranslating', 'TopWords', 'SentenceFrames'],
          readingTime: 6,
          podcast: {
            episode: 3,
            audioUrl: null
          },
          artDirection: {
            palette: ['#047857', '#faf8f5', '#1e293b', '#10b981'],
            fonts: { display: 'Fraunces', text: 'Commissioner', accent: 'Caveat' },
            layout: 'magazine-spread',
            motif: 'editorial-stars',
            seed: 'words-by-cosy-seed',
            coverOverride: null
          },
          blocks: [
            {
              type: 'paragraph',
              text: 'Fluency does not come from memorizing thousands of isolated words. It comes from mastering high-frequency verbs and adaptable sentence frames that let you express thoughts spontaneously.',
              say: 'Welcome to Words by COSY. Today we break down Stop Translating sentence frames and core high frequency vocabulary.'
            },
            {
              type: 'image',
              url: 'images/stop-translating-flow-en.svg',
              alt: 'Stop Translating Sentence Frame Workflow',
              caption: 'Circumlocution flow: using functional sentence frames to describe ideas effortlessly.',
              say: 'Here is our visual guide to building immediate sentences using functional frames.'
            },
            {
              type: 'heading',
              level: 2,
              text: 'Template 1: Stop! 10 Reusable Sentence Frames',
              say: 'Let us examine our first template: Stop Translating sentence frames.'
            },
            {
              type: 'table',
              caption: 'Stop Translating! Spoken Sentence Frames',
              printable: true,
              headers: ['Pattern', 'Spoken Frame', 'Natural Example'],
              rows: [
                ['Describing objects', 'It’s a kind of… / You use it to…', 'It’s a kind of tool you use to slice bread.'],
                ['Expressing opinion', 'As far as I can tell…', 'As far as I can tell, this option works best.'],
                ['Seeking clarification', 'If I understand correctly…', 'If I understand correctly, we meet at five.']
              ],
              say: 'Review these sentence frames to describe unfamiliar words with zero hesitation.'
            },
            {
              type: 'heading',
              level: 2,
              text: 'Template 2: Top Words High-Frequency Matrix',
              say: 'Now let us explore the Top Words high frequency matrix.'
            },
            {
              type: 'table',
              caption: 'Top Verbs Quick Conjugation & Usage Summary',
              printable: true,
              headers: ['Verb', 'Present Spoken Form', 'Everyday Example'],
              rows: [
                ['want / would like', 'I want / I’d like', 'I would like a flat white, please.'],
                ['have / get', 'I have / I get', 'I have a quick question before we start.'],
                ['think / believe', 'I think / I reckon', 'I think that makes complete sense.']
              ],
              say: 'Notice how these core high frequency verbs power daily conversational exchanges.'
            },
            {
              type: 'links',
              destination: 'cosytools',
              url: 'https://cosylanguages.github.io/COSYtools/',
              label: 'Explore Complete Conjugations & Audio Pronunciations in COSYtools',
              say: 'Head over to COSYtools for complete conjugation tables and audio recordings.'
            }
          ]
        };
      }
    },
    {
      id: 'preset-saturday-mistakes',
      name: 'Saturday Mistakes',
      description: 'Weekly website-only conversational slips guide with wrong vs. right cards, rules, and quizzes',
      create: (opts = {}) => {
        const lang = opts.language || 'en';
        const date = opts.date || new Date().toISOString().slice(0, 10);
        return {
          id: `post-saturday-mistakes-${Date.now()}`,
          slug: `saturday-mistakes-new-edition-${lang}`,
          language: lang,
          draft: true,
          contentType: 'evergreen',
          desk: 'Saturday Mistakes',
          format: 'list',
          level: 'A0–A1 / A2',
          date: date,
          title: '5 Common Saturday Mistakes Learners Make (and How to Fix Them)',
          kicker: 'SATURDAY MISTAKES • WEBSITE EDITION',
          dek: 'Clear, memorable fixes for 5 persistent conversational slips that learners encounter every week.',
          tags: ['SaturdayMistakes', 'SpeakingFirst', 'Fluency', 'WebsiteOnly'],
          readingTime: 4,
          podcast: {
            episode: 1,
            audioUrl: null
          },
          artDirection: {
            palette: ['#b45309', '#fdfbf7', '#1c1917', '#d97706'],
            fonts: { display: 'Fraunces', text: 'Commissioner', accent: 'Caveat' },
            layout: 'magazine-spread',
            motif: 'notebook-handwritten',
            seed: 'sat-mistakes-seed',
            coverOverride: null
          },
          blocks: [
            {
              type: 'paragraph',
              text: 'Every Saturday, we look at conversational slips that happen when thinking in one language and speaking in another. Remember: mistakes are proof that you are actively learning.',
              say: 'Welcome to Saturday Mistakes. Today we look at five conversational slips and how to fix them effortlessly.'
            },
            {
              type: 'image',
              url: 'images/saturday-mistakes-routine-en.svg',
              alt: 'Saturday Mistakes Cognitive Feedback Loop',
              caption: 'Notice the slip, understand why, learn the COSY rule, and speak with confidence.',
              say: 'Here is our visual breakdown of how native thought habits cause conversational friction.'
            },
            {
              type: 'mistake-card',
              number: 1,
              title: 'Expressing Age',
              wrong: '"I have 30 years."',
              right: '"I am 30 years old."',
              why: 'Learners translate directly from native languages where age is viewed as a possession.',
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
      id: 'preset-thursday-stories',
      name: 'Thursday Stories',
      description: 'Weekly website-only narrative storytelling and personal immersion chronicles',
      create: (opts = {}) => {
        const lang = opts.language || 'en';
        const date = opts.date || new Date().toISOString().slice(0, 10);
        return {
          id: `post-thursday-stories-${Date.now()}`,
          slug: `thursday-stories-new-chapter-${lang}`,
          language: lang,
          draft: true,
          contentType: 'evergreen',
          desk: 'Thursday Stories',
          format: 'essay',
          level: 'A2–B1',
          date: date,
          title: 'Thursday Stories: The Day the Dictionary Stayed in My Pocket',
          kicker: 'THURSDAY STORIES • WEBSITE EDITION',
          dek: 'A reflective narrative on surviving an unexpected afternoon market conversation relying solely on communicative gesture and curiosity.',
          tags: ['ThursdayStories', 'Storytelling', 'Immersion', 'WebsiteOnly'],
          readingTime: 5,
          podcast: {
            episode: 1,
            audioUrl: null
          },
          artDirection: {
            palette: ['#9333ea', '#faf7f2', '#18181b', '#c084fc'],
            fonts: { display: 'Fraunces', text: 'Commissioner', accent: 'Caveat' },
            layout: 'magazine-spread',
            motif: 'notebook-handwritten',
            seed: 'thursday-stories-seed',
            coverOverride: null
          },
          blocks: [
            {
              type: 'paragraph',
              text: 'Every Thursday, we share personal narratives and real immersion moments from language learners around the world. These are stories about bravery, awkward smiles, and the joy of being understood.',
              say: 'Welcome to Thursday Stories. Today we explore what happens when we leave the safety of our dictionaries and step into the living world.'
            },
            {
              type: 'pullquote',
              quote: 'You do not learn a language to live; you live, and language gathers around you like light.',
              attribution: 'COSY Storyteller Ledger',
              say: 'You do not learn a language to live; you live, and language gathers around you.'
            },
            {
              type: 'image',
              url: 'images/off-script-flow-en.svg',
              alt: 'Immersion Journey Narrative Path',
              caption: 'The immersion path: listening to cadence, sensing context, and daring to speak.',
              say: 'Here is our narrative map of the daily immersion journey.'
            },
            {
              type: 'heading',
              level: 2,
              text: 'A Conversation in the Rain',
              say: 'Part one: a conversation in the rain.'
            },
            {
              type: 'paragraph',
              text: 'The rain had begun without warning. Huddled beneath the canvas awning of an old fruit vendor, I wanted to apologize for taking up space. My pocket held a smartphone loaded with translator apps. But instead of looking down at the screen, I caught the vendor’s eye, smiled, and pointed to the ripe figs.',
              say: 'The rain had begun without warning. Instead of pulling out a dictionary, I looked up, smiled, and pointed to the ripe figs.'
            },
            {
              type: 'culture-bite',
              title: '💡 Story Spark: Communicative Empathy',
              content: 'When we drop our defenses and use authentic non-verbal warmth, interlocutors instinctively slow down and meet us halfway.',
              say: 'When we show communicative vulnerability, people instinctively slow down and meet us halfway.'
            },
            {
              type: 'links',
              destination: 'practice',
              url: 'https://cosylanguages.github.io/COSYpractice/',
              label: 'Share your own immersion story on COSYpractice',
              say: 'Share your own speaking stories with fellow learners on COSYpractice.'
            }
          ]
        };
      }
    }
  ];

  /**
   * Modular Element Presets (Publishing House Building Blocks)
   * Designed to be directly inserted into both Magazine Issue spreads and standalone Website articles.
   */
  const MODULAR_ELEMENT_PRESETS = [
    {
      id: 'quote_pull',
      label: 'Pullquote Highlight',
      icon: '❝',
      description: 'Stylized editorial quote with speaker attribution',
      create: () => ({
        type: 'pullquote',
        quote: 'Fluency is not the absence of mistakes; it is the presence of communicative courage.',
        attribution: 'COSY Publishing House',
        say: 'Fluency is not the absence of mistakes, but the presence of communicative courage.'
      })
    },
    {
      id: 'callout_spark',
      label: 'Research Spark Note',
      icon: '💡',
      description: 'Academic inquiry or cultural context note with research field tags',
      create: () => ({
        type: 'culture-bite',
        title: '💡 Research Spark: Communicative Fluency vs Accuracy',
        content: 'How does prioritizing communicative flow over real-time error correction affect adult second language retention?',
        say: 'Consider this research question: how does communicative flow impact adult retention?'
      })
    },
    {
      id: 'table_comparison',
      label: 'Comparative Matrix Table',
      icon: '📊',
      description: 'Side-by-side analytical table for language rules, arguments, or structures',
      create: () => ({
        type: 'table',
        caption: 'Comparative Analysis Matrix',
        printable: true,
        headers: ['Concept / Feature', 'Approach A', 'Approach B'],
        rows: [
          ['Focus', 'Spontaneous communication', 'Mechanical grammar drills'],
          ['Outcome', 'Rapid conversational confidence', 'High hesitation and speaking anxiety'],
          ['Ideal For', 'Speaking clubs and real life', 'Written academic examination']
        ],
        say: 'Review the comparative analysis matrix to see the core differences.'
      })
    },
    {
      id: 'cards_vocabulary',
      label: 'Vocabulary Upgrade Cards',
      icon: '📋',
      description: 'Upgrades from basic phrases to natural spoken expressions',
      create: () => ({
        type: 'list-item',
        ordered: false,
        items: [
          'I don\'t know → Let me think about that for a second',
          'Very interesting → Fascinating / Eye-opening',
          'I think that → In my experience / As I see it'
        ],
        say: 'Use these phrase upgrades to make your speech sound more authentic and natural.'
      })
    },
    {
      id: 'audio_script_dialogue',
      label: 'Dialogue & Audio Script',
      icon: '🎙️',
      description: 'Narrative dialogue paragraph with timing beat and spoken audio script',
      create: () => ({
        type: 'paragraph',
        text: '**JY DM:** "When you step into a conversation, do not wait for the perfect sentence to form. The moment you share an approximate thought, human connection begins."',
        beat: {
          duration: 3500,
          camera: 'focus'
        },
        say: 'When you step into a conversation, do not wait for the perfect sentence to form.'
      })
    },
    {
      id: 'thematic_crossword_preset',
      label: 'Thematic Crossword',
      icon: '🧩',
      description: 'End-of-issue printable full-page crossword with adaptive clue grid',
      create: () => ({
        type: 'table',
        caption: 'Thematic Crossword Clues',
        printable: true,
        headers: ['Direction', 'Number', 'Clue & Issue Context', 'Length'],
        rows: [
          ['Across', '1', 'BELONG — Word of the Issue: feeling accepted in a new community', '6 letters'],
          ['Across', '4', 'TRAUMA — School memories: unlearning past classroom anxiety', '6 letters'],
          ['Across', '6', 'SYRNIKI — Slavic Culinary Salon: golden curd breakfast pancakes', '7 letters'],
          ['Down', '2', 'SPEAKING — Founder Dispatch: producing speech from lesson one', '8 letters'],
          ['Down', '3', 'NEUROPLASTICITY — Cosyscience: adult brain rewiring capability', '15 letters'],
          ['Down', '5', 'CURIOSITY — Einstein quote: passionately inquisitive beginner spirit', '9 letters']
        ],
        say: 'Review the crossword clues extracted from this edition.'
      })
    },
    {
      id: 'timeline_visual',
      label: 'Visual Timeline',
      icon: '⏳',
      description: 'Constructing element for grammar: spatial timeline mapping past, present, and future aspect',
      create: () => ({
        type: 'paragraph',
        text: '<div class="cosy-timeline"><div class="timeline-labels"><span>Past</span><span class="timeline-now-label">NOW</span><span>Future</span></div><div class="timeline-line"><div class="timeline-event" style="left:18%; width:20%;"><div class="timeline-bar"></div><div class="timeline-card"><strong>Past Simple</strong><p>Event completed before now</p></div></div><div class="timeline-event" style="left:48%; width:4%;"><div class="timeline-bar"></div><div class="timeline-card"><strong>Present Simple</strong><p>Regular habit or universal truth</p></div></div><div class="timeline-now"></div></div></div>',
        say: 'Follow the spatial timeline to see how action points relate to right now.'
      })
    },
    {
      id: 'decision_tree_grammar',
      label: 'Decision Tree',
      icon: '🌲',
      description: 'Constructing element for grammar: branch-by-branch condition tree for choosing correct forms',
      create: () => ({
        type: 'paragraph',
        text: '<figure class="cosy-fig"><p class="cosy-fig-kicker">Grammar Decision Tree</p><p class="cosy-fig-title">Which structure should I choose?</p><div class="dtree-q">What kind of action are you describing?</div><ul class="dtree"><li><span class="dtree-if">An action <strong>in progress right now</strong></span><span class="dtree-then"><span class="arr" aria-hidden="true">→</span><span class="vtag is-everyday"><span class="vtag-ic" aria-hidden="true">💬</span>Continuous Form</span></span><span class="dtree-ex">I am practicing speaking right now.</span></li><li><span class="dtree-if">A general <strong>routine or permanent state</strong></span><span class="dtree-then"><span class="arr" aria-hidden="true">→</span><span class="vtag is-everyday"><span class="vtag-ic" aria-hidden="true">💬</span>Simple Form</span></span><span class="dtree-ex">I practice speaking every morning.</span></li></ul></figure>',
        say: 'Use this decision tree to decide step by step which grammatical form to choose.'
      })
    },
    {
      id: 'stop_translating_frames',
      label: 'Stop! Frames Table',
      icon: '🛑',
      description: 'Constructing element for vocabulary: Stop Translating sentence frames and substitution formulas',
      create: () => ({
        type: 'table',
        caption: 'Stop Translating! High-Yield Conversational Frames',
        printable: true,
        headers: ['Target Meaning', 'Circumlocution Frame', 'Real Spoken Example'],
        rows: [
          ['Describe an object', 'It’s a kind of… / You use it for…', 'It’s a kind of gadget you use to open bottles.'],
          ['State an impression', 'It gives the feeling of…', 'The city gives the feeling of calm elegance.'],
          ['Ask for precision', 'Could you rephrase that in other words?', 'Could you rephrase that with a different example?']
        ],
        say: 'Review the Stop Translating frames to bypass literal mental translation.'
      })
    }
  ];

  /**
   * Factory function to create a modular element block by preset id
   */
  function createModularElementBlock(presetId) {
    const preset = MODULAR_ELEMENT_PRESETS.find(p => p.id === presetId);
    if (!preset) {
      throw new Error(`Unknown modular preset "${presetId}". Allowed: ${MODULAR_ELEMENT_PRESETS.map(p => p.id).join(', ')}`);
    }
    return preset.create();
  }

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

  /**
   * Available visual image assets and diagrams
   */
  const AVAILABLE_IMAGE_ASSETS = [
    { url: 'images/saturday-mistakes-routine-en.svg', label: 'Saturday Mistakes Routine (English)' },
    { url: 'images/saturday-mistakes-routine-fr.svg', label: 'Saturday Mistakes Routine (French)' },
    { url: 'images/saturday-mistakes-routine-it.svg', label: 'Saturday Mistakes Routine (Italian)' },
    { url: 'images/saturday-mistakes-routine-ru.svg', label: 'Saturday Mistakes Routine (Russian)' },
    { url: 'images/saturday-mistakes-routine-el.svg', label: 'Saturday Mistakes Routine (Greek)' },
    { url: 'images/stop-translating-flow-en.svg', label: 'Stop Translating Workflow (English)' },
    { url: 'images/stop-translating-flow-fr.svg', label: 'Stop Translating Workflow (French)' },
    { url: 'images/stop-translating-flow-it.svg', label: 'Stop Translating Workflow (Italian)' },
    { url: 'images/stop-translating-flow-es.svg', label: 'Stop Translating Workflow (Spanish)' },
    { url: 'images/stop-translating-flow-de.svg', label: 'Stop Translating Workflow (German)' },
    { url: 'images/stop-translating-flow-pt.svg', label: 'Stop Translating Workflow (Portuguese)' },
    { url: 'images/stop-translating-flow-ru.svg', label: 'Stop Translating Workflow (Russian)' },
    { url: 'images/stop-translating-flow-el.svg', label: 'Stop Translating Workflow (Greek)' },
    { url: 'images/off-script-flow-en.svg', label: 'Going Off Script Timeline (English)' },
    { url: 'images/off-script-flow-fr.svg', label: 'Going Off Script Timeline (French)' },
    { url: 'images/off-script-flow-it.svg', label: 'Going Off Script Timeline (Italian)' },
    { url: 'images/off-script-flow-ru.svg', label: 'Going Off Script Timeline (Russian)' },
    { url: 'images/off-script-flow-el.svg', label: 'Going Off Script Timeline (Greek)' },
    { url: 'images/logo.png', label: 'COSY Ecosystem Seal Logo' }
  ];

  /**
   * Ecosystem link presets with canonical targets and default labels
   */
  const LINK_PRESETS = [
    { destination: 'cosytools', url: 'https://cosylanguages.github.io/COSYtools/', label: 'Explore Verb Conjugation in COSYtools' },
    { destination: 'practice', url: 'https://cosylanguages.github.io/COSYpractice/', label: 'Practice Speaking on COSYpractice' },
    { destination: 'ecosystem', url: 'https://cosylanguages.com', label: 'Visit COSYlanguages Gateway' },
    { destination: 'external', url: 'https://en.wiktionary.org', label: 'Reference Etymology Guide' }
  ];

  return {
    BLOCK_DEFINITIONS,
    ARTICLE_PRESETS,
    MODULAR_ELEMENT_PRESETS,
    createModularElementBlock,
    CANONICAL_ISSUES,
    CANONICAL_SECTIONS,
    createSectionTemplate,
    AVAILABLE_IMAGE_ASSETS,
    LINK_PRESETS,
    createBlock,
    clone
  };
});
