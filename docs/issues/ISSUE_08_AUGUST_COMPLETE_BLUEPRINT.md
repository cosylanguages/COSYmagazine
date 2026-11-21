# COSYmagazine Vol.  2026.08 — Get Ready for School

## Running order (as built)

The issue prints as one sequence. Each post carries `printOrder`, so a department sits immediately
before the piece it opens — the openers are not boxed into front/well/back acts.

| # | Department | Section id | Role |
|---|---|---|---|
| 1 | I Couldn't Help But Wonder | `wonder_column` | Opens the issue and hands over to the founder conversation |
| 2 | In Conversation: Founder | `founder_interview` | States the issue's themes and its name |
| 3 | Debatable & Relatable | `debatable_relatable` | Opens the student conversation |
| 4 | In Conversation: Student Years | `in_conversation` | Staged in `drafts/` until the answers are recorded |
| 5 | Mind Matters | `mind_matters` | Opens the Words Desk |
| 6 | Words Desk (top 10, then top 100) | `words_desk` | The teaching block |
| 7 | If You Were | `if_you_were` | Opens the teacher conversation |
| 8 | In Conversation: The Teacher's Room | `in_conversation` | Staged in `drafts/` until he has read it |
| 9 | Keeping Up with Science | `science_expander` | Opens the Top 100 block |
| 10 | My Life With & Without | `life_with_without` | Opens Idiom Detective and COSY Sightings |
| 11 | Idiom Detective / COSY Sightings | `idiom_detective`, `cosy_sightings` | The two pieces the ledger opens |
| 12 | The Greatest Quotes | `greatest_quotes` | The outro; closes the main discussion |
| 13 | The Month's List | `cultural_salon` | One film, one song, one book, and the Book Lovers Day prompt |
| 14 | Culinary Salon | `culinary_salon` | Five breakfasts, one per kitchen language |
| 15 | Thematic Crossword | `thematic_crossword` | The puzzle page; closes the issue before the appendix |

Every speaking-club department carries the issue's theme in its own words and one
"This could be a good research question" marginalia block.

The three departments the issue used to promise but did not print are now built: the month's list
(`the-months-list-august`), the recipes (`culinary-salon-august`) and the puzzle
(`crossword-august-first-words`). The crossword needed a block type, a grid renderer and print CSS;
all three live in `blocks.js` and `build-issue-pdf.js` now. The board (caption plus grid) is grouped
so it never splits across a page, and the clues and answer key follow it on the same page, which
keeps the puzzle to one spread: opener on one page, grid, clues and key on the next.

## Production Brief

This is the revised editorial plan for the first issue, not final page copy. The issue's promise is: **a new language can be a new beginning, and speaking does not have to wait for perfection.** It is for teens, adults, and seniors; examples should be age-inclusive without assuming the same goals or experiences.

The roster below is the editorial plan; the built edition now runs longer than 31 pages because the founder, student and teacher conversations print in full. The two conversations still staged in `drafts/` remain the only unwritten pages, and the contest showcase stays closed until winners and permissions exist.

## Editorial Rules

- Opening sequence is fixed: Front Cover → Letter from the Editor (JY DM) → the issue's opening
  department. There is no Founder's Editorial Dispatch: the letter carries the founder's voice, and a
  second essay in front of the first interview repeated it.
