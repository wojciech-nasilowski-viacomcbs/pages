# Changelog: Knowledge Base Security Fix

**Data:** 2025-11-01  
**Wersja:** 2.1.1  
**Priorytet:** 🔴 KRYTYCZNY

## 🚨 Problem

Wykryto poważną lukę bezpieczeństwa w Row Level Security (RLS) dla tabeli `knowledge_base_articles`.

**Obecna sytuacja:**
- ❌ Niezalogowani użytkownicy mają pełny dostęp do opublikowanych artykułów
- ✅ Zalogowani użytkownicy mają dostęp do opublikowanych artykułów
- ✅ Admin ma pełny dostęp

**Wymagana sytuacja:**
- ❌ Niezalogowani: **BRAK DOSTĘPU**
- ✅ Zalogowani: **ODCZYT** opublikowanych artykułów
- ✅ Admin: **ODCZYT I EDYCJA** wszystkich artykułów

## ✅ Rozwiązanie

### 1. Nowe polityki RLS

#### Utworzono plik: `supabase/fix_kb_security.sql`

**Usunięte polityki:**
- ❌ `"Anyone can read published articles"` - pozwalała niezalogowanym na dostęp

**Nowe polityki:**
- ✅ `"Authenticated users can read published articles"` - tylko zalogowani
- ✅ `"Admin can read all articles"` - admin widzi wszystkie (w tym draft)
- ✅ `"Admin can create articles"` - tylko admin może tworzyć
- ✅ `"Admin can update articles"` - tylko admin może edytować
- ✅ `"Admin can delete articles"` - tylko admin może usuwać

### 2. Aktualizacja kodu aplikacji

#### Plik: `js/app.js`

**Zmiana 1:** Usunięto logikę "publicznych artykułów"

**Przed:**
```javascript
// Artykuły bazy wiedzy mogą być publiczne - nie wymagają logowania
const isPublicArticle = type === 'article' && slug;

if (!state.currentUser && !isPublicArticle) {
  // ...
}
```

**Po:**
```javascript
// Wszystkie treści (w tym artykuły) wymagają logowania
if (!state.currentUser) {
  uiManager.showError(`Zaloguj się, aby otworzyć udostępniony ${contentTypeName}`, elements);
  return false;
}
```

#### Plik: `js/feature-flags.js`

**Zmiana 2:** Ukrycie zakładki Bazy Wiedzy dla niezalogowanych użytkowników

**Przed:**
```javascript
export function getEnabledTabs() {
  // ...
  if (getFlag('ENABLE_KNOWLEDGE_BASE')) tabs.push('knowledge-base');
  // ...
}
```

**Po:**
```javascript
export function getEnabledTabs() {
  // Sprawdź czy użytkownik jest zalogowany (dla Bazy Wiedzy)
  const isAuthenticated = window.state?.currentUser != null;
  
  // Baza Wiedzy wymaga logowania
  if (getFlag('ENABLE_KNOWLEDGE_BASE') && isAuthenticated) tabs.push('knowledge-base');
  // ...
}
```

**Efekt:** Zakładka "Baza Wiedzy" nie pojawia się w tab barze dla niezalogowanych użytkowników, zachowując spójność z landing page.

#### Plik: `js/ui-manager.js`

**Zmiana 3:** Odświeżanie tab bara po zmianie stanu autentykacji

**Przed:**
```javascript
updateAuthUI(state, elements, contentManager, sessionManager) {
  // ... aktualizacja menu ...
  
  // Odśwież widok
  if (contentManager) {
    contentManager.renderCards(state, elements, this, sessionManager);
  }
}
```

**Po:**
```javascript
updateAuthUI(state, elements, contentManager, sessionManager) {
  // ... aktualizacja menu ...
  
  // Odśwież tab bar (niektóre zakładki wymagają logowania, np. Baza Wiedzy)
  if (window.applyFeatureFlags) {
    window.applyFeatureFlags(elements);
  }
  
  // Odśwież widok
  if (contentManager) {
    contentManager.renderCards(state, elements, this, sessionManager);
  }
}
```

#### Plik: `js/content-manager.js`

**Zmiana 4:** Dodano sprawdzenie autentykacji w `loadKnowledgeBaseArticles()` (fallback)

**Przed:**
```javascript
async loadKnowledgeBaseArticles(sessionManager) {
  // Pokaż loader
  if (loader) loader.classList.remove('hidden');
  
  try {
    const dataService = window.dataService;
    // ... ładowanie artykułów
  }
}
```

