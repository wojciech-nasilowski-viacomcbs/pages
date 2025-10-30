# Feature Flags - Dokumentacja

System flag funkcyjnych pozwala na dynamiczne włączanie i wyłączanie funkcji aplikacji bez zmian w kodzie.

## 📋 Dostępne Flagi

### Główne Moduły
- `ENABLE_QUIZZES` - Moduł quizów
- `ENABLE_WORKOUTS` - Moduł treningów
- `ENABLE_LISTENING` - Moduł nauki przez słuchanie
- `ENABLE_KNOWLEDGE_BASE` - Baza Wiedzy (artykuły edukacyjne)

### Funkcje Dodatkowe
- `ENABLE_FILE_IMPORT` - Import treści z plików JSON
- `ENABLE_AI_GENERATOR` - Generator treści przez AI

---

## 🔧 Konfiguracja Lokalna

### Plik `js/config.js`

Edytuj sekcję `FEATURE_FLAGS` w pliku `js/config.js`:

```javascript
window.APP_CONFIG = {
    SUPABASE_URL: 'https://your-project.supabase.co',
    SUPABASE_ANON_KEY: 'your-anon-key',
    OPENROUTER_API_KEY: 'your-openrouter-key',
    
    FEATURE_FLAGS: {
        // Główne moduły
        ENABLE_QUIZZES: true,         // ✅ Włączone
        ENABLE_WORKOUTS: false,       // ❌ Wyłączone
        ENABLE_LISTENING: true,       // ✅ Włączone
        ENABLE_KNOWLEDGE_BASE: true,  // ✅ Włączone

        // Funkcje dodatkowe
        ENABLE_FILE_IMPORT: true,     // ✅ Włączone
        ENABLE_AI_GENERATOR: false    // ❌ Wyłączone
    }
};
```

### Zachowanie Domyślne (Development)

Gdy pracujesz lokalnie (`localhost` lub `file://`):
- **Niezdefiniowana flaga = `true` (włączona)**
- Wszystkie funkcje są domyślnie dostępne dla wygody developmentu

---

## 🚀 Konfiguracja na Vercel (Produkcja)

### Krok 1: Otwórz Ustawienia Projektu

