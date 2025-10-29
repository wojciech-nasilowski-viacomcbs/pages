# Aktualizacja Formatu: Emotikony dla Treningów

## 🎯 Zmiany w Formacie Treningów

### Nowe Pole: `emoji`

Dodano opcjonalne pole `emoji` do struktury treningów.

```json
{
  "title": "#1 - Trening HIIT",
  "description": "20-minutowy intensywny trening",
  "emoji": "⚡",  // NOWE POLE
  "phases": [...]
}
```

### Specyfikacja

| Pole | Typ | Wymagane | Domyślna wartość | Opis |
|------|-----|----------|------------------|------|
| `emoji` | string | ❌ Opcjonalne | `"💪"` | Emotikona reprezentująca typ treningu |

### Dostępne Emotikony

- 💪 - Trening siłowy, FBW, ogólny trening (domyślna)
- 🏃 - Cardio, bieganie, wytrzymałość
- 🥊 - Boks, sporty walki
- 🧘 - Joga, stretching, relaks
- 🏋️ - Trening na siłowni, ciężary
- 🤸 - Akrobatyka, gimnastyka
- 🚴 - Rower, spinning
- 🏊 - Pływanie
- ⚡ - HIIT, intensywny trening
- 🎯 - Trening celowany (np. brzuch, nogi)
- 🔥 - Fat burning, spalanie tłuszczu
- 🦵 - Trening nóg
- 💯 - Challenge, wyzwanie

## 🔢 Automatyczna Numeracja

Treningi generowane przez AI otrzymują automatyczną numerację w tytule:

```json
{
  "title": "#1 - Mój pierwszy trening",
  "title": "#2 - Trening cardio",
  "title": "#3 - Trening siłowy"
}
```

Numeracja jest oparta na liczbie istniejących treningów użytkownika i sortowana według daty utworzenia (od najstarszego).

## 📝 Przykłady

### Przykład 1: Trening z emotikoną

```json
{
  "title": "#5 - Intensywny Trening HIIT",
  "description": "20-minutowy trening spalający tłuszcz",
  "emoji": "⚡",
  "phases": [
    {
      "name": "Rozgrzewka",
      "exercises": [...]
    }
  ]
}
```

### Przykład 2: Stary trening (bez emoji)

**Przed migracją:**
```json
{
  "title": "Codzienny",
  "description": "Trening FBW",
  "phases": [...]
}
```

**Po migracji (automatycznie):**
```json
{
  "title": "Codzienny",
  "description": "Trening FBW",
  "emoji": "💪",  // Dodane automatycznie
  "phases": [...]
}
```

## ✅ Kompatybilność Wsteczna

### Import JSON
- Stare pliki JSON bez pola `emoji` są w pełni kompatybilne
- System automatycznie dodaje `emoji: "💪"` podczas walidacji

### Export JSON
- Eksportowane treningi zawsze zawierają pole `emoji`
- Jeśli trening nie ma emoji w bazie, eksport używa domyślnej 💪

### Baza Danych
- Kolumna `emoji` w tabeli `workouts` ma domyślną wartość `'💪'`
- Istniejące treningi otrzymują domyślną emotikonę podczas migracji

## 🔧 Implementacja

### 1. AI Generator
- Automatycznie dobiera emotikonę na podstawie tematu treningu
- Dodaje numerację do tytułu

### 2. Walidacja JSON
```javascript
// W content-manager.js
validateWorkoutJSON(data) {
  // ...
  // Emoji jest opcjonalne - jeśli brak, użyj domyślnej 💪
  if (!data.emoji) {
    data.emoji = '💪';
  }
  // ...
}
```

### 3. Zapis do Bazy
```javascript
// W data-service.js
async saveWorkout(workoutData) {
  // ...
  .insert({
    user_id: user.id,
    title: workoutData.title,
    description: workoutData.description || '',
    emoji: workoutData.emoji || '💪', // Dodaj emoji
    is_sample: false
  })
  // ...
}
```

### 4. Export JSON
```javascript
// W content-manager.js
async exportContent(id, state, elements) {
  // ...
  if (state.currentTab === 'workouts') {
    // Dla treningów: dodaj emoji (lub domyślną 💪 jeśli brak)
    cleanData.emoji = data.emoji || '💪';
    cleanData.phases = data.phases;
  }
  // ...
}
```

## 📋 Checklist Aktualizacji

- [x] Dodano pole `emoji` do promptu AI
- [x] Zaktualizowano walidację JSON
- [x] Zaktualizowano zapis do bazy danych
- [x] Zaktualizowano export JSON
- [x] Zaktualizowano renderowanie w UI
- [x] Dodano migrację SQL
- [x] Zaktualizowano dokumentację DATA_FORMAT.md
- [x] Zaktualizowano przykładowe pliki JSON

## 🗄️ Migracja Bazy Danych

Plik: `supabase/migration_add_emoji.sql`

```sql
-- Dodaj kolumnę emoji (jeśli nie istnieje)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workouts' AND column_name = 'emoji'
    ) THEN
        ALTER TABLE workouts ADD COLUMN emoji TEXT DEFAULT '💪';
    END IF;
END $$;

-- Zaktualizuj istniejące treningi
UPDATE workouts SET emoji = '💪' WHERE emoji IS NULL;
```

---

**Data aktualizacji:** 29 października 2025  
**Wersja:** 2.0

