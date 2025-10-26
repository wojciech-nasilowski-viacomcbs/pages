# PRD: Wersja 2.0 - Aplikacja z Bazą Danych i Kontami Użytkowników

> **Dokument Wymagań Produktowych** (Product Requirements Document) - Wersja 2.0

## 📌 Dokumentacja Projektu

Ten dokument stanowi główny punkt odniesienia dla projektu. Szczegółowe informacje znajdują się w dedykowanych plikach:

- **[README.md](README.md)** - Instrukcja instalacji i użytkowania
- **[TECH_STACK_V2.md](TECH_STACK_V2.md)** - Szczegóły techniczne i architektura dla v2
- **[DATA_FORMAT.md](DATA_FORMAT.md)** - Specyfikacja formatów JSON (używana do importu i jako schemat bazy danych)

---

## 1. Cel Projektu

Stworzenie dynamicznej, interaktywnej aplikacji internetowej (Single Page Application) opartej o **Supabase**. Aplikacja będzie umożliwiać zalogowanym użytkownikom:
- **Tworzenie i zarządzanie** własną bazą quizów i treningów.
- **Importowanie** treści z plików JSON.
- **Generowanie** treści przy pomocy AI (w przyszłości).
- Rozwiązywanie quizów i przeprowadzanie interaktywnych treningów.

**Kluczowe cechy:**
- Prosta w obsłudze
- Responsywna (mobile-first)
- Nowoczesny, ciemny interfejs
- **Centralna baza danych (Supabase)** zamiast plików JSON
- **Konta użytkowników** i personalizacja treści

---

## 2. Stos Technologiczny

> Szczegóły: [TECH_STACK_V2.md](TECH_STACK_V2.md)

- **HTML5**: Jeden plik `index.html` jako szkielet SPA
- **CSS**: Tailwind CSS (CDN)
- **JavaScript**: Vanilla ES6+ z klientem `supabase-js`
- **Backend**: **Supabase** (Baza Danych, Autentykacja, Storage)
- **Hosting**: GitHub Pages

---

## 3. Struktura Plików (Proponowana)

```
/
├── index.html                 # Główna strona aplikacji
├── README.md                  # Instrukcja użytkowania
├── PRD_V2.md                  # Ten dokument
├── TECH_STACK_V2.md           # Dokumentacja techniczna v2
├── DATA_FORMAT.md             # Specyfikacja formatów JSON (dla importu)
│
└── /js/
    ├── app.js                 # Główna logika, routing, stan
    ├── supabase-client.js     # Konfiguracja i obsługa klienta Supabase
    ├── quiz-engine.js         # Renderowanie i obsługa quizów
    ├── workout-engine.js      # Renderowanie i obsługa treningów
    ├── audio.js               # Generowanie dźwięków (Web Audio API)
```
*Uwaga: Folder `/data` i skrypt `generate-manifest.js` stają się zbędne.*

---

## 4. Główne Funkcjonalności

### 4.1 Zarządzanie Użytkownikami (Supabase Auth)
- **Rejestracja i Logowanie**: Użytkownicy mogą tworzyć konta i logować się (początkowo email/hasło).
- **Sesje**: Utrzymywanie sesji użytkownika.
- **Bezpieczeństwo**: Dane każdego użytkownika są odizolowane (Row Level Security).

### 4.2 Zarządzanie Treściami
- **Import z JSON**: Zalogowany użytkownik może importować quizy i treningi poprzez wgranie pliku JSON lub wklejenie jego zawartości. Format musi być zgodny z `DATA_FORMAT.md`.
- **(Etap 2) Generator AI z OpenRouter**: Użytkownik podaje opis, a aplikacja generuje strukturę quizu/treningu i zapisuje ją w bazie danych.
- **Widok "Moje Treści"**: Dostęp do listy własnych, zaimportowanych lub wygenerowanych materiałów.

### 4.3 Nawigacja i UI
- **Strona główna**: 
  - Dla niezalogowanych: landing page z opisem aplikacji + dostęp do przykładowych (sample) quizów i treningów
  - Dla zalogowanych: dostęp do sample content + link do "Moje Treści"
