import json
import sys
import os

languages_data = {
    "en": {
        "name": "English",
        "p1_title": "Top 10 Essential Verbs in English for Absolute Beginners (A0–A1 / A2)",
        "p2_title": "Top 10 Essential Verbs in English, Part 2 (CEFR A0–A1 / A2)",
        "p1_kicker": "ENGLISH CORE GUIDE — PART 1 OF 2",
        "p2_kicker": "ENGLISH CORE GUIDE — PART 2 OF 2",
        "p1_dek": "Master the first 10 high-frequency verbs in English (be, have, think, know, like, want/would like, work/study/learn, go/be going to, can, eat/drink). Conjugation tables are consultable on COSYtools.",
        "p2_dek": "Master the second 10 high-frequency verbs in English: do/make, speak/talk/say/tell, look/watch/see, listen/hear, must/have to/should, come/leave, take/give, ask/answer, wait, and live. Conjugation tables on COSYtools.",
        "p1_intro": "Welcome to Part 1 of our 2-part core verb series for A0–A1 and A2 English learners! This article introduces the first 10 essential verbs for daily communication with simple sentences and useful phrases. (Explore [Part 2](top-10-verbs-part-2-en.html) for the next 10 verbs). Complete conjugation tables for all verbs are consultable on [COSYtools](https://cosylanguages.github.io/COSYtools/).",
        "p2_intro": "Welcome to Part 2 of our 2-part core verb series for A0–A1 and A2 English learners! (Read [Part 1](top-10-verbs-en.html) if you missed it). Here we cover 10 core action, perception, and modal verbs. All conjugation tables and verb forms are consultable on [COSYtools](https://cosylanguages.github.io/COSYtools/).",
        "h_breakdown_p1": "Deep Dive: Top 10 English Verbs (Part 1)",
        "h_breakdown_p2": "Deep Dive: Top 10 English Verbs (Part 2)",
        "h_matrix": "Comparative Matrix across Language Families",
        "h_family": "Grammar & Structure for A0–A1 / A2 Learners",
        "h_practice": "Practice & Conjugation Resources",
        "matrix_intro": "Comparative breakdown for core verbs across language families:",
        "family_text": "• **Simple Sentence Structures:** Focus on Subject + Verb + Object.\n• **Auxiliaries & Modals:** Use 'can', 'must', and 'be going to' for simple daily intentions.\n• **Conjugations:** Check full present, past, and future tense tables on [COSYtools](https://cosylanguages.github.io/COSYtools/).",
        "practice_text": "📌 Test your skills in [COSYpractice](https://cosylanguages.github.io/COSYpractice/), read [Part 1](top-10-verbs-en.html) and [Part 2](top-10-verbs-part-2-en.html), and consult full verb conjugations on [COSYtools](https://cosylanguages.github.io/COSYtools/).",
        "p1_items": [
            "**1. To Be (am / is / are):** Identity, states, age, and location.\n  • *Usage & Frames:* 'I am a student', 'He is at home', 'They are ready', 'I am 25 years old'.\n  • *Useful Phrases:* 'be on time', 'be quiet', 'be right'.",
            "**2. To Have (have / has):** Possession, relationships, and states.\n  • *Usage & Frames:* 'I have a car', 'She has a sister', 'I have a headache'.\n  • *Useful Phrases:* 'have breakfast', 'have a shower', 'have a good day'.",
            "**3. To Think:** Opinions and thoughts.\n  • *Usage & Frames:* 'I think so', 'What do you think?', 'I think it is good'.\n  • *Useful Phrases:* 'think twice', 'think about', 'think of'.",
            "**4. To Know:** Facts, familiarity, and skills.\n  • *Usage & Frames:* 'I know the answer', 'Do you know him?', 'I know how to drive'.\n  • *Useful Phrases:* 'let me know', 'as far as I know', 'you know'.",
            "**5. To Like:** Preferences and taste.\n  • *Usage & Frames:* 'I like coffee', 'She likes reading', 'Do you like sports?'.\n  • *Useful Phrases:* 'like very much', 'would like', 'look like'.",
            "**6. To Want / Would Like:** Desires and polite requests.\n  • *Usage & Frames:* 'I want water', 'I would like tea, please', 'Where do you want to go?'.\n  • *Useful Phrases:* 'want to learn', 'would like to order', 'if you want'.",
            "**7. To Go / Be Going To:** Movement and future intentions.\n  • *Usage & Frames:* 'I go to work', 'She goes home', 'We are going to eat'.\n  • *Useful Phrases:* 'go home', 'go shopping', 'go on foot', 'be going to eat'.",
            "**8. To Can (Modal):** Ability and permission.\n  • *Usage & Frames:* 'I can speak English', 'Can you help me?', 'You can sit here'.\n  • *Useful Phrases:* 'can I have...', 'as fast as I can', 'can do'.",
            "**9. To Eat:** Food and meals.\n  • *Usage & Frames:* 'I eat fruit', 'What do you want to eat?', 'Let's eat out'.\n  • *Useful Phrases:* 'eat healthy', 'eat out', 'something to eat'.",
            "**10. To Drink:** Beverages and hydration.\n  • *Usage & Frames:* 'I drink water', 'Would you like to drink?', 'He drinks coffee'.\n  • *Useful Phrases:* 'drink water', 'a hot drink', 'something to drink'."
        ],
        "p2_items": [
            "**1. Do / Make:** Activities, tasks and creation.\n  • *Usage & Frames:* 'I do my homework' vs 'I make breakfast'.\n  • *Useful Phrases:* 'do business', 'do research' | 'make progress', 'make a mistake'.",
            "**2. Speak / Talk / Say / Tell:** Communication and speech.\n  • *Usage & Frames:* 'I speak English', 'Let's talk', 'Say hello', 'Tell me'.\n  • *Useful Phrases:* 'speak fluently', 'talk with', 'say yes', 'tell a story'.",
            "**3. Look / Watch / See:** Vision and attention.\n  • *Usage & Frames:* 'Look at this', 'Watch a movie', 'I see a bird'.\n  • *Useful Phrases:* 'look for', 'look forward to', 'watch out', 'see you soon'.",
            "**4. Listen / Hear:** Listening and perception.\n  • *Usage & Frames:* 'Listen to music', 'Did you hear that?'.\n  • *Useful Phrases:* 'listen carefully', 'hear from', 'glad to hear that'.",
            "**5. Must / Have To / Should:** Necessity, obligation and advice.\n  • *Usage & Frames:* 'I must study', 'We have to leave now', 'You should rest'.\n  • *Useful Phrases:* 'must be', 'have to go', 'you should try'.",
            "**6. Come / Leave:** Arrival and departure.\n  • *Usage & Frames:* 'Come here', 'He came home late', 'The train leaves at noon'.\n  • *Useful Phrases:* 'come in', 'come from', 'leave for', 'leave behind'.",
            "**7. Take / Give:** Exchange and transfer.\n  • *Usage & Frames:* 'Take a coat', 'Give me a hand'.\n  • *Useful Phrases:* 'take care', 'take time', 'give up', 'give a hand'.",
            "**8. Ask / Answer:** Questions and replies.\n  • *Usage & Frames:* 'Ask a question', 'Answer the phone'.\n  • *Useful Phrases:* 'ask for help', 'answer questions', 'ask a favour'.",
            "**9. Wait:** Patience and time.\n  • *Usage & Frames:* 'Wait for the bus', 'Can you wait a minute?'.\n  • *Useful Phrases:* 'wait for', 'wait in line', 'can't wait'.",
            "**10. Live:** Residence and lifestyle.\n  • *Usage & Frames:* 'I live in London', 'She lives with her family'.\n  • *Useful Phrases:* 'live abroad', 'live well', 'live together'."
        ]
    },
    "fr": {
        "name": "French",
        "p1_title": "Les 10 verbes essentiels en français pour débutants (A0–A1 / A2)",
        "p2_title": "Les 10 verbes essentiels en français, Partie 2 (A0–A1 / A2)",
        "p1_kicker": "GUIDE DU FRANÇAIS — PARTIE 1 SUR 2",
        "p2_kicker": "GUIDE DU FRANÇAIS — PARTIE 2 SUR 2",
        "p1_dek": "Apprenez les 10 premiers verbes fondamentaux en français (être, avoir, penser, savoir/connaître, aimer, vouloir/aimerait, travailler/étudier/apprendre, aller/futur proche, pouvoir, manger/boire). Conjugaisons consultables sur COSYtools.",
        "p2_dek": "Découvrez les 10 verbes fondamentaux de la Partie 2 : faire, parler/dire, regarder/voir, écouter/entendre, devoir/falloir, venir/partir, prendre/donner, demander/répondre, attendre et vivre/habiter. Conjugaisons consultables sur COSYtools.",
        "p1_intro": "Bienvenue dans la Partie 1 de notre série en 2 parties sur les verbes essentiels en français pour les niveaux A0–A1 et A2 ! Ce guide présente des phrases simples adaptées à l'apprentissage pratique. (Consultez aussi la [Partie 2](top-10-verbs-part-2-fr.html)). Les tableaux complets de conjugaison sont consultables sur [COSYtools](https://cosylanguages.github.io/COSYtools/).",
        "p2_intro": "Bienvenue dans la Partie 2 de notre série sur les verbes français pour débutants A0–A1 et A2 ! (Relisez la [Partie 1](top-10-verbs-fr.html) si besoin). Nous étudions ici 10 nouveaux verbes clés du quotidien. Retrouvez tous les tableaux de conjugaison sur [COSYtools](https://cosylanguages.github.io/COSYtools/).",
        "h_breakdown_p1": "Les 10 verbes fondamentaux (Partie 1)",
        "h_breakdown_p2": "Les 10 verbes fondamentaux (Partie 2)",
        "h_matrix": "Tableau comparatif des verbes",
        "h_family": "Structures grammaticales adaptées (A0–A1 / A2)",
        "h_practice": "Pratique et conjugaison",
        "matrix_intro": "Comparaison des verbes essentiels selon les familles linguistiques :",
        "family_text": "• **Structures simples :** Sujet + Verbe + Complément.\n• **Futur proche et modaux :** Utilisation de 'aller + infinitif' et 'pouvoir/devoir'.\n• **Conjugaisons :** Tous les temps et formes sont consultables sur [COSYtools](https://cosylanguages.github.io/COSYtools/).",
        "practice_text": "📌 Pratiquez vos connaissances sur [COSYpractice](https://cosylanguages.github.io/COSYpractice/), lisez la [Partie 1](top-10-verbs-fr.html) et la [Partie 2](top-10-verbs-part-2-fr.html), et consultez les conjugaisons sur [COSYtools](https://cosylanguages.github.io/COSYtools/).",
        "p1_items": [
            "**1. Être:** Identité, état et lieu.\n  • *Phrases simples:* 'Je suis étudiant', 'Il est à la maison', 'Nous sommes prêts'.\n  • *Expressions:* 'être à l'heure', 'être d'accord', 'être en forme'.",
            "**2. Avoir:** Possession, âge et sensations.\n  • *Phrases simples:* 'J'ai une voiture', 'J'ai 25 ans', 'J'ai faim'.\n  • *Expressions:* 'avoir besoin de', 'avoir envie de', 'avoir peur'.",
            "**3. Penser:** Opinion et réflexion.\n  • *Phrases simples:* 'Je pense que oui', 'Qu'en penses-tu ?', 'Je pense à toi'.\n  • *Expressions:* 'penser à', 'penser de', 'bien penser'.",
            "**4. Savoir / Connaître:** Faits, compétences et lieux/personnes.\n  • *Phrases simples:* 'Je sais parler français', 'Je connais cette ville'.\n  • *Expressions:* 'savoir faire', 'faire savoir', 'connaître du monde'.",
            "**5. Aimer:** Goûts et préférences.\n  • *Phrases simples:* 'J'aime le café', 'J'aime voyager', 'Il aime le sport'.\n  • *Expressions:* 'aimer bien', 'aimer beaucoup', 'j'aimerais'.",
            "**6. Vouloir / Voudrais:** Souhaits et politesse.\n  • *Phrases simples:* 'Je veux de l'eau', 'Je voudrais réserver une table'.\n  • *Expressions:* 'vouloir dire', 'si vous voulez', 'je voudrais bien'.",
            "**7. Aller / Futur proche:** Déplacement et futur immédiat.\n  • *Phrases simples:* 'Je vais au travail', 'Elle va à Paris', 'Nous allons manger'.\n  • *Expressions:* 'comment ça va ?', 'y aller', 'aller à pied'.",
            "**8. Pouvoir:** Capacité et permission.\n  • *Phrases simples:* 'Je peux vous aider ?', 'Tu peux venir ?'.\n  • *Expressions:* 'pouvoir faire', 'si possible', 'comme vous pouvez'.",
            "**9. Manger:** Alimentation et repas.\n  • *Phrases simples:* 'Je mange une pomme', 'Qu'est-ce qu'on mange ?'.\n  • *Expressions:* 'bon appétit', 'donner à manger', 'manger équilibré'.",
            "**10. Boire:** Boissons et hydratation.\n  • *Phrases simples:* 'Je bois du thé', 'Voulez-vous boire quelque chose ?'.\n  • *Expressions:* 'avoir à boire', 'boire un coup', 'boire du café'."
        ],
        "p2_items": [
            "**1. Faire:** Activités quotidiennes et création.\n  • *Phrases simples:* 'Faire du sport', 'Faire la cuisine', 'Faire les courses'.\n  • *Expressions:* 'faire attention', 'faire plaisir', 'faire du bien'.",
            "**2. Parler / Dire:** Communication orale et parole.\n  • *Phrases simples:* 'Parler français', 'Dire la vérité', 'Dis-moi'.\n  • *Expressions:* 'parler de', 'dire bonjour', 'pour ainsi dire'.",
            "**3. Regarder / Voir:** Perception visuelle active et passive.\n  • *Phrases simples:* 'Regarder un film', 'Je vois un oiseau'.\n  • *Expressions:* 'regarder la télé', 'voyons voir', 'à voir'.",
            "**4. Écouter / Entendre:** Perception auditive.\n  • *Phrases simples:* 'Écouter de la musique', 'J'entends du bruit'.\n  • *Expressions:* 'écouter attentivement', 'entendre parler de'.",
            "**5. Devoir / Falloir:** Obligation et conseil (devrait).\n  • *Phrases simples:* 'Je dois étudier', 'Il faut partir', 'Tu devrais te reposer'.\n  • *Expressions:* 'devoir faire', 'comme il faut', 'il faut absolument'.",
            "**6. Venir / Partir:** Mouvement, arrivée et départ.\n  • *Phrases simples:* 'Je viens demain', 'Le train part à huit heures'.\n  • *Expressions:* 'venir de', 'partir en vacances', 'quitter la maison'.",
            "**7. Prendre / Donner:** Échanges et transmission.\n  • *Phrases simples:* 'Prendre le bus', 'Donner un cadeau'.\n  • *Expressions:* 'prendre soin', 'donner rendez-vous', 'prendre son temps'.",
            "**8. Demander / Répondre:** Questions et réponses.\n  • *Phrases simples:* 'Demander un service', 'Répondre au téléphone'.\n  • *Expressions:* 'demander de l'aide', 'répondre vite', 'poser une question'.",
            "**9. Attendre:** Attente et patience.\n  • *Phrases simples:* 'Attendre le bus', 'Attendez une minute'.\n  • *Expressions:* 'attendre avec impatience', 'en attendant'.",
            "**10. Vivre / Habiter:** Résidence et mode de vie.\n  • *Phrases simples:* 'J'habite à Paris', 'Vivre en paix'.\n  • *Expressions:* 'vivre à l'étranger', 'habiter près d'ici'."
        ]
    },
    "it": {
        "name": "Italian",
        "p1_title": "I 10 verbi essenziali in italiano per principianti (A0–A1 / A2)",
        "p2_title": "I 10 verbi essenziali in italiano, Parte 2 (A0–A1 / A2)",
        "p1_kicker": "GUIDA ALL'ITALIANO — PARTE 1 DI 2",
        "p2_kicker": "GUIDA ALL'ITALIANO — PARTE 2 DI 2",
        "p1_dek": "Impara i primi 10 verbi fondamentali della lingua italiana (essere, avere, pensare, sapere/conoscere, piacere, volere/vorrei, lavorare/studiare/imparare, andare, potere, mangiare/bere). Coniugazioni consultabili su COSYtools.",
        "p2_dek": "Scopri i 10 verbi essenziali della Parte 2: fare, parlare/dire, guardare/vedere, ascoltare/sentire, dovere/bisognare, venire/partire, prendere/dare, chiedere/rispondere, aspettare e vivere/abitare. Coniugazioni consultabili su COSYtools.",
        "p1_intro": "Benvenuti alla Parte 1 della nostra guida in 2 parti sui verbi essenziali in italiano per studenti di livello A0–A1 e A2! Impara frasi utili ed espressioni pratiche per comunicare ogni giorno. (Vedi anche la [Parte 2](top-10-verbs-part-2-it.html)). Le tabelle di coniugazione complete sono consultabili su [COSYtools](https://cosylanguages.github.io/COSYtools/).",
        "p2_intro": "Benvenuti alla Parte 2 della nostra guida ai verbi italiani per principianti A0–A1 e A2! (Leggi la [Parte 1](top-10-verbs-it.html) se te la sei persa). Analizziamo 10 nuovi verbi quotidiani. Tutte le tabelle di coniugazione sono consultabili su [COSYtools](https://cosylanguages.github.io/COSYtools/).",
        "h_breakdown_p1": "I 10 verbi principali (Parte 1)",
        "h_breakdown_p2": "I 10 verbi principali (Parte 2)",
        "h_matrix": "Tabella comparativa dei verbi",
        "h_family": "Strutture grammaticali per principianti (A0–A1 / A2)",
        "h_practice": "Pratica e coniugazione",
        "matrix_intro": "Confronto dei verbi essenziali nelle famiglie linguistiche:",
        "family_text": "• **Frasi semplici:** Soggetto + Verbo + Oggetto.\n• **Modali e tempo futuro:** Uso di 'andare', 'stare per' e 'potere/dovere'.\n• **Coniugazioni verbali:** Consulta le tabelle dei tempi verbali su [COSYtools](https://cosylanguages.github.io/COSYtools/).",
        "practice_text": "📌 Esercitati su [COSYpractice](https://cosylanguages.github.io/COSYpractice/), leggi la [Parte 1](top-10-verbs-it.html) e la [Parte 2](top-10-verbs-part-2-it.html), e consulta le coniugazioni dei verbi su [COSYtools](https://cosylanguages.github.io/COSYtools/).",
        "p1_items": [
            "**1. Essere:** Identità, stato e luogo.\n  • *Frasi semplici:* 'Sono uno studente', 'Lui è a casa', 'Siamo pronti'.\n  • *Frasi utili:* 'essere in orario', 'essere d'accordo', 'essere felice'.",
            "**2. Avere:** Possesso, età e sensazioni.\n  • *Frasi semplici:* 'Ho una macchina', 'Ho 25 anni', 'Ho fame'.\n  • *Frasi utili:* 'avere bisogno di', 'avere voglia di', 'avere fretta'.",
            "**3. Pensare:** Opinioni e pensieri.\n  • *Frasi semplici:* 'Penso di sì', 'Che cosa ne pensi?', 'Penso a te'.\n  • *Frasi utili:* 'pensare a', 'pensarci sopra', 'pensare bene'.",
            "**4. Sapere / Conoscere:** Fatti, abilità e persone.\n  • *Frasi semplici:* 'So parlare italiano', 'Conosco questa città'.\n  • *Frasi utili:* 'fai sapere', 'per quanto ne so', 'conoscere gente'.",
            "**5. Piacere:** Preferenze e gusti.\n  • *Frasi semplici:* 'Mi piace il caffè', 'Mi piace viaggiare'.\n  • *Frasi utili:* 'mi piace molto', 'mi piacerebbe', 'ti piace?'.",
            "**6. Volere / Vorrei:** Desideri e cortesia.\n  • *Frasi semplici:* 'Voglio un bicchiere d'acqua', 'Vorrei prenotare un tavolo'.\n  • *Frasi utili:* 'vorrei un caffè', 'se vuoi', 'voler dire'.",
            "**7. Andare / Stare per:** Movimento e intenzioni.\n  • *Frasi semplici:* 'Vado al lavoro', 'Lei va a Roma', 'Stiamo per mangiare'.\n  • *Frasi utili:* 'come va?', 'andare a piedi', 'andare in vacanza'.",
            "**8. Potere:** Capacità e permesso.\n  • *Frasi semplici:* 'Posso aiutarti?', 'Puoi venire?'.\n  • *Frasi utili:* 'se possibile', 'può darsi', 'fai come puoi'.",
            "**9. Mangiare:** Pasti e cibo.\n  • *Frasi semplici:* 'Mangio una mela', 'Cosa mangiamo stasera?'.\n  • *Frasi utili:* 'buon appetito', 'dare da mangiare', 'mangiare sano'.",
            "**10. Bere:** Bevande.\n  • *Frasi semplici:* 'Bevo un tè', 'Vuoi qualcosa da bere?'.\n  • *Frasi utili:* 'qualcosa da bere', 'bere un caffè', 'bere alla salute'."
        ],
        "p2_items": [
            "**1. Fare:** Attività quotidiane.\n  • *Frasi semplici:* 'Fare la spesa', 'Fare colazione', 'Fare i compiti'.\n  • *Frasi utili:* 'fare attenzione', 'fare piacere', 'fare bella figura'.",
            "**2. Parlare / Dire:** Comunicazione.\n  • *Frasi semplici:* 'Parlare italiano', 'Dire la verità', 'Dimmi'.\n  • *Frasi utili:* 'parlare di', 'dire di sì', 'per così dire'.",
            "**3. Guardare / Vedere:** Percezione visiva.\n  • *Frasi semplici:* 'Guardare un film', 'Vedo un uccello'.\n  • *Frasi utili:* 'guardare la TV', 'stare a vedere', 'ci vediamo'.",
            "**4. Ascoltare / Sentire:** Percezione uditiva.\n  • *Frasi semplici:* 'Ascoltare musica', 'Sento un rumore'.\n  • *Frasi utili:* 'ascolta con attenzione', 'sentire parlare di'.",
            "**5. Dovere / Bisognare:** Obbligo e consiglio.\n  • *Frasi semplici:* 'Devo studiare', 'Bisogna partire ora', 'Dovresti riposare'.\n  • *Frasi utili:* 'dovere fare', 'come si deve', 'bisogna stare attenti'.",
            "**6. Venire / Partire:** Movimento, arrivo e partenza.\n  • *Frasi semplici:* 'Vieni con noi?', 'Il treno parte alle otto'.\n  • *Frasi utili:* 'venire da', 'partire per', 'lasciare la stanza'.",
            "**7. Prendere / Dare:** Scambi e trasferimenti.\n  • *Frasi semplici:* 'Prendere il treno', 'Dare un regalo'.\n  • *Frasi utili:* 'prendersi cura', 'dare un passaggio', 'prendere un caffè'.",
            "**8. Chiedere / Rispondere:** Domande e risposte.\n  • *Frasi semplici:* 'Chiedere un'informazione', 'Rispondere al telefono'.\n  • *Frasi utili:* 'chiedere aiuto', 'rispondere subito'.",
            "**9. Aspettare:** Attesa e pazienza.\n  • *Frasi semplici:* 'Aspettare l'autobus', 'Aspetta un momento'.\n  • *Frasi utili:* 'non vedere l'ora', 'aspettare in fila'.",
            "**10. Vivere / Abitare:** Residenza e casa.\n  • *Frasi semplici:* 'Abito a Milano', 'Vivere in pace'.\n  • *Frasi utili:* 'vivere all'estero', 'abitare vicino'."
        ]
    },
    "es": {
        "name": "Spanish",
        "p1_title": "Los 10 verbos esenciales en español para principiantes (A0–A1 / A2)",
        "p2_title": "Los 10 verbos esenciales en español, Parte 2 (A0–A1 / A2)",
        "p1_kicker": "GUÍA DE ESPAÑOL — PARTE 1 DE 2",
        "p2_kicker": "GUÍA DE ESPAÑOL — PARTE 2 DE 2",
        "p1_dek": "Aprende los primeros 10 verbos fundamentales en español (ser/estar, tener, pensar, saber/conocer, gustar, querer/quisiera, trabajar/estudiar/aprender, ir/ir a, poder, comer/beber). Conjugaciones consultables en COSYtools.",
        "p2_dek": "Descubre los siguientes 10 verbos clave (hacer, hablar/decir, mirar/ver, escuchar/oír, tener que/deber/debería, venir/salir, tomar/dar, preguntar/responder, esperar, vivir). Conjugaciones consultables en COSYtools.",
        "p1_intro": "¡Bienvenidos a la Parte 1 de nuestra guía en 2 partes sobre verbos esenciales en español para estudiantes de nivel A0–A1 y A2! Aprende estructuras sencillas y expresiones útiles. (Consulta también la [Parte 2](top-10-verbs-part-2-es.html)). Las tablas de conjugación completas se pueden consultar en [COSYtools](https://cosylanguages.github.io/COSYtools/).",
        "p2_intro": "¡Bienvenidos a la Parte 2 de nuestra guía de verbos en español para principiantes A0–A1 y A2! (Lee la [Parte 1](top-10-verbs-es.html) si aún no la has visto). Aquí estudiamos 10 nuevos verbos esenciales. Todas las tablas de conjugación se pueden consultar en [COSYtools](https://cosylanguages.github.io/COSYtools/).",
        "h_breakdown_p1": "Los 10 verbos fundamentales (Parte 1)",
        "h_breakdown_p2": "Los 10 verbos fundamentales (Parte 2)",
        "h_matrix": "Tabla comparativa de verbos",
        "h_family": "Estructuras gramaticales para nivel A0–A1 / A2",
        "h_practice": "Práctica y conjugación",
        "matrix_intro": "Comparación de los verbos esenciales en las familias lingüísticas:",
        "family_text": "• **Oraciones simples:** Sujeto + Verbo + Complemento.\n• **Futuro próximo y modales:** Uso de 'ir a + infinitivo' y 'poder/tener que'.\n• **Conjugaciones:** Consulta las tablas de tiempos verbales en [COSYtools](https://cosylanguages.github.io/COSYtools/).",
        "practice_text": "📌 Practica en [COSYpractice](https://cosylanguages.github.io/COSYpractice/), lee la [Parte 1](top-10-verbs-es.html) y la [Parte 2](top-10-verbs-part-2-es.html), y consulta las conjugaciones de los verbos en [COSYtools](https://cosylanguages.github.io/COSYtools/).",
        "p1_items": [
            "**1. Ser / Estar:** Identidad, estados y ubicación.\n  • *Frases sencillas:* 'Soy estudiante', 'Estoy en casa', 'Estamos listos'.\n  • *Frases útiles:* 'estar a tiempo', 'estar de acuerdo', 'estar bien'.",
            "**2. Tener:** Posesión, edad y estados físicos.\n  • *Frases sencillas:* 'Tengo un coche', 'Tengo 25 años', 'Tengo hambre'.\n  • *Frases útiles:* 'tener que', 'tener ganas de', 'tener prisa'.",
            "**3. Pensar:** Opiniones y pensamientos.\n  • *Frases sencillas:* 'Pienso que sí', '¿Qué piensas de esto?', 'Pienso en ti'.\n  • *Frases útiles:* 'pensar en', 'pensarlo bien', 'pensar que'.",
            "**4. Saber / Conocer:** Información, habilidades y lugares/personas.\n  • *Frases sencillas:* 'Sé hablar español', 'Conozco esta ciudad'.\n  • *Frases útiles:* 'dar a conocer', 'que yo sepa', 'conocer gente'.",
            "**5. Gustar:** Preferencias y gustos.\n  • *Frases sencillas:* 'Me gusta el café', 'Me gusta viajar', 'Le gusta el deporte'.\n  • *Frases útiles:* 'me gusta mucho', 'me gustaría', '¿te gusta?'.",
            "**6. Querer / Me gustaría:** Deseos y cortesía.\n  • *Frases sencillas:* 'Quiero agua', 'Me gustaría reservar una mesa'.\n  • *Frases útiles:* 'querer decir', 'si quieres', 'me gustaría pedir'.",
            "**7. Ir / Ir a + Infinitivo:** Movimiento e intenciones futuras.\n  • *Frases sencillas:* 'Voy al trabajo', 'Ella va a Madrid', 'Vamos a comer'.\n  • *Frases útiles:* '¿cómo te va?', 'ir a pie', 'ir de compras'.",
            "**8. Poder:** Capacidad y permiso.\n  • *Frases sencillas:* '¿Puedo ayudarte?', '¿Puedes venir?'.\n  • *Frases útiles:* 'si se puede', 'se puede pasar', 'lo antes posible'.",
            "**9. Comer:** Alimentación y comidas.\n  • *Frases sencillas:* 'Como una manzana', '¿Qué vamos a comer?'.\n  • *Frases útiles:* 'buen provecho', 'dar de comer', 'comer sano'.",
            "**10. Beber:** Bebidas e hidratación.\n  • *Frases sencillas:* 'Bebo té', '¿Quieres algo de beber?'.\n  • *Frases útiles:* 'algo de beber', 'tomar un trago', 'beber café'."
        ],
        "p2_items": [
            "**1. Hacer:** Actividades cotidianas y creación.\n  • *Frases sencillas:* 'Hacer los deberes', 'Hacer el desayuno', 'Hacer ejercicio'.\n  • *Frases útiles:* 'hacer falta', 'hacer el favor', 'hacer fotos'.",
            "**2. Hablar / Decir:** Comunicación y palabra.\n  • *Frases sencillas:* 'Hablar español', 'Decir la verdad', 'Dime'.\n  • *Frases útiles:* 'hablar de', 'decir que sí', 'por decir algo'.",
            "**3. Mirar / Ver:** Percepción visual y atención.\n  • *Frases sencillas:* 'Mirar una película', 'Veo un pájaro'.\n  • *Frases útiles:* 'mirar la televisión', 'a ver', 'nos vemos'.",
            "**4. Escuchar / Oír:** Percepción auditiva activa y pasiva.\n  • *Frases sencillas:* 'Escuchar música', 'Oigo un ruido'.\n  • *Frases útiles:* 'escuchar con atención', 'oír hablar de'.",
            "**5. Tener que / Deber:** Obligación, necesidad y consejo (debería).\n  • *Frases sencillas:* 'Tengo que estudiar', 'Debemos salir ya', 'Deberías descansar'.\n  • *Frases útiles:* 'tener que hacer', 'debería ser', 'hay que'.",
            "**6. Venir / Salir (Irse):** Llegada y partida.\n  • *Frases sencillas:* '¿Vienes conmigo?', 'El tren sale a las ocho', 'Salir de casa'.\n  • *Frases útiles:* 'venir de', 'salir bien', 'irse de viaje'.",
            "**7. Tomar / Dar:** Intercambios y transporte.\n  • *Frases sencillas:* 'Tomar el autobús', 'Dar un regalo'.\n  • *Frases útiles:* 'darse prisa', 'dar la mano', 'tomar un café'.",
            "**8. Preguntar / Responder:** Preguntas y respuestas.\n  • *Frases sencillas:* 'Hacer una pregunta', 'Responder al teléfono'.\n  • *Frases útiles:* 'pedir ayuda', 'responder rápido', 'preguntar por'.",
            "**9. Esperar:** Espera y paciencia.\n  • *Frases sencillas:* 'Esperar el autobús', 'Espere un momento'.\n  • *Frases útiles:* 'esperar que', 'hacer cola', 'no ver la hora'.",
            "**10. Vivir:** Residencia y estilo de vida.\n  • *Frases sencillas:* 'Vivo en Madrid', 'Vivir bien'.\n  • *Frases útiles:* 'vivir en el extranjero', 'vivir juntos', 'vivir cerca'."
        ]
    },
    "de": {
        "name": "German",
        "p1_title": "Die 10 wichtigsten Verben im Deutschen für Anfänger (A0–A1 / A2)",
        "p2_title": "Die 10 wichtigsten Verben im Deutschen, Teil 2 (A0–A1 / A2)",
        "p1_kicker": "DEUTSCHER VERBEN-LEITFADEN — TEIL 1 VON 2",
        "p2_kicker": "DEUTSCHER VERBEN-LEITFADEN — TEIL 2 VON 2",
        "p1_dek": "Lernen Sie die ersten 10 Grundverben im Deutschen (sein, haben, denken, wissen/kennen, mögen/gefallen, wollen/möchte, arbeiten/studieren/lernen, gehen, können, essen/trinken). Konjugationstabellen sind auf COSYtools abrufbar.",
        "p2_dek": "Entdecken Sie die nächsten 10 wichtigen Verben (machen/tun, sprechen/sagen, schauen/sehen, hören, müssen/sollen, kommen/verlassen, nehmen/geben, fragen/antworten, warten, wohnen/leben). Konjugationstabellen auf COSYtools.",
        "p1_intro": "Willkommen zu Teil 1 unseres 2-teiligen Verben-Leitfadens für Deutschlernende der Niveaus A0–A1 und A2! Hier finden Sie einfache Beispielsätze und nützliche Phrasen. (Lesen Sie auch [Teil 2](top-10-verbs-part-2-de.html)). Die vollständigen Konjugationstabellen aller Verben sind auf [COSYtools](https://cosylanguages.github.io/COSYtools/) einsehbar.",
        "p2_intro": "Willkommen zu Teil 2 unseres Verben-Leitfadens für Deutschlernende (A0–A1 / A2)! (Falls Sie [Teil 1](top-10-verbs-de.html) verpasst haben, lesen Sie diesen zuerst). Hier behandeln wir 10 weitere Alltagsverben. Alle Konjugationstabellen finden Sie auf [COSYtools](https://cosylanguages.github.io/COSYtools/).",
        "h_breakdown_p1": "Die 10 Grundverben (Teil 1)",
        "h_breakdown_p2": "Die 10 Grundverben (Teil 2)",
        "h_matrix": "Sprachenvergleichstabelle",
        "h_family": "Grammatikstrukturen für Anfänger (A0–A1 / A2)",
        "h_practice": "Übungen und Konjugation",
        "matrix_intro": "Vergleich der wichtigsten Verben in verschiedenen Sprachfamilien:",
        "family_text": "• **Einfache Satzstrukturen:** Subjekt + Verb + Objekt.\n• **Modalverben & Zukunft:** Nutzung von 'können', 'müssen' und 'werden/gehen'.\n• **Verbformen & Konjugation:** Alle Zeitformen sind auf [COSYtools](https://cosylanguages.github.io/COSYtools/) abrufbar.",
        "practice_text": "📌 Üben Sie auf [COSYpractice](https://cosylanguages.github.io/COSYpractice/), lesen Sie [Teil 1](top-10-verbs-de.html) sowie [Teil 2](top-10-verbs-part-2-de.html), und schlagen Sie die Konjugationen auf [COSYtools](https://cosylanguages.github.io/COSYtools/) nach.",
        "p1_items": [
            "**1. Sein:** Identität, Zustand und Ort.\n  • *Einfache Sätze:* 'Ich bin Student', 'Er ist zu Hause', 'Wir sind fertig'.\n  • *Phrasen:* 'pünktlich sein', 'einverstanden sein', 'bereit sein'.",
            "**2. Haben:** Besitz, Alter und Zustände.\n  • *Einfache Sätze:* 'Ich habe ein Auto', 'Sie hat eine Schwester', 'Ich habe Hunger'.\n  • *Phrasen:* 'Hunger/Durst haben', 'Zeit haben', 'Glück haben'.",
            "**3. Denken:** Meinungen und Gedanken.\n  • *Einfache Sätze:* 'Ich denke schon', 'Was denkst du darüber?', 'Ich denke an dich'.\n  • *Phrasen:* 'denken an', 'nachdenken', 'meiner Meinung nach'.",
            "**4. Wissen / Kennen:** Faktenwissen vs. Personen/Orte.\n  • *Einfache Sätze:* 'Ich weiß die Antwort', 'Ich kenne diese Stadt'.\n  • *Phrasen:* 'Bescheid wissen', 'kennenlernen', 'soweit ich weiß'.",
            "**5. Mögen / Gefallen:** Vorlieben und Geschmack.\n  • *Einfache Sätze:* 'Ich mag Kaffee', 'Das Buch gefällt mir'.\n  • *Phrasen:* 'sehr mögen', 'Gefallen finden', 'wie du magst'.",
            "**6. Wollen / Ich möchte:** Wünsche und Höflichkeit.\n  • *Einfache Sätze:* 'Ich will Wasser trinken', 'Ich möchte einen Kaffee bitte'.\n  • *Phrasen:* 'möchte bestellen', 'wenn du willst', 'willkommen'.",
            "**7. Gehen / Werden:** Bewegung und Zukunftsvorhaben.\n  • *Einfache Sätze:* 'Ich gehe zur Arbeit', 'Sie geht nach Hause', 'Wir werden essen'.\n  • *Phrasen:* 'Wie geht's?', 'zu Fuß gehen', 'einkaufen gehen'.",
            "**8. Können:** Fähigkeit und Erlaubnis.\n  • *Einfache Sätze:* 'Ich kann Deutsch sprechen', 'Kannst du mir helfen?'.\n  • *Phrasen:* 'kann sein', 'so gut ich kann', 'was kann ich tun?'.",
            "**9. Essen:** Mahlzeiten und Nahrung.\n  • *Einfache Sätze:* 'Ich esse einen Apfel', 'Was wollen wir essen?'.\n  • *Phrasen:* 'Guten Appetit!', 'gesund essen', 'etwas zu essen'.",
            "**10. Trinken:** Getränke.\n  • *Einfache Sätze:* 'Ich trinke Tee', 'Möchten Sie etwas trinken?'.\n  • *Phrasen:* 'etwas zu trinken', 'Kaffee trinken', 'Prost!'."
        ],
        "p2_items": [
            "**1. Machen / Tun:** Aktivitäten und Handlung.\n  • *Einfache Sätze:* 'Hausaufgaben machen', 'Was tust du?'.\n  • *Phrasen:* 'Freude machen', 'Sinn machen', 'Nichts zu tun'.",
            "**2. Sprechen / Sagen:** Kommunikation und Sprechen.\n  • *Einfache Sätze:* 'Deutsch sprechen', 'Die Wahrheit sagen', 'Sag mir Bescheid'.\n  • *Phrasen:* 'sprechen über', 'Hallo sagen', 'sozusagen'.",
            "**3. Schauen / Sehen:** Wahrnehmung und Aufmerksamkeit.\n  • *Einfache Sätze:* 'Fernsehen schauen', 'Ich sehe einen Vogel'.\n  • *Phrasen:* 'Schau mal!', 'Ausschau halten', 'Bis später!'.",
            "**4. Hören:** Akustische Wahrnehmung und Zuhören.\n  • *Einfache Sätze:* 'Musik hören', 'Ich höre ein Geräusch'.\n  • *Phrasen:* 'zuhören', 'von jemandem hören'.",
            "**5. Müssen / Sollen:** Notwendigkeit, Pflicht und Empfehlung.\n  • *Einfache Sätze:* 'Ich muss lernen', 'Du sollst schlafen', 'Wir sollten gehen'.\n  • *Phrasen:* 'muss sein', 'soll ich helfen?', 'keine Pflicht'.",
            "**6. Kommen / Verlassen (Abfahren):** Ankunft und Abfahrt.\n  • *Einfache Sätze:* 'Kommst du mit?', 'Der Zug fährt um 8 ab', 'Das Haus verlassen'.\n  • *Phrasen:* 'hereinkommen', 'nach Hause kommen', 'losfahren'.",
            "**7. Nehmen / Geben:** Austausch und Übergabe.\n  • *Einfache Sätze:* 'Den Bus nehmen', 'Ein Geschenk geben'.\n  • *Phrasen:* 'Rücksicht nehmen', 'Acht geben', 'Platz nehmen'.",
            "**8. Fragen / Antworten:** Fragen und Antworten.\n  • *Einfache Sätze:* 'Eine Frage stellen', 'Auf die E-Mail antworten'.\n  • *Phrasen:* 'um Hilfe fragen', 'schnell antworten', 'eine Antwort geben'.",
            "**9. Warten:** Geduld und Zeit.\n  • *Einfache Sätze:* 'Auf den Bus warten', 'Warten Sie einen Moment'.\n  • *Phrasen:* 'warten auf', 'in der Schlange stehen', 'kaum erwarten können'.",
            "**10. Wohnen / Leben:** Wohnort und Lebensweise.\n  • *Einfache Sätze:* 'Ich wohne in Berlin', 'Gut leben'.\n  • *Phrasen:* 'im Ausland leben', 'zusammenwohnen', 'nahe wohnen'."
        ]
    },
    "ru": {
        "name": "Russian",
        "p1_title": "Топ-10 главных глаголов русского языка для начинающих (A0–A1 / A2)",
        "p2_title": "Топ-10 главных глаголов русского языка, Часть 2 (A0–A1 / A2)",
        "p1_kicker": "ГИД ПО РУССКОМУ ЯЗЫКУ — ЧАСТЬ 1 ИЗ 2",
        "p2_kicker": "ГИД ПО РУССКОМУ ЯЗЫКУ — ЧАСТЬ 2 ИЗ 2",
        "p1_dek": "Освойте первые 10 базовых глаголов русского языка (быть, иметь/у меня есть, думать, знать, нравиться, хотеть, работать/учиться/изучать, идти/ехать, мочь, есть/пить). Таблицы спряжения доступны на COSYtools.",
        "p2_dek": "Изучите следующие 10 глаголов: делать, говорить/сказать, смотреть/видеть, слушать/слышать, должен/надо/следует, приходить/уходить, брать/давать, спрашивать/отвечать, ждать и жить. Таблицы спряжения на COSYtools.",
        "p1_intro": "Добро пожаловать в Часть 1 нашего 2-серийного руководства по глаголам русского языка для уровня A0–A1 и A2! Здесь приведены простые предложения и полезные фразы. (Смотрите также [Часть 2](top-10-verbs-part-2-ru.html)). Полные таблицы спряжения глаголов доступны на [COSYtools](https://cosylanguages.github.io/COSYtools/).",
        "p2_intro": "Добро пожаловать в Часть 2 руководства по глаголам русского языка для начинающих A0–A1 и A2! (Если вы не читали [Часть 1](top-10-verbs-ru.html), начните с неё). Мы разбираем 10 новых глаголов общения и действия. Таблицы спряжения смотрите на [COSYtools](https://cosylanguages.github.io/COSYtools/).",
        "h_breakdown_p1": "Первые 10 глаголов (Часть 1)",
        "h_breakdown_p2": "Следующие 10 глаголов (Часть 2)",
        "h_matrix": "Сравнительная таблица глаголов",
        "h_family": "Грамматика и структуры для уровня A0–A1 / A2",
        "h_practice": "Практика и спряжение",
        "matrix_intro": "Сравнение основных глаголов в разных языковых группах:",
        "family_text": "• **Простые структуры:** Подлежащее + Глагол + Дополнение.\n• **Выражение намерений:** Использование глаголов 'мочь', 'собираться' и конструкций с инфинитивом.\n• **Формы спряжения:** Полные формы настоящего, прошедшего и будущего времени смотрите на [COSYtools](https://cosylanguages.github.io/COSYtools/).",
        "practice_text": "📌 Тренируйтесь на [COSYpractice](https://cosylanguages.github.io/COSYpractice/), читайте [Часть 1](top-10-verbs-ru.html) и [Часть 2](top-10-verbs-part-2-ru.html), а таблицы спряжения смотрите на [COSYtools](https://cosylanguages.github.io/COSYtools/).",
        "p1_items": [
            "**1. Быть (есть / был / будет):** Личность, состояние и место.\n  • *Простые фразы:* 'Я студент', 'Он дома', 'Мы готовы'.\n  • *Фразы:* 'быть вовремя', 'быть согласным', 'быть готовым'.",
            "**2. Иметь / У меня есть:** Обладание и состояние.\n  • *Простые фразы:* 'У меня есть машина', 'У неё есть сестра', 'У меня болит голова'.\n  • *Фразы:* 'иметь значение', 'иметь в виду', 'у меня есть время'.",
            "**3. Думать:** Мнение и мысли.\n  • *Простые фразы:* 'Я думаю, да', 'Что ты думаешь?', 'Я думаю о тебе'.\n  • *Фразы:* 'думать о', 'подумать дважды', 'как ты думаешь?'.",
            "**4. Знать:** Факты, навыки и знакомство.\n  • *Простые фразы:* 'Я знаю ответ', 'Ты знаешь его?', 'Я знаю, как делать'.\n  • *Фразы:* 'дай мне знать', 'насколько я знаю', 'кто знает'.",
            "**5. Нравиться / Любить:** Предкусы и предпочтения.\n  • *Простые фразы:* 'Мне нравится кофе', 'Она любит читать'.\n  • *Фразы:* 'очень нравится', 'мне бы хотелось', 'как тебе нравится?'.",
            "**6. Хотеть / Хотел бы:** Желания и просьбы.\n  • *Простые фразы:* 'Я хочу воду', 'Я хотел бы чай, пожалуйста'.\n  • *Фразы:* 'хотеть пить', 'если хочешь', 'я хотел бы заказать'.",
            "**7. Идти / Ехать / Собираться:** Движение и планы.\n  • *Простые фразы:* 'Я иду на работу', 'Она едет домой', 'Мы собираемся обедать'.\n  • *Фразы:* 'идти пешком', 'как дела?', 'собираться делать'.",
            "**8. Мочь:** Способность и разрешение.\n  • *Простые фразы:* 'Я могу говорить по-русски', 'Можешь помочь мне?'.\n  • *Фразы:* 'может быть', 'как можно скорее', 'чем могу помочь?'.",
            "**9. Есть (кушать):** Приемы пищи.\n  • *Простые фразы:* 'Я ем фрукты', 'Что будем есть?'.\n  • *Фразы:* 'приятного аппетита', 'хотеть есть', 'поесть в ресторане'.",
            "**10. Пить:** Напитки.\n  • *Простые фразы:* 'Я пью чай', 'Хочешь выпить?'.\n  • *Фразы:* 'хотеть пить', 'горячий напиток', 'выпить кофе'."
        ],
        "p2_items": [
            "**1. Делать / Сделать:** Действия и результаты.\n  • *Простые фразы:* 'Делать работу', 'Сделать кофе'.\n  • *Фразы:* 'делать всё возможное', 'что делать?'.",
            "**2. Говорить / Сказать:** Общение.\n  • *Простые фразы:* 'Говорить по-русски', 'Сказать правду'.\n  • *Фразы:* 'говорить о', 'так сказать'.",
            "**3. Смотреть / Видеть:** Восприятие.\n  • *Простые фразы:* 'Смотреть фильм', 'Я вижу птицу'.\n  • *Фразы:* 'смотреть телевизор', 'посмотрим'.",
            "**4. Слушать / Слышать:** Слух.\n  • *Простые фразы:* 'Слушать музыку', 'Я слышу шум'.\n  • *Фразы:* 'слушай внимательно', 'рад слышать'.",
            "**5. Должен / Надо / Следует:** Обязанность и совет.\n  • *Простые фразы:* 'Я должен учиться', 'Надо идти', 'Следует отдохнуть'.\n  • *Фразы:* 'так должно быть', 'мне надо'.",
            "**6. Приходить / Уходить:** Движение и перемещение.\n  • *Простые фразы:* 'Приходить вовремя', 'Уходить с работы'.\n  • *Фразы:* 'прийти домой', 'уехать далеко'.",
            "**7. Брать / Давать:** Обмен.\n  • *Простые фразы:* 'Брать книгу', 'Давать совет'.\n  • *Фразы:* 'брать с собой', 'дать слово'.",
            "**8. Спрашивать / Отвечать:** Вопросы и ответы.\n  • *Простые фразы:* 'Спросить учителя', 'Ответить на письмо'.\n  • *Фразы:* 'задать вопрос', 'ответить быстро'.",
            "**9. Ждать:** Ожидание.\n  • *Простые фразы:* 'Ждать автобус', 'Подожди минуту'.\n  • *Фразы:* 'не могу дождаться', 'ждать в очереди'.",
            "**10. Жить:** Проживание.\n  • *Простые фразы:* 'Я живу в Москве', 'Жить хорошо'.\n  • *Фразы:* 'жить за границей', 'жить вместе'."
        ]
    },
    "el": {
        "name": "Greek",
        "p1_title": "Τα 10 Βασικά Ρήματα στην Ελληνική Γλώσσα για Αρχάριους (A0–A1 / A2)",
        "p2_title": "Τα 10 Βασικά Ρήματα στην Ελληνική Γλώσσα, Μέρος 2 (A0–A1 / A2)",
        "p1_kicker": "ΟΔΗΓΟΣ ΕΛΛΗΝΙΚΩΝ — ΜΕΡΟΣ 1 ΑΠΟ 2",
        "p2_kicker": "ΟΔΗΓΟΣ ΕΛΛΗΝΙΚΩΝ — ΜΕΡΟΣ 2 ΑΠΟ 2",
        "p1_dek": "Μάθετε τα πρώτα 10 βασικά ρήματα (είμαι, έχω, νομίζω/σκέφτομαι, ξέρω/γνωρίζω, μου αρέσει/αγαπώ, θέλω/θα ήθελα, δουλεύω/σπουδάζω/μαθαίνω, πηγαίνω/πάω, μπορώ, τρώω/πίνω). Πίνακες κλίσης στο COSYtools.",
        "p2_dek": "Ανακαλύψτε τα 10 βασικά ρήματα του Μέρους 2: κάνω/φτιάχνω, μιλώ/λέω, κοιτάζω/βλέπω, ακούω, πρέπει/θα έπρεπε, έρχομαι/φεύγω, παίρνω/δίνω, ρωτώ/απαντώ, περιμένω και ζω/μένω. Πίνακες κλίσης στο COSYtools.",
        "p1_intro": "Καλώς ήρθατε στο Μέρος 1 του οδηγού 2 μερών για τα βασικά ελληνικά ρήματα για το επίπεδο A0–A1 και A2! (Δείτε επίσης το [Μέρος 2](top-10-verbs-part-2-el.html)). Οι πλήρεις πίνακες κλίσης όλων των ρημάτων είναι διαθέσιμοι στο [COSYtools](https://cosylanguages.github.io/COSYtools/).",
        "p2_intro": "Καλώς ήρθατε στο Μέρος 2 του οδηγού ελληνικών ρημάτων για αρχάριους A0–A1 και A2! (Διαβάστε το [Μέρος 1](top-10-verbs-el.html) αν δεν το έχετε δει). Εξετάζουμε 10 νέα ρήματα. Όλοι οι πίνακες κλίσης είναι διαθέσιμοι στο [COSYtools](https://cosylanguages.github.io/COSYtools/).",
        "h_breakdown_p1": "Τα 10 Βασικά Ρήματα (Μέρος 1)",
        "h_breakdown_p2": "Τα 10 Βασικά Ρήματα (Μέρος 2)",
        "h_matrix": "Συγκριτικός Πίνακας Ρημάτων",
        "h_family": "Γραμματική & Δομή για Επίπεδο A0–A1 / A2",
        "h_practice": "Πρακτική & Κλίση Ρημάτων",
        "matrix_intro": "Σύγκριση βασικών ρημάτων μεταξύ γλωσσικών οικογενειών:",
        "family_text": "• **Απλές Προτάσεις:** Υποκείμενο + Ρήμα + Αντικείμενο.\n• **Εγκλίσεις & Χρόνοι:** Χρήση του 'μπορώ', 'πρέπει' και μελλοντικών τύπων.\n• **Πίνακες Κλίσης:** Δείτε όλους τους χρόνους στο [COSYtools](https://cosylanguages.github.io/COSYtools/).",
        "practice_text": "📌 Κάντε ασκήσεις στο [COSYpractice](https://cosylanguages.github.io/COSYpractice/), διαβάστε το [Μέρος 1](top-10-verbs-el.html) και το [Μέρος 2](top-10-verbs-part-2-el.html), και συμβουλευτείτε την κλίση των ρημάτων στο [COSYtools](https://cosylanguages.github.io/COSYtools/).",
        "p1_items": [
            "**1. Είμαι:** Ταυτότητα και τοποθεσία.\n  • *Απλές προτάσεις:* 'Είμαι μαθητής', 'Είναι στο σπίτι', 'Είμαστε έτοιμοι'.\n  • *Εκφράσεις:* 'είμαι στην ώρα μου', 'σύμφωνος'.",
            "**2. Έχω:** Κατοχή και ηλικία.\n  • *Απλές προτάσεις:* 'Έχω αυτοκίνητο', 'Έχω 25 χρόνια', 'Έχω πείνα'.\n  • *Εκφράσεις:* 'έχω ανάγκη', 'έχω χρόνο'.",
            "**3. Σκέφτομαι:** Σκέψη και γνώμη.\n  • *Απλές προτάσεις:* 'Σκέφτομαι πως ναι', 'Τι σκέφτεσαι;', 'Σε σκέφτομαι'.\n  • *Εκφράσεις:* 'σκέφτομαι να', 'ξανασκέφτομαι'.",
            "**4. Ξέρω / Γνωρίζω:** Γνώση και πρόσωπα.\n  • *Απλές προτάσεις:* 'Ξέρω την απάντηση', 'Γνωρίζω αυτή την πόλη'.\n  • *Εκφράσεις:* 'κάνω γνωστό', 'από όσο ξέρω'.",
            "**5. Μου αρέσει:** Προτιμήσεις.\n  • *Απλές προτάσεις:* 'Μου αρέσει ο καφές', 'Μου αρέσει να ταξιδεύω'.\n  • *Εκφράσεις:* 'μου αρέσει πολύ', 'θα μου άρεσε'.",
            "**6. Θέλω / Θα ήθελα:** Επιθυμίες.\n  • *Απλές προτάσεις:* 'Θέλω νερό', 'Θα ήθελα έναν καφέ παρακαλώ'.\n  • *Εκφράσεις:* 'θέλω να πω', 'αν θέλεις'.",
            "**7. Πηγαίνω / Θα πάω:** Μετακίνηση.\n  • *Απλές προτάσεις:* 'Πηγαίνω στη δουλειά', 'Πάμε σπίτι'.\n  • *Εκφράσεις:* 'πως πάει;', 'πηγαίνω με τα πόδια'.",
            "**8. Μπορώ:** Ικανότητα.\n  • *Απλές προτάσεις:* 'Μπορώ να βοηθήσω;', 'Μπορείς να έρθεις;'.\n  • *Εκφράσεις:* 'αν είναι δυνατόν', 'μπορεί'.",
            "**9. Τρώω:** Διατροφή.\n  • *Απλές προτάσεις:* 'Τρώω φρούτα', 'Τι θα φάμε;'.\n  • *Εκφράσεις:* 'καλή όρεξη', 'τρώω έξω'.",
            "**10. Πίνω:** Ποτά.\n  • *Απλές προτάσεις:* 'Πίνω τσάι', 'Θέλεις κάτι να πιεις;'.\n  • *Εκφράσεις:* 'στην υγειά μας', 'πίνω καφέ'."
        ],
        "p2_items": [
            "**1. Κάνω / Φτιάχνω:** Δραστηριότητες.\n  • *Απλές προτάσεις:* 'Κάνω μαθήματα', 'Φτιάχνω καφέ'.\n  • *Εκφράσεις:* 'κάνω γυμναστική', 'κάνω λάθος'.",
            "**2. Μιλώ / Λέω:** Επικοινωνία.\n  • *Απλές προτάσεις:* 'Μιλώ ελληνικά', 'Λέω την αλήθεια'.\n  • *Εκφράσεις:* 'μιλώ για', 'λέω γεια'.",
            "**3. Κοιτάζω / Βλέπω:** Όραση.\n  • *Απλές προτάσεις:* 'Κοιτάζω την ταινία', 'Βλέπω ένα πουλί'.\n  • *Εκφράσεις:* 'για να δούμε', 'θα δούμε'.",
            "**4. Ακούω:** Ακοή.\n  • *Απλές προτάσεις:* 'Ακούω μουσική', 'Ακούω έναν θόρυβο'.\n  • *Εκφράσεις:* 'άκουσε με', 'χαίρομαι που το ακούω'.",
            "**5. Πρέπει / Θα έπρεπε:** Υποχρέωση και συμβουλή.\n  • *Απλές προτάσεις:* 'Πρέπει να διαβάσω', 'Πρέπει να φύγουμε'.\n  • *Εκφράσεις:* 'όπως πρέπει', 'θα έπρεπε'.",
            "**6. Έρχομαι / Φεύγω:** Άφιξη και αναχώρηση.\n  • *Απλές προτάσεις:* 'Έρχομαι σπίτι', 'Φεύγω για τη δουλειά'.\n  • *Εκφράσεις:* 'έλα εδώ', 'φεύγω νωρίς'.",
            "**7. Παίρνω / Δίνω:** Ανταλλαγή.\n  • *Απλές προτάσεις:* 'Παίρνω το λεωφορείο', 'Δίνω ένα δώρο'.\n  • *Εκφράσεις:* 'παίρνω χρόνο', 'δίνω το χέρι'.",
            "**8. Ρωτώ / Απαντώ:** Ερωτήσεις και απαντήσεις.\n  • *Απλές προτάσεις:* 'Ρωτώ τον καθηγητή', 'Απαντώ στο τηλέφωνο'.\n  • *Εκφράσεις:* 'ζητώ βοήθεια', 'απαντώ αμέσως'.",
            "**9. Περιμένω:** Αναμονή.\n  • *Απλές προτάσεις:* 'Περιμένω το λεωφορείο', 'Περίμενε ένα λεπτό'.\n  • *Εκφράσεις:* 'περιμένω στη σειρά', 'ανυπομονώ'.",
            "**10. Μένω / Ζω:** Κατοικία.\n  • *Απλές προτάσεις:* 'Μένω στην Αθήνα', 'Ζω καλά'.\n  • *Εκφράσεις:* 'ζω στο εξωτερικό', 'μένουμε μαζί'."
        ]
    },
    "tt": {
        "name": "Tatar",
        "p1_title": "Татар теле буенча иң мөһим 10 фигыль (A0–A1 / A2)",
        "p2_title": "Татар теле буенча иң мөһим 10 фигыль, 2 өлеш (A0–A1 / A2)",
        "p1_kicker": "ТАТАР ТЕЛЕ МӘГАРИФЕ — 1 ӨЛЕШ (БАРЛЫҒЫ 2 ӨЛЕШ)",
        "p2_kicker": "ТАТАР ТЕЛЕ МӘГАРИФЕ — 2 ӨЛЕШ (БАРЛЫҒЫ 2 ӨЛЕШ)",
        "p1_dek": "Алдан килгән 10 төп фигыльне өйрәнегез (булу, бар булу, уйлау, белү, ярату/ошату, теләү, эшләү/уку/өйрәнү, бару, булдыру/алу, ашау/эчү). Фигыльләрне төрләндерү җадвәле COSYtools битендә.",
        "p2_dek": "Киләсе 10 мөһим фигыль (эшләү, сөйләү/әйтү, карау/күрү, тыңлау/ишетү, кирәк/тиеш, килү/китү, алу/бирү, сорау/җавап бирү, көтү, яшәү). Төрләндерү җадвәле COSYtools битендә.",
        "p1_intro": "Башлап өйрәнүчеләр (A0–A1, A2) өчен татар теле фигыльләре кулланмасының 1-нче өлешенә рәхим итегез! (Җентекле [2-нче өлешне](top-10-verbs-part-2-tt.html) да карагыз). Фигыльләрнең тулы төрләндерү җадвәлләрен [COSYtools](https://cosylanguages.github.io/COSYtools/) битендә карарга була.",
        "p2_intro": "Татар теле фигыльләре кулланмасының 2-нче өлешенә рәхим итегез! (Иң башта [1-нче өлешне](top-10-verbs-tt.html) укырга мөмкин). Могҗизалы 10 яңа фигыльне өйрәнәбез. Барлык төрләндерү формалары [COSYtools](https://cosylanguages.github.io/COSYtools/) битендә бирелә.",
        "h_breakdown_p1": "Төп 10 Татар фигыле (1 өлеш)",
        "h_breakdown_p2": "Төп 10 Татар фигыле (2 өлеш)",
        "h_matrix": "Телләр арасында чагыштырма таблица",
        "h_family": "А0–А1 / А2 дәрәҗәсе өчен грамматика",
        "h_practice": "Практика һәм фигыль төрләнеше",
        "matrix_intro": "Төрле тел гаиләләрендә төп фигыльләрне чагыштыру:",
        "family_text": "• **Гади җөмлә төзелеше:** Ия + Вакыт суффиксы + Фигыль.\n• **Агглютинация:** Фигыль ахырына заман һәм зат кушымталары ялгана.\n• **Төрләнеш җадвәле:** Барлык заман кушымчаларын [COSYtools](https://cosylanguages.github.io/COSYtools/) битендә карагыз.",
        "practice_text": "📌 [COSYpractice](https://cosylanguages.github.io/COSYpractice/) битендә белемегезне тикшерегез, [1-нче өлеш](top-10-verbs-tt.html) һәм [2-нче өлеш](top-10-verbs-part-2-tt.html) мәкаләләрен укыгыз, фигыль төрләнешен [COSYtools](https://cosylanguages.github.io/COSYtools/) битендә карагыз.",
        "p1_items": [
            "**1. Булу:** Ешлык һәм булу (*Мин студент*, *Ул өйдә*, *Әзербез*).",
            "**2. Бар / Юк (Минем бар):** Иялек (*Минем машинам бар*, *Минем вакытым бар*).",
            "**3. Уйлау:** Фикер белдерү (*Мин шулай уйлыйм*, *Сез ничек уйлыйсыз?*).",
            "**4. Белү:** Белем (*Мин җавапны беләм*, *Ул белә*).",
            "**5. Ярату / Ошату:** Сағыну һәм ошату (*Мин чәй яратам*, *Музыка ошый*).",
            "**6. Теләү / Тели идем:** Теләкләр (*Мин су телим*, *Чәй тели идем*).",
            "**7. Бару / Бармакчы:** Хәрәкәт (*Мин эшкә барам*, *Өйгә бару*).",
            "**8. Булдыру (Булдыра алу):** Мөмкинлек (*Мин сөйләшә алам*).",
            "**9. Ашау:** Ашау-эчү (*Мин алма ашам*, *Ашарга теләү*).",
            "**10. Эчү:** Эчемлекләр (*Чәй эчү*, *Су эчәсе килә*)."
        ],
        "p2_items": [
            "**1. Эшләү / Ясау:** Эш һәм ясау (*Өй эшләрен эшләү*).",
            "**2. Сөйләү / Әйтү:** Сөйләшү һәм сүз (*Татарча сөйләшү*).",
            "**3. Карау / Күрү:** Игътибар һәм күрү (*Фильм карау*).",
            "**4. Тыңлау / Ишетү:** Тыңлау һәм ишетү (*Музыка тыңлау*).",
            "**5. Кирәк / Тиеш:** Зарурилык һәм киңәш (*Миңа өйрәнергә кирәк*).",
            "**6. Килү / Китү:** Хәрәкәт, килү һәм китү (*Өйгә килү*, *юлга чыгу/китү*).",
            "**7. Алу / Бирү:** Алмашу һәм бүләк итү (*Китап алу*, *ярдәм бирү*).",
            "**8. Сорау / Җавап бирү:** Сораулар һәм җаваплар (*Сорау бирү*).",
            "**9. Көтү:** Сабырлык һәм вакыт (*Автобус көтү*).",
            "**10. Яшәү:** Яшәү урыны һәм тормыш (*Мин Казанда яшим*)."
        ]
    },
    "ba": {
        "name": "Bashkir",
        "p1_title": "Башҡорт теле буйынса иң мөһим 10 ҡылым (A0–A1 / A2)",
        "p2_title": "Башҡорт теле буйынса иң мөһим 10 ҡылым, 2-се өлөш (A0–A1 / A2)",
        "p1_kicker": "БАШҠОРТ ТЕЛЕ МӘҒАРИФЫ — 1-СЕ ӨЛӨШ (БАРАЛЫҒЫ 2 ӨЛӨШ)",
        "p2_kicker": "БАШҠОРТ ТЕЛЕ МӘҒАРИФЫ — 2-СЕ ӨЛӨШ (БАРАЛЫҒЫ 2 ӨЛӨШ)",
        "p1_dek": "Төп 10 ҡылымды өйрәнегеҙ (булыу, бар булыу, уйлау, белеү, яратыу/оҡшатыу, теләү, эшләү/уҡыу/өйрәнеү, барыу, булдырыу/алыу, ашау/эсеү). Ҡылымдарҙы үҙгәртеү таблицалары COSYtools битендә.",
        "p2_dek": "Киләһе 10 мөһим ҡылым (эшләү, һөйләү/әйтеү, ҡарау/күреү, тыңлау/ишетеү, кәрәк/тейеш, килеү/китергә, алыу/биреү, һорау/яуап биреү, көтөү, йәшәү). COSYtools битендә таблицалар.",
        "p1_intro": "Башлап өйрәнеүселәр (A0–A1, A2) өсөн башҡорт теле ҡылымдары ҡулланмаһының 1-се өлөшөнә рәхим итегеҙ! ([2-се өлөштө](top-10-verbs-part-2-ba.html) ла ҡарағыҙ). Ҡылымдарҙың тулы үҙгәреш таблицаларын [COSYtools](https://cosylanguages.github.io/COSYtools/) битендә ҡарарға була.",
        "p2_intro": "Башҡорт теле ҡылымдары ҡулланмаһының 2-се өлөшөнә рәхим итегеҙ! ([1-се өлөштө](top-10-verbs-ba.html) уҡырға мөмкин). Яңы 10 төп ҡылымды өйрәнәбеҙ. Барлыҡ ҡылым таблицалары [COSYtools](https://cosylanguages.github.io/COSYtools/) битендә.",
        "h_breakdown_p1": "Төп 10 Башҡорт ҡылымы (1-се өлөш)",
        "h_breakdown_p2": "Төп 10 Башҡорт ҡылымы (2-се өлөш)",
        "h_matrix": "Телдәр араһында сағыштырыу таблицаһы",
        "h_family": "А0–А1 / А2 кимәле өсөн грамматика",
        "h_practice": "Практика һәм ҡылым үҙгәреше",
        "matrix_intro": "Төрлө тел ғаиләләрендә төп ҡылымдарҙы сағыштырыу:",
        "family_text": "• **Иң ябай һөйләм:** Эйә + Ҡылым.\n• **Ҡушымталар:** Ваҡыт һәм зат ҡушымталары.\n• **Таблицалар:** Барлыҡ ҡылым формалары [COSYtools](https://cosylanguages.github.io/COSYtools/) битендә.",
        "practice_text": "📌 [COSYpractice](https://cosylanguages.github.io/COSYpractice/) битендә тикшерегеҙ, [1-се өлөш](top-10-verbs-ba.html) һәм [2-се өлөш](top-10-verbs-part-2-ba.html) мәҡәләләрен уҡығыҙ, [COSYtools](https://cosylanguages.github.io/COSYtools/) битенә инегеҙ.",
        "p1_items": [
            "**1. Вулыу / Булыу:** Торош (*Мин студент*, *Өйҙә*).",
            "**2. Бар / Юҡ:** Эйәлек (*Минең китабым бар*).",
            "**3. Уйлау:** Фикер (*Мин шулай уйлайым*).",
            "**4. Белеү:** Белем (*Мин яуапты беләм*).",
            "**5. Яратыу:** Ошатыу (*Мин музыка яратам*).",
            "**6. Теләү:** Теләк (*Һыу теләйем*).",
            "**7. Барыу:** Хәрәкәт (*Мин мәктәпкә барам*).",
            "**8. Булдырыу (Алыу):** Мөмкинлек (*Һөйләшә алам*).",
            "**9. Ашау:** Ашау (*Алма ашау*).",
            "**10. Эсеү:** Эсеү (*Сәй эсеү*)."
        ],
        "p2_items": [
            "**1. Эшләү / Яһау:** Эш һәм ғәмәл (*Эш эшләү*).",
            "**2. Һөйләү / Әйтеү:** Һөйләшеү һәм тел (*Һөйләшеү*).",
            "**3. Ҡарау / Күреү:** Ҡарау һәм күреү (*Кино ҡарау*).",
            "**4. Тыңлау / Ишетеү:** Тыңлау һәм ишетеү (*Музыка тыңлау*).",
            "**5. Кәрәк / Тейеш:** Зарурилыҡ һәм кәңәш (*Кәрәк*, *тейеш*).",
            "**6. Килеү / Китеү:** Хәрәкәт һәм китеү (*Өйгә килеү*, *юлға китеү*).",
            "**7. Алыу / Биреү:** Алмашыу һәм тапшырыу (*Китап алыу*, *ҡул биреү*).",
            "**8. Һорау / Яуап биреү:** Һорау биреү һәм яуап (*Һорау биреү*).",
            "**9. Көтөү:** Сабырлыҡ һәм ваҡыт (*Автобус көтөү*).",
            "**10. Йәшәү:** Йәшәү һәм урын (*Өфөлә йәшәйем*)."
        ]
    },
    "br": {
        "name": "Breton",
        "p1_title": "Ar 10 verb pennañ e brezhoneg evit ar re dhazerañ (A0–A1 / A2)",
        "p2_title": "Ar 10 verb pennañ e brezhoneg, Rann 2 (A0–A1 / A2)",
        "p1_kicker": "KAVLEVR BREZHONEG — RANN 1 EUS 2",
        "p2_kicker": "KAVLEVR BREZHONEG — RANN 2 EUS 2",
        "p1_dek": "Deskit ar 10 verb pennañ e brezhoneg (bezañ, kaout, soñjal, gouzout/anavezout, plijout, c'hoant kaout, labourat/studiñ/deskiñ, mont, gallout, debriñ/evañ). Taolennoù conjugazhon war COSYtools.",
        "p2_dek": "Deskit an 10 verb war-lerc'h (ober, komz/lavarout, sellet/gwelout, selaou/klevout, rankout/dleout, dont/mont kuit, kemer/rein, goulenn/respont, gortoz, bevañ/chom). Taolennoù war COSYtools.",
        "p1_intro": "Degemer mat e Rann 1 eus ar c'havlevr verboù evit al live A0–A1 hag A2 e brezhoneg! (Lennit ivez ar [Rann 2](top-10-verbs-part-2-br.html)). An taolennoù conjugazhon klok a c'haller kavout war [COSYtools](https://cosylanguages.github.io/COSYtools/).",
        "p2_intro": "Degemer mat e Rann 2 eus ar c'havlevr verboù brezhonek evit al live A0–A1 hag A2! (Sellet ouzh ar [Rann 1](top-10-verbs-br.html) mar n'hoc'h eus ket he lennet). Taolennoù conjugazhon ar verboù a zo war [COSYtools](https://cosylanguages.github.io/COSYtools/).",
        "h_breakdown_p1": "Ar 10 verb pennañ (Rann 1)",
        "h_breakdown_p2": "Ar 10 verb pennañ (Rann 2)",
        "h_matrix": "Taolenn geñveriañ ar verboù",
        "h_family": "Yezhadur ha framm evit al live A0–A1 / A2",
        "h_practice": "Pleustriñ ha conjugazhon",
        "matrix_intro": "Keñveriadur ar verboù pennañ etre ar yezhoù :",
        "family_text": "• **Frammoù simpl:** Rannig + Verb + Renadenn.\n• **Verboù-skoazell:** Implij eus 'am eus', 'on' ha 'gallout'.\n• **Conjugazhon:** Gallout a reer sellet ouzh an taolennoù war [COSYtools](https://cosylanguages.github.io/COSYtools/).",
        "practice_text": "📌 Pleustrit war [COSYpractice](https://cosylanguages.github.io/COSYpractice/), lennit ar [Rann 1](top-10-verbs-br.html) hag ar [Rann 2](top-10-verbs-part-2-br.html), ha kavout an taolennoù war [COSYtools](https://cosylanguages.github.io/COSYtools/).",
        "p1_items": [
            "**1. Bezañ:** Bezañs (*Skoaziad on*).",
            "**2. Kaout:** Perc'henniezh (*Libr am eus*).",
            "**3. Soñjal:** Soñj (*Soñjal a ran*).",
            "**4. Gouzout / Anavezout:** Gouziegezh (*Gouzout a ran*).",
            "**5. Plijout:** Pliadur (*Plijout a ra din*).",
            "**6. C'hoant kaout:** Fellout (*C'hoant am eus*).",
            "**7. Mont:** Mont (*Mont d'ar skol*).",
            "**8. Gallout:** Galloud (*Gallout a ran*).",
            "**9. Debriñ:** Debriñ (*Debriñ avaloù*).",
            "**10. Evañ:** Evañ (*Evañ dour*)."
        ],
        "p2_items": [
            "**1. Ober:** Obererezh (*Ober al labour*).",
            "**2. Komz / Lavarout:** Komz ha lavarout (*Komz brezhoneg*).",
            "**3. Sellet / Gwelout:** Sellet ha gwelout (*Sellet ouzh ur film*).",
            "**4. Selaou / Klevout:** Selaou ha klevout (*Selaou sonerezh*).",
            "**5. Rankout / Dleout:** Retiez ha kuzul (*Rankout a ran*).",
            "**6. Dont / Mont kuit:** Donedigezh ha mont kuit (*Dont d'ar gêr*, *Mont kuit*).",
            "**7. Kemer / Rein:** Eskemm ha prof (*Kemer ur banne*, *Rein un dorn*).",
            "**8. Goulenn / Respont:** Goulennoù ha respontoù (*Goulenn ur gaoz*).",
            "**9. Gortoz:** Gortoz ha basianted (*Gortoz ar c'harr-boutin*).",
            "**10. Bevañ / Chom:** Bevañ hag annez (*Bevañ e Roazhon*)."
        ]
    },
    "pt": {
        "name": "Portuguese",
        "p1_title": "Os 10 verbos essenciais em português para principiantes (A0–A1 / A2)",
        "p2_title": "Os 10 verbos essenciais em português, Parte 2 (A0–A1 / A2)",
        "p1_kicker": "GUIA DE PORTUGUÊS — PARTE 1 DE 2",
        "p2_kicker": "GUIA DE PORTUGUÊS — PARTE 2 DE 2",
        "p1_dek": "Aprenda os primeiros 10 verbos fundamentais em português (ser/estar, ter, pensar, saber/conhecer, gostar, querer/gostaria, trabalhar/estudar/aprender, ir/ir a, poder, comer/beber). Tabelas de conjugação no COSYtools.",
        "p2_dek": "Descubra os 10 verbos seguintes (fazer, falar/dizer, olhar/ver, ouvir/escutar, ter de/dever, vir/sair, tomar/dar, perguntar/responder, esperar, viver/morar). Tabelas no COSYtools.",
        "p1_intro": "Bem-vindo à Parte 1 do nosso guia de 2 partes sobre os verbos essenciais em português para os níveis A0–A1 e A2! (Veja também a [Parte 2](top-10-verbs-part-2-pt.html)). As tabelas de conjugação completas de todos os verbos podem ser consultadas em [COSYtools](https://cosylanguages.github.io/COSYtools/).",
        "p2_intro": "Bem-vindo à Parte 2 do nosso guia de verbos em português para principiantes A0–A1 e A2! (Consulte a [Parte 1](top-10-verbs-pt.html) se ainda não leu). Aqui abordamos 10 novos verbos do dia a dia. Todas as tabelas de conjugação estão no [COSYtools](https://cosylanguages.github.io/COSYtools/).",
        "h_breakdown_p1": "Os 10 verbos fundamentais (Parte 1)",
        "h_breakdown_p2": "Os 10 verbos fundamentais (Parte 2)",
        "h_matrix": "Tabela comparativa de verbos",
        "h_family": "Gramática e estruturas para o nível A0–A1 / A2",
        "h_practice": "Prática e conjugação",
        "matrix_intro": "Comparação dos principais verbos entre famílias linguísticas:",
        "family_text": "• **Frases simples:** Sujeito + Verbo + Complemento.\n• **Verbos auxiliares:** Uso de 'ir + infinitivo' e 'poder/ter de'.\n• **Tabelas de conjugação:** Consulte todas as formas verbais em [COSYtools](https://cosylanguages.github.io/COSYtools/).",
        "practice_text": "📌 Pratique no [COSYpractice](https://cosylanguages.github.io/COSYpractice/), leia a [Parte 1](top-10-verbs-pt.html) e a [Parte 2](top-10-verbs-part-2-pt.html), e consulte as conjuções no [COSYtools](https://cosylanguages.github.io/COSYtools/).",
        "p1_items": [
            "**1. Ser / Estar:** Identidade e estado (*Sou estudante*, *Estou em casa*).",
            "**2. Ter:** Posse e idade (*Tenho um livro*, *Tenho 25 anos*).",
            "**3. Pensar:** Opiniões (*Penso que sim*).",
            "**4. Saber / Conhecer:** Conhecimento (*Sei a resposta*).",
            "**5. Gostar:** Preferências (*Gosto de café*).",
            "**6. Querer / Gostaria:** Desejos (*Quero água*, *Gostaria de um chá*).",
            "**7. Ir:** Movimento (*Vou trabalhar*).",
            "**8. Poder:** Capacidade (*Posso ajudar?*).",
            "**9. Comer:** Alimentação (*Comer uma maçã*).",
            "**10. Beber:** Bebidas (*Beber água*)."
        ],
        "p2_items": [
            "**1. Fazer:** Atividades e tarefas (*Fazer os TPC*, *Fazer o almoço*).",
            "**2. Falar / Dizer:** Comunicação e diálogo (*Falar português*, *Dizer a verdade*).",
            "**3. Olhar / Ver:** Atenção visual (*Olhar para o quadro*, *Ver um pássaro*).",
            "**4. Ouvir / Escutar:** Audição e atenção (*Ouvir música*, *Escutar com atenção*).",
            "**5. Ter de / Dever:** Obrigação e recomendação (*Tenho de estudar*, *Deverias descansar*).",
            "**6. Vir / Sair (Partir):** Chegada e partida (*Vens connosco?*, *O comboio sai às oito*).",
            "**7. Tomar / Dar:** Troca e transporte (*Tomar um café*, *Dar uma ajuda*).",
            "**8. Perguntar / Responder:** Perguntas e respostas (*Fazer uma pergunta*, *Responder ao telefone*).",
            "**9. Esperar:** Paciência e tempo (*Esperar o autocarro*, *Esperar um minuto*).",
            "**10. Morar / Viver:** Residência e vida (*Moro em Lisboa*, *Viver bem*)."
        ]
    },
    "hy": {
        "name": "Armenian",
        "p1_title": "Հայերենի 10 հիմնական բայերը սկսնակների համար (A0–A1 / A2)",
        "p2_title": "Հայերենի 10 հիմնական բայերը, Մաս 2 (A0–A1 / A2)",
        "p1_kicker": "ՀԱՅԵՐԵՆԻ ՈՒՂԵՑՈՒՅՑ — ՄԱՍ 1 (ԸՆԴՀԱՆՈՒՐ 2 ՄԱՍ)",
        "p2_kicker": "ՀԱՅԵՐԵՆԻ ՈՒՂԵՑՈՒՅՑ — ՄԱՍ 2 (ԸՆԴՀԱՆՈՒՐ 2 ՄԱՍ)",
        "p1_dek": "Սովորեք առաջին 10 հիմնական բայերը (լինել, ունենալ, մտածել, իմանալ/ճանաչել, սիրել, ուզել, աշխատել/սովորել, գնալ, կարողանալ, ուտել/խմել)։ Խոնարհման աղյուսակները հասանելի են COSYtools-ում։",
        "p2_dek": "Բացահայտեք հաջորդ 10 բայերը (անել, խոսել/ասել, նայել/տեսնել, լսել, պետք է, գալ/գնալ-հեռանալ, վերցնել/տալ, հարցնել/պատասխանել, սպասել, ապրել)։ Աղյուսակները COSYtools-ում։",
        "p1_intro": "Բարի գալուստ A0–A1 և A2 մակարդակի հայերենի բայերի 2 մասից բաղկացած ուղեցույցի Մաս 1! (Կարդացեք նաև [Մաս 2-ը](top-10-verbs-part-2-hy.html))։ Բոլոր բայերի խոնարհման ամբողջական աղյուսակները կարող եք գտնել [COSYtools](https://cosylanguages.github.io/COSYtools/)-ում։",
        "p2_intro": "Բարի գալուստ սկսնակների համար հայերենի բայերի ուղեցույցի Մաս 2! (Եթե չեք կարդացել [Մաս 1-ը](top-10-verbs-hy.html), սկսեք դրանից)։ Բոլոր բայական ձևերը հասանելի են [COSYtools](https://cosylanguages.github.io/COSYtools/)-ում։",
        "h_breakdown_p1": "10 հիմնական բայերը (Մաս 1)",
        "h_breakdown_p2": "10 հիմնական բայերը (Մաս 2)",
        "h_matrix": "Բայերի համեմատական աղյուսակ",
        "h_family": "Քերականություն A0–A1 / A2 մակարդակի համար",
        "h_practice": "Վարժություններ և խոնարհում",
        "matrix_intro": "Հիմնական բայերի համեմատությունը տարբեր լեզուներում․",
        "family_text": "• **Պարզ նախադասություններ․** Ենթակա + Բայ + Լրացում։\n• **Օժանդակ բայեր․** Ներկա և ապառնի ժամանակաձևերի կիրառություն։\n• **Խոնարհում․** Ամբողջական աղյուսակները տես [COSYtools](https://cosylanguages.github.io/COSYtools/)-ում։",
        "practice_text": "📌 Կատարեք վարժություններ [COSYpractice](https://cosylanguages.github.io/COSYpractice/)-ում, կարդացեք [Մաս 1-ը](top-10-verbs-hy.html) և [Մաս 2-ը](top-10-verbs-part-2-hy.html), իսկ խոնարհման աղյուսակները տես [COSYtools](https://cosylanguages.github.io/COSYtools/)-ում։",
        "p1_items": [
            "**1. Լինել:** Ինքնություն (*Ես ուսանող եմ*).",
            "**2. Ունենալ:** Ունեցվածք (*Ես գիրք ունեմ*).",
            "**3. Մտածել:** Կարծիք (*Ես մտածում եմ*).",
            "**4. Իմանալ / Ճանաչել:** Գիտելիք (*Ես գիտեմ պատասխանը*).",
            "**5. Սիրել:** Նախասիրություն (*Ես սիրում եմ սուրճ*).",
            "**6. Ուզենալ:** Ցանկություն (*Ես ջուր եմ ուզում*).",
            "**7. Գնալ:** Շարժում (*Ես գնում եմ դպրոց*).",
            "**8. Կարողանալ:** Կարողություն (*Ես կարող եմ խոսել*).",
            "**9. Ուտել:** Ուտելիք (*Հաց ուտել*).",
            "**10. Խմել:** Խմիչք (*Ջուր խմել*)."
        ],
        "p2_items": [
            "**1. Անել:** Գործեր և պարտականություններ (*Անել դասերը*).",
            "**2. Խոսել / Ասել:** Հաղորդակցություն (*Խոսել հայերեն*, *Ասել ճշմարտությունը*).",
            "**3. Նայել / Տեսնել:** Ուշադրություն և տեսողություն (*Նայել ֆիլմ*).",
            "**4. Լսել:** Լսողություն և ուշադրություն (*Երաժշտություն լսել*).",
            "**5. Պետք է:** Անհրաժեշտություն և խորհուրդ (*Ես պետք է սովորեմ*).",
            "**6. Գալ / Հեռանալ (Գնալ):** Ժամանում և մեկնում (*Գալ տուն*, *Գնալ ժամանակին*).",
            "**7. Վերցնել / Տալ:** Փոխանակում և նվեր (*Սուրճ վերցնել*, *Ձեռք տալ*).",
            "**8. Հարցնել / Պատասխանել:** Հարցեր և պատասխաններ (*Հարց տալ*, *Պատասխանել հեռախոսին*).",
            "**9. Սպասել:** Սպասում և համբերություն (*Սպասել ավտոբուսին*).",
            "**10. Ապրել:** Բնակություն և կյանք (*Ես ապրում եմ Երևանում*)."
        ]
    },
    "ka": {
        "name": "Georgian",
        "p1_title": "10 ძირითადი ზმნა ქართულ ენაში დამწყებთათვის (A0–A1 / A2)",
        "p2_title": "10 ძირითადი ზმნა ქართულ ენაში, ნაწილი 2 (A0–A1 / A2)",
        "p1_kicker": "ქართული ენის სახელმძღვანელო — ნაწილი 1 (სულ 2 ნაწილი)",
        "p2_kicker": "ქართული ენის სახელმძღვანელო — ნაწილი 2 (სულ 2 ნაწილი)",
        "p1_dek": "ისწავლეთ პირველი 10 ძირითადი ზმნა (ყოფნა, ქონა/ყოლა, ფიქრი, ცოდნა/ცნობა, მოწონება/სიყვარული, ნდომა, მუშაობა/სწავლა, წასვლა, შეძლება, ჭამა/სმა). უღვლილების ცხრილები იხილეთ COSYtools-ზე.",
        "p2_dek": "გაეცანით შემდეგ 10 ზმნას (კეთება, ლაპარაკი/თქმა, ყურება/ნახვა, მოსმენა, უნდა/საჭიროა, მოსვლა/წასვლა, აღება/მიცემა, კითხვა/პასუხი, ლოდინი, ცხოვრება). ცხრილები COSYtools-ზე.",
        "p1_intro": "კეთილი იყოს თქვენი მობრძანება A0–A1 და A2 დონის ქართული ზმნების 2-ნაწილიანი სახელმძღვანელოს 1-ელ ნაწილში! (იხილეთ აგრეთვე [მე-2 ნაწილი](top-10-verbs-part-2-ka.html)). ზმნათა უღვლილების სრული ცხრილები შეგიძლიათ იხილოთ [COSYtools](https://cosylanguages.github.io/COSYtools/)-ზე.",
        "p2_intro": "კეთილი იყოს თქვენი მობრძანება ქართული ზმნების სახელმძღვანელოს მე-2 ნაწილში! (წაიკითხეთ [1-ელი ნაწილი](top-10-verbs-ka.html), თუ ჯერ არ გინახავთ). უღვლილების ყველა ფორმა ხელმისაწვდომია [COSYtools](https://cosylanguages.github.io/COSYtools/)-ზე.",
        "h_breakdown_p1": "10 ძირითადი ზმნა (ნაწილი 1)",
        "h_breakdown_p2": "10 ძირითადი ზმნა (ნაწილი 2)",
        "h_matrix": "ზმნათა შედარებითი ცხრილი",
        "h_family": "გრამატიკა A0–A1 / A2 დონისათვის",
        "h_practice": "პრაქტიკა და უღვლილება",
        "matrix_intro": "ძირითადი ზმნების შედარება ენათა ოჯახებში:",
        "family_text": "• **მარტივი წინადადებები:** სუბიექტი + ზმნა + ობიექტი.\n• **ზმნური ფორმები:** დროთა და პირთა წარმოება.\n• **უღვლილების ცხრილები:** იხილეთ [COSYtools](https://cosylanguages.github.io/COSYtools/)-ზე.",
        "practice_text": "📌 ივარჯიშეთ [COSYpractice](https://cosylanguages.github.io/COSYpractice/)-ზე, წაიკითხეთ [1-ელი ნაწილი](top-10-verbs-ka.html) და [მე-2 ნაწილი](top-10-verbs-part-2-ka.html), ხოლო ზმნათა უღვლილება იხილეთ [COSYtools](https://cosylanguages.github.io/COSYtools/)-ზე.",
        "p1_items": [
            "**1. ყოფნა:** იდენტობა (*მე ვარ სტუდენტი*).",
            "**2. ქონა / Ჰყოლა:** ფლობა (*მე მაქვს წიგნი*).",
            "**3. ფიქრი:** აზრი (*მე ვფიქრობ*).",
            "**4. ცოდნა / ცნობა:** ცოდნა (*მე ვიცი პასუხი*).",
            "**5. მოწონება:** მოწონება (*მე მომწონს ყავა*).",
            "**6. ნდომა:** სურვილი (*მე მინდა წყალი*).",
            "**7. წასვლა:** მოძრაობა (*მივდივარ სკოლაში*).",
            "**8. შეძლება:** შესაძლებლობა (*მე შემიძლია*).",
            "**9. ჭამა:** კვება (*ვაშლის ჭამა*).",
            "**10. დალევა:** სითხე (*წყლის დალევა*)."
        ],
        "p2_items": [
            "**1. კეთება:** საქმე და შექმნა (*საქმის კეთება*).",
            "**2. ლაპარაკი / თქმა:** კომუნიკაცია (*ქართულად ლაპარაკი*, *სიმართლის თქმა*).",
            "**3. ყურება / ნახვა:** ყურადღება და მხედველობა (*ფილმის ყურება*).",
            "**4. მოსმენა:** სმენა და ყურადღება (*მუსიკის მოსმენა*).",
            "**5. უნდა / საჭიროა:** აუცილებლობა და რჩევა (*მე უნდა ვისწავლო*).",
            "**6. მოსვლა / წასვლა:** მოძრაობა, მოსვლა და გამგზავრება (*შინ მოსვლა*, *წასვლა*).",
            "**7. აღება / მიცემა:** გაცვლა და ჩუქება (*ყავის აღება*, *დახმარების გაწევა*).",
            "**8. კითხვა / პასუხი:** კითხვები და პასუხები (*კითხვის დასმა*, *პასუხის გაცემა*).",
            "**9. ლოდინი:** ლოდინი და მოთმინება (*ავტوبუსის ლოდინი*).",
            "**10. ცხოვრება:** საცხოვრებელი და ყოფა (*ვცხოვრობ თბილისში*)."
        ]
    },
    "cv": {
        "name": "Chuvash",
        "p1_title": "Чăваш чĕлхинчи чи кирлĕ 10 глагол (A0–A1 / A2)",
        "p2_title": "Чăваш чĕлхинчи чи кирлĕ 10 глагол, 2-мĕш пай (A0–A1 / A2)",
        "p1_kicker": "ЧĂВАШ ЧĔЛХИН СУМЛĂ ГИДĔ — 1-МĔШ ПАЙ (ПĔТĔМПЕ 2 ПАЙ)",
        "p2_kicker": "ЧĂВАШ ЧĔЛХИН СУМЛĂ ГИДĔ — 2-МĔШ ПАЙ (ПĔТĔМПЕ 2 ПАЙ)",
        "p1_dek": "Тĕп 10 глагола вĕренĕр (пулма, пур пулма, шухăшлама, пĕлме, кăмăллама, тăвас килме, ĕçлеме/вĕренме, кайма, пултарасси, çеме/ĕçме). Спряжени таблицисем COSYtools битенче.",
        "p2_dek": "Малалла 10 кирлĕ глагол (тăвасси, калаçасси/каласси, пăхасси/курасси, итлесси/ишитесси, кирлĕ, килесси/каймалли, илесси/парасси, ыйтасси/хуравламалли, кĕтесси, пурăнасси). Спряжени COSYtools битенче.",
        "p1_intro": "A0–A1 тата A2 дăрăжинче чăваш чĕлхине вĕренекенсем валли 2 пайран туракан гидăн 1-мĕш пайне килĕр! ([2-мĕш пайне](top-10-verbs-part-2-cv.html) каялла пăхăр). Глаголсен тулы спряжени таблицисене [COSYtools](https://cosylanguages.github.io/COSYtools/) битенче пăхма пулать.",
        "p2_intro": "Чăваш чĕлхи гидĕн 2-мĕш пайне килĕр! ([1-мĕш пайне](top-10-verbs-cv.html) вулăр). Чăваш глаголĕсен спряжени формасене [COSYtools](https://cosylanguages.github.io/COSYtools/) битенче уçса пăхма пулать.",
        "h_breakdown_p1": "Тĕп 10 Чăваш глаголĕ (1-мĕш пай)",
        "h_breakdown_p2": "Тĕп 10 Чăваш глаголĕ (2-мĕш пай)",
        "h_matrix": "Глаголсен танлаштару таблици",
        "h_family": "A0–A1 / A2 дăрăжĕ валли грамматика",
        "h_practice": "Практика тата спряжени",
        "matrix_intro": "Тĕрлĕ чĕлхесем тăрăх тĕп глаголсене танлаштарни:",
        "family_text": "• **Сăмах йĕрки:** Вĕçлĕхсем тата глагол формисем.\n• **Агглютинаци:** Спряжени аффиксĕсем.\n• **Таблицасем:** Пуххине [COSYtools](https://cosylanguages.github.io/COSYtools/) битенче вулăр.",
        "practice_text": "📌 [COSYpractice](https://cosylanguages.github.io/COSYpractice/) битенче хăнăхăр, [1-мĕш пай](top-10-verbs-cv.html) тата [2-мĕш пай](top-10-verbs-part-2-cv.html) статьисене вулăр, спряжени таблицисене [COSYtools](https://cosylanguages.github.io/COSYtools/) битенче пăхăр.",
        "p1_items": [
            "**1. Пулма:** Пулни (*Эпĕ студент*).",
            "**2. Пур / Ҫук:** Пурлăх (*Манăн кĕнеке пур*).",
            "**3. Шухăшлама:** Шухăш (*Эпĕ шухăшлатăп*).",
            "**4. Пĕлме:** Пĕлӳ (*Эпĕ хуравне пĕлетĕп*).",
            "**5. Кăмăллама:** Кăмăл (*Мана кофе кăмăла каять*).",
            "**6. Тăвас килесси:** Ĕмĕт (*Шыв ĕçесшĕн*).",
            "**7. Кайма:** Куçни (*Шкула каятăп*).",
            "**8. Пултарасси:** Пултару (*Эпĕ калаçма пултаратăп*).",
            "**9. Çеме:** Çимĕç (*Улма çеме*).",
            "**10. Ĕçме:** Ĕçмелли (*Шыв ĕçме*)."
        ],
        "p2_items": [
            "**1. Тăвасси:** Ĕçсем тата пулăмсем (*Ĕç тăвасси*).",
            "**2. Калаçасси / Каласси:** Калаçу тата сăмах (*Чăвашла калаçасси*).",
            "**3. Пăхасси / Курасси:** Асăрхаса пăхасси (*Фильм пăхасси*).",
            "**4. Итлесси / Ишитесси:** Итлесси тата илтесси (*Музыка итлесси*).",
            "**5. Кирлĕ:** Ыйтни тата тивĕçлĕх (*Мана кирлĕ*).",
            "**6. Килесси / Каясси:** Куçни, килни тата кайни (*Киле килесси*, *каймалли*).",
            "**7. Илесси / Парасси:** Улмаш тата парне (*Кĕнеке илесси*, *алă парасси*).",
            "**8. Ыйтасси / Хуравламалли:** Ыйтусем тата хуравсем (*Ыйту парасси*).",
            "**9. Кĕтесси:** Тӳсĕмлĕх тата вăхăт (*Автобус кĕтесси*).",
            "**10. Пурăнасси:** Вырăн тата пурнăç (*Шупашкарта пурăнатăп*)."
        ]
    }
}

