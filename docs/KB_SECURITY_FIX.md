# Knowledge Base Security Fix

**Data:** 2025-11-01  
**Priorytet:** 🔴 **KRYTYCZNY**  
**Status:** ⚠️ Wymaga wdrożenia

## 🚨 Problem

Baza wiedzy (Knowledge Base) nie jest odpowiednio chroniona przed nieautoryzowanym dostępem.

### Obecna sytuacja (BŁĘDNA):
```
❌ Niezalogowani użytkownicy: PEŁNY DOSTĘP do opublikowanych artykułów
✅ Zalogowani użytkownicy: ODCZYT opublikowanych artykułów
✅ Admin: ODCZYT i EDYCJA wszystkich artykułów
```

### Wymagana sytuacja:
```
❌ Niezalogowani użytkownicy: BRAK DOSTĘPU
✅ Zalogowani użytkownicy: ODCZYT opublikowanych artykułów
✅ Admin: ODCZYT i EDYCJA wszystkich artykułów
```

## 🔍 Analiza problemu

### Błędna polityka RLS:
```sql
-- Ta polityka pozwala WSZYSTKIM (nawet niezalogowanym) czytać artykuły
CREATE POLICY "Anyone can read published articles"
ON knowledge_base_articles
FOR SELECT
USING (is_published = TRUE);
```

### Konsekwencje:
1. **Naruszenie prywatności** - niezalogowani mogą czytać treści
2. **Brak kontroli dostępu** - nie można ograniczyć dostępu do premium content
3. **Niezgodność z modelem biznesowym** - wymagane logowanie

## ✅ Rozwiązanie

### Nowe polityki RLS:

#### 1. Odczyt dla zalogowanych użytkowników
```sql
CREATE POLICY "Authenticated users can read published articles"
ON knowledge_base_articles
FOR SELECT
TO authenticated
USING (is_published = TRUE);
```

#### 2. Pełny dostęp dla adminów
```sql
CREATE POLICY "Admin can read all articles"
ON knowledge_base_articles
FOR SELECT
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' -> 'role')::text = 'admin'
  OR
  (auth.jwt() -> 'is_super_admin')::boolean = TRUE
);
```

#### 3. Tylko admin może tworzyć/edytować/usuwać
```sql
-- CREATE
CREATE POLICY "Admin can create articles"
ON knowledge_base_articles
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.jwt() -> 'user_metadata' -> 'role')::text = 'admin'
  OR
  (auth.jwt() -> 'is_super_admin')::boolean = TRUE
);

-- UPDATE
CREATE POLICY "Admin can update articles"
ON knowledge_base_articles
FOR UPDATE
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' -> 'role')::text = 'admin'
  OR
  (auth.jwt() -> 'is_super_admin')::boolean = TRUE
);

-- DELETE
CREATE POLICY "Admin can delete articles"
ON knowledge_base_articles
FOR DELETE
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' -> 'role')::text = 'admin'
  OR
  (auth.jwt() -> 'is_super_admin')::boolean = TRUE
);
```

## 🚀 Wdrożenie

### Krok 1: Backup bazy danych
```bash
# W Supabase Dashboard
# Settings → Database → Backups → Create backup
```

### Krok 2: Uruchom migrację
```sql
-- W Supabase SQL Editor uruchom:
-- supabase/fix_kb_security.sql
```

Lub przez CLI:
```bash
supabase db push --db-url "postgresql://..."
```

### Krok 3: Weryfikacja

#### Test 1: Sprawdź RLS
```sql
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'knowledge_base_articles';
```
**Oczekiwany wynik:** `relrowsecurity = true`

#### Test 2: Sprawdź polityki
```sql
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'knowledge_base_articles'
ORDER BY policyname;
```
**Oczekiwany wynik:** 5 polityk (1x SELECT dla authenticated, 4x dla admin)

#### Test 3: Sprawdź dostęp jako niezalogowany
```javascript
// W przeglądarce (bez logowania)
const { data, error } = await supabase
  .from('knowledge_base_articles')
  .select('*');

console.log(error); // Powinien być błąd: "row-level security"
```

#### Test 4: Sprawdź dostęp jako zalogowany user
```javascript
// Po zalogowaniu (nie admin)
const { data, error } = await supabase
  .from('knowledge_base_articles')
  .select('*')
  .eq('is_published', true);

console.log(data); // Powinny być artykuły
```

#### Test 5: Sprawdź dostęp jako admin
```javascript
// Po zalogowaniu jako admin
const { data, error } = await supabase
  .from('knowledge_base_articles')
  .select('*');

console.log(data); // Powinny być WSZYSTKIE artykuły (w tym nieopublikowane)
```

### Krok 4: Aktualizacja kodu aplikacji

