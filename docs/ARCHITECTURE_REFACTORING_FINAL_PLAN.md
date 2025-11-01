# 🏗️ Plan Refaktoringu Architektury eTrener - WERSJA FINALNA

**Data**: 1 listopada 2025  
**Status**: ✅ **ZATWIERDZONY DO IMPLEMENTACJI**  
**Autorzy**: Zespół Architektury (synteza 2 analiz)  
**Czas realizacji**: 10-12 dni roboczych

---

## 📋 Executive Summary

Ten dokument zawiera **ostateczny, zatwierdzony plan refaktoringu** aplikacji eTrener. Jest to synteza dwóch niezależnych analiz architektonicznych, która łączy:
- ✅ Szczegółowy plan kroków refaktoringu
- ✅ Pragmatyczne podejście do narzędzi (build tools)
- ✅ Bezpieczną strategię migracji (Strangler Fig Pattern)
- ✅ Uwzględnienie aspektów systemowych (skalowanie, błędy, testy)

### Kluczowe Problemy do Rozwiązania:

1. **🔴 KRYTYCZNE: Duplikacja zarządzania stanem** (3 różne sposoby)
2. **🔴 KRYTYCZNE: God Object** (`content-manager.js` - 2015 linii)
3. **🟡 ŚREDNIE: Niespójne wzorce silników** (IIFE vs ES6)
4. **🟡 ŚREDNIE: Brak build tools** (network waterfall przy wielu modułach)
5. **🟢 DROBNE: Organizacja katalogów** (wszystko w `/js/`)

---

## 🎯 Docelowa Architektura

### Struktura Katalogów (Target State):

```
/js/
  ├── core/                     # Warstwa jądra
  │   ├── app.js                # Main entry point
  │   ├── router.js             # Centralna nawigacja
  │   └── config.js             # Konfiguracja
  │
  ├── state/                    # Zarządzanie stanem
  │   ├── store.js              # Generic reactive store
  │   └── app-state.js          # Globalny stan aplikacji
  │
  ├── services/                 # Warstwa serwisów
  │   ├── auth-service.js       # Autentykacja
  │   ├── data-service.js       # CRUD Supabase (+ paginacja)
  │   ├── session-service.js    # Sesje użytkownika
  │   ├── import-service.js     # ← NOWY: Import JSON
  │   ├── export-service.js     # ← NOWY: Eksport JSON
  │   ├── ai-service.js         # ← NOWY: Generator AI
  │   ├── validation-service.js # ← NOWY: Walidacja danych
  │   └── error-handler.js      # ← NOWY: Centralna obsługa błędów
  │
  ├── engines/                  # Silniki treści
  │   ├── base-engine.js        # ← NOWY: Bazowa klasa
  │   ├── quiz-engine.js        # Refactored (class + local state)
  │   ├── workout-engine.js     # Refactored (class + local state)
  │   ├── listening-engine.js   # Refactored (class + local state)
  │   └── kb-engine.js          # ← NOWY: Kompletny silnik KB
  │
  ├── ui/                       # Warstwa UI
  │   ├── components/
  │   │   ├── card-renderer.js  # Renderowanie kart
  │   │   ├── modal-manager.js  # Modale
  │   │   └── tab-bar.js        # Tab bar
  │   ├── screens/
  │   │   ├── main-screen.js
  │   │   ├── quiz-screen.js
  │   │   ├── workout-screen.js
  │   │   ├── listening-screen.js
  │   │   └── kb-screen.js
  │   └── ui-manager.js         # Orkiestracja UI (refactored)
  │
  ├── utils/                    # Narzędzia
  │   ├── dom-helpers.js
  │   ├── audio.js
  │   ├── wake-lock.js
  │   └── format-helpers.js     # ← NOWY
  │
  ├── data/                     # Warstwa danych
  │   ├── supabase-client.js
  │   ├── ai-prompts.js
  │   └── feature-flags.js
  │
  └── types.js                  # Typy JSDoc (global)
```

### Kluczowe Zasady Architektury:

1. **Hybrydowe Zarządzanie Stanem**:
   - `appState` (globalny) → TYLKO user, navigation, currentTab
   - Lokalne store'y w silnikach → quizState, workoutState (enkapsulowane w klasach)
   
2. **Single Responsibility Principle**:
   - Każdy moduł robi jedną rzecz
   - `content-manager.js` (2015 linii) → 6 mniejszych serwisów

3. **Jednolity Interfejs Silników**:
   - Wszystkie silniki dziedziczą po `BaseEngine`
   - Wspólne metody: `init()`, `start()`, `pause()`, `resume()`, `stop()`

4. **ES6 Modules + Build Tools**:
   - Vite dla dev (HMR) i produkcji (bundling)
   - Eliminacja `window.*` API

---

## 📝 Plan Implementacji (16 Kroków)

### ⚙️ FAZA 0: Setup Build Tools (NOWY!)

#### **KROK 0: Konfiguracja Vite**
**Priorytet**: 🔴 KRYTYCZNY  
**Czas**: 2-3 godziny  
**Dlaczego**: Bez build tools, moduły ES6 spowodują "network waterfall" (30+ osobnych requestów HTTP)

**Akcje**:
```bash
# 1. Instalacja Vite
npm install --save-dev vite

# 2. Utworzenie vite.config.js
```

**Zawartość `vite.config.js`**:
```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
```

**Update `package.json`**:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "jest"
  }
}
```

**Update `.gitignore`**:
```
dist/
```

**✅ Test**:
```bash
npm run dev    # Powinno uruchomić dev server na localhost:3000
npm run build  # Powinno zbudować do /dist/
```

**⚠️ UWAGA**: Po tym kroku aplikacja powinna działać identycznie jak przed refaktoringiem!

---

### 📁 FAZA 1: Przygotowanie Struktury (Kroki 1-3)

#### **KROK 1: Utworzenie nowej struktury katalogów**
**Priorytet**: 🟢 NISKI (przygotowanie)  
**Czas**: 5 minut

**Akcje**:
```bash
cd /Users/nasiloww/Documents/Projects/pages
mkdir -p js/core js/state js/services js/engines js/ui/components js/ui/screens js/utils js/data
```

**✅ Test**: `npm test` - wszystkie testy przechodzą (żadne zmiany w kodzie)

---

#### **KROK 2: Refactoring `state-manager.js` → `state/store.js`**
**Priorytet**: 🟡 ŚREDNI  
**Czas**: 30 minut

**Akcje**:
```bash
# 1. Przenieś plik
mv js/state-manager.js js/state/store.js

# 2. Update imports w js/ui-state.js
```

**Zmiana w `js/ui-state.js`**:
```javascript
// PRZED:
import { createStore } from './state-manager.js';

// PO:
import { createStore } from './state/store.js';
```

**✅ Test**: `npm test` - sprawdź czy `ui-state.js` działa

---

#### **KROK 3: Utworzenie `app-state.js` (z backward compatibility)**
**Priorytet**: 🔴 WYSOKI  
**Czas**: 1-2 godziny

**⚠️ WAŻNE**: `appState` zawiera TYLKO globalne dane. Silniki zachowują swoje lokalne store'y!

**Nowy plik: `js/state/app-state.js`**:
```javascript
/**
 * @fileoverview Centralny, reaktywny store aplikacji
 * ZAWIERA TYLKO: user, navigation, currentTab
 * NIE ZAWIERA: szczegółów aktywności (quizState, workoutState - to w silnikach!)
 */