**Po:**
```javascript
async loadKnowledgeBaseArticles(sessionManager) {
  // SPRAWDŹ CZY UŻYTKOWNIK JEST ZALOGOWANY
  const currentUser = window.state?.currentUser;
  if (!currentUser) {
    // Pokaż komunikat o konieczności zalogowania
    emptyState.innerHTML = `
      <div class="text-center py-12">
        <div class="text-6xl mb-4">🔒</div>
        <h3 class="text-xl font-bold text-gray-300 mb-2">Wymagane logowanie</h3>
        <p class="text-gray-400 mb-6">Zaloguj się, aby przeglądać bazę wiedzy</p>
        <button onclick="document.getElementById('login-button').click()" 
                class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition">
          Zaloguj się
        </button>
      </div>
    `;
    return;
  }
  
  // ... ładowanie artykułów
}
```

### 3. Zabezpieczenie funkcji inkrementacji wyświetleń

**Zmiana:** Funkcja `increment_kb_article_views()` wymaga teraz autentykacji

**Przed:**
```sql
GRANT EXECUTE ON FUNCTION increment_kb_article_views(UUID) TO public;
GRANT EXECUTE ON FUNCTION increment_kb_article_views(UUID) TO anon;
```

**Po:**
```sql
REVOKE EXECUTE ON FUNCTION increment_kb_article_views(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION increment_kb_article_views(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION increment_kb_article_views(UUID) TO authenticated;
```

## 📊 Macierz dostępu

| Akcja | Niezalogowany | Zalogowany | Admin |
|-------|---------------|------------|-------|
| **SELECT (published)** | ❌ | ✅ | ✅ |
| **SELECT (all)** | ❌ | ❌ | ✅ |
| **INSERT** | ❌ | ❌ | ✅ |
| **UPDATE** | ❌ | ❌ | ✅ |
| **DELETE** | ❌ | ❌ | ✅ |
| **increment_kb_article_views()** | ❌ | ✅ | ✅ |

## 🚀 Wdrożenie

### Krok 1: Backup
```bash
# W Supabase Dashboard: Settings → Database → Backups → Create backup
```

### Krok 2: Uruchom migrację
```sql
-- W Supabase SQL Editor uruchom zawartość pliku:
-- supabase/fix_kb_security.sql
```

### Krok 3: Deploy kodu aplikacji
```bash
git add .
git commit -m "fix: secure knowledge base with proper RLS policies"
git push origin main
```

### Krok 4: Weryfikacja
```sql
-- Sprawdź polityki
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'knowledge_base_articles'
ORDER BY policyname;

-- Oczekiwany wynik: 5 polityk
```

## 🧪 Testy

### Test 1: Niezalogowany użytkownik
```javascript
// Bez logowania
const { data, error } = await supabase
  .from('knowledge_base_articles')
  .select('*');

// Oczekiwany wynik: error (row-level security)
console.assert(error !== null, 'Niezalogowany NIE powinien mieć dostępu');
```

### Test 2: Zalogowany użytkownik
```javascript
// Po zalogowaniu (nie admin)
const { data, error } = await supabase
  .from('knowledge_base_articles')
  .select('*')
  .eq('is_published', true);

// Oczekiwany wynik: data (artykuły opublikowane)
console.assert(data.length > 0, 'Zalogowany powinien widzieć opublikowane');
```

### Test 3: Admin
```javascript
// Po zalogowaniu jako admin
const { data, error } = await supabase
  .from('knowledge_base_articles')
  .select('*');

// Oczekiwany wynik: data (wszystkie artykuły)
console.assert(data.length > 0, 'Admin powinien widzieć wszystkie');
```

### Test 4: Deep link dla niezalogowanego
```
1. Otwórz: https://etrener.app/?type=article&slug=test
2. Oczekiwany wynik: Landing page z komunikatem "Zaloguj się, aby otworzyć udostępniony artykuł"
```

## 📝 Pliki zmodyfikowane

1. **`supabase/fix_kb_security.sql`** (nowy) - Migracja RLS
2. **`js/app.js`** - Usunięto logikę publicznych artykułów
3. **`js/feature-flags.js`** - Ukrycie zakładki KB dla niezalogowanych
4. **`js/ui-manager.js`** - Odświeżanie tab bara po zmianie autentykacji
5. **`js/content-manager.js`** - Sprawdzenie autentykacji w loadKnowledgeBaseArticles() (fallback)
6. **`__tests__/knowledge-base-auth-guard.test.js`** (nowy) - Testy zabezpieczeń (11 testów)
7. **`__tests__/knowledge-base-tab-visibility.test.js`** (nowy) - Testy widoczności zakładki (15 testów)
8. **`docs/KB_SECURITY_FIX.md`** (nowy) - Dokumentacja techniczna
9. **`docs/CHANGELOG_KB_SECURITY.md`** (ten plik) - Changelog
10. **`supabase/DEPLOY_KB_SECURITY.md`** (nowy) - Instrukcja wdrożenia