# Load rich verbs_data.json if present
try:
    verbs_data_path = os.path.join(os.path.dirname(__file__), "verbs_data.json")
    if os.path.exists(verbs_data_path):
        with open(verbs_data_path, "r", encoding="utf-8") as vf:
            extra_verbs = json.load(vf)
            for lcode, vlist in extra_verbs.items():
                if lcode in languages_data:
                    languages_data[lcode]["p1_verbs"] = vlist
except Exception as e:
    print("Notice: Could not load verbs_data.json:", e)


posts_dir = "posts"
os.makedirs(posts_dir, exist_ok=True)

for code, lang in languages_data.items():
    for is_part_2 in [False, True]:
        slug = f"top-10-verbs-part-2-{code}" if is_part_2 else (f"top-10-verbs-{code}" if code != "en" else "top-10-verbs-en")
        filepath = os.path.join(posts_dir, f"{slug}.json")

        post_obj = {
            "id": f"post-{slug}",
            "slug": slug,
            "language": code,
            "translationOf": "top-10-verbs-part-2" if is_part_2 else "top-10-verbs",
            "desk": "Words",
            "format": "list",
            "level": "A0–A1 / A2",
            "issue": {
                "number": "Vol. 2026 — December Issue" if is_part_2 else "Vol. 2026 — August Issue",
                "title": "Winter Grammar & High Frequency Verbs" if is_part_2 else "Get ready for school"
            },
            "date": "2026-12-01" if is_part_2 else "2026-03-01",
            "title": lang["p2_title"] if is_part_2 else lang["p1_title"],
            "kicker": lang["p2_kicker"] if is_part_2 else lang["p1_kicker"],
            "dek": lang["p2_dek"] if is_part_2 else lang["p1_dek"],
            "tags": ["Verbs", lang["name"], "A0-A1", "Part2" if is_part_2 else "14Languages"],
            "readingTime": 10,
            "podcast": {
                "episode": 3 if is_part_2 else 2,
                "audioUrl": None
            },
            "artDirection": {
                "palette": ["#0284c7", "#f0f9ff", "#0f172a"] if is_part_2 else ["#d97706", "#fef3c7", "#0d9488", "#1e293b"],
                "fonts": {
                    "display": "Fraunces",
                    "text": "DM Sans",
                    "accent": "Fraunces Italic"
                },
                "layout": "magazine-spread",
                "motif": "editorial-stars",
                "seed": slug,
                "coverOverride": None
            },
            "blocks": (
                [
                    {
                        "type": "paragraph",
                        "text": lang["p2_intro"] if is_part_2 else lang["p1_intro"]
                    },
                    {
                        "type": "heading",
                        "level": 3,
                        "text": lang["h_breakdown_p2"] if is_part_2 else lang["h_breakdown_p1"]
                    }
                ] + (
                    [
                        b for v in lang.get("p1_verbs", []) for b in [
                            {"type": "heading", "level": 3, "text": f"{v['num']}. {v['title']}"},
                            {"type": "paragraph", "text": v["desc"]},
                            {"type": "table", "headers": v["headers"], "rows": v["conjugation"]},
                            {"type": "list-item", "ordered": False, "items": v["usage"]}
                        ]
                    ] if (not is_part_2 and "p1_verbs" in lang) else [
                        {
                            "type": "list-item",
                            "ordered": False,
                            "items": lang["p2_items"] if is_part_2 else lang["p1_items"]
                        }
                    ]
                ) + [
                    {
                        "type": "heading",
                        "level": 3,
                        "text": lang["h_matrix"]
                    },
                    {
                        "type": "paragraph",
                        "text": lang["matrix_intro"]
                    },
                    {
                        "type": "table",
                        "headers": ["Concept", "Romance (FR/IT/ES/PT)", "Germanic (EN/DE)", "Slavic / Hellenic / Celtic / Arm", "Turkic (TT/BA/CV)", "Kartvelian (KA)"],
                        "rows": [
                            ["Be / Exist", "être / essere / ser, estar / ser, estar", "be / sein", "быть / είναι / bezañ / լինել", "булу / булыу / пуласси", "ყოფნა (qopna)"],
                            ["Have / Possess", "avoir / avere / tener / ter", "have / haben", "иметь (у меня есть) / έχω / kaout / ունենալ", "бар (минем бар) / бар / пур", "ქոնա / ყოლა"],
                            ["Do / Make", "faire / fare / hacer / fazer", "do, make / machen, tun", "делать / κάνω / ober / անել", "эшләү / эшләү / тăвасси", "կետება (keteba)"],
                            ["Go", "aller / andare / ir / ir", "go / gehen", "идти, ехать / πηγαίνω / mont / գնալ", "бару / барыу / кайни", "წასვლა (tsasvla)"],
                            ["See / Look", "voir, regarder / vedere, guardare", "see, look / sehen, schauen", "видеть, смотреть / βλέπω / gwelout / տեսնել", "күрү, карау / күреү, ҡарау / курасси", "ნახვა, ყურება"]
                        ]
                    },
                    {
                        "type": "heading",
                        "level": 3,
                        "text": lang["h_family"]
                    },
                    {
                        "type": "paragraph",
                        "text": lang["family_text"]
                    },
                    {
                        "type": "heading",
                        "level": 3,
                        "text": lang["h_practice"]
                    },
                    {
                        "type": "paragraph",
                        "text": lang["practice_text"]
                    }
                ]
            ),
            "draft": False
        }

        # Do not overwrite hand-expanded articles (they carry a refs block and many more blocks than this template)
        if os.path.exists(filepath) and "--force" not in sys.argv:
            try:
                with open(filepath, "r", encoding="utf-8") as ef:
                    existing = json.load(ef)
                ex_blocks = existing.get("blocks", [])
                if len(ex_blocks) >= 60 or any(b.get("listId") == "refs" for b in ex_blocks):
                    print("Skipping expanded article (use --force to overwrite):", slug)
                    continue
            except Exception:
                pass
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(post_obj, f, ensure_ascii=False, indent=2)

print("All JSON posts updated successfully with 2-part references, A0-A1/A2 level adaptation, and COSYtools conjugation notes!")
