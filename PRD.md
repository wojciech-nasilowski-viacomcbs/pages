# PRD: Interaktywna Strona z Quizami i Treningami

> **Dokument Wymagań Produktowych** (Product Requirements Document)

## 📌 Dokumentacja Projektu

Ten dokument stanowi główny punkt odniesienia dla projektu. Szczegółowe informacje znajdują się w dedykowanych plikach:

- **[README.md](README.md)** - Instrukcja instalacji i użytkowania
- **[TECH_STACK.md](TECH_STACK.md)** - Szczegóły techniczne i architektura
- **[DATA_FORMAT.md](DATA_FORMAT.md)** - Specyfikacja formatów JSON (dla twórców treści i AI)

---

## 1. Cel Projektu

Stworzenie lekkiej, statycznej strony internetowej (Single Page Application) hostowanej na GitHub Pages. Aplikacja ma umożliwiać użytkownikom:
- Rozwiązywanie **quizów** z różnymi typami pytań
- Przeprowadzanie **interaktywnych treningów** fitness z timerem

**Kluczowe cechy:**
- Prosta w obsłudze
- Responsywna (mobile-first)
- Nowoczesny, ciemny interfejs
- Bez bazy danych - wszystko w plikach JSON

---

## 2. Stos Technologiczny

> Szczegóły: [TECH_STACK.md](TECH_STACK.md)

- **HTML5**: Jeden plik `index.html` jako szkielet SPA
- **CSS**: Tailwind CSS (CDN) - ciemny motyw, responsywność
- **JavaScript**: Vanilla ES6+ (bez frameworków)
- **Dane**: Pliki JSON w folderze `/data`
- **Hosting**: GitHub Pages
- **Narzędzia**: Node.js (skrypt `generate-manifest.js`)

---

## 3. Struktura Plików

```
/
├── index.html                 # Główna strona aplikacji
├── README.md                  # Instrukcja użytkowania
├── PRD.md                     # Ten dokument
├── TECH_STACK.md              # Dokumentacja techniczna
├── DATA_FORMAT.md             # Specyfikacja formatów JSON
├── generate-manifest.js       # Skrypt generujący manifest
│
├── /data/
│   ├── manifest.json          # Lista plików (auto-generowany)
│   ├── /quizzes/              # Pliki JSON z quizami
│   │   └── *.json
│   └── /workouts/             # Pliki JSON z treningami
│       └── *.json
│
└── /js/
    ├── app.js                 # Główna logika, routing, stan
    ├── quiz-engine.js         # Renderowanie i obsługa quizów
    ├── workout-engine.js      # Renderowanie i obsługa treningów
    └── audio.js               # Generowanie dźwięków (Web Audio API)
```

---

## 4. Główne Funkcjonalności

### 4.1 Nawigacja i UI
- **Strona główna**: Dwie zakładki ("Quizy", "Treningi")
- **Prezentacja treści**: Siatka kart (kafelków) z tytułem i opisem
- **Dynamiczne ładowanie**: Automatyczne wykrywanie plików z `manifest.json`
- **Responsywność**: Mobile-first design

### 4.2 Quizy
- **Typy pytań**:
  - Multiple Choice (wybór wielokrotny)
  - Fill in the Blank (uzupełnianie luk)
  - True/False (prawda/fałsz)
  - Matching (dopasowywanie)
- **Feedback**: Natychmiastowa informacja zwrotna z wyjaśnieniem
- **Podsumowanie**: Ekran końcowy z wynikami (%, liczba poprawnych)
- **Walidacja**: Odpowiedzi bez względu na wielkość liter i akcenty

### 4.3 Treningi
- **Typy ćwiczeń**:
  - Na czas (z odliczaniem)
  - Na powtórzenia (użytkownik potwierdza wykonanie)
- **Struktura**: Fazy (np. rozgrzewka, główna część, rozciąganie)
- **Timer**: Odliczanie z wizualizacją (ostatnie 5s - czerwony, pulsujący)
- **Opisy**: Szczegółowe instrukcje wykonania każdego ćwiczenia
- **Ekran końcowy**: Gratulacje po ukończeniu treningu
- **Wake Lock**: Ekran nie wygasa podczas treningu (Screen Wake Lock API)

