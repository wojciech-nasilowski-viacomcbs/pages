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

-- Krok 4: Wyświetl podsumowanie
DO $$
DECLARE
    total_workouts INTEGER;
    workouts_with_emoji INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_workouts FROM workouts;
    SELECT COUNT(*) INTO workouts_with_emoji FROM workouts WHERE emoji IS NOT NULL;
    
    RAISE NOTICE '============================================';
    RAISE NOTICE 'PODSUMOWANIE MIGRACJI:';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Łączna liczba treningów: %', total_workouts;
    RAISE NOTICE 'Treningi z emotikoną: %', workouts_with_emoji;
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
-- 3. Nowe treningi generowane przez AI będą miały emotikony dopasowane do tematu
-- 4. Możesz ręcznie edytować emotikony w bazie danych jeśli chcesz
-- ============================================

