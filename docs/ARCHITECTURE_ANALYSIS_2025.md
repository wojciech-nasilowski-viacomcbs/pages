# 🏗️ Analiza Architektury eTrener - 2025

**Data**: 1 listopada 2025  
**Autor**: AI Architekt  
**Status**: **ANALYSIS COMPLETE** - Gotowy do refaktoringu

---

## 📋 Executive Summary

Aplikacja eTrener działa funkcjonalnie i ma dobre pokrycie testami, jednak **architektura kodu wykazuje cechy "technicznego długu" (technical debt)** typowe dla projektów ewolucyjnych:

### ✅ Mocne strony:
- **Działająca funkcjonalność** - wszystkie moduły działają poprawnie
- **Dobre pokrycie testami** (~16 plików testowych)
- **Klarowna dokumentacja** użytkownika
- **Reactive state management** (`state-manager.js`, `ui-state.js`) - dobra idea

### ❌ Słabości architektoniczne:

1. **🔴 KRYTYCZNE: Duplikacja zarządzania stanem**
   - 3 różne sposoby zarządzania stanem (reactiv store + zwykły obiekt + globalne `window.*`)
   - Prowadzi do regresji i niespójności

2. **🔴 KRYTYCZNE: Brak separacji odpowiedzialności (SoC)**
   - `content-manager.js` (2015 linii!) - robi 7 różnych rzeczy
   - `ui-manager.js` (743 linie) - miesza logic

ę UI z biznesową

3. **🟡 ŚREDNIE: Niespójne wzorce**
   - Różne silniki (quiz/workout/listening/KB) mają różną architekturę
   - Brak wspólnego interfejsu

4. **🟡 ŚREDNIE: Globalna przestrzeń nazw**
   - Wszystko w `window.*` zamiast modułów ES6
   - Trudne dependency management

5. **🟢 DROBNE: Organizacja katalogów**
   - Wszystko w jednym `/js/` - brak podziału na warstwy

---

## 🔍 Szczegółowa Analiza Problemów

### Problem #1: Duplikacja Zarządzania Stanem

#### Aktualny stan (3 różne sposoby):

**Sposób A: Reactive Store (`ui-state.js`)**
```javascript
// DOBRY - reaktywny, z subskrypcjami
const uiStore = createStore({
  currentScreen: 'loading',
  currentTab: 'workouts',
  isActivity: false,
  showTabBar: true
});

uiStore.subscribe((state, prevState) => {
  // Auto-sync tab bar
});
```

**Sposób B: Zwykły obiekt (`app.js`)**
```javascript
// ZŁY - brak reaktywności, ręczne aktualizacje
const state = {
  currentView: 'main',
  currentTab: 'workouts',
  quizzes: [],
  workouts: [],
  currentUser: null
};
window.state = state; // ← Globalne!
```

**Sposób C: Lokalne stany w silnikach**
```javascript
// quiz-engine.js
const quizState = { data, currentQuestionIndex, score, ... };

// workout-engine.js  
const workoutState = { data, currentPhaseIndex, ... };

// listening-engine.js
const playerState = { currentSet, isPlaying, ... };
```

#### Skutki:
- ❌ **Regresje**: Zmiana w `app.js` nie propaguje się do `ui-state.js`
- ❌ **Duplikacja**: `currentTab` w 2 miejscach, `currentScreen`/`currentView` w 2 miejscach
- ❌ **Brak single source of truth**

---

### Problem #2: content-manager.js - God Object (2015 linii!)

Ten jeden plik robi **7 różnych rzeczy**:

```javascript
const contentManager = {
  // 1. Renderowanie kart (quizzes, workouts)
  renderCards(state, elements, uiManager, sessionManager) { /* 300 linii */ },
  
  // 2. Ładowanie danych z Supabase
  loadData(state, elements, uiManager) { /* 50 linii */ },
  
  // 3. Import JSON (z walidacją)
  handleImport(state, elements, uiManager) { /* 200 linii */ },
  validateQuizJSON(data) { /* 100 linii */ },
  validateWorkoutJSON(data) { /* 50 linii */ },
  
  // 4. Generator AI
  handleAIGenerate(state, elements, uiManager) { /* 150 linii */ },
  callAIAPI(userPrompt, contentType, elements) { /* 200 linii */ },
  
  // 5. Eksport JSON
  exportContent(id, state, elements) { /* 50 linii */ },
  
  // 6. Usuwanie treści
  handleDelete(state, elements, uiManager) { /* 30 linii */ },
  
  // 7. Baza Wiedzy (admin panel)
  loadKnowledgeBaseArticles(sessionManager) { /* 100 linii */ },
  saveKnowledgeBaseArticle(form, sessionManager) { /* 100 linii */ },
  
  // + 15 innych metod pomocniczych...
};
```

