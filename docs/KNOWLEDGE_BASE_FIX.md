# 🔧 Fix: Feature Flag ENABLE_KNOWLEDGE_BASE nie działa na Vercel

## Problem

W konsoli Vercel widzisz wielokrotne ostrzeżenia:

```
⚠️ Feature flag "ENABLE_KNOWLEDGE_BASE" nie jest zdefiniowana na produkcji 
- domyślnie WYŁĄCZONA
```

Mimo że w panelu Vercel masz ustawioną zmienną `ENABLE_KNOWLEDGE_BASE=true`.

## Przyczyna

Skrypt `scripts/generate-config.js` **nie zawierał obsługi** zmiennej `FF_ENABLE_KNOWLEDGE_BASE`.

Zmienne środowiskowe w Vercel muszą mieć prefix `FF_` (Feature Flag), ale skrypt nie czytał tej zmiennej.

## ✅ Rozwiązanie

### 1. Zaktualizowano skrypt `generate-config.js`

Dodano obsługę `FF_ENABLE_KNOWLEDGE_BASE`:

```javascript
// Feature Flags with FF_ prefix
const FF_ENABLE_QUIZZES = process.env.FF_ENABLE_QUIZZES;
const FF_ENABLE_WORKOUTS = process.env.FF_ENABLE_WORKOUTS;
const FF_ENABLE_LISTENING = process.env.FF_ENABLE_LISTENING;
const FF_ENABLE_KNOWLEDGE_BASE = process.env.FF_ENABLE_KNOWLEDGE_BASE; // ✅ DODANO
const FF_ENABLE_FILE_IMPORT = process.env.FF_ENABLE_FILE_IMPORT;
const FF_ENABLE_AI_GENERATOR = process.env.FF_ENABLE_AI_GENERATOR;
```

I w generowanym config:

```javascript
FEATURE_FLAGS: {
    ENABLE_QUIZZES: ${FF_ENABLE_QUIZZES !== undefined ? FF_ENABLE_QUIZZES : 'true'},
    ENABLE_WORKOUTS: ${FF_ENABLE_WORKOUTS !== undefined ? FF_ENABLE_WORKOUTS : 'true'},
    ENABLE_LISTENING: ${FF_ENABLE_LISTENING !== undefined ? FF_ENABLE_LISTENING : 'true'},
    ENABLE_KNOWLEDGE_BASE: ${FF_ENABLE_KNOWLEDGE_BASE !== undefined ? FF_ENABLE_KNOWLEDGE_BASE : 'true'}, // ✅ DODANO
    ENABLE_FILE_IMPORT: ${FF_ENABLE_FILE_IMPORT !== undefined ? FF_ENABLE_FILE_IMPORT : 'true'},
    ENABLE_AI_GENERATOR: ${FF_ENABLE_AI_GENERATOR !== undefined ? FF_ENABLE_AI_GENERATOR : 'true'}
}
```

### 2. Zaktualizowano dokumentację

Dodano `FF_ENABLE_KNOWLEDGE_BASE` do:
- `docs/FEATURE_FLAGS.md`
- `docs/VERCEL_FEATURE_FLAGS_SETUP.md`

---

## 📋 Kroki do naprawy na Vercel

### Krok 1: Sprawdź nazwę zmiennej w Vercel

W panelu Vercel (Settings → Environment Variables) zmień:

❌ **BŁĘDNIE:**
```
ENABLE_KNOWLEDGE_BASE=true
```

✅ **POPRAWNIE:**
```
FF_ENABLE_KNOWLEDGE_BASE=true
```

**UWAGA:** Nazwa zmiennej **MUSI** mieć prefix `FF_`!

### Krok 2: Usuń starą zmienną (jeśli istnieje)

Jeśli masz zmienną `ENABLE_KNOWLEDGE_BASE` (bez `FF_`), usuń ją.

### Krok 3: Dodaj nową zmienną

