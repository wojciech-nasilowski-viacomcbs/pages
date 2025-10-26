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
- Wszystkie teksty po polsku (chyba że użytkownik poprosi inaczej)
- Minimum 5 pytań, maksimum 20
- Jeśli użytkownik nie wskaże typów pytań, użyj różnych typów dla urozmaicenia
- **WAŻNE:** Typ "listening" używaj TYLKO gdy quiz dotyczy nauki języków obcych lub fonetyki!

TYPY PYTAŃ - SZCZEGÓŁY:

1. MULTIPLE CHOICE (wielokrotny wybór):
{
  "question": "Jaka jest stolica Polski?",
  "type": "multiple-choice",
  "options": ["Warszawa", "Kraków", "Gdańsk", "Wrocław"],
  "correctAnswer": 0
}

2. TRUE/FALSE (prawda/fałsz):
{
  "question": "Ziemia jest płaska",
  "type": "true-false",
  "correctAnswer": false
}

3. FILL IN BLANK (uzupełnij):
{
  "question": "Stolica Francji to ____",
  "type": "fill-in-blank",
  "correctAnswer": "Paryż"
}

4. LISTENING (słuchowe z TTS):
{
  "question": "Posłuchaj i wpisz usłyszane słowo",
  "type": "listening",
  "audioText": "Hello world",
  "audioLang": "en-US",
  "correctAnswer": "hello world"
}

KODY JĘZYKÓW dla audioLang:
- Polski: "pl-PL"
- Angielski (US): "en-US"
- Angielski (UK): "en-GB"
- Hiszpański: "es-ES"
- Niemiecki: "de-DE"
- Francuski: "fr-FR"
- Włoski: "it-IT"

FORMAT JSON (KOMPLETNY PRZYKŁAD):
{
  "title": "Quiz o geografii Europy",
  "description": "Sprawdź swoją wiedzę o stolicach i krajach",
  "questions": [
    {
      "question": "Jaka jest stolica Niemiec?",
      "type": "multiple-choice",
      "options": ["Berlin", "Monachium", "Hamburg", "Frankfurt"],
      "correctAnswer": 0
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
    },
    {
      "question": "Posłuchaj nazwy miasta i wpisz ją",
      "type": "listening",
      "audioText": "Paris",
      "audioLang": "en-US",
      "correctAnswer": "paris"
    }
  ]
}

OPIS UŻYTKOWNIKA:
{USER_PROMPT}

WAŻNE: Zwróć TYLKO czysty JSON, bez markdown (\`\`\`json), komentarzy czy dodatkowego tekstu.`,

  /**
   * Prompt dla generowania treningów
   */
  workout: `Jesteś ekspertem w tworzeniu planów treningowych.

ZADANIE: Wygeneruj trening w formacie JSON na podstawie opisu użytkownika.

WYMAGANIA:
- Tytuł i opis powinny być konkretne i motywujące
- Struktura: min. 2-3 fazy (np. Rozgrzewka → Trening główny → Rozciąganie)
- Każde ćwiczenie z dokładnym opisem wykonania
- Używaj TYLKO tych typów:
  • "time" - duration w sekundach (np. 30, 45, 60)
  • "reps" - liczba powtórzeń (np. 10, 15, 20)
- Wszystkie teksty po polsku (chyba że użytkownik poprosi inaczej)
- Ćwiczenia dopasowane do poziomu (początkujący/średni/zaawansowany)

TYPY ĆWICZEŃ - SZCZEGÓŁY:

1. TIME (na czas):
{
  "name": "Deska (plank)",
  "type": "time",
  "duration": 30,
  "details": "Oprzyj się na przedramionach i palcach stóp. Utrzymuj proste plecy przez cały czas."
}

2. REPS (liczba powtórzeń):
{
  "name": "Pompki",
  "type": "reps",
  "reps": 10,
  "details": "Ręce na szerokość barków. Opuść klatkę do ziemi i wyprostuj ramiona."
}

FORMAT JSON (KOMPLETNY PRZYKŁAD):
{
  "title": "Trening FBW dla początkujących",
  "description": "30-minutowy trening całego ciała bez sprzętu",
  "phases": [
    {
      "name": "Rozgrzewka",
      "exercises": [
        {
          "name": "Pajacyki (jumping jacks)",
          "type": "time",
          "duration": 30,
          "details": "Skacz rozstawiając nogi i podnosząc ręce nad głowę"
        },
        {
          "name": "Krążenia ramion",
          "type": "reps",
          "reps": 10,
          "details": "Wykonaj 10 okrążeń ramion do przodu, potem 10 do tyłu"
        }
      ]
    },
    {
      "name": "Trening główny",
      "exercises": [
        {
          "name": "Przysiady",
          "type": "reps",
          "reps": 15,
          "details": "Stopy na szerokość bioder, zegnij kolana do kąta 90 stopni"
        },
        {
          "name": "Deska",
          "type": "time",
          "duration": 45,
          "details": "Utrzymuj proste plecy, napnij brzuch"
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
          "details": "Przytrzymaj stopę przy pośladku, poczuj rozciąganie w przedniej części uda"
        }
      ]
    }
  ]
}

OPIS UŻYTKOWNIKA:
{USER_PROMPT}

WAŻNE: Zwróć TYLKO czysty JSON, bez markdown (\`\`\`json), komentarzy czy dodatkowego tekstu.`
};

// Eksportuj globalnie
window.AI_PROMPTS = AI_PROMPTS;

console.log('✅ AI Prompts loaded');

})(); // End of IIFE