import { createStore } from './store.js';

// Główny store aplikacji
export const appState = createStore({
  // User & Auth
  currentUser: null,
  userRole: 'user',
  
  // Navigation (single source of truth!)
  currentScreen: 'loading',
  currentTab: 'workouts', // workouts | quizzes | listening | knowledge-base | more
  
  // UI State
  isActivity: false,
  showTabBar: true,
  isListeningPlayerActive: false
});

// Helper functions dla łatwiejszego użycia
export function setCurrentUser(user) {
  appState.setState({ currentUser: user });
}

export function setUserRole(role) {
  appState.setState({ userRole: role });
}

export function setCurrentScreen(screen) {
  appState.setState({ currentScreen: screen });
}

export function setCurrentTab(tab) {
  appState.setState({ currentTab: tab });
  // Zapisz do localStorage
  localStorage.setItem('lastTab', tab);
}

export function setActivity(isActivity) {
  appState.setState({ isActivity });
}

export function setTabBarVisibility(show) {
  appState.setState({ showTabBar: show });
}

export function setListeningPlayerActive(active) {
  appState.setState({ isListeningPlayerActive: active });
}

// Eksport do window (backward compatibility - TEMPORARY!)
if (typeof window !== 'undefined') {
  window.appState = appState;
}
```

**Update `js/app.js` - dodaj synchronizację (DUPLIKACJA TYMCZASOWA!)**:
```javascript
// Na początku pliku
import { appState, setCurrentUser, setCurrentTab } from './state/app-state.js';

// Stan aplikacji (STARY - zachowaj na razie!)
const state = {
  currentView: 'main',
  currentTab: 'workouts',
  quizzes: [],
  workouts: [],
  listeningSets: [],
  currentUser: null
};
window.state = state; // Backward compatibility

// NOWE: Synchronizuj oba stany
appState.subscribe((newState, prevState) => {
  // Sync old state with new state
  if (newState.currentUser !== prevState.currentUser) {
    state.currentUser = newState.currentUser;
  }
  if (newState.currentTab !== prevState.currentTab) {
    state.currentTab = newState.currentTab;
  }
  if (newState.currentScreen !== prevState.currentScreen) {
    state.currentView = newState.currentScreen;
  }
});

// W funkcjach, gdzie aktualizujesz state, dodaj też appState:
async function handleAuthStateChange(event, session) {
  if (session?.user) {
    state.currentUser = session.user;
    setCurrentUser(session.user); // ← DODAJ TO
    // ...
  }
}
```

**✅ Test**: 
```bash
npm test
# + Test manualny: sprawdź czy logowanie działa, nawigacja działa
```

---

### ✂️ FAZA 2: Rozdzielenie God Object (Kroki 4-8)

#### **KROK 4: Ekstrakcja `validation-service.js`**
**Priorytet**: 🔴 WYSOKI (fundament dla innych serwisów)  
**Czas**: 2-3 godziny

**Dlaczego najpierw?** Import i AI service potrzebują walidacji.

**Nowy plik: `js/services/validation-service.js`**:
```javascript
/**
 * @fileoverview Serwis walidacji danych (quiz, workout, listening)
 */

export class ValidationService {
  /**
   * Waliduje dane według typu
   * @param {Object} data - Dane do walidacji
   * @param {'quiz'|'workout'|'listening'} type - Typ treści
   * @returns {string[]} - Tablica błędów (pusta = OK)
   */
  validate(data, type) {
    switch(type) {
      case 'quiz':
        return this.validateQuiz(data);
      case 'workout':
        return this.validateWorkout(data);
      case 'listening':
        return this.validateListening(data);
      default:
        return [`Unknown content type: ${type}`];
    }
  }

  validateQuiz(data) {
    const errors = [];
    
    // Skopiuj logikę z content-manager.js validateQuizJSON()
    if (!data.title || typeof data.title !== 'string') {
      errors.push('Missing or invalid title');
    }
    
    if (!data.icon || typeof data.icon !== 'string') {
      errors.push('Missing or invalid icon (emoji)');
    }
    
    if (!Array.isArray(data.questions) || data.questions.length === 0) {
      errors.push('Missing or empty questions array');
    }
    
    // Walidacja każdego pytania
    data.questions?.forEach((q, idx) => {
      if (!q.question) errors.push(`Question ${idx + 1}: missing question text`);
      if (!Array.isArray(q.options) || q.options.length < 2) {
        errors.push(`Question ${idx + 1}: need at least 2 options`);
      }
      if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0) {
        errors.push(`Question ${idx + 1}: invalid correctAnswer`);
      }
    });
    
    return errors;
  }

  validateWorkout(data) {
    const errors = [];
    
    // Skopiuj logikę z content-manager.js validateWorkoutJSON()
    if (!data.title || typeof data.title !== 'string') {
      errors.push('Missing or invalid title');
    }
    
    if (!data.icon || typeof data.icon !== 'string') {
      errors.push('Missing or invalid icon (emoji)');
    }
    
    if (!Array.isArray(data.phases) || data.phases.length === 0) {
      errors.push('Missing or empty phases array');
    }
    
    // Walidacja każdej fazy
    data.phases?.forEach((phase, idx) => {
      if (!phase.name) errors.push(`Phase ${idx + 1}: missing name`);
      if (!Array.isArray(phase.exercises)) {
        errors.push(`Phase ${idx + 1}: missing exercises array`);
      }
    });
    
    return errors;
  }

  validateListening(data) {
    const errors = [];
    
    if (!data.title || typeof data.title !== 'string') {
      errors.push('Missing or invalid title');
    }
    
    if (!data.icon || typeof data.icon !== 'string') {
      errors.push('Missing or invalid icon (emoji)');
    }
    
    if (!data.sourceLang || !data.targetLang) {
      errors.push('Missing sourceLang or targetLang');
    }
    
    if (!Array.isArray(data.phrases) || data.phrases.length === 0) {
      errors.push('Missing or empty phrases array');
    }
    
    return errors;
  }
}

// Singleton instance
export const validationService = new ValidationService();
```

**✅ Test**: Utwórz test `__tests__/validation-service.test.js`:
```javascript
import { ValidationService } from '../js/services/validation-service.js';

describe('ValidationService', () => {
  const service = new ValidationService();
  
  test('validates correct quiz', () => {
    const quiz = {
      title: 'Test Quiz',
      icon: '📝',
      questions: [
        {
          question: 'Q1?',
          options: ['A', 'B'],
          correctAnswer: 0
        }
      ]
    };
    
    expect(service.validate(quiz, 'quiz')).toEqual([]);
  });
  
  test('detects missing title', () => {
    const quiz = { icon: '📝', questions: [] };
    const errors = service.validate(quiz, 'quiz');
    expect(errors).toContain('Missing or invalid title');
  });
  
  // ... więcej testów
});
```

```bash
npm test
```

---

#### **KROK 5: Ekstrakcja `import-service.js`**
**Priorytet**: 🔴 WYSOKI  
**Czas**: 3-4 godziny

**Nowy plik: `js/services/import-service.js`**:
```javascript
/**
 * @fileoverview Serwis importu JSON (quiz, workout, listening)
 */

