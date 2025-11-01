# Plan Poprawy Jakości Testów - eTrener 2.0

> **Autor:** QA Lead & Testing Expert  
> **Data:** 2025-11-01  
> **Status:** 🟡 DRAFT - Czeka na decyzje architekta

---

## 📊 Executive Summary

**Obecny stan:**
- ✅ 103 testy przechodzą (7 suites)
- ⚠️ ~15-20% pokrycia kodu
- ❌ Brak lintera
- ❌ Brak testów dla 70% krytycznych modułów
- ❌ Brak testów integracyjnych

**Cel:**
- 🎯 Zwiększyć pokrycie do **80-90%**
- 🎯 Dodać **linter** z restrykcyjną konfiguracją
- 🎯 Dodać testy dla **wszystkich krytycznych ścieżek**
- 🎯 **Zminimalizować ryzyko regresji** w dynamicznie zmieniającym się projekcie

---

## 🚨 Analiza Ryzyka Regresji

### Krytyczne Moduły (High Risk) - ZERO testów

#### 1. Authentication (`auth-service.js`) 🔴 CRITICAL
**Ryzyko:** Użytkownicy mogą stracić dostęp do kont, wycieki danych

**Brakujące testy:**
- [ ] Rejestracja użytkownika
- [ ] Logowanie (poprawne/błędne hasło)
- [ ] Wylogowanie
- [ ] Resetowanie hasła
- [ ] Sprawdzanie ról (admin/user)
- [ ] Obsługa wygasłych sesji
- [ ] Obsługa błędów Supabase

**Szacowany czas:** 2 dni

---

#### 2. Data Service (`data-service.js`) 🔴 CRITICAL
**Ryzyko:** Utrata danych, błędne zapisy, problemy z RLS

**Brakujące testy:**
- [ ] CRUD dla Quizów (create, read, update, delete)
- [ ] CRUD dla Workoutów
- [ ] CRUD dla Listening Sets
- [ ] CRUD dla Knowledge Base
- [ ] Walidacja `is_public` flag (tylko admin)
- [ ] Obsługa RLS (user może edytować tylko swoje)
- [ ] Obsługa błędów sieci
- [ ] Concurrent updates

**Szacowany czas:** 3 dni

---

#### 3. Quiz Engine (`quiz-engine.js`) 🟠 MEDIUM RISK
**Ryzyko:** Błędy w logice quizów, utrata postępu

**Obecne pokrycie:** ~30% (tylko retry mistakes)

**Brakujące testy:**
- [ ] Wszystkie typy pytań (multiple-choice, fill-in-blank, true-false, matching, listening)
- [ ] Walidacja odpowiedzi z uwzględnieniem diakrytów
- [ ] Losowanie pytań
- [ ] Zapisywanie postępu w localStorage
- [ ] Obsługa deep links
- [ ] Timer w listening questions
- [ ] Progress tracking

**Szacowany czas:** 2 dni

---

#### 4. Workout Engine (`workout-engine.js`) 🟠 MEDIUM RISK
**Ryzyko:** Błędy w timerze, problemy z wake lock

**Obecne pokrycie:** ~40% (sets expansion, skip rest)

**Brakujące testy:**
- [ ] Timer countdown (normalne, ostatnie 5s)
- [ ] Wake Lock API integration
- [ ] Pause/Resume
- [ ] Skip exercise
- [ ] Phase transitions
- [ ] Progress tracking
- [ ] Deep links

**Szacowany czas:** 2 dni

---

#### 5. Listening Engine (`listening-engine.js`) 🟡 MEDIUM-LOW RISK
**Ryzyko:** TTS nie działa, błędy w odtwarzaniu

**Brakujące testy:**
- [ ] Web Speech API mock
- [ ] Play/Pause
- [ ] Loop functionality
- [ ] Language switching
- [ ] Previous/Next navigation
- [ ] Progress tracking
- [ ] Deep links

**Szacowany czas:** 2 dni

---

#### 6. UI State Management (`ui-state.js`, `state-manager.js`) 🟡 MEDIUM-LOW RISK
**Ryzyko:** Niespójny UI, błędy nawigacji

**Brakujące testy:**
- [ ] Screen transitions
- [ ] Tab bar visibility
- [ ] Activity state tracking
- [ ] Wake lock coordination
- [ ] Pub/sub notifications
- [ ] State persistence

