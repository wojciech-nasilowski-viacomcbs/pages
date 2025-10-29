-- ============================================
-- MIGRACJA: Dodanie numeracji do treningów
-- ============================================
-- Data: 2025-10-29
-- Opis: Dodaje numery do tytułów wszystkich treningów (np. "#1 - Nazwa treningu")
-- Instrukcja: Skopiuj całą zawartość tego pliku i wklej do Supabase SQL Editor, następnie uruchom
-- UWAGA: Ta migracja jest bezpieczna - można uruchomić wielokrotnie (pomija treningi które już mają numery)
-- ============================================

-- Dodaj numery do istniejących treningów (które nie mają numeru w tytule)
-- Numeracja osobno dla każdego użytkownika, od najstarszego do najnowszego
DO $$
DECLARE
    workout_record RECORD;
    user_counter INTEGER;
    current_user_id UUID;
    updated_count INTEGER := 0;
BEGIN
    -- Dla każdego użytkownika
    FOR current_user_id IN 
        SELECT DISTINCT user_id FROM workouts WHERE user_id IS NOT NULL
    LOOP
        user_counter := 1;
        
        RAISE NOTICE 'Przetwarzanie treningów użytkownika: %', current_user_id;
        
        -- Dla każdego treningu użytkownika (sortowane od najstarszego)
        FOR workout_record IN 
            SELECT id, title, created_at
            FROM workouts 
            WHERE user_id = current_user_id
            AND title NOT LIKE '#%'  -- Tylko treningi bez numeru
            ORDER BY created_at ASC
        LOOP
            -- Dodaj numer do tytułu
            UPDATE workouts
            SET title = '#' || user_counter || ' - ' || workout_record.title
            WHERE id = workout_record.id;
            
            RAISE NOTICE '  Zaktualizowano: #% - % (utworzony: %)', 
                user_counter, workout_record.title, workout_record.created_at;
            
            user_counter := user_counter + 1;
            updated_count := updated_count + 1;
        END LOOP;
        
        IF user_counter > 1 THEN
            RAISE NOTICE '  Łącznie zaktualizowano % treningów dla tego użytkownika', user_counter - 1;
        END IF;
    END LOOP;
    
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Dodano numery do % treningów', updated_count;
    RAISE NOTICE '============================================';
END $$;

-- Wyświetl podsumowanie
DO $$
DECLARE
    total_workouts INTEGER;
    workouts_with_numbers INTEGER;
    workouts_without_numbers INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_workouts FROM workouts;
    SELECT COUNT(*) INTO workouts_with_numbers FROM workouts WHERE title LIKE '#%';
    SELECT COUNT(*) INTO workouts_without_numbers FROM workouts WHERE title NOT LIKE '#%';
    
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'PODSUMOWANIE MIGRACJI:';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Łączna liczba treningów: %', total_workouts;
    RAISE NOTICE 'Treningi z numeracją: %', workouts_with_numbers;
    RAISE NOTICE 'Treningi bez numeracji: %', workouts_without_numbers;
    RAISE NOTICE '============================================';
    
    IF workouts_without_numbers = 0 THEN
        RAISE NOTICE 'Migracja zakończona pomyślnie! ✅';
        RAISE NOTICE 'Wszystkie treningi mają numery!';
    ELSE
        RAISE NOTICE 'UWAGA: % treningów nadal nie ma numerów', workouts_without_numbers;
        RAISE NOTICE 'Mogą to być treningi przykładowe (is_sample = true)';
    END IF;
    
    RAISE NOTICE '============================================';
END $$;

-- Wyświetl przykładowe treningi z numerami
DO $$
DECLARE
    workout_sample RECORD;
    counter INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'PRZYKŁADOWE TRENINGI (pierwsze 5):';
    RAISE NOTICE '============================================';
    
    FOR workout_sample IN 
        SELECT title, emoji, created_at
        FROM workouts 
        WHERE title LIKE '#%'
        ORDER BY created_at ASC
        LIMIT 5
    LOOP
        counter := counter + 1;
        RAISE NOTICE '% | % %', counter, workout_sample.emoji, workout_sample.title;
    END LOOP;
    
    IF counter = 0 THEN
        RAISE NOTICE 'Brak treningów z numeracją';
    END IF;
    
    RAISE NOTICE '============================================';
END $$;

-- ============================================
-- KONIEC MIGRACJI
-- ============================================
-- Po uruchomieniu tej migracji:
-- 1. Wszystkie treningi otrzymają numery w tytule (np. "#1 - Nazwa treningu")
-- 2. Numeracja jest osobna dla każdego użytkownika
-- 3. Numery są przypisane na stałe i nie zmienią się
-- 4. Nowe treningi automatycznie otrzymają kolejny numer (logika w data-service.js)
-- 5. Treningi są numerowane od najstarszego do najnowszego (według created_at)
-- ============================================

