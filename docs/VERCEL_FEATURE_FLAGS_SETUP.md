# ⚡ Szybka Instrukcja: Feature Flags na Vercel

## 🎯 Aby włączyć WSZYSTKIE funkcje na produkcji:

### 1. Wejdź do Vercel Dashboard
```
https://vercel.com/dashboard
→ Wybierz projekt
→ Settings
→ Environment Variables
```

### 2. Dodaj te zmienne środowiskowe:

```bash
# Główne moduły
FF_ENABLE_QUIZZES=true
FF_ENABLE_WORKOUTS=true
FF_ENABLE_LISTENING=true

# Funkcje dodatkowe
FF_ENABLE_FILE_IMPORT=true
FF_ENABLE_AI_GENERATOR=true

# API Key dla AI (opcjonalnie, jeśli chcesz używać generatora)
OPENROUTER_API_KEY=sk-or-v1-twoj-klucz-tutaj
```

### 3. Dla każdej zmiennej zaznacz:
- ✅ Production
- ✅ Preview (opcjonalnie)
- ✅ Development (opcjonalnie)

### 4. Kliknij "Save"

### 5. Redeploy aplikacji:
```
Deployments → ⋯ (przy ostatnim deploymencie) → Redeploy
```

---

## ✅ Gotowe!

Po redeploy wszystkie funkcje będą aktywne.

---

## 🔧 Wyłączanie konkretnych funkcji

Aby wyłączyć konkretną funkcję, ustaw jej wartość na `false`:

```bash
FF_ENABLE_AI_GENERATOR=false
```

Lub po prostu usuń zmienną (domyślnie będzie wyłączona).

---

## 📖 Pełna Dokumentacja

Zobacz `FEATURE_FLAGS.md` dla szczegółowych informacji.

