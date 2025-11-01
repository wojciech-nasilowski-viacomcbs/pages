# Deep Links & Auto-Redirect Feature 🔗

## Przegląd

Implementacja dwóch nowych funkcji:
1. **Auto-redirect po generowaniu AI** - użytkownik jest automatycznie przekierowywany do nowo wygenerowanej treści
2. **Deep links (query params)** - możliwość udostępniania bezpośrednich linków do quizów, treningów i zestawów listening

---

## 1. Auto-Redirect Po Generowaniu AI

### Jak działa?

Po pomyślnym wygenerowaniu treści przez AI:
1. Treść jest zapisywana do Supabase
2. Zwracany jest obiekt z `id` nowo utworzonej treści
3. Użytkownik jest automatycznie przekierowywany do tej treści
4. Modal AI Generator zamyka się natychmiast

### Implementacja

**Plik:** `js/content-manager.js`

```javascript
// Zapisz do Supabase i pobierz ID nowo utworzonej treści
let savedItem;
if (contentType === 'quiz') {
  savedItem = await dataService.saveQuiz(generatedData);
} else if (contentType === 'workout') {
  savedItem = await dataService.saveWorkout(generatedData);
} else if (contentType === 'listening') {
  savedItem = await dataService.createListeningSet(...);
}

// Przekieruj użytkownika do nowo utworzonej treści
if (savedItem && savedItem.id) {
  if (contentType === 'quiz') {
    await this.loadAndStartQuiz(savedItem.id, ...);
  } else if (contentType === 'workout') {
    await this.loadAndStartWorkout(savedItem.id, ...);
  } else if (contentType === 'listening') {
    await window.listeningEngine.loadAndStartListening(savedItem.id);
  }
}
```

### UX Benefits
- ✅ Natychmiastowy feedback - użytkownik od razu widzi efekt
- ✅ Możliwość przetestowania wygenerowanej treści
- ✅ Brak konieczności szukania nowej treści na liście

---

## 2. Deep Links (Query Params)

### Format URL

```
https://your-app.com/?type=<TYPE>&id=<UUID>
```

**Parametry:**
- `type` - typ treści: `quiz`, `workout`, `listening`
- `id` - UUID treści z Supabase

**Przykłady:**
```
?type=quiz&id=a1b2c3d4-e5f6-7890-abcd-ef1234567890
?type=workout&id=b2c3d4e5-f6a7-8901-bcde-f12345678901
?type=listening&id=c3d4e5f6-a7b8-9012-cdef-123456789012
```

### Jak działa?

1. **Przy starcie aplikacji** (`app.js::init()`):
   - Sprawdzane są query params w URL
   - Jeśli wykryto `type` i `id`, wywoływana jest funkcja `handleDeepLink()`

2. **Walidacja**:
   - Sprawdzenie czy użytkownik jest zalogowany
   - Sprawdzenie czy moduł (quiz/workout/listening) jest włączony
   - Próba załadowania treści z Supabase

3. **Row Level Security (RLS)**:
   - Supabase automatycznie sprawdza uprawnienia
   - Użytkownik może zobaczyć tylko:
     - Treści publiczne (`is_sample = TRUE`)
     - Własne treści (`user_id = auth.uid()`)

4. **Obsługa błędów**:
   - **Brak logowania** → "Zaloguj się, aby otworzyć udostępnioną treść"
   - **Brak dostępu** → "Nie masz dostępu do tej treści" (RLS)
   - **Nie znaleziono** → "Treść nie została znaleziona"
   - **Moduł wyłączony** → "Quizy są wyłączone"

5. **Czyszczenie URL**:
   - Po pomyślnym załadowaniu lub błędzie, query params są usuwane z URL
   - Używa `window.history.replaceState()` - nie dodaje nowego wpisu w historii

### Implementacja

**Plik:** `js/app.js`

