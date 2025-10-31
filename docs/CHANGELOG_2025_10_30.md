# Changelog - 30 października 2025

## 🔧 Naprawiono: Feature Flag `ENABLE_KNOWLEDGE_BASE` nie działała na Vercel

### Problem
Baza Wiedzy była wyłączona na produkcji mimo ustawienia zmiennej środowiskowej w Vercel.

### Przyczyna
Skrypt `scripts/generate-config.js` nie zawierał obsługi zmiennej `FF_ENABLE_KNOWLEDGE_BASE`.

### Rozwiązanie

#### 1. Zaktualizowano `scripts/generate-config.js`

**Dodano obsługę zmiennej:**
```javascript
const FF_ENABLE_KNOWLEDGE_BASE = process.env.FF_ENABLE_KNOWLEDGE_BASE;
```

**Dodano do generowanego config:**
```javascript
FEATURE_FLAGS: {
    // ...
    ENABLE_KNOWLEDGE_BASE: ${FF_ENABLE_KNOWLEDGE_BASE !== undefined ? FF_ENABLE_KNOWLEDGE_BASE : 'true'},
    // ...
}
```

#### 2. Zaktualizowano dokumentację

**Pliki zaktualizowane:**
- `docs/FEATURE_FLAGS.md` - dodano `ENABLE_KNOWLEDGE_BASE` do listy flag
- `docs/VERCEL_FEATURE_FLAGS_SETUP.md` - dodano `FF_ENABLE_KNOWLEDGE_BASE=true`

**Pliki utworzone:**
- `docs/KNOWLEDGE_BASE_FIX.md` - szczegółowa dokumentacja problemu i rozwiązania
- `docs/TAILWIND_CDN_WARNING.md` - dokumentacja ostrzeżenia Tailwind CDN

#### 3. Zaktualizowano INDEX.md

Dodano odnośniki do nowych dokumentów.

---

## ⚠️ Udokumentowano: Ostrzeżenie Tailwind CDN

### Problem
W konsoli pojawia się ostrzeżenie:
```
cdn.tailwindcss.com should not be used in production
```

### Status
**Tech Debt** - nie blokujące, do naprawienia po MVP.

### Dokumentacja
Zobacz `docs/TAILWIND_CDN_WARNING.md` dla:
- Wyjaśnienia problemu
- Opcji rozwiązania (Tailwind CLI, PostCSS + Vite)
- Porównania wydajności
- Checklisty migracji

---

## 📋 Kroki dla użytkownika (Vercel)

### Aby naprawić Bazę Wiedzy na Vercel:

1. **Otwórz Vercel Dashboard:**
   - Settings → Environment Variables

2. **Sprawdź nazwę zmiennej:**
   - ❌ Jeśli masz: `ENABLE_KNOWLEDGE_BASE=true` → **usuń**
   - ✅ Dodaj nową: `FF_ENABLE_KNOWLEDGE_BASE=true`

3. **Zaznacz środowiska:**
   - ✅ Production
   - ✅ Preview
   - ✅ Development

4. **Redeploy:**
   - Deployments → ⋯ → Redeploy

5. **Weryfikuj:**
   - Otwórz aplikację
   - Sprawdź konsolę przeglądarki
   - Nie powinno być ostrzeżeń o `ENABLE_KNOWLEDGE_BASE`

---

## 📝 Pliki zmienione

### Kod
- `scripts/generate-config.js` - dodano obsługę `FF_ENABLE_KNOWLEDGE_BASE`

### Dokumentacja
- `docs/FEATURE_FLAGS.md` - zaktualizowano listę flag
- `docs/VERCEL_FEATURE_FLAGS_SETUP.md` - dodano `FF_ENABLE_KNOWLEDGE_BASE`
- `docs/INDEX.md` - dodano odnośniki do nowych dokumentów
- `docs/KNOWLEDGE_BASE_FIX.md` - **NOWY** - dokumentacja fix'a
- `docs/TAILWIND_CDN_WARNING.md` - **NOWY** - dokumentacja ostrzeżenia Tailwind
- `docs/CHANGELOG_2025_10_30.md` - **NOWY** - ten plik

---

## ✅ Checklist dla użytkownika

- [x] Kod naprawiony i zaktualizowany
- [x] Dokumentacja zaktualizowana
- [ ] **Zmienić nazwę zmiennej w Vercel** (`ENABLE_KNOWLEDGE_BASE` → `FF_ENABLE_KNOWLEDGE_BASE`)
- [ ] **Redeploy aplikacji**
- [ ] **Zweryfikować w konsoli przeglądarki**

---

## 🔗 Przydatne linki

