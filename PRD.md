# PRD: Interaktywna Aplikacja z Quizami, Treningami i Nauką Językową

> **Dokument Wymagań Produktowych** (Product Requirements Document) - Wersja 2.0

## 📌 Dokumentacja Projektu

Ten dokument stanowi główny punkt odniesienia dla projektu. Szczegółowe informacje znajdują się w dedykowanych plikach:

- **[README.md](README.md)** - Instrukcja instalacji i użytkowania
- **[TECH_STACK.md](TECH_STACK.md)** - Szczegóły techniczne i architektura
- **[DATA_FORMAT.md](DATA_FORMAT.md)** - Specyfikacja formatów JSON (dla twórców treści i AI)
- **[IMPLEMENTATION_PLAN_LISTENING.md](IMPLEMENTATION_PLAN_LISTENING.md)** - Plan implementacji funkcji "Nauka ze Słuchu"

---

## 1. Cel Projektu

Stworzenie dynamicznej, interaktywnej aplikacji internetowej (Single Page Application) opartej o **Supabase**. Aplikacja umożliwia zalogowanym użytkownikom:
- **Tworzenie i zarządzanie** własną bazą quizów i treningów
- **Importowanie** treści z plików JSON
- **Generowanie** treści przy pomocy AI
- Rozwiązywanie **quizów** z różnymi typami pytań
- Przeprowadzanie **interaktywnych treningów** fitness z timerem
- **Naukę języków** przez słuchanie par słówek/zdań z syntezatorem mowy (TTS)

**Kluczowe cechy:**
- Prosta w obsłudze
- Responsywna (mobile-first)
- Nowoczesny, ciemny interfejs
- **Centralna baza danych (Supabase)** z zabezpieczeniami RLS
- **Konta użytkowników** i personalizacja treści

---

## 2. Stos Technologiczny

> Szczegóły: [TECH_STACK.md](TECH_STACK.md)

- **HTML5**: Jeden plik `index.html` jako szkielet SPA
- **CSS**: Tailwind CSS (CDN) - ciemny motyw, responsywność
- **JavaScript**: Vanilla ES6+ z biblioteką `supabase-js`
- **Backend**: **Supabase** (PostgreSQL, Authentication, Storage)
- **Hosting**: GitHub Pages
- **AI**: OpenRouter API (dla generatora treści)

---

## 3. Struktura Plików

```
/
├── index.html                          # Główna strona aplikacji
├── README.md                           # Instrukcja użytkowania
├── PRD.md                              # Ten dokument
├── TECH_STACK.md                       # Dokumentacja techniczna
├── DATA_FORMAT.md                      # Specyfikacja formatów JSON
├── IMPLEMENTATION_PLAN_LISTENING.md    # Plan implementacji Listening
│
├── /js/
│   ├── app.js                          # Główna logika, routing, stan
│   ├── supabase-client.js              # Klient Supabase
│   ├── auth-service.js                 # Obsługa autentykacji
│   ├── data-service.js                 # Operacje CRUD
│   ├── quiz-engine.js                  # Renderowanie i obsługa quizów
│   ├── workout-engine.js               # Renderowanie i obsługa treningów
│   ├── listening-engine.js             # Odtwarzacz audio (TTS)
│   ├── ui-manager.js                   # Zarządzanie UI
│   ├── content-manager.js              # Import/zarządzanie treściami
│   ├── session-manager.js              # Zarządzanie sesjami
│   ├── audio.js                        # Generowanie dźwięków
│   └── ai-prompts.js                   # Prompty dla AI
│
├── /supabase/
│   ├── schema.sql                      # Schema bazy danych
│   └── insert_samples.sql              # Przykładowe dane
│
└── /data/                               # (Legacy - dla kompatybilności)
    ├── manifest.json
    ├── /quizzes/
    └── /workouts/
```

---

## 4. Główne Funkcjonalności

### 4.1 Zarządzanie Użytkownikami (Supabase Auth)
- **Rejestracja i Logowanie**: Email/hasło (możliwość rozszerzenia o OAuth)
- **Sesje**: Utrzymywanie sesji użytkownika
- **Bezpieczeństwo**: Row Level Security - dane każdego użytkownika są odizolowane
- **Reset hasła**: Funkcjonalność przypominania hasła przez email

### 4.2 Nawigacja i UI
- **Dolny Pasek Nawigacji (Tab Bar)**: Nowoczesna nawigacja z 4 tabami:
  - 📝 **Quizy** - lista dostępnych quizów
  - 💪 **Treningi** - lista dostępnych treningów
  - 🎧 **Słuchanie** - zestawy do nauki językowej
  - ☰ **Więcej** - Generator AI, Import, Ustawienia
