# 🐛 Debugowanie Generatora AI

## Problemy i rozwiązania

### Problem 1: "Unexpected token '<', "<!DOCTYPE '...' is not valid JSON"

Ten błąd oznacza, że API zwróciło HTML zamiast JSON. Najczęstsze przyczyny:

### Problem 2: "Error 501 - Unsupported method ('POST')"

Ten błąd oznacza, że próbujesz użyć Vercel Function lokalnie bez uruchomionego serwera.

**Rozwiązanie:**
System automatycznie wykrywa środowisko i używa:
- **Vercel Function** - tylko na produkcji (vercel.app)
- **OpenRouter Direct** - lokalnie i wszędzie indziej

Sprawdź w konsoli (F12):
```
📍 Hostname: localhost
📍 Protocol: http:
📍 Środowisko: Lokalne (OpenRouter Direct)
```

Jeśli widzisz "Produkcja (Vercel Function)" ale pracujesz lokalnie, to błąd detekcji.

**Jak uruchomić aplikację lokalnie:**

Opcja 1 - Prosty serwer HTTP (Python):
```bash
cd /Users/nasiloww/Documents/Projects/pages
python3 -m http.server 8000
# Otwórz: http://localhost:8000
```

Opcja 2 - Prosty serwer HTTP (Node.js):
```bash
npx http-server -p 8000
# Otwórz: http://localhost:8000
```

Opcja 3 - Live Server (VS Code):
1. Zainstaluj rozszerzenie "Live Server"
2. Kliknij prawym na `index.html` → "Open with Live Server"

**NIE otwieraj pliku bezpośrednio** (file://) - wtedy API nie będzie działać poprawnie!

---

### 1. **Nieprawidłowy klucz API OpenRouter**

#### Lokalne środowisko:
Sprawdź plik `js/config.js`:
```javascript
const APP_CONFIG = {
  OPENROUTER_API_KEY: 'sk-or-v1-...' // Musi zaczynać się od sk-or-v1-
};
```

**Jak uzyskać klucz:**
1. Wejdź na https://openrouter.ai/
2. Zaloguj się / Zarejestruj
3. Przejdź do "Keys" → "Create Key"
4. Skopiuj klucz i wklej do `config.js`

#### Produkcja (Vercel):
1. Wejdź do dashboard Vercel
2. Wybierz projekt
3. Settings → Environment Variables
4. Dodaj zmienną:
   - Name: `OPENROUTER_API_KEY`
   - Value: `sk-or-v1-...`
   - Environment: Production, Preview, Development

### 2. **Brak środków na koncie OpenRouter**

OpenRouter wymaga doładowania konta:
1. Wejdź na https://openrouter.ai/credits
2. Doładuj konto (minimum $5)
3. Sprawdź saldo przed użyciem generatora

### 3. **Model nie jest dostępny**

Sprawdź dostępność modelu:

**Lokalne (js/content-manager.js, linia ~960):**
```javascript
model: 'anthropic/claude-sonnet-4.5'  // Zmień jeśli niedostępny
```

**Produkcja (api/ai-generate.js, linia 52):**
```javascript
model: 'anthropic/claude-sonnet-4.5'  // Zmień jeśli niedostępny
```

**Dostępne modele Claude (2025):**
- `anthropic/claude-sonnet-4.5` - Najnowszy, najlepsza jakość (zalecane) ⭐
- `anthropic/claude-3.5-sonnet` - Stabilny, świetny stosunek ceny do jakości
- `anthropic/claude-3-opus` - Najwyższa jakość dla złożonych zadań (droższy)
- `anthropic/claude-3-haiku` - Szybki i tani

**Alternatywne modele:**
- `google/gemini-1.5-pro` - Dobra alternatywa, tańszy
- `openai/gpt-4o` - OpenAI, dobra jakość

### 4. **Problemy z siecią / CORS**

Jeśli pracujesz lokalnie:
- Upewnij się, że masz połączenie z internetem
- Sprawdź konsolę przeglądarki (F12) → Network → ai-generate
- Sprawdź czy nie blokuje firewall/antywirus

## Jak debugować krok po kroku:

### 1. Otwórz konsolę przeglądarki (F12)

### 2. Spróbuj wygenerować treść

### 3. Sprawdź logi w konsoli:
```
🤖 Generowanie workout przez AI...
📍 Środowisko: Lokalne (OpenRouter)
```

### 4. Jeśli widzisz błąd, sprawdź szczegóły:

**Błąd 401 Unauthorized:**
- Nieprawidłowy klucz API
- Klucz wygasł

**Błąd 402 Payment Required:**
- Brak środków na koncie OpenRouter

**Błąd 429 Too Many Requests:**
- Przekroczono limit requestów
- Poczekaj chwilę i spróbuj ponownie

**Błąd 500 Internal Server Error:**
- Problem po stronie OpenRouter
- Spróbuj ponownie za chwilę

**Błąd "Unexpected token '<'":**
- API zwróciło HTML zamiast JSON
- Sprawdź klucz API i saldo

## Testowanie API ręcznie:

### Test lokalny (curl):
```bash
curl https://openrouter.ai/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TWÓJ_KLUCZ_API" \
  -d '{
    "model": "google/gemini-1.5-pro",
    "messages": [{"role": "user", "content": "Test"}]
  }'
```

### Test Vercel Function:
```bash
curl -X POST https://twoja-domena.vercel.app/api/ai-generate \
  -H "Content-Type: application/json" \
  -d '{
    "systemPrompt": "Test",
    "userPrompt": "Test",
    "contentType": "quiz"
  }'
```

## Rozwiązania awaryjne:

### 1. Zmień model na tańszy Claude:
```javascript
model: 'anthropic/claude-3-haiku'  // Szybszy i tańszy
```

### 2. Użyj starszego stabilnego Claude:
```javascript
model: 'anthropic/claude-3.5-sonnet'  // Sprawdzony, stabilny
```

### 3. Użyj alternatywnego providera:
```javascript
model: 'google/gemini-1.5-pro'  // Google Gemini (tańszy)
model: 'openai/gpt-4o-mini'     // OpenAI (tańszy)
```

### 3. Sprawdź status OpenRouter:
https://status.openrouter.ai/

## Kontakt z supportem OpenRouter:

Jeśli problem nie ustępuje:
1. Discord: https://discord.gg/openrouter
2. Email: support@openrouter.ai
3. GitHub: https://github.com/OpenRouterTeam/openrouter-runner

## Logi do wysłania w zgłoszeniu:

1. Otwórz konsolę (F12)
2. Skopiuj wszystkie błędy czerwone
3. Sprawdź zakładkę Network → ai-generate → Response
4. Dołącz te informacje do zgłoszenia

