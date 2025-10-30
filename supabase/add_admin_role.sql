-- ============================================
-- Dodawanie roli ADMIN do użytkowników
-- ============================================

-- SPOSÓB 1: Nadaj rolę admin dla konkretnego użytkownika (po emailu)
-- Zamień 'admin@example.com' na email użytkownika, któremu chcesz nadać rolę admin
UPDATE auth.users
SET raw_user_meta_data = 
  CASE 
    WHEN raw_user_meta_data IS NULL THEN '{"role": "admin"}'::jsonb
    ELSE raw_user_meta_data || '{"role": "admin"}'::jsonb
  END
WHERE email = 'admin@example.com';

-- SPOSÓB 2: Nadaj rolę admin dla konkretnego użytkownika (po ID)
-- Zamień 'user-uuid-here' na ID użytkownika
UPDATE auth.users
SET raw_user_meta_data = 
  CASE 
    WHEN raw_user_meta_data IS NULL THEN '{"role": "admin"}'::jsonb
    ELSE raw_user_meta_data || '{"role": "admin"}'::jsonb
  END
WHERE id = 'user-uuid-here';

-- ============================================
-- Usuwanie roli ADMIN
-- ============================================

-- Usuń rolę admin (użytkownik stanie się zwykłym userem)
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data - 'role'
WHERE email = 'user@example.com';

-- ============================================
-- Sprawdzanie użytkowników z rolą admin
-- ============================================

-- Wyświetl wszystkich adminów
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as role,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'admin';

-- Wyświetl wszystkich użytkowników z ich rolami
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'role', 'user') as role,
  created_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- ============================================
-- PRZYKŁADY UŻYCIA
-- ============================================

-- Przykład 1: Nadaj rolę admin pierwszemu zarejestrowanemu użytkownikowi
UPDATE auth.users
SET raw_user_meta_data = 
  CASE 
    WHEN raw_user_meta_data IS NULL THEN '{"role": "admin"}'::jsonb
    ELSE raw_user_meta_data || '{"role": "admin"}'::jsonb
  END
WHERE id = (
  SELECT id 
  FROM auth.users 
  ORDER BY created_at ASC 
  LIMIT 1
);

-- Przykład 2: Nadaj rolę admin wielu użytkownikom naraz
UPDATE auth.users
SET raw_user_meta_data = 
  CASE 
    WHEN raw_user_meta_data IS NULL THEN '{"role": "admin"}'::jsonb
    ELSE raw_user_meta_data || '{"role": "admin"}'::jsonb
  END
WHERE email IN (
  'admin1@example.com',
  'admin2@example.com',
  'admin3@example.com'
);

-- Przykład 3: Usuń rolę admin wszystkim użytkownikom (reset)
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data - 'role'
WHERE raw_user_meta_data->>'role' = 'admin';

-- ============================================
-- FUNKCJA POMOCNICZA (Opcjonalnie)
-- ============================================

-- Utwórz funkcję do łatwego nadawania roli admin
CREATE OR REPLACE FUNCTION set_user_role(user_email TEXT, user_role TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = 
    CASE 
      WHEN raw_user_meta_data IS NULL THEN jsonb_build_object('role', user_role)
      ELSE raw_user_meta_data || jsonb_build_object('role', user_role)
    END
  WHERE email = user_email;
END;
$$;

-- Użycie funkcji:
-- SELECT set_user_role('admin@example.com', 'admin');

-- Utwórz funkcję do usuwania roli
CREATE OR REPLACE FUNCTION remove_user_role(user_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data - 'role'
  WHERE email = user_email;
END;
$$;

-- Użycie funkcji:
-- SELECT remove_user_role('user@example.com');

-- ============================================
-- UWAGI
-- ============================================

-- 1. Te zapytania muszą być wykonane jako admin w panelu Supabase
--    (SQL Editor) lub przez narzędzie psql z odpowiednimi uprawnieniami
--
-- 2. raw_user_meta_data to pole JSONB, które przechowuje user_metadata
--
-- 3. Operator || łączy dwa obiekty JSONB (merge)
--
-- 4. Operator - usuwa klucz z obiektu JSONB
--
-- 5. Po zmianie roli użytkownik musi się wylogować i zalogować ponownie,
--    aby zmiany zostały załadowane do aplikacji
--
-- 6. Możesz też zmienić rolę ręcznie w panelu Supabase:
--    Authentication → Users → [wybierz użytkownika] → User Metadata
--    Dodaj: { "role": "admin" }