#### Skutki:
- ❌ **Trudność w testowaniu** - jeden plik, wiele zależności
- ❌ **Trudność w debugowaniu** - błąd może być w 1 z 7 obszarów
- ❌ **Niemożność równoległego rozwoju** - merge conflicts
- ❌ **Violation of Single Responsibility Principle**

---

### Problem #3: Niespójne wzorce silników

#### Quiz Engine (IIFE, globalne funkcje):
```javascript
(function() {
  const quizState = { ... };
  
  function startQuiz(data, filename) { ... }
  function displayQuestion() { ... }
  
  window.startQuiz = startQuiz; // ← Globalne
  window.initQuizEngine = initQuizEngine;
})();
```

#### Workout Engine (podobnie):
```javascript
(function() {
  const workoutState = { ... };
  
  window.startWorkout = startWorkout; // ← Globalne
  window.initWorkoutEngine = initWorkoutEngine;
})();
```

#### Listening Engine (też IIFE):
```javascript
(function() {
  const playerState = { ... };
  
  window.initListeningEngine = init; // ← Globalne
  window.showListeningList = showListeningList;
  window.listeningEngine = { ... };
})();
```

#### Knowledge Base (wbudowany w `ui-manager.js` + `content-manager.js`):
```javascript
// NIE MA dedykowanego silnika!
// Logika rozproszona między:
// - ui-manager.js (widoki)
// - content-manager.js (CRUD)
// - knowledge-base-engine.js (tylko edytor Quill)
```

#### Skutki:
- ❌ **Brak wspólnego interfejsu** dla silników
- ❌ **Trudność w dodawaniu nowych typów treści**
- ❌ **Niespójne API** dla różnych modułów

---

### Problem #4: Zarządzanie Nawigacją

#### Duplikacja logiki w 2 miejscach:

**`ui-manager.js`:**
```javascript
showScreen(screenName, state, elements, contentManager, sessionManager) {
  // Ukryj wszystkie ekrany
  elements.mainScreen.classList.add('hidden');
  elements.quizScreen.classList.add('hidden');
  // ...
  
  // Pokaż wybrany
  switch (screenName) {
    case 'main':
      if (state.currentTab === 'knowledge-base') { /* ... */ }
      else if (state.currentTab === 'listening') { /* ... */ }
      // ...
  }
  
  // Aktualizuj UI state
  if (window.uiState) {
    window.uiState.navigateToScreen(screenName);
  } else {
    this.updateTabBarVisibility(screenName); // Fallback
  }
}
```

**`ui-state.js`:**
```javascript
export function navigateToScreen(screenName, options = {}) {
  const isActivity = isActivityScreen(screenName);
  let showTabBar = true;
  
  if (isActivity) showTabBar = false;
  else if (isNavigationScreen(screenName)) showTabBar = true;
  // ...
  
  uiStore.setState({
    currentScreen: screenName,
    isActivity,
    showTabBar
  });
}
```

#### Skutki:
- ❌ **Logika w 2 miejscach** - łatwo o regresję
- ❌ **Fallback dla `ui-state`** - oznacza słabą integrację
- ❌ **`screenName` vs `currentView`** - różna nomenklatura

---

### Problem #5: Organizacja Katalogów

#### Aktualnie:
```
/js/
  ├── app.js                  (główna orkiestracja)
  ├── ui-manager.js           (UI + nawigacja + KB views)
  ├── ui-state.js             (state UI)
  ├── state-manager.js        (generic store)
  ├── content-manager.js      (import + AI + KB CRUD + ...)
  ├── session-manager.js      (sesje + role)
  ├── quiz-engine.js          (silnik quizów)
  ├── workout-engine.js       (silnik treningów)
  ├── listening-engine.js     (silnik listening)
  ├── knowledge-base-engine.js (tylko edytor Quill)
  ├── data-service.js         (CRUD Supabase)
  ├── auth-service.js         (autentykacja)
  ├── supabase-client.js      (klient Supabase)
  ├── audio.js                (dźwięki)
  ├── ai-prompts.js           (prompty AI)
  ├── dom-helpers.js          (helpers DOM)
  ├── types.js                (typy JSDoc)
  ├── config.js               (konfiguracja)
  └── feature-flags.js        (flagi funkcji)
```

