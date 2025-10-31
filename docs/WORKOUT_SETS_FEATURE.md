# Funkcjonalność: Wieloseryjne Ćwiczenia w Treningach

## 📋 Podsumowanie

Dodano obsługę ćwiczeń z wieloma seriami. System automatycznie rozwija takie ćwiczenia na oddzielne kroki z odpoczynkami między seriami.

## 🎯 Problem

Poprzednio, treningi z wieloma seriami tego samego ćwiczenia wymagały ręcznego wpisywania każdej serii i odpoczynku jako oddzielnych ćwiczeń:

```json
{
  "name": "Push Up",
  "type": "reps",
  "details": "4 serie × 15 powtórzeń"
}
```

To było:
- ❌ Powtarzalne i podatne na błędy
- ❌ Brak automatycznego śledzenia postępu w seriach
- ❌ Trudne w edycji (zmiana liczby serii wymagała edycji wielu wpisów)

## ✅ Rozwiązanie

Nowy format pozwala na zwięzłe określenie ćwiczeń wieloseryjnych:

```json
{
  "name": "Push Up",
  "type": "reps",
  "reps": "15",
  "sets": 4,
  "restBetweenSets": 30,
  "description": "Pompki klasyczne...",
  "mediaUrl": ""
}
```

System automatycznie rozwinie to na:
1. Push Up seria 1/4 (15 powtórzeń)
2. Odpoczynek (30s)
3. Push Up seria 2/4 (15 powtórzeń)
4. Odpoczynek (30s)
5. Push Up seria 3/4 (15 powtórzeń)
6. Odpoczynek (30s)
7. Push Up seria 4/4 (15 powtórzeń)

## 📝 Nowe Pola JSON

### Dla ćwiczeń na powtórzenia (`type: "reps"`):

| Pole | Typ | Wymagane | Opis |
|------|-----|----------|------|
| `reps` | string | Tak* | Liczba powtórzeń w jednej serii (np. "15", "10-12", "MAX") |
| `sets` | number | Nie | Liczba serii (>= 2). Jeśli brak lub = 1, traktowane jako pojedyncze ćwiczenie |
| `restBetweenSets` | number | Nie | Czas odpoczynku między seriami w sekundach (domyślnie: 30) |

*Dla kompatybilności wstecznej można używać `details` zamiast `reps`

### Dla ćwiczeń czasowych (`type: "time"`):

| Pole | Typ | Wymagane | Opis |
|------|-----|----------|------|
| `duration` | number | Tak | Czas trwania jednej serii w sekundach |
| `sets` | number | Nie | Liczba serii (>= 2). Jeśli brak lub = 1, traktowane jako pojedyncze ćwiczenie |
| `restBetweenSets` | number | Nie | Czas odpoczynku między seriami w sekundach (domyślnie: 30) |

## 🔄 Kompatybilność Wsteczna

Stare treningi nadal działają! System zachowuje kompatybilność ze starym formatem:

```json
{
  "name": "Podciąganie",
  "type": "reps",
  "details": "MAX powtórzeń",
  "description": "...",
  "mediaUrl": ""
}
```

## 🛠️ Implementacja

### 1. Funkcja `expandExerciseSets()` w `workout-engine.js`

```javascript
function expandExerciseSets(phases) {
  return phases.map(phase => {
    const expandedExercises = [];
    
    phase.exercises.forEach(exercise => {
      if (exercise.sets && exercise.sets >= 2) {
        // Rozwija na serie z odpoczynkami
        for (let i = 1; i <= exercise.sets; i++) {
          expandedExercises.push({
            ...exercise,
            name: `${exercise.name} seria ${i}/${exercise.sets}`,
            sets: undefined
          });
          
          if (i < exercise.sets) {
            // Dodaj odpoczynek (nie po ostatniej serii)
            expandedExercises.push({
              name: "Odpoczynek",
              type: "time",
              duration: exercise.restBetweenSets || 30,
              description: "Przerwa między seriami.",
              details: "",
              mediaUrl: ""
            });
          }
        }
      } else {
        // Zachowaj pojedyncze ćwiczenie
        expandedExercises.push(exercise);
      }
    });
    
    return { ...phase, exercises: expandedExercises };
  });
}
```

### 2. Integracja w `startWorkout()`

```javascript
function startWorkout(workoutData, filename) {
  const expandedWorkoutData = {
    ...workoutData,
    phases: expandExerciseSets(workoutData.phases)
  };
  
  workoutState.data = expandedWorkoutData;
  // ... reszta kodu
}
```

## 📚 Przykłady

### Przykład 1: Ćwiczenie na powtórzenia z 4 seriami

**JSON:**
```json
{
  "name": "Push Up",
  "type": "reps",
  "reps": "15",
  "sets": 4,
  "restBetweenSets": 30,
  "description": "Pompki klasyczne. Dłonie na szerokość barków.",
  "mediaUrl": ""
}
```

**Rozwinięcie:**
- Push Up seria 1/4 (15 powtórzeń)
- Odpoczynek (30s)
- Push Up seria 2/4 (15 powtórzeń)
- Odpoczynek (30s)
- Push Up seria 3/4 (15 powtórzeń)
- Odpoczynek (30s)
- Push Up seria 4/4 (15 powtórzeń)