import { validationService } from './validation-service.js';
import { dataService } from '../data-service.js'; // Existing

export class ImportService {
  constructor() {
    this.currentImportType = 'quiz';
    this.selectedFile = null;
  }

  /**
   * Import z pliku
   */
  async importFromFile(file, type, isPublic = false) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      return await this.import(data, type, isPublic);
    } catch (error) {
      throw new Error(`Failed to parse JSON: ${error.message}`);
    }
  }

  /**
   * Import z JSON string
   */
  async importFromJSON(jsonString, type, isPublic = false) {
    try {
      const data = JSON.parse(jsonString);
      return await this.import(data, type, isPublic);
    } catch (error) {
      throw new Error(`Invalid JSON: ${error.message}`);
    }
  }

  /**
   * Główna logika importu
   */
  async import(data, type, isPublic = false) {
    // 1. Convert legacy format (jeśli potrzeba)
    data = this.convertLegacyFormat(data, type);
    
    // 2. Validate
    const errors = validationService.validate(data, type);
    if (errors.length > 0) {
      throw new Error(`Validation failed:\n${errors.join('\n')}`);
    }
    
    // 3. Save to Supabase
    let result;
    if (type === 'quiz') {
      result = await dataService.saveQuiz(data, isPublic);
    } else if (type === 'workout') {
      result = await dataService.saveWorkout(data, isPublic);
    } else if (type === 'listening') {
      result = await dataService.createListeningSet(
        data.title,
        data.icon,
        data.sourceLang,
        data.targetLang,
        data.phrases,
        isPublic
      );
    } else {
      throw new Error(`Unknown type: ${type}`);
    }
    
    return result;
  }

  /**
   * Konwersja starych formatów (backward compatibility)
   */
  convertLegacyFormat(data, type) {
    // Skopiuj logikę z content-manager.js
    // np. dodanie icon jeśli brakuje, konwersja starych pól, etc.
    
    if (type === 'quiz' && !data.icon) {
      data.icon = '📝'; // Default icon
    }
    
    if (type === 'workout' && !data.icon) {
      data.icon = '💪';
    }
    
    if (type === 'listening' && !data.icon) {
      data.icon = '🎧';
    }
    
    return data;
  }
}

// Singleton
export const importService = new ImportService();
```

**Update `js/content-manager.js` - dodaj backward compatibility wrapper**:
```javascript
// Na początku pliku
import { importService } from './services/import-service.js';

// W obiekcie contentManager, zamień handleImport:
async handleImport(state, elements, uiManager) {
  const fileInput = elements.importFileInput;
  const file = fileInput.files[0];
  
  if (!file) {
    uiManager.showError('Wybierz plik JSON');
    return;
  }
  
  const type = this.currentImportType; // 'quiz' | 'workout' | 'listening'
  const isPublic = elements.importPublicCheckbox?.checked || false;
  
  try {
    elements.importButton.disabled = true;
    elements.importButton.textContent = 'Importuję...';
    
    // DELEGUJ do serwisu
    const result = await importService.importFromFile(file, type, isPublic);
    
    uiManager.showSuccess(`Zaimportowano: ${result.title}`);
    
    // Reload data
    await this.loadData(state, elements, uiManager);
    
    // Close modal
    elements.importModal.classList.add('hidden');
    fileInput.value = '';
    
  } catch (error) {
    console.error('Import error:', error);
    uiManager.showError(error.message);
  } finally {
    elements.importButton.disabled = false;
    elements.importButton.textContent = 'Importuj';
  }
}
```

**✅ Test**: 
```bash
npm test
# + Test manualny: spróbuj zaimportować quiz/workout/listening
```

---

#### **KROK 6: Ekstrakcja `ai-service.js`**
**Priorytet**: 🟡 ŚREDNI  
**Czas**: 3-4 godziny

**Nowy plik: `js/services/ai-service.js`**:
```javascript
/**
 * @fileoverview Serwis generowania treści przez AI
 */

import { validationService } from './validation-service.js';
import { AI_PROMPTS } from '../ai-prompts.js';

export class AIService {
  /**
   * Generuje treść przez AI
   * @param {string} userPrompt - Prompt użytkownika
   * @param {'quiz'|'workout'|'listening'} contentType - Typ treści
   * @param {Object} options - Opcje (np. sourceLang, targetLang dla listening)
   * @returns {Promise<Object>} - Wygenerowane dane
   */
  async generate(userPrompt, contentType, options = {}) {
    // 1. Przygotuj system prompt
    let systemPrompt = AI_PROMPTS[contentType];
    
    if (!systemPrompt) {
      throw new Error(`No AI prompt template for type: ${contentType}`);
    }
    
    // Zamień placeholder
    systemPrompt = systemPrompt.replace('{USER_PROMPT}', userPrompt);
    
    // Dla listening: zamień kody języków
    if (contentType === 'listening') {
      systemPrompt = systemPrompt
        .replace('{SOURCE_LANG}', options.sourceLang || 'English')
        .replace('{TARGET_LANG}', options.targetLang || 'Polish');
    }
    
    // 2. Wywołaj API
    const responseText = await this.callAPI(systemPrompt, contentType);
    
    // 3. Parse JSON
    const data = this.parseJSON(responseText);
    
    // 4. Validate
    const errors = validationService.validate(data, contentType);
    if (errors.length > 0) {
      console.error('AI generated invalid data:', errors);
      throw new Error(`AI wygenerowało nieprawidłowe dane:\n${errors.join('\n')}`);
    }
    
    return data;
  }

  /**
   * Wywołanie API (Vercel Function lub OpenRouter)
   */
  async callAPI(systemPrompt, contentType) {
    const isVercel = this.detectEnvironment();
    
    if (isVercel) {
      return await this.callVercelFunction(systemPrompt, contentType);
    } else {
      return await this.callOpenRouter(systemPrompt, contentType);
    }
  }

  /**
   * Wykryj środowisko (Vercel vs local)
   */
  detectEnvironment() {
    return window.location.hostname.includes('vercel.app') || 
           window.location.hostname.includes('pages-');
  }

  /**
   * Vercel Serverless Function
   */
  async callVercelFunction(systemPrompt, contentType) {
    const response = await fetch('/api/ai-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: systemPrompt,
        contentType: contentType
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${error}`);
    }
    
    const data = await response.json();
    return data.content;
  }

  /**
   * OpenRouter API (local dev)
   */
  async callOpenRouter(systemPrompt, contentType) {
    // Skopiuj logikę z content-manager.js callAIAPI()
    const apiKey = window.CONFIG?.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      throw new Error('Brak klucza API. Skonfiguruj js/config.js');
    }
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'eTrener'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          { role: 'system', content: systemPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Parse JSON z odpowiedzi AI (może być w ```json``` bloku)
   */
  parseJSON(text) {
    // Usuń markdown code blocks jeśli są
    let jsonText = text.trim();
    
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/, '').replace(/\n?```$/, '');
    }
    