#### Problem:
- ❌ Wszystko w jednym katalogu `/js/` (17 plików)
- ❌ Brak podziału na warstwy (UI / Business Logic / Data / Utils)
- ❌ Brak separacji dla różnych domen (quiz / workout / listening / KB)

---

## 🎯 Proponowana Architektura (Target State)

### Założenia refaktoringu:
1. ✅ **Zachować działające testy** - 100% pass rate po każdym kroku
2. ✅ **Incremental refactoring** - małe kroki, każdy testowany
3. ✅ **Backward compatibility** - stare API działają do momentu migracji
4. ✅ **ES6 modules** zamiast IIFE i window.*
5. ✅ **Single Responsibility Principle** - każdy moduł robi 1 rzecz
6. ✅ **Layered Architecture** - podział na warstwy

### Docelowa struktura katalogów:

```
/js/
  ├── core/                     # Warstwa jądra (orchestration)
  │   ├── app.js                # Main entry point
  │   ├── router.js             # Navigation & routing
  │   └── config.js             # Configuration
  │
  ├── state/                    # Zarządzanie stanem
  │   ├── store.js              # Generic reactive store (ex state-manager.js)
  │   ├── app-state.js          # Main app state (ex app.js state)
  │   └── ui-state.js           # UI state (ex ui-state.js)
  │
  ├── services/                 # Warstwa serwisów (business logic)
  │   ├── auth-service.js       # Autentykacja
  │   ├── data-service.js       # CRUD Supabase
  │   ├── session-service.js    # Sesje użytkownika (ex session-manager.js)
  │   ├── import-service.js     # ← NOWY: Import JSON
  │   ├── export-service.js     # ← NOWY: Eksport JSON
  │   ├── ai-service.js         # ← NOWY: Generator AI
  │   └── validation-service.js # ← NOWY: Walidacja danych
  │
  ├── engines/                  # Silniki treści (jednolity interfejs)
  │   ├── base-engine.js        # ← NOWY: Bazowa klasa dla silników
  │   ├── quiz-engine.js        # Silnik quizów (refactored)
  │   ├── workout-engine.js     # Silnik treningów (refactored)
  │   ├── listening-engine.js   # Silnik listening (refactored)
  │   └── kb-engine.js          # ← NOWY: Silnik bazy wiedzy (complete)
  │
  ├── ui/                       # Warstwa UI (presentation only)
  │   ├── components/           # ← NOWY: Komponenty UI
  │   │   ├── card-renderer.js  # Renderowanie kart
  │   │   ├── modal-manager.js  # Zarządzanie modalami
  │   │   └── tab-bar.js        # Tab bar
  │   ├── screens/              # ← NOWY: Logika ekranów
  │   │   ├── main-screen.js
  │   │   ├── quiz-screen.js
  │   │   ├── workout-screen.js
  │   │   ├── listening-screen.js
  │   │   └── kb-screen.js
  │   └── ui-manager.js         # ← REFACTORED: Tylko orkiestracja UI
  │
  ├── utils/                    # Narzędzia pomocnicze
  │   ├── dom-helpers.js        # Helpers DOM
  │   ├── audio.js              # Dźwięki
  │   ├── wake-lock.js          # Wake Lock API
  │   └── format-helpers.js     # ← NOWY: Formatowanie danych
  │
  ├── data/                     # Warstwa danych
  │   ├── supabase-client.js    # Klient Supabase
  │   ├── ai-prompts.js         # Prompty AI
  │   └── feature-flags.js      # Feature flags
  │
  └── types.js                  # Typy JSDoc (global)
```

### Kluczowe zmiany:

1. **`content-manager.js` → 6 serwisów**:
   ```
   content-manager.js (2015 linii)
   ↓
   ├── services/import-service.js (300 linii)
   ├── services/export-service.js (100 linii)
   ├── services/ai-service.js (400 linii)
   ├── services/validation-service.js (300 linii)
   ├── ui/components/card-renderer.js (200 linii)
   └── engines/kb-engine.js (500 linii)
   ```

2. **Jednolity interfejs dla silników**:
   ```javascript
   // base-engine.js
   export class BaseEngine {
     constructor(state, elements) {
       this.state = state;
       this.elements = elements;
     }
     
     // Interfejs (do implementacji)
     init() { throw new Error('Not implemented'); }
     start(data, id) { throw new Error('Not implemented'); }
     pause() { throw new Error('Not implemented'); }
     resume() { throw new Error('Not implemented'); }
     stop() { throw new Error('Not implemented'); }
     getProgress() { throw new Error('Not implemented'); }
   }
   
   // quiz-engine.js
   export class QuizEngine extends BaseEngine {
     start(quizData, quizId) {
       this.state.data = quizData;
       this.state.id = quizId;
       this.displayQuestion();
     }
     // ...
   }
   ```

