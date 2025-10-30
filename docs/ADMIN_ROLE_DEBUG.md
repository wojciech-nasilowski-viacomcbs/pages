# 🔍 Debug: Sprawdzanie Roli Admina

## Problem

Mimo ustawienia `is_super_admin = TRUE` w bazie danych, `sessionManager.isAdmin()` zwraca `false`.

## ✅ Rozwiązanie (NAPRAWIONE)

Problem został naprawiony w wersji 2.0.2. Metoda `getUserRole()` teraz poprawnie odczytuje pole `is_super_admin` z sesji JWT.

---

## 🧪 Jak przetestować czy mam uprawnienia admina?

### Krok 1: Sprawdź w bazie danych

1. Otwórz Supabase Dashboard
2. Przejdź do **Authentication** → **Users**
3. Znajdź swoje konto
4. Sprawdź czy checkbox **"Is Super Admin"** jest zaznaczony

**Lub przez SQL Editor:**

```sql
SELECT 
  id,
  email,
  is_super_admin,
  created_at
FROM auth.users
WHERE email = 'twoj-email@example.com';
```

**Oczekiwany wynik:** `is_super_admin = true`

---

### Krok 2: Sprawdź w aplikacji

1. **Zaloguj się** do aplikacji
2. Otwórz **DevTools** (F12)
3. Przejdź do zakładki **Console**
4. Wpisz:

```javascript
sessionManager.isAdmin()
```

**Oczekiwany wynik:** `true`

---

### Krok 3: Sprawdź logi roli

Po zalogowaniu, w konsoli powinien pojawić się log:

```
🔐 Role check: {
  userId: "123e4567-e89b-12d3-a456-426614174000",
  email: "twoj-email@example.com",
  is_super_admin: true,
  role: "admin"
}
```

Jeśli widzisz `is_super_admin: false` lub `is_super_admin: undefined`, sprawdź:

1. ✅ Czy pole jest ustawione w bazie danych?
2. ✅ Czy wylogowałeś się i zalogowałeś ponownie po zmianie?
3. ✅ Czy używasz najnowszej wersji kodu (2.0.2+)?

---

### Krok 4: Sprawdź JWT token

Możesz sprawdzić zawartość JWT tokena:

```javascript
const { data: { session } } = await supabaseClient.auth.getSession();
console.log('JWT User:', session.user);
console.log('is_super_admin:', session.user.is_super_admin);
```

**Oczekiwany wynik:**
```javascript
{
  id: "...",
  email: "twoj-email@example.com",
  is_super_admin: true,  // ← To pole powinno być widoczne
  // ... inne pola
}
```

---

## 🐛 Troubleshooting

### Problem: `is_super_admin: undefined` w JWT

**Przyczyna:** Pole nie jest ustawione w bazie danych lub token nie został odświeżony.

**Rozwiązanie:**

1. Sprawdź w bazie danych (SQL):
```sql
SELECT is_super_admin FROM auth.users WHERE email = 'twoj-email@example.com';
```

2. Jeśli `NULL` lub `FALSE`, ustaw na `TRUE`:
```sql
UPDATE auth.users
SET is_super_admin = TRUE
WHERE email = 'twoj-email@example.com';
```

3. **Wyloguj się i zaloguj ponownie** (to odświeży JWT token)

---

### Problem: `is_super_admin: false` mimo ustawienia w bazie

**Przyczyna:** Stary JWT token (przed zmianą w bazie).

**Rozwiązanie:**

1. **Wyloguj się** z aplikacji
2. **Zaloguj się ponownie**
3. JWT token zostanie odświeżony z nową wartością

---

### Problem: `sessionManager.isAdmin()` zwraca `false`

**Przyczyna 1:** Używasz starej wersji kodu (przed 2.0.2).

**Rozwiązanie:** Zaktualizuj kod i zresetuj cache przeglądarki (Ctrl+Shift+R).

**Przyczyna 2:** Rola nie została ustawiona przy logowaniu.

**Rozwiązanie:** Wyloguj się i zaloguj ponownie.

---

### Problem: Przyciski edycji nie są widoczne

**Checklist:**

1. ✅ Czy `sessionManager.isAdmin()` zwraca `true`?
   ```javascript
   sessionManager.isAdmin()  // Powinno być: true
   ```

2. ✅ Czy feature flag `ENABLE_KNOWLEDGE_BASE` jest włączony?
   ```javascript
   featureFlags.isKnowledgeBaseEnabled()  // Powinno być: true
   ```

3. ✅ Czy jesteś w zakładce **📚 Wiedza**?

4. ✅ Czy wylogowałeś się i zalogowałeś ponownie po nadaniu uprawnień?

---

## 📊 Diagram przepływu roli

```
1. Baza danych (auth.users)
   └─> is_super_admin = TRUE

2. Logowanie użytkownika
   └─> Supabase generuje JWT token
       └─> JWT zawiera is_super_admin: true

3. Aplikacja pobiera sesję
   └─> authService.getUserRole()
       └─> Odczytuje is_super_admin z session.user
           └─> Zwraca 'admin'

4. Ustawienie roli w session manager
   └─> sessionManager.setUserRole('admin')
       └─> currentUserRole = 'admin'

5. Sprawdzenie uprawnień
   └─> sessionManager.isAdmin()
       └─> Zwraca true
           └─> Przyciski edycji są widoczne
```

---

## 🔧 Komendy debugowania

### Sprawdź wszystkie dane użytkownika

```javascript
// Pobierz pełne dane sesji
const { data: { session } } = await supabaseClient.auth.getSession();

console.log('=== DEBUG: User Role ===');
console.log('User ID:', session.user.id);
console.log('Email:', session.user.email);
console.log('is_super_admin:', session.user.is_super_admin);
console.log('Session Manager Role:', sessionManager.getUserRole());
console.log('Is Admin:', sessionManager.isAdmin());
console.log('========================');
```

### Sprawdź feature flags

```javascript
console.log('=== DEBUG: Feature Flags ===');
console.log('Knowledge Base Enabled:', featureFlags.isKnowledgeBaseEnabled());
console.log('Enabled Tabs:', featureFlags.getEnabledTabs());
console.log('============================');
```

### Sprawdź UI state

```javascript
console.log('=== DEBUG: UI State ===');
console.log('Current Tab:', state.currentTab);
console.log('Current View:', state.currentView);
console.log('Current User:', state.currentUser);
console.log('=======================');
```

---

## 📝 Historia zmian

### v2.0.2 (30 października 2025)
- ✅ Naprawiono `getUserRole()` - teraz poprawnie odczytuje `is_super_admin` z sesji
- ✅ Dodano logi debugowania roli
- ✅ Zaktualizowano dokumentację

### v2.0.1 (30 października 2025)
- ✅ Dodano obsługę `FF_ENABLE_KNOWLEDGE_BASE` w `generate-config.js`
- ✅ Zaktualizowano dokumentację feature flags

---

## 🔗 Powiązane dokumenty

- [USER_ROLES.md](USER_ROLES.md) - Pełna dokumentacja systemu ról
- [KNOWLEDGE_BASE_QUICK_START.md](KNOWLEDGE_BASE_QUICK_START.md) - Jak edytować Bazę Wiedzy
- [KNOWLEDGE_BASE_FIX.md](KNOWLEDGE_BASE_FIX.md) - Fix feature flag na Vercel
- [CHANGELOG_2025_10_30.md](CHANGELOG_2025_10_30.md) - Changelog

---

**Potrzebujesz pomocy?** Sprawdź logi w konsoli lub otwórz issue na GitHub.

