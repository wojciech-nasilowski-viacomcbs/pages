# Quick Start: DOM Helpers

> **Szybki start** - Jak zacząć używać `dom-helpers.js` w projekcie

---

## 🚀 Podstawy w 5 minut

### 1. Import

```javascript
// Na początku pliku JS
import { h, qs, on, button } from './dom-helpers.js';
```

### 2. Tworzenie elementów

```javascript
// Zamiast:
const div = document.createElement('div');
div.className = 'card';
div.textContent = 'Hello';

// Użyj:
const div = h('div', { className: 'card' }, 'Hello');
```

### 3. Zagnieżdżone elementy

```javascript
const card = h('div', { className: 'card' },
  h('h2', {}, 'Tytuł'),
  h('p', {}, 'Opis'),
  h('button', { onclick: () => alert('Klik!') }, 'Akcja')
);
```

### 4. Dodawanie do DOM

```javascript
// Znajdź kontener
const container = qs('#app');

// Dodaj element
container.appendChild(card);

// Lub zamień całą zawartość
import { replace } from './dom-helpers.js';
replace(container, card);
```

---

## 📝 Przykład: Refaktoryzacja istniejącego kodu

### Przed (Vanilla JS):

```javascript
function renderQuizCard(quiz) {
  const card = document.createElement('div');
  card.className = 'bg-gray-800 rounded-lg p-6 mb-4 cursor-pointer hover:bg-gray-700 transition';
  
  const header = document.createElement('div');
  header.className = 'flex justify-between items-start mb-3';
  
  const title = document.createElement('h3');
  title.className = 'text-xl font-bold text-white';
  title.textContent = quiz.title;
  
  const badge = document.createElement('span');
  badge.className = quiz.is_sample 
    ? 'bg-blue-600 text-white px-2 py-1 rounded text-sm' 
    : 'bg-green-600 text-white px-2 py-1 rounded text-sm';
  badge.textContent = quiz.is_sample ? 'Przykład' : 'Mój';
  
  header.appendChild(title);
  header.appendChild(badge);
  
  const description = document.createElement('p');
  description.className = 'text-gray-400 mb-4';
  description.textContent = quiz.description;
  
  const footer = document.createElement('div');
  footer.className = 'flex justify-between items-center';
  
  const info = document.createElement('span');
  info.className = 'text-sm text-gray-500';
  info.textContent = `${quiz.questions?.length || 0} pytań`;
  
  const startBtn = document.createElement('button');
  startBtn.className = 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition';
  startBtn.textContent = 'Rozpocznij →';
  startBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    startQuiz(quiz.id);
  });
  
  footer.appendChild(info);
  footer.appendChild(startBtn);
  
  card.appendChild(header);
  card.appendChild(description);
  card.appendChild(footer);
  
  card.addEventListener('click', () => {
    showQuizDetails(quiz.id);
  });
  
  return card;
}
```

**Statystyki:**
- 📏 45 linii kodu
- 🔢 15 wywołań `createElement`
- 🐌 Trudne do czytania
- 🔧 Trudne do modyfikacji

---

### Po (z DOM Helpers):

```javascript
import { h } from './dom-helpers.js';

function renderQuizCard(quiz) {
  return h('div', {
    className: 'bg-gray-800 rounded-lg p-6 mb-4 cursor-pointer hover:bg-gray-700 transition',
    onclick: () => showQuizDetails(quiz.id)
  },
    h('div', { className: 'flex justify-between items-start mb-3' },
      h('h3', { className: 'text-xl font-bold text-white' }, quiz.title),
      h('span', {
        className: quiz.is_sample 
          ? 'bg-blue-600 text-white px-2 py-1 rounded text-sm' 
          : 'bg-green-600 text-white px-2 py-1 rounded text-sm'
      }, quiz.is_sample ? 'Przykład' : 'Mój')
    ),
    h('p', { className: 'text-gray-400 mb-4' }, quiz.description),
    h('div', { className: 'flex justify-between items-center' },
      h('span', { className: 'text-sm text-gray-500' }, 
        `${quiz.questions?.length || 0} pytań`
      ),
      h('button', {
        className: 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition',
        onclick: (e) => {
          e.stopPropagation();
          startQuiz(quiz.id);
        }
      }, 'Rozpocznij →')
    )
  );
}
```

**Statystyki:**
- 📏 23 linie kodu (**-49%** 🎉)
- 🔢 0 wywołań `createElement`
- ⚡ Łatwe do czytania (struktura jak HTML)
- 🔧 Łatwe do modyfikacji

---

## 🎯 Najczęstsze Use Cases

### 1. Lista elementów

