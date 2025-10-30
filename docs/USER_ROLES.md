# System Ról Użytkowników

## Przegląd

Aplikacja **eTrener** implementuje prosty system ról użytkowników oparty na Supabase Auth. System rozróżnia dwa typy użytkowników:
- **`user`** - zwykły użytkownik (domyślna rola)
- **`admin`** - administrator z rozszerzonymi uprawnieniami

## Architektura

### Przechowywanie Ról

Role są przechowywane w polu `user_metadata.role` w systemie autentykacji Supabase. Każdy użytkownik ma dostęp do swojego obiektu `user_metadata`, który jest częścią profilu użytkownika.

```javascript
// Struktura user_metadata
{
  role: 'admin' | undefined
}
```

**Ważne:**
- Brak pola `role` (lub wartość `undefined`) = zwykły użytkownik (`user`)
- Wartość `role: 'admin'` = administrator
- Tylko wartość `'admin'` jest traktowana jako specjalna rola

### Komponenty Systemu

#### 1. **Typy (types.js)**

```javascript
/**
 * @typedef {'admin'|'user'} UserRole
 */

/**
 * @typedef {Object} UserMetadata
 * @property {UserRole} [role] - User role (undefined = 'user', 'admin' = admin)
 */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} email
 * @property {UserMetadata} [user_metadata]
 */
```

#### 2. **Auth Service (auth-service.js)**

Serwis autentykacji udostępnia funkcje do sprawdzania ról:

```javascript
// Pobierz rolę użytkownika
const role = await authService.getUserRole();
// Zwraca: 'admin' | 'user'

// Sprawdź czy użytkownik jest adminem
const isAdmin = await authService.isAdmin();
// Zwraca: true | false
```

**API:**

- `getUserRole(user?)` - Pobiera rolę użytkownika z `user_metadata`
  - Parametr `user` jest opcjonalny (domyślnie pobiera aktualnego użytkownika)
  - Zwraca `Promise<UserRole>` ('admin' lub 'user')
  
- `isAdmin(user?)` - Sprawdza czy użytkownik jest adminem
  - Parametr `user` jest opcjonalny
  - Zwraca `Promise<boolean>`

#### 3. **Session Manager (session-manager.js)**

Session Manager przechowuje aktualną rolę użytkownika w pamięci aplikacji:

```javascript
// Ustawienie roli (wywoływane automatycznie przy logowaniu)
sessionManager.setUserRole('admin');

// Pobranie roli
const role = sessionManager.getUserRole();
// Zwraca: 'admin' | 'user'

// Sprawdzenie czy admin
const isAdmin = sessionManager.isAdmin();
// Zwraca: true | false

// Reset roli (wywoływane przy wylogowaniu)
sessionManager.resetUserRole();
```

**API:**

- `setUserRole(role)` - Ustawia rolę użytkownika
- `getUserRole()` - Pobiera aktualną rolę (synchroniczne)
- `isAdmin()` - Sprawdza czy użytkownik jest adminem (synchroniczne)
- `resetUserRole()` - Resetuje rolę do domyślnej ('user')

#### 4. **App.js - Integracja**

Rola użytkownika jest automatycznie inicjalizowana i aktualizowana w następujących sytuacjach:

1. **Przy starcie aplikacji** (`checkAuthState()`)
2. **Przy logowaniu** (`SIGNED_IN` event)
3. **Przy aktualizacji użytkownika** (`USER_UPDATED` event)
4. **Przy odświeżeniu tokena** (`TOKEN_REFRESHED` event)
5. **Przy wylogowaniu** (`SIGNED_OUT` event) - reset do 'user'

## Zarządzanie Rolami

### Nadawanie Roli Admin

**Metoda 1: Panel Supabase (Zalecana)**

1. Zaloguj się do panelu Supabase
2. Przejdź do `Authentication` → `Users`
3. Wybierz użytkownika
4. W sekcji `User Metadata` dodaj pole:
   ```json
   {
     "role": "admin"
   }
   ```
5. Zapisz zmiany

**Metoda 2: SQL (dla wielu użytkowników)**

Przejdź do panelu Supabase → SQL Editor i wykonaj zapytanie:

```sql
-- Nadaj rolę admin dla konkretnego użytkownika
UPDATE auth.users
SET raw_user_meta_data = 
  CASE 
    WHEN raw_user_meta_data IS NULL THEN '{"role": "admin"}'::jsonb
    ELSE raw_user_meta_data || '{"role": "admin"}'::jsonb
  END
WHERE email = 'admin@example.com';
```

