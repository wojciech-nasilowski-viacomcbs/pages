# Supabase Database Setup

## 📋 Instrukcje Konfiguracji Bazy Danych

### Krok 1: Otwórz SQL Editor w Supabase

1. Przejdź do swojego projektu na [Supabase Dashboard](https://supabase.com/dashboard/project/gygijehqwtnmnoopwqyg)
2. W lewym menu kliknij **SQL Editor**
3. Kliknij **New query** (lub użyj istniejącego edytora)

### Krok 2: Uruchom Schemat Bazy Danych

1. Otwórz plik `schema.sql` w edytorze
2. Skopiuj **całą zawartość** pliku
3. Wklej do SQL Editor w Supabase
4. Kliknij **Run** (lub naciśnij `Ctrl+Enter` / `Cmd+Enter`)

**Oczekiwany rezultat:**
- ✅ Utworzone tabele: `quizzes`, `questions`, `workouts`, `phases`, `exercises`
- ✅ Utworzone indeksy dla wydajności
- ✅ Włączone Row Level Security (RLS)
- ✅ Utworzone polityki bezpieczeństwa

### Krok 3: Dodaj Przykładowe Dane

1. Otwórz plik `insert_samples.sql` w edytorze
2. Skopiuj **całą zawartość** pliku
3. Wklej do SQL Editor w Supabase (w nowym query lub wyczyść poprzednie)
4. Kliknij **Run**

**Oczekiwany rezultat:**
- ✅ 1 przykładowy quiz: "General Knowledge Quiz" (10 pytań)
- ✅ 1 przykładowy trening: "Basic Fitness Routine" (3 fazy)

### Krok 4: Weryfikacja

Sprawdź, czy dane zostały poprawnie dodane:

```sql
-- Sprawdź quizy
SELECT id, title, is_sample FROM quizzes;

-- Sprawdź treningi
SELECT id, title, is_sample FROM workouts;

-- Sprawdź pytania
SELECT quiz_id, "order", data->>'type' as question_type 
FROM questions 
ORDER BY "order";

-- Sprawdź fazy treningów
SELECT workout_id, "order", name 
FROM phases 
ORDER BY "order";
```

Powinieneś zobaczyć:
- 1 quiz z `is_sample = true`
- 10 pytań dla tego quizu
- 1 trening z `is_sample = true`
- 3 fazy dla tego treningu

---

## 🔐 Bezpieczeństwo

### Row Level Security (RLS)

Wszystkie tabele mają włączone RLS z następującymi zasadami:

**Dla niezalogowanych użytkowników:**
- ✅ Mogą czytać sample content (`is_sample = true`)
- ❌ Nie mogą tworzyć, edytować ani usuwać niczego

**Dla zalogowanych użytkowników:**
- ✅ Mogą czytać sample content + własne treści
- ✅ Mogą tworzyć własne quizy/treningi
- ✅ Mogą edytować/usuwać tylko własne treści
- ❌ Nie mogą edytować/usuwać sample content

---

## 📊 Struktura Bazy Danych

### Quizzes
```
quizzes (id, user_id, title, description, is_sample, created_at)
  └── questions (id, quiz_id, order, data)
```

### Workouts
```
workouts (id, user_id, title, description, is_sample, created_at)
  └── phases (id, workout_id, order, name)
      └── exercises (id, phase_id, order, data)
```

---

## 🧪 Testowanie RLS

Możesz przetestować polityki bezpieczeństwa:

```sql
-- Test 1: Czy sample content jest widoczny bez logowania?
-- (Uruchom w SQL Editor bez uwierzytelnienia)
SELECT * FROM quizzes WHERE is_sample = true;

-- Test 2: Spróbuj usunąć sample content (powinno się nie udać)
DELETE FROM quizzes WHERE is_sample = true;
-- Oczekiwany błąd: "new row violates row-level security policy"
```

---

## ✅ Gotowe!

Po wykonaniu tych kroków Twoja baza danych jest gotowa do użycia z aplikacją v2.0.

**Następny krok:** Integracja Supabase z frontendem (ETAP 2)

