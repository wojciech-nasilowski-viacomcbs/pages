# State Management - Dokumentacja

## 📦 Przegląd

Aplikacja używa lekkiego, reaktywnego systemu zarządzania stanem zbudowanego w vanilla JavaScript. System składa się z dwóch modułów:

1. **`state-manager.js`** - Generyczny store z subskrypcjami (pub/sub pattern)
2. **`ui-state.js`** - Dedykowany manager stanu UI (ekrany, tab bar, aktywności)

## 🎯 Architektura

```
┌─────────────────────────────────────┐
│      state-manager.js               │
│  (Generic reactive store)           │
│  - createStore()                    │
│  - getState() / setState()          │
│  - subscribe() / unsubscribe()      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      ui-state.js                    │
│  (UI-specific state logic)          │
│  - navigateToScreen()               │
│  - setListeningPlayerActive()       │
│  - switchTab()                      │
│  - Auto tab bar management          │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  ui-manager.js, listening-engine.js │
│  (Consumers)                        │
└─────────────────────────────────────┘
```

## 🚀 Użycie

### Podstawowe operacje

```javascript
// Pobierz aktualny stan
const state = uiState.getState();
console.log(state.currentScreen); // 'main', 'quiz', etc.
console.log(state.showTabBar);    // true/false

// Nawiguj do ekranu (automatycznie zarządza tab barem)
uiState.navigateToScreen('quiz');      // Ukryje tab bar (aktywność)
uiState.navigateToScreen('main');      // Pokaże tab bar (nawigacja)
uiState.navigateToScreen('quiz-summary'); // Pokaże tab bar (podsumowanie)

// Zarządzaj odtwarzaczem słuchania
uiState.setListeningPlayerActive(true);  // Odtwarzacz włączony - ukryj tab bar
uiState.setListeningPlayerActive(false); // Lista zestawów - pokaż tab bar

// Przełącz zakładkę
uiState.switchTab('workouts');

// Ręczne zarządzanie tab barem (rzadko potrzebne)
uiState.setTabBarVisible(false);
```

### Subskrypcje (reactive updates)

```javascript
// Subskrybuj zmiany stanu
const unsubscribe = uiState.subscribe((state, prevState) => {
  console.log('Screen changed from', prevState.currentScreen, 'to', state.currentScreen);
  
  if (state.isActivity) {
    console.log('Activity started - tab bar hidden');
  }
});

// Anuluj subskrypcję
unsubscribe();
```

## 📋 Stan UI (UIState)

```typescript
{
  currentScreen: 'main' | 'quiz' | 'quiz-summary' | 'workout' | 'workout-end' | 'listening' | 'more' | 'loading',
  currentTab: 'quizzes' | 'workouts' | 'listening' | 'more',
  isActivity: boolean,              // Czy trwa aktywność (quiz/trening/słuchanie)
  showTabBar: boolean,              // Czy pokazywać dolny pasek nawigacji
  isListeningPlayerActive: boolean  // Czy odtwarzacz słuchania jest aktywny
}
```

## 🎨 Automatyczne zarządzanie Tab Barem

System automatycznie pokazuje/ukrywa tab bar na podstawie typu ekranu:

| Typ ekranu | Przykłady | Tab Bar |
|------------|-----------|---------|
| **Nawigacyjne** | `main`, `more` | ✅ Widoczny |
| **Aktywności** | `quiz`, `workout`, odtwarzacz słuchania | ❌ Ukryty |
| **Podsumowania** | `quiz-summary`, `workout-end` | ✅ Widoczny |
| **Listening** | Lista zestawów | ✅ Widoczny |
| **Listening** | Odtwarzacz aktywny | ❌ Ukryty |

## 🔧 API Reference

### `uiState.navigateToScreen(screenName, options?)`

Przełącza na wybrany ekran i automatycznie zarządza stanem UI.

**Parametry:**
- `screenName` (string) - Nazwa ekranu
- `options.isActivity` (boolean, optional) - Jawnie określ czy to aktywność

**Przykład:**
```javascript
uiState.navigateToScreen('quiz');
uiState.navigateToScreen('listening', { isActivity: true });
```

### `uiState.setListeningPlayerActive(isActive)`

Ustawia stan odtwarzacza słuchania.

**Parametry:**
- `isActive` (boolean) - Czy odtwarzacz jest aktywny

**Przykład:**
```javascript
// W listening-engine.js
function openPlayer(set) {
  // ... kod odtwarzacza ...
  uiState.setListeningPlayerActive(true); // Ukryj tab bar
}

function showListeningList() {
  // ... kod listy ...
  uiState.setListeningPlayerActive(false); // Pokaż tab bar
}
```

### `uiState.getState()`

Zwraca aktualny stan UI (kopia, nie można mutować).

**Zwraca:** `UIState`

### `uiState.subscribe(listener)`

Subskrybuje zmiany stanu.

**Parametry:**
- `listener` (function) - Callback `(state, prevState) => void`

**Zwraca:** Funkcja do anulowania subskrypcji

## 🧪 Tworzenie własnych store'ów

Możesz tworzyć własne store'y używając `createStore()`:

```javascript
// Przykład: store dla ustawień użytkownika
const settingsStore = createStore({
  theme: 'dark',
  language: 'pl',
  soundEnabled: true
});

// Subskrybuj zmiany
settingsStore.subscribe((state) => {
  console.log('Settings changed:', state);
  localStorage.setItem('settings', JSON.stringify(state));
});

// Aktualizuj ustawienia
settingsStore.setState({ theme: 'light' });

// Pobierz aktualne ustawienia
const settings = settingsStore.getState();
```

## 📊 Zalety systemu

✅ **Centralizacja** - Jeden punkt prawdy dla stanu UI  
✅ **Reaktywność** - Automatyczne aktualizacje UI  
✅ **Debugowanie** - Łatwe śledzenie zmian stanu  
✅ **Testowanie** - Łatwe mockowanie i testowanie  
✅ **Skalowalność** - Łatwe dodawanie nowych funkcji  
✅ **Zero dependencies** - Vanilla JS, brak zewnętrznych bibliotek  
✅ **Mały rozmiar** - ~150 linii kodu (state-manager.js + ui-state.js)  

## 🚫 Anty-wzorce (czego unikać)

❌ **Nie mutuj stanu bezpośrednio:**
```javascript
// ŹLE
const state = uiState.getState();
state.currentScreen = 'quiz'; // Nie zadziała!

// DOBRZE
uiState.navigateToScreen('quiz');
```

❌ **Nie twórz memory leaks - zawsze anuluj subskrypcje:**
```javascript
// ŹLE - subskrypcja nigdy nie jest anulowana
uiState.subscribe((state) => {
  console.log(state);
});

// DOBRZE - anuluj gdy nie jest potrzebna
const unsubscribe = uiState.subscribe((state) => {
  console.log(state);
});
// Później: unsubscribe();
```

## 📝 Changelog

### v2.1 (2025-10-29)
- ✨ Dodano `state-manager.js` - generyczny reactive store
- ✨ Dodano `ui-state.js` - dedykowany manager stanu UI
- ✨ Automatyczne zarządzanie widocznością tab bara
- ✨ Integracja z `ui-manager.js` i `listening-engine.js`
- 📚 Dodano dokumentację

