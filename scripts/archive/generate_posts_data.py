import json
import os

languages = {
    "en": {
        "name": "English",
        "flag": "🇬🇧",
        "p1_kicker": "ENGLISH CORE GUIDE",
        "p2_kicker": "ENGLISH CORE GUIDE — PART 2",
        "p1_title": "Top 10 Essential Verbs in English for Absolute Beginners (A0–A1)",
        "p2_title": "Top 10 Essential Verbs in English, Part 2 (CEFR A0–A1)",
        "p1_dek": "Master the 10 most high-frequency verbs in English with A0–A1 adapted conjugations, collocations, false-friend warnings, and a 14-language comparative matrix.",
        "p2_dek": "Part 2 of the ultimate beginner guide to high-frequency English verbs (A0–A1): do/make, speak/talk/say/tell, look/watch/see, listen/hear, must/have to, take/give/get, live, wait, understand, and ask/answer.",
        "p1_intro": "Welcome to the essential guide to high-frequency English verbs for absolute beginners (A0–A1)! Mastering these core verbs will unlock over 80% of daily conversations.",
        "p2_intro": "Welcome to Part 2 of our English verb guide for A0–A1 learners! In this edition, we explore 10 vital action, perception, and communication verbs.",
        "hub_link_text": "📌 Compare all 14 languages in our Central Hub or revisit Part 1.",
        "hub_link_p2": "📌 Compare all 14 languages in our Central Hub (Part 2) or revisit Part 1.",
        "family_heading": "💡 Family Nuances & Grammatical Highlights",
        "family_ie": "Indo-European (Romance, Germanic, Slavic, Hellenic, Celtic, Armenian): Tense systems and auxiliary verbs structure time and aspect.",
        "family_turkic": "Turkic (Tatar, Bashkir, Chuvash): Agglutinative suffixes denote person, tense, and mood without separate auxiliary words.",
        "family_kartvelian": "Kartvelian (Georgian): Ergative alignment and polypersonal verbal markers express subject and object together.",
        "practice_link": "Practice Drills in COSYpractice ↗",
        "tools_link": "Verb Tables in COSYtools ↗",
        "p1_verbs": [
            "**1. To Be (am / is / are):** Identity & location (*I am a student*, *He is at home*).",
            "**2. To Have (have / has):** Possession & age (*I have a book*, *She has 20 years* - in English: *She is 20*).",
            "**3. To Do / To Make:** Action & creation (*Do homework*, *Make coffee*).",
            "**4. To Go (go / goes):** Movement & direction (*I go to work*).",
            "**5. To Come (come / comes):** Direction toward speaker (*Come here, please*).",
            "**6. To Say / To Tell:** Communication (*Say hello*, *Tell a story*).",
            "**7. To See / To Look:** Visual perception (*I see a bird*, *Look at this*).",
            "**8. To Know:** Factual knowledge & familiarity (*I know the answer*).",
            "**9. To Want:** Desire & requests (*I want water*).",
            "**10. To Like:** Preferences & enjoyment (*I like tea*)."
        ],
        "p2_verbs": [
            "**1. Do / Make:** Activity vs Creation (*I do homework*, *I make coffee*).",
            "**2. Speak / Talk / Say / Tell:** Communication nuances (*I speak English*, *Tell me*).",
            "**3. Look / Watch / See:** Visual perception (*Watch a film*, *I see a house*).",
            "**4. Listen / Hear:** Auditory attention vs involuntary hearing (*Listen to music*, *I hear a sound*).",
            "**5. Must / Have to:** Expressing obligation and necessity (*I must go*, *I have to work*).",
            "**6. Take / Give / Get:** Exchange & receiving (*Take a coffee*, *Give me a book*, *Get a present*).",
            "**7. Live:** Residence & life (*I live in London*).",
            "**8. Wait:** Patience & expectation (*Wait for the bus*).",
            "**9. Understand:** Comprehension (*I understand*, *I don't understand*).",
            "**10. Ask / Answer & Want / Would like:** Inquiries and polite requests (*Ask a question*, *I would like a tea*)."
        ]
    },
    "fr": {
        "name": "French",
        "flag": "🇫🇷",
        "p1_kicker": "GUIDE DU FRANÇAIS — PARTIE 1",
        "p2_kicker": "GUIDE DU FRANÇAIS — PARTIE 2",
        "p1_title": "Les 10 verbes essentiels en français pour débutants (CEFR A0–A1)",
        "p2_title": "Les 10 verbes essentiels en français, Partie 2 (CEFR A0–A1)",
        "p1_dek": "Maîtrisez les 10 verbes les plus fréquents en français avec leurs conjugaisons A0–A1, leurs collocations et un tableau comparatif en 14 langues.",
        "p2_dek": "Deuxième partie du guide essentiel des verbes français pour débutants (A0–A1) : faire, parler/dire, regarder/voir, écouter/entendre, devoir/falloir, prendre/donner, vivre/habiter, attendre, comprendre et demander/répondre.",
        "p1_intro": "Bienvenue dans le guide des verbes français essentiels pour le niveau A0–A1 ! La maîtrise de ces 10 verbes clés vous permettra d'exprimer l'essentiel de vos besoins quotidiens.",
        "p2_intro": "Bienvenue dans la deuxième partie du guide des verbes français pour le niveau A0–A1 ! En ce mois de décembre, nous explorons 10 nouveaux verbes fondamentaux d'action, de perception et d'échange.",
        "hub_link_text": "📌 Comparez les 14 langues dans notre Hub Central ou consultez la Partie 2.",
        "hub_link_p2": "📌 Comparez les 14 langues dans notre Hub Central (Partie 2) ou revenez au Guide Français (Partie 1).",
        "family_heading": "💡 Nuances familiales et points grammaticaux",
        "family_ie": "Indo-européen (romance, germanique, slave, hellénique, celtique, arménien) : Les systèmes de temps et les auxiliaires structurent l'aspect et la chronologie.",
        "family_turkic": "Famille turcique (tatar, bachkir, tchouvache) : Les suffixes agglutinants expriment la personne et le temps sans auxiliaires séparés.",
        "family_kartvelian": "Famille kartvélienne (géorgien) : Alignement ergatif et marqueurs verbaux polypersonnels.",
        "practice_link": "Exercices pratiques dans COSYpractice ↗",
        "tools_link": "Tables de verbes dans COSYtools ↗",
        "p1_verbs": [
            "**1. Être (suis, es, est, sommes, êtes, sont) :** Identité et localisation (*Je suis étudiant*, *Il est à la maison*).",
            "**2. Avoir (ai, as, a, avons, avez, ont) :** Possession et âge (*J'ai un livre*, *J'ai 20 ans*).",
            "**3. Faire (fais, fait, faisons, faites, font) :** Activités et création (*Faire du sport*, *Faire un gâteau*).",
            "**4. Aller (vais, vas, va, allons, allez, vont) :** Déplacement et futur proche (*Je vais au travail*, *Je vais manger*).",
            "**5. Venir (viens, vient, venons, venez, viennent) :** Provenance (*Je viens de Paris*).",
            "**6. Dire (dis, dit, disons, dites, disent) :** Communication (*Dire bonjour*, *Dire la vérité*).",
            "**7. Voir / Regarder :** Perception visuelle (*Je vois la mer*, *Je regarde un film*).",
            "**8. Savoir / Connaître :** Savoir factuel et connaissance (*Je sais*, *Je connais Marie*).",
            "**9. Vouloir (veux, veut, voulons, voulez, veulent) :** Désir et politesse (*Je voudrais un café*).",
            "**10. Aimer :** Goûts et préférences (*J'aime le chocolat*)."
        ],
        "p2_verbs": [
            "**1. Faire :** Activités et création (*Je fais les devoirs*, *Faire du café*).",
            "**2. Parler / Dire :** Communication (*Je parle français*, *Dites-moi*).",
            "**3. Regarder / Voir :** Perception visuelle (*Regarder un film*, *Je vois une maison*).",
            "**4. Écouter / Entendre :** Perception auditive (*Écouter de la musique*, *J'entends un bruit*).",
            "**5. Devoir / Falloir :** Obligation et nécessité (*Je dois partir*, *Il faut travailler*).",
            "**6. Prendre / Donner :** Échange (*Prendre un café*, *Donner un cadeau*).",
            "**7. Habiter / Vivre :** Résidence (*J'habite à Paris*, *Vivre en France*).",
            "**8. Attendre :** Patienter (*J'attends le bus*).",
            "**9. Comprendre :** Compréhension (*Je comprends*, *Je ne comprends pas*).",
            "**10. Demander / Répondre & Vouloir / Je voudrais :** Demandes et politesse (*Poser une question*, *Je voudrais un thé*)."
        ]
    },
    "it": {
        "name": "Italian",
        "flag": "🇮🇹",
        "p1_kicker": "GUIDA ALL'ITALIANO — PARTE 1",
        "p2_kicker": "GUIDA ALL'ITALIANO — PARTE 2",
        "p1_title": "I 10 verbi essenziali in italiano per principianti (CEFR A0–A1)",
        "p2_title": "I 10 verbi essenziali in italiano, Parte 2 (CEFR A0–A1)",
        "p1_dek": "Impara i 10 verbi italiani ad altissima frequenza con coniugazioni A0–A1, collocazioni utili e tabella comparativa in 14 lingue.",
        "p2_dek": "La seconda parte della guida ai verbi italiani ad alta frequenza per principianti (A0–A1): fare, parlare/dire, guardare/vedere, ascoltare/sentire, dovere/bisognare, prendere/dare, vivere/abitare, aspettare, capire e chiedere/rispondere.",
        "p1_intro": "Benvenuti nella guida ai verbi essenziali della lingua italiana per il livello A0–A1! Dominare questi 10 verbi apre la strada alla comunicazione quotidiana.",
        "p2_intro": "Benvenuti alla seconda parte della guida ai verbi italiani per principianti (A0–A1)! Esploriamo 10 nuovi verbi fondamentali per esprimere azioni, percezioni e conversazioni.",
        "hub_link_text": "📌 Confronta le 14 lingue nel nostro Hub Centrale o consulta la Parte 2.",
        "hub_link_p2": "📌 Confronta le 14 lingue nel nostro Hub Centrale (Parte 2) o torna alla Guida all'Italiano (Parte 1).",
        "family_heading": "💡 Sfumature linguistiche e aspetti grammaticali",
        "family_ie": "Indoeuropeo (Romanzo, Germanico, Slavo, Ellenico, Celtico, Armeno): Tempi e ausiliari strutturano l'aspetto verbale.",
        "family_turkic": "Famiglia turchica (tataro, baschiro, ciuvascio): Suffissi agglutinanti senza ausiliari separati.",
        "family_kartvelian": "Famiglia kartvelica (georgiano): Allineamento ergativo e marcatori polipersonali.",
        "practice_link": "Esercizi pratici su COSYpractice ↗",
        "tools_link": "Tabelle dei verbi su COSYtools ↗",
        "p1_verbs": [
            "**1. Essere (sono, sei, è, siamo, siete, sono):** Identità e stato (*Sono studente*, *È a casa*).",
            "**2. Avere (ho, hai, ha, abbiamo, avete, hanno):** Possesso ed età (*Ho un libro*, *Ho 20 anni*).",
            "**3. Fare (faccio, fai, fa, facciamo, fate, fanno):** Attività e creazione (*Fare la spesa*, *Fare il caffè*).",
            "**4. Andare (vado, vai, va, andiamo, andate, vanno):** Movimento (*Vado a lavoro*).",
            "**5. Venire (vengo, vieni, viene, veniamo, venite, vengono):** Provenienza (*Vengo da Roma*).",
            "**6. Dire (dico, dici, dice, diciamo, dite, dicono):** Comunicazione (*Dire la verità*).",
            "**7. Vedere / Guardare:** Percezione visiva (*Vedo un gelato*, *Guardo la TV*).",
            "**8. Sapere / Conoscere:** Conoscenza e familiarità (*So la risposta*, *Conosco Luca*).",
            "**9. Volere (voglio, vuoi, vuole, vogliamo, volete, vogliono):** Desiderio (*Vorrei un caffè*).",
            "**10. Piacere:** Preferenze (*Mi piace la pizza*)."
        ],
        "p2_verbs": [
            "**1. Fare:** Attività quotidiane e creazione (*Faccio i compiti*).",
            "**2. Parlare / Dire:** Comunicazione (*Parlo italiano*, *Dimmi*).",
            "**3. Guardare / Vedere:** Percezione visiva (*Guardare un film*, *Vedo una casa*).",
            "**4. Ascoltare / Sentire:** Percezione uditiva (*Ascoltare la musica*, *Sento un rumore*).",
            "**5. Dovere / Bisognare:** Obbligo e necessità (*Devo andare*, *Bisogna studiare*).",
            "**6. Prendere / Dare:** Scambio (*Prendere un caffè*, *Dare un libro*).",
            "**7. Abitare / Vivere:** Residenza (*Abito a Milano*, *Vivere bene*).",
            "**8. Aspettare:** Pazienza (*Aspetto l'autobus*).",
            "**9. Capire:** Comprensione (*Capisco*, *Non capisco*).",
            "**10. Chiedere / Rispondere & Volere / Vorrei:** Domande e cortesia (*Chiedere un'informazione*, *Vorrei un tè*)."
        ]
    },
    "es": {
        "name": "Spanish",
        "flag": "🇪🇸",
        "p1_kicker": "GUÍA DE ESPAÑOL — PARTE 1",
        "p2_kicker": "GUÍA DE ESPAÑOL — PARTE 2",
        "p1_title": "Los 10 verbos esenciales en español para principiantes (CEFR A0–A1)",
        "p2_title": "Los 10 verbos esenciales en español, Parte 2 (CEFR A0–A1)",
        "p1_dek": "Aprende los 10 verbos más frecuentes en español con conjugaciones adaptadas a A0–A1, colocaciones y tabla comparativa de 14 idiomas.",
        "p2_dek": "Segunda parte de la guía esencial de verbos en español para principiantes (A0–A1): hacer, hablar/decir, mirar/ver, escuchar/oír, tener que/deber, tomar/dar, vivir, esperar, entender y preguntar/responder.",
        "p1_intro": "¡Bienvenidos a la guía de verbos esenciales en español para nivel A0–A1! Dominar estos 10 verbos te permitirá desenvolverte en situaciones cotidianas.",
        "p2_intro": "¡Bienvenidos a la segunda parte de la guía de verbos en español para principiantes (A0–A1)! Presentamos 10 nuevos verbos clave para la vida diaria.",
        "hub_link_text": "📌 Compara los 14 idiomas en nuestro Hub Central o consulta la Parte 2.",
        "hub_link_p2": "📌 Compara los 14 idiomas en nuestro Hub Central (Parte 2) o vuelve a la Guía de Español (Parte 1).",
        "family_heading": "💡 Matices lingüísticos y aspectos gramaticales",
        "family_ie": "Indoeuropeo (romance, germánico, eslavo, helénico, céltico, armenio): Sistemas de tiempos y auxiliares.",
        "family_turkic": "Familia turca (tártaro, bashkir, chuvash): Sufijos aglutinantes sin auxiliares independientes.",
        "family_kartvelian": "Familia kartveliana (georgiano): Alineación ergativa y marcadores polipersonales.",
        "practice_link": "Ejercicios prácticos en COSYpractice ↗",
        "tools_link": "Tablas de verbos en COSYtools ↗",
        "p1_verbs": [
            "**1. Ser / Estar:** Identidad y ubicación (*Soy estudiante*, *Estoy en casa*).",
            "**2. Tener (tengo, tienes, tiene...):** Posesión y edad (*Tengo un libro*, *Tengo 20 años*).",
            "**3. Hacer (hago, haces, hace...):** Actividades (*Hacer la tarea*, *Hacer café*).",
            "**4. Ir (voy, vas, va...):** Movimiento y futuro cercano (*Voy al trabajo*, *Voy a comer*).",
            "**5. Venir (vengo, vienes, viene...):** Procedencia (*Vengo de Madrid*).",
            "**6. Decir (digo, dices, dice...):** Comunicación (*Decir la verdad*).",
            "**7. Ver / Mirar:** Percección visual (*Veo una película*, *Mira esto*).",
            "**8. Saber / Conocer:** Información y familiaridad (*Sé la respuesta*, *Conozco a Juan*).",
            "**9. Querer (quiero, quieres...):** Deseo y cortesía (*Quisiera un agua*).",
            "**10. Gustar:** Expresar gustos (*Me gusta la música*)."
        ],
        "p2_verbs": [
            "**1. Hacer:** Actividades y creación (*Hago los deberes*).",
            "**2. Hablar / Decir:** Comunicación (*Hablo español*, *Dime*).",
            "**3. Mirar / Ver:** Percepción visual (*Mirar un vídeo*, *Veo una casa*).",
            "**4. Escuchar / Oír:** Percepción auditiva (*Escuchar música*, *Oigo un ruido*).",
            "**5. Tener que / Deber:** Obligación (*Tengo que estudiar*).",
            "**6. Tomar / Dar:** Intercambio (*Tomar un café*, *Dar un regalo*).",
            "**7. Vivir:** Residencia (*Vivo en Barcelona*).",
            "**8. Esperar:** Paciencia (*Espero el autobús*).",
            "**9. Entender / Comprender:** Comprensión (*Entiendo*, *No entiendo*).",
            "**10. Preguntar / Responder & Querer / Me gustaría:** Preguntas y cortesía (*Hacer una pregunta*, *Me gustaría un té*)."
        ]
    },
    "de": {
        "name": "German",
        "flag": "🇩🇪",
        "p1_kicker": "DEUTSCHER VERBEN-LEITFADEN — TEIL 1",
        "p2_kicker": "DEUTSCHER VERBEN-LEITFADEN — TEIL 2",
        "p1_title": "Die 10 wichtigsten Verben im Deutschen für Anfänger (CEFR A0–A1)",
        "p2_title": "Die 10 wichtigsten Verben im Deutschen, Teil 2 (CEFR A0–A1)",
        "p1_dek": "Meistern Sie die 10 häufigsten deutschen Verben mit Anfänger-Konjugationen (A0–A1), Kollokationen und 14-Sprachen-Vergleichstabelle.",
        "p2_dek": "Die 10 wichtigsten Verben im Deutschen für Anfänger (A0–A1): machen/tun, sprechen/sagen, schauen/sehen, hören, müssen/sollen, nehmen/geben, wohnen/leben, warten, verstehen und fragen/antworten.",
        "p1_intro": "Willkommen zum Verben-Leitfaden für das Niveau A0–A1 im Deutschen! Diese 10 Verben bilden das Fundament der alltäglichen Kommunikation.",
        "p2_intro": "Willkommen zum zweiten Teil unseres Verben-Leitfadens für A0–A1! In der Dezember-Ausgabe behandeln wir 10 weitere hochfrequente Alltagsverben.",
        "hub_link_text": "📌 Vergleichen Sie alle 14 Sprachen im Zentralen Hub oder lesen Sie Teil 2.",
        "hub_link_p2": "📌 Vergleichen Sie alle 14 Sprachen im Zentralen Hub (Teil 2) oder kehren Sie zum Deutschen Leitfaden (Teil 1) zurück.",
        "family_heading": "💡 Sprachfamilien & Grammatik-Highlights",
        "family_ie": "Indogermanisch (Romanisch, Germanisch, Slawisch, Hellenisch, Keltisch, Armenisch): Zeitformen und Hilfsverben.",
        "family_turkic": "Turksprachen (Tatarisch, Baschkirisch, Tschuwaschisch): Agglutinative Suffixe ohne separate Hilfsverben.",
        "family_kartvelian": "Kartwelisch (Georgisch): Ergativität und polypersonale Verbformen.",
        "practice_link": "Übungen in COSYpractice ↗",
        "tools_link": "Verb-Tabellen in COSYtools ↗",
        "p1_verbs": [
            "**1. Sein (bin, bist, ist, sind, seid, sind):** Identität und Ort (*Ich bin Student*, *Er ist zu Hause*).",
            "**2. Haben (habe, hast, hat, haben, habt, haben):** Besitz (*Ich habe ein Buch*).",
            "**3. Machen (mache, machst, macht...):** Aktivitäten (*Hausaufgaben machen*, *Kaffee machen*).",
            "**4. Gehen (gehe, gehst, geht...):** Bewegung (*Ich gehe zur Arbeit*).",
            "**5. Kommen (komme, kommst...):** Herkunft (*Ich komme aus Berlin*).",
            "**6. Sagen (sage, sagst...):** Kommunikation (*Hallo sagen*).",
            "**7. Sehen / Schauen:** Visuelle Wahrnehmung (*Ich sehe einen Vogel*).",
            "**8. Wissen / Kennen:** Faktenwissen und Bekanntschaft (*Ich weiß das*, *Ich kenne Paul*).",
            "**9. Wollen / Möchte:** Wunsch und Höflichkeit (*Ich möchte einen Tee*).",
            "**10. Mögen / Gefallen:** Vorlieben (*Ich mag Musik*)."
        ],
        "p2_verbs": [
            "**1. Machen / Tun:** Handlungen (*Ich mache Hausaufgaben*).",
            "**2. Sprechen / Sagen:** Kommunikation (*Ich spreche Deutsch*, *Sag mir bitte*).",
            "**3. Schauen / Sehen:** Visuelle Wahrnehmung (*Schau mal!*, *Ich sehe ein Haus*).",
            "**4. Hören:** Akustische Wahrnehmung (*Musik hören*).",
            "**5. Müssen / Sollen:** Notwendigkeit (*Ich muss gehen*).",
            "**6. Nehmen / Geben:** Austausch (*Nimm einen Kaffee*, *Gib mir das Buch*).",
            "**7. Wohnen / Leben:** Wohnort (*Ich wohne in Berlin*).",
            "**8. Warten:** Erwartung (*Ich warte auf den Bus*).",
            "**9. Verstehen:** Verständnis (*Ich verstehe nicht*).",
            "**10. Fragen / Antworten & Wollen / Ich möchte:** Fragen und höfliche Bitten (*Eine Frage stellen*, *Ich möchte einen Tee*)."
        ]
    },
    "ru": {
        "name": "Russian",
        "flag": "🇷🇺",
        "p1_kicker": "ГИД ПО РУССКОМУ ЯЗЫКУ — ЧАСТЬ 1",
        "p2_kicker": "ГИД ПО РУССКОМУ ЯЗЫКУ — ЧАСТЬ 2",
        "p1_title": "Топ-10 главных глаголов русского языка для начинающих (CEFR A0–A1)",
        "p2_title": "Топ-10 главных глаголов русского языка, Часть 2 (CEFR A0–A1)",
        "p1_dek": "Освойте 10 самых частотных глаголов русского языка с адаптацией для уровня A0–A1, словосочетаниями и сравнительной таблицей на 14 языках.",
        "p2_dek": "Вторая часть руководства по самым частотным глаголам русского языка для начинающих (A0–A1): делать, говорить/сказать, смотреть/видеть, слушать/слышать, должен/надо, брать/давать, жить, ждать, понимать и спрашивать/отвечать.",
        "p1_intro": "Добро пожаловать в гид по ключевым глаголам русского языка для уровня A0–A1! Знание этих 10 глаголов поможет вам строить основные фразы каждого дня.",
        "p2_intro": "Добро пожаловать во вторую часть гида по русским глаголам для начинающих (A0–A1)! В декабрьском выпуске мы разбираем еще 10 важных глаголов действия, восприятия и общения.",
        "hub_link_text": "📌 Сравните 14 языков в нашем Центральном Хабе или перейдите к Части 2.",
        "hub_link_p2": "📌 Сравните 14 языков в нашем Центральном Хабе (Часть 2) или вернитесь к Гиду по русскому языку (Часть 1).",
        "family_heading": "💡 Языковые семьи и грамматические особенности",
        "family_ie": "Индоевропейская семья (романские, германские, славянские, греческий, кельтские, армянский): Система времен и категорий вида.",
        "family_turkic": "Тюркская семья (татарский, башкирский, чувашский): Агглютинативные аффиксы без отдельных вспомогательных слов.",
        "family_kartvelian": "Картвельская семья (грузинский): Эргативный строй и полиперсональное спряжение.",
        "practice_link": "Практические упражнения в COSYpractice ↗",
        "tools_link": "Таблицы глаголов в COSYtools ↗",
        "p1_verbs": [
            "**1. Быть:** Конструкция наличия и состояния (*Я дома*, *У меня есть книга*).",
            "**2. Иметь / У меня есть:** Выражение обладания (*У меня есть машина*).",
            "**3. Делать:** Действия и работа (*Делать домашнее задание*, *Делать кофе*).",
            "**4. Идти / Ехать:** Глаголы движения (*Я иду на работу*).",
            "**5. Приходить:** Направление к цели (*Приходить домой*).",
            "**6. Говорить / Сказать:** Общение и речь (*Говорить по-русски*).",
            "**7. Видеть / Смотреть:** Зрительное восприятие (*Смотреть фильм*, *Я вижу дом*).",
            "**8. Знать:** Фактическое знание (*Я знаю ответ*).",
            "**9. Хотеть:** Желания и просьбы (*Я хочу чай*).",
            "**10. Нравиться:** Выражение симпатии (*Мне нравится музыка*)."
        ],
        "p2_verbs": [
            "**1. Делать:** Повседневные занятия и создание (*Я делаю работу*).",
            "**2. Говорить / Сказать:** Речь и сообщения (*Я говорю по-русски*, *Скажи мне*).",
            "**3. Смотреть / Видеть:** Зрительное внимание (*Смотреть кино*, *Я вижу другa*).",
            "**4. Слушать / Слышать:** Слуховое восприятие (*Слушать музыку*, *Я слышу звук*).",
            "**5. Должен / Надо:** Выражение необходимости (*Я должен идти*, *Надо учиться*).",
            "**6. Брать / Давать:** Обмен (*Брать кофе*, *Давать книгу*).",
            "**7. Жить:** Место жительства (*Я живу в Москве*).",
            "**8. Ждать:** Ожидание (*Ждать автобус*).",
            "**9. Понимать:** Понимание (*Я понимаю*, *Я не понимаю*).",
            "**10. Спрашивать / Отвечать & Хотеть / Я хотел бы:** Вопросы и вежливость (*Задать вопрос*, *Я хотел бы чай*)."
        ]
    }
}

