import json
import os

languages = {
    "en": {
        "name": "English",
        "title": "Stop Translating! 10 Reusable Sentence Frames That Let You Speak From Day One",
        "kicker": "SAY IT",
        "dek": "Master 10 reusable sentence frames and 20 survival phrases that eliminate word-for-word translation, allowing beginners and intermediate learners to describe anything and think directly in English.",
        "p1": "One of the biggest obstacles for language learners is translating word by word. When you don't know a word, use sentence frames to describe what you mean without pausing.",
        "p2": "Describing concepts directly in English builds real fluency. These 10 reusable frames help you express people, places, objects, time, and functions instantly.",
        "h1": "💡 The 10 Essential Sentence Frames",
        "frames": [
            "**1. It's a person who...** → *It's a person who teaches children.* (Teacher)",
            "**2. It's a place where...** → *It's a place where people buy food.* (Market)",
            "**3. It's a thing that...** → *It's a thing that tells the time.* (Clock)",
            "**4. It's something you use to...** → *It's something you use to write.* (Pen)",
            "**5. It's a time when...** → *It's a time when people sleep.* (Night)",
            "**6. It's a day when...** → *It's a day when people celebrate.* (Holiday)",
            "**7. For example...** → *I like sports. For example, football and tennis.*",
            "**8. It means...** → *'Huge' means very big.*",
            "**9. It looks like...** → *It looks like a small computer.*",
            "**10. How do you say... in English?** → *How do you say this in English?*"
        ],
        "h2": "🚀 10 Essential Survival Phrases",
        "survival": [
            "**1. It's a kind of...** (*It's a kind of animal.*)",
            "**2. It's made of...** (*It's made of wood or metal.*)",
            "**3. You use it for...** (*You use it for travelling.*)",
            "**4. It's the opposite of...** (*It's the opposite of expensive.*)",
            "**5. It sounds like...** (*It sounds like music.*)",
            "**6. It has...** (*It has four wheels.*)",
            "**7. It is similar to...** (*It is similar to a car.*)",
            "**8. It comes from...** (*It comes from Italy.*)",
            "**9. I don't know the word, but...** (*I don't know the word, but it's for cooking.*)",
            "**10. Can you repeat that, please?** (*Could you say that again?*)"
        ],
        "summary": "Fluency is not about knowing every word—it's about never staying silent. Use these frames to keep talking!"
    },
    "fr": {
        "name": "French",
        "title": "Arrêtez de traduire ! 10 structures de phrases réutilisables pour parler dès le premier jour",
        "kicker": "EXPRIMEZ-VOUS",
        "dek": "Maîtrisez 10 structures de phrases et 10 expressions de survie pour éliminer la traduction mot à mot et penser directement en français.",
        "p1": "L'un des plus grands obstacles pour les apprenants est la traduction mot à mot. Quand vous ne connaissez pas un mot, utilisez des structures pour décrire ce que vous voulez dire.",
        "p2": "Décrire directement en français développe une vraie fluidité. Ces 10 structures vous aident à décrire personnes, lieux, objets et actions sans bloquer.",
        "h1": "💡 Les 10 structures de phrases essentielles",
        "frames": [
            "**1. C'est une personne qui...** → *C'est une personne qui enseigne aux enfants.* (Professeur)",
            "**2. C'est un endroit où...** → *C'est un endroit où on achète de la nourriture.* (Marché)",
            "**3. C'est une chose qui...** → *C'est une chose qui donne l'heure.* (Horloge)",
            "**4. C'est quelque chose qu'on utilise pour...** → *C'est quelque chose qu'on utilise pour écrire.* (Stylo)",
            "**5. C'est un moment où...** → *C'est un moment où les gens dorment.* (Nuit)",
            "**6. C'est un jour où...** → *C'est un jour où on fête.* (Jour férié)",
            "**7. Par exemple...** → *J'aime le sport. Par exemple, le football et le tennis.*",
            "**8. Ça veut dire...** → *'Grand' ça veut dire pas petit.*",
            "**9. Ça ressemble à...** → *Ça ressemble à un petit ordinateur.*",
            "**10. Comment dit-on... en français ?** → *Comment dit-on ceci en français ?*"
        ],
        "h2": "🚀 10 expressions de survie indispensables",
        "survival": [
            "**1. C'est une sorte de...** (*C'est une sorte d'animal.*)",
            "**2. C'est fait en...** (*C'est fait en bois ou en métal.*)",
            "**3. On l'utilise pour...** (*On l'utilise pour voyager.*)",
            "**4. C'est le contraire de...** (*C'est le contraire de cher.*)",
            "**5. Ça ressemble à...** (*Ça ressemble à de la musique.*)",
            "**6. Ça a...** (*Ça a quatre roues.*)",
            "**7. C'est similaire à...** (*C'est similaire à une voiture.*)",
            "**8. Ça vient de...** (*Ça vient de France.*)",
            "**9. Je ne connais pas le mot, mais...** (*Je ne connais pas le mot, mais c'est pour cuisiner.*)",
            "**10. Pouvez-vous répéter, s'il vous plaît ?** (*Vous pouvez redire ?*)"
        ],
        "summary": "La fluidité ne consiste pas à tout savoir, mais à ne jamais s'arrêter de parler. Utilisez ces structures !"
    },
    "it": {
        "name": "Italian",
        "title": "Smetti di tradurre! 10 strutture di frasi riutilizzabili per parlare fin dal primo giorno",
        "kicker": "PARLA SUBITO",
        "dek": "Padroneggia 10 strutture di frasi e 10 frasi di sopravvivenza per eliminare la traduzione parola per parola e pensare direttamente in italiano.",
        "p1": "Uno dei maggiori ostacoli per chi impara è tradurre parola per parola. Quando non conosci una parola, usa strutture per descrivere ciò che intendi.",
        "p2": "Descrivere direttamente in italiano sviluppa una reale fluidità. Queste 10 strutture ti aiutano a descrivere persone, luoghi, oggetti e azioni.",
        "h1": "💡 Le 10 strutture di frasi essenziali",
        "frames": [
            "**1. È una persona che...** → *È una persona che insegna ai bambini.* (Insegnante)",
            "**2. È un posto dove...** → *È un posto dove si compra il cibo.* (Mercato)",
            "**3. È una cosa che...** → *È una cosa che mostra l'ora.* (Orologio)",
            "**4. È qualcosa che si usa per...** → *È qualcosa che si usa per scrivere.* (Penna)",
            "**5. È un momento in cui...** → *È un momento in cui le persone dormono.* (Notte)",
            "**6. È un giorno in cui...** → *È un giorno in cui si festeggia.* (Festa)",
            "**7. Per esempio...** → *Mi piace lo sport. Per esempio, il calcio.*",
            "**8. Significa...** → *'Grande' significa non piccolo.*",
            "**9. Sombra a...** → *Sembra un piccolo computer.*",
            "**10. Come si dice... in italiano?** → *Come si dice questo in italiano?*"
        ],
        "h2": "🚀 10 frasi di sopravvivenza",
        "survival": [
            "**1. È una specie di...** (*È una specie di animale.*)",
            "**2. È fatto di...** (*È fatto di legno o metallo.*)",
            "**3. Si usa per...** (*Si usa per viaggiare.*)",
            "**4. È il contrario di...** (*È il contrario di costoso.*)",
            "**5. Sembra...** (*Sembra musica.*)",
            "**6. Ha...** (*Ha quattro ruote.*)",
            "**7. È simile a...** (*È simile a un'auto.*)",
            "**8. Viene da...** (*Viene dall'Italia.*)",
            "**9. Non so la parola, ma...** (*Non so la parola, ma serve per cucinare.*)",
            "**10. Puoi ripetere, per favore?** (*Puoi dirlo di nuovo?*)"
        ],
        "summary": "La fluidità non significa conoscere ogni parola, ma non fermarsi mai. Usa queste frasi!"
    },
    "es": {
        "name": "Spanish",
        "title": "¡Deja de traducir! 10 estructuras de oraciones reutilizables para hablar desde el primer día",
        "kicker": "HABLA YA",
        "dek": "Domina 10 estructuras de oraciones y 10 frases de supervivencia para eliminar la traducción palabra por palabra y pensar en español.",
        "p1": "Uno de los mayores obstáculos para los estudiantes es traducir palabra por palabra. Cuando no sepas una palabra, usa estructuras para describir lo que quieres decir.",
        "p2": "Describir directamente en español genera fluidez real. Estas 10 estructuras te ayudan a describir personas, lugares, objetos y acciones.",
        "h1": "💡 Las 10 estructuras de oraciones esenciales",
        "frames": [
            "**1. Es una persona que...** → *Es una persona que enseña a los niños.* (Profesor/a)",
            "**2. Es un lugar donde...** → *Es un lugar donde se compra comida.* (Mercado)",
            "**3. Es una cosa que...** → *Es una cosa que da la hora.* (Reloj)",
            "**4. Es algo que se usa para...** → *Es algo que se usa para escribir.* (Bolígrafo)",
            "**5. Es un momento en el que...** → *Es un momento en el que la gente duerme.* (Noche)",
            "**6. Es un día en el que...** → *Es un día en el que se celebra.* (Fiesta)",
            "**7. Por ejemplo...** → *Me gusta el deporte. Por ejemplo, el fútbol.*",
            "**8. Significa...** → *'Grande' significa no pequeño.*",
            "**9. Se parece a...** → *Se parece a un ordenador pequeño.*",
            "**10. ¿Cómo se dice... en español?** → *¿Cómo se dice esto en español?*"
        ],
        "h2": "🚀 10 frases de supervivencia indispensables",
        "survival": [
            "**1. Es un tipo de...** (*Es un tipo de animal.*)",
            "**2. Está hecho de...** (*Está hecho de madera o metal.*)",
            "**3. Se usa para...** (*Se usa para viajar.*)",
            "**4. Es lo contrario de...** (*Es lo contrario de caro.*)",
            "**5. Suena como...** (*Suena como música.*)",
            "**6. Tiene...** (*Tiene cuatro ruedas.*)",
            "**7. Es similar a...** (*Es similar a un coche.*)",
            "**8. Viene de...** (*Viene de España.*)",
            "**9. No sé la palabra, pero...** (*No sé la palabra, pero es para cocinar.*)",
            "**10. ¿Puedes repetir, por favor?** (*¿Puedes decirlo otra vez?*)"
        ],
        "summary": "La fluidez no es saber cada palabra, sino no quedarse callado jamás. ¡Usa estas estructuras!"
    },
    "de": {
        "name": "German",
        "title": "Hör auf zu übersetzen! 10 wiederverwendbare Satzstrukturen, um sofort zu sprechen",
        "kicker": "SPRICHT JETZT",
        "dek": "Meistern Sie 10 Satzstrukturen und 10 Überlebenssätze, um Wort-für-Wort-Übersetzungen zu stoppen und direkt auf Deutsch zu denken.",
        "p1": "Eines der größten Hindernisse beim Sprachenlernen ist das Wort-für-Wort-Übersetzen. Wenn Sie ein Wort nicht kennen, beschreiben Sie es einfach.",
        "p2": "Dinge direkt auf Deutsch zu beschreiben schafft echte Flüssigkeit. Diese 10 Strukturen helfen Ihnen, Personen, Orte und Gegenstände zu erklären.",
        "h1": "💡 Die 10 wichtigsten Satzstrukturen",
        "frames": [
            "**1. Das ist eine Person, die...** → *Das ist eine Person, die Kinder unterrichtet.* (Lehrer)",
            "**2. Das ist ein Ort, wo...** → *Das ist ein Ort, wo man Essen kauft.* (Markt)",
            "**3. Das ist ein Ding, das...** → *Das ist ein Ding, das die Zeit zeigt.* (Uhr)",
            "**4. Das nutzt man, um zu...** → *Das nutzt man, um zu schreiben.* (Stift)",
            "**5. Das ist eine Zeit, in der...** → *Das ist eine Zeit, in der Menschen schlafen.* (Nacht)",
            "**6. Das ist ein Tag, an dem...** → *Das ist ein Tag, an dem man feiert.* (Feiertag)",
            "**7. Zum Beispiel...** → *Ich mag Sport. Zum Beispiel Fußball.*",
            "**8. Das bedeutet...** → *'Groß' bedeutet nicht klein.*",
            "**9. Das sieht aus wie...** → *Das sieht aus wie ein kleiner Computer.*",
            "**10. Wie sagt man... auf Deutsch?** → *Wie sagt man das auf Deutsch?*"
        ],
        "h2": "🚀 10 wichtige Überlebenssätze",
        "survival": [
            "**1. Das ist eine Art von...** (*Das ist eine Art von Tier.*)",
            "**2. Das ist aus... gemacht.** (*Das ist aus Holz gemacht.*)",
            "**3. Das benutzt man für...** (*Das benutzt man zum Reisen.*)",
            "**4. Das ist das Gegenteil von...** (*Das ist das Gegenteil von teuer.*)",
            "**5. Das klingt wie...** (*Das klingt wie Musik.*)",
            "**6. Das hat...** (*Das hat vier Räder.*)",
            "**7. Das ist ähnlich wie...** (*Das ist ähnlich wie ein Auto.*)",
            "**8. Das kommt aus...** (*Das kommt aus Deutschland.*)",
            "**9. Ich kenne das Wort nicht, aber...** (*Ich kenne das Wort nicht, aber es ist zum Kochen.*)",
            "**10. Können Sie das bitte wiederholen?** (*Noch einmal bitte?*)"
        ],
        "summary": "Flüssigkeit bedeutet nicht, jedes Wort zu kennen, sondern nie zu verstummen. Nutzen Sie diese Sätze!"
    },
    "ru": {
        "name": "Russian",
        "title": "Хватит переводить! 10 готовых конструкций предложений для речи с первого дня",
        "kicker": "ГОВОРИ СРАЗУ",
        "dek": "Освойте 10 речевых конструкций и 10 фраз для выживания, чтобы перестать переводить каждое слово и начать думать по-русски.",
        "p1": "Главное препятствие при изучении языка — дословный перевод. Если вы не знаете нужное слово, опишите его с помощью готовых конструкций.",
        "p2": "Описание предметов и действий напрямую по-русски развивает беглость речи. Эти 10 конструкций помогут описать людей, места и вещи.",
        "h1": "💡 10 главных речевых конструкций",
        "frames": [
            "**1. Это человек, который...** → *Это человек, который учит детей.* (Учитель)",
            "**2. Это место, где...** → *Это место, где покупают еду.* (Рынок / Магазин)",
            "**3. Это вещь, которая...** → *Это вещь, которая показывает время.* (Часы)",
            "**4. Это используют, чтобы...** → *Это используют, чтобы писать.* (Ручка)",
            "**5. Это время, когда...** → *Это время, когда люди спят.* (Ночь)",
            "**6. Это день, когда...** → *Это день, когда празднуют.* (Праздник)",
            "**7. Например...** → *Я люблю спорт. Например, футбол.*",
            "**8. Это означает...** → *'Большой' означает не маленький.*",
            "**9. Это похоже на...** → *Это похоже на маленький компьютер.*",
            "**10. Как сказать... по-русски?** → *Как сказать это по-русски?*"
        ],
        "h2": "🚀 10 важных фраз для выживания",
        "survival": [
            "**1. Это что-то вроде...** (*Это что-то вроде животного.*)",
            "**2. Это сделано из...** (*Это сделано из дерева.*)",
            "**3. Это используют для...** (*Это используют для путешествий.*)",
            "**4. Это противоположность...** (*Это противоположность дорогому.*)",
            "**5. Это звучит как...** (*Это звучит как музыка.*)",
            "**6. У этого есть...** (*У этого есть четыре колеса.*)",
            "**7. Это похоже на...** (*Это похоже на машину.*)",
            "**8. Это из...** (*Это из России.*)",
            "**9. Я не знаю слова, но...** (*Я не знаю слова, но это для готовки.*)",
            "**10. Повторите, пожалуйста.** (*Можно еще раз?*)"
        ],
        "summary": "Беглость — это не знание всех слов, а умение не молчать. Используйте эти конструкции!"
    },
    "el": {
        "name": "Greek",
        "title": "Σταματήστε τη μετάφραση! 10 έτοιμες δομές προτάσεων για να μιλάτε από την πρώτη μέρα",
        "title_short": "Σταματήστε τη μετάφραση!",
        "kicker": "ΜΙΛΗΣΤΕ ΤΩΡΑ",
        "dek": "Μάθετε 10 δομές προτάσεων και 10 φράσεις επιβίωσης για να σταματήσετε τη λέξη προς λέξη μετάφραση και να σκέφτεστε στα ελληνικά.",
        "p1": "Ένα από τα μεγαλύτερα εμπόδια είναι η μετάφραση λέξη προς λέξη. Όταν δεν ξέρετε μια λέξη, περιγράψτε τη με έτοιμες δομές.",
        "p2": "Η περιγραφή εννοιών στα ελληνικά δημιουργεί πραγματική ευχέρεια. Αυτές οι 10 δομές σας βοηθούν να περιγράφετε ανθρώπους, μέρη και αντικείμενα.",
        "h1": "💡 Οι 10 βασικές δομές προτάσεων",
        "frames": [
            "**1. Είναι ένα άτομο που...** → *Είναι ένα άτομο που διδάσκει παιδιά.* (Δάσκαλος)",
            "**2. Είναι ένα μέρος όπου...** → *Είναι ένα μέρος όπου αγοράζεις φαγητό.* (Αγορά)",
            "**3. Είναι ένα πράγμα που...** → *Είναι ένα πράγμα που δείχνει την ώρα.* (Ρολόι)",
            "**4. Είναι κάτι που χρησιμοποιείς για...** → *Είναι κάτι που χρησιμοποιείς για να γράφεις.* (Στυλό)",
            "**5. Είναι μια ώρα που...** → *Είναι μια ώρα που οι άνθρωποι κοιμούνται.* (Νύχτα)",
            "**6. Είναι μια μέρα που...** → *Είναι μια μέρα που γιορτάζουμε.* (Γιορτή)",
            "**7. Για παράδειγμα...** → *Μου αρέσουν τα σπορ. Για παράδειγμα, το ποδόσφαιρο.*",
            "**8. Σημαίνει...** → *'Μεγάλος' σημαίνει όχι μικρός.*",
            "**9. Μοιάζει με...** → *Μοιάζει με μικρό υπολογιστή.*",
            "**10. Πώς λέγεται... στα ελληνικά;** → *Πώς λέγεται αυτό στα ελληνικά;*"
        ],
        "h2": "🚀 10 βασικές φράσεις επιβίωσης",
        "survival": [
            "**1. Είναι ένα είδος...** (*Είναι ένα είδος ζώου.*)",
            "**2. Είναι φτιαγμένο από...** (*Είναι φτιαγμένο από ξύλο.*)",
            "**3. Το χρησιμοποιείς για...** (*Το χρησιμοποιείς για ταξίδια.*)",
            "**4. Είναι το αντίθετο του...** (*Είναι το αντίθετο του ακριβού.*)",
            "**5. Ακούγεται σαν...** (*Ακούγεται σαν μουσική.*)",
            "**6. Έχει...** (*Έχει τέσσερις τροχούς.*)",
            "**7. Είναι παρόμοιο με...** (*Είναι παρόμοιο με αυτοκίνητο.*)",
            "**8. Προέρχεται από...** (*Προέρχεται από την Ελλάδα.*)",
            "**9. Δεν ξέρω τη λέξη, αλλά...** (*Δεν ξέρω τη λέξη, αλλά είναι για μαγείρεμα.*)",
            "**10. Μπορείτε να το επαναλάβετε;** (*Πείτε το ξανά παρακαλώ.*)"
        ],
        "summary": "Η ευχέρεια δεν είναι να ξέρεις κάθε λέξη, αλλά να μη σταματάς να μιλάς. Χρησιμοποιήστε αυτές τις δομές!"
    },
    "tt": {
        "name": "Tatar",
        "title": "Тәрҗемә итмәгез! Беренче көннән сөйләшү өчен 10 җөмлә үрнәге",
        "kicker": "СӨЙЛӘШЕГЕЗ",
        "dek": "Сүзгә-сүз тәрҗемә итүдән котылу өчен 10 җөмлә үрнәге һәм 10 кирәкле фразаны өйрәнегез.",
        "p1": "Тел өйрәнүдә төп тоткарлык — сүзгә-сүз тәрҗемә итү. Берәр сүзне белмәсәгез, аны әзер җөмлә үрнәкләре аша ачыклагыз.",
        "p2": "Татарча турыдан-туры аңлату сөйләмне тизләтә. Бу 10 үрнәк кешеләрне, урыннарны һәм әйберләрне сурәтләргә ярдәм итәр.",
        "h1": "💡 10 төп җөмлә үрнәге",
        "frames": [
            "**1. Бу... кеше.** → *Бу балаларны укытучы кеше.* (Укытучы)",
            "**2. Бу... урын.** → *Бу азык-төлек ала торган урын.* (Базар)",
            "**3. Бу... әйбер.** → *Бу вакытны күрсәтә торган әйбер.* (Сәгать)",
            "**4. Бу... өчен кулланыла.** → *Бу язу өчен кулланыла.* (Каләм)",
            "**5. Бу... вакыт.** → *Бу кешеләр йоклый торган вакыт.* (Төн)",
            "**6. Бу... көн.** → *Бу бәйрәм итә торган көн.* (Бәйрәм)",
            "**7. Мәсәлән...** → *Мин спорт яратам. Мәсәлән, футбол.*",
            "**8. Бу... дигәнне аңлата.** → *'Зур' дигән сүз бәләкәй түгел дигәнне аңлата.*",
            "**9. Бу... охшаган.** → *Бу бәләкәй компьютерга охшаган.*",
            "**10. Татарча ничек булыр?** → *Бу татарча ничек булыр?*"
        ],
        "h2": "🚀 10 мөһим фраза",
        "survival": [
            "**1. Бу бер төр...** (*Бу бер төр хайван.*)",
            "**2. Бу... ясалган.** (*Бу агачтан ясалган.*)",
            "**3. Бу... өчен.** (*Бу сәяхәт өчен.*)",
            "**4. Бу... каршы сүз.** (*Бу кабатлау.*)",
            "**5. Бу... охшаш ишетелә.** (*Бу музыкага охшаш.*)",
            "**6. Моның... бар.** (*Моның дүрт тәгәрмәче бар.*)",
            "**7. Бу... охшаш.** (*Бу машинага охшаш.*)",
            "**8. Бу... килгән.** (*Бу Татарстаннан.*)",
            "**9. Мин сүзне белмим, алай да...** (*Мин сүзне белмим, алай да бу аш пешерү өчен.*)",
            "**10. Кабатлагыз әле, зинһар.** (*Тагын бер тапкыр әйтегез.*)"
        ],
        "summary": "Иркен сөйләшү — барлык сүзләрне белү түгел, ә туктамыйча сөйләү. Бу фразаларны кулланыгыз!"
    },
    "ba": {
        "name": "Bashkir",
        "title": "Тәржемә итмәгеҙ! Беренсе көндән һөйләшеү өсөн 10 һөйләм өлгөһө",
        "kicker": "ҺӨЙЛӘШЕГЕҘ",
        "dek": "Һүҙгә-һүҙ тәржемә итмәү өсөн 10 һөйләм өлгөһөн һәм 10 мөһим фразаны өйрәнегеҙ.",
        "p1": "Тел өйрәнеүҙә төп тотҡарлыҡ — һүҙгә-һүҙ тәржемә итеү. Берәр һүҙҙе белмәһәгеҙ, аны әҙер һөйләм өлгөләре аша аңлатығыҙ.",
        "p2": "Башҡортса тура аңлатыу һөйләмде тиҙләтә. Бу 10 өлгө кешеләрҙе, урындарҙы һәм әйберҙәрҙе һүрәтләргә ярышлы.",
        "h1": "💡 10 төп һөйләм өлгөһө",
        "frames": [
            "**1. Бу... кеше.** → *Бу балаларҙы уҡытыусы кеше.* (Уҡытыусы)",
            "**2. Бу... урын.** → *Бу аҙыҡ-түлек ала торған урын.* (Баҙар)",
            "**3. Бу... әйбер.** → *Бу ваҡытты күрһәтә торған әйбер.* (Сәғәт)",
            "**4. Бу... өсөн ҡулланыла.** → *Бу яҙыу өсөн ҡулланыла.* (Ҡәләм)",
            "**5. Бу... ваҡыт.** → *Бу кешеләр йоҡлай торған ваҡыт.* (Төн)",
            "**6. Бу... көн.** → *Бу байрам итә торған көн.* (Байрам)",
            "**7. Мәҫәлән...** → *Мин спорт яратам. Мәҫәлән, футбол.*",
            "**8. Бу... тигәнде аңлата.** → *'Ул' тигән һүҙ аңлата.*",
            "**9. Бу... оҡшаған.** → *Бу компютерға оҡшаған.*",
            "**10. Башҡортса нисәк булыр?** → *Бу башҡортса нисәк булыр?*"
        ],
        "h2": "🚀 10 мөһим фраза",
        "survival": [
            "**1. Бу бер төр...** (*Бу бер төр хайуан.*)",
            "**2. Бу... яһалған.** (*Бу ағастан яһалған.*)",
            "**3. Бу... өсөн.** (*Бу сәйәхәт өсөн.*)",
            "**4. Бу... ҡаршы һүҙ.** (*Бу кире һүҙ.*)",
            "**5. Бу... оҡшаш ишетелә.** (*Бу музыкаға оҡшаш.*)",
            "**6. Бының... бар.** (*Бының дүрт тәгәрмәсе бар.*)",
            "**7. Бу... оҡшаш.** (*Бу машинаға оҡшаш.*)",
            "**8. Бу... килгән.** (*Бу Башҡортостандан.*)",
            "**9. Мин һүҙҙе белмәйем, шулай ҙа...** (*Мин һүҙҙе белмәйем, шулай ҙа бу аш бешереү өсөн.*)",
            "**10. Ҡабатлағыҙ әле, зинһар.** (*Тағы бер тапҡыр әйтегеҙ.*)"
        ],
        "summary": "Иркен һөйләшеү — бөтә һүҙҙәрҙе белеү түгел, ә туҡтамай һөйләү. Бу фразаларҙы ҡулланығыҙ!"
    },
    "br": {
        "name": "Breton",
        "title": "Chom hep treiñ! 10 framm frazenn da implijout evit komz diouzhtu",
        "kicker": "KOMZIT DIOUZHTU",
        "dek": "Deskit 10 framm frazenn ha 10 frazenn treuzvevañ evit chom hep treiñ ger-ha-ger ha meizañ e brezhoneg.",
        "p1": "An diaester brasañ evit an dud eo treiñ ger-ha-ger. Pa ne anavezit ket ur ger, implijit frammoù evit displegañ ar pezh a fell deoc'h lavarout.",
        "p2": "Displegañ e brezhoneg diouzhtu a ro ur gaoz flour. Ar 10 framm-mañ a sikouro ac'hanoc'h da zeskrivañ tud, lec'hioù ha traoù.",
        "h1": "💡 Ar 10 framm frazenn pennañ",
        "frames": [
            "**1. Un den eo hag a...** → *Un den eo hag a gelenn d'ar vugale.* (Mestr-skol)",
            "**2. Ur lec'h eo e-lec'h ma...** → *Ur lec'h eo e-lec'h ma prener boued.* (C'harc'h)",
            "**3. Un dra eo hag a...** → *Un dra eo hag a ziskouez an eur.* (Alerg)",
            "**4. Un dra eo a vez implijet evit...** → *Un dra eo a vez implijet evit skrivañ.* (Pluenn)",
            "**5. Ur mare eo e-lec'h ma...** → *Ur mare eo e-lec'h ma kousk an dud.* (Noz)",
            "**6. Un deiz eo e-lec'h ma...** → *Un deiz eo e-lec'h ma lider.* (Gouel)",
            "**7. Da skouer...** → *Plijout a ra ar sport din. Da skouer, ar mell-droad.*",
            "**8. Talvezout a ra...** → *'Bras' a dalvez n'eo ket bihan.*",
            "**9. Hñvel eo ouzh...** → *Hñvel eo ouzh ur urzhiataer bihan.*",
            "**10. Penaos e laverer... e brezhoneg?** → *Penaos e laverer se e brezhoneg?*"
        ],
        "h2": "🚀 10 frazenn treuzvevañ",
        "survival": [
            "**1. Ur seurt... eo.** (*Ur seurt loen eo.*)",
            "**2. Graet eo e...** (*Graet eo e koad.*)",
            "**3. Implijet e vez evit...** (*Implijet e vez evit beajiñ.*)",
            "**4. An eneb eo da...** (*An eneb eo da ger.*)",
            "**5. Soniñ a ra evel...** (*Soniñ a ra evel sonerezh.*)",
            "**6. Ban ez eus...** (*Pavar rod zo gantañ.*)",
            "**7. Hñvel eo ouzh...** (*Hñvel eo ouzh ur c'harr.*)",
            "**8. Donet a ra eus...** (*Donet a ra eus Breizh.*)",
            "**9. Ne anavezan ket ar ger, met...** (*Ne anavezan ket ar ger, met evit keginañ eo.*)",
            "**10. Gallout a reit adlavarout, mar plij?** (*Lavarit en-dro mar plij.*)"
        ],
        "summary": "Ar flourded n'eo ket gouzout pep ger, met chom hep tevel. Implijit ar frammoù-mañ!"
    },
    "pt": {
        "name": "Portuguese",
        "title": "Pare de traduzir! 10 estruturas de frases reutilizáveis para falar desde o primeiro dia",
        "kicker": "FALE AGORA",
        "dek": "Domine 10 estruturas de frases e 10 frases de sobrevivência para eliminar a tradução palavra por palavra e pensar diretamente em português.",
        "p1": "Um dos maiores obstáculos para os alunos é traduzir palavra por palavra. Quando não souber uma palavra, use estruturas para descrever o que quer dizer.",
        "p2": "Descrever diretamente em português gera fluência real. Estas 10 estruturas ajudam a descrever pessoas, lugares, objetos e ações.",
        "h1": "💡 As 10 estruturas de frases essenciais",
        "frames": [
            "**1. É uma pessoa que...** → *É uma pessoa que ensina crianças.* (Professor/a)",
            "**2. É um lugar onde...** → *É um lugar onde se compra comida.* (Mercado)",
            "**3. É uma coisa que...** → *É uma coisa que dá as horas.* (Relógio)",
            "**4. É algo que se usa para...** → *É algo que se usa para escrever.* (Caneta)",
            "**5. É um momento em que...** → *É um momento em que as pessoas dormem.* (Noite)",
            "**6. É um dia em que...** → *É um dia em que se celebra.* (Feriado)",
            "**7. Por exemplo...** → *Gosto de desporto. Por exemplo, futebol.*",
            "**8. Significa...** → *'Grande' significa não pequeno.*",
            "**9. Parece...** → *Parece um computador pequeno.*",
            "**10. Como se diz... em português?** → *Como se diz isto em português?*"
        ],
        "h2": "🚀 10 frases de sobrevivência indispensáveis",
        "survival": [
            "**1. É um tipo de...** (*É um tipo de animal.*)",
            "**2. É feito de...** (*É feito de madeira ou metal.*)",
            "**3. Usa-se para...** (*Usa-se para viajar.*)",
            "**4. É o contrário de...** (*É o contrário de caro.*)",
            "**5. Soa a...** (*Soa a música.*)",
            "**6. Tem...** (*Tem quatro rodas.*)",
            "**7. É semelhante a...** (*É semelhante a um carro.*)",
            "**8. Vem de...** (*Vem de Portugal.*)",
            "**9. Não sei a palavra, mas...** (*Não sei a palavra, mas é para cozinhar.*)",
            "**10. Pode repetir, por favor?** (*Pode dizer de novo?*)"
        ],
        "summary": "A fluência não é saber todas as palavras, mas nunca ficar calado. Use estas estruturas!"
    },
    "hy": {
        "name": "Armenian",
        "title": "Դադարեցրեք թարգմանել։ 10 կրկնվող նախադասության կառույց առաջին իսկ օրվանից խոսելու համար",
        "kicker": "ԽՈՍԵՔ ՀԻՄԱ",
        "dek": "Սովորեք 10 նախադասության կառույց և 10 կենսական արտահայտություն՝ բառ առ բառ թարգմանությունը բացառելու և հայերեն մտածելու համար։",
        "p1": "Լեզու սովորողների ամենամեծ խոչընդոտներից մեկը բառ առ բառ թարգմանելն է։ Երբ չգիտեք որևէ բառ, օգտագործեք կառույցներ՝ իմաստը նկարագրելու համար։",
        "p2": "Մտքերը հայերեն նկարագրելը ստեղծում է իրական վարժ տիրապետում։ Այս 10 կառույցները կօգնեն նկարագրել մարդկանց, տեղերն ու իրերը։",
        "h1": "💡 10 հիմնական նախադասության կառույցները",
        "frames": [
            "**1. Սա մի մարդ է, ով...** → *Սա մի մարդ է, ով սովորեցնում է երեխաներին։* (Ուսուցիչ)",
            "**2. Սա մի տեղ է, որտեղ...** → *Սա մի տեղ է, որտեղ ուտելիք են գնում։* (Շուկա)",
            "**3. Սա մի իր է, որը...** → *Սա մի իր է, որը ցույց է տալիս ժամանակը։* (Ժամացույց)",
            "**4. Սա օգտագործում են... համար** → *Սա օգտագործում են գրելու համար։* (Գրիչ)",
            "**5. Սա մի ժամանակ է, երբ...** → *Սա մի ժամանակ է, երբ մարդիկ քնում են։* (Գիշեր)",
            "**6. Սա մի օր է, երբ...** → *Սա մի օր է, երբ տոնում են։* (Տոն)",
            "**7. Օրինակ...** → *Ես սիրում եմ սպորտ։ Օրինակ, ֆուտբոլ։*",
            "**8. Սա նշանակում է...** → *'Մեծ' նշանակում է ոչ փոքր։*",
            "**9. Սա նման է...** → *Սա նման է փոքր համակարգչի։*",
            "**10. Ինչպե՞ս կլինի... հայերեն։** → *Ինչպե՞ս կլինի սա հայերեն։*"
        ],
        "h2": "🚀 10 կարևոր արտահայտություն",
        "survival": [
            "**1. Սա մի տեսակ... է։** (*Սա մի տեսակ կենդանի է։*)",
            "**2. Սա պատրաստված է...-ից։** (*Սա պատրաստված է փայտից։*)",
            "**3. Սա օգտագործվում է... համար։** (*Սա օգտագործվում է ճամփորդելու համար։*)",
            "**4. Սա... հակառակն է։** (*Սա թանկի հակառակն է։*)",
            "**5. Սա հնչում է ինչպես...** (*Սա հնչում է ինչպես երաժշտություն։*)",
            "**6. Սա ունի...** (*Սա ունի չորս անիվ։*)",
            "**7. Սա նման է...** (*Սա նման է մեքենայի։*)",
            "**8. Սա...-ից է։** (*Սա Հայաստանից է։*)",
            "**9. Ես չգիտեմ բառը, բայց...** (*Ես չգիտեմ բառը, բայց սա եփելու համար է։*)",
            "**10. Կարո՞ղ եք կրկնել, խնդրում եմ։** (*Կրկին կասե՞ք։*)"
        ],
        "summary": "Վարժ տիրապետումը բոլոր բառերն իմանալը չէ, այլ երբեք չլռելը։ Օգտագործեք այս կառույցները։"
    },
    "ka": {
        "name": "Georgian",
        "title": "შეწყვიტეთ თარგმნა! 10 მრავალჯერადი წინადადების სტრუქტურა პირველივე დღიდან ლაპარაკისთვის",
        "kicker": "იბარტყეთ ახლავე",
        "dek": "ისწავლეთ 10 წინადადების სტრუქტურა და 10 გადარჩენის ფრაზა, რათა შეწყვიტოთ სიტყვა-სიტყვით თარგმნა და იაზროვნოთ ქართულად.",
        "p1": "ენის შემსწავლელთა უდიდესი დაბრკოლება სიტყვა-სიტყვით თარგმნაა. როდესაც სიტყვა არ იცით, გამოიყენეთ სტრუქტურები აზრის ასახსნელად.",
        "p2": "აზრის პირდაპირ ქართულად გადმოცემა ქმნის ნამდვილ ენობრივ სიმარტივეს. ეს 10 სტრუქტურა დაგეხმარებათ ადამიანების, ადგილებისა და ნივთების აღწერაში.",
        "h1": "💡 10 ძირითადი წინადადების სტრუქტურა",
        "frames": [
            "**1. ეს არის ადამიანი, რომელიც...** → *ეს არის ადამიანი, რომელიც ბავშვებს ასწავლის.* (მასწავლებელი)",
            "**2. ეს არის ადგილი, სადაც...** → *ეს არის ადგილი, სადაც საჭმელს ყიდულობენ.* (ბაზარი)",
            "**3. ეს არის ნივთი, რომელიც...** → *ეს არის ნივთი, რომელიც დროს გვიჩვენებს.* (საათი)",
            "**4. ამას იყენებენ...-თვის** → *ამას იყენებენ წერისთვის.* (კალამი)",
            "**5. ეს არის დრო, როდესაც...** → *ეს არის დრო, როდესაც ადამიანებს სძინავთ.* (ღამე)",
            "**6. ეს არის დღე, როდესაც...** → *ეს არის დღე, როდესაც ზეიმობენ.* (დღესასწაული)",
            "**7. მაგალითად...** → *მე მიყვარს სპორტი. მაგალითად, ფეხბურთი.*",
            "**8. ეს ნიშნავს...** → *'დიდი' ნიშნავს არა პატარას.*",
            "**9. ეს ჰგავს...** → *ეს ჰგავს პატარა კომპიუტერს.*",
            "**10. როგორ არის... ქართულად?** → *როგორ არის ეს ქართულად?*"
        ],
        "h2": "🚀 10 აუცილებელი გადარჩენის ფრაზა",
        "survival": [
            "**1. ეს არის ერთგვარი...** (*ეს არის ერთგვარი ცხოველი.*)",
            "**2. ეს დამზადებულია...-გან.** (*ეს დამზადებულია ხისგან.*)",
            "**3. ამას იყენებენ...-თვის.** (*ამას იყენებენ მოგზაურობისთვის.*)",
            "**4. ეს არის... საპირისპირო.** (*ეს არის ძვირის საპირისპირო.*)",
            "**5. ეს ჟღერს როგორც...** (*ეს ჟღერს როგორც მუსიკა.*)",
            "**6. ამას აქვს...** (*ამას აქვს ოთხი თვალი/ბორბალი.*)",
            "**7. ეს წააგავს...** (*ეს წააგავს მანქანას.*)",
            "**8. ეს არის...-დან.** (*ეს არის საქართველოდან.*)",
            "**9. სიტყვა არ ვიცი, მაგრამ...** (*სიტყვა არ ვიცი, მაგრამ ეს მომზადებისთვისაა.*)",
            "**10. შეგიძლიათ გაამეოროთ?** (*კიდევ ერთხელ იტყვით?*)"
        ],
        "summary": "ენის თავისუფლად ფლობა ყველა სიტყვის ცოდნა კი არა, გაჩუმებაზე უარის თქმაა. გამოიყენეთ ეს ფრაზები!"
    },
    "cv": {
        "name": "Chuvash",
        "title": "Ан куçарăр! Пĕрремĕш кунран калаçмалли 10 хатĕр преджени структури",
        "kicker": "КАЛАÇĂР ИНЧЕХ",
        "dek": "Сăмахран сăмах куçармаран хăтăлмалли 10 преджени структурине тата 10 кирлĕ фраза вĕренĕр.",
        "p1": "Чĕлхе вĕреннĕ чухне чи пысăк чăрмав — сăмахран сăмах куçарни. Пĕр-пĕр сăмаха пĕлместĕр пулсан, ăна хатĕр преджени структурисемпе аңлатар.",
        "p2": "Чăвашла тӳррĕн аңлатни сăмахлав хăвăртлăхне жӳтерет. Ку 10 структура çынсене, вырăнсене тата япаласене сăнлама пулăшать.",
        "h1": "💡 10 тĕп преджени структури",
        "frames": [
            "**1. Ку... çын.** → *Ку ачасене вĕрентекен çын.* (Вĕрентекен)",
            "**2. Ку... вырăн.** → *Ку апат-çимĕç илекен вырăн.* (Пазар / Магазин)",
            "**3. Ку... япала.** → *Ку вăхăта кăтартакан япала.* (Сехет)",
            "**4. Куна... валли усă кураççĕ.** → *Куна çырма валли усă кураççĕ.* (Карандаш / Ручка)",
            "**5. Ку... вăхăт.** → *Ку çынсем çывăракан вăхăт.* (Çĕр)",
            "**6. Ку... кун.** → *Ку уявлакан кун.* (Уяв)",
            "**7. Тĕслĕхрен...** → *Манăн спорт кăмăла каять. Тĕслĕхрен, футбол.*",
            "**8. Ку... пĕлтерет.** → *'Пысăк' сăмах пĕчĕк маррине пĕлтерет.*",
            "**9. Ку... евĕрлĕ.** → *Ку пĕчĕк компютер евĕрлĕ.*",
            "**10. Чăвашла мĕнле каламалла?** → *Куна чăвашла мĕнле каламалла?*"
        ],
        "h2": "🚀 10 кирлĕ фраза",
        "survival": [
            "**1. Ку пĕр-пĕр...** (*Ку пĕр-пĕр чĕрчун.*)",
            "**2. Куна... тунă.** (*Куна йывăçран тунă.*)",
            "**3. Куна... усă кураççĕ.** (*Куна çулçӳрев валли усă кураççĕ.*)",
            "**4. Ку... противлă сăмах.** (*Ку хаклă маррине пĕлтерет.*)",
            "**5. Ку... пек илтĕнет.** (*Ку музыка пек илтĕнет.*)",
            "**6. Унăн... пур.** (*Унăн тăватă кустăрма пур.*)",
            "**7. Ку... евĕрлĕ.** (*Ку машина евĕрлĕ.*)",
            "**8. Ку... тухнă.** (*Ку Чăваш Енрен.*)",
            "**9. Эпĕ сăмаха пĕлместĕп, анчах...** (*Эпĕ сăмаха пĕлместĕп, анчах ку апат тăма валли.*)",
            "**10. Тархасшăн, каайла калăр-ха.** (*Енчен те тата пĕрре калăр.*)"
        ],
        "summary": "Ирĕклĕ калаçни — пĕтĕм сăмаха пĕлни мар, сăмахсăр ларассинчен пăрăнни. Ку структурăсемпе усă куруçĕ!"
    }
}

