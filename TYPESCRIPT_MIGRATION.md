# TypeScript Migration Guide

> **Status**: Projekt obecnie używa **JavaScript + JSDoc** dla type safety  
> Ten dokument opisuje, jak zmigrować do TypeScript, jeśli zajdzie taka potrzeba w przyszłości

---

## 📋 Obecny Stan

### ✅ Co już mamy:

1. **JSDoc** - Pełna dokumentacja typów we wszystkich modułach
2. **`jsconfig.json`** - Konfiguracja dla IntelliSense w VS Code
3. **`types.js`** - Centralne definicje typów
4. **Type checking** - Włączony w `jsconfig.json` (`checkJs: true`)

### 🎯 Korzyści obecnego rozwiązania:

- ✅ Zero build step - instant reload
- ✅ Type safety w edytorze (VS Code)
- ✅ Łatwy deployment (GitHub Pages)
- ✅ Brak dodatkowych zależności
- ✅ Szybszy development cycle

---

## 🔄 Kiedy rozważyć migrację do TypeScript?

Migruj do TypeScript, jeśli:

- [ ] Zespół rośnie (3+ deweloperów)
- [ ] Projekt przekracza 20,000 linii kodu
- [ ] Potrzebujesz strict null checks
- [ ] Chcesz używać zaawansowanych typów (conditional types, mapped types)
- [ ] Planujesz używać frameworka (React, Vue, Angular)
- [ ] Potrzebujesz lepszej integracji z bibliotekami TypeScript

---

## 📝 Plan Migracji (Krok po Kroku)

### Krok 1: Instalacja TypeScript

```bash
npm install --save-dev typescript
npm install --save-dev @types/node
npm install --save-dev @supabase/supabase-js # Ma wbudowane typy
```

### Krok 2: Stwórz `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "outDir": "./dist",
    "rootDir": "./js",
    
    // Strict Type Checking
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    
    // Additional Checks
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    
    // Module Resolution
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    
    // Source Maps
    "sourceMap": true,
    "inlineSourceMap": false,
    "declaration": true,
    "declarationMap": true,
    
    // Path Mapping
    "baseUrl": ".",
    "paths": {
      "@/*": ["js/*"],
      "@types": ["js/types"]
    },
    
    // Skip lib check for faster compilation
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  
  "include": [
    "js/**/*.ts",
    "api/**/*.ts"
  ],
  
  "exclude": [
    "node_modules",
    "dist",
    "coverage"
  ]
}
```

### Krok 3: Zmień rozszerzenia plików

**Strategia inkrementalna** (zalecana):

```bash
# Zacznij od najmniejszych modułów
mv js/types.js js/types.ts
mv js/dom-helpers.js js/dom-helpers.ts
mv js/audio.js js/audio.ts

# Potem serwisy
mv js/supabase-client.js js/supabase-client.ts
mv js/auth-service.js js/auth-service.ts
mv js/data-service.js js/data-service.ts

# Na końcu duże pliki
mv js/app.js js/app.ts
mv js/quiz-engine.js js/quiz-engine.ts
mv js/workout-engine.js js/workout-engine.ts
```

### Krok 4: Konwersja JSDoc → TypeScript

#### Przed (JavaScript + JSDoc):

```javascript
/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} email
 */

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Promise<User|null>} User object or null
 */
async function getUser(userId) {
  // ...
}
```

#### Po (TypeScript):

```typescript
interface User {
  id: string;
  email: string;
}

async function getUser(userId: string): Promise<User | null> {
  // ...
}
```

### Krok 5: Konwersja `types.js` → `types.ts`

```typescript
// js/types.ts

// ============================================================================
// USER & AUTH TYPES
// ============================================================================

export interface User {
  id: string;
  email: string;
  user_metadata?: Record<string, any>;
  created_at?: string;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  user: User;
  expires_in: number;
  token_type: string;
}

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error: Error | null;
}

// ============================================================================
// QUIZ TYPES
// ============================================================================

export interface Quiz {
  id: string;
  user_id: string;
  title: string;
  description: string;
  is_sample: boolean;
  created_at: string;
  questions?: Question[];
}

export interface QuestionBase {
  id: string;
  quiz_id: string;
  order: number;
  type: string;
}