- **Strona główna**: 
  - Dla niezalogowanych: landing page + dostęp do przykładowych (sample) treści
  - Dla zalogowanych: dostęp do sample content + własne materiały
- **Dynamiczne ładowanie**: Wszystkie treści pobierane z Supabase
- **Responsywność**: Mobile-first design z przystosowaniem do notch (safe-area)

### 4.3 Zarządzanie Treściami
- **Import z JSON**: Wgranie pliku lub wklejenie treści (format zgodny z `DATA_FORMAT.md`)
- **Generator AI z OpenRouter**: Generowanie quizów, treningów i zestawów językowych na podstawie opisu
- **Widok "Moje Treści"**: Zarządzanie własnymi materiałami
- **Sample Content**: Publiczne, przykładowe treści dostępne dla wszystkich

### 4.4 Quizy
- **Typy pytań**:
  - Multiple Choice (wybór wielokrotny)
  - Fill in the Blank (uzupełnianie luk)
  - True/False (prawda/fałsz)
  - Matching (dopasowywanie)
  - Listening (pytania słuchowe z TTS)
- **Funkcje**:
  - Feedback z wyjaśnieniami
  - Podsumowanie z wynikami (%, liczba poprawnych)
  - Walidacja odpowiedzi (bez względu na wielkość liter i akcenty)
  - Losowa kolejność pytań (opcjonalnie)
  - Pomijanie pytań słuchowych (opcjonalnie)
  - Powtarzanie błędnych pytań
  - Zapisywanie postępu w localStorage

### 4.5 Treningi
- **Typy ćwiczeń**:
  - Na czas (z odliczaniem)
  - Na powtórzenia (użytkownik potwierdza wykonanie)
- **Funkcje**:
  - Struktura fazowa (rozgrzewka, główna część, rozciąganie)
  - Timer z wizualizacją (ostatnie 5s - czerwony, pulsujący)
  - Szczegółowe opisy techniki wykonania
  - Ekran końcowy z gratulacjami
  - Wake Lock API (ekran nie wygasa)
  - Zapisywanie postępu w localStorage
  - Pomijanie ćwiczeń

### 4.6 Nauka ze Słuchu (Nowa Funkcjonalność)
- **Odtwarzacz Audio**: Dedykowany interfejs do odtwarzania par słówek/zdań przy użyciu TTS (Web Speech API)
- **Kontrolki odtwarzania**:
  - Play/Pauza
  - Zapętlanie całej listy
  - Zmiana kolejności języków (np. PL→ES lub ES→PL)
  - Nawigacja (poprzednia/następna para)
- **Struktura Danych**: 
  - Zestawy przechowywane w bazie Supabase (tabela `listening_sets`)
  - Pary językowe w formacie JSON
  - Wsparcie dla dowolnych języków (kody np. pl-PL, es-ES, en-US)
- **Wizualizacja**: Synchroniczne wyświetlanie tekstów z odtwarzaniem
- **Obsługa Sekcji**: Grupowanie w logiczne sekcje z nagłówkami (anonsowane przez lektora)
- **Inteligentne Przerwy**:
  - 1s między językami w parze
  - 3s między parami
  - 4s po nagłówkach sekcji

### 4.7 Dodatkowe Funkcje
- **Utrwalanie sesji**: `localStorage` - zapisywanie postępu quizów i treningów
- **Powrót do sesji**: Dialog "Czy chcesz kontynuować?" po powrocie
- **Sygnały dźwiękowe**: 
  - Poprawna odpowiedź (pozytywny ton)
  - Błędna odpowiedź (negatywny ton)
  - Koniec timera (dwa krótkie sygnały)
  - Przycisk wyciszania (globalny)
- **Obsługa błędów**: Komunikaty przy problemach z ładowaniem danych

---

## 5. Format Danych

> **Pełna specyfikacja**: [DATA_FORMAT.md](DATA_FORMAT.md)

Format danych opisany w `DATA_FORMAT.md` służy jako:
1. **Schemat dla tabel** w bazie danych Supabase
2. **Walidator formatu** podczas importu z plików JSON
3. **Szablon dla AI** przy generowaniu treści

### 5.1 Quizy (Baza Danych: `quizzes`, `questions`)

```json
{
  "title": "Tytuł Quizu",
  "description": "Krótki opis",
  "questions": [
    {
      "type": "multiple-choice | fill-in-the-blank | true-false | matching | listening",
      // ... pola specyficzne dla typu
    }
  ]
}
```

### 5.2 Treningi (Baza Danych: `workouts`, `phases`, `exercises`)