**Nie wymaga zmian w kodzie JavaScript!**

Obecny kod już obsługuje przypadki:
- Niezalogowany → pokazuje landing page z CTA do logowania
- Zalogowany → może przeglądać artykuły
- Admin → może edytować artykuły

Deep linki dla artykułów (`?type=article&slug=xxx`) automatycznie będą wymagać logowania.

## 📊 Macierz dostępu

| Rola | SELECT (published) | SELECT (all) | INSERT | UPDATE | DELETE |
|------|-------------------|--------------|--------|--------|--------|
| **Niezalogowany** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Zalogowany** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ |

## 🔒 Dodatkowe zabezpieczenia

### 1. Funkcja inkrementacji wyświetleń
```sql
-- SECURITY DEFINER pozwala zalogowanym użytkownikom
-- inkrementować licznik bez uprawnień do UPDATE
CREATE OR REPLACE FUNCTION increment_kb_article_views(article_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE knowledge_base_articles
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = article_id AND is_published = TRUE;
END;
$$;

-- Tylko zalogowani mogą wywołać funkcję
GRANT EXECUTE ON FUNCTION increment_kb_article_views(UUID) TO authenticated;
```

### 2. Storage policies dla obrazków
Obrazki w `knowledge-base-images` bucket:
- ✅ Wszyscy mogą **pobierać** (publiczny dostęp do obrazków)
- ✅ Tylko admin może **uploadować**
- ✅ Tylko admin może **usuwać**

## 🐛 Znane problemy i rozwiązania

### Problem 1: Deep linki przestaną działać dla niezalogowanych
**Rozwiązanie:** To jest zamierzone zachowanie. Deep link pokaże landing page z prośbą o zalogowanie.

### Problem 2: Użytkownicy mogą być zaskoczeni wymogiem logowania
**Rozwiązanie:** Landing page wyraźnie komunikuje: "Zaloguj się, aby uzyskać dostęp do bazy wiedzy"

### Problem 3: SEO - Google nie zindeksuje artykułów
**Rozwiązanie:** 
- Opcja A: Dodaj osobną politykę dla botów (wymaga identyfikacji User-Agent)
- Opcja B: Stwórz publiczne preview artykułów (pierwsze 200 znaków)
- Opcja C: Akceptuj brak indeksowania (content premium)

## 📝 Checklist wdrożenia

- [ ] Backup bazy danych
- [ ] Uruchom migrację `fix_kb_security.sql`
- [ ] Weryfikacja: Test 1 - RLS włączony
- [ ] Weryfikacja: Test 2 - 5 polityk aktywnych
- [ ] Weryfikacja: Test 3 - Niezalogowany NIE ma dostępu
- [ ] Weryfikacja: Test 4 - Zalogowany MA dostęp do published
- [ ] Weryfikacja: Test 5 - Admin MA dostęp do wszystkich
- [ ] Test manualny: Otwórz aplikację jako gość
- [ ] Test manualny: Zaloguj się i sprawdź bazę wiedzy
- [ ] Test manualny: Zaloguj jako admin i edytuj artykuł
- [ ] Monitoring: Sprawdź logi błędów przez 24h

## 🔗 Powiązane dokumenty

- `/supabase/fix_kb_security.sql` - Skrypt migracji
- `/docs/DB_SCHEMA.md` - Schemat bazy danych
- `/docs/USER_ROLES.md` - Dokumentacja ról użytkowników
- `/docs/KNOWLEDGE_BASE_FEATURE.md` - Dokumentacja bazy wiedzy

## ⚠️ Uwaga dla developerów

Po wdrożeniu tej migracji:

1. **Deep linki będą wymagać logowania**
   ```
   https://etrener.app/?type=article&slug=xxx
   → Przekierowanie do landing page z CTA
   ```

2. **API calls bez auth będą zwracać błąd**
   ```javascript
   const { data, error } = await supabase
     .from('knowledge_base_articles')
     .select('*');
   // error: "row-level security policy violation"
   ```

3. **Funkcja increment_kb_article_views wymaga auth**
   ```javascript
   // Przed: działało dla wszystkich
   // Po: wymaga zalogowania
   await supabase.rpc('increment_kb_article_views', { article_id: 'xxx' });
   ```

## 📞 Kontakt

W razie problemów:
- Sprawdź logi w Supabase Dashboard → Logs
- Sprawdź polityki RLS: `SELECT * FROM pg_policies WHERE tablename = 'knowledge_base_articles'`
- Rollback: Przywróć backup z kroku 1

---

**Status:** ⚠️ **WYMAGA NATYCHMIASTOWEGO WDROŻENIA**  
**Priorytet:** 🔴 **KRYTYCZNY - BEZPIECZEŃSTWO**

