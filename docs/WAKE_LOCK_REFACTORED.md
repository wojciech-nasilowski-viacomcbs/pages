# Wake Lock API - Zunifikowane Rozwiązanie

## 🎯 Przegląd

Aplikacja eTrener używa **jednego centralnego modułu** `wakeLockManager` do zarządzania blokadą ekranu dla wszystkich aktywności. System oparty jest na **referencjach** - blokada jest aktywna dopóki przynajmniej jedna aktywność jej potrzebuje.

### 🛡️ Wielowarstwowa ochrona (Android fix)

System używa **3 warstw ochrony** przed wygaszaniem ekranu:
1. **Wake Lock API** - standardowe API przeglądarki
2. **Dummy video** - ukryte wideo jako fallback (szczególnie dla Androida z TTS)
3. **Keepalive** - regularne "pingi" co 10 sekund + automatyczna reaktywacja

**Problem:** Na Androidzie z Web Speech API (TTS) ekran może się wygaszać mimo Wake Lock.  
**Rozwiązanie:** Wielowarstwowa ochrona zapewnia że ekran pozostaje włączony nawet gdy system próbuje zwolnić blokadę.

📖 **Szczegóły:** Zobacz `docs/WAKE_LOCK_ANDROID_FIX.md`

## ✨ Zalety zunifikowanego rozwiązania

### ✅ Przed refaktoryzacją (duplikacja)
- ❌ Kod Wake Lock duplikowany w `workout-engine.js` i `listening-engine.js`
- ❌ Dwa osobne systemy zarządzania blokadą
- ❌ Trudniejsze utrzymanie i debugowanie
- ❌ Ryzyko konfliktów gdy dwie aktywności działają jednocześnie

### ✅ Po refaktoryzacji (zunifikowane)
- ✅ Jeden centralny moduł `js/wake-lock.js`
- ✅ System referencji - wiele aktywności może współdzielić blokadę
- ✅ Łatwe dodawanie nowych aktywności
- ✅ Jednolite logowanie i debugowanie
- ✅ Automatyczna obsługa `visibilitychange` dla wszystkich aktywności

## 🏗️ Architektura

```
┌─────────────────────────────────────────────────┐
│           js/wake-lock.js                       │
│      (Centralny Wake Lock Manager)              │
│                                                  │
│  System referencji:                             │
│  - 'workout'   → trening aktywny                │
│  - 'listening' → odtwarzacz słuchania aktywny   │
│  - 'quiz'      → quiz aktywny (przyszłość)      │
│                                                  │
│  Blokada aktywna gdy: references.size > 0       │
└─────────────────────────────────────────────────┘
           ▲              ▲              ▲
           │              │              │
     ┌─────┴─────┐  ┌────┴─────┐  ┌────┴─────┐
     │ workout   │  │ listening│  │  quiz    │
     │ engine    │  │  engine  │  │  engine  │
     └───────────┘  └──────────┘  └──────────┘
```

## 📚 API Reference

### Główne metody

#### `addReference(source)`
Dodaje referencję do blokady. Jeśli to pierwsza referencja, aktywuje blokadę ekranu.

```javascript
await window.wakeLockManager.addReference('workout');
// 🔒 Wake Lock reference added: workout (total: 1)
// ✅ Wake Lock acquired - screen will stay on
```

#### `removeReference(source)`
Usuwa referencję. Jeśli to ostatnia referencja, zwalnia blokadę ekranu.

```javascript
await window.wakeLockManager.removeReference('workout');
// 🔓 Wake Lock reference removed: workout (remaining: 0)
// 🔓 Wake Lock released
```

### Metody pomocnicze

#### `isSupported()`
Sprawdza czy przeglądarka wspiera Wake Lock API.

```javascript
if (window.wakeLockManager.isSupported()) {
  // API dostępne
}
```

#### `hasReference(source)`
Sprawdza czy dana aktywność ma aktywną referencję.

```javascript
const isActive = window.wakeLockManager.hasReference('workout');
// true lub false
```

#### `getReferenceCount()`
Zwraca liczbę aktywnych referencji.

```javascript
const count = window.wakeLockManager.getReferenceCount();
// 0, 1, 2, ...
```

#### `getActiveSources()`
Zwraca listę aktywnych źródeł.

```javascript
const sources = window.wakeLockManager.getActiveSources();
// ['workout', 'listening']
```

#### `reacquire()`
Wymusza ponowne aktywowanie blokady (jeśli są aktywne referencje).

```javascript
await window.wakeLockManager.reacquire();
```

## 🔧 Implementacja w modułach

### Treningi (`js/workout-engine.js`)

```javascript
// Przy starcie treningu
async function startWorkout(data, filename) {
  // ... inicjalizacja ...
  
  // Aktywuj Wake Lock
  if (window.wakeLockManager && window.wakeLockManager.isSupported()) {
    await window.wakeLockManager.addReference('workout');
  }
  
  displayExercise();
}

// Po zakończeniu treningu
function finishWorkout() {
  // Zwolnij Wake Lock
  if (window.wakeLockManager && window.wakeLockManager.isSupported()) {
    await window.wakeLockManager.removeReference('workout');
  }
  
  // ... reszta logiki ...
}
```

### Nauka ze słuchu (`js/ui-state.js`)

```javascript
// Automatyczna integracja przez system stanu
uiStore.subscribe(async (state, prevState) => {
  if (state.isListeningPlayerActive !== prevState.isListeningPlayerActive) {
    if (window.wakeLockManager && window.wakeLockManager.isSupported()) {
      if (state.isListeningPlayerActive) {
        await window.wakeLockManager.addReference('listening');
      } else {
        await window.wakeLockManager.removeReference('listening');
      }
    }
  }
});
```