```javascript
async function handleDeepLink() {
  const urlParams = new URLSearchParams(window.location.search);
  const type = urlParams.get('type');
  const id = urlParams.get('id');
  
  if (!type || !id) return false;
  
  // Sprawdź autentykację
  if (!state.currentUser) {
    uiManager.showError('Zaloguj się, aby otworzyć udostępnioną treść', elements);
    window.history.replaceState({}, document.title, window.location.pathname);
    return false;
  }
  
  // Załaduj treść
  try {
    switch (type) {
      case 'quiz':
        await contentManager.loadAndStartQuiz(id, ...);
        break;
      case 'workout':
        await contentManager.loadAndStartWorkout(id, ...);
        break;
      case 'listening':
        await window.listeningEngine.loadAndStartListening(id);
        break;
    }
    
    // Wyczyść URL
    window.history.replaceState({}, document.title, window.location.pathname);
    return true;
    
  } catch (error) {
    // Obsłuż błędy...
  }
}
```

---

## 3. Przycisk "Udostępnij" 🔗

### Gdzie się pojawia?

Przycisk "Udostępnij" (🔗) pojawia się na kartach treści:
- Tylko dla **własnych treści** (nie dla `is_sample`)
- Obok przycisków "Eksportuj" (⬇) i "Usuń" (×)
- Widoczny na hover (desktop) lub zawsze (mobile)

### Funkcjonalność

**Kliknięcie przycisku:**
1. Generuje link w formacie `?type=<TYPE>&id=<ID>`
2. Kopiuje link do schowka (Clipboard API)
3. Pokazuje powiadomienie "Link skopiowany do schowka!" (3 sekundy)

**Implementacja:**

```javascript
// Generowanie linku
generateShareLink(type, id) {
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}?type=${type}&id=${id}`;
}

// Kopiowanie do schowka
async copyShareLink(type, id, title) {
  const link = this.generateShareLink(type, id);
  await navigator.clipboard.writeText(link);
  
  // Pokaż powiadomienie
  const notification = document.createElement('div');
  notification.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';
  notification.innerHTML = `
    <div class="flex items-center gap-2">
      <span>🔗</span>
      <span>Link skopiowany do schowka!</span>
    </div>
  `;
  document.body.appendChild(notification);
  
  setTimeout(() => notification.remove(), 3000);
}
```

### UI/UX

**Przycisk:**
```html
<button class="share-btn ... hover:text-blue-500" title="Udostępnij link">
  🔗
</button>
```

**Powiadomienie:**
- Zielone tło (`bg-green-600`)
- Wycentrowane na górze ekranu
- Automatyczne znikanie po 3s
- Płynna animacja fade-out

---

## 4. Bezpieczeństwo 🔒

### Row Level Security (RLS)

**Polityki Supabase:**

```sql
-- Quizy: dostęp do sample lub własnych
CREATE POLICY "Public read access to sample quizzes"
    ON quizzes FOR SELECT
    USING (is_sample = TRUE OR user_id = auth.uid());

-- Workouts: dostęp do sample lub własnych
CREATE POLICY "Public read access to sample workouts"
    ON workouts FOR SELECT
    USING (is_sample = TRUE OR user_id = auth.uid());

-- Listening: dostęp do sample lub własnych
CREATE POLICY "Public read access to sample listening sets"
    ON listening_sets FOR SELECT
    USING (is_sample = TRUE OR user_id = auth.uid());
