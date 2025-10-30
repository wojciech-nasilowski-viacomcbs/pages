# Format Danych JSON

Ten dokument opisuje dokładny format plików JSON dla quizów i treningów. Użyj tego dokumentu jako referencji przy tworzeniu nowych treści lub instruowaniu AI do ich generowania.

## ⚠️ Ważna Informacja o Formatach

System automatycznie konwertuje format opisany w tej dokumentacji (nazywany **formatem zewnętrznym** lub **v1**) do formatu wewnętrznego używanego w bazie danych (**format v2**). 

**Zawsze używaj formatu opisanego w tym dokumencie** - konwersja odbywa się automatycznie podczas importu.

### Główne różnice między formatami:

| Element | Format zewnętrzny (v1) - używaj tego! | Format wewnętrzny (v2) |
|---------|----------------------------------------|------------------------|
| Pole pytania | `questionText` | `question` |
| Typ luki | `fill-in-the-blank` | `fill-in-blank` |
| Multiple-choice opcje | `[{text: "A", isCorrect: true}, ...]` | `["A", "B", ...]` + `correctAnswer: 0` |
| True/False | `isCorrect: true/false` | `correctAnswer: true/false` |

**Nie musisz się tym przejmować** - po prostu używaj formatu z tego dokumentu, a system zajmie się resztą.

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

## Opcje Quizu

Przed rozpoczęciem quizu użytkownik może wybrać następujące opcje:

### Losowa kolejność pytań
- Checkbox: "Losowa kolejność pytań"
- Funkcja: Jeśli zaznaczone, pytania w quizie będą wyświetlane w losowej kolejności
- Preferencja użytkownika jest zapisywana w `localStorage` i przywracana przy kolejnych quizach

### Pomiń pytania słuchowe
- Checkbox: "Pomiń pytania słuchowe"
- Funkcja: Jeśli zaznaczone, wszystkie pytania typu `"listening"` zostaną pominięte w quizie
- Przydatne gdy użytkownik nie ma możliwości słuchania audio (np. w miejscu publicznym)
- Preferencja użytkownika jest zapisywana w `localStorage` i przywracana przy kolejnych quizach

### Zapisywanie postępu
- System automatycznie zapisuje postęp quizu w `localStorage`
- Przy ponownym otwarciu tego samego quizu użytkownik może kontynuować od miejsca, w którym zakończył
- Postęp zapisuje: numer aktualnego pytania, wynik, udzielone odpowiedzi, kolejność pytań (jeśli była losowana)

### Powtórzenie błędów
- Po zakończeniu quizu, jeśli użytkownik popełnił błędy, dostępny jest przycisk "Powtórz tylko błędy"
- Funkcja umożliwia przećwiczenie tylko tych pytań, na które odpowiedział błędnie
- Lista błędnych pytań jest zachowywana podczas sesji

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

**Uwaga:** 
- Odpowiedź użytkownika jest sprawdzana bez względu na wielkość liter i znaki diakrytyczne.
- Normalizacja usuwa: akcenty (ą→a, ó→o, ñ→n, é→e, etc.) i konwertuje na małe litery.
- Biała przestrzeń na początku i końcu jest usuwana (`trim()`).
- **Ważne:** W przeciwieństwie do pytań `listening`, znaki interpunkcyjne NIE są usuwane w `fill-in-the-blank`.

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

**Interfejs:** 
- Lewa kolumna pokazuje `item`, prawa kolumna pokazuje `match` w losowej kolejności.
- Użytkownik klika element z lewej, a następnie odpowiadający element z prawej
- Dopasowane pary są oznaczone kolorem fioletowym
- Kliknięcie na dopasowaną parę cofa dopasowanie (umożliwia poprawkę)
- Przycisk "Sprawdź odpowiedzi" jest aktywny tylko gdy wszystkie pary są dopasowane
- Po sprawdzeniu: poprawne pary są zielone, błędne są czerwone
- Jeśli nie wszystkie pary są poprawne, wyświetlana jest lista prawidłowych dopasowań

---

### 5. Listening (Pytanie słuchowe)