1. Kliknij **Add New**
2. **Name:** `FF_ENABLE_KNOWLEDGE_BASE`
3. **Value:** `true`
4. **Environments:** Zaznacz:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. Kliknij **Save**

### Krok 4: Redeploy

1. Przejdź do **Deployments**
2. Kliknij **⋯** przy ostatnim deploymencie
3. Wybierz **Redeploy**
4. Poczekaj na zakończenie build

### Krok 5: Weryfikacja

Po redeploy sprawdź konsolę przeglądarki:

✅ **Powinno być:**
```
✅ Feature flags initialized (PRODUCTION mode)
🔒 Niezdefiniowane flagi domyślnie WYŁĄCZONE
```

❌ **NIE powinno być:**
```
⚠️ Feature flag "ENABLE_KNOWLEDGE_BASE" nie jest zdefiniowana na produkcji
```

---

## 🎯 Pełna lista zmiennych Feature Flags dla Vercel

Upewnij się, że masz **wszystkie** te zmienne z prefiksem `FF_`:

```bash
# Główne moduły
FF_ENABLE_QUIZZES=true
FF_ENABLE_WORKOUTS=true
FF_ENABLE_LISTENING=true
FF_ENABLE_KNOWLEDGE_BASE=true  # ✅ Ta była brakująca!

# Funkcje dodatkowe
FF_ENABLE_FILE_IMPORT=true
FF_ENABLE_AI_GENERATOR=true
```

---

## 🔍 Jak to działa?

### 1. Build na Vercel

Gdy Vercel buduje aplikację:

```bash
npm run build
```

### 2. Skrypt `generate-config.js`

Skrypt czyta zmienne środowiskowe z prefiksem `FF_`:

```javascript
const FF_ENABLE_KNOWLEDGE_BASE = process.env.FF_ENABLE_KNOWLEDGE_BASE;
```

### 3. Generuje `js/config.js`

Tworzy plik konfiguracyjny:

```javascript
window.APP_CONFIG = {
    SUPABASE_URL: '...',
    SUPABASE_ANON_KEY: '...',
    FEATURE_FLAGS: {
        ENABLE_KNOWLEDGE_BASE: true  // ✅ Bez prefiksu w finalnym config
    }
};
```

### 4. Aplikacja czyta config

W `js/feature-flags.js`:

```javascript
function getFlag(key) {
    const flags = window.APP_CONFIG?.FEATURE_FLAGS;
    return flags[key];  // Szuka "ENABLE_KNOWLEDGE_BASE" (bez FF_)
}
```

---

## ❓ FAQ

### Dlaczego zmienne mają prefix `FF_`?

Aby odróżnić feature flags od innych zmiennych środowiskowych (np. `SUPABASE_URL`).

### Czy mogę użyć `ENABLE_KNOWLEDGE_BASE` zamiast `FF_ENABLE_KNOWLEDGE_BASE`?

**Nie.** Skrypt `generate-config.js` szuka zmiennych z prefiksem `FF_`.

### Co jeśli nie dodam `FF_ENABLE_KNOWLEDGE_BASE`?

Baza Wiedzy będzie **wyłączona** na produkcji (domyślnie niezdefiniowane flagi są wyłączone).

### Czy muszę redeploy po dodaniu zmiennej?

**Tak.** Zmienne środowiskowe są wczytywane podczas build, nie runtime.

---

## ✅ Checklist

- [x] Zaktualizowano `scripts/generate-config.js`
- [x] Zaktualizowano `docs/FEATURE_FLAGS.md`
- [x] Zaktualizowano `docs/VERCEL_FEATURE_FLAGS_SETUP.md`
- [ ] Dodano `FF_ENABLE_KNOWLEDGE_BASE=true` w Vercel
- [ ] Usunięto starą zmienną `ENABLE_KNOWLEDGE_BASE` (jeśli istniała)
- [ ] Wykonano redeploy
- [ ] Zweryfikowano w konsoli przeglądarki

---

**Status:** ✅ Naprawione w kodzie - wymaga aktualizacji w Vercel

**Data:** 2025-10-30