    try {
      return JSON.parse(jsonText);
    } catch (error) {
      console.error('Failed to parse AI response:', jsonText);
      throw new Error(`Nie udało się sparsować odpowiedzi AI: ${error.message}`);
    }
  }
}

// Singleton
export const aiService = new AIService();
```

**Update `js/content-manager.js`**:
```javascript
import { aiService } from './services/ai-service.js';

// Zamień handleAIGenerate:
async handleAIGenerate(state, elements, uiManager) {
  const userPrompt = elements.aiPromptInput.value.trim();
  
  if (!userPrompt) {
    uiManager.showError('Wpisz prompt dla AI');
    return;
  }
  
  const contentType = this.currentAIType; // 'quiz' | 'workout' | 'listening'
  
  try {
    elements.aiGenerateButton.disabled = true;
    elements.aiGenerateButton.textContent = 'Generuję...';
    
    // Opcje dla listening
    const options = {};
    if (contentType === 'listening') {
      options.sourceLang = elements.aiSourceLang?.value || 'English';
      options.targetLang = elements.aiTargetLang?.value || 'Polish';
    }
    
    // DELEGUJ do serwisu
    const data = await aiService.generate(userPrompt, contentType, options);
    
    // Pokaż preview
    elements.aiPreview.textContent = JSON.stringify(data, null, 2);
    elements.aiPreviewContainer.classList.remove('hidden');
    
    // Zapisz do tymczasowej zmiennej
    this.generatedData = data;
    
  } catch (error) {
    console.error('AI generation error:', error);
    uiManager.showError(error.message);
  } finally {
    elements.aiGenerateButton.disabled = false;
    elements.aiGenerateButton.textContent = 'Generuj';
  }
}
```

**✅ Test**: Test manualny generowania AI

---

#### **KROK 7: Ekstrakcja `export-service.js`**
**Priorytet**: 🟢 NISKI  
**Czas**: 1-2 godziny

**Nowy plik: `js/services/export-service.js`**:
```javascript
/**
 * @fileoverview Serwis eksportu treści do JSON
 */

import { dataService } from '../data-service.js';

export class ExportService {
  /**
   * Eksportuje treść do pliku JSON
   * @param {string} id - ID treści
   * @param {'quiz'|'workout'|'listening'} type - Typ treści
   */
  async export(id, type) {
    // 1. Pobierz pełne dane
    let data, filename;
    
    if (type === 'quiz') {
      data = await dataService.fetchQuizById(id);
      filename = `quiz-${this.sanitizeFilename(data.title)}.json`;
    } else if (type === 'workout') {
      data = await dataService.fetchWorkoutById(id);
      filename = `workout-${this.sanitizeFilename(data.title)}.json`;
    } else if (type === 'listening') {
      data = await dataService.fetchListeningSetById(id);
      filename = `listening-${this.sanitizeFilename(data.title)}.json`;
    } else {
      throw new Error(`Unknown type: ${type}`);
    }
    
    // 2. Wyczyść dane (usuń metadata Supabase)
    const cleanData = this.cleanData(data, type);
    
    // 3. Download
    this.downloadJSON(cleanData, filename);
  }

  /**
   * Usuwa metadata Supabase
   */
  cleanData(data, type) {
    const clean = { ...data };
    
    // Usuń pola Supabase
    delete clean.id;
    delete clean.user_id;
    delete clean.created_at;
    delete clean.updated_at;
    delete clean.is_public;
    
    return clean;
  }

  /**
   * Sanityzuje nazwę pliku
   */
  sanitizeFilename(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
  }

  /**
   * Pobiera plik JSON
   */
  downloadJSON(data, filename) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    URL.revokeObjectURL(url);
  }
}

// Singleton
export const exportService = new ExportService();
```

**Update `js/content-manager.js`**:
```javascript
import { exportService } from './services/export-service.js';

async exportContent(id, state, elements) {
  // Określ typ na podstawie currentTab
  const type = state.currentTab; // 'quizzes' | 'workouts' | 'listening'
  const normalizedType = type.replace(/s$/, ''); // usuń 's' na końcu
  
  try {
    await exportService.export(id, normalizedType);
  } catch (error) {
    console.error('Export error:', error);
    alert(`Błąd eksportu: ${error.message}`);
  }
}
```

**✅ Test**: Test manualny eksportu

---

#### **KROK 8: Ekstrakcja `card-renderer.js` + `error-handler.js`**
**Priorytet**: 🟡 ŚREDNI  
**Czas**: 2-3 godziny

**Nowy plik: `js/ui/components/card-renderer.js`**:
```javascript
/**
 * @fileoverview Komponent renderowania kart treści
 */

export class CardRenderer {
  /**
   * Renderuje listę kart
   * @param {Array} items - Tablica elementów (quizzes/workouts/listening)
   * @param {'quiz'|'workout'|'listening'|'kb'} type - Typ treści
   * @param {Object} currentUser - Aktualny użytkownik
   * @returns {string} - HTML string
   */
  render(items, type, currentUser) {
    if (!items || items.length === 0) {
      return this.renderEmpty(type);
    }
    
    return items.map(item => this.renderCard(item, type, currentUser)).join('');
  }

  /**
   * Renderuje pojedynczą kartę
   */
  renderCard(item, type, currentUser) {
    const icon = this.getIcon(item, type);
    const badge = this.getBadge(item);
    const actionButtons = this.getActionButtons(item, type, currentUser);
    const description = this.getDescription(item, type);
    
    return `
      <div class="content-card bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow" 
           data-id="${item.id}" 
           data-type="${type}">
        
        <!-- Header -->
        <div class="flex items-start justify-between mb-2">
          <div class="flex items-center gap-2">
            <span class="text-3xl">${icon}</span>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              ${item.title}
            </h3>
          </div>
          ${badge}
        </div>
        
        <!-- Description -->
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
          ${description}
        </p>
        
        <!-- Action Buttons -->
        <div class="flex gap-2">
          ${actionButtons}
        </div>
      </div>
    `;
  }

  /**
   * Pusty stan
   */
  renderEmpty(type) {
    const messages = {
      quiz: 'Brak quizów. Zaimportuj lub wygeneruj nowy quiz.',
      workout: 'Brak treningów. Zaimportuj lub wygeneruj nowy trening.',
      listening: 'Brak zestawów. Zaimportuj lub wygeneruj nowy zestaw.',
      kb: 'Brak artykułów w bazie wiedzy.'
    };
    
    return `
      <div class="text-center py-12 text-gray-500 dark:text-gray-400">
        <p class="text-lg">${messages[type] || 'Brak treści'}</p>
      </div>
    `;
  }

  getIcon(item, type) {
    return item.icon || this.getDefaultIcon(type);
  }

  getDefaultIcon(type) {
    const defaults = {
      quiz: '📝',
      workout: '💪',
      listening: '🎧',
      kb: '📚'
    };
    return defaults[type] || '📄';
  }

  getBadge(item) {
    if (item.is_public) {
      return '<span class="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Publiczny</span>';
    }
    return '<span class="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">Prywatny</span>';
  }