3. **Centralizacja zarządzania stanem**:
   ```javascript
   // app-state.js
   import { createStore } from './store.js';
   
   export const appState = createStore({
     // User & Auth
     currentUser: null,
     userRole: 'user',
     
     // Navigation (single source of truth!)
     currentScreen: 'loading',
     currentTab: 'workouts',
     
     // Data
     quizzes: [],
     workouts: [],
     listeningSets: [],
     kbArticles: [],
     
     // Activity
     isActivity: false,
     showTabBar: true
   });
   
   // ui-state.js - USUNĄĆ (logika przeniesiona do router.js)
   ```

4. **Router zamiast rozproszonych `showScreen`**:
   ```javascript
   // router.js
   import { appState } from '../state/app-state.js';
   
   export class Router {
     navigate(screenName, options = {}) {
       // 1. Ukryj wszystkie ekrany
       this.hideAllScreens();
       
       // 2. Pokaż wybrany ekran
       const screen = this.screens[screenName];
       screen.show();
       
       // 3. Zaktualizuj stan
       appState.setState({
         currentScreen: screenName,
         isActivity: screen.isActivity,
         showTabBar: !screen.isActivity
       });
     }
   }
   ```

---

## 📝 Plan Refaktoringu (15 kroków)

### Faza 1: Przygotowanie (Kroki 1-3)

#### **Krok 1: Utworzenie nowej struktury katalogów**
- ✅ Cel: Przygotować docelową strukturę bez zmiany kodu
- 📁 Akcje:
  ```bash
  mkdir -p js/core js/state js/services js/engines js/ui/components js/ui/screens js/utils js/data
  ```
- ✅ Test: `npm test` - wszystkie testy przechodzą (bez zmian w kodzie)

#### **Krok 2: Refactoring `state-manager.js` → `store.js`**
- ✅ Cel: Przenieść i zmienić nazwę na bardziej generyczną
- 📝 Zmiany:
  ```javascript
  // Before: js/state-manager.js
  export function createStore(initialState) { ... }
  
  // After: js/state/store.js
  export function createStore(initialState) { ... }
  ```
- 📝 Update imports w `ui-state.js`
- ✅ Test: `npm test` - sprawdź czy `ui-state.js` działa

#### **Krok 3: Centralizacja stanu - utworzenie `app-state.js`**
- ✅ Cel: Utworzyć centralny reaktywny store dla całej aplikacji
- 📝 Nowy plik: `js/state/app-state.js`
  ```javascript
  import { createStore } from './store.js';
  
  export const appState = createStore({
    // User
    currentUser: null,
    userRole: 'user',
    
    // Navigation
    currentScreen: 'loading',
    currentTab: 'workouts',
    
    // Data
    quizzes: [],
    workouts: [],
    listeningSets: [],
    
    // UI State
    isActivity: false,
    showTabBar: true
  });
  
  // Helper functions
  export function setCurrentUser(user) {
    appState.setState({ currentUser: user });
  }
  
  export function setCurrentScreen(screen) {
    appState.setState({ currentScreen: screen });
  }
  // ...
  ```
- ⚠️ **NIE usuwaj jeszcze starego stanu z `app.js`!** - backward compatibility
- 📝 Dodaj duplikację: aktualizuj oba stany równocześnie
  ```javascript
  // app.js
  import { appState, setCurrentUser } from './state/app-state.js';
  
  // Old way (keep for now)
  state.currentUser = user;
  
  // New way (add this)
  setCurrentUser(user);
  ```
- ✅ Test: `npm test` - sprawdź czy oba stany są synchronizowane

---

### Faza 2: Rozdzielenie `content-manager.js` (Kroki 4-7)

