-- ============================================
-- FIX: Knowledge Base Security - Proper RLS Policies
-- Data: 2025-11-01
-- ============================================
-- Problem: Niezalogowani użytkownicy mają dostęp do artykułów
-- Rozwiązanie: Tylko zalogowani mogą czytać, tylko admin może edytować

-- ============================================
-- KROK 1: Usuń stare polityki
-- ============================================

DROP POLICY IF EXISTS "Anyone can read published articles" ON knowledge_base_articles;
DROP POLICY IF EXISTS "Public can read published articles" ON knowledge_base_articles;
DROP POLICY IF EXISTS "Authenticated can read published articles" ON knowledge_base_articles;
DROP POLICY IF EXISTS "Admin can read all articles" ON knowledge_base_articles;
DROP POLICY IF EXISTS "Admin can create articles" ON knowledge_base_articles;
DROP POLICY IF EXISTS "Admin can update articles" ON knowledge_base_articles;
DROP POLICY IF EXISTS "Admin can delete articles" ON knowledge_base_articles;

-- ============================================
-- KROK 2: Nowe polityki zgodne z wymaganiami
-- ============================================

-- Policy 1: Zalogowani użytkownicy mogą czytać TYLKO opublikowane artykuły
CREATE POLICY "Authenticated users can read published articles"
ON knowledge_base_articles
FOR SELECT
TO authenticated
USING (is_published = TRUE);

-- Policy 2: Admin może czytać WSZYSTKIE artykuły (w tym nieopublikowane)
CREATE POLICY "Admin can read all articles"
ON knowledge_base_articles
FOR SELECT
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' -> 'role')::text = 'admin'
  OR
  (auth.jwt() -> 'is_super_admin')::boolean = TRUE
);

-- Policy 3: Admin może tworzyć artykuły
CREATE POLICY "Admin can create articles"
ON knowledge_base_articles
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.jwt() -> 'user_metadata' -> 'role')::text = 'admin'
  OR
  (auth.jwt() -> 'is_super_admin')::boolean = TRUE
);

-- Policy 4: Admin może edytować artykuły
CREATE POLICY "Admin can update articles"
ON knowledge_base_articles
FOR UPDATE
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' -> 'role')::text = 'admin'
  OR
  (auth.jwt() -> 'is_super_admin')::boolean = TRUE
);

-- Policy 5: Admin może usuwać artykuły
CREATE POLICY "Admin can delete articles"
ON knowledge_base_articles
FOR DELETE
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' -> 'role')::text = 'admin'
  OR
  (auth.jwt() -> 'is_super_admin')::boolean = TRUE
);

-- ============================================
-- KROK 3: Upewnij się że RLS jest włączony
-- ============================================

ALTER TABLE knowledge_base_articles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- KROK 4: Funkcja inkrementacji wyświetleń
-- ============================================
-- Ta funkcja musi działać z SECURITY DEFINER, aby zalogowani użytkownicy
-- mogli inkrementować licznik bez uprawnień do UPDATE

CREATE OR REPLACE FUNCTION increment_kb_article_views(article_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER  -- Uruchamia się z uprawnieniami właściciela funkcji (postgres)
SET search_path = public
AS $$
BEGIN
  -- Tylko dla opublikowanych artykułów
  UPDATE knowledge_base_articles
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = article_id AND is_published = TRUE;
END;
$$;

-- Nadaj uprawnienia do wykonania funkcji tylko zalogowanym
REVOKE EXECUTE ON FUNCTION increment_kb_article_views(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION increment_kb_article_views(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION increment_kb_article_views(UUID) TO authenticated;

-- ============================================
-- KROK 5: Weryfikacja polityk
-- ============================================

-- Sprawdź aktywne polityki
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'knowledge_base_articles'
ORDER BY policyname;

-- ============================================
-- TESTY (opcjonalne - do uruchomienia ręcznie)
-- ============================================

-- Test 1: Sprawdź czy RLS jest włączony
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'knowledge_base_articles';
-- Oczekiwany wynik: relrowsecurity = true

-- Test 2: Sprawdź liczbę polityk
SELECT COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'knowledge_base_articles';
-- Oczekiwany wynik: 5 polityk

-- Test 3: Sprawdź uprawnienia do funkcji
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
WHERE p.proname = 'increment_kb_article_views';

-- ============================================
-- DOKUMENTACJA
-- ============================================

COMMENT ON TABLE knowledge_base_articles IS 
'Tabela artykułów bazy wiedzy. 
RLS: 
- Niezalogowani: BRAK DOSTĘPU
- Zalogowani: ODCZYT opublikowanych artykułów
- Admin: PEŁNY DOSTĘP (CRUD)';

COMMENT ON POLICY "Authenticated users can read published articles" ON knowledge_base_articles IS
'Zalogowani użytkownicy mogą czytać tylko opublikowane artykuły';

COMMENT ON POLICY "Admin can read all articles" ON knowledge_base_articles IS
'Administratorzy mogą czytać wszystkie artykuły (w tym nieopublikowane)';

COMMENT ON POLICY "Admin can create articles" ON knowledge_base_articles IS
'Tylko administratorzy mogą tworzyć nowe artykuły';

COMMENT ON POLICY "Admin can update articles" ON knowledge_base_articles IS
'Tylko administratorzy mogą edytować artykuły';

COMMENT ON POLICY "Admin can delete articles" ON knowledge_base_articles IS
'Tylko administratorzy mogą usuwać artykuły';

COMMENT ON FUNCTION increment_kb_article_views(UUID) IS
'Bezpieczna funkcja do inkrementacji licznika wyświetleń artykułu.
Działa z SECURITY DEFINER, więc zalogowani użytkownicy mogą ją wywołać
bez uprawnień do UPDATE na tabeli.';