  getDescription(item, type) {
    if (type === 'quiz') {
      return `${item.questions?.length || 0} pytań`;
    } else if (type === 'workout') {
      return `${item.phases?.length || 0} faz`;
    } else if (type === 'listening') {
      return `${item.phrases?.length || 0} fraz (${item.sourceLang} → ${item.targetLang})`;
    } else if (type === 'kb') {
      return item.description || 'Artykuł bazy wiedzy';
    }
    return '';
  }

  getActionButtons(item, type, currentUser) {
    const isOwner = currentUser && item.user_id === currentUser.id;
    
    let buttons = `
      <button class="btn-start px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" 
              data-id="${item.id}">
        Rozpocznij
      </button>
    `;
    
    if (isOwner) {
      buttons += `
        <button class="btn-export px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300" 
                data-id="${item.id}" 
                title="Eksportuj do JSON">
          📥
        </button>
        <button class="btn-delete px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200" 
                data-id="${item.id}" 
                title="Usuń">
          🗑️
        </button>
      `;
    }
    
    return buttons;
  }
}

// Singleton
export const cardRenderer = new CardRenderer();
```

**Nowy plik: `js/services/error-handler.js`**:
```javascript
/**
 * @fileoverview Centralna obsługa błędów
 */

export class ErrorHandler {
  constructor() {
    this.errorLog = [];
  }

  /**
   * Obsługuje błąd
   * @param {Error} error - Obiekt błędu
   * @param {string} context - Kontekst (np. 'import', 'ai-generate')
   */
  handle(error, context = 'unknown') {
    const errorInfo = {
      message: error.message,
      context: context,
      timestamp: new Date().toISOString(),
      stack: error.stack
    };
    
    // Log do konsoli
    console.error(`[${context}]`, error);
    
    // Zapisz do logu
    this.errorLog.push(errorInfo);
    
    // Limit logu do 50 ostatnich błędów
    if (this.errorLog.length > 50) {
      this.errorLog.shift();
    }
    
    // TODO: W przyszłości - wysyłka do Sentry/LogRocket
  }

  /**
   * Pobiera ostatnie błędy
   */
  getRecentErrors(limit = 10) {
    return this.errorLog.slice(-limit);
  }

  /**
   * Czyści log
   */
  clear() {
    this.errorLog = [];
  }
}

// Singleton
export const errorHandler = new ErrorHandler();
```

**Update `js/content-manager.js`**:
```javascript
import { cardRenderer } from './ui/components/card-renderer.js';
import { errorHandler } from './services/error-handler.js';

// Zamień renderCards:
renderCards(state, elements, uiManager, sessionManager) {
  const currentTab = state.currentTab;
  const currentUser = state.currentUser;
  
  let items, type;
  
  if (currentTab === 'quizzes') {
    items = state.quizzes;
    type = 'quiz';
  } else if (currentTab === 'workouts') {
    items = state.workouts;
    type = 'workout';
  } else if (currentTab === 'listening') {
    items = state.listeningSets;
    type = 'listening';
  } else if (currentTab === 'knowledge-base') {
    // KB ma osobną logikę (na razie zostaw)
    return;
  }
  
  try {
    // DELEGUJ do CardRenderer
    const html = cardRenderer.render(items, type, currentUser);
    elements.contentGrid.innerHTML = html;
    
    // Attach event listeners
    this.attachCardEventListeners(elements, state, uiManager, sessionManager);
    
  } catch (error) {
    errorHandler.handle(error, 'render-cards');
    uiManager.showError('Błąd renderowania kart');
  }
}
```

**✅ Test**: 
```bash
npm test
# + Test manualny renderowania kart
```

---

### 🏗️ FAZA 3: Unifikacja Silników (Kroki 9-12)

#### **KROK 9: Utworzenie `base-engine.js`**
**Priorytet**: 🔴 WYSOKI (fundament)  
**Czas**: 1 godzina

**Nowy plik: `js/engines/base-engine.js`**:
```javascript
/**
 * @fileoverview Bazowa klasa dla wszystkich silników treści
 * Definiuje jednolity interfejs dla quiz, workout, listening, KB
 */

export class BaseEngine {
  /**
   * @param {Object} elements - Referencje do elementów DOM
   */
  constructor(elements) {
    this.elements = elements;
    this.isInitialized = false;
    this.isActive = false;
  }

  // ========== LIFECYCLE METHODS (do implementacji w subclassach) ==========

  /**
   * Inicjalizacja silnika (event listeners, setup)
   */
  init() {
    throw new Error(`${this.constructor.name}.init() not implemented`);
  }

  /**
   * Rozpocznij aktywność
   * @param {Object} data - Dane (quiz/workout/listening)
   * @param {string} id - ID treści
   * @param {Object} options - Dodatkowe opcje
   */
  start(data, id, options = {}) {
    throw new Error(`${this.constructor.name}.start() not implemented`);
  }

  /**
   * Pauza
   */
  pause() {
    throw new Error(`${this.constructor.name}.pause() not implemented`);
  }

  /**
   * Wznów
   */
  resume() {
    throw new Error(`${this.constructor.name}.resume() not implemented`);
  }

  /**
   * Zatrzymaj i wyczyść
   */
  stop() {
    throw new Error(`${this.constructor.name}.stop() not implemented`);
  }

  /**
   * Restart od początku
   */
  restart() {
    throw new Error(`${this.constructor.name}.restart() not implemented`);
  }

  // ========== STATE MANAGEMENT ==========

  /**
   * Pobierz aktualny postęp
   * @returns {Object} - { current, total, percentage, ... }
   */
  getProgress() {
    throw new Error(`${this.constructor.name}.getProgress() not implemented`);
  }

  /**
   * Zapisz postęp (do localStorage lub Supabase)
   */
  saveProgress() {
    // Default: do nothing (opcjonalne w subclassach)
  }

  /**
   * Wczytaj postęp
   * @returns {Object|null} - Zapisany stan lub null
   */
  loadProgress() {
    // Default: do nothing (opcjonalne w subclassach)
    return null;
  }

  // ========== HELPER METHODS ==========

  /**
   * Sprawdź czy silnik jest zainicjalizowany
   */
  ensureInitialized() {
    if (!this.isInitialized) {
      throw new Error(`${this.constructor.name} not initialized. Call init() first.`);
    }
  }
}
```

**✅ Test**: Tylko utworzenie pliku, bez zmian w istniejącym kodzie

---

#### **KROK 10: Refactoring `quiz-engine.js` do klasy**
**Priorytet**: 🔴 KRYTYCZNY  
**Czas**: 4-5 godzin

**⚠️ UWAGA**: To największa zmiana w tej fazie. Przekształcamy IIFE w klasę.

**Backup przed zmianą**:
```bash
cp js/quiz-engine.js js/quiz-engine.js.backup
```

**Nowy `js/engines/quiz-engine.js`**:
```javascript
/**
 * @fileoverview Silnik quizów (refactored do klasy)
 */

import { BaseEngine } from './base-engine.js';
import { playSound } from '../utils/audio.js';

export class QuizEngine extends BaseEngine {
  constructor(elements) {
    super(elements);
    
    // Lokalny stan quizu (enkapsulowany!)
    this.quizState = {
      data: null,
      id: null,
      currentQuestionIndex: 0,
      score: 0,
      answers: [],
      mistakeQuestions: [],
      isMistakesMode: false
    };
  }