**Szacowany czas:** 1.5 dni

---

#### 7. Content Manager (`content-manager.js`) 🟠 MEDIUM RISK
**Ryzyko:** Błędy w imporcie, AI generation fails

**Brakujące testy:**
- [ ] JSON import validation
- [ ] AI generation (mock OpenRouter)
- [ ] Deep link generation
- [ ] Public status toggle
- [ ] Share link copy
- [ ] Error handling

**Szacowany czas:** 2 dni

---

#### 8. Knowledge Base Engine (`knowledge-base-engine.js`) 🟢 LOW RISK
**Ryzyko:** Nowa funkcja, mało używana

**Brakujące testy:**
- [ ] Slug generation
- [ ] Article validation
- [ ] Image upload (mock)
- [ ] Video embed parsing
- [ ] Quill.js integration

**Szacowany czas:** 1.5 dni

---

### Podsumowanie Ryzyka

| Moduł | Ryzyko | Pokrycie | Czas (dni) | Priorytet |
|-------|--------|----------|------------|-----------|
| `auth-service.js` | 🔴 CRITICAL | 0% | 2 | P0 |
| `data-service.js` | 🔴 CRITICAL | 0% | 3 | P0 |
| `quiz-engine.js` | 🟠 MEDIUM | 30% | 2 | P1 |
| `workout-engine.js` | 🟠 MEDIUM | 40% | 2 | P1 |
| `content-manager.js` | 🟠 MEDIUM | 0% | 2 | P1 |
| `listening-engine.js` | 🟡 MEDIUM-LOW | 0% | 2 | P2 |
| `ui-state.js` | 🟡 MEDIUM-LOW | 0% | 1.5 | P2 |
| `knowledge-base-engine.js` | 🟢 LOW | 0% | 1.5 | P3 |

**Total:** ~16 dni roboczych

---

## 🔧 Linter i Code Quality

### Proponowana Konfiguracja ESLint

**Filozofia:** Strict ale pragmatyczna - zapobiega błędom, nie utrudnia development

#### Opcje do wyboru:

**A) ESLint Standard (Recommended)**
```bash
npm install --save-dev eslint eslint-config-standard
```

**B) ESLint Airbnb (Strict)**
```bash
npm install --save-dev eslint eslint-config-airbnb-base
```

**C) ESLint + Prettier (Code Formatting)**
```bash
npm install --save-dev eslint prettier eslint-config-prettier eslint-plugin-prettier
```

---

### Proponowana `.eslintrc.json`

```json
{
  "env": {
    "browser": true,
    "es2021": true,
    "node": true,
    "jest": true
  },
  "extends": [
    "eslint:recommended"
  ],
  "parserOptions": {
    "ecmaVersion": 2021,
    "sourceType": "module"
  },
  "rules": {
    // Błędy (blokują commit)
    "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "no-undef": "error",
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "no-debugger": "error",
    "no-alert": "warn",
    
    // Potencjalne błędy
    "no-await-in-loop": "warn",
    "no-promise-executor-return": "error",
    "require-atomic-updates": "error",
    
    // Best practices
    "eqeqeq": ["error", "always"],
    "no-eval": "error",
    "no-implied-eval": "error",
    "no-var": "error",
    "prefer-const": "error",
    "prefer-arrow-callback": "warn",
    "prefer-template": "warn",
    
    // Style (opcjonalne - można wyłączyć jeśli przeszkadza)
    "indent": ["error", 2],
    "quotes": ["error", "single"],
    "semi": ["error", "always"],
    "comma-dangle": ["error", "never"],
    
    // JSDoc (dla projektu z JSDoc)
    "valid-jsdoc": ["warn", {
      "requireReturn": false,
      "requireParamDescription": true,
      "requireReturnDescription": false
    }]
  },
  "globals": {
    "supabaseClient": "readonly",
    "featureFlags": "readonly",
    "uiState": "readonly",
    "createStore": "readonly",
    "wakeLockManager": "readonly"
  }
}
```

---

### Restrykcyjna Konfiguracja (Opcja 2 - po adaptacji)