## 🎬 Przykładowe scenariusze

### Scenariusz 1: Tylko trening
```
1. Użytkownik rozpoczyna trening
   → addReference('workout')
   → Wake Lock AKTYWOWANY ✅
   
2. Użytkownik kończy trening
   → removeReference('workout')
   → Wake Lock ZWOLNIONY 🔓
```

### Scenariusz 2: Trening + Słuchanie jednocześnie
```
1. Użytkownik rozpoczyna trening
   → addReference('workout')
   → Wake Lock AKTYWOWANY ✅
   
2. Użytkownik otwiera odtwarzacz słuchania w tle
   → addReference('listening')
   → Wake Lock POZOSTAJE AKTYWNY (2 referencje)
   
3. Użytkownik kończy trening
   → removeReference('workout')
   → Wake Lock POZOSTAJE AKTYWNY (1 referencja: listening)
   
4. Użytkownik zamyka odtwarzacz
   → removeReference('listening')
   → Wake Lock ZWOLNIONY 🔓 (0 referencji)
```

### Scenariusz 3: Przełączanie kart
```
1. Trening aktywny, Wake Lock aktywny
   → addReference('workout')
   
2. Użytkownik przełącza się na inną kartę
   → Browser automatycznie zwalnia Wake Lock
   → Referencja 'workout' POZOSTAJE w systemie
   
3. Użytkownik wraca do aplikacji
   → visibilitychange event
   → wakeLockManager.reacquire()
   → Wake Lock PONOWNIE AKTYWOWANY ✅
```

## 🐛 Debugowanie

### Sprawdzanie stanu w konsoli

```javascript
// Sprawdź wsparcie
console.log('Supported:', window.wakeLockManager.isSupported());

// Sprawdź aktywne referencje
console.log('Count:', window.wakeLockManager.getReferenceCount());
console.log('Sources:', window.wakeLockManager.getActiveSources());

// Sprawdź konkretną aktywność
console.log('Workout active:', window.wakeLockManager.hasReference('workout'));
console.log('Listening active:', window.wakeLockManager.hasReference('listening'));
```

### Logi konsoli

System automatycznie loguje wszystkie operacje:

```
✅ Wake Lock Manager initialized
🔒 Wake Lock reference added: workout (total: 1)
✅ Wake Lock acquired - screen will stay on
🔒 Wake Lock reference added: listening (total: 2)
🔓 Wake Lock reference removed: workout (remaining: 1)
🔓 Wake Lock reference removed: listening (remaining: 0)
🔓 Wake Lock released
🔄 Reacquiring Wake Lock...
```

## 🚀 Dodawanie nowych aktywności

Aby dodać Wake Lock do nowej aktywności (np. quiz):

```javascript
// W js/quiz-engine.js

// Przy starcie quizu
async function startQuiz(data) {
  // ... inicjalizacja ...
  
  if (window.wakeLockManager && window.wakeLockManager.isSupported()) {
    await window.wakeLockManager.addReference('quiz');
  }
}

// Po zakończeniu quizu
async function finishQuiz() {
  if (window.wakeLockManager && window.wakeLockManager.isSupported()) {
    await window.wakeLockManager.removeReference('quiz');
  }
  
  // ... reszta logiki ...
}
```

To wszystko! System automatycznie:
- ✅ Zarządza blokadą
- ✅ Obsługuje `visibilitychange`
- ✅ Współpracuje z innymi aktywnościami
- ✅ Loguje operacje

## 📱 Testowanie

### Test 1: Pojedyncza aktywność
1. Rozpocznij trening
2. Sprawdź w konsoli: `wakeLockManager.getActiveSources()` → `['workout']`
3. Zostaw telefon bez dotykania
4. ✅ Ekran powinien pozostać włączony

### Test 2: Wiele aktywności
1. Rozpocznij trening
2. Otwórz odtwarzacz słuchania
3. Sprawdź w konsoli: `wakeLockManager.getActiveSources()` → `['workout', 'listening']`
4. Zakończ trening
5. Sprawdź w konsoli: `wakeLockManager.getActiveSources()` → `['listening']`
6. ✅ Ekran nadal włączony (listening aktywny)

### Test 3: Przełączanie kart
1. Rozpocznij dowolną aktywność
2. Przełącz się na inną kartę przeglądarki
3. Poczekaj 5 sekund
4. Wróć do aplikacji
5. Sprawdź logi konsoli - powinno być: `🔄 Reacquiring Wake Lock...`
6. ✅ Blokada ponownie aktywna

## 📊 Wsparcie przeglądarek

| Przeglądarka | Wersja | Status |
|--------------|--------|--------|
| Chrome/Edge  | 84+    | ✅ Pełne wsparcie |
| Safari       | 16.4+  | ✅ Pełne wsparcie |
| Firefox      | 126+   | ✅ Pełne wsparcie |
| Opera        | 70+    | ✅ Pełne wsparcie |
| Samsung Internet | 14+ | ✅ Pełne wsparcie |

**Graceful degradation:** W starszych przeglądarkach aplikacja działa normalnie, ale ekran może się wygaszać.

## 📂 Pliki

- **`js/wake-lock.js`** - Centralny moduł Wake Lock Manager
- **`js/ui-state.js`** - Integracja dla listening (linie 75-85)
- **`js/workout-engine.js`** - Integracja dla treningów (linie 438-452)
- **`index.html`** - Ładowanie skryptu (linia 1393)

## 🔗 Linki

- [MDN: Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API)
- [Can I Use: Wake Lock](https://caniuse.com/wake-lock)

---

**Ostatnia aktualizacja:** 2025-11-01  
**Wersja:** 2.0 (Zunifikowane rozwiązanie)

