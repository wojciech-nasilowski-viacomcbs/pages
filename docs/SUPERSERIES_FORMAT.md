# Format Superserii w Treningach

## Problem

Obecny format JSON **nie obsługuje automatycznego rozwijania superserii**. Pole `sets` rozwija każde ćwiczenie **osobno**, co nie jest tym samym co superseria.

## ❌ Nieprawidłowe podejście (nie działa dla superserii)

```json
{
  "name": "Trening Główny (Superserie)",
  "exercises": [
    {
      "name": "A1: Goblet Squat",
      "reps": "12",
      "sets": 3,
      "type": "reps",
      "restBetweenSets": 15
    },
    {
      "name": "A2: Pompki",
      "reps": "MAX",
      "sets": 3,
      "type": "reps",
      "restBetweenSets": 75
    }
  ]
}
```

### Co się stanie?

System rozwinie to na:
1. Goblet Squat seria 1/3
2. Odpoczynek 15s
3. Goblet Squat seria 2/3
4. Odpoczynek 15s
5. Goblet Squat seria 3/3
6. **Pompki seria 1/3** ← Zaczyna od 1/3, ale po wszystkich seriach Squatów!
7. Odpoczynek 75s
8. Pompki seria 2/3
9. Odpoczynek 75s
10. Pompki seria 3/3

**To NIE jest superseria!** Robisz wszystkie serie jednego ćwiczenia, a potem wszystkie serie drugiego.

## ✅ Prawidłowe podejście (ręczne rozpisanie)

Dla superserii musisz **ręcznie rozpisać każdą rundę** jako osobną fazę:

```json
{
  "phases": [
    {
      "name": "Trening Główny - Superseria A (Runda 1/3)",
      "exercises": [
        {
          "name": "A1: Goblet Squat",
          "type": "reps",
          "reps": "12",
          "description": "Opis ćwiczenia...",
          "mediaUrl": ""
        },
        {
          "name": "Odpoczynek",
          "type": "time",
          "duration": 15,
          "description": "Krótka przerwa przed A2.",
          "details": "",
          "mediaUrl": ""
        },
        {
          "name": "A2: Pompki",
          "type": "reps",
          "reps": "MAX",
          "description": "Opis ćwiczenia...",
          "mediaUrl": ""
        },
        {
          "name": "Odpoczynek",
          "type": "time",
          "duration": 75,
          "description": "Dłuższa przerwa po superserii.",
          "details": "",
          "mediaUrl": ""
        }
      ]
    },
    {
      "name": "Trening Główny - Superseria A (Runda 2/3)",
      "exercises": [
        // Powtórz te same ćwiczenia
      ]
    },
    {
      "name": "Trening Główny - Superseria A (Runda 3/3)",
      "exercises": [
        // Powtórz te same ćwiczenia
      ]
    }
  ]
}
```

### Co się stanie?

1. **Runda 1/3:**
   - A1: Goblet Squat → 15s → A2: Pompki → 75s
2. **Runda 2/3:**
   - A1: Goblet Squat → 15s → A2: Pompki → 75s
3. **Runda 3/3:**
   - A1: Goblet Squat → 15s → A2: Pompki → 75s

**To jest prawidłowa superseria!** ✅

## Kiedy używać `sets`?

Pole `sets` jest przydatne **tylko dla pojedynczych ćwiczeń** (nie superserii):

```json
{
  "name": "Deska (plank)",
  "type": "time",
  "duration": 45,
  "sets": 3,
  "restBetweenSets": 30,
  "description": "Utrzymuj proste plecy."
}
```

System rozwinie to na:
1. Deska seria 1/3 (45s)
2. Odpoczynek (30s)
3. Deska seria 2/3 (45s)
4. Odpoczynek (30s)
5. Deska seria 3/3 (45s)

To działa dobrze dla **pojedynczego ćwiczenia**, ale **nie dla superserii**.

## Podsumowanie

| Typ treningu | Użyj `sets`? | Jak zapisać? |
|--------------|--------------|--------------|
| Pojedyncze ćwiczenie z seriami | ✅ TAK | Użyj `sets` + `restBetweenSets` |
| Superseria (A1+A2) | ❌ NIE | Ręcznie rozpisz każdą rundę jako osobną fazę |
| Obwód (A→B→C→D) | ❌ NIE | Ręcznie rozpisz każdą rundę jako osobną fazę |

## Przykład: Pełny trening z superseriami

Zobacz plik: `/data/workouts/trening-7a-short.json` - zawiera prawidłowo rozpisane superserie.

## Przyszłość

W przyszłości możemy dodać wsparcie dla superserii w formacie JSON, np.:

```json
{
  "type": "superset",
  "rounds": 3,
  "restBetweenExercises": 15,
  "restBetweenRounds": 75,
  "exercises": [
    { "name": "A1: Goblet Squat", ... },
    { "name": "A2: Pompki", ... }
  ]
}
```

Ale na razie musisz rozpisywać ręcznie. 📝

---

**Data:** 2025-11-09