```json
{
  "extends": ["eslint:recommended", "plugin:jsdoc/recommended"],
  "plugins": ["jsdoc"],
  "rules": {
    // ... podstawowe jak wyżej ...
    
    // Wymagaj JSDoc dla eksportowanych funkcji
    "jsdoc/require-jsdoc": ["error", {
      "require": {
        "FunctionDeclaration": true,
        "MethodDefinition": true,
        "ClassDeclaration": true
      }
    }],
    "jsdoc/require-param": "error",
    "jsdoc/require-returns": "error",
    "jsdoc/check-types": "error",
    
    // Complexity limits (zapobiega spaghetti code)
    "complexity": ["warn", 15],
    "max-depth": ["warn", 4],
    "max-lines-per-function": ["warn", { "max": 150 }],
    "max-nested-callbacks": ["warn", 3]
  }
}
```

---

### Prettier Configuration

```json
{
  "semi": true,
  "trailingComma": "none",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "avoid"
}
```

---

### Pre-commit Hooks (Husky)

```bash
npm install --save-dev husky lint-staged
```

```json
// package.json
{
  "lint-staged": {
    "*.js": [
      "eslint --fix",
      "prettier --write",
      "jest --bail --findRelatedTests"
    ]
  }
}
```

**Efekt:** Każdy commit automatycznie:
1. Lintuje zmiany
2. Formatuje kod
3. Uruchamia testy dla zmienionych plików

---

## 📝 Strategia Testowania

### 1. Piramida Testów

```
        /\
       /E2E\         5-10 testów (critical paths)
      /------\
     /Integration\   30-50 testów (module interactions)
    /------------\
   /  Unit Tests  \  200-300 testów (functions, edge cases)
  /----------------\
```

### 2. Typy Testów

#### A) **Unit Tests** (80% wysiłku)
- Testują pojedyncze funkcje/moduły w izolacji
- Szybkie (ms)
- Mocki dla zależności zewnętrznych
- **Narzędzie:** Jest

**Przykład:**
```javascript
// __tests__/auth-service.test.js
describe('authService.signIn', () => {
  it('should return user on successful login', async () => {
    // Mock Supabase response
    supabaseClient.auth.signInWithPassword = jest.fn().mockResolvedValue({
      data: { user: mockUser },
      error: null
    });
    
    const result = await authService.signIn('test@example.com', 'password');
    
    expect(result.success).toBe(true);
    expect(result.user.email).toBe('test@example.com');
  });
  
  it('should handle invalid credentials', async () => {
    supabaseClient.auth.signInWithPassword = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Invalid credentials' }
    });
    
    const result = await authService.signIn('wrong@example.com', 'wrong');
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid credentials');
  });
});
```

---

#### B) **Integration Tests** (15% wysiłku)
- Testują interakcje między modułami
- Wolniejsze (100ms - 1s)
- Minimalne mocki (prawdziwe API calls w test environment)
- **Narzędzie:** Jest + Supabase Test Project

**Przykład:**
```javascript
// __tests__/integration/quiz-flow.test.js
describe('Quiz Flow Integration', () => {
  let testUser;
  let testQuiz;
  
  beforeAll(async () => {
    // Create test user in Supabase Test Project
    testUser = await createTestUser();
  });
  
  it('should save quiz and start session', async () => {
    // 1. User creates quiz
    const quizData = { title: 'Test Quiz', questions: [...] };
    const savedQuiz = await dataService.saveQuiz(quizData);
    
    // 2. User starts quiz
    await contentManager.loadAndStartQuiz(savedQuiz.id);
    
    // 3. Verify state
    expect(quizEngine.getState().data.id).toBe(savedQuiz.id);
    expect(uiState.getState().currentScreen).toBe('quiz');
  });
});
```

---

#### C) **E2E Tests** (5% wysiłku)
- Testują całe flow użytkownika w prawdziwej przeglądarce
- Najwolniejsze (5-30s)
- Zero mocków
- **Narzędzie:** Playwright lub Cypress

