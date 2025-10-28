# Status Funkcjonalności "Nauka ze Słuchu" (Listening)

## ✅ Zaimplementowane

### 1. Baza Danych
- ✅ Tabela `listening_sets` z kolumnami: id, user_id, title, description, lang1_code, lang2_code, content (JSONB), is_sample, created_at
- ✅ Indeksy na user_id i is_sample
- ✅ Row Level Security (RLS) policies
- ✅ Przykładowe dane: "Hiszpański A1: Czasowniki ESTAR i IR" (26 par)
- ✅ Dokumentacja w `DB_SCHEMA.md`

### 2. UI/UX
- ✅ Tab Bar na dole ekranu z 4 zakładkami: Quizy, Treningi, Słuchanie, Więcej
- ✅ Responsywny design dla mobile
- ✅ Ikony SVG dla każdej zakładki
- ✅ Active state z gradientem i animacją
- ✅ Safe area dla iOS (padding-bottom)
- ✅ Zapisywanie aktualnej zakładki w localStorage (przywracanie po odświeżeniu)

### 3. Lista Zestawów
- ✅ Wyświetlanie kart zestawów z tytułem, opisem i liczbą par
- ✅ Ładowanie danych z Supabase
- ✅ Obsługa błędów i loader
- ✅ Kliknięcie karty otwiera odtwarzacz

### 4. Odtwarzacz (Player)
- ✅ Wyświetlanie tytułu, opisu i postępu (np. "2 / 26")
- ✅ Wyświetlanie aktualnej pary w dwóch językach
- ✅ Przyciski kontrolne:
  - Play/Pause
  - Poprzednia/Następna para
  - Zapętlanie (Loop)
  - Zamiana kolejności języków
  - Powrót do listy
- ✅ Automatyczne odtwarzanie par sekwencyjnie
- ✅ Obsługa nagłówków sekcji (separatory)

### 5. TTS (Text-to-Speech)
- ✅ Web Speech API
- ✅ Automatyczne wykrywanie i ładowanie dostępnych głosów (210 głosów)
- ✅ Inteligentny wybór głosu na podstawie `langCode` (priorytet: exact match → lang+country → lang → localService)
- ✅ Normalizacja tekstu (lowercase z kapitalizacją na początku zdań) - zapobiega czytaniu wielkich liter jako akronimów
- ✅ Uniwersalne wsparcie dla wszystkich języków (nie hardcoded)
- ✅ Logowanie dostępnych głosów dla debugowania
- ✅ Dopasowanie kluczy języków z JSONB do kodów języków (`pl` → `pl-PL`, `es` → `es-ES`)
- ✅ Sekwencyjne odtwarzanie bez nakładania się:
  - Mechanizm `waitForSilence()` - czeka aż TTS zakończy poprzedni utterance
  - Sprawdzanie `synth.speaking` przed rozpoczęciem nowego utterance
- ✅ Zatrzymywanie TTS przy manualnym przejściu do następnej pary (kliknięcie strzałki)
- ✅ Opóźnienie 100ms przed `speak()` żeby uniknąć ucinania pierwszych głosek

### 6. Pauzy
- ✅ Pauza między językami w parze: 1000ms
- ✅ Długa pauza między parami: 3000ms
- ✅ Pauza po nagłówku sekcji: 4000ms

### 7. Data Service
- ✅ `getListeningSets()` - pobieranie wszystkich zestawów
- ✅ `getListeningSet(id)` - pobieranie pojedynczego zestawu
- ✅ `createListeningSet()` - tworzenie nowego zestawu
- ✅ `deleteListeningSet(id)` - usuwanie zestawu

## ⚠️ Znane Problemy

### 1. Ucinanie Pierwszych Głosek (Częściowo Rozwiązane)
**Problem:** TTS ucina pierwsze głoski z początku każdego tekstu (np. "(Ja) jestem" → "a) jestem")

**Przyczyna:** Bug Web Speech API - głos nie jest w pełni "gotowy" przed rozpoczęciem mówienia

**Rozwiązanie:** Dodano opóźnienie 100ms przed `speak()` (linia 505 w `listening-engine.js`)

**Status:** Wymaga testowania - może potrzebować zwiększenia do 150ms lub 200ms

### 2. Błędy "interrupted" w Konsoli
**Problem:** Czasami pojawia się błąd `SpeechSynthesisErrorEvent { error: 'interrupted' }`

**Przyczyna:** `synth.cancel()` jest wywoływany podczas manualne przejścia do następnej pary

**Status:** Nie wpływa na funkcjonalność, ale generuje logi błędów

## 🔄 Do Przetestowania

1. **Ucinanie głosek** - czy opóźnienie 100ms jest wystarczające?
2. **Różne przeglądarki** - Safari, Chrome, Firefox (różne implementacje Web Speech API)
3. **Różne języki** - czy wszystkie języki są poprawnie odtwarzane?
4. **Długie teksty** - jak zachowuje się TTS z dłuższymi zdaniami?
5. **Mobile** - czy działa na iOS/Android?

