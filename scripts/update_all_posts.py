import json
import os

languages_data = {
    "en": {
        "name": "English",
        "p1_title": "Top 10 Essential Verbs in English for Absolute Beginners (A0–A1 / A2)",
        "p2_title": "Top 10 Essential Verbs in English, Part 2 (CEFR A0–A1 / A2)",
        "p1_kicker": "ENGLISH CORE GUIDE — PART 1 OF 2",
        "p2_kicker": "ENGLISH CORE GUIDE — PART 2 OF 2",
        "p1_dek": "Master the first 10 high-frequency verbs in English (be, have, think, know, like, want/would like, go/be going to, can, eat, drink). Conjugation tables are consultable on COSYtools.",
        "p2_dek": "Master the second 10 high-frequency verbs in English (do/make, speak/talk/say/tell, look/watch/see, listen/hear, must/have to, take/give/get, live, wait, understand, ask/answer). Conjugation tables on COSYtools.",
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
            "**1. Do / Make:** Activities and creation.\n  • *Usage & Frames:* 'I do my homework' vs 'I make breakfast'.\n  • *Useful Phrases:* 'do business', 'do research' | 'make progress', 'make a mistake'.",
            "**2. Speak / Talk / Say / Tell:** Communication.\n  • *Usage & Frames:* 'I speak English', 'Let's talk', 'Say hello', 'Tell me'.\n  • *Useful Phrases:* 'speak fluently', 'talk with', 'say yes', 'tell a story'.",
            "**3. Look / Watch / See:** Vision and attention.\n  • *Usage & Frames:* 'Look at this', 'Watch a movie', 'I see a bird'.\n  • *Useful Phrases:* 'look for', 'look forward to', 'watch out', 'see you soon'.",
            "**4. Listen / Hear:** Listening and perception.\n  • *Usage & Frames:* 'Listen to music', 'Did you hear that?'.\n  • *Useful Phrases:* 'listen carefully', 'hear from', 'glad to hear that'.",
            "**5. Must / Have To:** Necessity and obligation.\n  • *Usage & Frames:* 'I must study', 'We have to leave now'.\n  • *Useful Phrases:* 'must be', 'have to go', 'don't have to'.",
            "**6. Take / Give / Get:** Exchange and receiving.\n  • *Usage & Frames:* 'Take a coat', 'Give me a hand', 'Get home'.\n  • *Useful Phrases:* 'take care', 'give up', 'get tired', 'get ready'.",
            "**7. Live:** Residence and lifestyle.\n  • *Usage & Frames:* 'I live in London', 'She lives with her family'.\n  • *Useful Phrases:* 'live abroad', 'live well', 'live together'.",
            "**8. Wait:** Patience and time.\n  • *Usage & Frames:* 'Wait for the bus', 'Can you wait a minute?'.\n  • *Useful Phrases:* 'wait for', 'wait in line', 'can't wait'.",

            "**9. Understand:** Comprehension.\n  • *Usage & Frames:* 'I understand', 'Do you understand me?'.\n  • *Useful Phrases:* 'make yourself understood', 'as I understand', 'fully understand'.",
            "**10. Ask / Answer:** Questions and answers.\n  • *Usage & Frames:* 'Ask a question', 'Answer the phone'.\n  • *Useful Phrases:* 'ask for help', 'answer questions', 'ask a favour'."
        ]
    },
    "fr": {
        "name": "French",
        "p1_title": "Les 10 verbes essentiels en français pour débutants (A0–A1 / A2)",
        "p2_title": "Les 10 verbes essentiels en français, Partie 2 (A0–A1 / A2)",
        "p1_kicker": "GUIDE DU FRANÇAIS — PARTIE 1 SUR 2",
        "p2_kicker": "GUIDE DU FRANÇAIS — PARTIE 2 SUR 2",
        "p1_dek": "Apprenez les 10 premiers verbes fondamentaux en français (être, avoir, penser, savoir/connaître, aimer, vouloir/aimerait, aller/futur proche, pouvoir, manger, boire). Conjugaisons consultables sur COSYtools.",
        "p2_dek": "Découvrez les 10 verbes suivants (faire, parler/dire, regarder/voir, écouter/entendre, devoir/falloir, prendre/donner/obtenir, vivre/habiter, attendre, comprendre, demander/répondre). Conjugaisons consultables sur COSYtools.",
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
            "**1. Faire:** Activités quotidiennes.\n  • *Phrases simples:* 'Faire du sport', 'Faire la cuisine', 'Faire les courses'.\n  • *Expressions:* 'faire attention', 'faire plaisir', 'faire du bien'.",
            "**2. Parler / Dire:** Communication.\n  • *Phrases simples:* 'Parler français', 'Dire la vérité', 'Dis-moi'.\n  • *Expressions:* 'parler de', 'dire bonjour', 'pour ainsi dire'.",
            "**3. Regarder / Voir:** Perception visuelle.\n  • *Phrases simples:* 'Regarder un film', 'Je vois un oiseau'.\n  • *Expressions:* 'regarder la télé', 'voyons voir', 'à voir'.",
            "**4. Écouter / Entendre:** Perception auditive.\n  • *Phrases simples:* 'Écouter de la musique', 'J'entends du bruit'.\n  • *Expressions:* 'écouter attentivement', 'entendre parler de'.",
            "**5. Devoir / Falloir:** Obligation.\n  • *Phrases simples:* 'Je dois étudier', 'Il faut partir'.\n  • *Expressions:* 'devoir faire', 'comme il faut', 'il faut absolument'.",
            "**6. Prendre / Donner / Obtenir:** Échanges.\n  • *Phrases simples:* 'Prendre le bus', 'Donner un cadeau'.\n  • *Expressions:* 'prendre soin', 'donner rendez-vous', 'prendre son temps'.",
            "**7. Vivre / Habiter:** Résidence.\n  • *Phrases simples:* 'J'habite à Paris', 'Vivre en paix'.\n  • *Expressions:* 'vivre à l'étranger', 'habiter près d'ici'.",
            "**8. Attendre:** Attente.\n  • *Phrases simples:* 'Attendre le bus', 'Attendez une minute'.\n  • *Expressions:* 'attendre avec impatience', 'en attendant'.",
            "**9. Comprendre:** Assimilation.\n  • *Phrases simples:* 'Je comprends la leçon', 'Vous comprenez ?'.\n  • *Expressions:* 'faire comprendre', 'bien comprendre'.",
            "**10. Demander / Répondre:** Questions et réponses.\n  • *Phrases simples:* 'Demander un service', 'Répondre au téléphone'.\n  • *Expressions:* 'demander de l'aide', 'répondre vite'."
        ]
    },
    "it": {
        "name": "Italian",
        "p1_title": "I 10 verbi essenziali in italiano per principianti (A0–A1 / A2)",
        "p2_title": "I 10 verbi essenziali in italiano, Parte 2 (A0–A1 / A2)",
        "p1_kicker": "GUIDA ALL'ITALIANO — PARTE 1 DI 2",
        "p2_kicker": "GUIDA ALL'ITALIANO — PARTE 2 DI 2",
        "p1_dek": "Impara i primi 10 verbi fondamentali della lingua italiana (essere, avere, pensare, sapere/conoscere, piacere, volere/vorrei, andare/stare per, potere, mangiare, bere). Coniugazioni consultabili su COSYtools.",
        "p2_dek": "Scopri i successivi 10 verbi essenziali (fare, parlare/dire, guardare/vedere, ascoltare/sentire, dovere/bisognare, prendere/dare, vivere/abitare, aspettare, capire, chiedere/rispondere). Coniugazioni consultabili su COSYtools.",
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
            "**5. Dovere / Bisognare:** Obbligo e necessità.\n  • *Frasi semplici:* 'Devo studiare', 'Bisogna partire ora'.\n  • *Frasi utili:* 'dovere fare', 'come si deve', 'bisogna stare attenti'.",
            "**6. Prendere / Dare:** Scambi.\n  • *Frasi semplici:* 'Prendere il treno', 'Dare un regalo'.\n  • *Frasi utili:* 'prendersi cura', 'dare un passaggio', 'prendere un caffè'.",
            "**7. Vivere / Abitare:** Residensa.\n  • *Frasi semplici:* 'Abito a Milano', 'Vivere in pace'.\n  • *Frasi utili:* 'vivere all'estero', 'abitare vicino'.",
            "**8. Aspettare:** Attesa.\n  • *Frasi semplici:* 'Aspettare l'autobus', 'Aspetta un momento'.\n  • *Frasi utili:* 'non vedere l'ora', 'aspettare in fila'.",
            "**9. Capire:** Comprensione.\n  • *Frasi semplici:* 'Capisco la lezione', 'Capisci cosa intendo?'.\n  • *Frasi utili:* 'farsi capire', 'capisco benissimo'.",
            "**10. Chiedere / Rispondere:** Domande e risposte.\n  • *Frasi semplici:* 'Chiedere un'informazione', 'Rispondere al telefono'.\n  • *Frasi utili:* 'chiedere aiuto', 'rispondere subito'."
        ]
    },
    "es": {
        "name": "Spanish",
        "p1_title": "Los 10 verbos esenciales en español para principiantes (A0–A1 / A2)",
        "p2_title": "Los 10 verbos esenciales en español, Parte 2 (A0–A1 / A2)",
        "p1_kicker": "GUÍA DE ESPAÑOL — PARTE 1 DE 2",
        "p2_kicker": "GUÍA DE ESPAÑOL — PARTE 2 DE 2",
        "p1_dek": "Aprende los primeros 10 verbos fundamentales en español (ser/estar, tener, pensar, saber/conocer, gustar, querer/gustaría, ir/ir a, poder, comer, beber). Conjugaciones consultables en COSYtools.",
        "p2_dek": "Descubre los siguientes 10 verbos clave (hacer, hablar/decir, mirar/ver, escuchar/oír, tener que/deber, tomar/dar, vivir, esperar, entender, preguntar/responder). Conjugaciones consultables en COSYtools.",
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
            "**1. Hacer:** Actividades cotidianas.\n  • *Frases sencillas:* 'Hacer los deberes', 'Hacer el desayuno', 'Hacer ejercicio'.\n  • *Frases útiles:* 'hacer falta', 'hacer el favor', 'hacer fotos'.",
            "**2. Hablar / Decir:** Comunicación.\n  • *Frases sencillas:* 'Hablar español', 'Decir la verdad', 'Dime'.\n  • *Frases útiles:* 'hablar de', 'decir que sí', 'por decir algo'.",
            "**3. Mirar / Ver:** Percepción visual.\n  • *Frases sencillas:* 'Mirar una película', 'Veo un pájaro'.\n  • *Frases útiles:* 'mirar la televisión', 'a ver', 'nos vemos'.",
            "**4. Escuchar / Oír:** Percepción auditiva.\n  • *Frases sencillas:* 'Escuchar música', 'Oigo un ruido'.\n  • *Frases útiles:* 'escuchar con atención', 'oír hablar de'.",
            "**5. Tener que / Deber:** Obligación.\n  • *Frases sencillas:* 'Tengo que estudiar', 'Debemos salir ya'.\n  • *Frases útiles:* 'tener que hacer', 'debería ser', 'hay que'.",
            "**6. Tomar / Dar:** Intercambios.\n  • *Frases sencillas:* 'Tomar el autobús', 'Dar un regalo'.\n  • *Frases útiles:* 'darse prisa', 'dar la mano', 'tomar un café'.",
            "**7. Vivir:** Residencia.\n  • *Frases sencillas:* 'Vivo en Madrid', 'Vivir bien'.\n  • *Frases útiles:* 'vivir en el extranjero', 'vivir juntos'.",
            "**8. Esperar:** Espera.\n  • *Frases sencillas:* 'Esperar el autobús', 'Espere un momento'.\n  • *Frases útiles:* 'esperar que', 'hacer cola', 'no ver la hora'.",
            "**9. Entender:** Comprensión.\n  • *Frases sencillas:* 'Entiendo la lección', '¿Entiendes lo que digo?'.\n  • *Frases útiles:* 'hacerse entender', 'entiendo perfectamente'.",
            "**10. Preguntar / Responder:** Preguntas y respuestas.\n  • *Frases sencillas:* 'Hacer una pregunta', 'Responder al teléfono'.\n  • *Frases útiles:* 'pedir ayuda', 'responder rápido'."
        ]
    },
    "de": {
        "name": "German",
        "p1_title": "Die 10 wichtigsten Verben im Deutschen für Anfänger (A0–A1 / A2)",
        "p2_title": "Die 10 wichtigsten Verben im Deutschen, Teil 2 (A0–A1 / A2)",
        "p1_kicker": "DEUTSCHER VERBEN-LEITFADEN — TEIL 1 VON 2",
        "p2_kicker": "DEUTSCHER VERBEN-LEITFADEN — TEIL 2 VON 2",
        "p1_dek": "Lernen Sie die ersten 10 Grundverben im Deutschen (sein, haben, denken, wissen/kennen, mögen/gefallen, wollen/möchte, gehen/werden, können, essen, trinken). Konjugationstabellen sind auf COSYtools abrufbar.",
        "p2_dek": "Entdecken Sie die nächsten 10 wichtigen Verben (machen/tun, sprechen/sagen, schauen/sehen, hören, müssen/sollen, nehmen/geben, wohnen/leben, warten, verstehen, fragen/antworten). Konjugationstabellen auf COSYtools.",
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
            "**1. Machen / Tun:** Aktivitäten.\n  • *Einfache Sätze:* 'Hausaufgaben machen', 'Was tust du?'.\n  • *Phrasen:* 'Freude machen', 'Sinn machen', 'Nichts zu tun'.",
            "**2. Sprechen / Sagen:** Kommunikation.\n  • *Einfache Sätze:* 'Deutsch sprechen', 'Die Wahrheit sagen', 'Sag mir Bescheid'.\n  • *Phrasen:* 'sprechen über', 'Hallo sagen', 'sozusagen'.",
            "**3. Schauen / Sehen:** Wahrnehmung.\n  • *Einfache Sätze:* 'Fernsehen schauen', 'Ich sehe einen Vogel'.\n  • *Phrasen:* 'Schau mal!', 'Ausschau halten', 'Bis später!'.",
            "**4. Hören:** Akustische Wahrnehmung.\n  • *Einfache Sätze:* 'Musik hören', 'Ich höre ein Geräusch'.\n  • *Phrasen:* 'zuhören', 'von jemandem hören'.",
            "**5. Müssen / Sollen:** Notwendigkeit und Pflicht.\n  • *Einfache Sätze:* 'Ich muss lernen', 'Du sollst schlafen'.\n  • *Phrasen:* 'muss sein', 'soll ich helfen?'.",
            "**6. Nehmen / Geben:** Austausch.\n  • *Einfache Sätze:* 'Den Bus nehmen', 'Ein Geschenk geben'.\n  • *Phrasen:* 'Rücksicht nehmen', 'Acht geben', 'Platz nehmen'.",
            "**7. Wohnen / Leben:** Wohnort.\n  • *Einfache Sätze:* 'Ich wohne in Berlin', 'Gut leben'.\n  • *Phrasen:* 'im Ausland leben', 'zusammenwohnen'.",
            "**8. Warten:** Geduld.\n  • *Einfache Sätze:* 'Auf den Bus warten', 'Warten Sie einen Moment'.\n  • *Phrasen:* 'warten auf', 'kaum erwarten können'.",
            "**9. Verstehen:** Verständnis.\n  • *Einfache Sätze:* 'Ich verstehe die Lektion', 'Verstehst du mich?'.\n  • *Phrasen:* 'sich verstehen', 'vollkommen verstehen'.",
            "**10. Fragen / Antworten:** Fragen und Antworten.\n  • *Einfache Sätze:* 'Eine Frage stellen', 'Auf die E-Mail antworten'.\n  • *Phrasen:* 'um Hilfe fragen', 'schnell antworten'."
        ]
    },
    "ru": {
        "name": "Russian",
        "p1_title": "Топ-10 главных глаголов русского языка для начинающих (A0–A1 / A2)",
        "p2_title": "Топ-10 главных глаголов русского языка, Часть 2 (A0–A1 / A2)",
        "p1_kicker": "ГИД ПО РУССКОМУ ЯЗЫКУ — ЧАСТЬ 1 ИЗ 2",
        "p2_kicker": "ГИД ПО РУССКОМУ ЯЗЫКУ — ЧАСТЬ 2 ИЗ 2",
        "p1_dek": "Освойте первые 10 базовых глаголов русского языка (быть, иметь/у меня есть, думать, знать, нравиться, хотеть/хотел бы, идти/ехать, мочь, есть, пить). Таблицы спряжения доступны на COSYtools.",
        "p2_dek": "Изучите следующие 10 глаголов (делать, говорить/сказать, смотреть/видеть, слушать/слышать, должен/надо, брать/давать, жить, ждать, понимать, спрашивать/отвечать). Таблицы спряжения на COSYtools.",
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
            "**1. Делать:** Действия.\n  • *Простые фразы:* 'Делать работу', 'Делать зарядку'.\n  • *Фразы:* 'делать всё возможное', 'что делать?', 'делать кофе'.",
            "**2. Говорить / Сказать:** Общение.\n  • *Простые фразы:* 'Говорить по-русски', 'Сказать правду', 'Скажи мне'.\n  • *Фразы:* 'говорить о', 'так сказать', 'сказать да'.",
            "**3. Смотреть / Видеть:** Восприятие.\n  • *Простые фразы:* 'Смотреть фильм', 'Я вижу птицу'.\n  • *Фразы:* 'смотреть телевизор', 'посмотрим', 'до встречи'.",
            "**4. Слушать / Слышать:** Слух.\n  • *Простые фразы:* 'Слушать музыку', 'Я слышу шум'.\n  • *Фразы:* 'слушай внимательно', 'рад слышать'.",
            "**5. Должен / Надо:** Обязанность.\n  • *Простые фразы:* 'Я должен учиться', 'Надо идти'.\n  • *Фразы:* 'так должно быть', 'мне надо'.",
            "**6. Брать / Давать:** Обмен.\n  • *Простые фразы:* 'Брать такси', 'Давать подарок'.\n  • *Фразы:* 'принимать решение', 'давать руку', 'получить ответ'.",
            "**7. Жить:** Проживание.\n  • *Простые фразы:* 'Я живу в Москве', 'Жить хорошо'.\n  • *Фразы:* 'жить за границей', 'жить вместе'.",
            "**8. Ждать:** Ожидание.\n  • *Простые фразы:* 'Ждать автобус', 'Подожди минуту'.\n  • *Фразы:* 'не могу дождаться', 'ждать в очереди'.",
            "**9. Понимать:** Понимание.\n  • *Простые фразы:* 'Я понимаю урок', 'Ты понимаешь меня?'.\n  • *Фразы:* 'так сказать', 'прекрасно понимаю'.",
            "**10. Спрашивать / Отвечать:** Вопросы и ответы.\n  • *Простые фразы:* 'Задать вопрос', 'Ответить на звонок'.\n  • *Фразы:* 'просить о помощи', 'быстро ответить'."
        ]
    },
    "el": {
        "name": "Greek",
        "p1_title": "Τα 10 Βασικά Ρήματα στην Ελληνική Γλώσσα για Αρχάριους (A0–A1 / A2)",
        "p2_title": "Τα 10 Βασικά Ρήματα στην Ελληνική Γλώσσα, Μέρος 2 (A0–A1 / A2)",
        "p1_kicker": "ΟΔΗΓΟΣ ΕΛΛΗΝΙΚΩΝ — ΜΕΡΟΣ 1 ΑΠΟ 2",
        "p2_kicker": "ΟΔΗΓΟΣ ΕΛΛΗΝΙΚΩΝ — ΜΕΡΟΣ 2 ΑΠΟ 2",
        "p1_dek": "Μάθετε τα πρώτα 10 βασικά ρήματα (είμαι, έχω, σκέφτομαι, ξέρω/γνωρίζω, μου αρέσει, θέλω/θα ήθελα, πηγαίνω/θα πάω, μπορώ, τρώω, πίνω). Πίνακες κλίσης στο COSYtools.",
        "p2_dek": "Ανακαλύψτε τα επόμενα 10 βασικά ρήματα (κάνω/φτιάχνω, μιλώ/λέω, κοιτάζω/βλέπω, ακούω, πρέπει, παίρνω/δίνω, ζω/μένω, περιμένω, καταλαβαίνω, ρωτώ/απαντώ). Πίνακες κλίσης στο COSYtools.",
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
            "**5. Πρέπει:** Υποχρέωση.\n  • *Απλές προτάσεις:* 'Πρέπει να διαβάσω', 'Πρέπει να φύγουμε'.\n  • *Εκφράσεις:* 'όπως πρέπει', 'πρέπει να'.",
            "**6. Παίρνω / Δίνω:** Ανταλλαγή.\n  • *Απλές προτάσεις:* 'Παίρνω το λεωφορείο', 'Δίνω ένα δώρο'.\n  • *Εκφράσεις:* 'παίρνω χρόνο', 'δίνω το χέρι'.",
            "**7. Μένω / Ζω:** Κατοικία.\n  • *Απλές προτάσεις:* 'Μένω στην Αθήνα', 'Ζω καλά'.\n  • *Εκφράσεις:* 'ζω στο εξωτερικό', 'μένουμε μαζί'.",
            "**8. Περιμένω:** Αναμονή.\n  • *Απλές προτάσεις:* 'Περιμένω το λεωφορείο', 'Περίμενε ένα λεπτό'.\n  • *Εκφράσεις:* 'περιμένω στη σειρά', 'ανυπομονώ'.",
            "**9. Καταλαβαίνω:** Κατανόηση.\n  • *Απλές προτάσεις:* 'Καταλαβαίνω το μάθημα', 'Καταλαβαίνεις;'.\n  • *Εκφράσεις:* 'καταλαβαίνω απόλυτα'.",
            "**10. Ρωτώ / Απαντώ:** Ερωτήσεις.\n  • *Απλές προτάσεις:* 'Κάνω μια ερώτηση', 'Απαντώ στο τηλέφωνο'.\n  • *Εκφράσεις:* 'ζητώ βοήθεια', 'απαντώ αμέσως'."
        ]
    },
    "tt": {
        "name": "Tatar",
        "p1_title": "Татар теле буенча иң мөһим 10 фигыль (A0–A1 / A2)",
        "p2_title": "Татар теле буенча иң мөһим 10 фигыль, 2 өлеш (A0–A1 / A2)",
        "p1_kicker": "ТАТАР ТЕЛЕ МӘГАРИФЕ — 1 ӨЛЕШ (БАРЛЫҒЫ 2 ӨЛЕШ)",
        "p2_kicker": "ТАТАР ТЕЛЕ МӘГАРИФЕ — 2 ӨЛЕШ (БАРЛЫҒЫ 2 ӨЛЕШ)",
        "p1_dek": "Алдан килгән 10 төп фигыльне өйрәнегез (булу, бар/минем бар, уйлау, белү, ярату/ошату, теләү, бару, булдыру, ашау, эчү). Фигыльләрне төрләндерү җадвәле COSYtools битендә.",
        "p2_dek": "Киләсе 10 мөһим фигыль (эшләү, сөйләү/әйтү, карау/күрү, тыңлау/ишетү, кирәк/тиеш, алу/бирү, яшәү, көтү, аңлау, сорау/җавап бирү). Төрләндерү җадвәле COSYtools битендә.",
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
            "**2. Сөйләү / Әйтү:** Сөйләшү (*Татарча сөйләшү*).",
            "**3. Карау / Күрү:** Игътибар (*Фильм карау*).",
            "**4. Тыңлау / Ишетү:** Тыңлау (*Музыка тыңлау*).",
            "**5. Кирәк / Тиеш:** Зарурилык (*Миңа өйрәнергә кирәк*).",
            "**6. Алу / Бирү:** Алмашу (*Китап алу*).",
            "**7. Яшәү:** Яшәү урыны (*Мин Казанда яшим*).",
            "**8. Көтү:** Көтү (*Автобус көтү*).",
            "**9. Аңлау:** Аңлау (*Мин аңлыйм*).",
            "**10. Сорау / Җавап бирү:** Сорау бирү (*Сорау бирү*)."
        ]
    },
    "ba": {
        "name": "Bashkir",
        "p1_title": "Башҡорт теле буйынса иң мөһим 10 ҡылым (A0–A1 / A2)",
        "p2_title": "Башҡорт теле буйынса иң мөһим 10 ҡылым, 2-се өлөш (A0–A1 / A2)",
        "p1_kicker": "БАШҠОРТ ТЕЛЕ МӘҒАРИФЫ — 1-СЕ ӨЛӨШ (БАРАЛЫҒЫ 2 ӨЛӨШ)",
        "p2_kicker": "БАШҠОРТ ТЕЛЕ МӘҒАРИФЫ — 2-СЕ ӨЛӨШ (БАРАЛЫҒЫ 2 ӨЛӨШ)",
        "p1_dek": "Төп 10 ҡылымды өйрәнегеҙ (булыу, бар/минең бар, уйлау, белеү, яратыу, теләү, барыу, булдырыу, ашау, эсеү). Ҡылымдарҙы үҙгәртеү таблицалары COSYtools битендә.",
        "p2_dek": "Киләһе 10 мөһим ҡылым (эшләү, һөйләү/әйтеү, ҡарау/күреү, тыңлау/ишетеү, кәрәк/тәйеш, алыу/биреү, йәшәү, көтөү, аңлау, һорау/яуап биреү). COSYtools битендә таблицалар.",
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
            "**1. Эшләү / Яһау:** Эш (*Эш эшләү*).",
            "**2. Һөйләү / Әйтеү:** Һөйләшеү (*Һөйләшеү*).",
            "**3. Ҡарау / Күреү:** Ҡарау (*Кино ҡарау*).",
            "**4. Тыңлау / Ишетеү:** Тыңлау (*Музыка тыңлау*).",
            "**5. Кәрәк / Тиеш:** Зарурилыҡ (*Кәрәк*).",
            "**6. Алыу / Биреү:** Алмашыу (*Китап алыу*).",
            "**7. Йәшәү:** Йәшәү (*Өфөлә йәшәйем*).",
            "**8. Көтөү:** Көтөү (*Көтөү*).",
            "**9. Аңлау:** Аңлау (*Аңлайым*).",
            "**10. Һорау / Яуап биреү:** Һорау (*Һорау биреү*)."
        ]
    },
    "br": {
        "name": "Breton",
        "p1_title": "Ar 10 verb pennañ e brezhoneg evit ar re dhazerañ (A0–A1 / A2)",
        "p2_title": "Ar 10 verb pennañ e brezhoneg, Rann 2 (A0–A1 / A2)",
        "p1_kicker": "KAVLEVR BREZHONEG — RANN 1 EUS 2",
        "p2_kicker": "KAVLEVR BREZHONEG — RANN 2 EUS 2",
        "p1_dek": "Deskit ar 10 verb pennañ e brezhoneg (bezañ, kaout, meizañ/soñjal, gouzout, plijout, c'hoant kaout, mont, gallout, debriñ, evañ). Taolennoù conjugazhon war COSYtools.",
        "p2_dek": "Deskit an 10 verb war-lerc'h (ober, komz/lavarout, sellet/gwelout, selaou/klevout, rankout, kemer/rein, bevañ, gortoz, meizañ, goulenn/respont). Taolennoù war COSYtools.",
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
            "**2. Komz / Lavarout:** Komz (*Komz brezhoneg*).",
            "**3. Sellet / Gwelout:** Sellet (*Sellet ouzh ur film*).",
            "**4. Selaou / Klevout:** Selaou (*Selaou sonerezh*).",
            "**5. Rankout:** Retiez (*Rankout a ran*).",
            "**6. Kemer / Rein:** Eskemm (*Kemer ur banne*).",
            "**7. Bevañ / Chom:** Bevañ (*Bevañ e Roazhon*).",
            "**8. Gortoz:** Gortoz (*Gortoz*).",
            "**9. Meizañ:** Meizañ (*Kompren a ran*).",
            "**10. Goulenn / Respont:** Goulenn (*Goulenn ur gaoz*)."
        ]
    },
    "pt": {
        "name": "Portuguese",
        "p1_title": "Os 10 verbos essenciais em português para principiantes (A0–A1 / A2)",
        "p2_title": "Os 10 verbos essenciais em português, Parte 2 (A0–A1 / A2)",
        "p1_kicker": "GUIA DE PORTUGUÊS — PARTE 1 DE 2",
        "p2_kicker": "GUIA DE PORTUGUÊS — PARTE 2 DE 2",
        "p1_dek": "Aprenda os primeiros 10 verbos fundamentais em português (ser/estar, ter, pensar, saber/conhecer, gostar, querer/gostaria, ir/ir a, poder, comer, beber). Tabelas de conjugação no COSYtools.",
        "p2_dek": "Descubra os 10 verbos seguintes (fazer, falar/dizer, olhar/ver, ouvir/escutar, ter de/dever, tomar/dar, viver/morar, esperar, entender, perguntar/responder). Tabelas no COSYtools.",
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
            "**1. Fazer:** Atividades (*Fazer os TPC*).",
            "**2. Falar / Dizer:** Comunicação (*Falar português*).",
            "**3. Olhar / Ver:** Atenção visual (*Olhar para um filme*).",
            "**4. Ouvir / Escutar:** Audição (*Ouvir música*).",
            "**5. Ter de / Dever:** Obrigação (*Tenho de estudar*).",
            "**6. Tomar / Dar:** Troca (*Tomar um café*).",
            "**7. Morar / Viver:** Residência (*Moro em Lisboa*).",
            "**8. Esperar:** Paciência (*Esperar o autocarro*).",
            "**9. Entender / Compreender:** Compreensão (*Entendo a lição*).",
            "**10. Perguntar / Responder:** Perguntas (*Fazer uma pergunta*)."
        ]
    },
    "hy": {
        "name": "Armenian",
        "p1_title": "Հայերենի 10 հիմնական բայերը սկսնակների համար (A0–A1 / A2)",
        "p2_title": "Հայերենի 10 հիմնական բայերը, Մաս 2 (A0–A1 / A2)",
        "p1_kicker": "ՀԱՅԵՐԵՆԻ ՈՒՂԵՑՈՒՅՑ — ՄԱՍ 1 (ԸՆԴՀԱՆՈՒՐ 2 ՄԱՍ)",
        "p2_kicker": "ՀԱՅԵՐԵՆԻ ՈՒՂԵՑՈՒՅՑ — ՄԱՍ 2 (ԸՆԴՀԱՆՈՒՐ 2 ՄԱՍ)",
        "p1_dek": "Սովորեք առաջին 10 հիմնական բայերը (լինել, ունենալ, մտածել, իմանալ, սիրել, ուզենալ, գնալ, կարողանալ, ուտել, խմել)։ Խոնարհման աղյուսակները հասանելի են COSYtools-ում։",
        "p2_dek": "Բացահայտեք հաջորդ 10 բայերը (անել, խոսել/ասել, նայել/տեսնել, լսել, պետք է, վերցնել/տալ, ապրել, սպասել, հասկանալ, հարցնել/պատասխանել)։ Աղյուսակները COSYtools-ում։",
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
            "**1. Անել:** Գործեր (*Անել դասերը*).",
            "**2. Խոսել / Ասել:** Հաղորդակցություն (*Խոսել հայերեն*).",
            "**3. Նայել / Տեսնել:** Ուշադրություն (*Նայել ֆիլմ*).",
            "**4. Լսել:** Լսողություն (*Երաժշտություն լսել*).",
            "**5. Պետք է:** Անհրաժեշտություն (*Ես պետք է սովորեմ*).",
            "**6. Վերցնել / Տալ:** Փոխանակում (*Սուրճ վերցնել*).",
            "**7. Ապրել:** Բնակություն (*Ես ապրում եմ Երևանում*).",
            "**8. Սպասել:** Սպասում (*Սպասել ավտոբուսին*).",
            "**9. Հասկանալ:** Ըմբռնում (*Ես հասկանում եմ*).",
            "**10. Հարցնել / Պատասխանել:** Հարցեր (*Հարց տալ*)."
        ]
    },
    "ka": {
        "name": "Georgian",
        "p1_title": "10 ძირითადი ზმნა ქართულ ენაში დამწყებთათვის (A0–A1 / A2)",
        "p2_title": "10 ძირითადი ზმნა ქართულ ენაში, ნაწილი 2 (A0–A1 / A2)",
        "p1_kicker": "ქართული ენის სახელმძღვანელო — ნაწილი 1 (სულ 2 ნაწილი)",
        "p2_kicker": "ქართული ენის სახელმძღვანელო — ნაწილი 2 (სულ 2 ნაწილი)",
        "p1_dek": "ისწავლეთ პირველი 10 ძირითადი ზმნა (ყოფნა, ქონა/ყოლიება, ფიქრი, ცოდნა, მოწონება, ნდომა, წასვლა, შეძლება, ჭამა, დალევა). უღვლილების ცხრილები იხილეთ COSYtools-ზე.",
        "p2_dek": "გაეცანით შემდეგ 10 ზმნას (კეთება, ლაპარაკი/თქმა, ყურება/ნახვა, მოსმენა, უნდა/საჭიროა, აღება/მიცემა, ცხოვრება, ლოდინი, გაგება, კითხვა/პასუხი). ცხრილები COSYtools-ზე.",
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
            "**1. კეთება:** საქმე (*საქმის კეთება*).",
            "**2. ლაპარაკი / თქმა:** კომუნიკაცია (*ქართულად ლაპარაკი*).",
            "**3. ყურება / ნახვა:** ყურადღება (*ფილმის ყურება*).",
            "**4. მოსმენა:** სმენა (*მუსიკის მოსმენა*).",
            "**5. უნდა / საჭიროა:** აუცილებლობა (*მე უნდა ვისწავლო*).",
            "**6. აღება / მიცემა:** გაცვლა (*ყავის აღება*).",
            "**7. ცხოვრება:** საცხოვრებელი (*ვცხოვრობ თბილისში*).",
            "**8. ლოდინი:** ლოდინი (*ავტობუსის ლოდინი*).",
            "**9. გაგება:** გაგება (*მესმის გაკვეთილი*).",
            "**10. კითხვა / პასუხი:** კითხვა (*კითხვის დასმა*)."
        ]
    },
    "cv": {
        "name": "Chuvash",
        "p1_title": "Чăваш чĕлхинчи чи кирлĕ 10 глагол (A0–A1 / A2)",
        "p2_title": "Чăваш чĕлхинчи чи кирлĕ 10 глагол, 2-мĕш пай (A0–A1 / A2)",
        "p1_kicker": "ЧĂВАШ ЧĔЛХИН СУМЛĂ ГИДĔ — 1-МĔШ ПАЙ (ПĔТĔМПЕ 2 ПАЙ)",
        "p2_kicker": "ЧĂВАШ ЧĔЛХИН СУМЛĂ ГИДĔ — 2-МĔШ ПАЙ (ПĔТĔМПЕ 2 ПАЙ)",
        "p1_dek": "Тĕп 10 глагола вĕренĕр (пулма, пур/манăн пур, шухăшлама, пĕлме, кăмăллама, тăвас килме, кайма, пултарасси, çеме, ĕçме). Спряжени таблицисем COSYtools битенче.",
        "p2_dek": "Малалла 10 кирлĕ глагол (тăвасси, калаçасси/каласси, пăхасси/курасси, итлесси/ишитесси, кирлĕ, илесси/парасси, пурăнасси, кĕтесси, ăнланасси, ыйтасси/хуравламалли). Спряжени COSYtools битенче.",
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
            "**1. Тăвасси:** Ĕçсем (*Ĕç тăвасси*).",
            "**2. Калаçасси / Каласси:** Калаçу (*Чăвашла калаçасси*).",
            "**3. Пăхасси / Курасси:** Асăрхаса пăхасси (*Фильм пăхасси*).",
            "**4. Итлесси / Ишитесси:** Итлесси (*Музыка итлесси*).",
            "**5. Кирлĕ:** Ыйтни (*Мана кирлĕ*).",
            "**6. Илесси / Парасси:** Улмаш (*Кĕнеке илесси*).",
            "**7. Пурăнасси:** Вырăн (*Пурăнатăп*).",
            "**8. Кĕтесси:** Кĕтесси (*Кĕтесси*).",
            "**9. Ăнланасси:** Ăнланасси (*Ăнланатăп*).",
            "**10. Ыйтасси / Хуравламалли:** Ыйту (*Ыйту парасси*)."
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
        if code == "en" and not is_part_2:
            continue
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

        if False:
            pass
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(post_obj, f, ensure_ascii=False, indent=2)

print("All JSON posts updated successfully with 2-part references, A0-A1/A2 level adaptation, and COSYtools conjugation notes!")