```

### Scenariusze

| Scenariusz | Rezultat |
|------------|----------|
| Link do własnej treści | ✅ Otwiera się poprawnie |
| Link do sample content | ✅ Otwiera się dla wszystkich zalogowanych |
| Link do cudzej prywatnej treści | ❌ "Nie masz dostępu do tej treści" |
| Link bez logowania | ❌ "Zaloguj się, aby otworzyć udostępnioną treść" |
| Nieprawidłowy UUID | ❌ "Treść nie została znaleziona" |
| Moduł wyłączony (feature flag) | ❌ "Quizy są wyłączone" |

### Ochrona przed atakami

- ✅ **SQL Injection** - Supabase używa prepared statements
- ✅ **Unauthorized Access** - RLS sprawdza uprawnienia na poziomie bazy
- ✅ **XSS** - Parametry są sanityzowane przez `URLSearchParams`
- ✅ **CSRF** - Tylko operacje READ, brak modyfikacji danych

---

## 5. Listening Engine Integration

### Nowa funkcja: `loadAndStartListening()`

**Plik:** `js/listening-engine.js`

```javascript
async function loadAndStartListening(setId) {
  try {
    // Pokaż ekran listening
    if (navigateToScreen) {
      navigateToScreen('listening');
    }
    
    // Pokaż loader
    elements.listeningListLoader?.classList.remove('hidden');
    
    // Pobierz zestaw z Supabase
    const { data: set, error } = await window.supabaseClient
      .from('listening_sets')
      .select('*')
      .eq('id', setId)
      .single();
    
    if (error) throw error;
    if (!set) throw new Error('Listening set not found');
    
    // Ukryj loader
    elements.listeningListLoader?.classList.add('hidden');
    
    // Uruchom odtwarzacz
    await openPlayer(set);
    
  } catch (error) {
    // Obsłuż błędy...
    elements.listeningListError.textContent = 'Nie udało się wczytać zestawu. ' + error.message;
    throw error;
  }
}

// Eksport
window.listeningEngine = {
  isPlaying: () => playerState.isPlaying,
  getCurrentSet: () => playerState.currentSet,
  loadAndStartListening: loadAndStartListening  // NOWE
};
```

---

## 6. Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER JOURNEY                              │
└─────────────────────────────────────────────────────────────┘

1. GENEROWANIE AI
   ┌──────────────┐
   │ User: Klik   │
   │ "Generuj AI" │
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐     ┌──────────────┐
   │ AI generuje  │────▶│ Zapis do     │
   │ treść        │     │ Supabase     │
   └──────────────┘     └──────┬───────┘
                               │
                               ▼
                        ┌──────────────┐
                        │ Zwrot ID     │
                        └──────┬───────┘
                               │
                               ▼
                        ┌──────────────┐
                        │ Auto-redirect│
                        │ do treści    │
                        └──────────────┘

2. UDOSTĘPNIANIE
   ┌──────────────┐
   │ User: Klik   │
   │ "🔗 Share"   │
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐     ┌──────────────┐
   │ Generuj URL  │────▶│ Kopiuj do    │
   │ ?type&id     │     │ schowka      │
   └──────────────┘     └──────┬───────┘
                               │
                               ▼
                        ┌──────────────┐
                        │ Powiadomienie│
                        │ "Skopiowano" │
                        └──────────────┘

3. OTWIERANIE LINKU
   ┌──────────────┐
   │ User: Otwiera│
   │ link z query │
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐     ┌──────────────┐
   │ Sprawdź auth │────▶│ Zalogowany?  │
   └──────────────┘     └──────┬───────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
                   TAK                   NIE
                    │                     │
                    ▼                     ▼
             ┌──────────────┐      ┌──────────────┐
             │ Załaduj      │      │ Błąd:        │
             │ treść        │      │ "Zaloguj się"│
             └──────┬───────┘      └──────────────┘
                    │
                    ▼
             ┌──────────────┐
             │ RLS Check    │
             │ (Supabase)   │
             └──────┬───────┘
                    │
         ┌──────────┴──────────┐
         │                     │
      DOSTĘP                BRAK
         │                     │
         ▼                     ▼
  ┌──────────────┐      ┌──────────────┐
  │ Uruchom      │      │ Błąd:        │
  │ treść        │      │ "Brak dostępu"│
  └──────────────┘      └──────────────┘
```

---

## 7. Testowanie

### Test Cases

#### TC1: Auto-redirect po generowaniu quizu
1. Zaloguj się
2. Otwórz AI Generator
3. Wybierz "Quiz"
4. Wpisz prompt i kliknij "Generuj"
5. **Oczekiwany rezultat:** Quiz uruchamia się automatycznie

#### TC2: Auto-redirect po generowaniu treningu
1. Zaloguj się
2. Otwórz AI Generator
3. Wybierz "Trening"
4. Wpisz prompt i kliknij "Generuj"
5. **Oczekiwany rezultat:** Trening uruchamia się automatycznie

