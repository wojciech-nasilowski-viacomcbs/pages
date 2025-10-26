# Deployment Guide - Vercel

## 🚀 Jak wdrożyć aplikację na Vercel

### Krok 1: Przygotowanie lokalnego repozytorium

```bash
# Upewnij się, że js/config.js jest w .gitignore (już dodane)
git status  # Sprawdź czy config.js NIE jest widoczny
git add .
git commit -m "Add Supabase configuration system"
git push origin main
```

### Krok 2: Konfiguracja na Vercel

1. **Wejdź na [vercel.com](https://vercel.com)** i zaloguj się
2. **Import projektu** z GitHub/GitLab/Bitbucket
3. **Przejdź do Settings → Environment Variables**
4. **Dodaj następujące zmienne:**

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `SUPABASE_URL` | `https://gygijehqwtnmnoopwqyg.supabase.co` | Production, Preview, Development |
| `SUPABASE_ANON_KEY` | `eyJhbGciOi...` (twój klucz) | Production, Preview, Development |

### Krok 3: Konfiguracja build settings

Ponieważ używamy prostego statycznego HTML/JS (bez build procesu):

- **Framework Preset:** Other
- **Build Command:** (pozostaw puste)
- **Output Directory:** (pozostaw puste lub wpisz `.`)
- **Install Command:** (pozostaw puste)

### Krok 4: Dodaj skrypt generujący config.js

Stwórz plik `vercel.json` w głównym katalogu:

```json
{
  "buildCommand": "node scripts/generate-config.js",
  "outputDirectory": "."
}
```

### Krok 5: Deploy!

Kliknij **Deploy** - Vercel automatycznie:
1. Pobierze kod z repo
2. Wygeneruje `js/config.js` z environment variables
3. Wdroży aplikację

---

## 🔧 Alternatywna metoda: Build script

Jeśli chcesz automatyzować generowanie `config.js`, stwórz:

**scripts/generate-config.js:**
```javascript
const fs = require('fs');
const path = require('path');

const config = `// Auto-generated configuration
window.APP_CONFIG = {
    SUPABASE_URL: '${process.env.SUPABASE_URL}',
    SUPABASE_ANON_KEY: '${process.env.SUPABASE_ANON_KEY}'
};
`;

const outputPath = path.join(__dirname, '../js/config.js');
fs.writeFileSync(outputPath, config);
console.log('✅ Config generated successfully!');
```

**Dodaj do `package.json`:**
```json
{
  "scripts": {
    "build": "node scripts/generate-config.js"
  }
}
```

**Vercel build settings:**
- Build Command: `npm run build`
- Output Directory: `.`

---

## 📝 Uwagi bezpieczeństwa

### ✅ DOBRE PRAKTYKI:
- `js/config.js` jest w `.gitignore` ✅
- Klucze są w Vercel Environment Variables ✅
- `ANON_KEY` jest bezpieczny dla frontend (Row Level Security włączone) ✅

### ⚠️ UWAGA:
- **ANON_KEY** jest publiczny i to OK - Supabase używa Row Level Security
- **NIGDY** nie commituj `SERVICE_ROLE_KEY` - ten klucz jest prywatny!
- **ANON_KEY** tylko odczytuje dane zgodnie z RLS policies

---

## 🔄 Aktualizacja kluczy

Jeśli zmienisz klucze Supabase:

1. **Lokalnie:** Zaktualizuj `js/config.js`
2. **Na Vercel:** Settings → Environment Variables → Edit
3. **Redeploy:** Vercel → Deployments → Redeploy

---

## 🧪 Testowanie lokalnie

```bash
# Upewnij się, że masz js/config.js (skopiuj z example)
cp js/config.example.js js/config.js

# Edytuj i dodaj swoje klucze
nano js/config.js

# Uruchom lokalny serwer
python3 -m http.server 8000
# lub
npx http-server

# Otwórz http://localhost:8000
```

---

## 🆘 Troubleshooting

### Problem: "Supabase configuration missing"
**Rozwiązanie:** 
- Lokalnie: Sprawdź czy `js/config.js` istnieje
- Na Vercel: Sprawdź Environment Variables i zrób redeploy

### Problem: "Invalid API key"
**Rozwiązanie:**
- Sprawdź czy skopiowałeś cały klucz (bez spacji)
- Sprawdź czy klucz jest aktualny w Supabase Dashboard

### Problem: Brak danych po deploy
**Rozwiązanie:**
- Sprawdź Console w przeglądarce (F12)
- Sprawdź czy RLS policies są włączone
- Sprawdź czy sample data został zainstalowany

---

## 📚 Dodatkowe zasoby

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase Client Keys](https://supabase.com/docs/guides/api#api-url-and-keys)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

