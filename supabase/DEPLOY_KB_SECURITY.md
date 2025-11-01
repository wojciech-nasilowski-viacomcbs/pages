# 🚀 Instrukcja wdrożenia: Knowledge Base Security Fix

**Czas wykonania:** ~10 minut  
**Priorytet:** 🔴 KRYTYCZNY  
**Wymaga:** Dostęp do Supabase Dashboard

---

## Krok 1: Backup (2 min)

1. Otwórz [Supabase Dashboard](https://app.supabase.com)
2. Wybierz projekt **eTrener**
3. Przejdź do: **Settings** → **Database** → **Backups**
4. Kliknij **Create backup**
5. Poczekaj na potwierdzenie

✅ **Checkpoint:** Backup utworzony

---

## Krok 2: Uruchom migrację SQL (3 min)

1. W Supabase Dashboard przejdź do: **SQL Editor**
2. Kliknij **New query**
3. Skopiuj całą zawartość pliku: `supabase/fix_kb_security.sql`
4. Wklej do edytora SQL
5. Kliknij **Run** (lub Ctrl/Cmd + Enter)
6. Sprawdź wynik:
   ```
   ✅ DROP POLICY (x7)
   ✅ CREATE POLICY (x5)
   ✅ ALTER TABLE
   ✅ CREATE OR REPLACE FUNCTION
   ✅ REVOKE EXECUTE (x2)
   ✅ GRANT EXECUTE (x1)
   ```

✅ **Checkpoint:** Migracja wykonana bez błędów

---

## Krok 3: Weryfikacja polityk (2 min)

W SQL Editor uruchom:

```sql
-- Sprawdź polityki
SELECT 
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE tablename = 'knowledge_base_articles'
ORDER BY policyname;
```

**Oczekiwany wynik:** 5 wierszy

| policyname | cmd | roles |
|-----------|-----|-------|
| Admin can create articles | INSERT | {authenticated} |
| Admin can delete articles | DELETE | {authenticated} |
| Admin can read all articles | SELECT | {authenticated} |
| Admin can update articles | UPDATE | {authenticated} |
| Authenticated users can read published articles | SELECT | {authenticated} |

✅ **Checkpoint:** 5 polityk aktywnych

---

## Krok 4: Deploy kodu aplikacji (2 min)

```bash
# Zatwierdź zmiany
git add .
git commit -m "fix: secure knowledge base with proper RLS policies"

# Wypchnij na main (Vercel auto-deploy)
git push origin main
```

Poczekaj na deploy w Vercel (~1-2 min)

✅ **Checkpoint:** Deploy zakończony sukcesem

---

## Krok 5: Testy (3 min)

### Test A: Niezalogowany użytkownik
1. Otwórz aplikację w trybie incognito
2. Spróbuj otworzyć deep link: `?type=article&slug=test`
3. **Oczekiwany wynik:** Landing page z komunikatem "Zaloguj się, aby otworzyć udostępniony artykuł"

✅ **Test A:** PASS

### Test B: Zalogowany użytkownik (nie admin)
1. Zaloguj się jako zwykły użytkownik
2. Przejdź do zakładki "Baza Wiedzy"
3. **Oczekiwany wynik:** Widoczne opublikowane artykuły
4. Spróbuj otworzyć artykuł
5. **Oczekiwany wynik:** Artykuł się otwiera

✅ **Test B:** PASS

### Test C: Admin
1. Zaloguj się jako admin
2. Przejdź do zakładki "Baza Wiedzy"
3. **Oczekiwany wynik:** Widoczne WSZYSTKIE artykuły (w tym nieopublikowane)
4. Kliknij "Edytuj" na artykule
5. **Oczekiwany wynik:** Editor się otwiera
6. Zapisz zmiany
7. **Oczekiwany wynik:** Zmiany zapisane

✅ **Test C:** PASS

---

## Krok 6: Monitoring (24h)

Przez najbliższe 24 godziny monitoruj:

1. **Supabase Logs:**
   - Dashboard → Logs → Database
   - Szukaj: `row-level security` errors

2. **Vercel Logs:**
   - Sprawdź czy nie ma błędów 500

3. **User Reports:**
   - Sprawdź czy użytkownicy zgłaszają problemy z dostępem

---

## 🆘 Rollback (w razie problemów)

Jeśli coś pójdzie nie tak:

### Opcja A: Przywróć backup
1. Supabase Dashboard → Settings → Database → Backups
2. Znajdź backup z kroku 1
3. Kliknij **Restore**

### Opcja B: Przywróć stare polityki
```sql
-- Usuń nowe polityki
DROP POLICY IF EXISTS "Authenticated users can read published articles" ON knowledge_base_articles;
DROP POLICY IF EXISTS "Admin can read all articles" ON knowledge_base_articles;
DROP POLICY IF EXISTS "Admin can create articles" ON knowledge_base_articles;
DROP POLICY IF EXISTS "Admin can update articles" ON knowledge_base_articles;
DROP POLICY IF EXISTS "Admin can delete articles" ON knowledge_base_articles;

-- Przywróć starą politykę (UWAGA: to przywraca lukę bezpieczeństwa!)
CREATE POLICY "Anyone can read published articles"
ON knowledge_base_articles
FOR SELECT
USING (is_published = TRUE);
```

---

## ✅ Potwierdzenie wdrożenia

Po wykonaniu wszystkich kroków:

- [x] Backup utworzony
- [x] Migracja wykonana
- [x] 5 polityk aktywnych
- [x] Kod wdrożony
- [x] Test A: PASS
- [x] Test B: PASS
- [x] Test C: PASS
- [x] Monitoring włączony

**Status:** ✅ **WDROŻONE**  
**Data:** ___________  
**Wykonał:** ___________

---

## 📞 Kontakt w razie problemów

- Sprawdź logi w Supabase
- Sprawdź dokumentację: `/docs/KB_SECURITY_FIX.md`
- W ostateczności: Rollback (Opcja A)