- Keep one central question visible throughout: **What helps someone begin speaking again after fear, shame, or a discouraging classroom experience?**
- Mark activities for A0–A2, B1–B2, and C1–C2. Use simpler language and more scaffolding at beginner levels; use more analysis and counterargument at advanced levels.
- Alfinur M. interviews JY DM in three conversations, kept distinct: the **founder** (why COSY exists and how the method works), the **student** (his own school years, pressure, support, starting again), and the **teacher** (classroom practice: reading a room, scaffolding, feedback across ages). Do not invent James's memories or attribute unapproved quotations to him.
- JY DM's school interview is a personal account, not an external student/teacher profile. Any separate *Student & Teacher Spotlight* requires a real, consenting contributor; do not fabricate a composite profile or testimonial.
- The separate founder reflection on early acquisition and childhood curiosity remains deferred until JY DM supplies those memories and approves the wording.
- Sprinkle practical micro-activities across departments: *Word of the Issue*, two idioms, and prompts to finish a thought, start from a given ending, or fill sentence gaps. Keep them brief and optional; fictional answers are welcome where a prompt touches personal experience.
- The Wonder column includes a research question and B1–B2/C1–C2 speaking-club adaptations. Distinguish hypotheses from established findings.
- The Trends Debate on typing versus handwriting presents three arguments for and three against; do not imply that one method is universally superior without evidence and context.
- August features **Stop Translating** only. Its three pillars are high-frequency verbs, miming/circumlocution, and sensory upgrades across the target languages. *Go Creative* and *Go Diverse* remain mutually exclusive standalone formats for other issues.
- Treat *Multilingual People Have Younger Brains* as a claim to investigate, not a settled headline fact. Review the evidence on multilingualism, cognitive reserve, and brain aging with limitations and source attribution.
- Publish 100-word contest winners only after verifying the original entries, target languages, word counts, selection, and written permission.
- Verify Einstein quote wording/attribution, Book Lovers Day date, film details, and all research claims. Do not reproduce protected lyrics or lengthy copyrighted text.
- Use "discouraging learning experience", "fear", or "classroom shame" unless a participant self-identifies with trauma. Do not diagnose participants or promise that language learning prevents cognitive decline.
- Recipes must be complete, checked, and culturally contextualized for English-, French-, Italian-, Russian-, and Greek-language communities.

## Page Roster

The revised full-edition plan is 31 pages. Keep the public preview to the cover, editor's letter, and a short dispatch excerpt. The full issue and PDF remain in private storage behind the server-side entitlement check.

