# Format Danych JSON

Ten dokument opisuje dokładny format plików JSON dla quizów i treningów. Użyj tego dokumentu jako referencji przy tworzeniu nowych treści lub instruowaniu AI do ich generowania.

---

## Quizy

### Lokalizacja
Wszystkie pliki z quizami znajdują się w folderze: `/data/quizzes/`

### Nazwa pliku
- Format: `nazwa-quizu.json` (małe litery, myślniki zamiast spacji)
- Przykład: `hiszpanski-a1.json`, `matematyka-podstawy.json`

### Struktura główna

```json
{
  "title": "Tytuł Quizu",
  "description": "Krótki opis quizu (1-2 zdania)",
  "questions": [
    // Tablica pytań (patrz niżej)
  ]
}
```

### Pola główne

| Pole | Typ | Wymagane | Opis |
|------|-----|----------|------|
| `title` | string | ✅ | Nazwa quizu wyświetlana użytkownikowi |
| `description` | string | ✅ | Krótki opis, wyświetlany na karcie quizu |
| `questions` | array | ✅ | Tablica obiektów pytań (min. 1) |

---

## Typy Pytań

### 1. Multiple Choice (Wybór wielokrotny)

Użytkownik wybiera jedną poprawną odpowiedź z kilku opcji.

```json
{
  "type": "multiple-choice",
  "questionText": "Treść pytania?",
  "options": [
    {
      "text": "Opcja A",
      "isCorrect": false,
      "explanation": "Wyjaśnienie, dlaczego ta odpowiedź jest błędna."
    },
    {
      "text": "Opcja B",
      "isCorrect": true,
      "explanation": "Wyjaśnienie, dlaczego ta odpowiedź jest poprawna."
    }
  ]
}
```

**Pola:**
- `type`: zawsze `"multiple-choice"`
- `questionText`: treść pytania (string)
- `options`: tablica 2-6 opcji
  - `text`: treść odpowiedzi
  - `isCorrect`: `true` dla poprawnej, `false` dla błędnych (dokładnie jedna musi być `true`)
  - `explanation`: wyjaśnienie pokazywane po wyborze

---

### 2. Fill in the Blank (Uzupełnij lukę)

Użytkownik wpisuje brakujące słowo lub frazę.

```json
{
  "type": "fill-in-the-blank",
  "questionText": "Yo ___ (tener) un libro.",
  "correctAnswer": "tengo",
  "explanation": "Odmiana czasownika 'tener' dla pierwszej osoby."
}
```

**Pola:**
- `type`: zawsze `"fill-in-the-blank"`
- `questionText`: pytanie z luką (oznaczoną np. `___`)
- `correctAnswer`: poprawna odpowiedź (string)
- `explanation`: wyjaśnienie poprawnej odpowiedzi

**Uwaga:** Odpowiedź użytkownika jest sprawdzana bez względu na wielkość liter i polskie znaki diakrytyczne (ą→a, ó→o, etc.).

---

### 3. True/False (Prawda/Fałsz)

Użytkownik decyduje, czy stwierdzenie jest prawdziwe czy fałszywe.

```json
{
  "type": "true-false",
  "questionText": "Słońce jest zimne.",
  "isCorrect": false,
  "explanation": "Słońce jest gwiazdą i ma temperaturę około 5500°C na powierzchni."
}
```

**Pola:**
- `type`: zawsze `"true-false"`
- `questionText`: stwierdzenie do oceny
- `isCorrect`: `true` jeśli stwierdzenie jest prawdziwe, `false` jeśli fałszywe
- `explanation`: wyjaśnienie

---

### 4. Matching (Dopasowywanie)

Użytkownik dopasowuje elementy z lewej kolumny do prawej.

```json
{
  "type": "matching",
  "questionText": "Dopasuj stolicę do kraju.",
  "pairs": [
    { "item": "Polska", "match": "Warszawa" },
    { "item": "Niemcy", "match": "Berlin" },
    { "item": "Francja", "match": "Paryż" }
  ]
}
```

