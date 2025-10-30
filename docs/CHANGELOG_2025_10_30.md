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

**Data:** 30 października 2025  
**Wersja:** 2.0.1  
**Status:** ✅ Gotowe do deploy