| Page(s) | Department | August content and production notes |
|---|---|---|
| 1 | Front Cover | *Get Ready for School*; subtitle: *A new language, a new beginning. Speak before you feel ready.* Use the COSY Languages logo and end-of-summer/new-beginnings doodles; avoid generic stock photography. |
| 2 | Letter from the Editor (L'Édito) | Welcoming note from JY DM. |
| 5–6 | In Conversation: Founder | Alfinur M. interviews JY DM about the 2020 origins of COSY Languages, early language-learning steps, what to avoid, handwriting, music, and motivation. Response to the continue/change/pause question is pending; founder review required. Set the scene as an online phone-camera conversation at James's home, with the vinyl player, books, and *Born to Die* visible. |
| 7 | Wonder Column | *Why Do Adults Freeze at the Classroom Door?* Reflective opening, without diagnosing readers. |
| 8 | Speaking Clubs + Research Spark | B1–B2 and C1–C2 adaptations for the Wonder question; include fields to explore and label the research question as a hypothesis. |
| 9–10 | In Conversation: School Memories | Alfinur M. interviews JY DM about his own school experience, pressure, support, and starting again. Keep teachers unnamed in this draft; verify and obtain permission before using identifying details. This is not a substitute for an external student/teacher spotlight. The questions are written and staged in `content/issues/2026-08/drafts/`; the answers are his to record. |
| follows 9–10 | In Conversation: The Teacher's Room | JY DM as teacher: signs of apprehension, low-stakes entry tasks, the same method at A0–A2 / B1–B2 / C1–C2, feedback timing and age, mixed-age rooms. Drafted in full from his published method; founder review required before it prints. |
| Deferred | Founder Reflection | Early acquisition and childhood curiosity; use founder-provided material, distinct from both Q&As. Do not invent memories. |
| 11–12 | Fashion & Trends: The Trends Debate | *Typing vs Handwriting in Modern Schools*: three arguments for, three against, speaking placards, and sentence-finish/start/gap-fill prompts. |
| 13–14 | Words & Creativity Desk: Stop Translating | Pillar 1: high-frequency verbs and *Word of the Issue*; Pillar 2: miming and circumlocution; Pillar 3: sensory upgrades across EN/FR/IT/RU/EL, with two idioms and optional sentence-completion practice. |
| 15–16 | Science & Cognition | Investigate the claim *Multilingual People Have Younger Brains* through cognitive reserve and brain-aging research; state what is and is not established. |
| 17 | Mind Matters | *The Imposter Syndrome of the First Day*: psychological safety and affective filter, without clinical diagnosis. |
| 18 | Reader & Contest Showcase | Winning 100-word micro-essays in target languages, with optional sentence starts/gap fills. Hold this page until authentic winners and permissions are confirmed. |
| 19 | Narrative Ledger | *My Life With & Without Fear of Evaluation*, clearly framed as an illustrative literary piece, not a real testimonial. |
| 20 | If You Were | *If You Were a Kindergarten Teacher in Tokyo*: hypothetical scenario, culturally researched and not presented as a claim about all Japanese classrooms. |
| 23 | Philosophy Café | Einstein's *“I am only passionately curious”*; verify wording and attribution before print, then unpack the idea through discussion. |
| 24 | Cinema Pick | Folded into *The Month's List* rather than printed twice: *Dead Poets Society*, with a content note and a discussion question. |
| 25 | Monthly Vibes → built as *The Month's List* | One film (*Dead Poets Society*, with a content note), one song (Cass Elliot, *Make Your Own Kind of Music*, no lyrics printed), one book (*Educated*), and the Book Lovers Day prompt for 9 August. Verify track metadata, cultural context, observance date, age suitability, availability, and rights; print no lyrics. |
| 26–29 | Culinary Salon → built | Opening menu plus five recipes — porridge (EN), tartine au chocolat (FR), frittata di pasta (IT), syrniki (RU), yogurt with thyme honey and walnut (EL) — each with region/context, ingredients, method, a *Say it in…* table and a conversation prompt. |
| 30–31 | End-of-Issue Crossword & Puzzle → built | *The August Crossword: First Words*: 18 entries in one grid, all drawn from Issue 08 — `NEUROPLASTICITY`, `CURIOSITY`, `SPEAKING`, `TRAUMA`, `BELONG`, `SYRNIKI`, `CLASSROOM` and eleven school words. The opener carries the title and the spoken-solve instructions; the next page carries the grid, both clue columns and the answer key (cells are sized from the grid's row count, so a taller puzzle shrinks rather than overflows). |

## Interview Question Bank

### Founder Conversation

1. What memory from your own language-learning or teaching life shaped your view of the first lesson?
2. Why can a learner know the words and still hesitate to speak?
3. What does "speaking-first" mean, and what does it not mean?
4. What can a teacher do in the first ten minutes to make participation feel safer?
5. How should the same speaking-first principle look at A0–A2, B1–B2, and C1–C2?
6. How can we welcome teens, working adults, and seniors without assuming they share the same needs?
7. Which benefits of learning languages are supported by evidence, and which popular claims need more care?
8. What question about language anxiety or lifelong learning would you most like to investigate?

### Community Conversation

For a learner: What made you begin or begin again? What made speaking easier? Was there a moment when you chose to speak despite uncertainty? What would you tell someone returning after a difficult classroom experience?

For a teacher: What signs of apprehension do you notice? Which low-stakes tasks help learners enter a conversation? How do you adapt feedback across levels and ages? What would you change about a learner's first lesson?

## Content Decisions

- Remove *Welcome to the COSY Editorial & Learning Corner* and *How We Built the COSY Master Curriculum Across 14 Languages* from the August issue and public issue roster.
- Keep *Why Speaking-First is the Only Way to True Fluency* and the English Top 10 verbs guide available as free standalone reads and as features in the paid issue.
- Review the separate all-14-languages Top 10 verbs article. Keep it as a distinct reference-library resource or make its difference from the English master guide explicit; do not present two near-identical beginner features back-to-back.
- Replace the former speaking-readiness debate with the revised typing-versus-handwriting debate in the new August roster.

## Paid Edition Boundary

The current flipbook gate is a client-side presentation gate, not secure content authorization. Root-level HTML and JSON served by GitHub Pages are public even if page navigation is hidden. Do not put premium-only articles, full page data, or the PDF in those public outputs.

Keep the cover and a short preview public. Serve the full issue and PDF from private storage only after a trusted server-side entitlement check for either an active subscription or a purchase of Vol. 2026.08. Store no service-role key in the browser. The two explicitly free articles can remain public as standalone reads and also appear in the paid issue; premium layouts, interviews, levelled club materials, recipes, and PDF access must not be exposed through public static files.

This brief is not the finished manuscript. The Wonder column, debate copy, community interview, research feature, comparative grammar lesson, complete recipes, and both club handouts still need writing and source review before the full edition is ready.