### 4.4 Dodatkowe Funkcje
- **Utrwalanie sesji**: `localStorage` - zapisywanie postępu
- **Powrót do sesji**: Dialog "Czy chcesz kontynuować?" po powrocie
- **Sygnały dźwiękowe**: 
  - Poprawna odpowiedź (pozytywny ton)
  - Błędna odpowiedź (negatywny ton)
  - Koniec timera (dwa krótkie sygnały)
  - Przycisk wyciszania (globalny)
- **Obsługa błędów**: Komunikaty przy problemach z ładowaniem danych

---

## 5. Format Danych

> **Pełna specyfikacja**: [DATA_FORMAT.md](DATA_FORMAT.md)

### 5.1 Quizy (`/data/quizzes/*.json`)

```json
{
  "title": "Tytuł Quizu",
  "description": "Krótki opis",
  "questions": [
    {
      "type": "multiple-choice | fill-in-the-blank | true-false | matching",
      // ... pola specyficzne dla typu
    }
  ]
}
```

### 5.2 Treningi (`/data/workouts/*.json`)

```json
{
  "title": "Nazwa Treningu",
  "description": "Opis i sprzęt",
  "phases": [
    {
      "name": "Nazwa fazy",
      "exercises": [
        {
          "name": "Nazwa ćwiczenia",
          "type": "time | reps",
          "duration": 60,  // dla type: "time"
          "details": "...",
          "description": "...",
          "mediaUrl": ""
        }
      ]
    }
  ]
}
```

### 5.3 Manifest (`/data/manifest.json`)

Automatycznie generowany przez `generate-manifest.js`:

```json
{
  "quizzes": ["quiz1.json", "quiz2.json"],
  "workouts": ["workout1.json", "workout2.json"],
  "generatedAt": "2025-10-24T12:00:00.000Z"
}
```

---

## 6. Workflow Dodawania Treści

1. **Stwórz plik JSON** w odpowiednim folderze (`/data/quizzes/` lub `/data/workouts/`)
2. **Wypełnij zgodnie z formatem** z [DATA_FORMAT.md](DATA_FORMAT.md)
3. **Wygeneruj manifest**: `node generate-manifest.js`
4. **Commit i push**: Treść pojawi się automatycznie na stronie

### Użycie AI do Generowania Treści

Możesz przekazać AI plik [DATA_FORMAT.md](DATA_FORMAT.md) wraz z instrukcją, a AI wygeneruje poprawny JSON.

**Przykład**:
```
Przeczytaj DATA_FORMAT.md i wygeneruj quiz z 15 pytań 
o historii starożytnej Grecji. Użyj wszystkich typów pytań.
```

---

## 7. Wymagania Niefunkcjonalne

### 7.1 Wydajność
- Szybkie ładowanie (< 2s na 3G)
- Płynne animacje (60 FPS)
- Minimalne opóźnienia przy interakcji

### 7.2 Dostępność
- Semantyczny HTML
- Kontrast kolorów (WCAG AA)
- Obsługa klawiatury

### 7.3 Kompatybilność
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Urządzenia mobilne (iOS, Android)

### 7.4 Bezpieczeństwo
- Statyczna strona (brak backendu = brak ataków serwerowych)
- Walidacja danych JSON po stronie klienta
- Brak przechowywania danych osobowych

---

## 8. Przyszłe Rozszerzenia (Opcjonalne)

- 🖼️ Obrazki/GIF-y w ćwiczeniach (pole `mediaUrl`)
- 📊 Statystyki długoterminowe (wykres postępów)
- 🏆 System osiągnięć/odznak
- 🌐 Wsparcie dla wielu języków (i18n)
- 📱 Progressive Web App (PWA)
- 🔊 Nagrania głosowe z instrukcjami

---

## 9. Kontakt i Wsparcie

- **Issues**: [GitHub Issues](https://github.com/[username]/[repo]/issues)
- **Dokumentacja**: Pliki `.md` w repozytorium
- **Licencja**: MIT

---

**Wersja dokumentu**: 1.0  
**Ostatnia aktualizacja**: 2025-10-24