Użytkownik słucha tekstu odczytanego przez syntezator mowy (TTS) i wpisuje, co usłyszał.

```json
{
  "type": "listening",
  "questionText": "Posłuchaj i wpisz, co usłyszałeś:",
  "audioText": "The cat is on the table",
  "audioLang": "en-US",
  "audioRate": 0.85,
  "correctAnswer": "The cat is on the table",
  "acceptableAnswers": ["The cat's on the table", "The cat is on a table"],
  "explanation": "Zdanie oznacza: Kot jest na stole.",
  "autoPlay": true
}
```

**Pola:**
- `type`: zawsze `"listening"`
- `questionText`: instrukcja dla użytkownika (string)
- `audioText`: tekst do odczytania przez TTS (string, **wymagane**)
- `audioLang`: kod języka (string, np. `"en-US"`, `"es-ES"`, `"pl-PL"`, domyślnie `"en-US"`)
- `audioRate`: prędkość mowy (number, 0.1-10, domyślnie `0.85` - wolniej dla nauki)
- `correctAnswer`: poprawna odpowiedź (string, **wymagane**)
- `acceptableAnswers`: opcjonalna tablica alternatywnych poprawnych odpowiedzi (array of strings)
- `explanation`: wyjaśnienie (string)
- `autoPlay`: czy automatycznie odtworzyć przy wyświetleniu pytania (boolean, domyślnie `true`)

**Uwaga:** 
- Odpowiedź użytkownika jest sprawdzana bez wielkości liter, akcentów i znaków interpunkcyjnych.
  - Normalizacja usuwa: akcenty/znaki diakrytyczne (ą→a, ó→o, ñ→n, é→e), wielkość liter, znaki interpunkcyjne
  - Przykład: "¿Cómo estás?" jest równoważne z "como estas" lub "Como estas"
- Użytkownik może wielokrotnie odtworzyć nagranie przyciskiem "🔊 Odtwórz" lub "🐌 Wolniej" (70% prędkości).
- Po udzieleniu odpowiedzi audio zostaje automatycznie zatrzymane.
- TTS wykorzystuje Web Speech API dostępne w przeglądarkach (Chrome, Edge, Safari).
- Funkcja `autoPlay: false` pozwala wyłączyć automatyczne odtwarzanie przy pierwszym wyświetleniu pytania.

---

## Opcjonalne Audio dla Wszystkich Typów Pytań

Każdy typ pytania może mieć opcjonalne pole audio, które dodaje przycisk "🔊 Odtwórz" do odczytania pytania lub fragmentu tekstu:

```json
{
  "type": "multiple-choice",
  "questionText": "Co oznacza to słowo?",
  "audioText": "restaurant",
  "audioLang": "en-US",
  "audioRate": 0.85,
  "options": [...]
}
```

**Opcjonalne pola audio:**
- `audioText`: tekst do odczytania (string)
- `audioLang`: kod języka (string, domyślnie `"en-US"`)
- `audioRate`: prędkość mowy (number, domyślnie `0.85`)

Te pola można dodać do typów: `multiple-choice`, `fill-in-the-blank`, `true-false`, `matching`.

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
  "emoji": "💪",
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
| `emoji` | string | ⚠️ Opcjonalne | Emotikona reprezentująca typ treningu (domyślnie: 💪) |
| `phases` | array | ✅ | Tablica faz treningu (min. 1) |

**Dostępne emotikony dla treningów:**
- 💪 - Trening siłowy, FBW, ogólny trening (domyślna)
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

## Funkcje Treningów

### Wake Lock API
- System automatycznie aktywuje Wake Lock API podczas treningu, aby zapobiec wygaszaniu ekranu
- Funkcja działa w przeglądarkach wspierających Wake Lock API (Chrome, Edge)
- Wake Lock jest automatycznie zwalniany po zakończeniu treningu

### Zapisywanie postępu
- System automatycznie zapisuje postęp treningu w `localStorage`
- Przy ponownym otwarciu tego samego treningu użytkownik może kontynuować od miejsca, w którym zakończył
- Postęp zapisuje: numer aktualnej fazy, numer aktualnego ćwiczenia