# Fill remaining languages with proper structures
def get_post_data(slug, lang_code, is_part_2):
    lang_info = languages.get(lang_code, languages["en"])
    kicker = lang_info["p2_kicker"] if is_part_2 else lang_info["p1_kicker"]
    title = lang_info["p2_title"] if is_part_2 else lang_info["p1_title"]
    dek = lang_info["p2_dek"] if is_part_2 else lang_info["p1_dek"]
    intro = lang_info["p2_intro"] if is_part_2 else lang_info["p1_intro"]
    verbs = lang_info["p2_verbs"] if is_part_2 else lang_info["p1_verbs"]
    hub_text = lang_info["hub_link_p2"] if is_part_2 else lang_info["hub_link_text"]

    return {
        "id": f"post-{slug}",
        "slug": slug,
        "language": lang_code,
        "translationOf": "top-10-verbs-part-2" if is_part_2 else "top-10-verbs",
        "desk": "Words",
        "format": "list",
        "level": "A0–A1 / A2",
        "issue": {
            "number": "Vol. 2026 — December Issue" if is_part_2 else "Vol. 2026 — August Issue",
            "title": "Winter Grammar & High Frequency Verbs" if is_part_2 else "Get ready for school"
        },
        "date": "2026-12-01" if is_part_2 else "2026-03-01",
        "title": title,
        "kicker": kicker,
        "dek": dek,
        "tags": ["Verbs", lang_info["name"], "A0-A1", "Part2" if is_part_2 else "14Languages"],
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
        "blocks": [
            {
                "type": "paragraph",
                "text": intro
            },
            {
                "type": "heading",
                "level": 3,
                "text": f"Top 10 Verbs ({'Part 2' if is_part_2 else 'Part 1'})"
            },
            {
                "type": "list-item",
                "ordered": False,
                "items": verbs
            },
            {
                "type": "paragraph",
                "text": hub_text
            }
        ],
        "draft": False
    }

print("Generator script created.")
