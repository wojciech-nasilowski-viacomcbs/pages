# eTrener - Interaktywna Platforma Edukacyjna

Nowoczesna aplikacja webowa do nauki i treningów - quizy, treningi fitness i nauka języków przez słuchanie.

## 📋 Spis Treści

- [Opis Projektu](#opis-projektu)
- [Funkcjonalności](#funkcjonalności)
- [Instalacja i Uruchomienie](#instalacja-i-uruchomienie)
- [Development](#development)
- [Testowanie](#testowanie)
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

## Development

### Instalacja zależności deweloperskich

```bash
npm install
```

To zainstaluje:
- **Jest** - framework do testowania
- **ESLint** - linter do sprawdzania jakości kodu
- **Prettier** - formatter do automatycznego formatowania
- **Husky** - pre-commit hooks
- **Babel** - transpilacja ES6 modules dla testów

### Komendy deweloperskie

```bash
# Uruchom wszystkie testy (197 testów)
npm test

# Testy w trybie watch (automatyczne uruchamianie przy zmianach)
npm run test:watch

# Testy z raportem pokrycia kodu
npm run test:coverage

# Testy z raportem HTML (otwiera w przeglądarce)
npm run test:report

# Sprawdź kod (ESLint)
npm run lint

# Napraw automatycznie błędy lintera
npm run lint:fix

# Formatuj kod (Prettier)
npm run format

# Sprawdź formatowanie bez zmian
npm run format:check
```

### Pre-commit Hooks

Projekt używa **Husky** do automatycznego sprawdzania kodu przed commitem:

✅ **Co się dzieje przy `git commit`:**
1. ESLint sprawdza kod JavaScript
2. Prettier formatuje kod automatycznie
3. Jeśli są błędy - commit zostanie zablokowany
4. Napraw błędy i spróbuj ponownie

**Przykład:**
```bash
git add .
git commit -m "Add new feature"
# → Automatycznie uruchomi się linter i formatter
# → Jeśli OK - commit przejdzie
# → Jeśli błędy - zobaczysz komunikat i musisz je naprawić
```

### Code Quality Standards

Projekt wymusza:
- ✅ **ESLint** - brak błędów składniowych i logicznych
- ✅ **Prettier** - spójny styl kodu (wcięcia, cudzysłowy, itp.)
- ✅ **JSDoc** - dokumentacja funkcji
- ✅ **ES6+ syntax** - nowoczesny JavaScript

---

## Testowanie

### 📊 Statystyki Testów

- **197 testów** (11 test suites)
- **94.91% pokrycia** dla `auth-service.js`
- **62.86% pokrycia** dla `data-service.js`

### 🧪 Typy Testów

#### 1. **Testy Jednostkowe** (Unit Tests)
Testują izolowane funkcje i moduły:
- `auth-service.test.js` - 33 testy (autentykacja, role, sesje)
- `data-service.test.js` - 33 testy (CRUD dla quizów, workoutów, itp.)
- `utilities.test.js` - testy funkcji pomocniczych
- `data-validation.test.js` - walidacja struktur danych

#### 2. **Testy Integracyjne** (Integration Tests)
Testują pełne ścieżki użytkownika:
- `integration-auth-flow.test.js` - 15 testów (rejestracja → logowanie → wylogowanie)
- `integration-content-management.test.js` - 13 testów (tworzenie → edycja → usuwanie treści)
- `quiz-retry-integration.test.js` - workflow retry mistakes
- `workout-sets-expansion.test.js` - ekspansja serii treningowych

#### 3. **Testy Funkcjonalne** (Functional Tests)
Testują konkretne funkcjonalności:
- `session-manager.test.js` - zarządzanie sesjami w localStorage
- `quiz-retry-mistakes.test.js` - funkcja retry mistakes
- `workout-skip-rest.test.js` - pomijanie odpoczynku

### 🚀 Uruchamianie Testów

```bash
# Wszystkie testy
npm test

# Konkretny plik testowy
npm test -- auth-service.test.js

# Testy z pokryciem kodu
npm run test:coverage

# Testy w trybie watch (przydatne podczas developmentu)
npm run test:watch
```

### 📈 Raport Pokrycia

Po uruchomieniu `npm run test:coverage` zobaczysz:

```
--------------------------|---------|----------|---------|---------|
File                      | % Stmts | % Branch | % Funcs | % Lines |
--------------------------|---------|----------|---------|---------|
All files                 |    5.88 |     4.67 |    6.64 |    5.96 |
 auth-service.js          |   94.91 |    81.25 |     100 |   94.54 |
 data-service.js          |   62.86 |    54.34 |   92.59 |   69.80 |
--------------------------|---------|----------|---------|---------|
```

Raport HTML jest dostępny w `coverage/index.html`

### ✍️ Pisanie Testów

Przykład testu jednostkowego:

```javascript
/**
 * @jest-environment jsdom
 */

import authService from '../js/auth-service.js';

describe('Auth Service', () => {
  it('should successfully sign in a user', async () => {
    const result = await authService.signIn('user@example.com', 'password123');
    
    expect(result.success).toBe(true);
    expect(result.user.email).toBe('user@example.com');
  });
});
```

Przykład testu integracyjnego:

```javascript
describe('Complete User Flow', () => {
  it('should handle registration → login → logout', async () => {
    // 1. Register
    const signUpResult = await signUp('new@example.com', 'pass123');
    expect(signUpResult.success).toBe(true);
    
    // 2. Login
    const signInResult = await signIn('new@example.com', 'pass123');
    expect(signInResult.success).toBe(true);
    
    // 3. Logout
    const signOutResult = await signOut();
    expect(signOutResult.success).toBe(true);
  });
});
```

### 🎯 Best Practices

1. **Mockuj zależności zewnętrzne** (Supabase, API)
2. **Testuj edge cases** (błędy, puste dane, null)
3. **Używaj opisowych nazw** testów
4. **Jeden test = jedna rzecz**
5. **Arrange → Act → Assert** pattern

---

## Jak Dodać Nowe Treści

### Dodawanie Quizu

1. **Stwórz plik JSON** w folderze `/data/quizzes/`
   - Nazwa: `nazwa-quizu.json` (małe litery, myślniki)
   - Przykład: `matematyka-podstawy.json`

2. **Wypełnij zgodnie z formatem** opisanym w [`docs/DATA_FORMAT.md`](docs/DATA_FORMAT.md)

3. **Wygeneruj manifest**:
   ```bash
   node generate-manifest.js
   ```

4. **Gotowe!** Quiz pojawi się automatycznie na stronie.

### Dodawanie Treningu

1. **Stwórz plik JSON** w folderze `/data/workouts/`
   - Nazwa: `nazwa-treningu.json` (małe litery, myślniki)
   - Przykład: `cardio-hiit.json`

2. **Wypełnij zgodnie z formatem** opisanym w [`docs/DATA_FORMAT.md`](docs/DATA_FORMAT.md)

3. **Wygeneruj manifest**:
   ```bash
   node generate-manifest.js
   ```

4. **Gotowe!** Trening pojawi się automatycznie na stronie.

### Używanie AI do Generowania Treści

Możesz użyć AI (np. ChatGPT, Claude) do wygenerowania nowych treści. Wystarczy, że:

1. Przekażesz AI plik [`docs/DATA_FORMAT.md`](docs/DATA_FORMAT.md)
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
├── generate-manifest.js       # Skrypt do generowania manifestu
│
├── /docs/                     # 📚 Dokumentacja projektu
│   ├── PRD.md                 # Dokument wymagań produktowych
│   ├── TECH_STACK.md          # Szczegóły techniczne
│   ├── DATA_FORMAT.md         # Specyfikacja formatów JSON
│   ├── STATE_MANAGEMENT.md    # Dokumentacja state managera
│   └── ... (wszystkie pliki .md)
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

Zobacz **[docs/STATE_MANAGEMENT.md](docs/STATE_MANAGEMENT.md)** dla szczegółów, API reference i przykładów.

---

## Dokumentacja

Cała dokumentacja projektu znajduje się w katalogu **[`/docs/`](docs/)**.

### Dla Użytkowników:
- **[docs/PRD.md](docs/PRD.md)** - Pełny dokument wymagań produktowych
- **[docs/TECH_STACK.md](docs/TECH_STACK.md)** - Szczegóły techniczne i architektura
- **[docs/DATA_FORMAT.md](docs/DATA_FORMAT.md)** - Dokładna specyfikacja formatów JSON (WAŻNE dla tworzenia treści!)

### Dla Deweloperów:
- **[docs/JSDOC_TYPESCRIPT_SUMMARY.md](docs/JSDOC_TYPESCRIPT_SUMMARY.md)** - Podsumowanie ulepszeń JSDoc i TypeScript
- **[docs/DOM_HELPERS_EXAMPLES.md](docs/DOM_HELPERS_EXAMPLES.md)** - Przykłady użycia DOM helpers
- **[docs/TYPESCRIPT_MIGRATION.md](docs/TYPESCRIPT_MIGRATION.md)** - Przewodnik migracji do TypeScript (opcjonalnie)
- **[docs/STATE_MANAGEMENT.md](docs/STATE_MANAGEMENT.md)** - 🆕 Dokumentacja systemu zarządzania stanem
- **`js/types.js`** - Centralne definicje typów JSDoc
- **`js/dom-helpers.js`** - Biblioteka pomocnicza do manipulacji DOM
- **`js/state-manager.js`** - 🆕 Reaktywny store z subskrypcjami
- **`js/ui-state.js`** - 🆕 Manager stanu UI (ekrany, tab bar)

### Wszystkie dokumenty:
Zobacz pełną listę w katalogu **[`/docs/`](docs/)** - wszystkie pliki dokumentacji znajdują się tam.

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
