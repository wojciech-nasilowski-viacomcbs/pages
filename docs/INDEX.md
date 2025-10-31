# 📚 Dokumentacja eTrener - Spis Treści

Witaj w dokumentacji projektu eTrener! Wszystkie dokumenty znajdują się w tym katalogu.

## 🎯 Dla Użytkowników

### Podstawowe dokumenty
- **[PRD.md](PRD.md)** - Product Requirements Document - pełny dokument wymagań produktowych
- **[TECH_STACK.md](TECH_STACK.md)** - Szczegóły techniczne i architektura systemu
- **[DATA_FORMAT.md](DATA_FORMAT.md)** - ⭐ **WAŻNE** - Dokładna specyfikacja formatów JSON dla quizów i treningów

### Formaty danych
- **[DATA_FORMAT_EMOJI_UPDATE.md](DATA_FORMAT_EMOJI_UPDATE.md)** - Aktualizacja formatu o emoji
- **[DATA_FORMAT_FIXES.md](DATA_FORMAT_FIXES.md)** - Poprawki i ulepszenia formatu danych
- **[MIGRATION_V1_V2.md](MIGRATION_V1_V2.md)** - Przewodnik migracji z wersji 1 do 2

### Funkcjonalności
- **[EMOJI_FEATURE_SUMMARY.md](EMOJI_FEATURE_SUMMARY.md)** - Podsumowanie funkcji emoji
- **[TTS_FEATURE.md](TTS_FEATURE.md)** - Text-to-Speech i funkcje audio
- **[LISTENING_STATUS.md](LISTENING_STATUS.md)** - Status implementacji funkcji słuchania
- **[KNOWLEDGE_BASE_QUICK_START.md](KNOWLEDGE_BASE_QUICK_START.md)** - 🚀 **SZYBKI START** - Jak edytować Bazę Wiedzy
- **[KNOWLEDGE_BASE_FEATURE.md](KNOWLEDGE_BASE_FEATURE.md)** - Baza Wiedzy - dokumentacja funkcji
- **[KNOWLEDGE_BASE_EDITOR.md](KNOWLEDGE_BASE_EDITOR.md)** - Edytor Bazy Wiedzy (Quill.js)
- **[KNOWLEDGE_BASE_FIX.md](KNOWLEDGE_BASE_FIX.md)** - 🔧 Fix: Feature flag nie działa na Vercel
- **[EMAIL_TEMPLATES.md](EMAIL_TEMPLATES.md)** - Szablony emaili

## 💻 Dla Deweloperów

### Architektura i wzorce
- **[STATE_MANAGEMENT.md](STATE_MANAGEMENT.md)** - 🆕 Dokumentacja reaktywnego systemu zarządzania stanem
- **[SESSION_CONTEXT.md](SESSION_CONTEXT.md)** - Kontekst sesji użytkownika
- **[SESSION_CONTEXT_V2.md](SESSION_CONTEXT_V2.md)** - Kontekst sesji v2

### Kod i typy
- **[JSDOC_TYPESCRIPT_SUMMARY.md](JSDOC_TYPESCRIPT_SUMMARY.md)** - Podsumowanie ulepszeń JSDoc i TypeScript
- **[TYPESCRIPT_MIGRATION.md](TYPESCRIPT_MIGRATION.md)** - Przewodnik migracji do TypeScript (opcjonalnie)
- **[CHANGELOG_JSDOC.md](CHANGELOG_JSDOC.md)** - Historia zmian w JSDoc

### Narzędzia DOM
- **[DOM_HELPERS_EXAMPLES.md](DOM_HELPERS_EXAMPLES.md)** - Szczegółowe przykłady użycia DOM helpers
- **[QUICK_START_DOM_HELPERS.md](QUICK_START_DOM_HELPERS.md)** - Szybki start z DOM helpers
- **[SOLUTION_SUMMARY.md](SOLUTION_SUMMARY.md)** - Podsumowanie rozwiązań

### Plany implementacji
- **[IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)** - Główny plan implementacji
- **[IMPLEMENTATION_PLAN_LISTENING.md](IMPLEMENTATION_PLAN_LISTENING.md)** - Plan implementacji funkcji słuchania

## 🚀 Deployment i Konfiguracja

### Deployment
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Ogólny przewodnik deploymentu
- **[VERCEL_SETUP.md](VERCEL_SETUP.md)** - Konfiguracja Vercel
- **[VERCEL_FEATURE_FLAGS_SETUP.md](VERCEL_FEATURE_FLAGS_SETUP.md)** - Ustawienie feature flags w Vercel

### Baza danych i backend
- **[DB_SCHEMA.md](DB_SCHEMA.md)** - Schemat bazy danych Supabase
- **[USER_ROLES.md](USER_ROLES.md)** - System ról użytkowników (admin/user)
- **[ADMIN_ROLE_SETUP.md](ADMIN_ROLE_SETUP.md)** - 🔧 **SETUP** - Konfiguracja roli admina (WYMAGANE)
- **[ADMIN_ROLE_DEBUG.md](ADMIN_ROLE_DEBUG.md)** - 🔍 Debug: Sprawdzanie roli admina
- **[AI_GENERATOR_DEBUG.md](AI_GENERATOR_DEBUG.md)** - Debugowanie generatora AI
- **[OPENROUTER_MODELS.md](OPENROUTER_MODELS.md)** - Dokumentacja modeli OpenRouter

### Feature Flags
- **[FEATURE_FLAGS.md](FEATURE_FLAGS.md)** - System flag funkcjonalności
- **[TAILWIND_CDN_WARNING.md](TAILWIND_CDN_WARNING.md)** - ⚠️ Ostrzeżenie o Tailwind CDN w produkcji

## 🔍 Szybkie odnośniki

### Chcę dodać nowy quiz/trening
→ Zobacz **[DATA_FORMAT.md](DATA_FORMAT.md)**

### Chcę zrozumieć architekturę
→ Zobacz **[TECH_STACK.md](TECH_STACK.md)** i **[STATE_MANAGEMENT.md](STATE_MANAGEMENT.md)**

### Chcę używać DOM helpers
→ Zobacz **[QUICK_START_DOM_HELPERS.md](QUICK_START_DOM_HELPERS.md)**

### Chcę wdrożyć aplikację
→ Zobacz **[DEPLOYMENT.md](DEPLOYMENT.md)** lub **[VERCEL_SETUP.md](VERCEL_SETUP.md)**

### Chcę zrozumieć typy JSDoc
→ Zobacz **[JSDOC_TYPESCRIPT_SUMMARY.md](JSDOC_TYPESCRIPT_SUMMARY.md)**

### Chcę debugować AI generator
→ Zobacz **[AI_GENERATOR_DEBUG.md](AI_GENERATOR_DEBUG.md)**

### Chcę edytować artykuły w Bazie Wiedzy
→ Zobacz **[KNOWLEDGE_BASE_QUICK_START.md](KNOWLEDGE_BASE_QUICK_START.md)**

---

## 📝 Konwencje dokumentacji

1. **Wszystkie pliki `.md`** (oprócz `README.md` i `LICENSE`) znajdują się w katalogu `/docs/`
2. **Nazwy plików** używają UPPERCASE i podkreśleń (np. `DATA_FORMAT.md`)
3. **Język**: Polski dla dokumentacji użytkownika, English dla dokumentacji technicznej (lub mieszany)
4. **Aktualizacje**: Przy zmianach w kodzie, aktualizuj odpowiednie dokumenty

---

**Powrót do**: [README.md](../README.md) (główna strona projektu)

