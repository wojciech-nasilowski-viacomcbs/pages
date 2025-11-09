# Naprawa Logiki Timera w Treningach

## Problem
Wcześniej wszystkie ćwiczenia typu `time` (w tym odpoczynek) wymagały kliknięcia przycisku "Rozpocznij", aby uruchomić timer. To było nieintuicyjne, szczególnie dla odpoczynku, który powinien startować automatycznie.

**Dodatkowo** - był problem z "losowością" zachowania timera dla zwykłych ćwiczeń. Czasami timer startował automatycznie, czasami nie. Przyczyną był **brak resetu stanu timera** (`isPaused`, `timerInterval`) przy przechodzeniu do następnego ćwiczenia.

## Rozwiązanie
Zmodyfikowano funkcję `_showExercise()` w `workout-engine.js`, aby:

1. **Resetować stan timera** przed pokazaniem każdego nowego ćwiczenia
2. **Różnicować zachowanie** między odpoczynkiem a zwykłymi ćwiczeniami

### ✅ Odpoczynek (type: "time", name zawiera "odpoczynek")
- **Timer startuje automatycznie** po wyświetleniu ćwiczenia
- Przycisk główny pokazuje "Pauza" (możliwość zatrzymania)
- Przycisk Skip: "Pomiń odpoczynek"

### ✅ Ćwiczenie na czas (type: "time", inne nazwy)
- **Timer czeka na kliknięcie** przycisku "Rozpocznij"
- Użytkownik ma czas na przygotowanie się do ćwiczenia
- Po kliknięciu "Rozpocznij" timer startuje i przycisk zmienia się na "Pauza"
- Przycisk Skip: "Pomiń ćwiczenie"

### ✅ Ćwiczenie na powtórzenia (type: "reps")
- Timer nie jest wyświetlany
- Przycisk "Gotowe" jest aktywny od razu
- Użytkownik klika "Gotowe" po wykonaniu powtórzeń
- Przycisk Skip: "Pomiń ćwiczenie"

## Zmieniony kod

**Plik:** `js/engines/workout-engine.js`  
**Funkcja:** `_showExercise()` (linie 341-390)

### Kluczowe zmiany:

```javascript
_showExercise() {
  const phase = this.workoutState.data.phases[this.workoutState.currentPhaseIndex];
  const exercise = phase.exercises[this.workoutState.currentExerciseIndex];

  // ✅ NOWE: Reset stanu timera przed pokazaniem nowego ćwiczenia
  this._stopTimer();
  this.workoutState.isPaused = false;

  // Update UI...
  
  // Sprawdź czy to odpoczynek
  const isRest = exercise.name && exercise.name.toLowerCase().includes('odpoczynek');

  // Setup przycisku w zależności od typu ćwiczenia
  if (exercise.type === 'time') {
    this.workoutState.timeLeft = exercise.duration;
    this._updateTimerDisplay();
    this.elements.timer?.classList.remove('hidden');
    
    // ✅ NOWE: Odpoczynek startuje automatycznie, ćwiczenia czekają na przycisk
    if (isRest) {
      this._startTimer();
      this._showButton('pause-timer', 'Pauza', this.icons.timer);
    } else {
      this._showButton('start-timer', 'Rozpocznij', this.icons.timer);
    }
  } else {
    this.elements.timer?.classList.add('hidden');
    this._showButton('complete', 'Gotowe', this.icons.check);
  }
}
```

### Co naprawia reset stanu?

**Problem "losowości"** wynikał z tego, że:
1. Użytkownik robi ćwiczenie "Deska 45s"
2. Klika "Rozpocznij" → timer startuje
3. Klika "Pauza" → `isPaused = true`, `timerInterval` zatrzymany
4. Timer się kończy (lub Skip) → przechodzi do następnego ćwiczenia
5. **Bez resetu**: `isPaused` nadal może być `true`, `timerInterval` może nie być prawidłowo wyczyszczony
6. Następne ćwiczenie może dziedziczyć nieprawidłowy stan

**Rozwiązanie**: Zawsze resetuj `_stopTimer()` i `isPaused = false` na początku `_showExercise()`

## Przykład użycia

### Trening z seriami (automatycznie rozwijany)
```json
{
  "name": "Push Up",
  "type": "reps",
  "reps": "15",
  "sets": 3,
  "restBetweenSets": 30,
  "description": "Pompki klasyczne."
}
```

