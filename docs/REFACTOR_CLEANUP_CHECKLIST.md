# 🗑️ Refactor Cleanup Checklist - FAZA 5

**Cel**: Usunięcie wszystkich shimów backward compatibility  
**Kiedy**: Po zakończeniu FAZY 3 i 4  
**Czas estymowany**: 2-3 godziny

---

## 📋 Checklist - Pliki do Usunięcia/Modyfikacji

### 1. Pliki do Całkowitego Usunięcia

- [ ] `js/modules-shim.js` - **USUŃ CAŁY PLIK**
  - Zawiera 25x `TODO-REFACTOR-CLEANUP`
  - Po konwersji wszystkich modułów do ES6, ten plik nie będzie potrzebny

### 2. Pliki do Modyfikacji - Usunięcie Shimów

#### State Management
- [ ] `js/state/app-state.js`
  - Usuń linie 102-115 (eksport do window.*)
  - Usuń 9x `TODO-REFACTOR-CLEANUP`
  - Pozostaw tylko ES6 exports

#### Silniki (po konwersji do klas w FAZIE 3)
- [ ] `js/quiz-engine.js` → `js/engines/quiz-engine.js`
  - Usuń linie 1191-1195 (window.initQuizEngine, window.startQuiz, window.resetMistakes)
  - Usuń 3x `TODO-REFACTOR-CLEANUP`
  - Pozostaw tylko ES6 class export

- [ ] `js/workout-engine.js` → `js/engines/workout-engine.js`
  - Usuń linie 599-602 (window.initWorkoutEngine, window.startWorkout)
  - Usuń 2x `TODO-REFACTOR-CLEANUP`
  - Pozostaw tylko ES6 class export

- [ ] `js/listening-engine.js` → `js/engines/listening-engine.js`
  - Usuń linie 1239-1248 (window.initListeningEngine, window.showListeningList, window.listeningEngine)
  - Usuń 3x `TODO-REFACTOR-CLEANUP`
  - Pozostaw tylko ES6 class export

### 3. Pliki do Sprawdzenia - Użycie window.*

Sprawdź czy te pliki nadal używają `window.*` API i zamień na ES6 imports:

- [ ] `js/app.js`
  - Zamień `window.startQuiz()` → `import { QuizEngine } from './engines/quiz-engine.js'`
  - Zamień `window.startWorkout()` → `import { WorkoutEngine } from './engines/workout-engine.js'`
  - Zamień `window.initListeningEngine()` → `import { ListeningEngine } from './engines/listening-engine.js'`

- [ ] `js/ui-manager.js`
  - Zamień wszystkie `window.*` na ES6 imports
  - Sprawdź czy używa `window.uiState` → zamień na import

- [ ] `js/content-manager.js`
  - Zamień `window.dataService` → `import dataService from './data-service.js'`
  - Zamień `window.authService` → `import authService from './auth-service.js'`

- [ ] `js/services/error-handler.js`
  - Sprawdź użycie `window.uiManager`
  - Zamień na dependency injection lub ES6 import

---

## 🔍 Jak Znaleźć Wszystkie Shimy?

Użyj grep:
```bash
# Znajdź wszystkie TODO-REFACTOR-CLEANUP
grep -r "TODO-REFACTOR-CLEANUP" js/

# Znajdź wszystkie window.* assignments
grep -r "window\." js/ | grep "="

# Policz ile shimów zostało
grep -r "TODO-REFACTOR-CLEANUP" js/ | wc -l
```

**Oczekiwana liczba**: ~45 komentarzy TODO-REFACTOR-CLEANUP

---

## ✅ Procedura Usuwania (Krok po Kroku)

### Krok 1: Usuń modules-shim.js
```bash
rm js/modules-shim.js
```

### Krok 2: Usuń import z index.html
```html
<!-- USUŃ TĘ LINIĘ -->
<script type="module" src="js/modules-shim.js"></script>
```

### Krok 3: Usuń shimy z state/app-state.js
```javascript
// USUŃ LINIE 102-115
// if (typeof window !== 'undefined') {
//   window.appState = appState;
//   ...
// }
```

### Krok 4: Usuń shimy z silników
Po konwersji do klas (FAZA 3), usuń wszystkie `window.*` exports z końca plików.

### Krok 5: Zaktualizuj importy w app.js
```javascript
// PRZED
window.startQuiz(data, id);

// PO
import { QuizEngine } from './engines/quiz-engine.js';
const quizEngine = new QuizEngine(elements);
quizEngine.start(data, id);
```

### Krok 6: Uruchom testy
```bash
npm test
```
**Oczekiwany wynik**: 100% passing (wszystkie testy powinny przejść)

### Krok 7: Test manualny
- [ ] Logowanie działa
- [ ] Nawigacja działa
- [ ] Quizy działają
- [ ] Treningi działają
- [ ] Listening działa
- [ ] Import/Export działa
- [ ] AI Generator działa

### Krok 8: Build produkcyjny
```bash
npm run build
```
**Oczekiwany wynik**: Build bez ostrzeżeń o IIFE modules

### Krok 9: Commit
```bash
git add -A
git commit -m "refactor(cleanup): Usunięcie backward compatibility shimów (FAZA 5)

- Usunięto modules-shim.js
- Usunięto window.* exports z silników
- Usunięto window.* exports z state management
- Wszystkie moduły używają ES6 imports/exports
- 100% testów passing
- Build bez ostrzeżeń

Closes: FAZA 5, Krok 17"
```

---

## 📊 Metryki Sukcesu

### Przed Cleanup
- `modules-shim.js`: 54 linie
- `TODO-REFACTOR-CLEANUP`: ~45 komentarzy
- `window.*` assignments: ~30 miejsc
- Build warnings: ~10 ostrzeżeń o IIFE

### Po Cleanup
- `modules-shim.js`: ❌ USUNIĘTY
- `TODO-REFACTOR-CLEANUP`: 0 komentarzy
- `window.*` assignments: 0 miejsc
- Build warnings: 0 ostrzeżeń
- Testy: 100% passing
- Bundle size: ~15% mniejszy (estymacja)

---

## ⚠️ Potencjalne Problemy

### Problem 1: Testy failują po usunięciu shimów
**Rozwiązanie**: Zaktualizuj mocki w testach, użyj ES6 imports

### Problem 2: Aplikacja nie ładuje się w przeglądarce
**Rozwiązanie**: Sprawdź console errors, prawdopodobnie brakujący import

### Problem 3: Build failuje
**Rozwiązanie**: Sprawdź czy wszystkie pliki używają ES6 syntax

---

## 🎉 Po Zakończeniu

Po wykonaniu całej checklisty:
1. ✅ Aplikacja używa wyłącznie ES6 modules
2. ✅ Brak globalnej przestrzeni nazw (window.*)
3. ✅ Czysty, nowoczesny kod
4. ✅ Gotowość do dalszego rozwoju

**Następny krok**: FAZA 6 (opcjonalna) - Optymalizacje i paginacja

---

**Data utworzenia**: 3 listopada 2025  
**Ostatnia aktualizacja**: 3 listopada 2025  
**Status**: ⏳ Oczekuje na FAZĘ 3 i 4