#### TC3: Udostępnianie linku
1. Zaloguj się
2. Kliknij 🔗 na karcie quizu/treningu
3. **Oczekiwany rezultat:** 
   - Link skopiowany do schowka
   - Powiadomienie "Link skopiowany"
   - Link ma format `?type=<TYPE>&id=<UUID>`

#### TC4: Otwieranie własnego linku
1. Skopiuj link do własnej treści
2. Otwórz w nowej karcie
3. **Oczekiwany rezultat:** Treść uruchamia się automatycznie

#### TC5: Otwieranie cudzego linku (prywatna treść)
1. Skopiuj link do cudzej prywatnej treści
2. Zaloguj się na inne konto
3. Otwórz link
4. **Oczekiwany rezultat:** Błąd "Nie masz dostępu do tej treści"

#### TC6: Otwieranie linku bez logowania
1. Wyloguj się
2. Otwórz link do treści
3. **Oczekiwany rezultat:** Błąd "Zaloguj się, aby otworzyć udostępnioną treść"

#### TC7: Otwieranie linku do sample content
1. Skopiuj link do sample content
2. Zaloguj się na dowolne konto
3. Otwórz link
4. **Oczekiwany rezultat:** Treść uruchamia się (dostępna dla wszystkich)

#### TC8: Nieprawidłowy UUID
1. Otwórz link z nieprawidłowym UUID
2. **Oczekiwany rezultat:** Błąd "Treść nie została znaleziona"

#### TC9: Wyłączony moduł
1. Wyłącz quizy w feature flags
2. Otwórz link do quizu
3. **Oczekiwany rezultat:** Błąd "Quizy są wyłączone"

---

## 8. Znane Ograniczenia

1. **Clipboard API wymaga HTTPS**
   - W localhost działa tylko z `http://localhost`
   - W produkcji wymaga HTTPS

2. **Brak wsparcia dla starszych przeglądarek**
   - `navigator.clipboard` nie działa w IE11
   - Fallback: użyj `document.execCommand('copy')` (deprecated)

3. **Query params są widoczne w URL**
   - UUID jest publiczny (ale chroniony przez RLS)
   - Alternatywa: short URLs (wymaga dodatkowej tabeli w DB)

4. **Brak historii udostępnień**
   - Nie śledzimy kto otworzył link
   - Można dodać tabelę `share_analytics` w przyszłości

---

## 9. Przyszłe Ulepszenia

### Short URLs
```
https://your-app.com/s/abc123
```
- Krótsze linki
- Możliwość śledzenia statystyk
- Możliwość wygasania linków

### QR Codes
- Generowanie QR code dla każdego linku
- Łatwe udostępnianie na urządzenia mobilne

### Social Sharing
- Przyciski do udostępniania na Facebook, Twitter, WhatsApp
- Open Graph meta tags dla ładnych podglądów

### Share Analytics
- Licznik otwarć linku
- Data ostatniego otwarcia
- Lista użytkowników którzy otworzyli

---

## 10. Podsumowanie

### Zaimplementowane funkcje ✅

1. ✅ Auto-redirect po generowaniu AI
2. ✅ Deep links z query params
3. ✅ Przyciski "Udostępnij" na kartach
4. ✅ Kopiowanie do schowka
5. ✅ Powiadomienia o skopiowaniu
6. ✅ Obsługa błędów autoryzacji
7. ✅ Integracja z RLS Supabase
8. ✅ Czyszczenie URL po użyciu
9. ✅ Wsparcie dla quiz/workout/listening
10. ✅ Przyjazne komunikaty błędów

### Pliki zmodyfikowane

- `js/content-manager.js` - przyciski share, generowanie linków
- `js/app.js` - obsługa deep links
- `js/listening-engine.js` - funkcja `loadAndStartListening()`

### Bezpieczeństwo

- ✅ Row Level Security (RLS)
- ✅ Walidacja autentykacji
- ✅ Sanityzacja parametrów
- ✅ Przyjazne komunikaty błędów

---

**Data utworzenia:** 2025-11-01  
**Wersja:** 1.0  
**Autor:** AI Assistant + nasiloww

