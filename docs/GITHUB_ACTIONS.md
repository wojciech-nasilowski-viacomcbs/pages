# GitHub Actions - CI/CD Pipeline

## 📋 Spis Treści

- [Przegląd](#przegląd)
- [Workflow: test.yml](#workflow-testyml)
- [Workflow: ci.yml](#workflow-ciyml)
- [Konfiguracja](#konfiguracja)
- [Troubleshooting](#troubleshooting)

---

## Przegląd

Projekt używa **GitHub Actions** do automatycznego testowania i weryfikacji kodu przy każdym push/PR do branchy `main` i `exercises`.

### 🎯 Cele

1. **Zapobieganie regresji** - automatyczne testy przy każdej zmianie
2. **Jakość kodu** - wymuszanie standardów (ESLint, Prettier)
3. **Pokrycie testami** - śledzenie pokrycia kodu
4. **Szybkie feedback** - natychmiastowa informacja o problemach

### 📊 Statystyki

- **2 workflow** (test.yml, ci.yml)
- **197 testów** uruchamiane automatycznie
- **2 wersje Node.js** (18.x, 20.x)
- **~2-3 minuty** czas wykonania

---

## Workflow: test.yml

**Plik:** `.github/workflows/test.yml`

### Kiedy się uruchamia?

```yaml
on:
  push:
    branches: [main, exercises]
  pull_request:
    branches: [main, exercises]
```

### Co robi?

#### 1. **Job: test**

Uruchamia testy na różnych wersjach Node.js:

```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x]
```

**Kroki:**
1. Checkout kodu
2. Setup Node.js (18.x i 20.x)
3. Instalacja zależności (`npm ci`)
4. Uruchomienie testów (`npm test`)
5. Generowanie raportu pokrycia (`npm run test:coverage`)
6. Upload do Codecov (opcjonalnie)
7. Archiwizacja wyników (artifacts)

#### 2. **Job: lint**

Sprawdza jakość kodu:

**Kroki:**
1. Checkout kodu
2. Setup Node.js (20.x)
3. Instalacja zależności
4. ESLint (`npm run lint`)
5. Prettier check (`npm run format:check`)

### Artifacts

Po każdym uruchomieniu dostępne są:
- `test-results-node-18.x/` - wyniki testów dla Node 18
- `test-results-node-20.x/` - wyniki testów dla Node 20
- `coverage/` - raport pokrycia kodu
- `test-report.html` - raport HTML

**Jak pobrać:**
1. Przejdź do zakładki **Actions**
2. Wybierz konkretny workflow run
3. Scroll w dół do sekcji **Artifacts**
4. Kliknij, żeby pobrać

---

## Workflow: ci.yml

**Plik:** `.github/workflows/ci.yml`

Bardziej zaawansowany pipeline z dodatkowymi sprawdzeniami.

### Jobs

#### 1. **quality-check**

Pierwszy krok - sprawdzenie jakości kodu:
- ESLint
- Prettier
- Blokuje dalsze joby jeśli failuje

#### 2. **test**

Uruchamia testy w matrycy:

```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x]
    test-type: [unit, integration]
```

**4 kombinacje:**
- Node 18.x + unit tests
- Node 18.x + integration tests
- Node 20.x + unit tests
- Node 20.x + integration tests

**Testy unit:**
```bash
npm test -- --testPathIgnorePatterns=integration
```

**Testy integration:**
```bash
npm test -- --testPathPatterns=integration
```

#### 3. **coverage**

Generuje i publikuje raport pokrycia:
- Upload do Codecov
- Komentarz na PR z pokryciem
- Archiwizacja raportu

#### 4. **build-check**

Weryfikuje proces budowania:
- Generuje `manifest.json`
- Sprawdza czy plik istnieje
- Waliduje strukturę JSON
- Wyświetla statystyki (liczba quizów/workoutów)

#### 5. **status-check**

Końcowy status wszystkich jobów:
- ✅ Wszystkie przeszły - sukces
- ❌ Któryś failnął - failure

---

## Konfiguracja

### Wymagane Secrets

Opcjonalnie, dla pełnej funkcjonalności:

#### Codecov Token

1. Załóż konto na [codecov.io](https://codecov.io)
2. Dodaj swoje repo
3. Skopiuj token
4. Dodaj do GitHub Secrets:
   - Settings → Secrets → Actions
   - New repository secret
   - Name: `CODECOV_TOKEN`
   - Value: `[twój-token]`

### Branch Protection Rules

Rekomendowane ustawienia dla `main`:

1. Settings → Branches → Add rule
2. Branch name pattern: `main`
3. ✅ Require status checks to pass before merging
4. Wybierz checks:
   - `test / Run Tests (18.x)`
   - `test / Run Tests (20.x)`
   - `lint / Lint Code`
   - `quality-check / Code Quality Check`
5. ✅ Require branches to be up to date before merging
6. Save changes

### Badge w README

Zaktualizuj linki w README.md:

```markdown
[![Tests](https://github.com/[username]/[repo]/actions/workflows/test.yml/badge.svg)](https://github.com/[username]/[repo]/actions/workflows/test.yml)
[![CI/CD](https://github.com/[username]/[repo]/actions/workflows/ci.yml/badge.svg)](https://github.com/[username]/[repo]/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/[username]/[repo]/branch/main/graph/badge.svg)](https://codecov.io/gh/[username]/[repo])
```

Zamień `[username]` i `[repo]` na swoje wartości.

---

## Troubleshooting

### ❌ "Dependencies lock file is not found"

**Przyczyna:** `package-lock.json` nie jest commitowany do repozytorium

**Rozwiązanie:**
```bash
# Usuń package-lock.json z .gitignore
# Dodaj plik do repozytorium
git add package-lock.json
git commit -m "chore: add package-lock.json for CI/CD consistency"
git push
```

**Dlaczego to ważne:**
- `npm ci` wymaga `package-lock.json` (szybsza i deterministyczna instalacja)
- Zapewnia identyczne wersje zależności na CI i lokalnie
- GitHub Actions cache działa tylko z lock file

### ❌ Testy failują na CI, ale działają lokalnie

**Przyczyna:** Różnice w środowisku (Node.js, zależności)

**Rozwiązanie:**
```bash
# Użyj dokładnie tych samych komend co CI
npm ci  # zamiast npm install
npm test
npm run lint
```

### ❌ Timeout podczas testów

**Przyczyna:** Testy trwają zbyt długo (>10 minut)

**Rozwiązanie:**
```yaml
# W workflow dodaj timeout
jobs:
  test:
    timeout-minutes: 15  # domyślnie 360
```

### ❌ Artifacts nie są uploadowane

**Przyczyna:** Błąd w ścieżce lub brak plików

**Rozwiązanie:**
```yaml
# Sprawdź czy pliki istnieją przed uploadem
- name: Check files
  run: |
    ls -la coverage/
    ls -la test-report.html
```

### ❌ "Deprecated version of actions/upload-artifact"

**Przyczyna:** Używasz starej wersji `actions/upload-artifact@v3`

**Rozwiązanie:**
```yaml
# Zaktualizuj do v4
- uses: actions/upload-artifact@v4  # było: @v3
  with:
    name: my-artifact
    path: path/to/files
```

**Zmiany w v4:**
- Lepsza wydajność i kompresja
- Automatyczne deduplikowanie plików
- Ulepszona obsługa dużych plików

### ❌ ESLint failuje na CI

**Przyczyna:** Lokalne ustawienia różnią się od CI

**Rozwiązanie:**
```bash
# Lokalnie uruchom dokładnie to samo
npm run lint
npm run format:check

# Jeśli są błędy, napraw:
npm run lint:fix
npm run format
```

### ❌ Coverage nie jest uploadowany do Codecov

**Przyczyna:** Brak tokenu lub błędna konfiguracja

**Rozwiązanie:**
1. Sprawdź czy `CODECOV_TOKEN` jest ustawiony w Secrets
2. Sprawdź logi workflow - czy upload się wykonał
3. Dodaj `continue-on-error: true` jeśli chcesz, żeby nie blokowało CI

---

## Best Practices

### 1. **Szybkie Feedback**

```yaml
# Uruchom linter jako pierwszy (najszybszy)
jobs:
  lint:
    # ...
  
  test:
    needs: lint  # Czeka na linter
```

### 2. **Cache Dependencies**

```yaml
- uses: actions/setup-node@v4
  with:
    cache: 'npm'  # Przyspiesza instalację
```

### 3. **Matrix Strategy**

```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x]
  fail-fast: false  # Nie przerywaj innych jeśli jeden failuje
```

### 4. **Artifacts Retention**

```yaml
- uses: actions/upload-artifact@v4
  with:
    retention-days: 30  # Nie trzymaj wiecznie
```

### 5. **Conditional Steps**

```yaml
- name: Upload to Codecov
  if: matrix.node-version == '20.x'  # Tylko raz
```

---

## Monitoring

### GitHub Actions Dashboard

1. Przejdź do zakładki **Actions**
2. Zobacz wszystkie workflow runs
3. Filtruj po:
   - Branch
   - Workflow
   - Status (success, failure, in progress)

### Email Notifications

GitHub automatycznie wysyła email gdy:
- Workflow failuje na twoim branchu
- Workflow failuje na PR, który utworzyłeś

### Status Badge

Badge w README pokazuje aktualny status:
- ✅ Zielony - wszystkie testy przechodzą
- ❌ Czerwony - coś failuje
- 🟡 Żółty - workflow w trakcie

---

## Rozszerzenia

### Dodatkowe Checks

Możesz dodać więcej sprawdzeń:

```yaml
- name: Check bundle size
  run: npm run build && npm run size-check

- name: Security audit
  run: npm audit --audit-level=moderate

- name: Check for outdated dependencies
  run: npm outdated || true
```

### Deployment

Dodaj deployment po przejściu testów:

```yaml
deploy:
  needs: [test, lint, coverage]
  if: github.ref == 'refs/heads/main'
  runs-on: ubuntu-latest
  steps:
    - name: Deploy to production
      run: npm run deploy
```

### Scheduled Runs

Uruchamiaj testy codziennie:

```yaml
on:
  schedule:
    - cron: '0 2 * * *'  # Codziennie o 2:00 UTC
```

---

## Podsumowanie

✅ **Automatyczne testy** przy każdym push/PR
✅ **Jakość kodu** wymuszana przez linter
✅ **Pokrycie testami** śledzone i raportowane
✅ **Szybkie feedback** (2-3 minuty)
✅ **Artifacts** z wynikami testów
✅ **Branch protection** zapobiega złym mergom

**Rezultat:** Minimalizacja ryzyka regresji i wysoka jakość kodu! 🎉