📄 **Więcej przykładów SQL:** Zobacz plik `/supabase/add_admin_role.sql` z gotowymi zapytaniami

### Odbieranie Roli Admin

W panelu Supabase usuń pole `role` z `User Metadata` lub ustaw na `null`.

```sql
-- Usuń rolę admin (SQL)
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data - 'role'
WHERE email = 'user@example.com';
```

## Wykorzystanie w Kodzie

### Frontend - Warunkowe Wyświetlanie

```javascript
// Przykład: Pokaż przycisk tylko dla adminów
async function renderAdminButton() {
  const isAdmin = await authService.isAdmin();
  
  if (isAdmin) {
    // Pokaż przycisk edycji
    document.getElementById('admin-panel-btn').classList.remove('hidden');
  }
}

// Lub synchronicznie (jeśli rola jest już załadowana):
function renderAdminButton() {
  if (sessionManager.isAdmin()) {
    document.getElementById('admin-panel-btn').classList.remove('hidden');
  }
}
```

### Sprawdzanie Uprawnień

```javascript
// Przed wykonaniem akcji admina
async function editContent() {
  if (!await authService.isAdmin()) {
    alert('Brak uprawnień!');
    return;
  }
  
  // Wykonaj akcję admina
  // ...
}
```

### Routing/Nawigacja

```javascript
// Przykład: Przekieruj do panelu admina tylko dla adminów
async function navigateToAdminPanel() {
  if (!sessionManager.isAdmin()) {
    console.error('Access denied: Admin role required');
    uiManager.showScreen('main');
    return;
  }
  
  uiManager.showScreen('admin-panel');
}
```

## Bezpieczeństwo

### Frontend-Only (Obecna Implementacja)

⚠️ **Ważne:** Obecna implementacja działa **tylko na poziomie frontendu**. Oznacza to:

- ✅ Ukrywa elementy UI przed zwykłymi użytkownikami
- ✅ Zapobiega przypadkowemu dostępowi do funkcji admina
- ❌ **NIE zabezpiecza** danych przed manipulacją (np. przez DevTools)
- ❌ **NIE zabezpiecza** API endpoints

**To jest wystarczające dla:**
- Prostych aplikacji
- Funkcji, które nie operują na wrażliwych danych
- Sytuacji, gdzie admin zarządza tylko swoimi danymi

### Przyszłe Rozszerzenia (RLS)

Gdy aplikacja będzie przechowywać wrażliwe dane lub admin będzie miał dostęp do danych innych użytkowników, należy dodać **Row Level Security (RLS)** w Supabase:

```sql
-- Przykład: Tylko admin może edytować wiki
CREATE POLICY "Admin can edit wiki"
ON wiki_content
FOR UPDATE
USING (
  auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin'
);

-- Przykład: Admin może widzieć dane wszystkich użytkowników
CREATE POLICY "Admin can view all user data"
ON user_sessions
FOR SELECT
USING (
  auth.uid() = user_id OR
  auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin'
);
```

### Zabezpieczenie API Endpoints

Gdy będą dostępne endpointy tylko dla adminów (np. edycja wiki), należy dodać sprawdzanie roli:

```javascript
// api/admin-action.js
export default async function handler(req, res) {
  // Pobierz użytkownika z tokena
  const user = await supabase.auth.getUser(req.headers.authorization);
  
  // Sprawdź rolę
  const role = user?.user_metadata?.role;
  if (role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin role required' });
  }
  
  // Wykonaj akcję admina
  // ...
}
```

## Planowane Funkcje dla Adminów

### 1. **Wiki (Priorytet)**
- **Użytkownicy:** Mogą czytać artykuły wiki
- **Admin:** Może tworzyć, edytować i usuwać artykuły

### 2. **Panel Admina (Przyszłość)**
- Zarządzanie treściami publicznymi
- Tworzenie kursów/kategorii dla wszystkich użytkowników
- Statystyki i analytics

### 3. **Zarządzanie Użytkownikami (Opcjonalnie)**
- Lista użytkowników
- Nadawanie/odbieranie ról
- Moderacja treści

## Testowanie

### Testowanie Ręczne

1. **Zaloguj się jako zwykły użytkownik**
   - Sprawdź w konsoli: `sessionManager.getUserRole()` → powinno zwrócić `'user'`
   - Sprawdź: `sessionManager.isAdmin()` → powinno zwrócić `false`