```javascript
import { h, replace } from './dom-helpers.js';

function renderList(items) {
  const container = qs('#list');
  
  const elements = items.map(item =>
    h('div', { className: 'item' },
      h('span', {}, item.name),
      h('button', { 
        onclick: () => deleteItem(item.id) 
      }, '🗑️')
    )
  );
  
  replace(container, ...elements);
}
```

### 2. Formularz

```javascript
import { h, inputEl, button } from './dom-helpers.js';

const form = h('form', {
  className: 'space-y-4',
  onsubmit: (e) => {
    e.preventDefault();
    handleSubmit(new FormData(e.target));
  }
},
  h('div', {},
    h('label', {}, 'Email'),
    inputEl({ 
      type: 'email', 
      name: 'email',
      placeholder: 'twoj@email.com',
      required: true
    })
  ),
  button('Wyślij', { type: 'submit' })
);
```

### 3. Loading state

```javascript
import { h, loading, replace } from './dom-helpers.js';

async function loadData() {
  const container = qs('#content');
  
  // Show loading
  replace(container,
    h('div', { className: 'text-center py-12' },
      loading('lg'),
      h('p', { className: 'mt-4 text-gray-400' }, 'Ładowanie...')
    )
  );
  
  // Load data
  const data = await fetchData();
  
  // Show content
  replace(container, renderContent(data));
}
```

### 4. Modal/Dialog

```javascript
import { h, show, hide } from './dom-helpers.js';

function showConfirmDialog(message, onConfirm) {
  const modal = h('div', {
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
    onclick: () => hide(modal)
  },
    h('div', {
      className: 'bg-gray-800 rounded-lg p-6 max-w-md',
      onclick: (e) => e.stopPropagation()
    },
      h('p', { className: 'mb-6' }, message),
      h('div', { className: 'flex gap-3 justify-end' },
        h('button', {
          className: 'px-4 py-2 rounded bg-gray-700',
          onclick: () => hide(modal)
        }, 'Anuluj'),
        h('button', {
          className: 'px-4 py-2 rounded bg-blue-600',
          onclick: () => {
            onConfirm();
            hide(modal);
          }
        }, 'OK')
      )
    )
  );
  
  document.body.appendChild(modal);
  show(modal);
}
```

---

## 💡 Wskazówki

### ✅ DO:
- Używaj `h()` dla wszystkich nowych komponentów
- Grupuj powiązane elementy w funkcje
- Używaj `replace()` zamiast `innerHTML = ''`
- Używaj event delegation z `on()` dla dynamicznych list

### ❌ DON'T:
- Nie mieszaj `h()` z `createElement()` w tym samym komponencie
- Nie używaj `innerHTML` jeśli masz dane użytkownika (XSS risk)
- Nie twórz zbyt głębokich zagnieżdżeń (max 4-5 poziomów)

---

## 🔄 Migracja krok po kroku

### Krok 1: Zacznij od małych komponentów
```javascript
// Najpierw proste rzeczy jak przyciski, karty
function createButton(text, onClick) {
  return h('button', { 
    className: 'btn',
    onclick: onClick 
  }, text);
}
```

### Krok 2: Refaktoryzuj większe komponenty
```javascript
// Potem całe widoki
function renderQuizList(quizzes) {
  return h('div', { className: 'quiz-list' },
    ...quizzes.map(quiz => renderQuizCard(quiz))
  );
}
```

### Krok 3: Aktualizuj główne widoki
```javascript
// Na końcu główne ekrany aplikacji
function renderMainView() {
  return h('div', { className: 'main-view' },
    renderHeader(),
    renderContent(),
    renderFooter()
  );
}
```

---

## 📚 Więcej przykładów

Zobacz **[DOM_HELPERS_EXAMPLES.md](DOM_HELPERS_EXAMPLES.md)** dla:
- Zaawansowanych przykładów
- Tabs component
- Toast notifications
- Form validation
- Dynamic lists
- i więcej!

---

## 🆘 Pomoc

### Problem: "Cannot find module"
```javascript
// ❌ Zły import
import { h } from 'dom-helpers.js';

// ✅ Dobry import (relative path)
import { h } from './dom-helpers.js';
```

### Problem: "h is not a function"
```javascript
// Upewnij się, że plik ma type="module"
<script type="module" src="js/app.js"></script>
```

### Problem: "Cannot read property 'appendChild'"
```javascript
// Sprawdź czy element istnieje
const container = qs('#app');
if (container) {
  container.appendChild(element);
}
```

---

**Happy coding!** 🚀

Masz pytania? Zobacz pełną dokumentację w:
- `js/dom-helpers.js` (kod z JSDoc)
- `DOM_HELPERS_EXAMPLES.md` (zaawansowane przykłady)