#### **Krok 4: Ekstrakcja `import-service.js`**
- ✅ Cel: Wydzielić logikę importu JSON do osobnego serwisu
- 📝 Nowy plik: `js/services/import-service.js`
  ```javascript
  export class ImportService {
    constructor(validationService) {
      this.validationService = validationService;
      this.currentImportType = 'quiz';
      this.selectedFile = null;
    }
    
    async importFromFile(file, type, isPublic) {
      const text = await file.text();
      const data = JSON.parse(text);
      return this.import(data, type, isPublic);
    }
    
    async importFromJSON(jsonString, type, isPublic) {
      const data = JSON.parse(jsonString);
      return this.import(data, type, isPublic);
    }
    
    async import(data, type, isPublic) {
      // Convert legacy format
      data = this.convertLegacyFormat(data, type);
      
      // Validate
      const errors = this.validationService.validate(data, type);
      if (errors.length > 0) {
        throw new Error('Validation errors: ' + errors.join(', '));
      }
      
      // Save to Supabase
      if (type === 'quiz') {
        return await dataService.saveQuiz(data, isPublic);
      } else if (type === 'workout') {
        return await dataService.saveWorkout(data, isPublic);
      } else if (type === 'listening') {
        return await dataService.createListeningSet(/* ... */);
      }
    }
    
    convertLegacyFormat(data, type) { /* ... */ }
  }
  ```
- 📝 Dodaj backward compatibility wrapper w `content-manager.js`:
  ```javascript
  // content-manager.js (keep old API)
  const importService = new ImportService(validationService);
  
  async handleImport(state, elements, uiManager) {
    // Delegate to service
    return importService.importFromFile(/* ... */);
  }
  ```
- ✅ Test: `npm test` + test manualny importu

#### **Krok 5: Ekstrakcja `validation-service.js`**
- ✅ Cel: Wydzielić walidację danych do osobnego serwisu
- 📝 Nowy plik: `js/services/validation-service.js`
  ```javascript
  export class ValidationService {
    validate(data, type) {
      switch(type) {
        case 'quiz':
          return this.validateQuiz(data);
        case 'workout':
          return this.validateWorkout(data);
        case 'listening':
          return this.validateListening(data);
        default:
          return [`Unknown type: ${type}`];
      }
    }
    
    validateQuiz(data) {
      const errors = [];
      if (!data.title) errors.push('Missing title');
      // ... (existing validation logic from content-manager.js)
      return errors;
    }
    
    validateWorkout(data) { /* ... */ }
    validateListening(data) { /* ... */ }
  }
  ```
- 📝 Update `import-service.js` i `content-manager.js` to używały nowego serwisu
- ✅ Test: `npm test` + testy walidacji

#### **Krok 6: Ekstrakcja `ai-service.js`**
- ✅ Cel: Wydzielić generator AI do osobnego serwisu
- 📝 Nowy plik: `js/services/ai-service.js`
  ```javascript
  export class AIService {
    constructor(validationService) {
      this.validationService = validationService;
    }
    
    async generate(userPrompt, contentType, options = {}) {
      // Get prompt template
      const promptTemplate = AI_PROMPTS[contentType];
      let systemPrompt = promptTemplate.replace('{USER_PROMPT}', userPrompt);
      
      // For listening: replace language codes
      if (contentType === 'listening') {
        systemPrompt = this.replaceLangCodes(systemPrompt, options);
      }
      
      // Call API
      const content = await this.callAPI(systemPrompt, contentType);
      
      // Parse JSON
      const data = this.parseJSON(content);
      
      // Validate
      const errors = this.validationService.validate(data, contentType);
      if (errors.length > 0) {
        throw new Error('Generated data is invalid: ' + errors.join(', '));
      }
      
      return data;
    }
    
    async callAPI(systemPrompt, contentType) {
      const isVercel = this.detectEnvironment();
      
      if (isVercel) {
        return this.callVercelFunction(systemPrompt, contentType);
      } else {
        return this.callOpenRouter(systemPrompt, contentType);
      }
    }
    
    // ...
  }
  ```
- 📝 Update `content-manager.js` backward compatibility
- ✅ Test: Test manualny generowania AI

#### **Krok 7: Ekstrakcja `export-service.js` + `card-renderer.js`**
- ✅ Cel: Wydzielić eksport i renderowanie kart
- 📝 Nowy plik: `js/services/export-service.js`
  ```javascript
  export class ExportService {
    async export(id, type) {
      // Fetch full data
      let data, filename;
      if (type === 'quiz') {
        data = await dataService.fetchQuizById(id);
        filename = `quiz-${this.sanitize(data.title)}.json`;
      } // ...
      
      // Clean data (remove Supabase metadata)
      const cleanData = this.cleanData(data, type);
      
      // Download
      this.downloadJSON(cleanData, filename);
    }
    
    cleanData(data, type) { /* ... */ }
    downloadJSON(data, filename) { /* ... */ }
  }
  ```