- **Zakładka "Moje Treści"**: Dostępna tylko po zalogowaniu, pozwala zarządzać prywatnymi materiałami.
- **Dynamiczne ładowanie**: Wszystkie treści są pobierane dynamicznie z Supabase.

### 4.4 Quizy i Treningi
*Logika rozwiązywania quizów i przeprowadzania treningów pozostaje w dużej mierze niezmieniona, ale dane będą pobierane z Supabase, a nie z plików JSON.*

- **Typy pytań i ćwiczeń**: Bez zmian, zgodnie z `DATA_FORMAT.md`.
- **Zapisywanie postępów**: W tej wersji postępy nadal będą zapisywane w `localStorage`. W przyszłości rozważone będzie zapisywanie wyników i postępów na koncie użytkownika w bazie danych.

---

## 5. Format Danych

> **Pełna specyfikacja**: [DATA_FORMAT.md](DATA_FORMAT.md)

Format danych opisany w `DATA_FORMAT.md` pozostaje kluczowy. Będzie on służył jako:
1.  **Schemat dla tabel** w bazie danych Supabase.
2.  **Walidator formatu** podczas importu z plików JSON.

---

## 6. Workflow Dodawania Treści

1.  **Zaloguj się** do aplikacji.
2.  Przejdź do sekcji **"Moje Treści"** lub "Dodaj nowy".
3.  Wybierz jedną z opcji:
    - **Importuj JSON**: Wgraj plik lub wklej treść.
    - **(Etap 2) Generuj z AI**: Wpisz opis i pozwól AI stworzyć dane.
4.  Aplikacja waliduje dane i **zapisuje je w bazie Supabase**, przypisując do Twojego konta.
5.  Nowa treść jest natychmiast dostępna na Twojej liście.

### Użycie AI do Generowania Treści
Użytkownik otrzyma pole tekstowe, w którym opisuje, jaki quiz lub trening chce stworzyć. Aplikacja wyśle ten opis wraz z szablonem zapytania do API OpenRouter, a otrzymany JSON zapisze w bazie.

**Przykład szablonu zapytania**:
```
Na podstawie poniższego opisu i specyfikacji formatu z DATA_FORMAT.md, wygeneruj kompletny plik JSON.

Opis użytkownika: "Chcę quiz z 10 pytań o stolicach Europy. Pytania typu multiple-choice."
```

---

## 7. Wymagania Niefunkcjonalne

### 7.1 Wydajność
- Szybkie ładowanie (< 2s na 3G)
- Płynne animacje (60 FPS)
- Minimalne opóźnienia przy interakcji

### 7.2 Dostępność
- Semantyczny HTML
- Kontrast kolorów (WCAG AA)
- Obsługa klawiatury

### 7.3 Kompatybilność
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Urządzenia mobilne (iOS, Android)

### 7.4 Bezpieczeństwo
- **Backend (Supabase)**: Bezpieczeństwo zarządzane przez Supabase (autoryzacja, RLS).
- **Walidacja danych**: Walidacja importowanych danych JSON po stronie klienta przed wysłaniem do bazy.
- **Izolacja danych**: Użycie Row Level Security w Supabase, aby użytkownicy mieli dostęp tylko do swoich danych.

---

## 8. Przyszłe Rozszerzenia (Opcjonalne)

- 🔐 Wsparcie dla logowania przez dostawców OAuth (Google, GitHub)
- 🤝 Udostępnianie stworzonych treści innym użytkownikom
- 🖼️ Obrazki/GIF-y w ćwiczeniach (hostowane w Supabase Storage)
- 📊 Statystyki długoterminowe (wykres postępów)
- 🏆 System osiągnięć/odznak
- 🌐 Wsparcie dla wielu języków (i18n)
- 📱 Progressive Web App (PWA)
- 🔊 Nagrania głosowe z instrukcjami

---

## 9. Kontakt i Wsparcie

- **Issues**: [GitHub Issues](https://github.com/[username]/[repo]/issues)
- **Dokumentacja**: Pliki `.md` w repozytorium
- **Licencja**: MIT

---

**Wersja dokumentu**: 2.0  
**Ostatnia aktualizacja**: 2025-10-26
