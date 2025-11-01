# BUGFIX: Admin Role Not Working (2025-11-01)

## 🐛 Problem

Checkbox "Udostępnij publicznie" nie pokazywał się dla adminów mimo uruchomienia migracji.

## 🔍 Przyczyna

**Niespójność w przechowywaniu roli użytkownika:**

1. Rola była zapisywana w `sessionManager.currentUserRole`
2. Ale sprawdzana w `state.currentUser.role`
3. `state.currentUser.role` **nie istniało** → zawsze `undefined`
4. Warunek `state.currentUser.role === 'admin'` zawsze `false`

## ✅ Rozwiązanie

Ujednolicono mechanizm - rola jest teraz zapisywana w **OBIE** miejsca:

```javascript
// PRZED (tylko sessionManager)
const role = await authService.getUserRole(state.currentUser);
sessionManager.setUserRole(role);

// PO (sessionManager + state.currentUser)
const role = await authService.getUserRole(state.currentUser);
sessionManager.setUserRole(role);
state.currentUser.role = role; // ← DODANE
```

## 📁 Zmodyfikowane Pliki

**`js/app.js`** - 6 miejsc gdzie ustawiamy `state.currentUser`:

1. `checkAuthState()` - inicjalizacja przy starcie (linia 705)
2. `SIGNED_IN` - nowy login (linia 744)
3. `SIGNED_IN` - ten sam user w aktywności (linia 757)
4. `SIGNED_IN` - ten sam user poza aktywnością (linia 767)
5. `USER_UPDATED` - w aktywności (linia 782)
6. `USER_UPDATED` - poza aktywnością (linia 792)
7. `TOKEN_REFRESHED` - odświeżenie tokena (linia 821)

## 🎯 Dlaczego Dwa Miejsca?

### `sessionManager.currentUserRole`
- Używane przez `session-manager.js`
- Potrzebne do logiki sesji (retry mistakes, itp.)
- Istniejący kod

### `state.currentUser.role`
- Używane przez `content-manager.js` i `ui-manager.js`
- Wygodniejszy dostęp (nie trzeba importować sessionManager)
- Spójne z resztą danych użytkownika w `state.currentUser`

## 🧪 Testowanie

1. Uruchom migrację `supabase/URUCHOM_TO.sql`
2. Upewnij się że masz `is_super_admin = TRUE` w bazie
3. **Wyloguj się i zaloguj ponownie** (WAŻNE!)
4. Otwórz AI Generator
5. Checkbox "🌍 Udostępnij publicznie" powinien być widoczny

## 📝 Konsola Przeglądarki

Po zalogowaniu powinieneś zobaczyć:

```
✅ User role initialized: admin
```

Jeśli widzisz `user` zamiast `admin`, sprawdź bazę:

```sql
SELECT email, is_super_admin FROM auth.users WHERE email = 'twoj@email.com';
```

## ⚠️ Uwaga na Przyszłość

**ZAWSZE** gdy ustawiasz `state.currentUser`, ustaw też `state.currentUser.role`:

```javascript
// ✅ DOBRZE
state.currentUser = user;
const role = await authService.getUserRole(user);
sessionManager.setUserRole(role);
state.currentUser.role = role;

// ❌ ŹLE
state.currentUser = user;
sessionManager.setUserRole(role); // Brak state.currentUser.role!
```

## 🔄 Alternatywne Rozwiązanie (Nie Zastosowane)

Można było zrobić getter w `state`:

```javascript
const state = {
  currentUser: null,
  get isAdmin() {
    return sessionManager.currentUserRole === 'admin';
  }
};

// Użycie
if (state.isAdmin) { ... }
```

Ale to wymagałoby zmiany w wielu miejscach w kodzie.

---

**Status:** ✅ Naprawione  
**Data:** 2025-11-01  
**Pliki:** `js/app.js`

