# Stos Technologiczny - Wersja 2.0

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
- **Vanilla JavaScript**: Bez frameworków, ale z użyciem biblioteki klienckiej `supabase-js`.
- **Moduły**: Kod podzielony na logiczne moduły
- **Struktura modułów**:
  - `app.js` - główna logika aplikacji, routing, zarządzanie stanem
  - `supabase-client.js` - inicjalizacja klienta Supabase i funkcje pomocnicze
  - `quiz-engine.js` - renderowanie i obsługa quizów
  - `workout-engine.js` - renderowanie i obsługa treningów
  - `audio.js` - generowanie dźwięków przez Web Audio API

### Web APIs
- **localStorage**: Zapisywanie stanu UI (np. ostatnio wybrana zakładka) oraz postępów w quizach/treningach (w tej wersji).
- **fetch API**: Używane wewnętrznie przez `supabase-js`, a także do komunikacji z OpenRouter API.
- **Web Audio API**: Generowanie dźwięków bez zewnętrznych plików audio
- **Screen Wake Lock API**: Zapobieganie wygaszaniu ekranu podczas treningów

## Backend i Dane

### Supabase
Platforma Backend as a Service (BaaS), która dostarcza kluczowe usługi:
- **Supabase Database**: Baza danych PostgreSQL do przechowywania quizów i treningów użytkowników. Struktura danych będzie oparta na [DATA_FORMAT.md](DATA_FORMAT.md).
- **Supabase Auth**: Kompletne rozwiązanie do uwierzytelniania. Będziemy używać logowania przez e-mail/hasło, z możliwością rozszerzenia o logowanie przez Google/GitHub.
- **Supabase Storage**: (Opcjonalnie w przyszłości) Do przechowywania mediów (obrazków/GIF-ów) powiązanych z ćwiczeniami.
- **Row Level Security (RLS)**: Kluczowa funkcja bezpieczeństwa, zapewniająca, że użytkownicy mają dostęp wyłącznie do swoich danych.

### Hosting
- **GitHub Pages**: Aplikacja frontendowa (pliki HTML, CSS, JS) będzie nadal hostowana jako strona statyczna na GitHub Pages.

## Narzędzia Deweloperskie

### Supabase CLI (opcjonalnie)
- **Zastosowanie**: Może być używane do zarządzania migracjami bazy danych i środowiskiem deweloperskim.

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
- Screen Wake Lock API (opcjonalne - graceful degradation)
- CSS Grid & Flexbox

## Responsywność

### Breakpointy (Tailwind)
- **Mobile**: < 640px (domyślny)
- **Tablet**: 640px - 1024px (`sm:`, `md:`)
- **Desktop**: > 1024px (`lg:`, `xl:`)

### Podejście
- **Mobile-first**: Projektujemy najpierw dla małych ekranów
- **Progressive enhancement**: Dodajemy funkcje dla większych ekranów