2. **Nadaj sobie rolę admin w panelu Supabase**

3. **Odśwież stronę lub zaloguj się ponownie**
   - Sprawdź w konsoli: `sessionManager.getUserRole()` → powinno zwrócić `'admin'`
   - Sprawdź: `sessionManager.isAdmin()` → powinno zwrócić `true`
   - W konsoli powinien pojawić się log: `User role set: admin`

### Testy Jednostkowe

```javascript
// __tests__/user-roles.test.js
describe('User Roles', () => {
  test('getUserRole returns "user" for undefined role', async () => {
    const user = { id: '123', email: 'test@test.com', user_metadata: {} };
    const role = await authService.getUserRole(user);
    expect(role).toBe('user');
  });
  
  test('getUserRole returns "admin" for admin role', async () => {
    const user = { 
      id: '123', 
      email: 'admin@test.com', 
      user_metadata: { role: 'admin' } 
    };
    const role = await authService.getUserRole(user);
    expect(role).toBe('admin');
  });
  
  test('isAdmin returns true for admin', async () => {
    const user = { 
      id: '123', 
      email: 'admin@test.com', 
      user_metadata: { role: 'admin' } 
    };
    const isAdmin = await authService.isAdmin(user);
    expect(isAdmin).toBe(true);
  });
});
```

## FAQ

### Czy mogę dodać więcej ról?

Tak, ale wymaga to modyfikacji:
1. Rozszerz typ `UserRole` w `types.js`
2. Dodaj logikę sprawdzania w `auth-service.js`
3. Zaktualizuj dokumentację

Przykład:
```javascript
// types.js
/**
 * @typedef {'admin'|'moderator'|'user'} UserRole
 */

// auth-service.js
async getUserRole(user = null) {
  const role = currentUser.user_metadata?.role;
  
  if (role === 'admin') return 'admin';
  if (role === 'moderator') return 'moderator';
  return 'user';
}
```

### Co się stanie, jeśli użytkownik zmieni `user_metadata` w DevTools?

W obecnej implementacji (frontend-only) użytkownik może teoretycznie zmienić rolę w pamięci przeglądarki, ale:
- Nie wpłynie to na dane w Supabase
- Po odświeżeniu strony rola zostanie przywrócona z serwera
- Gdy dodamy RLS, backend będzie weryfikował rolę niezależnie od frontendu

### Czy rola jest zapisywana w localStorage?

Nie. Rola jest przechowywana tylko w pamięci (`sessionManager.currentUserRole`). Jest pobierana z Supabase przy każdym logowaniu/odświeżeniu sesji.

### Jak debugować problemy z rolami?

```javascript
// W konsoli przeglądarki:

// Sprawdź aktualną rolę
sessionManager.getUserRole()

// Sprawdź czy admin
sessionManager.isAdmin()

// Sprawdź dane użytkownika
await authService.getCurrentUser()

// Sprawdź user_metadata
const user = await authService.getCurrentUser();
console.log(user?.user_metadata);
```

## Historia Zmian

### v1.0 (2025-10-30)
- ✅ Dodano typy `UserRole` i `UserMetadata`
- ✅ Zaimplementowano `getUserRole()` i `isAdmin()` w `auth-service.js`
- ✅ Dodano zarządzanie rolą w `session-manager.js`
- ✅ Zintegrowano z `app.js` (automatyczna inicjalizacja przy logowaniu)
- ✅ Dokumentacja systemu ról

## Powiązane Pliki

- `/js/types.js` - Definicje typów
- `/js/auth-service.js` - Serwis autentykacji
- `/js/session-manager.js` - Zarządzanie sesją i rolą
- `/js/app.js` - Integracja z aplikacją
- `/docs/USER_ROLES.md` - Ten dokument

## Dalsze Kroki

1. ✅ **Etap 1: Fundament** - Zaimplementowano system ról (frontend-only)
2. ⏳ **Etap 2: Wiki** - Implementacja funkcji wiki z uprawnieniami dla admina
3. ⏳ **Etap 3: Panel Admina** - Interfejs do zarządzania treściami
4. ⏳ **Etap 4: RLS** - Zabezpieczenia na poziomie bazy danych (gdy będą wrażliwe dane)

---

**Autor:** System ról użytkowników - eTrener  
**Data utworzenia:** 30 października 2025  
**Ostatnia aktualizacja:** 30 października 2025

