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
- **Vanilla JavaScript**: Bez frameworków, ale z użyciem biblioteki klienckiej `supabase-js`
- **Moduły**: Kod podzielony na logiczne moduły
- **Struktura modułów**:
  - `app.js` - główna logika aplikacji, routing, zarządzanie stanem
  - `supabase-client.js` - inicjalizacja klienta Supabase i funkcje pomocnicze
  - `auth-service.js` - obsługa autentykacji użytkowników
  - `data-service.js` - operacje CRUD na bazie danych
  - `quiz-engine.js` - renderowanie i obsługa quizów
  - `workout-engine.js` - renderowanie i obsługa treningów
  - `listening-engine.js` - odtwarzacz audio dla nauki językowej (TTS)
  - `ui-manager.js` - zarządzanie interfejsem użytkownika
  - `content-manager.js` - import i zarządzanie treściami
  - `session-manager.js` - zarządzanie sesjami użytkownika
  - `audio.js` - generowanie dźwięków przez Web Audio API
  - `ai-prompts.js` - szablony promptów dla generatora AI

### Web APIs
- **localStorage**: Zapisywanie stanu UI (np. ostatnio wybrana zakładka) oraz postępów w quizach/treningach
- **fetch API**: Używane wewnętrznie przez `supabase-js`, a także do komunikacji z OpenRouter API
- **Web Audio API**: Generowanie dźwięków bez zewnętrznych plików audio
- **Web Speech API**: Synteza mowy (TTS) dla funkcji "Nauka ze Słuchu"
- **Screen Wake Lock API**: Zapobieganie wygaszaniu ekranu podczas treningów

---

## Backend i Dane

### Supabase
Platforma Backend as a Service (BaaS), która dostarcza kluczowe usługi:

#### Supabase Database (PostgreSQL)
Baza danych do przechowywania:
- **Quizy**: Tabele `quizzes` (metadane) i `questions` (pytania w JSONB)
- **Treningi**: Tabele `workouts` (metadane), `phases` (fazy) i `exercises` (ćwiczenia w JSONB)
- **Zestawy Językowe**: Tabela `listening_sets` (metadane + pary językowe w JSONB)

Struktura oparta na [DATA_FORMAT.md](DATA_FORMAT.md).

#### Supabase Auth
- **Logowanie przez email/hasło**: Podstawowa autentykacja
- **Sesje**: Automatyczne zarządzanie tokenami i sesjami
- **Przyszłość**: OAuth (Google, GitHub)

#### Supabase Storage (Opcjonalnie)
- Do przechowywania mediów (obrazków/GIF-ów) powiązanych z ćwiczeniami

#### Row Level Security (RLS)
Kluczowa funkcja bezpieczeństwa:
- Użytkownicy mają dostęp tylko do własnych danych (`user_id = auth.uid()`)
- Wszystkie tabele chronione politykami RLS
- Sample content (publiczny) dostępny dla wszystkich (`is_sample = TRUE`)

### Hosting
- **GitHub Pages**: Aplikacja frontendowa (pliki HTML, CSS, JS) hostowana jako strona statyczna
- **URL**: `https://[username].github.io/[repo-name]`

### AI Integration
- **OpenRouter API**: Generowanie treści (quizów, treningów, zestawów językowych)
- **Modele**: Zgodnie z [OPENROUTER_MODELS.md](OPENROUTER_MODELS.md)

---

## Narzędzia Deweloperskie

### Supabase CLI (opcjonalnie)
- **Zastosowanie**: Zarządzanie migracjami bazy danych i środowiskiem deweloperskim
- **Pliki**: `/supabase/schema.sql`, `/supabase/insert_samples.sql`

### Git
- **Kontrola wersji**: Śledzenie zmian w kodzie
- **Hosting**: GitHub

### Node.js (opcjonalnie)
- **Wersja**: 14.x lub nowsza
- **Zastosowanie**: Skrypty pomocnicze (np. `generate-manifest.js` dla legacy content)

---

## Wymagania Przeglądarki

### Minimalne Wymagania
- **Chrome/Edge**: v90+ (zalecane dla najlepszego wsparcia TTS)
- **Firefox**: v88+
- **Safari**: v14+
- **Opera**: v76+

### Wymagane API
- ES6 Modules
- fetch API
- localStorage
- Web Audio API
- Web Speech API (dla funkcji TTS)
- Screen Wake Lock API (opcjonalne - graceful degradation)
- CSS Grid & Flexbox

