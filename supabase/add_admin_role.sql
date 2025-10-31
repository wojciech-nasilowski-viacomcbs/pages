-- ============================================
-- Dodawanie roli ADMIN do użytkowników
-- Używa natywnego pola is_super_admin
-- ============================================

-- SPOSÓB 1: Nadaj rolę admin dla konkretnego użytkownika (po emailu)
-- Zamień 'admin@example.com' na email użytkownika, któremu chcesz nadać rolę admin
UPDATE auth.users
SET is_super_admin = TRUE
WHERE email = 'admin@example.com';

-- SPOSÓB 2: Nadaj rolę admin dla konkretnego użytkownika (po ID)
-- Zamień 'user-uuid-here' na ID użytkownika
UPDATE auth.users
SET is_super_admin = TRUE
WHERE id = 'user-uuid-here';

-- ============================================
-- Usuwanie roli ADMIN
-- ============================================

-- Usuń rolę admin (użytkownik stanie się zwykłym userem)
UPDATE auth.users
SET is_super_admin = FALSE
WHERE email = 'user@example.com';

-- ============================================
-- Sprawdzanie użytkowników z rolą admin
-- ============================================

-- Wyświetl wszystkich adminów
SELECT 
  id,
  email,
  is_super_admin,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE is_super_admin = TRUE;

-- Wyświetl wszystkich użytkowników z ich rolami
SELECT 
  id,
  email,
  CASE 
    WHEN is_super_admin = TRUE THEN 'admin'
    ELSE 'user'
  END as role,
  is_super_admin,
  created_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- ============================================
-- PRZYKŁADY UŻYCIA
-- ============================================

-- Przykład 1: Nadaj rolę admin pierwszemu zarejestrowanemu użytkownikowi
UPDATE auth.users
SET is_super_admin = TRUE
WHERE id = (
  SELECT id 
  FROM auth.users 
  ORDER BY created_at ASC 
  LIMIT 1
);

-- Przykład 2: Nadaj rolę admin wielu użytkownikom naraz
UPDATE auth.users
SET is_super_admin = TRUE
WHERE email IN (
  'admin1@example.com',
  'admin2@example.com',
  'admin3@example.com'
);

-- Przykład 3: Usuń rolę admin wszystkim użytkownikom (reset)
UPDATE auth.users
SET is_super_admin = FALSE
WHERE is_super_admin = TRUE;

-- ============================================
-- FUNKCJE POMOCNICZE (Opcjonalnie)
-- ============================================

-- Utwórz funkcję do łatwego nadawania roli admin
CREATE OR REPLACE FUNCTION set_user_admin(user_email TEXT, is_admin BOOLEAN)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE auth.users
  SET is_super_admin = is_admin
  WHERE email = user_email;
END;
$$;

-- Użycie funkcji:
-- SELECT set_user_admin('admin@example.com', TRUE);  -- Nadaj admina
-- SELECT set_user_admin('user@example.com', FALSE);  -- Odbierz admina

-- Utwórz funkcję do sprawdzania czy użytkownik jest adminem
CREATE OR REPLACE FUNCTION is_user_admin(user_email TEXT)
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

-- Użycie funkcji:
-- SELECT is_user_admin('admin@example.com');

-- ============================================
-- UWAGI
-- ============================================

-- 1. Te zapytania muszą być wykonane jako admin w panelu Supabase
--    (SQL Editor) lub przez narzędzie psql z odpowiednimi uprawnieniami
--
-- 2. is_super_admin to natywne pole BOOLEAN w tabeli auth.users
--
-- 3. Wartości: TRUE = admin, FALSE/NULL = zwykły użytkownik
--
-- 4. Po zmianie roli użytkownik musi się wylogować i zalogować ponownie,
--    aby zmiany zostały załadowane do aplikacji
--
-- 5. Możesz też zmienić rolę ręcznie w panelu Supabase:
--    Authentication → Users → [wybierz użytkownika]
--    Zaznacz checkbox "Is Super Admin"
--
-- 6. WAŻNE: is_super_admin jest natywnym polem Supabase i jest
--    automatycznie dostępne w JWT tokenie (auth.uid())

