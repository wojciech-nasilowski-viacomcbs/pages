# Wake Lock - Historia zmian

## 📅 2025-11-01 - Refaktoryzacja do zunifikowanego rozwiązania

### 🎯 Problem
- Duplikacja kodu Wake Lock w `workout-engine.js` i `ui-state.js`
- Brak wsparcia dla równoczesnych aktywności
- Trudne utrzymanie i debugowanie

### ✅ Rozwiązanie
Stworzenie centralnego modułu `wakeLockManager` z systemem referencji.

### 🔧 Zmiany w plikach

#### 1. `js/wake-lock.js` - REFAKTORYZACJA
**Przed:**
```javascript
// Prosty moduł z acquire/release
let wakeLock = null;
async function acquire() { ... }
async function release() { ... }
```

**Po:**
```javascript
// System referencji - wiele aktywności
const activeReferences = new Set();
async function addReference(source) { ... }
async function removeReference(source) { ... }
```

**Nowe funkcje:**
- ✅ `addReference(source)` - dodaje referencję
- ✅ `removeReference(source)` - usuwa referencję
- ✅ `hasReference(source)` - sprawdza referencję
- ✅ `getReferenceCount()` - liczba referencji
- ✅ `getActiveSources()` - lista aktywnych źródeł
- ✅ `reacquire()` - wymusza reaktywację

#### 2. `js/workout-engine.js` - UPROSZCZENIE
**Przed (linie 436-479):**
```javascript
// Własna implementacja Wake Lock (30+ linii)
async function requestWakeLock() {
  workoutState.wakeLock = await navigator.wakeLock.request('screen');
  // ... obsługa eventów ...
}

function releaseWakeLock() {
  workoutState.wakeLock.release();
  // ...
}

function handleVisibilityChange() {
  // Własna obsługa visibilitychange
}
```

**Po (linie 438-462):**
```javascript
// Używa centralnego managera (10 linii)
async function requestWakeLock() {
  if (window.wakeLockManager && window.wakeLockManager.isSupported()) {
    await window.wakeLockManager.addReference('workout');
  }
}

async function releaseWakeLock() {
  if (window.wakeLockManager && window.wakeLockManager.isSupported()) {
    await window.wakeLockManager.removeReference('workout');
  }
}

// handleVisibilityChange już nie potrzebne - obsługiwane centralnie
```

**Usunięte:**
- ❌ `workoutState.wakeLock` - nie potrzebne
- ❌ Własna obsługa `visibilitychange` - centralna obsługa

#### 3. `js/ui-state.js` - AKTUALIZACJA API
**Przed (linie 75-87):**
```javascript
if (state.isListeningPlayerActive) {
  await window.wakeLockManager.acquire();
} else {
  await window.wakeLockManager.release();
}
```

**Po (linie 78-82):**
```javascript
if (state.isListeningPlayerActive) {
  await window.wakeLockManager.addReference('listening');
} else {
  await window.wakeLockManager.removeReference('listening');
}
```

### 📊 Statystyki

| Metryka | Przed | Po | Zmiana |
|---------|-------|-----|--------|
| Linie kodu Wake Lock | ~80 | ~220 | +140 (ale centralne!) |
| Duplikacja | 2x | 0x | ✅ -100% |
| Pliki z logiką Wake Lock | 2 | 1 | ✅ -50% |
| Obsługa równoczesnych aktywności | ❌ Nie | ✅ Tak | +∞% |

### 🎁 Korzyści

#### Dla deweloperów
- ✅ Jeden punkt zarządzania Wake Lock
- ✅ Łatwe dodawanie nowych aktywności
- ✅ Jednolite logowanie i debugowanie
- ✅ Lepsze testy i utrzymanie

#### Dla użytkowników
- ✅ Ekran nie gaśnie podczas treningów
- ✅ Ekran nie gaśnie podczas nauki ze słuchu
- ✅ Działa gdy obie aktywności są równocześnie aktywne
- ✅ Automatyczna reaktywacja po powrocie do karty

### 🔮 Przyszłość

Łatwe dodanie Wake Lock dla:
- 🎯 Quizów (szczególnie z timerem)
- 📖 Czytania artykułów z bazy wiedzy
- 🎥 Przyszłych funkcji wideo/audio

Wystarczy:
```javascript
await window.wakeLockManager.addReference('quiz');
// ... aktywność ...
await window.wakeLockManager.removeReference('quiz');
```

### 📚 Dokumentacja

- **Główna dokumentacja:** `docs/WAKE_LOCK_REFACTORED.md`
- **Ten plik:** `docs/WAKE_LOCK_CHANGELOG.md`

### 🧪 Testowanie

```javascript
// W konsoli przeglądarki:

// Sprawdź wsparcie
window.wakeLockManager.isSupported()

// Rozpocznij trening (symulacja)
await window.wakeLockManager.addReference('workout')

// Sprawdź stan
window.wakeLockManager.getActiveSources() // ['workout']
window.wakeLockManager.getReferenceCount() // 1

// Dodaj listening (symulacja)
await window.wakeLockManager.addReference('listening')

// Sprawdź stan
window.wakeLockManager.getActiveSources() // ['workout', 'listening']
window.wakeLockManager.getReferenceCount() // 2

// Zakończ trening
await window.wakeLockManager.removeReference('workout')

// Sprawdź stan
window.wakeLockManager.getActiveSources() // ['listening']
window.wakeLockManager.getReferenceCount() // 1

// Zakończ listening
await window.wakeLockManager.removeReference('listening')

// Sprawdź stan
window.wakeLockManager.getActiveSources() // []
window.wakeLockManager.getReferenceCount() // 0
```

### ⚠️ Breaking Changes

**Brak!** Stare API (`acquire`/`release`) nadal działa dla kompatybilności wstecznej:

```javascript
// Legacy API - nadal działa
await window.wakeLockManager.acquire()  // → addReference('legacy')
await window.wakeLockManager.release()  // → removeReference('legacy')
```

### 🐛 Znane problemy

Brak znanych problemów.

### 👥 Autorzy

- Refaktoryzacja: AI Assistant + User
- Data: 2025-11-01
- Wersja: 2.0

---

**Następne kroki:**
1. ✅ Przetestować na urządzeniach mobilnych
2. ✅ Zweryfikować działanie w różnych przeglądarkach
3. 🔮 Rozważyć dodanie Wake Lock do quizów

