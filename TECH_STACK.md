# Stos Technologiczny

## Frontend

### HTML5
- **Jeden plik**: `index.html` jako główny punkt wejścia aplikacji
- **Struktura**: Single Page Application (SPA) - cała nawigacja odbywa się bez przeładowania strony
- **Semantyczny HTML**: Używamy odpowiednich tagów dla lepszej dostępności

### CSS - Tailwind CSS (v3.x)
- **Źródło**: CDN (`https://cdn.tailwindcss.com`)
- **Dlaczego Tailwind**: 
  - Szybka stylizacja bez pisania własnego CSS
  - Wbudowane klasy responsywne (mobile-first)
  - Małe rozmiary w produkcji
- **Motyw**: Ciemny (dark mode)
- **Kolorystyka**:
  - Tło: Ciemnoszare/czarne (`bg-gray-900`, `bg-gray-800`)
  - Przyciski główne: Niebieski (`bg-blue-600`)
  - Poprawna odpowiedź: Zielony (`bg-green-600`)
  - Błędna odpowiedź: Czerwony (`bg-red-600`)
  - Tekst: Jasny szary/biały (`text-gray-100`, `text-white`)

### JavaScript (ES6+)
- **Vanilla JavaScript**: Bez frameworków (React, Vue, etc.)
- **Moduły**: Kod podzielony na logiczne moduły
- **Struktura modułów**:
  - `app.js` - główna logika aplikacji, routing, zarządzanie stanem
  - `quiz-engine.js` - renderowanie i obsługa quizów
  - `workout-engine.js` - renderowanie i obsługa treningów
  - `audio.js` - generowanie dźwięków przez Web Audio API

### Web APIs
- **localStorage**: Zapisywanie postępu sesji
- **fetch API**: Ładowanie plików JSON
- **Web Audio API**: Generowanie dźwięków bez zewnętrznych plików audio

## Backend / Hosting

### GitHub Pages
- **Hosting**: Darmowy, statyczny hosting
- **Deployment**: Automatyczny po push do brancha `main` lub `gh-pages`
- **URL**: `https://[username].github.io/[repo-name]`

### Dane
- **Format**: JSON
- **Struktura folderów**:
  - `/data/quizzes/` - pliki z quizami
  - `/data/workouts/` - pliki z treningami
  - `/data/manifest.json` - automatycznie generowana lista plików

## Narzędzia Deweloperskie

### Node.js (opcjonalnie)
- **Wersja**: 14.x lub nowsza
- **Zastosowanie**: Skrypt do generowania `manifest.json`
- **Skrypt**: `generate-manifest.js`

### Git
- **Kontrola wersji**: Śledzenie zmian w kodzie
- **Hosting**: GitHub

## Wymagania Przeglądarki

### Minimalne Wymagania
- **Chrome/Edge**: v90+
- **Firefox**: v88+
- **Safari**: v14+
- **Opera**: v76+

### Wymagane API
- ES6 Modules
- fetch API
- localStorage
- Web Audio API
- CSS Grid & Flexbox

## Responsywność

### Breakpointy (Tailwind)
- **Mobile**: < 640px (domyślny)
- **Tablet**: 640px - 1024px (`sm:`, `md:`)
- **Desktop**: > 1024px (`lg:`, `xl:`)

### Podejście
- **Mobile-first**: Projektujemy najpierw dla małych ekranów
- **Progressive enhancement**: Dodajemy funkcje dla większych ekranów