  // ========== LIFECYCLE ==========

  init() {
    this.setupElements();
    this.attachEventListeners();
    this.isInitialized = true;
    console.log('✅ QuizEngine initialized');
  }

  start(quizData, quizId, options = {}) {
    this.ensureInitialized();
    
    // Reset state
    this.quizState = {
      data: quizData,
      id: quizId,
      currentQuestionIndex: 0,
      score: 0,
      answers: [],
      mistakeQuestions: [],
      isMistakesMode: options.mistakesOnly || false
    };
    
    this.isActive = true;
    
    // Pokaż opcje quizu (normal vs mistakes)
    if (!options.mistakesOnly) {
      this.showQuizOptions();
    } else {
      this.startQuiz();
    }
  }

  pause() {
    // Quiz nie ma pauzy, ale możemy zapisać postęp
    this.saveProgress();
  }

  resume() {
    const progress = this.loadProgress();
    if (progress) {
      this.quizState = { ...this.quizState, ...progress };
      this.displayQuestion();
    }
  }

  stop() {
    this.isActive = false;
    this.quizState = {
      data: null,
      id: null,
      currentQuestionIndex: 0,
      score: 0,
      answers: [],
      mistakeQuestions: [],
      isMistakesMode: false
    };
  }

  restart() {
    const data = this.quizState.data;
    const id = this.quizState.id;
    this.stop();
    this.start(data, id);
  }

  // ========== QUIZ LOGIC (skopiuj z oryginalnego quiz-engine.js) ==========

  setupElements() {
    // Pobierz referencje do elementów DOM
    this.questionEl = this.elements.quizQuestion;
    this.optionsEl = this.elements.quizOptions;
    this.progressEl = this.elements.quizProgress;
    this.scoreEl = this.elements.quizScore;
    // ... etc
  }

  attachEventListeners() {
    // Event listeners dla przycisków
    this.elements.quizRestartBtn?.addEventListener('click', () => this.restart());
    this.elements.quizExitBtn?.addEventListener('click', () => this.exitQuiz());
    // ... etc
  }

  showQuizOptions() {
    // Pokaż modal z opcjami (normalny quiz vs tylko błędy)
    // Skopiuj logikę z oryginalnego pliku
  }

  startQuiz() {
    this.displayQuestion();
  }

  displayQuestion() {
    const { data, currentQuestionIndex, isMistakesMode, mistakeQuestions } = this.quizState;
    
    const questions = isMistakesMode ? mistakeQuestions : data.questions;
    
    if (currentQuestionIndex >= questions.length) {
      this.showSummary();
      return;
    }
    
    const question = questions[currentQuestionIndex];
    
    // Render pytania
    this.questionEl.textContent = question.question;
    
    // Render opcji
    this.optionsEl.innerHTML = question.options.map((option, idx) => `
      <button class="quiz-option" data-index="${idx}">
        ${option}
      </button>
    `).join('');
    
    // Attach listeners do opcji
    this.optionsEl.querySelectorAll('.quiz-option').forEach(btn => {
      btn.addEventListener('click', (e) => this.handleAnswer(e));
    });
    
    // Update progress
    this.updateProgress();
  }

  handleAnswer(event) {
    const selectedIndex = parseInt(event.target.dataset.index);
    const { data, currentQuestionIndex, isMistakesMode, mistakeQuestions } = this.quizState;
    
    const questions = isMistakesMode ? mistakeQuestions : data.questions;
    const question = questions[currentQuestionIndex];
    const isCorrect = selectedIndex === question.correctAnswer;
    
    // Zapisz odpowiedź
    this.quizState.answers.push({
      questionIndex: currentQuestionIndex,
      selectedAnswer: selectedIndex,
      correctAnswer: question.correctAnswer,
      isCorrect: isCorrect
    });
    
    // Update score
    if (isCorrect) {
      this.quizState.score++;
      playSound('correct');
    } else {
      playSound('wrong');
      // Dodaj do błędów (jeśli nie jest już w mistakes mode)
      if (!isMistakesMode) {
        this.quizState.mistakeQuestions.push(question);
      }
    }
    
    // Pokaż feedback
    this.showFeedback(isCorrect, question);
    
    // Następne pytanie (po 1.5s)
    setTimeout(() => {
      this.quizState.currentQuestionIndex++;
      this.displayQuestion();
    }, 1500);
  }

  showFeedback(isCorrect, question) {
    // Pokaż feedback (zielony/czerwony)
    // Skopiuj logikę z oryginalnego pliku
  }

  showSummary() {
    const { score, answers, data, mistakeQuestions } = this.quizState;
    const total = answers.length;
    const percentage = Math.round((score / total) * 100);
    
    // Render summary
    // Skopiuj logikę z oryginalnego pliku
    
    // Opcja "Powtórz błędy" jeśli są błędy
    if (mistakeQuestions.length > 0) {
      // Pokaż przycisk "Powtórz błędy"
    }
    
    this.isActive = false;
  }

  updateProgress() {
    const { currentQuestionIndex, data } = this.quizState;
    const total = data.questions.length;
    this.progressEl.textContent = `Pytanie ${currentQuestionIndex + 1} / ${total}`;
  }

  exitQuiz() {
    if (confirm('Czy na pewno chcesz wyjść? Postęp zostanie utracony.')) {
      this.stop();
      // Nawiguj do głównego ekranu
      if (window.uiManager) {
        window.uiManager.showScreen('main', window.state, window.elements);
      }
    }
  }

  // ========== STATE MANAGEMENT ==========

  getProgress() {
    const { currentQuestionIndex, data } = this.quizState;
    return {
      current: currentQuestionIndex + 1,
      total: data?.questions.length || 0,
      percentage: data ? Math.round(((currentQuestionIndex + 1) / data.questions.length) * 100) : 0
    };
  }

  saveProgress() {
    // Opcjonalnie: zapisz do localStorage
    localStorage.setItem(`quiz-progress-${this.quizState.id}`, JSON.stringify(this.quizState));
  }

  loadProgress() {
    const saved = localStorage.getItem(`quiz-progress-${this.quizState.id}`);
    return saved ? JSON.parse(saved) : null;
  }

  // ========== PUBLIC API (dla backward compatibility) ==========

  resetMistakes() {
    this.quizState.mistakeQuestions = [];
  }
}

// ========== BACKWARD COMPATIBILITY (TEMPORARY!) ==========
// Eksportuj do window.* aby stary kod działał

let quizEngineInstance = null;

export function initQuizEngine(elements) {
  if (!quizEngineInstance) {
    quizEngineInstance = new QuizEngine(elements);
    quizEngineInstance.init();
  }
  return quizEngineInstance;
}

// Globalne API (do usunięcia w Kroku 15)
if (typeof window !== 'undefined') {
  window.initQuizEngine = (elements) => initQuizEngine(elements);
  window.startQuiz = (data, id, options) => {
    if (quizEngineInstance) {
      quizEngineInstance.start(data, id, options);
    }
  };
  window.resetMistakes = () => {
    if (quizEngineInstance) {
      quizEngineInstance.resetMistakes();
    }
  };
}
```

**Update `js/app.js`**:
```javascript
// Zmień import
import { initQuizEngine } from './engines/quiz-engine.js';