export interface MultipleChoiceQuestion extends QuestionBase {
  type: 'multiple-choice';
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface FillInBlankQuestion extends QuestionBase {
  type: 'fill-in-the-blank';
  question: string;
  correctAnswers: string[];
  explanation?: string;
}

export interface TrueFalseQuestion extends QuestionBase {
  type: 'true-false';
  question: string;
  correctAnswer: boolean;
  explanation?: string;
}

export interface MatchingQuestion extends QuestionBase {
  type: 'matching';
  question: string;
  pairs: Array<{ left: string; right: string }>;
  explanation?: string;
}

export interface ListeningQuestion extends QuestionBase {
  type: 'listening';
  question: string;
  audioText: string;
  langCode: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export type Question =
  | MultipleChoiceQuestion
  | FillInBlankQuestion
  | TrueFalseQuestion
  | MatchingQuestion
  | ListeningQuestion;

// ... rest of types
```

### Krok 6: Dodaj build script do `package.json`

```json
{
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "type-check": "tsc --noEmit",
    "dev": "tsc --watch",
    "clean": "rm -rf dist"
  }
}
```

### Krok 7: Zaktualizuj `index.html`

```html
<!-- Przed (JavaScript) -->
<script src="js/supabase-client.js"></script>
<script src="js/auth-service.js"></script>
<script src="js/app.js"></script>

<!-- Po (TypeScript - skompilowane) -->
<script type="module" src="dist/supabase-client.js"></script>
<script type="module" src="dist/auth-service.js"></script>
<script type="module" src="dist/app.js"></script>
```

### Krok 8: Zaktualizuj `.gitignore`

```gitignore
# TypeScript
dist/
*.tsbuildinfo

# Existing
node_modules/
coverage/
.env
js/config.js
```

### Krok 9: Deployment (GitHub Pages)

**Opcja A: Pre-build przed commit**

```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "git add dist && git commit -m 'Build' && git push"
  }
}
```

**Opcja B: GitHub Actions (zalecane)**

`.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build TypeScript
        run: npm run build
        
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./
          exclude_assets: 'js/**/*.ts,tsconfig.json'
```

---

## 🔧 Narzędzia Pomocnicze

### 1. Automatyczna konwersja JSDoc → TypeScript

```bash
npm install -g jscodeshift
npm install -g @types/jscodeshift

# Użyj codemod do konwersji
npx jscodeshift -t transform-jsdoc-to-ts.js js/**/*.js
```

### 2. Type Coverage

```bash
npm install --save-dev type-coverage

# Sprawdź pokrycie typów
npx type-coverage --detail
```

### 3. ESLint z TypeScript

```bash
npm install --save-dev @typescript-eslint/parser @typescript-eslint/eslint-plugin

# .eslintrc.json
{
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ]
}
```

---

## ⚠️ Potencjalne Problemy

### Problem 1: IIFE Pattern

**Przed (JavaScript):**
```javascript
(function() {
  'use strict';
  const authService = { /* ... */ };
  window.authService = authService;
})();
```

**Po (TypeScript):**
```typescript
// Usuń IIFE, użyj ES modules
export const authService = { /* ... */ };

// Lub zachowaj globalny scope:
declare global {
  interface Window {
    authService: typeof authService;
  }
}

const authService = { /* ... */ };
window.authService = authService;
```

### Problem 2: Supabase Types

```typescript
// Wygeneruj typy z bazy danych
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > js/supabase-types.ts

// Użyj w kodzie
import { Database } from './supabase-types';

type Quiz = Database['public']['Tables']['quizzes']['Row'];
```

### Problem 3: DOM Manipulation

```typescript
// Dodaj type guards
function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Element with id "${id}" not found`);
  }
  return element as T;
}

const button = getElement<HTMLButtonElement>('my-button');
button.disabled = true; // Type-safe!
```

---

## 📊 Porównanie: JavaScript + JSDoc vs TypeScript

| Aspekt | JavaScript + JSDoc | TypeScript |
|--------|-------------------|------------|
| **Type Safety** | ⭐⭐⭐ (dobry) | ⭐⭐⭐⭐⭐ (doskonały) |
| **Build Time** | ⚡ Instant (0s) | 🐌 ~5-10s |
| **Learning Curve** | ✅ Łatwy | ⚠️ Średni |
| **Tooling** | ⭐⭐⭐⭐ (bardzo dobry) | ⭐⭐⭐⭐⭐ (doskonały) |
| **Deployment** | ✅ Prosty | ⚠️ Wymaga build step |
| **Refactoring** | ⭐⭐⭐ (dobry) | ⭐⭐⭐⭐⭐ (doskonały) |
| **Runtime Errors** | ⚠️ Możliwe | ✅ Minimalne |
| **Bundle Size** | ✅ Mały | ✅ Mały (po kompilacji) |

---

## 🎯 Rekomendacja

### Zostań przy JavaScript + JSDoc jeśli:
- ✅ Projekt < 10,000 linii kodu
- ✅ Zespół < 3 deweloperów
- ✅ Priorytet: szybki development
- ✅ Deployment musi być prosty

### Migruj do TypeScript jeśli:
- ✅ Projekt > 20,000 linii kodu
- ✅ Zespół > 3 deweloperów
- ✅ Priorytet: type safety
- ✅ Masz CI/CD pipeline
- ✅ Używasz frameworka (React, Vue, Angular)

---

## 📚 Dodatkowe Zasoby

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- [JSDoc to TypeScript Migration](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)
- [Supabase TypeScript Support](https://supabase.com/docs/reference/javascript/typescript-support)

---

**Wersja dokumentu**: 1.0  
**Ostatnia aktualizacja**: 2025-10-28




