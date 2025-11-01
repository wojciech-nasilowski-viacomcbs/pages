-- ============================================
-- FUNKCJE RPC DLA SPRAWDZANIA ROLI UŻYTKOWNIKA
-- ============================================

-- Funkcja 1: Sprawdź czy użytkownik jest adminem (po ID)
-- Używana przez aplikację do sprawdzania uprawnień
CREATE OR REPLACE FUNCTION is_user_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_status BOOLEAN;
BEGIN
  -- Pobierz is_super_admin z auth.users
  SELECT is_super_admin INTO admin_status
  FROM auth.users
  WHERE id = user_id;
  
  -- Zwróć FALSE jeśli użytkownik nie istnieje lub nie jest adminem
  RETURN COALESCE(admin_status, FALSE);
END;
$$;

-- Nadaj uprawnienia do wykonania funkcji
GRANT EXECUTE ON FUNCTION is_user_admin(UUID) TO public;
GRANT EXECUTE ON FUNCTION is_user_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_user_admin(UUID) TO anon;

-- ============================================
-- FUNKCJA 2: Sprawdź czy użytkownik jest adminem (po email)
-- Używana do debugowania i administracji
-- ============================================

CREATE OR REPLACE FUNCTION is_user_admin_by_email(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_status BOOLEAN;
BEGIN
  SELECT is_super_admin INTO admin_status
  FROM auth.users
  WHERE email = user_email;
  
  RETURN COALESCE(admin_status, FALSE);
END;
$$;

-- Nadaj uprawnienia
GRANT EXECUTE ON FUNCTION is_user_admin_by_email(TEXT) TO public;
GRANT EXECUTE ON FUNCTION is_user_admin_by_email(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION is_user_admin_by_email(TEXT) TO anon;

-- ============================================
-- FUNKCJA 3: Pobierz rolę użytkownika (po ID)
-- Zwraca 'admin' lub 'user'
-- ============================================

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

-- Nadaj uprawnienia
GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO public;
GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO anon;

-- ============================================
-- FUNKCJA 4: Sprawdź czy użytkownik jest adminem (dla RLS)
-- Używana w Row Level Security policies
-- ============================================

CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_status BOOLEAN;
BEGIN
  -- Pobierz is_super_admin z auth.users
  SELECT is_super_admin INTO admin_status
  FROM auth.users
  WHERE id = user_id;
  
  -- Zwróć FALSE jeśli użytkownik nie istnieje lub nie jest adminem
  RETURN COALESCE(admin_status, FALSE);
END;
$$;

-- Nadaj uprawnienia
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO public;
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO anon;

-- ============================================
-- TESTY
-- ============================================

-- Test 1: Sprawdź czy funkcje działają
-- SELECT is_user_admin('your-user-id-here');
-- SELECT is_user_admin_by_email('your-email@example.com');
-- SELECT get_user_role('your-user-id-here');

-- Test 2: Sprawdź dla aktualnie zalogowanego użytkownika
-- SELECT is_user_admin(auth.uid());
-- SELECT get_user_role(auth.uid());

-- ============================================
-- UWAGI
-- ============================================

-- 1. Te funkcje muszą być wykonane jako admin w panelu Supabase (SQL Editor)
-- 
-- 2. SECURITY DEFINER oznacza, że funkcja uruchamia się z uprawnieniami
--    właściciela (admin), więc może czytać z auth.users
--
-- 3. Funkcje są dostępne dla wszystkich (public, authenticated, anon)
--    ponieważ sprawdzają tylko status admina, nie zmieniają danych
--
-- 4. Po dodaniu tych funkcji, aplikacja będzie mogła sprawdzać
--    uprawnienia admina bez konieczności posiadania is_super_admin w JWT
--
-- 5. Jeśli zmienisz is_super_admin w bazie, zmiany będą widoczne
--    natychmiast (nie trzeba wylogowywać użytkownika)
--


