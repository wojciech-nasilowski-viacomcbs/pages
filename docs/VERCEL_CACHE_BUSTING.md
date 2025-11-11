# Vercel Cache Busting - Automatyczne

## Problem

Vercel cachuje pliki statyczne (JS, HTML) co powoduje że po deploymencie użytkownicy widzą stare wersje plików.

## Rozwiązanie

### 1. Automatyczny Build Script

Plik: `scripts/vercel-build.sh`

**Co robi:**
- Generuje unikalny timestamp przy każdym buildzie
- Aktualizuje version w `index.html` (komentarz `<!-- Version: ... -->`)
- Dodaje komentarz `// BUILD: timestamp` na końcu każdego głównego pliku JS
- Zapisuje build ID do `.vercel-build-id`

**Jak działa:**
```bash
bash scripts/vercel-build.sh
```

### 2. Konfiguracja Vercel

Plik: `vercel.json`

```json
{
  "buildCommand": "bash scripts/vercel-build.sh",
  "headers": [
    {
      "source": "/js/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" },
        { "key": "Pragma", "value": "no-cache" },
        { "key": "Expires", "value": "0" }
      ]
    }
  ]
}
```

### 3. Meta Tagi w HTML

```html
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
<meta http-equiv="Pragma" content="no-cache">
<meta http-equiv="Expires" content="0">
```

## Jak to działa?

1. **Przed każdym deploymentem** Vercel uruchamia `scripts/vercel-build.sh`
2. Skrypt **modyfikuje pliki** (dodaje timestamp)
3. Git widzi zmiany w plikach
4. Vercel deployuje **nowe wersje** plików
5. Przeglądarki **nie cachują** dzięki headerom

## Weryfikacja

Po deploymencie sprawdź:

```bash
# Sprawdź version w index.html
curl https://twoja-domena.vercel.app/ | grep "Version:"

# Sprawdź build ID w JS
curl https://twoja-domena.vercel.app/js/engines/quiz-engine.js | tail -3
```

Powinieneś zobaczyć nowy timestamp przy każdym deploymencie.

## Ważne

- **NIE dodawaj** plików z timestampem do `.gitignore`
- **Commituj** wszystkie zmiany po uruchomieniu skryptu
- Skrypt jest **automatycznie** uruchamiany przez Vercel

## Troubleshooting

### Problem: Vercel nadal pokazuje stare pliki

1. Sprawdź czy `vercel.json` ma poprawny `buildCommand`
2. Sprawdź logi buildu w Vercel Dashboard
3. Wymuś hard refresh: `Ctrl+Shift+R` (Windows/Linux) lub `Cmd+Shift+R` (Mac)
4. Wyczyść cache przeglądarki

### Problem: Skrypt nie działa lokalnie

```bash
# Upewnij się że skrypt ma uprawnienia do wykonania
chmod +x scripts/vercel-build.sh

# Uruchom ręcznie
bash scripts/vercel-build.sh
```

## Automatyzacja

Skrypt jest automatycznie uruchamiany przez Vercel przy każdym:
- Push do brancha głównego
- Pull Request merge
- Ręcznym redeploymencie

**Nie musisz robić nic ręcznie!** 🎉