**Przykład (Playwright):**
```javascript
// e2e/user-journey.spec.js
test('user can create and complete quiz', async ({ page }) => {
  // 1. Login
  await page.goto('https://etrener.app');
  await page.click('#login-button');
  await page.fill('#email', 'test@example.com');
  await page.fill('#password', 'password');
  await page.click('#submit-login');
  
  // 2. Import quiz
  await page.click('#tab-more');
  await page.click('#import-quiz');
  await page.fill('#json-input', JSON.stringify(mockQuizData));
  await page.click('#import-submit');
  
  // 3. Start quiz
  await page.click('#tab-quizzes');
  await page.click('.quiz-card:first-child');
  await page.click('#quiz-start-btn');
  
  // 4. Answer questions
  await page.click('#answer-0');
  await page.click('#quiz-next');
  
  // 5. Verify results
  await expect(page.locator('#quiz-final-score')).toContainText('100%');
});
```

---

### 3. Test Organization

```
__tests__/
├── unit/                           # Unit tests (fast)
│   ├── auth-service.test.js
│   ├── data-service.test.js
│   ├── quiz-engine.test.js
│   ├── workout-engine.test.js
│   ├── listening-engine.test.js
│   ├── ui-state.test.js
│   ├── state-manager.test.js
│   ├── content-manager.test.js
│   └── utilities.test.js
│
├── integration/                    # Integration tests (medium)
│   ├── quiz-flow.test.js
│   ├── workout-flow.test.js
│   ├── auth-flow.test.js
│   ├── deep-linking.test.js
│   └── public-content.test.js
│
├── e2e/                           # E2E tests (slow)
│   ├── user-journey.spec.js
│   ├── quiz-completion.spec.js
│   └── workout-completion.spec.js
│
├── fixtures/                      # Test data
│   ├── mock-quiz.json
│   ├── mock-workout.json
│   └── mock-listening-set.json
│
└── helpers/                       # Test utilities
    ├── supabase-mock.js
    ├── test-user-factory.js
    └── dom-helpers.test.js
```

---

### 4. Mocking Strategy

#### Supabase Client Mock

```javascript
// __tests__/helpers/supabase-mock.js
export const createMockSupabaseClient = () => ({
  auth: {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    getUser: jest.fn()
  },
  from: jest.fn((table) => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn()
  }))
});

// Usage
beforeEach(() => {
  global.supabaseClient = createMockSupabaseClient();
});
```

#### Web Speech API Mock

```javascript
// __tests__/helpers/web-speech-mock.js
export const mockSpeechSynthesis = () => {
  global.speechSynthesis = {
    speak: jest.fn(),
    cancel: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    getVoices: jest.fn(() => [
      { lang: 'pl-PL', name: 'Polish Voice' },
      { lang: 'es-ES', name: 'Spanish Voice' }
    ])
  };
  
  global.SpeechSynthesisUtterance = jest.fn();
};
```

---

## 📅 Implementation Roadmap

### Phase 1: Foundation (Week 1) - QUICK WINS

**Cel:** Ustaw infrastrukturę + testy dla najbardziej krytycznych modułów

**Tasks:**
1. ✅ Setup ESLint + Prettier
2. ✅ Setup Husky pre-commit hooks
3. ✅ Refactor existing tests to import real modules
4. ✅ Add tests for `auth-service.js` (P0)
5. ✅ Add tests for `data-service.js` (P0)
6. ✅ Run linter on all files, fix critical issues

**Deliverables:**
- ESLint config
- 50+ new tests
- Linter passes on all files
- CI/CD pipeline (GitHub Actions)

**Estimated Coverage:** 40%

---

### Phase 2: Core Modules (Week 2)

**Cel:** Pokryj pozostałe krytyczne moduły

**Tasks:**
1. Complete `quiz-engine.js` tests (P1)
2. Complete `workout-engine.js` tests (P1)
3. Add tests for `content-manager.js` (P1)
4. Add integration tests for quiz flow
5. Add integration tests for workout flow

**Deliverables:**
- 100+ new tests
- All P0/P1 modules covered

**Estimated Coverage:** 70%

---

### Phase 3: Advanced Features (Week 3)

**Cel:** Pokryj nowe funkcjonalności

**Tasks:**
1. Add tests for `listening-engine.js` (P2)
2. Add tests for `ui-state.js` (P2)
3. Add tests for `knowledge-base-engine.js` (P3)
4. Add integration tests for deep linking
5. Add integration tests for public content

**Deliverables:**
- 80+ new tests
- All modules covered

**Estimated Coverage:** 85%

---