1. Zaloguj się do [Vercel Dashboard](https://vercel.com/dashboard)
2. Wybierz swój projekt
3. Przejdź do **Settings** → **Environment Variables**

### Krok 2: Dodaj Zmienne Środowiskowe

Dodaj następujące zmienne z prefiksem `FF_`:

#### ✅ Aby włączyć WSZYSTKIE funkcje na produkcji:

```
FF_ENABLE_QUIZZES=true
FF_ENABLE_WORKOUTS=true
FF_ENABLE_LISTENING=true
FF_ENABLE_KNOWLEDGE_BASE=true
FF_ENABLE_FILE_IMPORT=true
FF_ENABLE_AI_GENERATOR=true
```

#### Opcjonalnie: Klucz API dla generatora AI

```
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

### Krok 3: Wybierz Środowisko

Dla każdej zmiennej wybierz środowiska, w których ma być aktywna:
- ✅ **Production** - środowisko produkcyjne
- ⬜ **Preview** - środowisko testowe (pull requesty)
- ⬜ **Development** - środowisko deweloperskie

**Zalecenie:** Zaznacz wszystkie trzy, aby flagi działały wszędzie.

### Krok 4: Redeploy

Po dodaniu zmiennych środowiskowych:
1. Przejdź do zakładki **Deployments**
2. Kliknij **⋯** (trzy kropki) przy ostatnim deploymencie
3. Wybierz **Redeploy**
4. Potwierdź operację

---

## 🔒 Zachowanie Domyślne (Production)

Gdy aplikacja działa na produkcji (np. `your-app.vercel.app`):
- **Niezdefiniowana flaga = `false` (wyłączona)**
- Każda funkcja musi być **jawnie włączona** przez zmienną środowiskową
- W konsoli przeglądarki zobaczysz ostrzeżenia o niezdefiniowanych flagach

**Przykład:**
```
⚠️ Feature flag "ENABLE_QUIZZES" nie jest zdefiniowana na produkcji - domyślnie WYŁĄCZONA
```

---

## 📊 Przykłady Konfiguracji

### Przykład 1: Tylko Quizy i Treningi

**Vercel Environment Variables:**
```
FF_ENABLE_QUIZZES=true
FF_ENABLE_WORKOUTS=true
FF_ENABLE_LISTENING=false
FF_ENABLE_FILE_IMPORT=false
FF_ENABLE_AI_GENERATOR=false
```

**Rezultat:** 
- Tab bar pokazuje 2 zakładki: Quizy, Treningi
- Brak zakładki "Więcej"

---

### Przykład 2: Wszystko oprócz AI

**Vercel Environment Variables:**
```
FF_ENABLE_QUIZZES=true
FF_ENABLE_WORKOUTS=true
FF_ENABLE_LISTENING=true
FF_ENABLE_FILE_IMPORT=true
FF_ENABLE_AI_GENERATOR=false
```

**Rezultat:**
- Tab bar: Quizy, Treningi, Słuchanie, Import
- Brak zakładki "Więcej" (wszystko się zmieściło)

---

### Przykład 3: Wszystko włączone

**Vercel Environment Variables:**
```
FF_ENABLE_QUIZZES=true
FF_ENABLE_WORKOUTS=true
FF_ENABLE_LISTENING=true
FF_ENABLE_FILE_IMPORT=true
FF_ENABLE_AI_GENERATOR=true
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

**Rezultat:**
- Tab bar: Quizy, Treningi, Słuchanie, Więcej
- W zakładce "Więcej": Import, AI Generator

---

## 🎯 Logika Wyświetlania Zakładek

System automatycznie optymalizuje tab bar:

1. **Główne moduły** (Quizy, Treningi, Słuchanie) - zawsze w tab barze
2. **Funkcje dodatkowe** (Import, AI):
   - Jeśli jest miejsce (max 4 zakładki) → pokazują się bezpośrednio w tab barze
   - Jeśli brak miejsca → trafiają do zakładki "Więcej"

**Przykłady:**
- 2 moduły + Import → 3 zakładki (bez "Więcej")
- 3 moduły + Import → 4 zakładki (bez "Więcej")
- 3 moduły + Import + AI → 4 zakładki (Quizy, Treningi, Słuchanie, Więcej)

---

## 🐛 Debugowanie

### Sprawdź Aktywne Flagi

Otwórz konsolę przeglądarki (F12) i wpisz:

```javascript
// Sprawdź wszystkie włączone zakładki
featureFlags.getEnabledTabs()

// Sprawdź konkretną flagę
featureFlags.isQuizzesEnabled()
featureFlags.isAIGeneratorEnabled()

// Sprawdź środowisko
console.log(window.location.hostname)
```

### Logi Startowe

Przy starcie aplikacji w konsoli zobaczysz:

```
✅ Feature flags initialized (PRODUCTION mode)
🔒 Niezdefiniowane flagi domyślnie WYŁĄCZONE
```

lub

```
✅ Feature flags initialized (DEVELOPMENT mode)
🔧 Niezdefiniowane flagi domyślnie WŁĄCZONE
```

---

## 📝 Najlepsze Praktyki

### ✅ DO:
- Zawsze definiuj flagi jawnie na produkcji
- Testuj różne kombinacje flag przed wdrożeniem
- Dokumentuj zmiany w flagach w commit messages
- Używaj Preview Deployments do testowania nowych flag

### ❌ DON'T:
- Nie polegaj na domyślnych wartościach na produkcji
- Nie commituj wrażliwych danych (API keys) do repozytorium
- Nie wyłączaj wszystkich modułów jednocześnie (użytkownicy zobaczą pustą stronę)

---

## 🔄 Aktualizacja Flag bez Redeploy

**Ważne:** Zmiana zmiennych środowiskowych na Vercel **wymaga redeploy**.

Jeśli chcesz zmieniać flagi bez redeploy, rozważ:
1. Użycie zewnętrznego serwisu do zarządzania flagami (np. LaunchDarkly, Flagsmith)
2. Przechowywanie flag w bazie danych (Supabase)
3. Endpoint API zwracający aktualną konfigurację

---

## 📞 Wsparcie

W razie problemów:
1. Sprawdź logi w konsoli przeglądarki
2. Zweryfikuj zmienne środowiskowe w Vercel Dashboard
3. Upewnij się, że wykonałeś redeploy po zmianach
4. Sprawdź czy nie ma konfliktów w `js/config.js` (lokalnie)

---

**Ostatnia aktualizacja:** 2025-01-28

