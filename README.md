# eTrener - Interaktywna Platforma Edukacyjna

Nowoczesna aplikacja webowa do nauki i treningów - quizy, treningi fitness i nauka języków przez słuchanie.

## 📋 Spis Treści

- [Opis Projektu](#opis-projektu)
- [Funkcjonalności](#funkcjonalności)
- [Instalacja i Uruchomienie](#instalacja-i-uruchomienie)
- [Jak Dodać Nowe Treści](#jak-dodać-nowe-treści)
- [Struktura Projektu](#struktura-projektu)
- [Dokumentacja](#dokumentacja)
- [Deployment na GitHub Pages](#deployment-na-github-pages)

---

## Opis Projektu

**eTrener** to nowoczesna, responsywna aplikacja webowa umożliwiająca:
- Rozwiązywanie **quizów** z różnymi typami pytań (wybór wielokrotny, uzupełnianie luk, prawda/fałsz, dopasowywanie, słuchowe)
- Przeprowadzanie **interaktywnych treningów** z timerem i liczeniem powtórzeń
- Naukę języków przez **słuchanie** z automatycznym TTS
- Generowanie treści przez **AI** (OpenRouter)
- Import i eksport treści w formacie JSON
- Zapisywanie danych w chmurze (Supabase)
- System autentykacji użytkowników
- Sygnały dźwiękowe generowane dynamicznie (Web Audio API)

**Technologie**: HTML5, Tailwind CSS, Vanilla JavaScript (ES6+), Supabase, JSDoc

**Developer Tools**: JSDoc type safety, DOM helpers, IntelliSense support, Reactive state management

---

## Funkcjonalności

✅ **Quizy**
- 4 typy pytań: wybór wielokrotny, uzupełnianie luk, prawda/fałsz, dopasowywanie
- Natychmiastowa informacja zwrotna z wyjaśnieniem
- Ekran podsumowania z wynikami

✅ **Treningi**
- Ćwiczenia na czas (z timerem) i na powtórzenia
- Podział na fazy (rozgrzewka, główna część, rozciąganie)
- Szczegółowe opisy techniki wykonania

✅ **UX**
- Responsywny design (mobile-first)
- Ciemny motyw
- Zapisywanie postępu sesji
- Dźwięki (z możliwością wyciszenia)

---

## Instalacja i Uruchomienie

### Wymagania

- **Node.js** (v14+) - tylko do generowania manifestu
- Przeglądarka wspierająca ES6+ (Chrome 90+, Firefox 88+, Safari 14+)

### Krok 1: Sklonuj repozytorium

```bash
git clone https://github.com/[twoj-username]/[nazwa-repo].git
cd [nazwa-repo]
```

### Krok 2: Wygeneruj manifest

Po dodaniu nowych plików JSON, uruchom:

```bash
node generate-manifest.js
```

Ten skrypt automatycznie przeskanuje foldery `/data/quizzes` i `/data/workouts` i stworzy plik `data/manifest.json`.

### Krok 3: Otwórz w przeglądarce

Możesz otworzyć `index.html` bezpośrednio w przeglądarce lub użyć lokalnego serwera:

```bash
# Prosty serwer HTTP (Python 3)
python3 -m http.server 8000

# Lub (Python 2)
python -m SimpleHTTPServer 8000

# Lub (Node.js - wymaga instalacji)
npx http-server
```

Następnie otwórz: `http://localhost:8000`

---

## Jak Dodać Nowe Treści

### Dodawanie Quizu

1. **Stwórz plik JSON** w folderze `/data/quizzes/`
   - Nazwa: `nazwa-quizu.json` (małe litery, myślniki)
   - Przykład: `matematyka-podstawy.json`

2. **Wypełnij zgodnie z formatem** opisanym w [`DATA_FORMAT.md`](DATA_FORMAT.md)

3. **Wygeneruj manifest**:
   ```bash
   node generate-manifest.js
   ```

4. **Gotowe!** Quiz pojawi się automatycznie na stronie.

### Dodawanie Treningu

1. **Stwórz plik JSON** w folderze `/data/workouts/`
   - Nazwa: `nazwa-treningu.json` (małe litery, myślniki)
   - Przykład: `cardio-hiit.json`

2. **Wypełnij zgodnie z formatem** opisanym w [`DATA_FORMAT.md`](DATA_FORMAT.md)

3. **Wygeneruj manifest**:
   ```bash
   node generate-manifest.js
   ```

4. **Gotowe!** Trening pojawi się automatycznie na stronie.

### Używanie AI do Generowania Treści

Możesz użyć AI (np. ChatGPT, Claude) do wygenerowania nowych treści. Wystarczy, że:

1. Przekażesz AI plik [`DATA_FORMAT.md`](DATA_FORMAT.md)
2. Opiszesz, jaki quiz/trening chcesz stworzyć
3. AI wygeneruje poprawny JSON

**Przykład promptu**:
```
Przeczytaj plik DATA_FORMAT.md i wygeneruj quiz z 10 pytań na temat 
historii Polski. Użyj różnych typów pytań. Format JSON.
```

---

## Struktura Projektu

```
/
├── index.html                 # Główna strona aplikacji
├── README.md                  # Ten plik
├── PRD.md                     # Dokument wymagań produktowych
├── TECH_STACK.md              # Szczegóły techniczne
├── DATA_FORMAT.md             # Specyfikacja formatów JSON
├── STATE_MANAGEMENT.md        # 🆕 Dokumentacja state managera
├── generate-manifest.js       # Skrypt do generowania manifestu
│
├── /data/
│   ├── manifest.json          # Lista dostępnych plików (generowany)
│   ├── /quizzes/
│   │   └── *.json             # Pliki z quizami
│   └── /workouts/
│       └── *.json             # Pliki z treningami
│
└── /js/
    ├── app.js                 # Główna logika aplikacji
    ├── state-manager.js       # 🆕 Reaktywny store (pub/sub)
    ├── ui-state.js            # 🆕 Manager stanu UI
    ├── ui-manager.js          # Zarządzanie widokami
    ├── quiz-engine.js         # Obsługa quizów
    ├── workout-engine.js      # Obsługa treningów
    ├── listening-engine.js    # Obsługa słuchania (TTS)
    ├── audio.js               # Generowanie dźwięków
    ├── dom-helpers.js         # Biblioteka pomocnicza DOM
    └── types.js               # Definicje typów JSDoc
```

---

## State Management (v2.1)

Aplikacja używa lekkiego, reaktywnego systemu zarządzania stanem w vanilla JavaScript.

### 🎯 Architektura

```
state-manager.js (Generic store) 
    ↓
ui-state.js (UI logic)
    ↓
ui-manager.js, listening-engine.js (Consumers)
```

### 🚀 Podstawowe użycie

```javascript
// Nawiguj do ekranu (automatycznie zarządza tab barem)
uiState.navigateToScreen('quiz');      // Ukryje tab bar (aktywność)
uiState.navigateToScreen('main');      // Pokaże tab bar (nawigacja)

// Zarządzaj odtwarzaczem słuchania
uiState.setListeningPlayerActive(true);  // Ukryj tab bar
uiState.setListeningPlayerActive(false); // Pokaż tab bar

// Subskrybuj zmiany stanu (reactive)
const unsubscribe = uiState.subscribe((state, prevState) => {
  console.log('Screen changed:', state.currentScreen);
});
```

### 📋 Automatyczne zarządzanie Tab Barem

| Typ ekranu | Przykłady | Tab Bar |
|------------|-----------|---------|
| **Nawigacyjne** | `main`, `more` | ✅ Widoczny |
| **Aktywności** | `quiz`, `workout`, odtwarzacz | ❌ Ukryty |
| **Podsumowania** | `quiz-summary`, `workout-end` | ✅ Widoczny |

### 📚 Pełna dokumentacja

Zobacz **[STATE_MANAGEMENT.md](STATE_MANAGEMENT.md)** dla szczegółów, API reference i przykładów.

---

## Dokumentacja

### Dla Użytkowników:
- **[PRD.md](PRD.md)** - Pełny dokument wymagań produktowych
- **[TECH_STACK.md](TECH_STACK.md)** - Szczegóły techniczne i architektura
- **[DATA_FORMAT.md](DATA_FORMAT.md)** - Dokładna specyfikacja formatów JSON (WAŻNE dla tworzenia treści!)

### Dla Deweloperów:
- **[JSDOC_TYPESCRIPT_SUMMARY.md](JSDOC_TYPESCRIPT_SUMMARY.md)** - Podsumowanie ulepszeń JSDoc i TypeScript
- **[DOM_HELPERS_EXAMPLES.md](DOM_HELPERS_EXAMPLES.md)** - Przykłady użycia DOM helpers
- **[TYPESCRIPT_MIGRATION.md](TYPESCRIPT_MIGRATION.md)** - Przewodnik migracji do TypeScript (opcjonalnie)
- **[STATE_MANAGEMENT.md](STATE_MANAGEMENT.md)** - 🆕 Dokumentacja systemu zarządzania stanem
- **`js/types.js`** - Centralne definicje typów JSDoc
- **`js/dom-helpers.js`** - Biblioteka pomocnicza do manipulacji DOM
- **`js/state-manager.js`** - 🆕 Reaktywny store z subskrypcjami
- **`js/ui-state.js`** - 🆕 Manager stanu UI (ekrany, tab bar)

---

## Deployment na GitHub Pages

### Krok 1: Przygotuj repozytorium

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### Krok 2: Włącz GitHub Pages

1. Przejdź do ustawień repozytorium na GitHub
2. Sekcja **Pages**
3. Source: wybierz branch `main` i folder `/ (root)`
4. Kliknij **Save**

### Krok 3: Poczekaj chwilę

GitHub automatycznie zbuduje i opublikuje stronę. URL będzie dostępny w ustawieniach:
```
https://[twoj-username].github.io/[nazwa-repo]/
```

### Aktualizacja treści

Za każdym razem, gdy dodasz nowe pliki:

```bash
# 1. Wygeneruj manifest
node generate-manifest.js

# 2. Commituj zmiany
git add .
git commit -m "Add new quiz/workout"
git push origin main

# 3. GitHub Pages automatycznie zaktualizuje stronę (1-2 minuty)
```

---

## Licencja

[MIT](LICENSE)

---

## Autor

Stworzono z ❤️ dla miłośników nauki i treningu.