## 📋 Backlog (Przyszłe Funkcje)

### Etap 4: Integracja z AI (z IMPLEMENTATION_PLAN_LISTENING.md)
- [ ] Przycisk "Generuj zestaw AI" w zakładce "Więcej"
- [ ] Formularz z promptem użytkownika
- [ ] Wywołanie OpenAI API
- [ ] Parsowanie odpowiedzi AI do formatu JSONB
- [ ] Zapisywanie wygenerowanego zestawu do Supabase

### Dodatkowe Funkcje
- [ ] Edycja zestawów (dodawanie/usuwanie par)
- [ ] Eksport/Import zestawów (JSON)
- [ ] Statystyki (ile razy odtworzono, ile czasu spędzonego)
- [ ] Ulubione zestawy
- [ ] Filtrowanie zestawów po języku
- [ ] Wyszukiwanie zestawów
- [ ] Udostępnianie zestawów między użytkownikami
- [ ] Tryb "shuffle" (losowa kolejność par)
- [ ] Regulacja prędkości TTS (rate)
- [ ] Wybór głosu (męski/żeński)
- [ ] Tryb "tylko język 1" lub "tylko język 2"
- [ ] Powtarzanie aktualnej pary (przycisk "Repeat")

## 📁 Pliki Zmodyfikowane

### Baza Danych
- `supabase/schema.sql` - definicja tabeli `listening_sets`
- `supabase/insert_samples.sql` - przykładowe dane
- `DB_SCHEMA.md` - dokumentacja schematu

### Frontend
- `index.html` - dodano Tab Bar, `listening-screen`, `more-screen`, style CSS
- `js/app.js` - inicjalizacja modułu, zapisywanie/przywracanie zakładki z localStorage
- `js/ui-manager.js` - obsługa przełączania zakładek, zapisywanie do localStorage
- `js/listening-engine.js` - **NOWY MODUŁ** - cała logika odtwarzacza i TTS
- `js/data-service.js` - dodano funkcje CRUD dla `listening_sets`

## 🐛 Debugging

### Przydatne Logi w Konsoli
```javascript
🎧 Inicjalizacja Listening Engine...
🗣️ Dostępne głosy TTS (załadowane): 210
🗣️ Dostępne języki TTS: ar, bg, ca, cs, da, de, el, en, es, fi, fr, ...
  PL: 2 głos(ów) - Zosia, Google polski
  ES: 20 głos(ów) - Eddy (Spanish (Spain)), Mónica, ...

▶️ Otwieranie odtwarzacza dla: Hiszpański A1: Czasowniki ESTAR i IR
🔑 Klucze: lang1="pl" (pl-PL), lang2="es" (es-ES)

▶️ Start odtwarzania
🗣️ Para 2: "(Ja) jestem" (pl-PL) → "(Yo) estoy" (es-ES)
  ▶️ Odtwarzam język 1: "(Ja) jestem"
  🔍 Szukam głosu dla: pl-PL, dostępnych głosów: 210
  ✅ Używam głosu: "Zosia" (pl-PL) dla tekstu: "(ja) jestem..."
  🎤 TTS rozpoczął mówienie: "(ja) jestem..."
  🏁 TTS zakończył mówienie: "(ja) jestem..."
  ✅ Zakończono język 1, pauza 1000ms
  ▶️ Odtwarzam język 2: "(Yo) estoy"
  ✅ Używam głosu: "Eddy (Spanish (Spain))" (es-ES) dla tekstu: "(yo) estoy..."
  🏁 TTS zakończył mówienie: "(yo) estoy..."
  ✅ Zakończono język 2, długa pauza 3000ms
```

### Kluczowe Funkcje
- `speakText(text, langCode)` - odtwarza tekst przez TTS
- `playCurrentPair()` - odtwarza aktualną parę (język1 → pauza → język2 → długa pauza → następna para)
- `findBestVoice(voices, langCode)` - inteligentny wybór głosu
- `normalizeTextForTTS(text)` - normalizacja tekstu (lowercase z kapitalizacją)
- `waitForSilence()` - czeka aż TTS zakończy mówienie przed rozpoczęciem nowego utterance

## 📊 Statystyki
- **Linie kodu:** ~650 linii w `listening-engine.js`
- **Głosy TTS:** 210 dostępnych głosów (zależne od systemu)
- **Języki:** Wsparcie dla wszystkich języków dostępnych w Web Speech API (34+ języków)
- **Przykładowy zestaw:** 26 par (czasowniki ESTAR i IR w hiszpańskim)

---

**Ostatnia aktualizacja:** 28 października 2025  
**Status:** ✅ Funkcjonalność działa, wymaga testowania ucinania głosek