posts_dir = "posts"
os.makedirs(posts_dir, exist_ok=True)

for code, lang in languages.items():
    slug = f"stop-translating-10-sentence-frames-{code}" if code != "en" else "stop-translating-10-sentence-frames"
    filepath = os.path.join(posts_dir, f"{slug}.json")

    post_obj = {
        "id": f"post-{slug}",
        "slug": slug,
        "language": code,
        "translationOf": "stop-translating-10-sentence-frames",
        "desk": "Words",
        "format": "list",
        "level": "A0–A1 / A2",
        "issue": {
            "number": "Vol. 2026.10",
            "title": "JY DM's birthday & His favs"
        },
        "date": "2026-09-14",
        "title": lang["title"],
        "kicker": lang["kicker"],
        "dek": lang["dek"],
        "tags": ["SentenceFrames", "Circumlocution", "Fluency", "A0-B1", lang["name"]],
        "readingTime": 8,
        "podcast": {
            "episode": 1,
            "audioUrl": None
        },
        "artDirection": {
            "palette": ["#0d9488", "#faf7f2", "#1e293b", "#f59e0b"],
            "fonts": {
                "display": "Fraunces",
                "text": "DM Sans",
                "accent": "Fraunces Italic"
            },
            "layout": "magazine-spread",
            "motif": "ticket-stub",
            "seed": slug,
            "coverOverride": None
        },
        "blocks": [
            {
                "type": "paragraph",
                "text": lang["p1"]
            },
            {
                "type": "paragraph",
                "text": lang["p2"]
            },
            {
                "type": "heading",
                "level": 3,
                "text": lang["h1"]
            },
            {
                "type": "list-item",
                "ordered": False,
                "items": lang["frames"]
            },
            {
                "type": "heading",
                "level": 3,
                "text": lang["h2"]
            },
            {
                "type": "list-item",
                "ordered": False,
                "items": lang["survival"]
            },
            {
                "type": "heading",
                "level": 3,
                "text": "📌 Summary"
            },
            {
                "type": "paragraph",
                "text": lang["summary"]
            }
        ],
        "draft": False
    }

    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(post_obj, f, ensure_ascii=False, indent=2)

print("Generated all 14 localized stop-translating post JSONs successfully!")