- [KNOWLEDGE_BASE_FIX.md](KNOWLEDGE_BASE_FIX.md) - Szczegółowa instrukcja naprawy
- [FEATURE_FLAGS.md](FEATURE_FLAGS.md) - Dokumentacja feature flags
- [VERCEL_FEATURE_FLAGS_SETUP.md](VERCEL_FEATURE_FLAGS_SETUP.md) - Setup na Vercel
- [TAILWIND_CDN_WARNING.md](TAILWIND_CDN_WARNING.md) - Info o Tailwind CDN

---

---

## 🔧 Naprawiono: `sessionManager.isAdmin()` zwracało `false` mimo `is_super_admin = true`

### Problem
Mimo ustawienia `is_super_admin = TRUE` w bazie danych, metoda `sessionManager.isAdmin()` zwracała `false`.

### Przyczyna
Metoda `authService.getUserRole()` próbowała odczytać pole `is_super_admin` bezpośrednio z obiektu `user` zwracanego przez `supabase.auth.getUser()`, ale to pole **nie jest tam dostępne**.

Pole `is_super_admin` jest dostępne tylko w:
1. **JWT tokenie** (w sesji)
2. **Bezpośrednim zapytaniu** do tabeli `auth.users`

### Rozwiązanie

Zaktualizowano metodę `getUserRole()` w `auth-service.js`:

```javascript
async getUserRole(user = null) {
    // Pobierz sesję (zawiera JWT token z is_super_admin)
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    
    // Sprawdź is_super_admin w obiekcie user z sesji
    const isSuperAdmin = session.user?.is_super_admin;
    
    return isSuperAdmin === true ? 'admin' : 'user';
}
```

**Teraz metoda:**
1. Pobiera sesję (która zawiera pełny obiekt `user` z JWT)
2. Sprawdza pole `is_super_admin` w `session.user`
3. Dodaje logi do debugowania

### Weryfikacja

Po naprawie, w konsoli zobaczysz:

```
🔐 Role check: {
  userId: "...",
  email: "twoj-email@example.com",
  is_super_admin: true,
  role: "admin"
}
```

---

---

## 🔧 Naprawiono (v2): `is_super_admin` nie jest w JWT - użycie RPC

### Problem
Pole `is_super_admin` **nie jest domyślnie dostępne** w JWT tokenie Supabase, więc poprzednia naprawa nie działała.

### Rozwiązanie

Utworzono funkcje RPC w bazie danych, które sprawdzają uprawnienia bezpośrednio w tabeli `auth.users`:

#### 1. Nowy plik SQL: `supabase/functions_user_role.sql`

Zawiera 3 funkcje RPC:
- `is_user_admin(user_id UUID)` - Sprawdza czy użytkownik jest adminem
- `is_user_admin_by_email(email TEXT)` - Sprawdza po emailu
- `get_user_role(user_id UUID)` - Zwraca rolę ('admin' lub 'user')

#### 2. Zaktualizowano `auth-service.js`

```javascript
async getUserRole(user = null) {
    // 1. Sprawdź czy is_super_admin jest w JWT (rzadko)
    let isSuperAdmin = session?.user?.is_super_admin;
    
    // 2. Jeśli nie, wywołaj RPC
    if (isSuperAdmin === undefined) {
        const { data } = await supabaseClient.rpc('is_user_admin', {
            user_id: currentUser.id
        });
        isSuperAdmin = data === true;
    }
    
    return isSuperAdmin === true ? 'admin' : 'user';
}
```

#### 3. Utworzono dokumentację

- `docs/ADMIN_ROLE_SETUP.md` - Instrukcja konfiguracji (WYMAGANA)
- Zaktualizowano `docs/ADMIN_ROLE_DEBUG.md`

### Kroki dla użytkownika

1. **Uruchom SQL w Supabase:**
   - Otwórz SQL Editor
   - Skopiuj zawartość `supabase/functions_user_role.sql`
   - Kliknij "Run"

2. **Nadaj sobie uprawnienia:**
```sql
UPDATE auth.users
SET is_super_admin = TRUE
WHERE email = 'twoj-email@example.com';
```

3. **Odśwież stronę** - przyciski edycji powinny być widoczne

### Zalety

✅ Nie wymaga modyfikacji JWT  
✅ Zmiany są natychmiastowe (nie trzeba wylogowywać)  
✅ Bezpieczne (SECURITY DEFINER)  
✅ Łatwe w debugowaniu  

---

**Data:** 30 października 2025  
**Wersja:** 2.0.3  
**Status:** ✅ Gotowe do wdrożenia - **WYMAGA** uruchomienia SQL