- 📝 Nowy plik: `js/ui/components/card-renderer.js`
  ```javascript
  export class CardRenderer {
    render(items, type, currentUser) {
      if (items.length === 0) {
        return this.renderEmpty();
      }
      
      return items.map(item => this.renderCard(item, type, currentUser)).join('');
    }
    
    renderCard(item, type, currentUser) {
      const icon = this.getIcon(item, type);
      const badge = this.getBadge(item);
      const actionButtons = this.getActionButtons(item, currentUser);
      
      return `<div class="content-card" data-id="${item.id}">...</div>`;
    }
    
    // ...
  }
  ```
- 📝 Update `content-manager.renderCards()` to delegate to `CardRenderer`
- ✅ Test: `npm test` + test renderowania kart

---

### Faza 3: Unifikacja Silników (Kroki 8-10)

#### **Krok 8: Utworzenie `base-engine.js`**
- ✅ Cel: Stworzyć bazową klasę dla wszystkich silników z jednolitym interfejsem
- 📝 Nowy plik: `js/engines/base-engine.js`
  ```javascript
  export class BaseEngine {
    constructor(state, elements) {
      this.state = state;
      this.elements = elements;
      this.isInitialized = false;
    }
    
    // Lifecycle methods (to implement in subclasses)
    init() {
      throw new Error(`${this.constructor.name}.init() not implemented`);
    }
    
    start(data, id) {
      throw new Error(`${this.constructor.name}.start() not implemented`);
    }
    
    pause() {
      throw new Error(`${this.constructor.name}.pause() not implemented`);
    }
    
    resume() {
      throw new Error(`${this.constructor.name}.resume() not implemented`);
    }
    
    stop() {
      throw new Error(`${this.constructor.name}.stop() not implemented`);
    }
    
    restart() {
      throw new Error(`${this.constructor.name}.restart() not implemented`);
    }
    
    // State management
    getProgress() {
      throw new Error(`${this.constructor.name}.getProgress() not implemented`);
    }
    
    saveProgress() {
      throw new Error(`${this.constructor.name}.saveProgress() not implemented`);
    }
    
    loadProgress() {
      throw new Error(`${this.constructor.name}.loadProgress() not implemented`);
    }
  }
  ```
- ✅ Test: Tylko stworzenie pliku, bez zmian w istniejącym kodzie

#### **Krok 9: Refactoring `quiz-engine.js` do klasy**
- ✅ Cel: Przekształcić IIFE w klasę dziedziczącą po `BaseEngine`
- 📝 Refactored: `js/engines/quiz-engine.js`
  ```javascript
  import { BaseEngine } from './base-engine.js';
  
  export class QuizEngine extends BaseEngine {
    constructor(state, elements) {
      super(state, elements);
      
      // Local state
      this.quizState = {
        data: null,
        currentQuestionIndex: 0,
        score: 0,
        answers: [],
        mistakeQuestions: []
      };
    }
    
    init() {
      this.setupElements();
      this.attachEventListeners();
      this.isInitialized = true;
    }
    
    start(quizData, quizId, mistakesOnly = false) {
      this.quizState.data = quizData;
      this.quizState.id = quizId;
      this.quizState.currentQuestionIndex = 0;
      this.quizState.score = 0;
      // ...
      
      this.showQuizOptions();
    }
    
    pause() {
      // Save progress
      this.saveProgress();
    }
    
    resume() {
      // Load progress and continue
      const progress = this.loadProgress();
      if (progress) {
        this.quizState = { ...this.quizState, ...progress };
        this.displayQuestion();
      }
    }
    
    stop() {
      // Clean up
      this.quizState = {
        data: null,
        currentQuestionIndex: 0,
        score: 0,
        answers: []
      };
    }
    
    restart() {
      this.stop();
      this.start(this.quizState.data, this.quizState.id);
    }
    
    // ... (rest of existing methods)
  }
  
  // Backward compatibility (temporary)
  const quizEngine = new QuizEngine(/* state */, /* elements */);
  window.initQuizEngine = () => quizEngine.init();
  window.startQuiz = (data, id) => quizEngine.start(data, id);
  window.resetMistakes = () => quizEngine.resetMistakes();
  ```
- ⚠️ Zachowaj backward compatibility przez `window.*` API
- ✅ Test: `npm test` + test manualny quizów

#### **Krok 10: Refactoring `workout-engine.js` i `listening-engine.js`**
- ✅ Cel: Podobny refactoring jak quiz-engine
- 📝 Przekształć oba silniki w klasy dziedziczące po `BaseEngine`
- 📝 Zachowaj backward compatibility
- ✅ Test: `npm test` + testy manualne