### Timer dla ćwiczeń czasowych
- Dla ćwiczeń typu `"time"` automatycznie uruchamia się timer odliczający
- W ostatnich 5 sekundach timer pulsuje na czerwono z animacją
- Po zakończeniu timera odtwarzany jest dźwięk powiadomienia (dwa krótkie "bip-bip")
- Wibracja urządzenia (jeśli dostępna) sygnalizuje koniec timera

### Pomijanie ćwiczeń
- Użytkownik może pominąć aktualne ćwiczenie przyciskiem "Pomiń ćwiczenie"
- Funkcja przydatna gdy użytkownik nie może wykonać konkretnego ćwiczenia

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
    },
    {
      "type": "listening",
      "questionText": "Posłuchaj i wpisz zdanie po hiszpańsku:",
      "audioText": "Hola, ¿cómo estás?",
      "audioLang": "es-ES",
      "correctAnswer": "Hola, ¿cómo estás?",
      "acceptableAnswers": ["Hola como estas", "Hola, como estás"],
      "explanation": "To zdanie oznacza: 'Cześć, jak się masz?'"
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

---

## Obsługiwane Języki TTS

System TTS (Text-to-Speech) wykorzystuje Web Speech API dostępne w przeglądarce. Poniżej lista najczęściej używanych kodów języków:

### Języki europejskie
- `pl-PL` - Polski
- `en-US` - Angielski (USA)
- `en-GB` - Angielski (Wielka Brytania)
- `es-ES` - Hiszpański (Hiszpania)
- `es-MX` - Hiszpański (Meksyk)
- `de-DE` - Niemiecki
- `fr-FR` - Francuski
- `it-IT` - Włoski
- `pt-PT` - Portugalski (Portugalia)
- `pt-BR` - Portugalski (Brazylia)

### Inne języki
- `ja-JP` - Japoński
- `zh-CN` - Chiński (uproszczony)
- `ko-KR` - Koreański
- `ru-RU` - Rosyjski
- `ar-SA` - Arabski

**Uwaga:** Dostępność głosów zależy od przeglądarki i systemu operacyjnego użytkownika. Najlepsze wsparcie oferują Chrome i Edge.

---

## Najlepsze Praktyki

### Dla Quizów
1. **Wyjaśnienia** - Każde pytanie powinno mieć wyjaśnienie, najlepiej z dodatkowym kontekstem
2. **Zróżnicowanie** - Używaj różnych typów pytań dla lepszego doświadczenia uczenia
3. **Audio** - Dla quizów językowych dodawaj opcjonalne audio do pytań multiple-choice i fill-in-the-blank
4. **Pytania słuchowe** - Używaj `acceptableAnswers` dla różnych poprawnych wariantów odpowiedzi
5. **Długość** - Optymalnie 15-30 pytań na quiz (użytkownik może przerwać i wrócić później)

### Dla Treningów  
1. **Struktura** - Zawsze rozpoczynaj rozgrzewką, kończ rozciąganiem
2. **Opis techniki** - Szczegółowe opisy wykonania ćwiczeń są kluczowe dla bezpieczeństwa
3. **Odpoczynek** - Pamiętaj o ćwiczeniach odpoczynkowych między obwodami
4. **Czas ćwiczeń** - Dla początkujących 30-60s, dla zaawansowanych do 90s
5. **Nazewnictwo faz** - Jasne nazwy faz (np. "Rozgrzewka", "Obwód 1/3", "Rozciąganie")

---

## Historia Zmian w Formacie

### Aktualna wersja (v1)
- ✅ Wszystkie 5 typów pytań w quizach
- ✅ Pytania słuchowe (listening) z TTS
- ✅ Opcjonalne audio dla wszystkich typów pytań
- ✅ Ćwiczenia na czas i powtórzenia
- ✅ Wake Lock API dla treningów
- ✅ Zapisywanie postępu quizów i treningów
- ✅ Losowanie pytań w quizach
- ✅ Pomijanie pytań słuchowych
- ✅ Powtarzanie błędnych pytań

### Planowane funkcje (v2)
- 🔄 Wsparcie dla obrazków i GIF-ów w ćwiczeniach (`mediaUrl`)
- 🔄 Więcej typów pytań quizowych
- 🔄 Zaawansowane statystyki i śledzenie postępu
- 🔄 Ręczna edycja emotikonek w interfejsie użytkownika

---

## Nauka ze Słuchu (Nowa Funkcjonalność)

### Lokalizacja
Dane dla tej funkcjonalności są przechowywane w bazie danych **Supabase**, w tabeli `listening_sets`. Nie są one ładowane z plików JSON, jak quizy czy treningi.

### Struktura Obiektu w Bazie Danych

Każdy wiersz w tabeli `listening_sets` reprezentuje jeden zestaw do nauki. Kolumna `content` w tej tabeli przechowuje dane w formacie JSONB. Poniżej opisano strukturę tego obiektu.

### Struktura Główna

```json
{
  "title": "Tytuł Zestawu do Nauki",
  "description": "Krótki opis, co zawiera zestaw.",
  "lang1_code": "pl-PL",
  "lang2_code": "es-ES",
  "content": [
    // Tablica par językowych (patrz niżej)
  ]
}
```

### Pola Główne

| Pole | Typ | Wymagane | Opis |
|---|---|---|---|
| `title` | string | ✅ | Nazwa zestawu wyświetlana na liście |
| `description` | string | ✅ | Krótki opis, widoczny pod tytułem |
| `lang1_code` | string | ✅ | Kod języka dla pierwszej części pary (np. "pl-PL") |
| `lang2_code` | string | ✅ | Kod języka dla drugiej części pary (np. "es-ES") |
| `content` | array | ✅ | Tablica obiektów z parami językowymi (min. 1) |

---

### Pary Językowe

Tablica `content` zawiera obiekty, gdzie klucze dynamicznie odpowiadają skrótom języków (np. "pl", "es", "en").

```json
[
  {
    "pl": "--- CZASOWNIK: ESTAR ---",
    "es": "--- VERBO: ESTAR ---"
  },
  {
    "pl": "(Ja) jestem",
    "es": "(Yo) estoy"
  },
  {
    "pl": "Jestem zmęczony.",
    "es": "Estoy cansado."
  }
]
```

**Pola w parach:**
- Klucze (np. `"pl"`, `"es"`) powinny być prostymi, dwuliterowymi kodami języków.
- Wartości to tekst (string), który ma być wyświetlony i odczytany przez syntezator mowy.
- **Separatory**: Teksty w formacie `--- OPIS ---` są traktowane jako nagłówki sekcji, anonsowane głosowo z dłuższą przerwą.

---

## Funkcje Odtwarzacza

### Kontrola
- **Play/Pauza**: Uruchamia i zatrzymuje odtwarzanie.
- **Zapętlanie**: Opcja (włącz/wyłącz) pozwalająca na odtwarzanie listy w nieskończonej pętli.
- **Zmiana Kolejności Języków**: Przycisk pozwalający przełączyć kolejność odtwarzania, np. z `PL -> ES` na `ES -> PL`.

### Logika Odtwarzania
- **Sekwencja**: Domyślnie `Język 1` -> `1s pauzy` -> `Język 2` -> `3s pauzy` -> `następna para`.
- **Separatory**: Po odtworzeniu nagłówka sekcji następuje `4s pauzy`.

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

---

## Obsługiwane Języki TTS

System TTS (Text-to-Speech) wykorzystuje Web Speech API dostępne w przeglądarce. Poniżej lista najczęściej używanych kodów języków:

### Języki europejskie
- `pl-PL` - Polski
- `en-US` - Angielski (USA)
- `en-GB` - Angielski (Wielka Brytania)
- `es-ES` - Hiszpański (Hiszpania)
- `es-MX` - Hiszpański (Meksyk)
- `de-DE` - Niemiecki
- `fr-FR` - Francuski
- `it-IT` - Włoski
- `pt-PT` - Portugalski (Portugalia)
- `pt-BR` - Portugalski (Brazylia)

### Inne języki
- `ja-JP` - Japoński
- `zh-CN` - Chiński (uproszczony)
- `ko-KR` - Koreański
- `ru-RU` - Rosyjski
- `ar-SA` - Arabski

**Uwaga:** Dostępność głosów zależy od przeglądarki i systemu operacyjnego użytkownika. Najlepsze wsparcie oferują Chrome i Edge.

---

## Najlepsze Praktyki

### Dla Quizów
1. **Wyjaśnienia** - Każde pytanie powinno mieć wyjaśnienie, najlepiej z dodatkowym kontekstem
2. **Zróżnicowanie** - Używaj różnych typów pytań dla lepszego doświadczenia uczenia
3. **Audio** - Dla quizów językowych dodawaj opcjonalne audio do pytań multiple-choice i fill-in-the-blank
4. **Pytania słuchowe** - Używaj `acceptableAnswers` dla różnych poprawnych wariantów odpowiedzi
5. **Długość** - Optymalnie 15-30 pytań na quiz (użytkownik może przerwać i wrócić później)

### Dla Treningów  
1. **Struktura** - Zawsze rozpoczynaj rozgrzewką, kończ rozciąganiem
2. **Opis techniki** - Szczegółowe opisy wykonania ćwiczeń są kluczowe dla bezpieczeństwa
3. **Odpoczynek** - Pamiętaj o ćwiczeniach odpoczynkowych między obwodami
4. **Czas ćwiczeń** - Dla początkujących 30-60s, dla zaawansowanych do 90s
5. **Nazewnictwo faz** - Jasne nazwy faz (np. "Rozgrzewka", "Obwód 1/3", "Rozciąganie")

---

## Historia Zmian w Formacie

### Aktualna wersja (v1)
- ✅ Wszystkie 5 typów pytań w quizach
- ✅ Pytania słuchowe (listening) z TTS
- ✅ Opcjonalne audio dla wszystkich typów pytań
- ✅ Ćwiczenia na czas i powtórzenia
- ✅ Wake Lock API dla treningów
- ✅ Zapisywanie postępu quizów i treningów
- ✅ Losowanie pytań w quizach
- ✅ Pomijanie pytań słuchowych
- ✅ Powtarzanie błędnych pytań

### Planowane funkcje (v2)
- 🔄 Wsparcie dla obrazków i GIF-ów w ćwiczeniach (`mediaUrl`)
- 🔄 Więcej typów pytań quizowych
- 🔄 Zaawansowane statystyki i śledzenie postępu

---

## Rozwiązywanie Problemów

### Błąd: "Brak faz lub 'phases' nie jest tablicą" przy imporcie quizu

**Przyczyna:** System próbuje zwalidować quiz jako trening.

**Rozwiązanie:** 
1. Upewnij się, że jesteś na zakładce **"Quizy"** przed otwarciem okna importu
2. Sprawdź, czy Twój plik ma pole `questions` (nie `phases`)
3. Odśwież stronę i spróbuj ponownie

### Błąd: "Brak pytań lub 'questions' nie jest tablicą" przy imporcie treningu

**Przyczyna:** System próbuje zwalidować trening jako quiz.

**Rozwiązanie:**
1. Upewnij się, że jesteś na zakładce **"Treningi"** przed otwarciem okna importu
2. Sprawdź, czy Twój plik ma pole `phases` (nie `questions`)
3. Odśwież stronę i spróbuj ponownie

### Błąd walidacji pytania

Jeśli otrzymujesz błędy typu "Pytanie X: brak pola...", sprawdź:
- Czy używasz `questionText` (nie `question`)
- Czy dla `multiple-choice` używasz struktury z `isCorrect` w opcjach (patrz przykłady)
- Czy dla `fill-in-the-blank` używasz dokładnie tego typu (z myślnikami)
- Czy dla `true-false` używasz `isCorrect` (nie `correctAnswer`)

### JSON nie parsuje się

**Przyczyna:** Błąd składni JSON.

**Rozwiązanie:**
1. Użyj walidatora JSON online (np. jsonlint.com)
2. Sprawdź, czy wszystkie nawiasy są zamknięte
3. Sprawdź, czy nie ma przecinków na końcu ostatniego elementu w tablicy/obiekcie
4. Sprawdź, czy stringi są w podwójnych cudzysłowach (nie pojedynczych)