### Phase 4: E2E & Polish (Week 4)

**Cel:** E2E testy + dokumentacja

**Tasks:**
1. Setup Playwright
2. Write 5-10 critical E2E tests
3. Add visual regression tests (optional)
4. Write test documentation
5. Create test maintenance guide

**Deliverables:**
- E2E test suite
- Test documentation
- Maintenance guide

**Estimated Coverage:** 90%

---

## 🎯 Success Metrics

### Quantitative
- ✅ **Code coverage:** 85-90%
- ✅ **Test count:** 250-300 tests
- ✅ **Test speed:** Unit tests < 5s, Integration < 30s
- ✅ **Linter:** Zero errors, <10 warnings
- ✅ **CI/CD:** All tests pass before merge

### Qualitative
- ✅ Confidence in deployments (no fear of breaking changes)
- ✅ Faster development (catch bugs early)
- ✅ Better documentation (tests as specs)
- ✅ Easier onboarding (tests show how code works)

---

## 💰 Cost-Benefit Analysis

### Investment
- **Time:** 3-4 weeks (1 developer full-time)
- **Setup:** 1-2 days (ESLint, test infrastructure)
- **Maintenance:** ~10% time ongoing (keeping tests green)

### Return
- **Prevented bugs:** 80-90% fewer regressions
- **Faster debugging:** 5x faster to find issues
- **Safer refactoring:** Confidence to improve code
- **Better sleep:** No fear of breaking production 😴

### ROI
**Break-even:** After ~2-3 months
**Long-term:** 3-5x time savings

---

## ❓ Questions for Architect

### 1. Supabase Test Environment
**Question:** Jak chcesz testować integrację z Supabase?

**Options:**
- A) **Full Mock** - szybkie, ale mniej realistyczne
- B) **Supabase Test Project** - wolniejsze, ale prawdziwe
- C) **Hybrid** - mock dla unit, prawdziwe dla integration

**Recommendation:** **C) Hybrid** - najlepszy balans

---

### 2. Priority
**Question:** Który scenariusz preferujesz?

**Options:**
- A) **Quick Win** (1 week) - ESLint + Auth + Data Service
- B) **Balanced** (2 weeks) - Powyższe + Quiz + Workout
- C) **Comprehensive** (4 weeks) - Wszystko + E2E

**Recommendation:** **B) Balanced** - 80/20 rule

---

### 3. E2E Testing
**Question:** Czy chcesz E2E testy?

**Options:**
- A) Yes - Playwright (modern, fast)
- B) Yes - Cypress (user-friendly)
- C) Not yet - focus on unit/integration first

**Recommendation:** **C)** na początek, **A)** później

---

### 4. Linter Strictness
**Question:** Jak restrykcyjny linter?

**Options:**
- A) **Relaxed** - tylko błędy i podstawowe warnings
- B) **Standard** - recommended config z większością rules
- C) **Strict** - full Airbnb + JSDoc enforcement

**Recommendation:** Start z **A)**, upgrade do **B)** po 2-3 tygodniach

---

### 5. CI/CD
**Question:** Czy testy powinny blokować merge?

**Options:**
- A) **Blocking** - nie można zmergeować jeśli testy failują
- B) **Warning** - pokazuje błędy, ale nie blokuje
- C) **Optional** - dev decyduje

**Recommendation:** **A)** - zapobiega regresiom

---

## 🚀 Next Steps

1. **Architect Review** - odpowiedz na 5 pytań powyżej
2. **Approval** - zdecyduj który plan (A/B/C)
3. **Kickoff** - zacznij implementację zgodnie z roadmapem
4. **Weekly Check-ins** - monitoring postępu

---

## 📚 Resources

### ESLint
- [ESLint Getting Started](https://eslint.org/docs/user-guide/getting-started)
- [ESLint Rules](https://eslint.org/docs/rules/)

### Jest
- [Jest Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Testing Library](https://testing-library.com/)

### Playwright
- [Playwright Docs](https://playwright.dev/)

### Books
- "Working Effectively with Legacy Code" - Michael Feathers
- "The Art of Unit Testing" - Roy Osherove

---

**Status:** 🟡 Awaiting Architect Decisions  
**Prepared by:** QA Lead & Testing Expert  
**Date:** 2025-11-01