**Pola:**
- `type`: zawsze `"matching"`
- `questionText`: instrukcja dla użytkownika
- `pairs`: tablica par (min. 2, max. 8)
  - `item`: element z lewej kolumny
  - `match`: odpowiadający element z prawej kolumny

**Interfejs:** Lewa kolumna pokazuje `item`, prawa kolumna pokazuje `match` w losowej kolejności.

---

## Treningi

### Lokalizacja
Wszystkie pliki z treningami znajdują się w folderze: `/data/workouts/`

### Nazwa pliku
- Format: `nazwa-treningu.json` (małe litery, myślniki zamiast spacji)
- Przykład: `stalowa-garda.json`, `cardio-hiit.json`

### Struktura główna

```json
{
  "title": "Nazwa Treningu",
  "description": "Krótki opis treningu i potrzebnego sprzętu",
  "phases": [
    // Tablica faz treningu (patrz niżej)
  ]
}
```

### Pola główne

| Pole | Typ | Wymagane | Opis |
|------|-----|----------|------|
| `title` | string | ✅ | Nazwa treningu |
| `description` | string | ✅ | Opis i lista sprzętu |
| `phases` | array | ✅ | Tablica faz treningu (min. 1) |

---

## Fazy Treningu

Każdy trening składa się z faz (np. "Rozgrzewka", "Obwód 1/3", "Rozciąganie").

```json
{
  "name": "Rozgrzewka",
  "exercises": [
    // Tablica ćwiczeń (patrz niżej)
  ]
}
```

**Pola:**
- `name`: nazwa fazy (string)
- `exercises`: tablica ćwiczeń w tej fazie (min. 1)

---

## Ćwiczenia

Każde ćwiczenie ma jeden z dwóch typów: **na czas** lub **na powtórzenia**.

### Ćwiczenie na czas

```json
{
  "name": "Bieg bokserski",
  "type": "time",
  "duration": 60,
  "description": "Lekki bieg w miejscu. Ręce w gardzie, luźne, szybkie proste.",
  "details": "30s w przód, 30s w tył",
  "mediaUrl": ""
}
```

**Pola:**
- `name`: nazwa ćwiczenia (string)
- `type`: zawsze `"time"` dla ćwiczeń na czas
- `duration`: czas trwania w sekundach (number)
- `description`: szczegółowy opis techniki wykonania (string)
- `details`: opcjonalne dodatkowe informacje (string, może być puste)
- `mediaUrl`: opcjonalny link do obrazka/GIF-a (string, na razie pusty `""`)

### Ćwiczenie na powtórzenia

```json
{
  "name": "Podciąganie australijskie",
  "type": "reps",
  "details": "MAX powtórzeń",
  "description": "Na niskim drążku. Ściągnij łopatki, klatka piersiowa idzie do drążka.",
  "mediaUrl": ""
}
```

**Pola:**
- `name`: nazwa ćwiczenia (string)
- `type`: zawsze `"reps"` dla ćwiczeń na powtórzenia
- `details`: liczba powtórzeń lub zakres (string, np. "10-12 powtórzeń", "MAX")
- `description`: szczegółowy opis techniki wykonania (string)
- `mediaUrl`: opcjonalny link do obrazka/GIF-a (string, na razie pusty `""`)

**Uwaga:** Pole `duration` NIE występuje w ćwiczeniach typu `"reps"`.

---

## Pełny Przykład: Quiz

