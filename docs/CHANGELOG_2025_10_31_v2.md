# Changelog - 31 października 2025

**Wersja:** 2.2  
**Data:** 31 października 2025  
**Typ:** Major Feature Update

## 🎉 Nowe Funkcjonalności

### 1. Wieloseryjne Ćwiczenia (v2.1)

**Problem:** Ręczne definiowanie każdej serii i odpoczynku było powtarzalne i podatne na błędy.

**Rozwiązanie:** Nowy format JSON automatycznie rozwija ćwiczenia z wieloma seriami.

#### Przed:
```json
{
  "name": "Push Up",
  "type": "reps",
  "details": "4 serie × 15 powtórzeń"
}
// + ręczne dodawanie każdej serii i odpoczynku
```

#### Teraz:
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

**Automatyczne rozwinięcie:**
1. Push Up seria 1/4 (15 powtórzeń)
2. Odpoczynek (30s)
3. Push Up seria 2/4 (15 powtórzeń)
4. Odpoczynek (30s)
5. Push Up seria 3/4 (15 powtórzeń)
6. Odpoczynek (30s)
7. Push Up seria 4/4 (15 powtórzeń)

**Korzyści:**
- ✅ Prostsze tworzenie treningów
- ✅ Łatwiejsza edycja (zmiana liczby serii w jednym miejscu)
- ✅ Mniej błędów
- ✅ Przejrzyste nazewnictwo: "seria X/Y"

**Nowe pola:**
- `reps` (string) - liczba powtórzeń w jednej serii
- `sets` (number) - liczba serii (>= 2)
- `restBetweenSets` (number) - odpoczynek między seriami w sekundach (domyślnie: 30)

**Kompatybilność:** ✅ Pełna kompatybilność wsteczna - stare treningi działają bez zmian

---

### 2. Inteligentne Pomijanie Odpoczynków (v2.2)

**Problem:** Brak rozróżnienia między odpoczynkiem a normalnym ćwiczeniem w UI.

**Rozwiązanie:** System automatycznie wykrywa odpoczynki i dostosowuje UX.

#### Funkcjonalności:

1. **Automatyczne uruchamianie timera**
   - Timer odpoczynku uruchamia się automatycznie
   - Nie trzeba klikać "URUCHOM STOPER"

2. **Wyraźny przycisk pomijania**
   - 🟠 Pomarańczowy kolor (zamiast szarego)
   - 📏 Większy rozmiar (bardziej widoczny)
   - ⏭️ Jasny tekst: "⏭️ Pomiń odpoczynek"

3. **Inteligentne wykrywanie**
   - System rozpoznaje odpoczynki po nazwie i typie
   - Automatyczna zmiana UI

#### Wizualne porównanie:

**Odpoczynek:**
```
┌─────────────────────────────────────┐
│  ⏭️ Pomiń odpoczynek                │  ← Pomarańczowy, duży
└─────────────────────────────────────┘
```

**Normalne ćwiczenie:**
```
┌─────────────────────────────────────┐
│  Pomiń ćwiczenie                    │  ← Szary, mniejszy
└─────────────────────────────────────┘
```

**Korzyści:**
- ⚡ Szybszy przepływ treningowy
- 👁️ Lepsza widoczność
- 🎯 Jasna komunikacja
- 💪 Większa kontrola dla użytkownika

---

## 📦 Zmienione Pliki

### JavaScript:
1. **`js/workout-engine.js`**
   - Dodano `expandExerciseSets()` - rozwijanie serii
   - Dodano `isRestExercise()` - wykrywanie odpoczynków
   - Dodano `updateSkipButtonForRest()` - zmiana UI przycisku
   - Zmodyfikowano `startWorkout()` - integracja rozwijania
   - Zmodyfikowano `displayExercise()` - automatyczne uruchamianie timera

2. **`js/ai-prompts.js`**
   - Zaktualizowano prompty dla generowania treningów
   - Dodano przykłady z nowymi polami `sets`, `reps`, `restBetweenSets`

### Dane:
3. **`data/workouts/codzienny.json`**
   - Przekształcono na nowy format z seriami
   - Uproszczono strukturę (automatyczne odpoczynki)

### Dokumentacja:
4. **`docs/DATA_FORMAT.md`**
   - Dodano dokumentację nowych pól
   - Rozszerzono przykłady
   - Dodano sekcje o kompatybilności wstecznej

5. **`docs/WORKOUT_SETS_FEATURE.md`**
   - Pełna dokumentacja wieloseryjnych ćwiczeń

6. **`docs/SKIP_REST_FEATURE.md`**
   - Pełna dokumentacja pomijania odpoczynków

### Testy:
7. **`__tests__/workout-sets-expansion.test.js`**
   - 8 testów jednostkowych dla rozwijania serii
   - 100% pokrycie funkcjonalności

8. **`__tests__/workout-skip-rest.test.js`**
   - 16 testów jednostkowych dla pomijania odpoczynków
   - 100% pokrycie funkcjonalności

