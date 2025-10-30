# System Ról Użytkowników

## Przegląd

Aplikacja **eTrener** implementuje prosty system ról użytkowników oparty na Supabase Auth. System rozróżnia dwa typy użytkowników:
- **`user`** - zwykły użytkownik (domyślna rola)
- **`admin`** - administrator z rozszerzonymi uprawnieniami

## Architektura

### Przechowywanie Ról

Role są przechowywane w natywnym polu `is_super_admin` w tabeli `auth.users` w Supabase. To wbudowane pole typu BOOLEAN.

```javascript
// Pole is_super_admin w auth.users
is_super_admin: true | false | null
```

**Ważne:**
- `is_super_admin = TRUE` = administrator
- `is_super_admin = FALSE` lub `NULL` = zwykły użytkownik (`user`)
- To natywne pole Supabase, automatycznie dostępne w JWT tokenie

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

- `getUserRole(user?)` - Pobiera rolę użytkownika z pola `is_super_admin`
  - Parametr `user` jest opcjonalny (domyślnie pobiera aktualnego użytkownika)
  - Sprawdza natywne pole `is_super_admin` w obiekcie użytkownika
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
4. Zaznacz checkbox **"Is Super Admin"**
5. Zapisz zmiany

**Metoda 2: SQL (dla wielu użytkowników)**

Przejdź do panelu Supabase → SQL Editor i wykonaj zapytanie:

```sql
-- Nadaj rolę admin dla konkretnego użytkownika
UPDATE auth.users
SET is_super_admin = TRUE
WHERE email = 'admin@example.com';
```

📄 **Więcej przykładów SQL:** Zobacz plik `/supabase/add_admin_role.sql` z gotowymi zapytaniami

### Odbieranie Roli Admin

W panelu Supabase odznacz checkbox "Is Super Admin" lub wykonaj SQL:

```sql
-- Usuń rolę admin (SQL)
UPDATE auth.users
SET is_super_admin = FALSE
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
-- Przykład: Tylko admin może edytować bazę wiedzy
CREATE POLICY "Admin can edit knowledge base"
ON knowledge_base_articles
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM auth.users WHERE is_super_admin = TRUE
  )
);

-- Przykład: Admin może widzieć dane wszystkich użytkowników
CREATE POLICY "Admin can view all user data"
ON user_sessions
FOR SELECT
USING (
  auth.uid() = user_id OR
  auth.uid() IN (
    SELECT id FROM auth.users WHERE is_super_admin = TRUE
  )
);
```

### Zabezpieczenie API Endpoints

Gdy będą dostępne endpointy tylko dla adminów (np. edycja wiki), należy dodać sprawdzanie roli:

```javascript
// api/admin-action.js
export default async function handler(req, res) {
  // Pobierz użytkownika z tokena
  const { data: { user }, error } = await supabase.auth.getUser(req.headers.authorization);
  
  // Sprawdź rolę
  if (!user?.is_super_admin) {
    return res.status(403).json({ error: 'Forbidden: Admin role required' });
  }
  
  // Wykonaj akcję admina
  // ...
}
```

## Planowane Funkcje dla Adminów

### 1. **Baza Wiedzy (Priorytet)**
- **Użytkownicy:** Mogą czytać artykuły z bazy wiedzy
- **Admin:** Może tworzyć, edytować i usuwać artykuły
- **Feature Flag:** `ENABLE_KNOWLEDGE_BASE`

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
  test('getUserRole returns "user" for non-admin', async () => {
    const user = { id: '123', email: 'test@test.com', is_super_admin: false };
    const role = await authService.getUserRole(user);
    expect(role).toBe('user');
  });
  
  test('getUserRole returns "admin" for super admin', async () => {
    const user = { 
      id: '123', 
      email: 'admin@test.com', 
      is_super_admin: true
    };
    const role = await authService.getUserRole(user);
    expect(role).toBe('admin');
  });
  
  test('isAdmin returns true for super admin', async () => {
    const user = { 
      id: '123', 
      email: 'admin@test.com', 
      is_super_admin: true
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

### Co się stanie, jeśli użytkownik zmieni `is_super_admin` w DevTools?

Użytkownik **nie może** zmienić `is_super_admin` w DevTools, ponieważ:
- To pole jest przechowywane w bazie danych, nie w przeglądarce
- Jest częścią JWT tokena, który jest podpisany przez serwer
- Każda próba manipulacji zostanie wykryta przez backend
- RLS policies sprawdzają rolę bezpośrednio w bazie danych

### Czy rola jest zapisywana w localStorage?

Nie. Rola jest przechowywana:
1. W bazie danych (`auth.users.is_super_admin`)
2. W JWT tokenie (automatycznie przez Supabase)
3. W pamięci aplikacji (`sessionManager.currentUserRole`) - cache

Jest pobierana z Supabase przy każdym logowaniu/odświeżeniu sesji.

### Jak debugować problemy z rolami?

```javascript
// W konsoli przeglądarki:

// Sprawdź aktualną rolę
sessionManager.getUserRole()

// Sprawdź czy admin
sessionManager.isAdmin()

// Sprawdź dane użytkownika
await authService.getCurrentUser()

// Sprawdź is_super_admin
const user = await authService.getCurrentUser();
console.log('Is super admin:', user?.is_super_admin);
```

## Historia Zmian

### v1.0 (2025-10-30)
- ✅ Dodano typy `UserRole`
- ✅ Zaimplementowano `getUserRole()` i `isAdmin()` w `auth-service.js`
- ✅ Dodano zarządzanie rolą w `session-manager.js`
- ✅ Zintegrowano z `app.js` (automatyczna inicjalizacja przy logowaniu)
- ✅ Dokumentacja systemu ról

### v1.1 (2025-10-30)
- ✅ Zmiana z `user_metadata.role` na natywne pole `is_super_admin`
- ✅ Aktualizacja RLS policies (prostsze i szybsze)
- ✅ Aktualizacja SQL scripts
- ✅ Aktualizacja dokumentacji

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