---

### Faza 4: Unifikacja Nawigacji (Kroki 11-12)

#### **Krok 11: Utworzenie `router.js`**
- ✅ Cel: Centralna obsługa nawigacji zamiast rozproszonych `showScreen`
- 📝 Nowy plik: `js/core/router.js`
  ```javascript
  import { appState } from '../state/app-state.js';
  
  export class Router {
    constructor(screens) {
      this.screens = screens; // Map<string, Screen>
      this.currentScreen = null;
    }
    
    navigate(screenName, options = {}) {
      console.log(`🧭 Navigating to: ${screenName}`);
      
      // 1. Stop current screen
      if (this.currentScreen) {
        this.currentScreen.hide();
      }
      
      // 2. Get target screen
      const screen = this.screens.get(screenName);
      if (!screen) {
        throw new Error(`Screen not found: ${screenName}`);
      }
      
      // 3. Update state
      appState.setState({
        currentScreen: screenName,
        isActivity: screen.isActivity,
        showTabBar: !screen.isActivity
      });
      
      // 4. Show new screen
      screen.show(options);
      this.currentScreen = screen;
    }
    
    back() {
      // Navigate to previous screen (history)
    }
  }
  
  // Screen interface
  export class Screen {
    constructor(name, element, options = {}) {
      this.name = name;
      this.element = element;
      this.isActivity = options.isActivity || false;
    }
    
    show(options = {}) {
      this.element.classList.remove('hidden');
      this.onShow(options);
    }
    
    hide() {
      this.element.classList.add('hidden');
      this.onHide();
    }
    
    onShow(options) { /* Override in subclass */ }
    onHide() { /* Override in subclass */ }
  }
  ```
- 📝 Dodaj backward compatibility w `ui-manager.js`:
  ```javascript
  // ui-manager.js
  import { router } from '../core/router.js';
  
  showScreen(screenName, state, elements, contentManager, sessionManager) {
    // Delegate to router (new way)
    router.navigate(screenName, { state, elements, contentManager, sessionManager });
    
    // Keep old implementation for now (backward compatibility)
    // ... existing code ...
  }
  ```
- ✅ Test: `npm test` + test nawigacji

#### **Krok 12: Migracja ekranów do `ui/screens/`**
- ✅ Cel: Wydzielić logikę każdego ekranu do osobnego pliku
- 📝 Przykład: `js/ui/screens/quiz-screen.js`
  ```javascript
  import { Screen } from '../../core/router.js';
  
  export class QuizScreen extends Screen {
    constructor(element, quizEngine) {
      super('quiz', element, { isActivity: true });
      this.quizEngine = quizEngine;
    }
    
    onShow(options) {
      const { quizId, quizData } = options;
      this.quizEngine.start(quizData, quizId);
    }
    
    onHide() {
      // Clean up if needed
    }
  }
  ```
- 📝 Podobnie dla: `workout-screen.js`, `listening-screen.js`, `kb-screen.js`, `main-screen.js`
- 📝 Update router initialization:
  ```javascript
  // app.js
  import { Router } from './core/router.js';
  import { QuizScreen } from './ui/screens/quiz-screen.js';
  // ...
  
  const router = new Router(new Map([
    ['quiz', new QuizScreen(elements.quizScreen, quizEngine)],
    ['workout', new WorkoutScreen(elements.workoutScreen, workoutEngine)],
    ['listening', new ListeningScreen(elements.listeningScreen, listeningEngine)],
    ['main', new MainScreen(elements.mainScreen, state, cardRenderer)],
    // ...
  ]));
  ```
- ✅ Test: `npm test` + test wszystkich ekranów

---

### Faza 5: Finalizacja (Kroki 13-15)

#### **Krok 13: Usunięcie duplikacji stanu**
- ✅ Cel: Usunąć stary `state` z `app.js`, zostawić tylko `appState`
- 📝 Zmień wszystkie referencje `state.X` na `appState.getState().X`
- 📝 Usuń `window.state = state;`
- 📝 Update wszystkie komponenty aby używały `appState`
- ⚠️ **To jest największa zmiana** - wymaga aktualizacji wielu plików
- ✅ Test: `npm test` - **MUST PASS!**

#### **Krok 14: Usunięcie `ui-state.js` (merge do `app-state.js`)**
- ✅ Cel: Scalić `ui-state.js` z `app-state.js` - mają te same dane
- 📝 Przenieś logikę z `ui-state.js` do helper functions w `app-state.js`
- 📝 Update wszystkie importy
- 📝 Usuń plik `ui-state.js`
- ✅ Test: `npm test`

