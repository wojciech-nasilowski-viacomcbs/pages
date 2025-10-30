# 🔧 Setup: Rola Admina - Instrukcja Konfiguracji

## Problem

Aplikacja nie może sprawdzić czy użytkownik jest adminem, ponieważ pole `is_super_admin` **nie jest domyślnie dostępne** w JWT tokenie Supabase.

## ✅ Rozwiązanie

Utworzyliśmy funkcje RPC w bazie danych, które pozwalają sprawdzić uprawnienia admina bez potrzeby modyfikacji JWT.

---

## 📋 Kroki Konfiguracji

### Krok 1: Uruchom SQL w Supabase

1. **Otwórz Supabase Dashboard:**
   ```
   https://supabase.com/dashboard
   → Wybierz projekt
   → SQL Editor
   ```

2. **Skopiuj zawartość pliku:**
   ```
   supabase/functions_user_role.sql
   ```

3. **Wklej w SQL Editor i kliknij "Run"**

To utworzy 3 funkcje RPC:
- `is_user_admin(user_id UUID)` - Sprawdza czy użytkownik jest adminem
- `is_user_admin_by_email(email TEXT)` - Sprawdza po emailu (debug)
- `get_user_role(user_id UUID)` - Zwraca rolę ('admin' lub 'user')

---

### Krok 2: Nadaj sobie uprawnienia admina

1. **W tym samym SQL Editor wykonaj:**

```sql
-- Zamień na swój email
UPDATE auth.users
SET is_super_admin = TRUE
WHERE email = 'twoj-email@example.com';
```

2. **Sprawdź czy działa:**

```sql
-- Zamień na swój email
SELECT is_user_admin_by_email('twoj-email@example.com');
-- Powinno zwrócić: true
```

---

### Krok 3: Przetestuj w aplikacji

1. **Odśwież stronę** (Ctrl+R lub Cmd+R)

2. **Otwórz konsolę** (F12) i sprawdź logi:

```
🔐 Role check: {
  userId: "...",
  email: "twoj-email@example.com",
  is_super_admin: true,
  role: "admin"
}
```

3. **Sprawdź w konsoli:**

```javascript
sessionManager.isAdmin()
// Powinno zwrócić: true
```

4. **Przejdź do zakładki 📚 Wiedza**

Powinieneś zobaczyć:
- ✅ Przycisk **➕ Nowy artykuł**
- ✅ Przyciski **✏️ Edytuj** i **🗑️** na kartach

---

## 🔍 Jak to działa?

### Przed (nie działało):

```javascript
// Próba odczytu is_super_admin z JWT
const isSuperAdmin = session.user?.is_super_admin;
// ❌ Zwraca: undefined (pole nie jest w JWT)
```

### Po (działa):

```javascript
// Wywołanie funkcji RPC w bazie danych
const { data } = await supabaseClient.rpc('is_user_admin', {
  user_id: currentUser.id
});
// ✅ Zwraca: true/false (pobrane z auth.users)
```

---

## 🧪 Testowanie Funkcji RPC

### Test 1: Sprawdź po ID

```sql
-- Zamień UUID na swoje ID użytkownika
SELECT is_user_admin('123e4567-e89b-12d3-a456-426614174000');
```

**Oczekiwany wynik:** `true` (jeśli jesteś adminem)

### Test 2: Sprawdź po emailu

```sql
SELECT is_user_admin_by_email('twoj-email@example.com');
```

**Oczekiwany wynik:** `true`

### Test 3: Pobierz rolę

```sql
SELECT get_user_role('123e4567-e89b-12d3-a456-426614174000');
```

**Oczekiwany wynik:** `'admin'` lub `'user'`

### Test 4: Sprawdź dla zalogowanego użytkownika

```sql
-- auth.uid() zwraca ID aktualnie zalogowanego użytkownika
SELECT is_user_admin(auth.uid());
SELECT get_user_role(auth.uid());
```

---

## 🐛 Troubleshooting

### Problem: Funkcja `is_user_admin` nie istnieje

**Błąd w konsoli:**
```
function is_user_admin(uuid) does not exist
```

**Rozwiązanie:**
1. Sprawdź czy wykonałeś SQL z pliku `supabase/functions_user_role.sql`
2. Sprawdź w SQL Editor:
```sql
-- Lista wszystkich funkcji
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%user%admin%';
```

