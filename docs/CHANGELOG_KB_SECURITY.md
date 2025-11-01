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

#### Plik: `js/feature-flags.js`

**Zmiana 1:** Wszystkie moduły wymagają logowania

**Przed:**
```javascript
export function getEnabledTabs() {
  // ...
  if (getFlag('ENABLE_WORKOUTS')) tabs.push('workouts');
  if (getFlag('ENABLE_KNOWLEDGE_BASE')) tabs.push('knowledge-base');
  if (getFlag('ENABLE_QUIZZES')) tabs.push('quizzes');
  if (getFlag('ENABLE_LISTENING')) tabs.push('listening');
}
```

**Po:**
```javascript
export function getEnabledTabs() {
  // Sprawdź czy użytkownik jest zalogowany
  const isAuthenticated = window.state?.currentUser !== null && window.state?.currentUser !== undefined;
  
  // Wszystkie moduły wymagają logowania
  if (getFlag('ENABLE_WORKOUTS') && isAuthenticated) tabs.push('workouts');
  if (getFlag('ENABLE_KNOWLEDGE_BASE') && isAuthenticated) tabs.push('knowledge-base');
  if (getFlag('ENABLE_QUIZZES') && isAuthenticated) tabs.push('quizzes');
  if (getFlag('ENABLE_LISTENING') && isAuthenticated) tabs.push('listening');
  
  // Funkcje dodatkowe - również wymagają logowania
  const hasImport = getFlag('ENABLE_FILE_IMPORT') && isAuthenticated;
  const hasAI = getFlag('ENABLE_AI_GENERATOR') && isAuthenticated;
}
```

**Efekt:** Wszystkie zakładki (w tym Import i AI Generator) są ukryte dla niezalogowanych użytkowników.

#### Plik: `js/app.js`

**Zmiana 2:** Dynamiczne pokazywanie/ukrywanie zakładek

**Przed:**
```javascript
function applyFeatureFlags(elements) {
  if (!featureFlags.isKnowledgeBaseEnabled()) {
    elements.tabKnowledgeBase.classList.add('hidden');
  } else {
    elements.tabKnowledgeBase.classList.remove('hidden');
  }
}
```

**Po:**
```javascript
function applyFeatureFlags(elements) {
  const enabledTabs = featureFlags.getEnabledTabs();
  
  // enabledTabs uwzględnia już autentykację użytkownika
  if (enabledTabs.includes('knowledge-base')) {
    elements.tabKnowledgeBase.classList.remove('hidden');
  } else {
    elements.tabKnowledgeBase.classList.add('hidden');
  }
}
```

#### Plik: `js/ui-manager.js`

**Zmiana 3:** Odświeżanie tab bara po zmianie autentykacji

**Po:**
```javascript
updateAuthUI(state, elements, contentManager, sessionManager) {
  // ... aktualizacja menu ...
  
  // Odśwież tab bar (zakładki zależą od autentykacji)
  if (window.applyFeatureFlags) {
    window.applyFeatureFlags(elements);
  }
  
  // Odśwież widok
  if (contentManager) {
    contentManager.renderCards(state, elements, this, sessionManager);
  }
}
```

#### Plik: `js/app.js`

**Zmiana 4:** Usunięto logikę "publicznych artykułów"

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
2. **`js/feature-flags.js`** - Ukrywanie zakładek dla niezalogowanych
3. **`js/app.js`** - Dynamiczne pokazywanie/ukrywanie zakładek + usunięto logikę publicznych artykułów
4. **`js/ui-manager.js`** - Odświeżanie tab bara po zmianie autentykacji
5. **`docs/KB_SECURITY_FIX.md`** (nowy) - Dokumentacja techniczna
6. **`docs/CHANGELOG_KB_SECURITY.md`** (ten plik) - Changelog
7. **`supabase/DEPLOY_KB_SECURITY.md`** (nowy) - Instrukcja wdrożenia

## ✨ Zachowanie UI

### Ukrywanie zakładek dla niezalogowanych użytkowników

**Zachowanie:** 
- **Niezalogowani:** NIE widzą żadnych zakładek w tab barze, tylko landing page z zachętą do logowania
- **Zalogowani:** Widzą wszystkie zakładki i mają pełny dostęp do treści

**Moduły wymagające logowania:**
- ✅ Treningi
- ✅ Baza Wiedzy
- ✅ Quizy
- ✅ Słuchanie
- ✅ Import treści
- ✅ Generator AI
- ✅ Więcej (zakładka)

**Efekt:**
- ✅ Proste i intuicyjne doświadczenie użytkownika
- ✅ Brak mylących zakładek bez dostępu do treści
- ✅ Jasna komunikacja: landing page → logowanie → pojawienie się zakładek
- ✅ Zabezpieczenie na poziomie UI i RLS w bazie danych
- ✅ Wszystkie funkcje (w tym Import i AI) wymagają logowania

## ⚠️ Breaking Changes

### 1. Deep linki wymagają logowania
**Przed:** `?type=article&slug=xxx` działało dla wszystkich  
**Po:** Wymaga zalogowania, w przeciwnym razie pokazuje landing page

### 2. API calls wymagają autentykacji
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

### 3. Funkcja increment_kb_article_views wymaga auth
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
- **Linii kodu zmienionych:** ~80
- **Plików zmodyfikowanych:** 4 (feature-flags.js, app.js, ui-manager.js, fix_kb_security.sql)
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