## ✨ Ulepszenia UX

### Spójność zachowania dla niezalogowanych użytkowników

**Problem:** Niezalogowani użytkownicy widzieli zakładkę "Baza Wiedzy" w tab barze, ale po kliknięciu widzieli pełny interfejs z filtrami i dopiero w środku komunikat o konieczności logowania. To było niespójne z landing page, który pokazuje minimalistyczny ekran zachęcający do logowania.

**Rozwiązanie:** Zakładka "Baza Wiedzy" jest teraz całkowicie ukryta dla niezalogowanych użytkowników, podobnie jak inne moduły wymagające autentykacji.

**Efekt:**
- ✅ Spójne doświadczenie użytkownika
- ✅ Brak mylących interfejsów (filtrów, wyszukiwarek) dla niezalogowanych
- ✅ Jasna komunikacja: landing page → logowanie → dostęp do treści
- ✅ Zakładka pojawia się automatycznie po zalogowaniu

## ⚠️ Breaking Changes

### 1. Zakładka Bazy Wiedzy ukryta dla gości
**Przed:** Zakładka widoczna, po kliknięciu komunikat o logowaniu  
**Po:** Zakładka całkowicie ukryta dla niezalogowanych

**Wpływ:** Niezalogowani użytkownicy nie zobaczą zakładki "Baza Wiedzy" w tab barze. Po zalogowaniu zakładka pojawi się automatycznie.

### 2. Deep linki wymagają logowania
**Przed:** `?type=article&slug=xxx` działało dla wszystkich  
**Po:** Wymaga zalogowania, w przeciwnym razie pokazuje landing page

### 3. API calls wymagają autentykacji
**Przed:**
```javascript
const { data } = await supabase
  .from('knowledge_base_articles')
  .select('*');
// Działało bez logowania
```

**Po:**
```javascript
const { data, error } = await supabase
  .from('knowledge_base_articles')
  .select('*');
// error: "row-level security policy violation" bez logowania
```

### 4. Funkcja increment_kb_article_views wymaga auth
**Przed:** Działała dla wszystkich (anon, authenticated)  
**Po:** Tylko dla authenticated

## 🐛 Znane problemy

### Problem: SEO - Google nie zindeksuje artykułów
**Status:** Akceptowalne  
**Uzasadnienie:** Content premium wymaga logowania  
**Możliwe rozwiązania (przyszłość):**
- Dodać publiczne preview (pierwsze 200 znaków)
- Stworzyć osobną tabelę dla publicznych artykułów
- Dodać politykę dla botów (identyfikacja User-Agent)

## 📊 Statystyki

- **Polityk RLS usuniętych:** 7
- **Polityk RLS dodanych:** 5
- **Linii kodu zmienionych:** ~150
- **Plików zmodyfikowanych:** 5 (app.js, feature-flags.js, ui-manager.js, content-manager.js, fix_kb_security.sql)
- **Testów dodanych:** 26 (11 auth-guard + 15 tab-visibility)
- **Dokumentacji utworzonej:** 3 pliki (KB_SECURITY_FIX.md, CHANGELOG_KB_SECURITY.md, DEPLOY_KB_SECURITY.md)

## 🔗 Powiązane dokumenty

- `/supabase/fix_kb_security.sql` - Skrypt migracji
- `/docs/KB_SECURITY_FIX.md` - Dokumentacja techniczna
- `/docs/DB_SCHEMA.md` - Schemat bazy danych
- `/docs/USER_ROLES.md` - Role użytkowników

## ✅ Checklist wdrożenia

- [ ] Backup bazy danych
- [ ] Uruchom migrację SQL
- [ ] Deploy kodu aplikacji
- [ ] Test 1: Niezalogowany NIE ma dostępu
- [ ] Test 2: Zalogowany MA dostęp do published
- [ ] Test 3: Admin MA dostęp do wszystkich
- [ ] Test 4: Deep link wymaga logowania
- [ ] Monitoring przez 24h

---

**Status:** ⚠️ **WYMAGA WDROŻENIA**  
**Priorytet:** 🔴 **KRYTYCZNY**  
**Autor:** AI Assistant  
**Data:** 2025-11-01