3. Jeśli funkcja nie istnieje, uruchom ponownie `functions_user_role.sql`

---

### Problem: `is_super_admin` jest `false` mimo ustawienia w bazie

**Sprawdź w SQL:**
```sql
SELECT id, email, is_super_admin
FROM auth.users
WHERE email = 'twoj-email@example.com';
```

**Jeśli `is_super_admin` jest `NULL` lub `FALSE`:**
```sql
UPDATE auth.users
SET is_super_admin = TRUE
WHERE email = 'twoj-email@example.com';
```

**Nie musisz się wylogowywać!** Funkcja RPC pobiera wartość bezpośrednio z bazy.

---

### Problem: Przyciski edycji nadal nie są widoczne

**Checklist:**

1. ✅ Czy funkcje RPC są utworzone?
```sql
SELECT is_user_admin_by_email('twoj-email@example.com');
```

2. ✅ Czy `is_super_admin = TRUE` w bazie?
```sql
SELECT is_super_admin FROM auth.users WHERE email = 'twoj-email@example.com';
```

3. ✅ Czy `sessionManager.isAdmin()` zwraca `true`?
```javascript
sessionManager.isAdmin()  // W konsoli przeglądarki
```

4. ✅ Czy feature flag jest włączony?
```javascript
featureFlags.isKnowledgeBaseEnabled()
```

5. ✅ Czy odświeżyłeś stronę po zmianach?

---

## 📊 Diagram przepływu

```
1. Użytkownik loguje się
   └─> Supabase zwraca JWT token (bez is_super_admin)

2. Aplikacja wywołuje authService.getUserRole()
   └─> Sprawdza czy is_super_admin jest w JWT
       ├─> Jeśli TAK: użyj wartości z JWT
       └─> Jeśli NIE: wywołaj RPC is_user_admin(user_id)
           └─> RPC zapytuje auth.users
               └─> Zwraca TRUE/FALSE

3. sessionManager.setUserRole('admin')
   └─> Zapisuje rolę w pamięci aplikacji

4. Komponenty UI sprawdzają sessionManager.isAdmin()
   └─> Pokazują/ukrywają przyciski admina
```

---

## 🎯 Zalety tego rozwiązania

✅ **Nie wymaga modyfikacji JWT** - działa out-of-the-box  
✅ **Zmiany są natychmiastowe** - nie trzeba wylogowywać użytkownika  
✅ **Bezpieczne** - funkcja RPC używa `SECURITY DEFINER`  
✅ **Uniwersalne** - działa na wszystkich planach Supabase  
✅ **Łatwe w debugowaniu** - można testować w SQL Editor  

---

## 🔗 Powiązane pliki

- `supabase/functions_user_role.sql` - Definicje funkcji RPC
- `js/auth-service.js` - Kod sprawdzający rolę
- `docs/USER_ROLES.md` - Pełna dokumentacja systemu ról
- `docs/ADMIN_ROLE_DEBUG.md` - Debugowanie problemów z rolą

---

## ❓ FAQ

### Czy muszę wylogować się po zmianie roli?

**Nie!** Funkcja RPC pobiera wartość bezpośrednio z bazy, więc zmiany są widoczne natychmiast. Wystarczy odświeżyć stronę (Ctrl+R).

### Czy mogę mieć wielu adminów?

**Tak!** Ustaw `is_super_admin = TRUE` dla dowolnej liczby użytkowników:

```sql
UPDATE auth.users
SET is_super_admin = TRUE
WHERE email IN (
  'admin1@example.com',
  'admin2@example.com',
  'admin3@example.com'
);
```

### Czy to bezpieczne?

**Tak!** Funkcja RPC używa `SECURITY DEFINER`, co oznacza że:
- Uruchamia się z uprawnieniami właściciela (admin)
- Może czytać z `auth.users` (niedostępne dla zwykłych użytkowników)
- Tylko sprawdza status, nie modyfikuje danych

### Co jeśli funkcja RPC nie działa?

Aplikacja ma **fallback**: jeśli RPC nie działa, sprawdzi `raw_user_meta_data.is_super_admin` (jeśli dostępne) lub zwróci `'user'`.

---

**Status:** ✅ Gotowe do wdrożenia  
**Data:** 30 października 2025  
**Wersja:** 2.0.3