#### **Krok 15: Cleanup - usunięcie backward compatibility**
- ✅ Cel: Usunąć wszystkie `window.*` API i fallbacks
- 📝 Usuń `window.startQuiz`, `window.startWorkout`, etc.
- 📝 Usuń fallback code w `ui-manager.js` (stara implementacja `showScreen`)
- 📝 Usunąć IIFE wrappery z silników
- 📝 Update `index.html` - zamień `<script>` tagi na ES6 modules:
  ```html
  <!-- Before -->
  <script src="js/state-manager.js"></script>
  <script src="js/ui-state.js"></script>
  <script src="js/app.js"></script>
  
  <!-- After -->
  <script type="module" src="js/core/app.js"></script>
  ```
- ✅ Test: `npm test` + pełne testy regresyjne manualne

---

## 📊 Metryki Sukcesu

### Przed refaktoringiem:
| Metryka | Wartość |
|---------|---------|
| Liczba plików w `/js/` | 17 |
| Największy plik | `content-manager.js` (2015 linii) |
| Zarządzanie stanem | 3 różne sposoby |
| Duplikacja logiki | `showScreen` w 2 miejscach |
| Globalna przestrzeń (`window.*`) | ~15 obiektów |
| Wzorzec silników | Niespójny (IIFE vs ES6) |

### Po refaktoringu:
| Metryka | Cel |
|---------|-----|
| Struktura katalogów | 6 warstw (core, state, services, engines, ui, utils) |
| Największy plik | <500 linii |
| Zarządzanie stanem | 1 sposób (`appState`) |
| Duplikacja logiki | 0 (centralna `Router`) |
| Globalna przestrzeń | 0 (ES6 modules) |
| Wzorzec silników | Jednolity (`BaseEngine` + classes) |
| Testy | 100% pass rate |

---

## ⚠️ Ryzyka i Mitygacja

### Ryzyko 1: Regresje w działaniu aplikacji
- **Mitygacja**: Incremental refactoring - każdy krok testowany
- **Checkpoint**: Po każdym kroku: `npm test` + test manualny
- **Rollback**: Git tag po każdym kroku

### Ryzyko 2: Problemy z ES6 modules w starszych przeglądarkach
- **Mitygacja**: Sprawdź wsparcie w target browsers (Edge/Chrome/Safari/Firefox - wszystkie OK)
- **Backup plan**: Dodaj Babel transpilację (opcjonalnie)

### Ryzyko 3: Długi czas refaktoringu
- **Mitygacja**: Timeboxing - każda faza max 2-3 dni
- **Checkpoint**: Po każdej fazie - code review i testy

### Ryzyko 4: Merge conflicts przy równoległej pracy
- **Mitygacja**: Refactoring w osobnym branchu, komunikacja z zespołem
- **Best practice**: Freeze feature development podczas refaktoringu

---

## 🎯 Podsumowanie

### Dlaczego warto?
1. ✅ **Mniejsze pliki** - łatwiejsze w utrzymaniu
2. ✅ **Separacja odpowiedzialności** - każdy moduł robi 1 rzecz
3. ✅ **Jednolity wzorzec** - silniki z tym samym interfejsem
4. ✅ **Centralne zarządzanie stanem** - mniej regresji
5. ✅ **ES6 modules** - nowoczesny JavaScript
6. ✅ **Łatwość testowania** - small, focused units
7. ✅ **Skalowalność** - łatwo dodać nowe moduły

### Czas realizacji (estimation):
- **Faza 1 (Przygotowanie)**: 1 dzień
- **Faza 2 (Rozdzielenie content-manager)**: 2-3 dni
- **Faza 3 (Unifikacja silników)**: 2-3 dni
- **Faza 4 (Nawigacja)**: 1-2 dni
- **Faza 5 (Finalizacja)**: 1 dzień
- **TOTAL**: ~7-10 dni roboczych

### Następne kroki:
1. ✅ Akceptacja tego planu przez team
2. ✅ Utworzenie branch `refactor/architecture-2025`
3. ✅ Rozpoczęcie od Fazy 1 (Krok 1)
4. ✅ Code review po każdej fazie
5. ✅ Merge do main po zakończeniu całości

---

**Pytania? Sugestie? Obawy?**  
📧 Skontaktuj się z zespołem architektury.

**Document Version**: 1.0  
**Last Updated**: 2025-11-01  
**Author**: AI Architect  
**Status**: ✅ **READY FOR IMPLEMENTATION**

