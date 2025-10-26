# Konfiguracja Vercel - Environment Variables

## Wymagane zmienne środowiskowe na Vercel

Po wdrożeniu aplikacji na Vercel, musisz skonfigurować następujące zmienne środowiskowe:

### 1. Przejdź do Vercel Dashboard
- Otwórz projekt na https://vercel.com
- Przejdź do **Settings** → **Environment Variables**

### 2. Dodaj następujące zmienne:

#### OpenRouter API Key (WYMAGANE dla AI Generator)
```
Name: OPENROUTER_API_KEY
Value: sk-or-v1-twój-klucz-api
Environment: Production, Preview, Development
```

Klucz możesz wygenerować na: https://openrouter.ai/keys

#### Supabase URL (WYMAGANE)
```
Name: VITE_SUPABASE_URL
Value: https://twoj-projekt.supabase.co
Environment: Production, Preview, Development
```

#### Supabase Anon Key (WYMAGANE)
```
Name: VITE_SUPABASE_ANON_KEY
Value: twój-anon-key
Environment: Production, Preview, Development
```

### 3. Redeploy aplikacji

Po dodaniu zmiennych środowiskowych, wykonaj redeploy:
- Przejdź do **Deployments**
- Kliknij na ostatni deployment
- Kliknij **Redeploy**

## Jak to działa?

### Lokalnie (development)
- Aplikacja używa pliku `js/config.js` (nie jest w repo)
- API key jest bezpośrednio w przeglądarce
- Wywołania idą bezpośrednio do OpenRouter API

### Na produkcji (Vercel)
- Aplikacja wykrywa środowisko produkcyjne
- Używa Vercel Serverless Function `/api/ai-generate`
- API key jest bezpiecznie przechowywany w environment variables
- Klucz NIE jest eksponowany w przeglądarce

## Bezpieczeństwo

✅ **Bezpieczne:**
- API key jest tylko w environment variables na serwerze
- Przeglądarka nie ma dostępu do klucza
- Wszystkie wywołania AI przechodzą przez backend

❌ **NIE commituj do repo:**
- `js/config.js` - zawiera lokalne klucze
- `.env` - lokalne zmienne środowiskowe

## Testowanie

### Test lokalny:
```bash
# Upewnij się, że masz js/config.js z kluczem
# Otwórz http://localhost:8080 (lub inny port)
# Generator AI powinien działać
```

### Test produkcyjny:
```bash
# Po deployment na Vercel
# Otwórz swoją domenę Vercel
# Generator AI powinien używać /api/ai-generate
```

## Troubleshooting

### Błąd: "Brak klucza OpenRouter API"
- Sprawdź czy dodałeś `OPENROUTER_API_KEY` w Vercel
- Wykonaj redeploy po dodaniu zmiennych
- Sprawdź czy klucz jest poprawny (zaczyna się od `sk-or-v1-`)

### Błąd: "OpenRouter API error"
- Sprawdź czy masz kredyty na koncie OpenRouter
- Sprawdź logi w Vercel Dashboard → Functions → `/api/ai-generate`

### Generator AI nie działa lokalnie
- Upewnij się, że masz plik `js/config.js`
- Skopiuj `js/config.example.js` → `js/config.js`
- Dodaj swój klucz OpenRouter

## Koszty

OpenRouter API jest płatny według użycia:
- Model: `openai/gpt-4o-mini`
- Koszt: ~$0.15 / 1M input tokens, ~$0.60 / 1M output tokens
- Średni quiz (10 pytań): ~$0.01-0.02

Monitoruj użycie na: https://openrouter.ai/activity

