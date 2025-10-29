-- ============================================
-- MIGRACJA: Dodanie kolumny emoji do tabeli workouts
-- ============================================
-- Data: 2025-10-29
-- Opis: Dodaje pole emoji do treningów, aby każdy trening mógł mieć własną emotikonę
-- Instrukcja: Skopiuj całą zawartość tego pliku i wklej do Supabase SQL Editor, następnie uruchom
-- ============================================

-- Krok 1: Dodaj kolumnę emoji do tabeli workouts (jeśli jeszcze nie istnieje)
-- Ta operacja jest bezpieczna - można uruchomić wielokrotnie
DO $$ 
BEGIN
    -- Sprawdź czy kolumna już istnieje
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
          AND table_name = 'workouts' 
          AND column_name = 'emoji'
    ) THEN
        -- Dodaj kolumnę z domyślną wartością
        ALTER TABLE workouts ADD COLUMN emoji TEXT DEFAULT '💪';
        RAISE NOTICE 'Kolumna emoji została dodana do tabeli workouts';
    ELSE
        RAISE NOTICE 'Kolumna emoji już istnieje w tabeli workouts';
    END IF;
END $$;

-- Krok 2: Zaktualizuj istniejące treningi, które mają NULL w polu emoji
-- Ustaw domyślną emotikonę 💪 dla wszystkich starych treningów
UPDATE workouts
SET emoji = '💪'
WHERE emoji IS NULL;

-- Krok 3: Zaktualizuj istniejące przykładowe treningi z odpowiednimi emotikonami
-- (opcjonalne - dostosuj do swoich danych)
UPDATE workouts
SET emoji = '🥊'
WHERE (title ILIKE '%boks%' OR title ILIKE '%boxing%' OR title ILIKE '%garda%')
  AND emoji = '💪';

UPDATE workouts
SET emoji = '🏃'
WHERE (title ILIKE '%cardio%' OR title ILIKE '%bieg%' OR title ILIKE '%running%')
  AND emoji = '💪';

UPDATE workouts
SET emoji = '🧘'
WHERE (title ILIKE '%joga%' OR title ILIKE '%yoga%' OR title ILIKE '%stretch%' OR title ILIKE '%rozciąg%')
  AND emoji = '💪';

UPDATE workouts
SET emoji = '⚡'
WHERE (title ILIKE '%hiit%' OR title ILIKE '%intensywn%')
  AND emoji = '💪';

UPDATE workouts
SET emoji = '🏋️'
WHERE (title ILIKE '%siłown%' OR title ILIKE '%gym%' OR title ILIKE '%ciężar%')
  AND emoji = '💪';

-- Krok 4: Dodaj numery do istniejących treningów (które nie mają numeru w tytule)
-- Numeracja osobno dla każdego użytkownika, od najstarszego do najnowszego
DO $$
DECLARE
    workout_record RECORD;
    user_counter INTEGER;
    current_user_id UUID;
BEGIN
    -- Dla każdego użytkownika
    FOR current_user_id IN 
        SELECT DISTINCT user_id FROM workouts WHERE user_id IS NOT NULL
    LOOP
        user_counter := 1;
        
        -- Dla każdego treningu użytkownika (sortowane od najstarszego)
        FOR workout_record IN 
            SELECT id, title 
            FROM workouts 
            WHERE user_id = current_user_id
            AND title NOT LIKE '#%'  -- Tylko treningi bez numeru
            ORDER BY created_at ASC
        LOOP
            -- Dodaj numer do tytułu
            UPDATE workouts
            SET title = '#' || user_counter || ' - ' || workout_record.title
            WHERE id = workout_record.id;
            
            user_counter := user_counter + 1;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Dodano numery do treningów użytkowników';
END $$;

-- Krok 5: Wyświetl podsumowanie
DO $$
DECLARE
    total_workouts INTEGER;
    workouts_with_emoji INTEGER;
    workouts_with_numbers INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_workouts FROM workouts;
    SELECT COUNT(*) INTO workouts_with_emoji FROM workouts WHERE emoji IS NOT NULL;
    SELECT COUNT(*) INTO workouts_with_numbers FROM workouts WHERE title LIKE '#%';
    
    RAISE NOTICE '============================================';
    RAISE NOTICE 'PODSUMOWANIE MIGRACJI:';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Łączna liczba treningów: %', total_workouts;
    RAISE NOTICE 'Treningi z emotikoną: %', workouts_with_emoji;
    RAISE NOTICE 'Treningi z numeracją: %', workouts_with_numbers;
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Migracja zakończona pomyślnie! ✅';
    RAISE NOTICE '============================================';
END $$;

-- ============================================
-- KONIEC MIGRACJI
-- ============================================
-- Po uruchomieniu tej migracji:
-- 1. Wszystkie treningi będą miały pole emoji
-- 2. Stare treningi otrzymają domyślną emotikonę 💪
-- 3. Wszystkie treningi otrzymają numery w tytule (np. "#1 - Nazwa treningu")
-- 4. Numeracja jest osobna dla każdego użytkownika
-- 5. Numery są przypisane na stałe i nie zmienią się
-- 6. Nowe treningi automatycznie otrzymają kolejny numer
-- 7. Możesz ręcznie edytować emotikony i tytuły w bazie danych jeśli chcesz
-- ============================================