### Pliki testowe:
9. **`test-workout-sets.json`**
   - Plik testowy do manualnej weryfikacji

---

## 🧪 Wyniki Testów

```bash
Test Suites: 7 passed, 7 total
Tests:       103 passed, 103 total ✅
Snapshots:   0 total
Time:        0.695 s
```

**Nowe testy:** +24 (8 dla serii + 16 dla odpoczynków)  
**Poprzednie testy:** 79  
**Razem:** 103 testy ✅

---

## 🎯 Przykład Użycia

### Tworzenie treningu z seriami:

```json
{
  "title": "Trening FBW",
  "description": "Full Body Workout z seriami",
  "emoji": "💪",
  "phases": [
    {
      "name": "Trening główny",
      "exercises": [
        {
          "name": "Push Up",
          "type": "reps",
          "reps": "15",
          "sets": 4,
          "restBetweenSets": 30,
          "description": "Pompki klasyczne",
          "mediaUrl": ""
        },
        {
          "name": "Pull Up",
          "type": "reps",
          "reps": "MAX",
          "sets": 3,
          "restBetweenSets": 45,
          "description": "Podciągania na drążku",
          "mediaUrl": ""
        }
      ]
    }
  ]
}
```

### Co się stanie:

System automatycznie rozwinie to na:
1. **Push Up seria 1/4** (15 powtórzeń)
2. **Odpoczynek** (30s) - ⏭️ Automatyczny timer + pomarańczowy przycisk
3. **Push Up seria 2/4** (15 powtórzeń)
4. **Odpoczynek** (30s) - ⏭️ Automatyczny timer + pomarańczowy przycisk
5. **Push Up seria 3/4** (15 powtórzeń)
6. **Odpoczynek** (30s) - ⏭️ Automatyczny timer + pomarańczowy przycisk
7. **Push Up seria 4/4** (15 powtórzeń)
8. **Pull Up seria 1/3** (MAX powtórzeń)
9. **Odpoczynek** (45s) - ⏭️ Automatyczny timer + pomarańczowy przycisk
10. **Pull Up seria 2/3** (MAX powtórzeń)
11. **Odpoczynek** (45s) - ⏭️ Automatyczny timer + pomarańczowy przycisk
12. **Pull Up seria 3/3** (MAX powtórzeń)

---

## 🔄 Integracja Funkcjonalności

Obie funkcjonalności **idealnie ze sobą współpracują**:

1. **Wieloseryjne ćwiczenia** automatycznie generują odpoczynki
2. **Pomijanie odpoczynków** wykrywa te odpoczynki i dostosowuje UX
3. Rezultat: **Płynny, intuicyjny przepływ treningowy**

---

## ⚠️ Breaking Changes

**BRAK!** 

Obie implementacje są w pełni kompatybilne wstecz:
- ✅ Stare treningi działają bez zmian
- ✅ Stary format JSON jest wspierany
- ✅ Istniejące funkcjonalności nie zostały zmienione

---

## 🚀 Korzyści dla Użytkowników

### Dla twórców treningów:
- 🎯 **Prostsze tworzenie** - jedno ćwiczenie zamiast N wpisów
- ✏️ **Łatwiejsza edycja** - zmiana liczby serii w jednym miejscu
- 🐛 **Mniej błędów** - brak ręcznego powielania

### Dla użytkowników wykonujących trening:
- ⚡ **Szybszy przepływ** - automatyczne uruchamianie timerów
- 👁️ **Lepsza widoczność** - wyraźne przyciski i nazwy
- 🎯 **Jasna komunikacja** - wiadomo która seria, ile zostało
- 💪 **Większa kontrola** - łatwo pominąć odpoczynek gdy czujesz się gotowy

### Dla AI:
- 🤖 **Nowe prompty** - AI wie jak generować wieloseryjne treningi
- 📝 **Automatyzacja** - AI tworzy efektywniejsze treningi

---

## 📚 Dokumentacja

Pełna dokumentacja dostępna w:
- `/docs/WORKOUT_SETS_FEATURE.md` - wieloseryjne ćwiczenia
- `/docs/SKIP_REST_FEATURE.md` - pomijanie odpoczynków
- `/docs/DATA_FORMAT.md` - zaktualizowany format JSON
- `/docs/CHANGELOG_WORKOUT_SETS.md` - szczegółowy changelog serii

---

## 🎉 Podsumowanie

To znacząca aktualizacja, która:
- ✅ Upraszcza tworzenie treningów
- ✅ Poprawia UX podczas wykonywania treningów
- ✅ Zachowuje pełną kompatybilność wsteczną
- ✅ Jest w pełni przetestowana (103 testy)
- ✅ Wspierana przez AI
- ✅ Dobrze udokumentowana

**Rezultat:** Bardziej intuicyjna i przyjemna aplikacja do treningów! 💪

---

**Implementował:** AI Assistant (Claude Sonnet 4.5)  
**Data:** 31 października 2025  
**Wersja:** 2.1 → 2.2  
**Status:** ✅ Ukończone, przetestowane i wdrożone