```json
{
  "title": "Nazwa Treningu",
  "description": "Opis i sprzęt",
  "phases": [
    {
      "name": "Nazwa fazy",
      "exercises": [
        {
          "name": "Nazwa ćwiczenia",
          "type": "time | reps",
          "duration": 60,
          "details": "...",
          "description": "..."
        }
      ]
    }
  ]
}
```

### 5.3 Zestawy do Nauki Słuchu (Baza Danych: `listening_sets`)

```json
{
  "title": "Hiszpański: Czasowniki ESTAR i IR",
  "description": "Odmiana i przykłady użycia",
  "lang1_code": "pl-PL",
  "lang2_code": "es-ES",
  "content": [
    { "pl": "--- CZASOWNIK: ESTAR ---", "es": "--- VERBO: ESTAR ---" },
    { "pl": "(Ja) jestem", "es": "(Yo) estoy" },
    { "pl": "Jestem zmęczony.", "es": "Estoy cansado." }
  ]
}
```

---

## 6. Workflow Dodawania Treści

### Dla Quizów i Treningów:
1. **Zaloguj się** do aplikacji
2. Przejdź do zakładki **"Więcej"** → wybierz opcję
3. **Import JSON**: Wgraj plik lub wklej treść
4. **Generator AI**: Wpisz opis i pozwól AI wygenerować treść
5. Aplikacja waliduje i **zapisuje w Supabase**
6. Treść jest natychmiast dostępna

### Dla Zestawów Językowych:
1. **Zaloguj się** do aplikacji
2. Przejdź do zakładki **"Słuchanie"**
3. (Przyszłość) Użyj Generatora AI lub importuj JSON
4. Zestaw zapisuje się w tabeli `listening_sets`
5. Natychmiast dostępny w odtwarzaczu

### Użycie AI do Generowania Treści

Możesz przekazać AI plik [DATA_FORMAT.md](DATA_FORMAT.md) wraz z instrukcją.

**Przykład**:
```
Przeczytaj DATA_FORMAT.md i wygeneruj quiz z 15 pytań 
o historii starożytnej Grecji. Użyj wszystkich typów pytań.
```

---

## 7. Architektura Bazy Danych

> Szczegóły: [DB_SCHEMA.md](DB_SCHEMA.md)

### Główne Tabele:
- **`quizzes`** - metadane quizów
- **`questions`** - pytania (JSONB)
- **`workouts`** - metadane treningów
- **`phases`** - fazy treningów
- **`exercises`** - ćwiczenia (JSONB)
- **`listening_sets`** - zestawy językowe (JSONB)

### Bezpieczeństwo:
- **Row Level Security (RLS)** na wszystkich tabelach
- Użytkownicy mają dostęp tylko do:
  - Własnych treści (`user_id = auth.uid()`)
  - Publicznych przykładów (`is_sample = TRUE`)

---

## 8. Wymagania Niefunkcjonalne

### 8.1 Wydajność
- Szybkie ładowanie (< 2s na 3G)
- Płynne animacje (60 FPS)
- Minimalne opóźnienia przy interakcji

### 8.2 Dostępność
- Semantyczny HTML
- Kontrast kolorów (WCAG AA)
- Obsługa klawiatury

### 8.3 Kompatybilność
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Urządzenia mobilne (iOS, Android)

### 8.4 Bezpieczeństwo
- **Backend (Supabase)**: Autoryzacja, RLS
- **Walidacja danych**: Walidacja JSON przed zapisem do bazy
- **Izolacja danych**: RLS zapewnia dostęp tylko do własnych danych

---

## 9. Przyszłe Rozszerzenia (Opcjonalne)

- 🔐 Logowanie przez OAuth (Google, GitHub)
- 🤝 Udostępnianie stworzonych treści innym użytkownikom
- 🖼️ Obrazki/GIF-y w ćwiczeniach (Supabase Storage)
- 📊 Statystyki długoterminowe w bazie danych
- 🏆 System osiągnięć/odznak
- 🌐 Wsparcie dla wielu języków interfejsu (i18n)
- 📱 Progressive Web App (PWA)
- 🔊 Regulacja prędkości mowy, wybór głosu TTS
- ⭐ System ulubionych/zakładek dla zestawów
- 📤 Eksport treści do pliku

---

## 10. Kontakt i Wsparcie

- **Issues**: [GitHub Issues](https://github.com/[username]/[repo]/issues)
- **Dokumentacja**: Pliki `.md` w repozytorium
- **Licencja**: MIT

---

**Wersja dokumentu**: 2.0  
**Ostatnia aktualizacja**: 2025-10-28
