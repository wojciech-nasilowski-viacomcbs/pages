# DOM Helpers - Przykłady Użycia

> **Nowy moduł**: `js/dom-helpers.js` - Funkcje pomocnicze do tworzenia i manipulacji elementami DOM

---

## 📚 Spis Treści

1. [Tworzenie Elementów](#tworzenie-elementów)
2. [Manipulacja Klasami](#manipulacja-klasami)
3. [Selektory](#selektory)
4. [Event Listeners](#event-listeners)
5. [Komponenty UI](#komponenty-ui)
6. [Przykłady Praktyczne](#przykłady-praktyczne)

---

## Tworzenie Elementów

### Podstawowe użycie `h()`

```javascript
import { h } from './dom-helpers.js';

// Prosty element
const div = h('div', { className: 'container' }, 'Hello World');

// Z wieloma dziećmi
const card = h('div', { className: 'card p-4' },
  h('h2', { className: 'text-xl font-bold' }, 'Tytuł'),
  h('p', { className: 'text-gray-600' }, 'Opis karty')
);

// Z event listenerami
const button = h('button', {
  className: 'btn btn-primary',
  onclick: () => alert('Clicked!')
}, 'Kliknij mnie');

// Z data attributes
const item = h('div', {
  className: 'item',
  dataset: {
    id: '123',
    type: 'quiz'
  }
}, 'Element');

// Z inline styles
const box = h('div', {
  style: {
    backgroundColor: 'blue',
    padding: '20px',
    borderRadius: '8px'
  }
}, 'Styled box');
```

### Przed vs Po (Porównanie)

#### ❌ Przed (Vanilla JS):

```javascript
function createQuizCard(quiz) {
  const card = document.createElement('div');
  card.className = 'bg-gray-800 rounded-lg p-6 cursor-pointer hover:bg-gray-700';
  
  const title = document.createElement('h3');
  title.className = 'text-xl font-bold mb-2';
  title.textContent = quiz.title;
  
  const desc = document.createElement('p');
  desc.className = 'text-gray-400 mb-4';
  desc.textContent = quiz.description;
  
  const button = document.createElement('button');
  button.className = 'bg-blue-600 text-white px-4 py-2 rounded';
  button.textContent = 'Rozpocznij';
  button.addEventListener('click', () => startQuiz(quiz.id));
  
  card.appendChild(title);
  card.appendChild(desc);
  card.appendChild(button);
  
  return card;
}
```

#### ✅ Po (z dom-helpers):

```javascript
import { h } from './dom-helpers.js';

function createQuizCard(quiz) {
  return h('div', {
    className: 'bg-gray-800 rounded-lg p-6 cursor-pointer hover:bg-gray-700'
  },
    h('h3', { className: 'text-xl font-bold mb-2' }, quiz.title),
    h('p', { className: 'text-gray-400 mb-4' }, quiz.description),
    h('button', {
      className: 'bg-blue-600 text-white px-4 py-2 rounded',
      onclick: () => startQuiz(quiz.id)
    }, 'Rozpocznij')
  );
}
```

**Korzyści:**
- 📉 50% mniej kodu
- 📖 Bardziej czytelne (struktura przypomina HTML)
- 🔧 Łatwiejsze w utrzymaniu
- ⚡ Szybsze pisanie

---

## Manipulacja Klasami

```javascript
import { addClass, removeClass, toggleClass } from './dom-helpers.js';

const button = document.getElementById('myButton');

// Dodaj klasy
addClass(button, 'active', 'highlighted');

// Usuń klasy
removeClass(button, 'disabled');

// Przełącz klasę
toggleClass(button, 'expanded');

// Chainable!
addClass(button, 'loading')
  .setAttribute('disabled', 'true');
```

---

## Selektory

```javascript
import { qs, qsa, byId } from './dom-helpers.js';

// querySelector (skrót)
const header = qs('.header');
const button = qs('.btn-primary', container); // Z parent

// querySelectorAll (skrót)
const items = qsa('.item');
items.forEach(item => console.log(item));

// getElementById (skrót)
const main = byId('main-content');
```

---

## Event Listeners

```javascript
import { on } from './dom-helpers.js';

// Bezpośredni listener
const removeListener = on(button, 'click', (e) => {
  console.log('Button clicked!');
});

// Później: usuń listener
removeListener();

// Event delegation
on(document, 'click', '.btn', (e) => {
  console.log('Button clicked:', e.target);
});

// Przykład: lista dynamiczna
on(document, 'click', '.delete-btn', (e) => {
  const item = e.target.closest('.item');
  item.remove();
});
```

---

## Komponenty UI

### Gotowe komponenty

```javascript
import { button, inputEl, loading, iconEl } from './dom-helpers.js';

// Przycisk
const saveBtn = button('Zapisz', {
  className: 'btn-primary',
  onClick: () => save()
});

// Input
const emailInput = inputEl({
  type: 'email',
  placeholder: 'Wpisz email',
  onInput: (e) => console.log(e.target.value)
});

// Loading spinner
const spinner = loading('lg'); // 'sm', 'md', 'lg'

// Ikona
const icon = iconEl('🎯', 'text-2xl');
```

---

## Przykłady Praktyczne

### 1. Lista Quizów

```javascript
import { h, qs, replace } from './dom-helpers.js';

function renderQuizList(quizzes) {
  const container = qs('#quiz-list');
  
  const items = quizzes.map(quiz => 
    h('div', {
      className: 'quiz-card bg-gray-800 rounded-lg p-6 mb-4 hover:bg-gray-700 transition',
      onclick: () => startQuiz(quiz.id)
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
    )
  );
  
  replace(container, ...items);
}
```

### 2. Modal Dialog

```javascript
import { h, show, hide, on } from './dom-helpers.js';

function createModal(title, content, onConfirm) {
  const modal = h('div', {
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden',
    id: 'modal'
  },
    h('div', {
      className: 'bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4',
      onclick: (e) => e.stopPropagation() // Prevent closing when clicking inside
    },
      h('h2', { className: 'text-2xl font-bold mb-4' }, title),
      h('div', { className: 'mb-6' }, content),
      h('div', { className: 'flex gap-3 justify-end' },
        h('button', {
          className: 'px-4 py-2 rounded bg-gray-700 hover:bg-gray-600',
          onclick: () => hide(modal)
        }, 'Anuluj'),
        h('button', {
          className: 'px-4 py-2 rounded bg-blue-600 hover:bg-blue-700',
          onclick: () => {
            onConfirm();
            hide(modal);
          }
        }, 'Potwierdź')
      )
    )
  );
  
  // Close on backdrop click
  on(modal, 'click', () => hide(modal));
  
  document.body.appendChild(modal);
  show(modal);
  
  return modal;
}

// Użycie:
createModal(
  'Usuń quiz',
  'Czy na pewno chcesz usunąć ten quiz?',
  () => deleteQuiz(quizId)
);
```

### 3. Form Builder

```javascript
import { h, inputEl, button } from './dom-helpers.js';

function createLoginForm(onSubmit) {
  const form = h('form', {
    className: 'space-y-4',
    onsubmit: (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      onSubmit({
        email: formData.get('email'),
        password: formData.get('password')
      });
    }
  },
    h('div', {},
      h('label', { 
        className: 'block text-sm font-medium mb-2' 
      }, 'Email'),
      inputEl({
        type: 'email',
        name: 'email',
        placeholder: 'twoj@email.com',
        className: 'w-full bg-gray-700 text-white',
        required: true
      })
    ),
    h('div', {},
      h('label', { 
        className: 'block text-sm font-medium mb-2' 
      }, 'Hasło'),
      inputEl({
        type: 'password',
        name: 'password',
        placeholder: '••••••••',
        className: 'w-full bg-gray-700 text-white',
        required: true
      })
    ),
    button('Zaloguj się', {
      className: 'w-full bg-blue-600 hover:bg-blue-700',
      type: 'submit'
    })
  );
  
  return form;
}
```

### 4. Toast Notifications

```javascript
import { h, show, hide, addClass } from './dom-helpers.js';

function showToast(message, type = 'info') {
  const colors = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    warning: 'bg-yellow-600',
    info: 'bg-blue-600'
  };
  
  const toast = h('div', {
    className: `${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg fixed bottom-4 right-4 z-50 transform translate-y-20 transition-transform duration-300`
  }, message);
  
  document.body.appendChild(toast);
  
  // Animate in
  setTimeout(() => {
    toast.style.transform = 'translateY(0)';
  }, 10);
  
  // Auto remove
  setTimeout(() => {
    toast.style.transform = 'translateY(100px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Użycie:
showToast('Quiz zapisany!', 'success');
showToast('Błąd połączenia', 'error');
```

### 5. Loading State

```javascript
import { h, loading, replace, clear } from './dom-helpers.js';

async function loadQuizzes() {
  const container = qs('#quiz-list');
  
  // Show loading
  replace(container,
    h('div', { className: 'flex justify-center items-center py-12' },
      loading('lg'),
      h('span', { className: 'ml-3 text-gray-400' }, 'Ładowanie quizów...')
    )
  );
  
  try {
    const quizzes = await fetchQuizzes();
    renderQuizList(quizzes);
  } catch (error) {
    replace(container,
      h('div', { className: 'text-center py-12' },
        h('p', { className: 'text-red-500 mb-4' }, '❌ Błąd ładowania'),
        h('button', {
          className: 'bg-blue-600 px-4 py-2 rounded',
          onclick: () => loadQuizzes()
        }, 'Spróbuj ponownie')
      )
    );
  }
}
```

### 6. Tabs Component

```javascript
import { h, addClass, removeClass, qsa } from './dom-helpers.js';

function createTabs(tabs) {
  let activeTab = tabs[0].id;
  
  const tabButtons = tabs.map(tab =>
    h('button', {
      className: `px-4 py-2 rounded-t ${tab.id === activeTab ? 'bg-gray-800 text-white' : 'bg-gray-700 text-gray-400'}`,
      dataset: { tab: tab.id },
      onclick: (e) => {
        // Update active tab
        activeTab = tab.id;
        
        // Update button styles
        qsa('[data-tab]').forEach(btn => {
          removeClass(btn, 'bg-gray-800', 'text-white');
          addClass(btn, 'bg-gray-700', 'text-gray-400');
        });
        addClass(e.target, 'bg-gray-800', 'text-white');
        removeClass(e.target, 'bg-gray-700', 'text-gray-400');
        
        // Update content
        qsa('[data-tab-content]').forEach(content => {
          content.classList.add('hidden');
        });
        qs(`[data-tab-content="${tab.id}"]`).classList.remove('hidden');
      }
    }, tab.label)
  );
  
  const tabContents = tabs.map(tab =>
    h('div', {
      className: tab.id === activeTab ? '' : 'hidden',
      dataset: { tabContent: tab.id }
    }, tab.content)
  );
  
  return h('div', {},
    h('div', { className: 'flex gap-2 mb-4' }, ...tabButtons),
    h('div', { className: 'bg-gray-800 rounded-lg p-6' }, ...tabContents)
  );
}

// Użycie:
const tabs = createTabs([
  { id: 'quizzes', label: 'Quizy', content: 'Lista quizów...' },
  { id: 'workouts', label: 'Treningi', content: 'Lista treningów...' },
  { id: 'listening', label: 'Słuchanie', content: 'Zestawy językowe...' }
]);
```

---

## 🎯 Best Practices

### 1. Komponenty Reusable

```javascript
// Stwórz bibliotekę komponentów
const UI = {
  card: (title, content, footer) => h('div', { className: 'card' },
    h('div', { className: 'card-header' }, title),
    h('div', { className: 'card-body' }, content),
    footer && h('div', { className: 'card-footer' }, footer)
  ),
  
  badge: (text, variant = 'primary') => h('span', {
    className: `badge badge-${variant}`
  }, text),
  
  alert: (message, type = 'info') => h('div', {
    className: `alert alert-${type}`
  }, message)
};

// Użycie:
const card = UI.card(
  'Tytuł',
  'Treść karty',
  UI.badge('Nowy', 'success')
);
```

### 2. Conditional Rendering

```javascript
function renderUser(user) {
  return h('div', { className: 'user-card' },
    h('h3', {}, user.name),
    user.isAdmin && h('span', { className: 'badge' }, 'Admin'),
    user.avatar 
      ? h('img', { src: user.avatar, alt: user.name })
      : h('div', { className: 'avatar-placeholder' }, user.name[0])
  );
}
```

### 3. Lists with Keys (manual tracking)

```javascript
function renderList(items) {
  return items.map(item =>
    h('div', {
      key: item.id, // For manual tracking
      dataset: { id: item.id },
      className: 'list-item'
    }, item.name)
  );
}
```

---

## 📊 Performance Tips

1. **Batch DOM updates** - Użyj `fragment()` dla wielu elementów
2. **Event delegation** - Użyj `on()` z selektorem zamiast wielu listenerów
3. **Reuse elements** - Aktualizuj istniejące elementy zamiast tworzyć nowe
4. **Clear properly** - Użyj `clear()` zamiast `innerHTML = ''`

---

## 🔗 Import w Projekcie

```javascript
// W pliku JS
import { h, qs, on, button } from './dom-helpers.js';

// Lub wszystko naraz
import * as DOM from './dom-helpers.js';

const card = DOM.h('div', {}, 'Content');
```

---

**Wersja dokumentu**: 1.0  
**Ostatnia aktualizacja**: 2025-10-28



