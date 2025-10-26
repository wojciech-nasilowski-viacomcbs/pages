# Plan Implementacji - Wersja 2.0

> **Status**: Draft  
> **Data utworzenia**: 2025-10-26  
> **Cel**: Migracja z plików JSON do Supabase z systemem kont użytkowników

---

## 📋 Spis Treści
1. [Analiza Krytyczna](#analiza-krytyczna)
2. [Kluczowe Decyzje Projektowe](#kluczowe-decyzje-projektowe)
3. [Etapy Implementacji](#etapy-implementacji)
4. [Harmonogram i Priorytety](#harmonogram-i-priorytety)
5. [Potencjalne Ryzyka](#potencjalne-ryzyka)

---

## 🔍 Analiza Krytyczna

### Co działa dobrze w obecnym planie:
✅ Supabase jako wybór technologiczny - optymalny dla tego projektu  
✅ Schemat bazy danych jest prosty i skalowalny  
✅ Zachowanie istniejącej logiki quizów/treningów  
✅ Rezygnacja z tabeli `profiles` - słuszne uproszczenie  

### Znalezione niejasności i luki:

#### 1. **UX dla niezalogowanych użytkowników**
- ❓ Co widzi użytkownik niezalogowany na stronie głównej?
- ❓ Czy może przeglądać przykładowe (sample) treści bez logowania?
- ❓ Czy może rozwiązywać sample quizy bez konta?

**Rekomendacja**: Niezalogowani użytkownicy powinni:
- Widzieć landing page z opisem aplikacji
- Mieć dostęp do sample quizów/treningów (tylko odczyt)
- Zobaczyć wyraźny CTA do rejestracji/logowania

#### 2. **Inconsystencje w dokumentacji**
- `TECH_STACK_V2.md` linia 35: mówi o zapisywaniu postępów w Supabase (sprzeczne z ustaleniami)
- `TECH_STACK_V2.md` linia 44: wspomina o "profilach użytkowników" (już usunięte)
- `PRD_V2.md`: brak jasnego rozróżnienia między "publicznymi" a "sample" treściami

**Rekomendacja**: Ujednolicić terminologię - używać tylko "sample content" (is_sample=true)

#### 3. **Brakujące szczegóły techniczne**
- Brak polityk RLS w SQL (tylko opis tekstowy)
- Brak CASCADE DELETE dla integralności danych
- Brak walidatora JSON przed zapisem do bazy
- Brak obsługi błędów autentykacji (email confirmation, password reset)

#### 4. **Flow użytkownika**
- Brak onboardingu po pierwszej rejestracji
- Nie określono, co użytkownik widzi po zalogowaniu z pustym kontem
- Brak UI dla potwierdzenia usunięcia treści

---

## 🎯 Kluczowe Decyzje Projektowe

### Decyzja 1: Dostęp dla niezalogowanych
**Proponowane rozwiązanie**: 
- Strona główna = landing page z opisem
- Sample content dostępny dla wszystkich (niezalogowanych i zalogowanych)
- Przycisk "Zaloguj się" / "Zarejestruj się" widoczny w nagłówku
- Po zalogowaniu: przekierowanie do "Moje Treści"

### Decyzja 2: Sample Content
**Proponowane rozwiązanie**:
- 1 sample quiz + 1 sample workout z `user_id = NULL` i `is_sample = true`
- Polityka RLS umożliwia odczyt dla wszystkich (w tym niezalogowanych)
- Niemożliwe do edycji/usunięcia przez użytkowników

### Decyzja 3: Walidacja JSON
**Proponowane rozwiązanie**:
- Funkcja `validateQuizJSON(data)` i `validateWorkoutJSON(data)` w JS
- Sprawdzanie przed wysłaniem do Supabase
- Wyświetlanie przyjaznych komunikatów błędów

### Decyzja 4: Email Confirmation
**Proponowane rozwiązanie**:
- Supabase domyślnie wymaga potwierdzenia email
- Po rejestracji: informacja "Sprawdź swoją skrzynkę"
- Link w mailu przekierowuje z powrotem do aplikacji
- Supabase automatycznie obsługuje ten flow

---

## 🚀 Etapy Implementacji

### ETAP 0: Przygotowanie (1-2h)
**Zadania**:
- [ ] Poprawienie inconsystencji w `TECH_STACK_V2.md`
- [ ] Doprecyzowanie UX flow w `PRD_V2.md`
- [ ] Założenie projektu Supabase w konsoli
- [ ] Zapisanie kluczy API (URL + anon key) w bezpiecznym miejscu

**Deliverables**:
- Projekt Supabase gotowy do użycia
- Aktualizacja dokumentacji

---

### ETAP 1: Baza Danych i Sample Content (2-3h)

#### 1.1 Stworzenie Schematu SQL
**Zadania**:
- [ ] Napisać plik `supabase/schema.sql` z tabelami
- [ ] Dodać klucze obce z `ON DELETE CASCADE`
- [ ] Dodać indeksy dla `user_id`, `quiz_id`, `workout_id`
- [ ] Napisać polityki RLS dla wszystkich tabel
- [ ] Uruchomić SQL w konsoli Supabase

**Pliki do stworzenia**:
- `supabase/schema.sql`

#### 1.2 Sample Content
**Zadania**:
- [ ] Wybrać 1 istniejący quiz z `/data/quizzes/` jako sample
- [ ] Wybrać 1 istniejący trening z `/data/workouts/` jako sample
- [ ] Napisać skrypt `supabase/insert_samples.sql` do dodania ich do bazy
- [ ] Uruchomić skrypt w konsoli Supabase

**Pliki do stworzenia**:
- `supabase/insert_samples.sql`

**Kryteria akceptacji**:
- ✅ Wszystkie tabele utworzone w Supabase
- ✅ RLS włączone i przetestowane
- ✅ 1 sample quiz + 1 sample workout w bazie
- ✅ Możliwość odczytu sample content bez logowania

---

### ETAP 2: Integracja Supabase z Frontendem (2-3h)

#### 2.1 Konfiguracja Klienta
**Zadania**:
- [ ] Dodać `supabase-js` przez CDN do `index.html`
- [ ] Stworzyć `js/supabase-client.js` z inicjalizacją klienta
- [ ] Dodać funkcje pomocnicze: `getCurrentUser()`, `isLoggedIn()`
- [ ] Stworzyć `.env.example` z placeholder'ami dla kluczy

**Pliki do modyfikacji**:
- `index.html` (dodanie CDN)
- **NOWE**: `js/supabase-client.js`
- **NOWE**: `.env.example`

#### 2.2 Adaptery dla Danych
**Zadania**:
- [ ] Stworzyć `js/data-service.js` z funkcjami:
  - `fetchQuizzes(userOnly = false)` - pobiera quizy (swoje + sample)
  - `fetchWorkouts(userOnly = false)` - pobiera treningi
  - `fetchQuizById(id)` - pobiera szczegóły quizu z pytaniami
  - `fetchWorkoutById(id)` - pobiera szczegóły treningu z fazami
  - `saveQuiz(quizData)` - zapisuje nowy quiz
  - `saveWorkout(workoutData)` - zapisuje nowy trening
  - `deleteQuiz(id)` - usuwa quiz
  - `deleteWorkout(id)` - usuwa trening

**Pliki do stworzenia**:
- **NOWE**: `js/data-service.js`

**Kryteria akceptacji**:
- ✅ Klient Supabase działa i może odpytać bazę
- ✅ Sample content można pobrać bez logowania
- ✅ Wszystkie funkcje CRUD dla quizów/treningów działają

---

### ETAP 3: System Autentykacji (3-4h)

#### 3.1 UI dla Logowania i Rejestracji
**Zadania**:
- [ ] Stworzyć `js/auth-ui.js` z funkcjami renderującymi:
  - Modal/formularz logowania
  - Modal/formularz rejestracji
  - Modal resetowania hasła
  - Komunikaty o błędach
- [ ] Dodać nawigację z przyciskami "Zaloguj" / "Zarejestruj" dla gości
- [ ] Dodać nawigację z przyciskami "Moje Treści" / "Wyloguj" dla zalogowanych

**Pliki do stworzenia**:
- **NOWE**: `js/auth-ui.js`

**Pliki do modyfikacji**:
- `js/app.js` (integracja z routingiem)

#### 3.2 Logika Autentykacji
**Zadania**:
- [ ] Stworzyć `js/auth-service.js` z funkcjami:
  - `signUp(email, password)` - rejestracja
  - `signIn(email, password)` - logowanie
  - `signOut()` - wylogowanie
  - `resetPassword(email)` - reset hasła
  - `onAuthStateChange(callback)` - nasłuchiwanie zmian sesji
- [ ] Dodać obsługę potwierdzenia email (komunikat po rejestracji)
- [ ] Dodać automatyczne odświeżanie UI po zmianie stanu autentykacji

**Pliki do stworzenia**:
- **NOWE**: `js/auth-service.js`

**Kryteria akceptacji**:
- ✅ Użytkownik może się zarejestrować (z potwierdzeniem email)
- ✅ Użytkownik może się zalogować
- ✅ Użytkownik może zresetować hasło
- ✅ Sesja jest utrzymywana po odświeżeniu strony
- ✅ Użytkownik może się wylogować

---

### ETAP 4: Zarządzanie Treściami - UI (4-5h)

#### 4.1 Widok "Moje Treści"
**Zadania**:
- [ ] Stworzyć `js/my-content-ui.js` z funkcjami:
  - `renderMyContentView()` - główny widok z zakładkami "Quizy" / "Treningi"
  - `renderQuizzesList(quizzes)` - lista quizów użytkownika
  - `renderWorkoutsList(workouts)` - lista treningów użytkownika
  - Przyciski: "+ Nowy Quiz", "+ Nowy Trening"
  - Akcje na każdej karcie: "Edytuj", "Usuń", "Rozwiąż/Rozpocznij"
- [ ] Dodać widok "pusty stan" (gdy użytkownik nie ma jeszcze treści)
  - Komunikat powitalny
  - Link do sample content
  - Przycisk do importu JSON

**Pliki do stworzenia**:
- **NOWE**: `js/my-content-ui.js`

#### 4.2 Import JSON
**Zadania**:
- [ ] Stworzyć `js/import-ui.js` z funkcjami:
  - Modal z dwoma opcjami: "Wgraj plik" / "Wklej JSON"
  - Obsługa File Input API
  - Pole tekstowe dla wklejonego JSON
  - Walidacja JSON przed wysłaniem
  - Komunikaty o sukcesie/błędach
- [ ] Stworzyć `js/validators.js` z funkcjami:
  - `validateQuizStructure(json)`
  - `validateWorkoutStructure(json)`
  - Zgodność z `DATA_FORMAT.md`

**Pliki do stworzenia**:
- **NOWE**: `js/import-ui.js`
- **NOWE**: `js/validators.js`

**Kryteria akceptacji**:
- ✅ Użytkownik może importować quiz z pliku JSON
- ✅ Użytkownik może wkleić JSON quizu/treningu
- ✅ Niepoprawny JSON wyświetla zrozumiały komunikat błędu
- ✅ Poprawnie zaimportowana treść pojawia się natychmiast na liście

---

### ETAP 5: Aktualizacja Istniejących Modułów (2-3h)

#### 5.1 Modyfikacja `app.js`
**Zadania**:
- [ ] Usunąć logikę ładowania z plików JSON i `manifest.json`
- [ ] Zintegrować nowy `data-service.js`
- [ ] Dodać routing dla widoku "Moje Treści" (`#my-content`)
- [ ] Dodać sprawdzanie stanu autentykacji przy starcie aplikacji
- [ ] Dostosować renderowanie strony głównej:
  - Dla niezalogowanych: landing page + sample content
  - Dla zalogowanych: sample content + link do "Moje Treści"

**Pliki do modyfikacji**:
- `js/app.js`

#### 5.2 Modyfikacja `quiz-engine.js` i `workout-engine.js`
**Zadania**:
- [ ] Dostosować funkcje do pobierania danych z `data-service.js` zamiast z plików
- [ ] Zachować całą istniejącą logikę renderowania i walidacji odpowiedzi
- [ ] Upewnić się, że TTS (listening questions) nadal działa

**Pliki do modyfikacji**:
- `js/quiz-engine.js`
- `js/workout-engine.js`

**Kryteria akceptacji**:
- ✅ Quizy i treningi działają identycznie jak w v1
- ✅ Dane są pobierane z Supabase zamiast z plików JSON
- ✅ Wszystkie typy pytań działają poprawnie

---

### ETAP 6: Generator AI (Ukryty) (3-4h)

#### 6.1 UI Generatora
**Zadania**:
- [ ] Stworzyć `js/ai-generator-ui.js` z funkcjami:
  - Modal z polem tekstowym do opisu
  - Wybór typu: "Quiz" / "Trening"
  - Przycisk "Generuj"
  - Loading state podczas generowania
  - Podgląd wygenerowanego JSON (edytowalny)
  - Przyciski: "Zapisz" / "Odrzuć" / "Regeneruj"
- [ ] **Ukryć w UI**: Dodać przycisk tylko jeśli `localStorage.getItem('feature_ai') === 'enabled'`
  - Lub ukryty klawisz (Ctrl+Shift+A) do aktywacji

**Pliki do stworzenia**:
- **NOWE**: `js/ai-generator-ui.js`

#### 6.2 Integracja z OpenRouter
**Zadania**:
- [ ] Stworzyć `js/openrouter-service.js` z funkcjami:
  - `generateQuiz(description, apiKey)` - generuje quiz przez AI
  - `generateWorkout(description, apiKey)` - generuje trening przez AI
  - Szablon promptu zawierający `DATA_FORMAT.md`
- [ ] Dodać pole do wpisania klucza API (zapisywany w localStorage)
- [ ] Używać modelu: `anthropic/claude-3-opus-20240229` (Opus Mini)

**Pliki do stworzenia**:
- **NOWE**: `js/openrouter-service.js`

**Kryteria akceptacji**:
- ✅ Generator jest ukryty domyślnie
- ✅ Po aktywacji można wygenerować quiz/trening z opisu
- ✅ Wygenerowany JSON jest walidowany przed zapisem
- ✅ Użytkownik może edytować wygenerowany JSON przed zapisem

---

### ETAP 7: Finalizacja i Czyszczenie (1-2h)

#### 7.1 Usunięcie Zbędnych Plików
**Zadania**:
- [ ] Usunąć folder `/data/` (quizzes, workouts, manifest.json)
- [ ] Usunąć `generate-manifest.js`
- [ ] Zaktualizować `.gitignore` (dodać `.env` jeśli nie ma)

#### 7.2 Aktualizacja Dokumentacji
**Zadania**:
- [ ] Zaktualizować `README.md` z instrukcjami dla v2
- [ ] Dodać sekcję o konfiguracji Supabase
- [ ] Dodać instrukcje dla pierwszego użytkownika
- [ ] Zaktualizować screenshots (jeśli były)

**Pliki do modyfikacji**:
- `README.md`

#### 7.3 Testy Manualne
**Zadania**:
- [ ] Test flow rejestracji i logowania
- [ ] Test importu JSON (quiz + trening)
- [ ] Test rozwiązywania quizu i treningu
- [ ] Test usuwania treści
- [ ] Test dostępu do sample content bez logowania
- [ ] Test generatora AI (jeśli aktywowany)
- [ ] Test na różnych przeglądarkach (Chrome, Firefox, Safari)
- [ ] Test responsywności (mobile, tablet, desktop)

**Kryteria akceptacji**:
- ✅ Wszystkie flow działają bez błędów
- ✅ Aplikacja jest responsywna
- ✅ Brak błędów w konsoli przeglądarki

---

## 📅 Harmonogram i Priorytety

### Faza 1: Fundament (Etapy 0-2) - **PRIORYTET KRYTYCZNY**
**Szacowany czas**: 5-8h  
**Cel**: Działający backend + podstawowa integracja

### Faza 2: Autentykacja (Etap 3) - **PRIORYTET WYSOKI**
**Szacowany czas**: 3-4h  
**Cel**: Użytkownicy mogą się rejestrować i logować

### Faza 3: CRUD dla Treści (Etapy 4-5) - **PRIORYTET WYSOKI**
**Szacowany czas**: 6-8h  
**Cel**: Użytkownicy mogą importować i zarządzać treściami

### Faza 4: Generator AI (Etap 6) - **PRIORYTET ŚREDNI**
**Szacowany czas**: 3-4h  
**Cel**: Dodatkowa funkcjonalność, ale ukryta

### Faza 5: Polish (Etap 7) - **PRIORYTET ŚREDNI**
**Szacowany czas**: 1-2h  
**Cel**: Czysty kod, kompletna dokumentacja

**ŁĄCZNY CZAS**: 18-26 godzin pracy

---

## ⚠️ Potencjalne Ryzyka

### Ryzyko 1: Bezpieczeństwo Klucza API
**Problem**: Klucz Supabase (anon key) będzie widoczny w kodzie frontendowym.  
**Mitigacja**: To normalna praktyka. RLS w Supabase chroni dane. Tylko authenticated users mogą zapisywać.

### Ryzyko 2: Limit OpenRouter API
**Problem**: Użytkownik może nadużyć generatora AI.  
**Mitigacja**: Generator jest ukryty. W przyszłości: rate limiting po stronie frontendu.

### Ryzyko 3: Migracja Użytkowników z v1
**Problem**: Jeśli ktoś używał v1, straci swoje postępy (localStorage).  
**Mitigacja**: Dodać komunikat w README o nowej wersji. localStorage w v1 zawierał tylko stan sesji, nie dane użytkownika.

### Ryzyko 4: Email Deliverability
**Problem**: Maile od Supabase mogą trafiać do SPAM.  
**Mitigacja**: Supabase używa SendGrid. Poinformować użytkowników, aby sprawdzali SPAM.

### Ryzyko 5: Limity Darmowego Planu Supabase
**Problem**: Darmowy plan ma limity (500MB storage, 50,000 monthly active users).  
**Mitigacja**: Na start wystarczy. Monitorować usage w konsoli Supabase.

---

## ✅ Definicja "Gotowe"

Wersja 2.0 jest gotowa, gdy:
1. ✅ Użytkownik może się zarejestrować, zalogować i wylogować
2. ✅ Użytkownik może zaimportować quiz/trening z JSON
3. ✅ Użytkownik może rozwiązać swój quiz / przeprowadzić trening
4. ✅ Użytkownik może usunąć swoje treści
5. ✅ Niezalogowany użytkownik może zobaczyć sample content
6. ✅ Generator AI jest zaimplementowany (ale ukryty)
7. ✅ Dokumentacja jest zaktualizowana
8. ✅ Aplikacja działa na GitHub Pages z Supabase

---

## 📝 Notatki Implementacyjne

### Kluczowe Zależności
- Etap 2 wymaga ukończenia Etapu 1
- Etap 4 wymaga ukończenia Etapów 2 i 3
- Etap 5 wymaga ukończenia Etapu 2
- Etap 6 wymaga ukończenia Etapów 2, 3, 4

### Sugerowana Kolejność Pracy
1. Etap 0 (setup)
2. Etap 1 (baza danych)
3. Etap 2 (integracja Supabase)
4. Etap 3 (autentykacja)
5. Etap 5 (aktualizacja istniejących modułów) - PRZED Etapem 4!
6. Etap 4 (zarządzanie treściami)
7. Etap 6 (generator AI)
8. Etap 7 (finalizacja)

**Uzasadnienie**: Etap 5 przed 4, bo potrzebujemy działających quizów/treningów, zanim zbudujemy UI do zarządzania nimi.

---

**Ostatnia aktualizacja**: 2025-10-26  
**Status dokumentu**: Do zatwierdzenia