**System automatycznie rozwija to na:**
1. Push Up seria 1/3 (15 powtórzeń) - **czeka na "Gotowe"**
2. Odpoczynek (30s) - **timer startuje automatycznie** ✅
3. Push Up seria 2/3 (15 powtórzeń) - **czeka na "Gotowe"**
4. Odpoczynek (30s) - **timer startuje automatycznie** ✅
5. Push Up seria 3/3 (15 powtórzeń) - **czeka na "Gotowe"**

### Ćwiczenie na czas
```json
{
  "name": "Deska (plank)",
  "type": "time",
  "duration": 45,
  "description": "Utrzymuj proste plecy."
}
```

**Zachowanie:**
- Wyświetla się ćwiczenie "Deska (plank)"
- Timer pokazuje 0:45
- Przycisk: "Rozpocznij" - **czeka na kliknięcie** ✅
- Po kliknięciu timer startuje

## Testy

### Scenariusze testowe:

#### ✅ Test 1: Odpoczynek startuje automatycznie
- Wykonaj ćwiczenie z seriami (np. Push Up x3)
- **Oczekiwane**: Po każdej serii odpoczynek startuje automatycznie
- **Status**: ✅ Działa poprawnie

#### ✅ Test 2: Ćwiczenia na czas czekają na przycisk
- Rozpocznij trening z ćwiczeniem typu "time" (np. "Deska 45s")
- **Oczekiwane**: Timer pokazuje czas, ale czeka na "Rozpocznij"
- **Status**: ✅ Działa poprawnie

#### ✅ Test 3: Brak losowości po pauzie
- Rozpocznij ćwiczenie na czas
- Kliknij "Pauza"
- Kliknij "Wznów"
- Poczekaj aż timer się skończy
- **Oczekiwane**: Następne ćwiczenie zaczyna się w czystym stanie
- **Status**: ✅ Naprawione - reset stanu w `_showExercise()`

#### ✅ Test 4: Przejście między ćwiczeniami
- Wykonaj sekwencję: Ćwiczenie na czas → Odpoczynek → Ćwiczenie na czas
- **Oczekiwane**: 
  - Pierwsze ćwiczenie: czeka na "Rozpocznij"
  - Odpoczynek: startuje automatycznie
  - Drugie ćwiczenie: czeka na "Rozpocznij"
- **Status**: ✅ Działa poprawnie

#### ✅ Test 5: Skip nie psuje stanu
- Rozpocznij ćwiczenie na czas
- Kliknij "Pomiń ćwiczenie"
- **Oczekiwane**: Następne ćwiczenie zaczyna się w czystym stanie
- **Status**: ✅ Działa poprawnie

### Podsumowanie
- ✅ Odpoczynek między seriami startuje automatycznie
- ✅ Ćwiczenia na czas czekają na przycisk "Rozpocznij"
- ✅ Ćwiczenia na powtórzenia pokazują przycisk "Gotowe"
- ✅ Przyciski Skip mają odpowiednie teksty
- ✅ **Naprawiono losowość** - każde ćwiczenie zaczyna się w czystym stanie
- ⚠️ Istniejące błędy lintera (Wake Lock API, nieużywany parametr) - nie związane z tą zmianą

## Dodatkowa naprawa: Dźwięk zakończenia ćwiczenia

### 🐛 Problem
Dźwięk "bip-bip" (`playTimerEndSound()`) był odtwarzany **tylko** dla ćwiczeń z timerem (type: "time"), gdy timer automatycznie doszedł do zera.

**Dla ćwiczeń na powtórzenia** (type: "reps"), gdy użytkownik klikał "Gotowe", **dźwięk nie był odtwarzany**.

### ✅ Rozwiązanie
Dodano odtwarzanie dźwięku w akcji `'complete'` (linia 429):

```javascript
case 'complete':
  playTimerEndSound(); // ✅ Odtwórz dźwięk zakończenia ćwiczenia
  this._handleNext();
  break;
```

### 🎵 Teraz dźwięk jest odtwarzany:
- ✅ Po zakończeniu timera dla ćwiczeń na czas (automatycznie)
- ✅ Po zakończeniu timera dla odpoczynku (automatycznie)
- ✅ Po kliknięciu "Gotowe" dla ćwiczeń na powtórzenia (ręcznie)

**Rezultat**: Spójne doświadczenie użytkownika - każde zakończenie ćwiczenia sygnalizowane dźwiękiem! 🔊

---

## Data
2025-11-09