### Wsparcie dla Web Speech API
- **Chrome/Edge**: Pełne wsparcie
- **Safari**: Częściowe wsparcie (zależy od systemu operacyjnego)
- **Firefox**: Ograniczone wsparcie

---

## Responsywność

### Breakpointy (Tailwind)
- **Mobile**: < 640px (domyślny)
- **Tablet**: 640px - 1024px (`sm:`, `md:`)
- **Desktop**: > 1024px (`lg:`, `xl:`)

### Podejście
- **Mobile-first**: Projektujemy najpierw dla małych ekranów
- **Progressive enhancement**: Dodajemy funkcje dla większych ekranów
- **Safe Area**: Obsługa notch na iOS (`safe-area-inset-bottom`)

### Nowa Nawigacja (Tab Bar)
- **Dolny pasek nawigacji**: Zawsze widoczny na dole ekranu
- **4 główne taby**: Quizy, Treningi, Słuchanie, Więcej
- **Responsywność**: Automatyczne dopasowanie do rozmiaru ekranu
- **Ikony + tekst**: Czytelne na wszystkich urządzeniach

---

## Architektura Danych

### Struktura Bazy Danych

```
listening_sets          quizzes                workouts
├── id                  ├── id                 ├── id
├── user_id             ├── user_id            ├── user_id
├── title               ├── title              ├── title
├── description         ├── description        ├── description
├── lang1_code          ├── is_sample          ├── is_sample
├── lang2_code          └── created_at         └── created_at
├── content (JSONB)            ↓                      ↓
├── is_sample               questions             phases
└── created_at              ├── id                ├── id
                            ├── quiz_id           ├── workout_id
                            ├── order             ├── order
                            └── data (JSONB)      └── name
                                                      ↓
                                                  exercises
                                                  ├── id
                                                  ├── phase_id
                                                  ├── order
                                                  └── data (JSONB)
```

### Bezpieczeństwo RLS

Każda tabela ma polityki:
- **SELECT**: `is_sample = TRUE OR user_id = auth.uid()`
- **INSERT**: `auth.uid() IS NOT NULL AND user_id = auth.uid()`
- **UPDATE**: `user_id = auth.uid() AND is_sample = FALSE`
- **DELETE**: `user_id = auth.uid() AND is_sample = FALSE`

---

## Przepływ Danych

### Ładowanie Treści
```
User → App → Supabase Client → PostgreSQL (RLS) → Data → Render
```

### Tworzenie Treści (Import JSON)
```
User → Upload JSON → Validate → App → Supabase Client → INSERT → Database
```

### Tworzenie Treści (AI Generator)
```
User → Prompt → OpenRouter API → JSON → Validate → Supabase → Database
```

### Odtwarzacz Językowy (Listening)
```
User → Select Set → Load from DB → Render Player → Web Speech API → TTS
```

---

## Performance

### Optymalizacje
- **Lazy Loading**: Ładowanie danych tylko gdy są potrzebne
- **Client-side Caching**: `localStorage` dla stanu UI
- **Indexed DB**: (Przyszłość) Dla offline support
- **CDN**: Tailwind CSS z CDN
- **Minifikacja**: (Produkcja) Minifikacja JS/CSS

### Target Metrics
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 2s
- **Largest Contentful Paint**: < 2.5s

---

## Diagram Architektury

```
┌─────────────────────────────────────────────────────┐
│                 GitHub Pages (Static)                │
│  ┌────────────────────────────────────────────────┐ │
│  │          index.html + JS Modules               │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────┬───────────────────────────┘
                          │
                          ↓
          ┌───────────────────────────────┐
          │    Supabase (Backend)         │
          ├───────────────────────────────┤
          │  • PostgreSQL Database        │
          │    - quizzes, questions       │
          │    - workouts, phases, exs    │
          │    - listening_sets           │
          │  • Authentication             │
          │  • Row Level Security         │
          └───────────────────────────────┘
                          │
                          ↓
          ┌───────────────────────────────┐
          │   External APIs               │
          ├───────────────────────────────┤
          │  • OpenRouter (AI)            │
          │  • Web Speech API (TTS)       │
          └───────────────────────────────┘
```

---

**Wersja dokumentu**: 2.0  
**Ostatnia aktualizacja**: 2025-10-28