// W funkcji init():
const quizEngine = initQuizEngine(elements);
```

**✅ Test**: 
```bash
npm test
# + Test manualny: uruchom quiz, sprawdź czy działa identycznie jak przed refaktoringiem
```

---

#### **KROK 11: Refactoring `workout-engine.js` do klasy**
**Priorytet**: 🔴 KRYTYCZNY  
**Czas**: 4-5 godzin

**Analogicznie do quiz-engine.js**:
1. Backup: `cp js/workout-engine.js js/workout-engine.js.backup`
2. Utwórz `js/engines/workout-engine.js` jako klasę dziedziczącą po `BaseEngine`
3. Enkapsuluj `workoutState` w klasie
4. Dodaj backward compatibility przez `window.*`
5. Update `js/app.js` aby używał nowego importu

**✅ Test**: `npm test` + test manualny treningów

---

#### **KROK 12: Refactoring `listening-engine.js` do klasy**
**Priorytet**: 🔴 KRYTYCZNY  
**Czas**: 4-5 godzin

**Analogicznie**:
1. Backup: `cp js/listening-engine.js js/listening-engine.js.backup`
2. Utwórz `js/engines/listening-engine.js` jako klasę
3. Enkapsuluj `playerState` w klasie
4. Backward compatibility
5. Update `js/app.js`

**✅ Test**: `npm test` + test manualny listening

---

### 🧭 FAZA 4: Centralna Nawigacja (Kroki 13-14)

#### **KROK 13: Utworzenie `router.js`**
**Priorytet**: 🟡 ŚREDNI  
**Czas**: 3-4 godziny

**Nowy plik: `js/core/router.js`**:
```javascript
/**
 * @fileoverview Centralny router aplikacji
 */

import { appState } from '../state/app-state.js';

/**
 * Bazowa klasa dla ekranów
 */
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

  // Do nadpisania w subclassach
  onShow(options) {}
  onHide() {}
}

/**
 * Router - centralna nawigacja
 */
export class Router {
  constructor(screens) {
    this.screens = screens; // Map<string, Screen>
    this.currentScreen = null;
    this.history = [];
  }

  /**
   * Nawiguj do ekranu
   */
  navigate(screenName, options = {}) {
    console.log(`🧭 Router: navigating to ${screenName}`);
    
    // 1. Ukryj obecny ekran
    if (this.currentScreen) {
      this.currentScreen.hide();
      this.history.push(this.currentScreen.name);
    }

    // 2. Pobierz docelowy ekran
    const screen = this.screens.get(screenName);
    if (!screen) {
      console.error(`Screen not found: ${screenName}`);
      return;
    }

    // 3. Zaktualizuj globalny stan
    appState.setState({
      currentScreen: screenName,
      isActivity: screen.isActivity,
      showTabBar: !screen.isActivity
    });

    // 4. Pokaż nowy ekran
    screen.show(options);
    this.currentScreen = screen;
  }

  /**
   * Wróć do poprzedniego ekranu
   */
  back() {
    if (this.history.length > 0) {
      const previousScreen = this.history.pop();
      this.navigate(previousScreen);
    } else {
      // Fallback: wróć do main
      this.navigate('main');
    }
  }

  /**
   * Pobierz aktualny ekran
   */
  getCurrentScreen() {
    return this.currentScreen;
  }
}
```

**Update `js/ui-manager.js` - dodaj backward compatibility**:
```javascript
import { router } from '../core/router.js'; // Będzie utworzony w app.js

// W showScreen - dodaj delegację do routera
showScreen(screenName, state, elements, contentManager, sessionManager) {
  // NOWY SPOSÓB: deleguj do routera
  if (window.router) {
    window.router.navigate(screenName, { state, elements, contentManager, sessionManager });
  }
  
  // STARY SPOSÓB: zachowaj na razie (fallback)
  // ... istniejący kod ...
}
```

**✅ Test**: `npm test` + test nawigacji

---

#### **KROK 14: Migracja ekranów do `ui/screens/`**
**Priorytet**: 🟢 NISKI (optional, ale zalecane)  
**Czas**: 4-5 godzin

**Przykład: `js/ui/screens/quiz-screen.js`**:
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
    // Cleanup if needed
  }
}
```

**Podobnie dla**: `workout-screen.js`, `listening-screen.js`, `main-screen.js`, `kb-screen.js`

**Update `js/app.js`**:
```javascript
import { Router } from './core/router.js';
import { QuizScreen } from './ui/screens/quiz-screen.js';
// ... inne ekrany

// Inicjalizacja routera
const router = new Router(new Map([
  ['quiz', new QuizScreen(elements.quizScreen, quizEngine)],
  ['workout', new WorkoutScreen(elements.workoutScreen, workoutEngine)],
  ['listening', new ListeningScreen(elements.listeningScreen, listeningEngine)],
  ['main', new MainScreen(elements.mainScreen)],
  // ...
]));

window.router = router; // Backward compatibility
```

**✅ Test**: `npm test` + test wszystkich ekranów

---

### 🗑️ FAZA 5: Finalizacja - Usunięcie Duplikacji (Kroki 15-18)

**⚠️ KRYTYCZNE**: Ta faza używa **Strangler Fig Pattern** - migrujemy moduł po module!

#### **KROK 15a: Migracja `quiz-engine` do wyłącznego użycia `appState`**
**Priorytet**: 🔴 KRYTYCZNY  
**Czas**: 2 godziny

**Akcje**:
1. W `quiz-engine.js`: zamień wszystkie `window.state.X` na `appState.getState().X`
2. Usuń synchronizację w `app.js` dla danych związanych z quizami
3. Test: `npm test` + test quizów

---

#### **KROK 15b: Migracja `workout-engine` do `appState`**
**Priorytet**: 🔴 KRYTYCZNY  
**Czas**: 2 godziny

Analogicznie do 15a.

---

#### **KROK 15c: Migracja `listening-engine` do `appState`**
**Priorytet**: 🔴 KRYTYCZNY  
**Czas**: 2 godziny

Analogicznie do 15a.

---

#### **KROK 15d: Usunięcie starego `state` z `app.js`**
**Priorytet**: 🔴 KRYTYCZNY  
**Czas**: 2-3 godziny

**Akcje**:
1. Usuń obiekt `state` z `app.js`
2. Usuń `window.state = state;`
3. Zamień wszystkie `state.X` na `appState.getState().X` w całym projekcie
4. Usuń synchronizację między stanami

**✅ Test**: `npm test` - **MUST PASS!**

---

#### **KROK 16: Merge `ui-state.js` do `app-state.js`**
**Priorytet**: 🟡 ŚREDNI  
**Czas**: 2 godziny

**Dlaczego?** `ui-state.js` i `app-state.js` zarządzają tymi samymi danymi (currentScreen, currentTab, showTabBar).

**Akcje**:
1. Przenieś logikę z `ui-state.js` (np. `navigateToScreen`) do `app-state.js` jako helper functions
2. Update wszystkie importy `ui-state.js` → `app-state.js`
3. Usuń plik `js/ui-state.js`

**✅ Test**: `npm test`

