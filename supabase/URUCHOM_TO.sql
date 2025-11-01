-- ============================================
-- KOMPLETNA MIGRACJA - URUCHOM CAŁY TEN PLIK
-- ============================================
-- Instrukcja:
-- 1. Otwórz https://supabase.com/dashboard
-- 2. Wybierz projekt
-- 3. Kliknij "SQL Editor" w lewym menu
-- 4. Kliknij "+ New query"
-- 5. Skopiuj CAŁY ten plik i wklej
-- 6. Kliknij "Run" (lub Ctrl+Enter)
-- ============================================

-- ============================================
-- CZĘŚĆ 1: FUNKCJE (is_admin, is_user_admin, get_user_role)
-- ============================================

-- Funkcja dla RLS policies
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_status BOOLEAN;
BEGIN
  SELECT is_super_admin INTO admin_status
  FROM auth.users
  WHERE id = user_id;
  
  RETURN COALESCE(admin_status, FALSE);
END;
$$;

GRANT EXECUTE ON FUNCTION is_admin(UUID) TO public;
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO anon;

-- Funkcja dla aplikacji (auth-service.js)
CREATE OR REPLACE FUNCTION is_user_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_status BOOLEAN;
BEGIN
  SELECT is_super_admin INTO admin_status
  FROM auth.users
  WHERE id = user_id;
  
  RETURN COALESCE(admin_status, FALSE);
END;
$$;

GRANT EXECUTE ON FUNCTION is_user_admin(UUID) TO public;
GRANT EXECUTE ON FUNCTION is_user_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_user_admin(UUID) TO anon;

CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_status BOOLEAN;
BEGIN
  SELECT is_super_admin INTO admin_status
  FROM auth.users
  WHERE id = user_id;
  
  IF admin_status = TRUE THEN
    RETURN 'admin';
  ELSE
    RETURN 'user';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO public;
GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO anon;

-- ============================================
-- CZĘŚĆ 2: DODAJ KOLUMNĘ is_public
-- ============================================

-- Dodaj is_public jeśli nie istnieje
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quizzes' AND column_name = 'is_public') THEN
        ALTER TABLE quizzes ADD COLUMN is_public BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workouts' AND column_name = 'is_public') THEN
        ALTER TABLE workouts ADD COLUMN is_public BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listening_sets' AND column_name = 'is_public') THEN
        ALTER TABLE listening_sets ADD COLUMN is_public BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Dodaj indeksy
CREATE INDEX IF NOT EXISTS idx_quizzes_is_public ON quizzes(is_public);
CREATE INDEX IF NOT EXISTS idx_workouts_is_public ON workouts(is_public);
CREATE INDEX IF NOT EXISTS idx_listening_sets_is_public ON listening_sets(is_public);

-- ============================================
-- CZĘŚĆ 3: ZAKTUALIZUJ RLS POLICIES
-- ============================================

-- QUIZZES
DROP POLICY IF EXISTS "Public read access to sample quizzes" ON quizzes;
DROP POLICY IF EXISTS "Public read access to quizzes" ON quizzes;
DROP POLICY IF EXISTS "Users can delete their own quizzes" ON quizzes;
DROP POLICY IF EXISTS "Users and admins can delete quizzes" ON quizzes;
DROP POLICY IF EXISTS "Admins can update quiz public status" ON quizzes;

CREATE POLICY "Public read access to quizzes"
    ON quizzes FOR SELECT
    USING (is_sample = TRUE OR is_public = TRUE OR user_id = auth.uid());

CREATE POLICY "Users and admins can delete quizzes"
    ON quizzes FOR DELETE
    USING (
        is_sample = FALSE AND (
            user_id = auth.uid() OR 
            (is_public = TRUE AND public.is_admin(auth.uid()))
        )
    );

CREATE POLICY "Admins can update quiz public status"
    ON quizzes FOR UPDATE
    USING (
        is_sample = FALSE AND 
        public.is_admin(auth.uid()) AND
        (user_id = auth.uid() OR is_public = TRUE)
    );

-- WORKOUTS
DROP POLICY IF EXISTS "Public read access to sample workouts" ON workouts;
DROP POLICY IF EXISTS "Public read access to workouts" ON workouts;
DROP POLICY IF EXISTS "Users can delete their own workouts" ON workouts;
DROP POLICY IF EXISTS "Users and admins can delete workouts" ON workouts;
DROP POLICY IF EXISTS "Admins can update workout public status" ON workouts;

CREATE POLICY "Public read access to workouts"
    ON workouts FOR SELECT
    USING (is_sample = TRUE OR is_public = TRUE OR user_id = auth.uid());

CREATE POLICY "Users and admins can delete workouts"
    ON workouts FOR DELETE
    USING (
        is_sample = FALSE AND (
            user_id = auth.uid() OR 
            (is_public = TRUE AND public.is_admin(auth.uid()))
        )
    );

CREATE POLICY "Admins can update workout public status"
    ON workouts FOR UPDATE
    USING (
        is_sample = FALSE AND 
        public.is_admin(auth.uid()) AND
        (user_id = auth.uid() OR is_public = TRUE)
    );

-- LISTENING SETS
DROP POLICY IF EXISTS "Public read access to sample listening sets" ON listening_sets;
DROP POLICY IF EXISTS "Public read access to listening sets" ON listening_sets;
DROP POLICY IF EXISTS "Users can delete their own listening sets" ON listening_sets;
DROP POLICY IF EXISTS "Users and admins can delete listening sets" ON listening_sets;
DROP POLICY IF EXISTS "Admins can update listening set public status" ON listening_sets;

CREATE POLICY "Public read access to listening sets"
    ON listening_sets FOR SELECT
    USING (is_sample = TRUE OR is_public = TRUE OR user_id = auth.uid());

CREATE POLICY "Users and admins can delete listening sets"
    ON listening_sets FOR DELETE
    USING (
        is_sample = FALSE AND (
            user_id = auth.uid() OR 
            (is_public = TRUE AND public.is_admin(auth.uid()))
        )
    );

CREATE POLICY "Admins can update listening set public status"
    ON listening_sets FOR UPDATE
    USING (
        is_sample = FALSE AND 
        public.is_admin(auth.uid()) AND
        (user_id = auth.uid() OR is_public = TRUE)
    );

-- ============================================
-- CZĘŚĆ 4: SPRAWDŹ CZY JESTEŚ ADMINEM
-- ============================================

-- Pokaż wszystkich użytkowników i ich status admina
SELECT 
    id,
    email,
    is_super_admin,
    CASE 
        WHEN is_super_admin = TRUE THEN '✅ ADMIN'
        ELSE '❌ USER'
    END as status
FROM auth.users
ORDER BY created_at DESC;

-- ============================================
-- GOTOWE! 🎉
-- ============================================
-- Jeśli widzisz tabelkę z użytkownikami powyżej:
-- - Sprawdź czy Twój email ma "✅ ADMIN"
-- - Jeśli NIE, uruchom: supabase/add_admin_role.sql
-- - Potem odśwież aplikację i checkbox powinien być widoczny!
-- ============================================