```json
{
  "title": "Hiszpański A1: Wielki Test",
  "description": "Sprawdź swoją wiedzę z podstaw języka hiszpańskiego.",
  "questions": [
    {
      "type": "multiple-choice",
      "questionText": "Uzupełnij zdanie: La ventana ___ rota.",
      "options": [
        { "text": "es", "isCorrect": false, "explanation": "Niepoprawnie. 'Ser' używamy do opisywania stałych cech." },
        { "text": "hace", "isCorrect": false, "explanation": "Niepoprawnie. 'Hacer' oznacza 'robić'." },
        { "text": "tiene", "isCorrect": false, "explanation": "Niepoprawnie. 'Tener' oznacza 'mieć'." },
        { "text": "está", "isCorrect": true, "explanation": "Poprawnie. Do opisywania stanów używamy ESTAR." }
      ]
    },
    {
      "type": "fill-in-the-blank",
      "questionText": "Mi amigo ___ de Polonia.",
      "correctAnswer": "es",
      "explanation": "Do opisywania pochodzenia używamy SER."
    },
    {
      "type": "true-false",
      "questionText": "'Mucho gusto' oznacza 'do widzenia'.",
      "isCorrect": false,
      "explanation": "'Mucho gusto' oznacza 'miło mi cię poznać'."
    },
    {
      "type": "matching",
      "questionText": "Dopasuj liczby:",
      "pairs": [
        { "item": "Jeden", "match": "Uno" },
        { "item": "Dwa", "match": "Dos" },
        { "item": "Trzy", "match": "Tres" }
      ]
    }
  ]
}
```

---

## Pełny Przykład: Trening

```json
{
  "title": "Trening 'Stalowa Garda'",
  "description": "45-minutowy trening wzmacniający. Przygotuj kettlebell (12kg), gumę oporową i hantle (2kg).",
  "phases": [
    {
      "name": "Rozgrzewka",
      "exercises": [
        {
          "name": "Bieg bokserski",
          "type": "time",
          "duration": 60,
          "description": "Lekki bieg w miejscu. Ręce w gardzie, luźne, szybkie proste.",
          "details": "",
          "mediaUrl": ""
        },
        {
          "name": "Krążenia ramion",
          "type": "time",
          "duration": 60,
          "details": "30s w przód, 30s w tył",
          "description": "Duże, obszerne koła, aby rozgrzać barki.",
          "mediaUrl": ""
        }
      ]
    },
    {
      "name": "Obwód Siłowy (Runda 1/3)",
      "exercises": [
        {
          "name": "Podciąganie australijskie",
          "type": "reps",
          "details": "MAX powtórzeń",
          "description": "Na niskim drążku. Ściągnij łopatki, klatka piersiowa idzie do drążka. Ciało proste jak deska.",
          "mediaUrl": ""
        },
        {
          "name": "Kettlebell Swing (12 kg)",
          "type": "reps",
          "details": "15-20 powtórzeń",
          "description": "Ruch eksplozywny z bioder. To nie przysiad! Napnij mocno pośladki i brzuch u góry.",
          "mediaUrl": ""
        },
        {
          "name": "Odpoczynek",
          "type": "time",
          "duration": 90,
          "description": "Złap oddech, napij się wody. Przygotuj się na kolejną rundę.",
          "details": "",
          "mediaUrl": ""
        }
      ]
    }
  ]
}
```

---

## Wskazówki dla AI

Gdy prosisz AI o wygenerowanie nowych treści, użyj następującego szablonu:

### Dla Quizu:
```
Wygeneruj plik JSON z quizem zgodnie z formatem opisanym w DATA_FORMAT.md.

Temat: [TEMAT QUIZU]
Liczba pytań: [LICZBA]
Typy pytań: [multiple-choice / fill-in-the-blank / true-false / matching]

Upewnij się, że:
- Każde pytanie ma wyjaśnienie
- Pytania są zróżnicowane
- Format JSON jest poprawny
```

### Dla Treningu:
```
Wygeneruj plik JSON z treningiem zgodnie z formatem opisanym w DATA_FORMAT.md.

Typ treningu: [np. siłowy, cardio, bokserski]
Czas trwania: [np. 30 minut]
Sprzęt: [lista sprzętu]
Poziom: [początkujący / średniozaawansowany / zaawansowany]

Upewnij się, że:
- Trening ma logiczną strukturę (rozgrzewka → główna część → rozciąganie)
- Każde ćwiczenie ma szczegółowy opis
- Format JSON jest poprawny
```

