// ============================================
// AI PROMPTS - Łatwo edytowalne szablony
// ============================================
// 
// Ten plik zawiera szablony promptów dla generatora AI.
// Możesz je łatwo modyfikować bez dotykania reszty kodu.
//
// Użycie: {USER_PROMPT} zostanie zastąpione opisem użytkownika
// ============================================

(function() {
'use strict';

const AI_PROMPTS = {
  
  /**
   * Prompt dla generowania quizów
   */
  quiz: `Jesteś ekspertem w tworzeniu quizów edukacyjnych.

ZADANIE: Wygeneruj quiz w formacie JSON na podstawie opisu użytkownika.

WYMAGANIA:
- Tytuł i opis powinny być krótkie i chwytliwe
- Pytania: jasne, konkretne, różnego poziomu trudności
- Używaj TYLKO tych typów pytań:
  • "multiple-choice" - 4 opcje, correctAnswer = index (0-3)
  • "true-false" - correctAnswer = true lub false
  • "fill-in-blank" - correctAnswer = string (krótka odpowiedź)
  • "listening" - TYLKO dla nauki języków! audioText (tekst do TTS), audioLang (kod języka), correctAnswer = string
- **WAŻNE DLA PYTAŃ WIELOKROTNEGO WYBORU:** Prawidłowa odpowiedź musi być w LOSOWEJ pozycji! NIE umieszczaj zawsze prawidłowej odpowiedzi na pierwszej pozycji (index 0). Różnicuj pozycje dla każdego pytania (np. raz index 2, raz 0, raz 3, raz 1).
- Wszystkie teksty po polsku (chyba że użytkownik poprosi inaczej)
- Minimum 5 pytań, maksimum 20
- Jeśli użytkownik nie wskaże typów pytań, użyj różnych typów dla urozmaicenia
- **WAŻNE:** Typ "listening" używaj TYLKO gdy quiz dotyczy nauki języków obcych lub fonetyki!

TYPY PYTAŃ - SZCZEGÓŁY:

1. MULTIPLE CHOICE (wielokrotny wybór):
{
  "question": "Jaka jest stolica Polski?",
  "type": "multiple-choice",
  "options": ["Kraków", "Warszawa", "Gdańsk", "Wrocław"],
  "correctAnswer": 1
}
UWAGA: 
- correctAnswer musi być liczbą (0, 1, 2, 3), NIE stringiem ("0", "1", etc.)!
- **WAŻNE:** Prawidłowa odpowiedź powinna być umieszczona w LOSOWEJ pozycji w tablicy options!
- NIE umieszczaj zawsze prawidłowej odpowiedzi na pozycji 0 (pierwszej)!
- Losuj pozycję prawidłowej odpowiedzi dla każdego pytania (np. raz 0, raz 2, raz 3, raz 1)

2. TRUE/FALSE (prawda/fałsz):
{
  "question": "Ziemia jest płaska",
  "type": "true-false",
  "correctAnswer": false
}
UWAGA: correctAnswer musi być boolean (true/false), NIE string ("true"/"false")!

3. FILL IN BLANK (uzupełnij):
{
  "question": "Stolica Francji to ____",
  "type": "fill-in-blank",
  "correctAnswer": "Paryż"
}

4. LISTENING (słuchowe z TTS - TYLKO dla nauki języków!):
{
  "question": "Posłuchaj i wpisz usłyszane słowo po angielsku",
  "type": "listening",
  "audioText": "Hello world",
  "audioLang": "en-US",
  "correctAnswer": "hello world"
}

KIEDY UŻYWAĆ "listening":
✅ Quiz o nauce angielskiego, hiszpańskiego, etc.
✅ Quiz o wymowie, fonetyce
✅ Użytkownik wyraźnie prosi o pytania słuchowe
❌ Quiz o historii, matematyce, geografii
❌ Quiz ogólny bez kontekstu językowego

KODY JĘZYKÓW dla audioLang:
- Polski: "pl-PL"
- Angielski (US): "en-US"
- Angielski (UK): "en-GB"
- Hiszpański: "es-ES"
- Niemiecki: "de-DE"
- Francuski: "fr-FR"
- Włoski: "it-IT"

PRZYKŁAD 1 - Quiz językowy (z listening):
{
  "title": "Angielski dla początkujących",
  "description": "Podstawowe słówka i wymowa",
  "questions": [
    {
      "question": "Co oznacza 'apple'?",
      "type": "multiple-choice",
      "options": ["Gruszka", "Banan", "Jabłko", "Pomarańcza"],
      "correctAnswer": 2
    },
    {
      "question": "Posłuchaj i wpisz usłyszane słowo",
      "type": "listening",
      "audioText": "Hello",
      "audioLang": "en-US",
      "correctAnswer": "hello"
    },
    {
      "question": "Uzupełnij: I ___ a student",
      "type": "fill-in-blank",
      "correctAnswer": "am"
    }
  ]
}

PRZYKŁAD 2 - Quiz ogólny (BEZ listening):
{
  "title": "Quiz o geografii Europy",
  "description": "Sprawdź swoją wiedzę o stolicach i krajach",
  "questions": [
    {
      "question": "Jaka jest stolica Niemiec?",
      "type": "multiple-choice",
      "options": ["Monachium", "Hamburg", "Berlin", "Frankfurt"],
      "correctAnswer": 2
    },
    {
      "question": "Francja graniczy z Hiszpanią",
      "type": "true-false",
      "correctAnswer": true
    },
    {
      "question": "Stolica Włoch to ____",
      "type": "fill-in-blank",
      "correctAnswer": "Rzym"
    }
  ]
}

OPIS UŻYTKOWNIKA:
{USER_PROMPT}

KRYTYCZNE WYMAGANIA JSON:
1. correctAnswer w "multiple-choice" = LICZBA (0, 1, 2, 3), nie string!
2. correctAnswer w "true-false" = BOOLEAN (true, false), nie string!
3. correctAnswer w "fill-in-blank" = string
4. correctAnswer w "listening" = string
5. Zwróć TYLKO czysty JSON, bez markdown (\`\`\`json), komentarzy czy dodatkowego tekstu.`,

  /**
   * Prompt dla generowania treningów
   */
  workout: `Jesteś ekspertem w tworzeniu planów treningowych.

ZADANIE: Wygeneruj trening w formacie JSON na podstawie opisu użytkownika.

WYMAGANIA:
- Tytuł i opis powinny być konkretne i motywujące
- **WAŻNE:** Dodaj pole "emoji" z jedną emotikoną pasującą do tematu treningu
- **TYTUŁ:** NIE dodawaj numeru do tytułu - numer zostanie dodany automatycznie podczas zapisu
- Struktura: min. 2-3 fazy (np. Rozgrzewka → Trening główny → Rozciąganie)
- Każde ćwiczenie z dokładnym opisem wykonania
- Używaj TYLKO tych typów:
  • "time" - duration w sekundach (np. 30, 45, 60)
  • "reps" - liczba powtórzeń (np. 10, 15, 20)
- Wszystkie teksty po polsku (chyba że użytkownik poprosi inaczej)
- Ćwiczenia dopasowane do poziomu (początkujący/średni/zaawansowany)

EMOTIKONY - DOBIERZ PASUJĄCĄ DO TEMATU:
- 💪 - Trening siłowy, FBW, ogólny trening
- 🏃 - Cardio, bieganie, wytrzymałość
- 🥊 - Boks, sporty walki
- 🧘 - Joga, stretching, relaks
- 🏋️ - Trening na siłowni, ciężary
- 🤸 - Akrobatyka, gimnastyka
- 🚴 - Rower, spinning
- 🏊 - Pływanie
- ⚡ - HIIT, intensywny trening
- 🎯 - Trening celowany (np. brzuch, nogi)
- 🔥 - Fat burning, spalanie tłuszczu
- 🦵 - Trening nóg
- 💯 - Challenge, wyzwanie

TYPY ĆWICZEŃ - SZCZEGÓŁY:

1. TIME (na czas) - pojedyncze:
{
  "name": "Deska (plank)",
  "type": "time",
  "duration": 30,
  "description": "Oprzyj się na przedramionach i palcach stóp. Utrzymuj proste plecy przez cały czas.",
  "mediaUrl": ""
}

2. TIME (na czas) - z wieloma seriami:
{
  "name": "Deska (plank)",
  "type": "time",
  "duration": 45,
  "sets": 3,
  "restBetweenSets": 30,
  "description": "Oprzyj się na przedramionach. Utrzymuj proste plecy.",
  "mediaUrl": ""
}
UWAGA: System automatycznie rozwinie to na 3 serie po 45s z 30s odpoczynku między nimi.

3. REPS (liczba powtórzeń) - pojedyncze:
{
  "name": "Pompki",
  "type": "reps",
  "reps": "10",
  "description": "Ręce na szerokość barków. Opuść klatkę do ziemi i wyprostuj ramiona.",
  "mediaUrl": ""
}

4. REPS (liczba powtórzeń) - z wieloma seriami:
{
  "name": "Push Up",
  "type": "reps",
  "reps": "15",
  "sets": 4,
  "restBetweenSets": 30,
  "description": "Pompki klasyczne. Dłonie na szerokość barków, ciało w linii prostej.",
  "mediaUrl": ""
}
UWAGA: System automatycznie rozwinie to na 4 serie po 15 powtórzeń z 30s odpoczynku między nimi.

FORMAT JSON (KOMPLETNY PRZYKŁAD):
{
  "title": "Trening FBW dla początkujących",
  "description": "30-minutowy trening całego ciała bez sprzętu",
  "emoji": "💪",
  "phases": [
    {
      "name": "Rozgrzewka",
      "exercises": [
        {
          "name": "Pajacyki (jumping jacks)",
          "type": "time",
          "duration": 30,
          "description": "Skacz rozstawiając nogi i podnosząc ręce nad głowę",
          "mediaUrl": ""
        },
        {
          "name": "Krążenia ramion",
          "type": "reps",
          "reps": "10",
          "description": "Wykonaj 10 okrążeń ramion do przodu, potem 10 do tyłu",
          "mediaUrl": ""
        }
      ]
    },
    {
      "name": "Trening główny",
      "exercises": [
        {
          "name": "Przysiady",
          "type": "reps",
          "reps": "15",
          "sets": 3,
          "restBetweenSets": 30,
          "description": "Stopy na szerokość bioder, zegnij kolana do kąta 90 stopni",
          "mediaUrl": ""
        },
        {
          "name": "Push Up",
          "type": "reps",
          "reps": "10",
          "sets": 3,
          "restBetweenSets": 30,
          "description": "Pompki klasyczne, ciało w linii prostej",
          "mediaUrl": ""
        },
        {
          "name": "Deska",
          "type": "time",
          "duration": 45,
          "sets": 2,
          "restBetweenSets": 30,
          "description": "Utrzymuj proste plecy, napnij brzuch",
          "mediaUrl": ""
        }
      ]
    },
    {
      "name": "Rozciąganie",
      "exercises": [
        {
          "name": "Rozciąganie ud",
          "type": "time",
          "duration": 30,
          "description": "Przytrzymaj stopę przy pośladku, poczuj rozciąganie w przedniej części uda",
          "mediaUrl": ""
        }
      ]
    }
  ]
}

PRZYKŁAD Z OPISEM SERII:
- "Przysiady" z sets: 3 zostanie automatycznie rozwinięte na:
  1. Przysiady seria 1/3 (15 powtórzeń)
  2. Odpoczynek (30s)
  3. Przysiady seria 2/3 (15 powtórzeń)
  4. Odpoczynek (30s)
  5. Przysiady seria 3/3 (15 powtórzeń)

OPIS UŻYTKOWNIKA:
{USER_PROMPT}

WAŻNE: 
1. NIE dodawaj numeru do tytułu - zostanie dodany automatycznie
2. Zwróć TYLKO czysty JSON, bez markdown (\`\`\`json), komentarzy czy dodatkowego tekstu.`,

  /**
   * Prompt dla generowania zestawów do nauki ze słuchu (Listening)
   */
  listening: `Jesteś ekspertem w nauce języków obcych.

ZADANIE: Wygeneruj zestaw par językowych do nauki ze słuchu w formacie JSON.

WYMAGANIA:
- Tytuł i opis powinny być konkretne i motywujące
- Minimum 15 par, maksimum 40 par
- Pary powinny być logicznie uporządkowane (od prostych do trudniejszych)
- Możesz grupować pary w sekcje używając separatorów (opcjonalnie)
- Różnorodność: słowa, frazy, zdania, przykłady użycia
- Używaj naturalnego języka, tak jak mówią native speakerzy

KODY JĘZYKÓW (lang1_code, lang2_code):
Używaj pełnych kodów BCP 47:
- Polski: "pl-PL"
- Angielski (US): "en-US"
- Angielski (UK): "en-GB"
- Hiszpański (Hiszpania): "es-ES"
- Hiszpański (Meksyk): "es-MX"
- Niemiecki: "de-DE"
- Francuski: "fr-FR"
- Włoski: "it-IT"
- Portugalski (Brazylia): "pt-BR"
- Portugalski (Portugalia): "pt-PT"
- Rosyjski: "ru-RU"
- Japoński: "ja-JP"
- Chiński (Mandaryński): "zh-CN"
- Koreański: "ko-KR"

KLUCZE W CONTENT (lang1_key, lang2_key):
To skrócone kody języków używane jako klucze w obiektach par:
- Polski: "pl"
- Angielski: "en"
- Hiszpański: "es"
- Niemiecki: "de"
- Francuski: "fr"
- Włoski: "it"
- Portugalski: "pt"
- Rosyjski: "ru"
- Japoński: "ja"
- Chiński: "zh"
- Koreański: "ko"

SEPARATORY SEKCJI (opcjonalne):
Możesz grupować pary w logiczne sekcje używając separatorów:
{
  "pl": "--- CZASOWNIK: ESTAR ---",
  "es": "--- VERBO: ESTAR ---"
}

Separator to para, gdzie wartości zaczynają się i kończą na "---".
Używaj separatorów TYLKO gdy ma to sens tematyczny (np. różne czasowniki, kategorie słówek).

FORMAT JSON (KOMPLETNY PRZYKŁAD):
{
  "title": "Hiszpański A1: Czasowniki ESTAR i IR",
  "description": "Podstawowe czasowniki w czasie teraźniejszym z przykładami",
  "lang1_code": "pl-PL",
  "lang2_code": "es-ES",
  "content": [
    {
      "pl": "--- CZASOWNIK: ESTAR (Być - stany, położenie) ---",
      "es": "--- VERBO: ESTAR (Presente) ---"
    },
    {
      "pl": "(Ja) jestem",
      "es": "(Yo) estoy"
    },
    {
      "pl": "(Ty) jesteś",
      "es": "(Tú) estás"
    },
    {
      "pl": "(On/Ona) jest",
      "es": "(Él/Ella) está"
    },
    {
      "pl": "Jestem zmęczony.",
      "es": "Estoy cansado."
    },
    {
      "pl": "Książka jest na stole.",
      "es": "El libro está en la mesa."
    },
    {
      "pl": "--- CZASOWNIK: IR (Iść) ---",
      "es": "--- VERBO: IR (Presente) ---"
    },
    {
      "pl": "(Ja) idę",
      "es": "(Yo) voy"
    },
    {
      "pl": "(Ty) idziesz",
      "es": "(Tú) vas"
    },
    {
      "pl": "Idę do szkoły.",
      "es": "Voy a la escuela."
    }
  ]
}

WSKAZÓWKI:
1. Klucze w "content" (np. "pl", "es") muszą odpowiadać kodom języków
2. Dla języka "pl-PL" użyj klucza "pl", dla "es-ES" użyj "es", itd.
3. Dodaj kontekst w nawiasach gdy potrzebny, np. "(Ja) jestem", "(w restauracji)"
4. Dla czasowników pokaż różne osoby (ja, ty, on/ona, my, wy, oni)
5. Dla słówek dodaj przykłady użycia w zdaniach
6. Separatory używaj rozsądnie - nie za dużo, nie za mało

PRZYKŁAD BEZ SEPARATORÓW (proste słówka):
{
  "title": "Angielski: Kolory",
  "description": "Podstawowe nazwy kolorów",
  "lang1_code": "pl-PL",
  "lang2_code": "en-US",
  "content": [
    {"pl": "czerwony", "en": "red"},
    {"pl": "niebieski", "en": "blue"},
    {"pl": "zielony", "en": "green"},
    {"pl": "żółty", "en": "yellow"},
    {"pl": "czarny", "en": "black"},
    {"pl": "biały", "en": "white"},
    {"pl": "Mój ulubiony kolor to niebieski.", "en": "My favorite color is blue."},
    {"pl": "Niebo jest niebieskie.", "en": "The sky is blue."}
  ]
}

OPIS UŻYTKOWNIKA:
{USER_PROMPT}

JĘZYKI (PODANE PRZEZ UŻYTKOWNIKA):
Lang1: {LANG1_CODE} (klucz: {LANG1_KEY})
Lang2: {LANG2_CODE} (klucz: {LANG2_KEY})

KRYTYCZNE WYMAGANIA:
1. Użyj DOKŁADNIE tych kodów języków: lang1_code="{LANG1_CODE}", lang2_code="{LANG2_CODE}"
2. Użyj DOKŁADNIE tych kluczy w content: "{LANG1_KEY}" i "{LANG2_KEY}"
3. Wszystkie pary muszą mieć oba klucze (np. {"pl": "...", "es": "..."})
4. Zwróć TYLKO czysty JSON, bez markdown (\`\`\`json), komentarzy czy dodatkowego tekstu.`
};

// Eksportuj globalnie
window.AI_PROMPTS = AI_PROMPTS;

console.log('✅ AI Prompts loaded');

})(); // End of IIFE