---

#### **KROK 17: Cleanup - usunięcie backward compatibility**
**Priorytet**: 🟢 NISKI  
**Czas**: 2-3 godziny

**Akcje**:
1. Usuń wszystkie `window.*` API:
   - `window.startQuiz`
   - `window.startWorkout`
   - `window.initQuizEngine`
   - etc.

2. Usuń fallback code w `ui-manager.js` (stara implementacja `showScreen`)

3. Usuń IIFE wrappery z silników (jeśli jeszcze są)

4. Update `index.html` - zamień na ES6 modules:
```html
<!-- PRZED -->
<script src="js/state-manager.js"></script>
<script src="js/ui-state.js"></script>
<script src="js/app.js"></script>

<!-- PO -->
<script type="module" src="js/core/app.js"></script>
```

**✅ Test**: `npm test` + pełne testy regresyjne manualne

---

#### **KROK 18: Implementacja paginacji w `data-service.js`**
**Priorytet**: 🟡 ŚREDNI (skalowalność)  
**Czas**: 3-4 godziny

**Problem**: `loadData` pobiera wszystkie quizy/treningi naraz. Przy 500+ elementach aplikacja się zawiesza.

**Rozwiązanie**: Lazy loading + paginacja.

**Update `js/data-service.js`**:
```javascript
/**
 * Pobiera quizy z paginacją
 * @param {number} page - Numer strony (0-based)
 * @param {number} pageSize - Rozmiar strony (default: 20)
 * @returns {Promise<{data: Array, hasMore: boolean}>}
 */
async fetchQuizzesPaginated(page = 0, pageSize = 20) {
  const { data, error } = await supabase
    .from('quizzes')
    .select('*')
    .order('created_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);
  
  if (error) throw error;
  
  return {
    data: data || [],
    hasMore: data.length === pageSize
  };
}

// Analogicznie dla workouts i listening
```

**Update `js/content-manager.js`**:
```javascript
async loadData(state, elements, uiManager) {
  // Zamiast pobierać wszystko naraz, pobierz pierwszą stronę
  const page = 0;
  const pageSize = 20;
  
  if (state.currentTab === 'quizzes') {
    const result = await dataService.fetchQuizzesPaginated(page, pageSize);
    state.quizzes = result.data;
    
    // Jeśli są kolejne strony, dodaj przycisk "Załaduj więcej"
    if (result.hasMore) {
      this.showLoadMoreButton(elements, 'quizzes');
    }
  }
  // ... analogicznie dla workouts, listening
}

showLoadMoreButton(elements, type) {
  // Dodaj przycisk "Załaduj więcej" na dole listy
}
```

**✅ Test**: Test manualny z dużą ilością danych

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
| Build tools | Brak (network waterfall) |

### Po refaktoringu:
| Metryka | Cel |
|---------|-----|
| Struktura katalogów | 6 warstw (core, state, services, engines, ui, utils) |
| Największy plik | <500 linii |
| Zarządzanie stanem | 1 sposób (`appState` + lokalne store'y w silnikach) |
| Duplikacja logiki | 0 (centralna `Router`) |
| Globalna przestrzeń | 0 (ES6 modules) |
| Wzorzec silników | Jednolity (`BaseEngine` + classes) |
| Build tools | Vite (HMR + bundling) |
| Testy | 100% pass rate |

---

## ⚠️ Ryzyka i Mitygacja

### Ryzyko 1: Regresje w działaniu aplikacji
- **Mitygacja**: Incremental refactoring - każdy krok testowany
- **Checkpoint**: Po każdym kroku: `npm test` + test manualny
- **Rollback**: Git commit po każdym kroku

### Ryzyko 2: Długi czas refaktoringu
- **Mitygacja**: Timeboxing - każda faza max 2-3 dni
- **Checkpoint**: Po każdej fazie - code review

### Ryzyko 3: Merge conflicts
- **Mitygacja**: Refactoring w osobnym branchu `refactor/architecture-2025`
- **Best practice**: Freeze feature development podczas refaktoringu

### Ryzyko 4: Performance regression po wprowadzeniu Vite
- **Mitygacja**: Benchmark przed i po (Lighthouse, WebPageTest)
- **Expected**: Poprawa performance dzięki bundlingowi

---

## 🎯 Harmonogram (Estimation)

| Faza | Kroki | Czas | Priorytet |
|------|-------|------|-----------|
| **Faza 0: Build Tools** | Krok 0 | 0.5 dnia | 🔴 KRYTYCZNY |
| **Faza 1: Przygotowanie** | Kroki 1-3 | 1 dzień | 🔴 WYSOKI |
| **Faza 2: God Object** | Kroki 4-8 | 3 dni | 🔴 KRYTYCZNY |
| **Faza 3: Silniki** | Kroki 9-12 | 3 dni | 🔴 KRYTYCZNY |
| **Faza 4: Nawigacja** | Kroki 13-14 | 1.5 dnia | 🟡 ŚREDNI |
| **Faza 5: Finalizacja** | Kroki 15-18 | 2 dni | 🔴 KRYTYCZNY |
| **TOTAL** | 18 kroków | **10-12 dni** | |

---

## ✅ Checklist przed rozpoczęciem

- [ ] Backup całego projektu
- [ ] Utworzenie brancha `refactor/architecture-2025`
- [ ] Komunikacja z zespołem (freeze feature development)
- [ ] Przygotowanie środowiska testowego
- [ ] Zainstalowanie Vite: `npm install --save-dev vite`

---

## 📝 Następne Kroki

1. ✅ **Akceptacja tego planu przez managera**
2. ✅ **Utworzenie branch `refactor/architecture-2025`**
3. ✅ **Rozpoczęcie od Fazy 0 (Krok 0: Vite setup)**
4. ✅ **Daily standupy - raportowanie postępu**
5. ✅ **Code review po każdej fazie**
6. ✅ **Merge do main po zakończeniu całości**

---

## 🤝 Podsumowanie

Ten plan jest **syntezą dwóch niezależnych analiz architektonicznych**. Łączy:
- ✅ Szczegółowy, krok-po-kroku plan refaktoringu
- ✅ Pragmatyczne podejście (build tools, paginacja, error handling)
- ✅ Bezpieczną strategię migracji (Strangler Fig Pattern)
- ✅ Hybrydowe zarządzanie stanem (globalny + lokalne)

**Kluczowe usprawnienia względem oryginalnej analizy**:
1. **Krok 0 (Vite)** - rozwiązuje problem network waterfall
2. **Rozbicie Kroku 13 na 15a-d** - bezpieczniejsza migracja stanu
3. **Krok 18 (paginacja)** - skalowalność danych
4. **Error handler** - centralna obsługa błędów
5. **Jasna strategia stanu** - globalny tylko dla user/navigation, lokalne w silnikach

---

**Document Version**: 2.0 (FINAL)  
**Last Updated**: 2025-11-01  
**Authors**: Zespół Architektury  
**Status**: ✅ **ZATWIERDZONY - GOTOWY DO IMPLEMENTACJI**

---

**Pytania? Wątpliwości?**  
📧 Skontaktuj się z team leadem przed rozpoczęciem implementacji.

**Good luck! 🚀**

