# Changelog: Wieloseryjne Ćwiczenia

**Data:** 31 października 2025  
**Wersja:** 2.1  
**Typ:** Feature - Nowa funkcjonalność

## 🎯 Co się zmieniło?

### Nowy Format JSON dla Ćwiczeń Wieloseryjnych

Zamiast ręcznego definiowania każdej serii i odpoczynku:

```json
// ❌ STARY SPOSÓB (nieefektywny)
{
  "name": "Push Up",
  "type": "reps",
  "details": "4 serie × 15 powtórzeń"
},
{
  "name": "Odpoczynek",
  "type": "time",
  "duration": 30
},
// ... powtórz dla każdej serii
```

Teraz wystarczy:

```json
// ✅ NOWY SPOSÓB (automatyczne rozwijanie)
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

System automatycznie rozwinie to na:
1. Push Up seria 1/4 (15 powtórzeń)
2. Odpoczynek (30s)
3. Push Up seria 2/4 (15 powtórzeń)
4. Odpoczynek (30s)
5. Push Up seria 3/4 (15 powtórzeń)
6. Odpoczynek (30s)
7. Push Up seria 4/4 (15 powtórzeń)

## 📝 Nowe Pola

### Dla `type: "reps"`:
- `reps` (string) - liczba powtórzeń w jednej serii (np. "15", "10-12", "MAX")
- `sets` (number, opcjonalne) - liczba serii (>= 2)
- `restBetweenSets` (number, opcjonalne) - odpoczynek między seriami w sekundach (domyślnie: 30)

### Dla `type: "time"`:
- `duration` (number) - czas trwania jednej serii w sekundach
- `sets` (number, opcjonalne) - liczba serii (>= 2)
- `restBetweenSets` (number, opcjonalne) - odpoczynek między seriami w sekundach (domyślnie: 30)

## ✅ Kompatybilność Wsteczna

Stare treningi nadal działają! System zachowuje pełną kompatybilność:

```json
{
  "name": "Podciąganie",
  "type": "reps",
  "details": "MAX powtórzeń",  // stary format - nadal działa!
  "description": "...",
  "mediaUrl": ""
}
```

## 📦 Zmienione Pliki

1. **`js/workout-engine.js`**
   - ✅ Dodano `expandExerciseSets()` - automatyczne rozwijanie serii
   - ✅ Zintegrowano z `startWorkout()`

2. **`js/ai-prompts.js`**
   - ✅ Zaktualizowano prompty AI
   - ✅ Dodano przykłady z nowymi polami

3. **`docs/DATA_FORMAT.md`**
   - ✅ Dodano dokumentację nowych pól
   - ✅ Rozszerzono przykłady

4. **`data/workouts/codzienny.json`**
   - ✅ Przekształcono na nowy format
   - ✅ Uproszczono strukturę (automatyczne odpoczynki)

5. **`__tests__/workout-sets-expansion.test.js`**
   - ✅ Nowy plik z 8 testami jednostkowymi
   - ✅ 100% pokrycie funkcjonalności

## 🧪 Testy

**Wszystkie testy przeszły:** 87/87 ✅

```bash
Test Suites: 6 passed, 6 total
Tests:       87 passed, 87 total
```

Nowe testy obejmują:
- ✅ Rozwijanie ćwiczeń na powtórzenia z wieloma seriami
- ✅ Rozwijanie ćwiczeń czasowych z wieloma seriami
- ✅ Zachowanie pojedynczych ćwiczeń
- ✅ Kompatybilność wsteczną
- ✅ Mix wieloseryjnych i pojedynczych
- ✅ Domyślne wartości odpoczynków
- ✅ Przetwarzanie wielu faz

## 🚀 Korzyści

### Dla twórców treningów:
- 🎯 **Prostsza struktura** - jedno ćwiczenie zamiast N wpisów
- ✏️ **Łatwiejsza edycja** - zmiana liczby serii w jednym miejscu
- 🐛 **Mniej błędów** - brak ręcznego powielania

### Dla użytkowników:
- 📊 **Przejrzystość** - widać postęp: "seria 2/4"
- ⏱️ **Automatyczne odpoczynki** - system zadba o przerwy
- 🎯 **Lepsze śledzenie** - jasna struktura serii

### Dla AI:
- 🤖 **Nowe prompty** - AI wie jak generować wieloseryjne treningi
- 📝 **Automatyzacja** - AI tworzy efektywniejsze treningi

## 📖 Jak używać?

### 1. Tworzenie nowego treningu:

```json
{
  "title": "Trening Siłowy",
  "description": "Full Body Workout",
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

### 2. Generowanie przez AI:

Prompt:
```
Wygeneruj trening FBW z:
- 4 seriami pompek po 15 powtórzeń
- 3 seriami podciągań po MAX powtórzeń
- 2 seriami deski po 45s
```

AI automatycznie użyje nowego formatu!

## 🔍 Test Manualny

Utworzono plik testowy: `test-workout-sets.json`

Zawiera wszystkie scenariusze:
- ✅ Ćwiczenia wieloseryjne (reps i time)
- ✅ Ćwiczenia pojedyncze
- ✅ Kompatybilność wsteczna
- ✅ Mix różnych typów

Możesz zaimportować ten plik w aplikacji aby przetestować funkcjonalność.

## 📚 Dokumentacja

Pełna dokumentacja dostępna w:
- `/docs/WORKOUT_SETS_FEATURE.md` - kompletny opis funkcjonalności
- `/docs/DATA_FORMAT.md` - zaktualizowany format JSON

## ⚠️ Breaking Changes

**BRAK!** 

Implementacja jest w pełni kompatybilna wstecz. Stare treningi działają bez zmian.

## 🎉 Podsumowanie

Implementacja wieloseryjnych ćwiczeń to znaczące usprawnienie, które:
- ✅ Upraszcza tworzenie treningów
- ✅ Poprawia czytelność
- ✅ Zachowuje kompatybilność
- ✅ Jest w pełni przetestowana (87 testów)
- ✅ Wspierana przez AI

---

**Implementował:** AI Assistant (Claude Sonnet 4.5)  
**Data:** 31 października 2025  
**Status:** ✅ Ukończone, przetestowane i wdrożone

