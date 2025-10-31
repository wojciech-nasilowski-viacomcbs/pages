-- ============================================
-- FIX: Knowledge Base RLS Policies
-- ============================================
-- Problem: Policy "Admin can read all articles" blokuje zwykłych użytkowników
-- Rozwiązanie: Usuń i zastąp politykami które nie wymagają dostępu do auth.users

-- Usuń stare polityki
DROP POLICY IF EXISTS "Anyone can read published articles" ON knowledge_base_articles;
DROP POLICY IF EXISTS "Admin can read all articles" ON knowledge_base_articles;
DROP POLICY IF EXISTS "Admin can create articles" ON knowledge_base_articles;
DROP POLICY IF EXISTS "Admin can update articles" ON knowledge_base_articles;
DROP POLICY IF EXISTS "Admin can delete articles" ON knowledge_base_articles;

-- Policy 1: Wszyscy (w tym niezalogowani) mogą czytać opublikowane artykuły
CREATE POLICY "Public can read published articles"
ON knowledge_base_articles
FOR SELECT
TO public
USING (is_published = TRUE);

-- Policy 2: Zalogowani użytkownicy mogą czytać opublikowane artykuły
CREATE POLICY "Authenticated can read published articles"
ON knowledge_base_articles
FOR SELECT
TO authenticated
USING (is_published = TRUE);

-- Policy 3: Admin może czytać wszystkie artykuły (w tym nieopublikowane)
-- Używamy is_super_admin bezpośrednio z auth.jwt()
CREATE POLICY "Admin can read all articles"
ON knowledge_base_articles
FOR SELECT
TO authenticated
USING (
  (auth.jwt() -> 'is_super_admin')::boolean = TRUE
);

-- Policy 4: Admin może tworzyć artykuły
CREATE POLICY "Admin can create articles"
ON knowledge_base_articles
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.jwt() -> 'is_super_admin')::boolean = TRUE
);

-- Policy 5: Admin może edytować artykuły
CREATE POLICY "Admin can update articles"
ON knowledge_base_articles
FOR UPDATE
TO authenticated
USING (
  (auth.jwt() -> 'is_super_admin')::boolean = TRUE
);

-- Policy 6: Admin może usuwać artykuły
CREATE POLICY "Admin can delete articles"
ON knowledge_base_articles
FOR DELETE
TO authenticated
USING (
  (auth.jwt() -> 'is_super_admin')::boolean = TRUE
);

-- ============================================
-- RPC FUNCTION: Increment Article Views
-- ============================================
-- Funkcja do bezpiecznego inkrementowania licznika wyświetleń
-- (nie wymaga uprawnień do UPDATE dla zwykłych użytkowników)

CREATE OR REPLACE FUNCTION increment_kb_article_views(article_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER  -- Uruchamia się z uprawnieniami właściciela funkcji
AS $$
BEGIN
  UPDATE knowledge_base_articles
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = article_id;
END;
$$;

-- Nadaj uprawnienia do wykonania funkcji
GRANT EXECUTE ON FUNCTION increment_kb_article_views(UUID) TO public;
GRANT EXECUTE ON FUNCTION increment_kb_article_views(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_kb_article_views(UUID) TO anon;

-- Sprawdź polityki
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'knowledge_base_articles'
ORDER BY policyname;