### Przykład 2: Ćwiczenie czasowe z 3 seriami

**JSON:**
```json
{
  "name": "Deska (plank)",
  "type": "time",
  "duration": 45,
  "sets": 3,
  "restBetweenSets": 20,
  "description": "Utrzymuj proste plecy przez cały czas.",
  "mediaUrl": ""
}
```

**Rozwinięcie:**
- Deska (plank) seria 1/3 (45s)
- Odpoczynek (20s)
- Deska (plank) seria 2/3 (45s)
- Odpoczynek (20s)
- Deska (plank) seria 3/3 (45s)

### Przykład 3: Mix wieloseryjne + pojedyncze

**JSON:**
```json
{
  "name": "Trening główny",
  "exercises": [
    {
      "name": "Przysiady",
      "type": "reps",
      "reps": "20",
      "sets": 3,
      "restBetweenSets": 30,
      "description": "...",
      "mediaUrl": ""
    },
    {
      "name": "Bieg w miejscu",
      "type": "time",
      "duration": 60,
      "description": "...",
      "mediaUrl": ""
    }
  ]
}
```

**Rozwinięcie:**
1. Przysiady seria 1/3 (20 powtórzeń)
2. Odpoczynek (30s)
3. Przysiady seria 2/3 (20 powtórzeń)
4. Odpoczynek (30s)
5. Przysiady seria 3/3 (20 powtórzeń)
6. Bieg w miejscu (60s)

## 🧪 Testy

Utworzono pełny zestaw testów jednostkowych w `__tests__/workout-sets-expansion.test.js`:

✅ Rozwijanie ćwiczeń na powtórzenia z 4 seriami  
✅ Rozwijanie ćwiczeń czasowych z 3 seriami  
✅ Zachowanie pojedynczych ćwiczeń bez zmian  
✅ Kompatybilność wsteczna ze starym formatem  
✅ Mix ćwiczeń wieloseryjnych i pojedynczych  
✅ Domyślny odpoczynek 30s  
✅ Brak rozwijania dla `sets = 1`  
✅ Przetwarzanie wielu faz jednocześnie  

Wszystkie testy przeszły pomyślnie! ✅

## 📂 Zmienione Pliki

1. **`/js/workout-engine.js`**
   - Dodano funkcję `expandExerciseSets()`
   - Zintegrowano z `startWorkout()`

2. **`/js/ai-prompts.js`**
   - Zaktualizowano prompt dla generowania treningów
   - Dodano przykłady z nowymi polami

3. **`/docs/DATA_FORMAT.md`**
   - Dodano dokumentację nowych pól
   - Rozszerzono przykłady
   - Dodano sekcje o kompatybilności wstecznej

4. **`/data/workouts/codzienny.json`**
   - Przekształcono na nowy format z `sets`, `reps`, `restBetweenSets`
   - Uproszczono strukturę (usunięto ręczne odpoczynki)

5. **`/__tests__/workout-sets-expansion.test.js`**
   - Nowy plik z testami jednostkowymi

6. **`/test-workout-sets.json`**
   - Plik testowy do manualnej weryfikacji wszystkich scenariuszy

## 🚀 Korzyści

### Dla twórców treningów:
- ✅ Prostsze tworzenie treningów wieloseryjnych
- ✅ Łatwiejsza edycja (zmiana liczby serii w jednym miejscu)
- ✅ Mniej błędów przy ręcznym wpisywaniu

### Dla użytkowników:
- ✅ Czytelne nazwy: "Pompki seria 1/4", "Pompki seria 2/4"
- ✅ Automatyczne odpoczynki między seriami
- ✅ Lepsze śledzenie postępu

### Dla AI:
- ✅ Zaktualizowane prompty uwzględniają nowy format
- ✅ AI automatycznie generuje treningi w nowym formacie

## 📖 Jak używać?

### W nowym treningu:

```json
{
  "title": "Mój trening",
  "description": "...",
  "emoji": "💪",
  "phases": [
    {
      "name": "Trening główny",
      "exercises": [
        {
          "name": "Pompki",
          "type": "reps",
          "reps": "15",
          "sets": 4,
          "restBetweenSets": 30,
          "description": "...",
          "mediaUrl": ""
        }
      ]
    }
  ]
}
```

### Prosząc AI o wygenerowanie:

```
Wygeneruj trening FBW z 3 seriami pompek (15 powtórzeń), 
3 seriami podciągań (10 powtórzeń) i 2 seriami deski (45s).
```

AI automatycznie użyje nowego formatu z polami `sets`, `reps`, `restBetweenSets`.

## 🔮 Przyszłość

Możliwe rozszerzenia:
- 📊 Śledzenie postępu w każdej serii
- 💾 Zapisywanie wyników dla każdej serii
- 📈 Statystyki progresji w seriach
- ⏱️ Elastyczne czasy odpoczynku (np. krótsze w ostatnich seriach)

---

**Data implementacji:** 31 października 2025  
**Wersja:** 2.1  
**Status:** ✅ Ukończone i przetestowane

