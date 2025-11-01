-- ============================================
-- MIGRATION: Add is_public field
-- Data: 2025-11-01
-- Opis: Dodaje pole is_public do quizzes, workouts, listening_sets
--       Umożliwia adminom tworzenie treści publicznych widocznych dla wszystkich
-- ============================================

-- Dodaj pole is_public do quizzes
ALTER TABLE quizzes 
ADD COLUMN is_public BOOLEAN DEFAULT FALSE;

-- Dodaj pole is_public do workouts
ALTER TABLE workouts 
ADD COLUMN is_public BOOLEAN DEFAULT FALSE;

-- Dodaj pole is_public do listening_sets
ALTER TABLE listening_sets 
ADD COLUMN is_public BOOLEAN DEFAULT FALSE;

-- Dodaj indeksy dla wydajności
CREATE INDEX idx_quizzes_is_public ON quizzes(is_public);
CREATE INDEX idx_workouts_is_public ON workouts(is_public);
CREATE INDEX idx_listening_sets_is_public ON listening_sets(is_public);

-- ============================================
-- ZAKTUALIZOWANE RLS POLICIES
-- ============================================

-- ============================================
-- QUIZZES POLICIES
-- ============================================

-- Usuń starą politykę read
DROP POLICY IF EXISTS "Public read access to sample quizzes" ON quizzes;

-- Nowa polityka: dostęp do sample LUB publicznych LUB własnych
CREATE POLICY "Public read access to quizzes"
    ON quizzes FOR SELECT
    USING (is_sample = TRUE OR is_public = TRUE OR user_id = auth.uid());

-- Usuń starą politykę delete
DROP POLICY IF EXISTS "Users can delete their own quizzes" ON quizzes;

-- Nowa polityka delete: właściciel może usunąć (nawet publiczne), sample chronione
-- ORAZ admini mogą usuwać publiczne treści
CREATE POLICY "Users and admins can delete quizzes"
    ON quizzes FOR DELETE
    USING (
        is_sample = FALSE AND (
            user_id = auth.uid() OR 
            (is_public = TRUE AND public.is_admin(auth.uid()))
        )
    );

-- ============================================
-- WORKOUTS POLICIES
-- ============================================

-- Usuń starą politykę read
DROP POLICY IF EXISTS "Public read access to sample workouts" ON workouts;

-- Nowa polityka: dostęp do sample LUB publicznych LUB własnych
CREATE POLICY "Public read access to workouts"
    ON workouts FOR SELECT
    USING (is_sample = TRUE OR is_public = TRUE OR user_id = auth.uid());

-- Usuń starą politykę delete
DROP POLICY IF EXISTS "Users can delete their own workouts" ON workouts;

-- Nowa polityka delete: właściciel może usunąć (nawet publiczne), sample chronione
-- ORAZ admini mogą usuwać publiczne treści
CREATE POLICY "Users and admins can delete workouts"
    ON workouts FOR DELETE
    USING (
        is_sample = FALSE AND (
            user_id = auth.uid() OR 
            (is_public = TRUE AND public.is_admin(auth.uid()))
        )
    );

-- ============================================
-- LISTENING SETS POLICIES
-- ============================================

-- Usuń starą politykę read (jeśli istnieje)
DROP POLICY IF EXISTS "Public read access to sample listening sets" ON listening_sets;
DROP POLICY IF EXISTS "Public read access to listening sets" ON listening_sets;

-- Nowa polityka: dostęp do sample LUB publicznych LUB własnych
CREATE POLICY "Public read access to listening sets"
    ON listening_sets FOR SELECT
    USING (is_sample = TRUE OR is_public = TRUE OR user_id = auth.uid());

-- Usuń starą politykę delete (jeśli istnieje)
DROP POLICY IF EXISTS "Users can delete their own listening sets" ON listening_sets;

-- Nowa polityka delete: właściciel może usunąć (nawet publiczne), sample chronione
-- ORAZ admini mogą usuwać publiczne treści
CREATE POLICY "Users and admins can delete listening sets"
    ON listening_sets FOR DELETE
    USING (
        is_sample = FALSE AND (
            user_id = auth.uid() OR 
            (is_public = TRUE AND public.is_admin(auth.uid()))
        )
    );

-- ============================================
-- UPDATE POLICIES (zmiana is_public)
-- ============================================

-- Quizzes: właściciel może zmieniać is_public (jeśli jest adminem)
-- Lub admin może zmieniać is_public dla publicznych treści
CREATE POLICY "Admins can update quiz public status"
    ON quizzes FOR UPDATE
    USING (
        is_sample = FALSE AND 
        public.is_admin(auth.uid()) AND
        (user_id = auth.uid() OR is_public = TRUE)
    );

-- Workouts: właściciel może zmieniać is_public (jeśli jest adminem)
-- Lub admin może zmieniać is_public dla publicznych treści
CREATE POLICY "Admins can update workout public status"
    ON workouts FOR UPDATE
    USING (
        is_sample = FALSE AND 
        public.is_admin(auth.uid()) AND
        (user_id = auth.uid() OR is_public = TRUE)
    );

-- Listening Sets: właściciel może zmieniać is_public (jeśli jest adminem)
-- Lub admin może zmieniać is_public dla publicznych treści
CREATE POLICY "Admins can update listening set public status"
    ON listening_sets FOR UPDATE
    USING (
        is_sample = FALSE AND 
        public.is_admin(auth.uid()) AND
        (user_id = auth.uid() OR is_public = TRUE)
    );

-- ============================================
-- KOMENTARZE
-- ============================================

COMMENT ON COLUMN quizzes.is_public IS 'Czy quiz jest publiczny (widoczny dla wszystkich). Tylko admini mogą tworzyć publiczne treści.';
COMMENT ON COLUMN workouts.is_public IS 'Czy trening jest publiczny (widoczny dla wszystkich). Tylko admini mogą tworzyć publiczne treści.';
COMMENT ON COLUMN listening_sets.is_public IS 'Czy zestaw listening jest publiczny (widoczny dla wszystkich). Tylko admini mogą tworzyć publiczne treści.';

-- ============================================
-- KONIEC MIGRACJI
-- ============================================

-- Sprawdź czy funkcja is_admin istnieje
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'is_admin' 
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) THEN
        RAISE NOTICE 'UWAGA: Funkcja is_admin() nie istnieje! Uruchom najpierw: supabase/functions_user_role.sql';
    END IF;
END $$;

