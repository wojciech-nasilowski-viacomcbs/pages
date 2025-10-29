# Plan Implementacji: Funkcjonalność "Nauka ze Słuchu"

> **Dokument Planu Implementacji**  
> Wersja: 1.0  
> Data: 2025-10-28  
> Status: Do Implementacji

---

## Spis Treści

1. [Przegląd](#przegląd)
2. [Etapy Implementacji](#etapy-implementacji)
3. [Etap 1: Baza Danych (Supabase)](#etap-1-baza-danych-supabase)
4. [Etap 2: Modernizacja Nawigacji (UI)](#etap-2-modernizacja-nawigacji-ui)
5. [Etap 3: Implementacja Odtwarzacza](#etap-3-implementacja-odtwarzacza)
6. [Etap 4: Integracja z AI (Przyszłość)](#etap-4-integracja-z-ai-przyszłość)
7. [Zależności i Wymagania](#zależności-i-wymagania)
8. [Testy](#testy)
9. [Checklist Implementacji](#checklist-implementacji)

---

## Przegląd

### Cel
Dodanie nowej funkcjonalności "Nauka ze Słuchu", która umożliwi użytkownikom naukę języków obcych przez słuchanie par słówek/zdań odtwarzanych automatycznie przy użyciu syntezatora mowy (TTS).

### Kluczowe Funkcje
- ✅ Odtwarzacz audio z kontrolkami (play/pauza, zapętlanie, zmiana kolejności języków)
- ✅ Wyświetlanie synchronizowane z audio
- ✅ Przechowywanie zestawów w bazie danych Supabase
- ✅ Obsługa sekcji/nagłówków w zestawach
- ✅ Nowoczesna nawigacja z dolnym paskiem (Tab Bar)

### Zakres
Implementacja od początku do końca obejmuje:
1. Utworzenie nowej tabeli w bazie danych
2. Przebudowę interfejsu nawigacji
3. Stworzenie nowego modułu JS (`listening-engine.js`)
4. Aktualizację istniejących modułów
5. Przygotowanie do przyszłej integracji z AI

---

## Etapy Implementacji

### Timeline (Orientacyjny)
- **Etap 1**: 2-3 godziny (Backend, Baza Danych)
- **Etap 2**: 3-4 godziny (UI/UX, Nawigacja)
- **Etap 3**: 5-6 godziny (Odtwarzacz, Logika TTS)
- **Etap 4**: 2-3 godziny (Integracja z AI - przyszłość)

**Łącznie**: ~12-16 godzin pracy

---

## Etap 1: Baza Danych (Supabase)

### 1.1 Utworzenie Tabeli `listening_sets`

#### SQL Schema

```sql
-- ============================================
-- LISTENING SETS TABLE
-- ============================================

CREATE TABLE listening_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    lang1_code TEXT NOT NULL DEFAULT 'pl-PL',
    lang2_code TEXT NOT NULL DEFAULT 'es-ES',
    content JSONB NOT NULL,
    is_sample BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index dla wydajności
CREATE INDEX idx_listening_sets_user_id ON listening_sets(user_id);
CREATE INDEX idx_listening_sets_is_sample ON listening_sets(is_sample);

-- Enable RLS
ALTER TABLE listening_sets ENABLE ROW LEVEL SECURITY;
```

#### Struktura kolumny `content` (JSONB)

```json
[
  {
    "pl": "--- CZASOWNIK: ESTAR ---",
    "es": "--- VERBO: ESTAR ---"
  },
  {
    "pl": "(Ja) jestem",
    "es": "(Yo) estoy"
  },
  {
    "pl": "Jestem zmęczony.",
    "es": "Estoy cansado."
  }
]
```

**Ważne**: Klucze w obiektach (`"pl"`, `"es"`) są dynamiczne - mogą być dowolne kody języków (np. `"en"`, `"de"`, `"fr"`).

### 1.2 Polityki Row Level Security (RLS)

```sql
-- ============================================
-- LISTENING SETS POLICIES
-- ============================================

-- Użytkownicy mogą czytać sample zestawy ORAZ swoje własne
CREATE POLICY "Public read access to sample listening sets"
    ON listening_sets FOR SELECT
    USING (is_sample = TRUE OR user_id = auth.uid());

-- Tylko zalogowani użytkownicy mogą tworzyć swoje zestawy
CREATE POLICY "Users can insert their own listening sets"
    ON listening_sets FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Użytkownicy mogą aktualizować tylko swoje zestawy (nie sample)
CREATE POLICY "Users can update their own listening sets"
    ON listening_sets FOR UPDATE
    USING (user_id = auth.uid() AND is_sample = FALSE);

-- Użytkownicy mogą usuwać tylko swoje zestawy (nie sample)
CREATE POLICY "Users can delete their own listening sets"
    ON listening_sets FOR DELETE
    USING (user_id = auth.uid() AND is_sample = FALSE);
```

### 1.3 Przykładowy Sample Content

```sql
-- Przykładowy zestaw demonstracyjny
INSERT INTO listening_sets (user_id, title, description, lang1_code, lang2_code, content, is_sample)
VALUES (
    NULL, -- NULL dla sample content (dostępne dla wszystkich)
    'Hiszpański A1: Czasowniki ESTAR i IR',
    'Podstawowe czasowniki w czasie teraźniejszym z przykładami użycia.',
    'pl-PL',
    'es-ES',
    '[
        {"pl": "--- CZASOWNIK: ESTAR (Być - stany, położenie) ---", "es": "--- VERBO: ESTAR (Presente) ---"},
        {"pl": "(Ja) jestem", "es": "(Yo) estoy"},
        {"pl": "(Ty) jesteś", "es": "(Tú) estás"},
        {"pl": "(On/Ona) jest", "es": "(Él/Ella) está"},
        {"pl": "Jestem zmęczony.", "es": "Estoy cansado."},
        {"pl": "Książka jest na stole.", "es": "El libro está en la mesa."}
    ]'::jsonb,
    TRUE
);
```

### 1.4 Aktualizacja Plików

**Pliki do modyfikacji:**
- `supabase/schema.sql` - dodać powyższy kod SQL
- `supabase/insert_samples.sql` - dodać przykładowe zestawy
- `DB_SCHEMA.md` - dodać dokumentację nowej tabeli

---

## Etap 2: Modernizacja Nawigacji (UI)

### 2.1 Analiza Obecnego Stanu

**Obecna nawigacja** (w `index.html`):
- Górne przyciski: "Quizy" i "Treningi" (zakładki)
- Przyciski akcji: "Dodaj", "Generator AI" (w zależności od zakładki)
- Przyciski nawigacji: Home, Sound Toggle
- Przyciski użytkownika: Login/Register/Logout

**Problem**: Ekran mobilny jest już zagęszczony (jak widać na zrzucie ekranu użytkownika).

### 2.2 Nowa Struktura - Dolny Pasek Nawigacji (Tab Bar)

#### Koncepcja

```
┌────────────────────────────────┐
│  Header (Tytuł + User Actions) │
├────────────────────────────────┤
│                                │
│                                │
│         Content Area           │
│                                │
│                                │
├────────────────────────────────┤
│  📝    💪    🎧    ☰          │
│ Quizy Treningi Słuchanie Więcej│
└────────────────────────────────┘
```

#### Ikony i Nazwy Tabów

| Tab | Ikona | Label | Route |
|-----|-------|-------|-------|
| Quizy | 📝 | Quizy | `#quizzes` |
| Treningi | 💪 | Treningi | `#workouts` |
| Słuchanie | 🎧 | Słuchanie | `#listening` |
| Więcej | ☰ | Więcej | `#more` |

#### Tab "Więcej" - Zawartość

- Generator AI
- Dodaj (Import JSON)
- Ustawienia (przyszłość)
- Informacje (przyszłość)

### 2.3 Zmiany w HTML

**Usunięcie z obecnego HTML:**
```html
<!-- USUŃ: -->
<div class="flex gap-2 mb-6">
  <button id="tab-quizzes" ...>Quizy</button>
  <button id="tab-workouts" ...>Treningi</button>
</div>
<div id="action-buttons" ...>
  <button id="add-content-button" ...>+ Dodaj</button>
  <button id="ai-generator-button" ...>🤖 Generator AI</button>
</div>
```

**Dodanie nowego Tab Bar:**
```html
<!-- Dolny pasek nawigacji (Tab Bar) -->
<nav id="tab-bar" class="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 safe-area-bottom z-50">
  <div class="max-w-4xl mx-auto flex justify-around items-center h-16">
    
    <!-- Tab: Quizy -->
    <button id="tab-quizzes" class="tab-button flex flex-col items-center justify-center flex-1 h-full text-gray-400 hover:text-white transition active" data-tab="quizzes">
      <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <span class="text-xs font-medium">Quizy</span>
    </button>
    
    <!-- Tab: Treningi -->
    <button id="tab-workouts" class="tab-button flex flex-col items-center justify-center flex-1 h-full text-gray-400 hover:text-white transition" data-tab="workouts">
      <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      <span class="text-xs font-medium">Treningi</span>
    </button>
    
    <!-- Tab: Słuchanie -->
    <button id="tab-listening" class="tab-button flex flex-col items-center justify-center flex-1 h-full text-gray-400 hover:text-white transition" data-tab="listening">
      <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H9" />
      </svg>
      <span class="text-xs font-medium">Słuchanie</span>
    </button>
    
    <!-- Tab: Więcej -->
    <button id="tab-more" class="tab-button flex flex-col items-center justify-center flex-1 h-full text-gray-400 hover:text-white transition" data-tab="more">
      <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
      <span class="text-xs font-medium">Więcej</span>
    </button>
    
  </div>
</nav>
```

**CSS dla Tab Bar:**
```css
/* Tab Bar Styling */
.tab-button.active {
  color: #3b82f6; /* blue-500 */
}

.tab-button:hover {
  background-color: rgba(55, 65, 81, 0.5); /* gray-700 with opacity */
}

/* Safe area dla iOS (notch) */
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}

/* Dodaj padding-bottom do głównego contentu, aby nie był zasłonięty przez Tab Bar */
#main-screen {
  padding-bottom: 5rem; /* 80px */
}
```

### 2.4 Nowy Ekran "Więcej"

Dodaj do HTML (przed zamknięciem `<body>`):

```html
<!-- Ekran: Więcej -->
<div id="more-screen" class="hidden">
  <div class="space-y-4">
    <h2 class="text-2xl font-bold mb-6">Więcej opcji</h2>
    
    <!-- Lista opcji -->
    <div class="space-y-3">
      
      <!-- Generator AI -->
      <button id="ai-generator-button-more" class="w-full p-4 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center gap-3 transition">
        <span class="text-2xl">🤖</span>
        <div class="text-left">
          <div class="font-semibold">Generator AI</div>
          <div class="text-sm text-gray-400">Wygeneruj treści używając sztucznej inteligencji</div>
        </div>
      </button>
      
      <!-- Dodaj treść -->
      <button id="add-content-button-more" class="w-full p-4 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center gap-3 transition">
        <span class="text-2xl">➕</span>
        <div class="text-left">
          <div class="font-semibold">Dodaj treść</div>
          <div class="text-sm text-gray-400">Importuj quiz, trening lub zestaw do nauki</div>
        </div>
      </button>
      
      <!-- Placeholder dla przyszłych opcji -->
      <div class="p-4 bg-gray-800 rounded-lg opacity-50">
        <div class="text-sm text-gray-400">Więcej opcji wkrótce...</div>
      </div>
      
    </div>
  </div>
</div>
```

### 2.5 Aktualizacja JavaScript (`app.js`, `ui-manager.js`)

**W `app.js` - Dodaj nowy stan:**
```javascript
const state = {
  currentView: 'main',
  currentTab: 'quizzes', // możliwe: 'quizzes', 'workouts', 'listening', 'more'
  quizzes: [],
  workouts: [],
  listeningSets: [], // NOWE
  currentUser: null
};
```

**W `app.js` - Dodaj nowe elementy:**
```javascript
const elements = {
  // ... istniejące elementy ...
  
  // Tab Bar
  tabQuizzes: document.getElementById('tab-quizzes'),
  tabWorkouts: document.getElementById('tab-workouts'),
  tabListening: document.getElementById('tab-listening'), // NOWE
  tabMore: document.getElementById('tab-more'), // NOWE
  
  // Ekrany
  mainScreen: document.getElementById('main-screen'),
  moreScreen: document.getElementById('more-screen'), // NOWE
  listeningScreen: document.getElementById('listening-screen'), // NOWE (do stworzenia w Etapie 3)
};
```

**W `ui-manager.js` - Aktualizuj funkcję `switchTab`:**
```javascript
function switchTab(tab) {
  state.currentTab = tab;
  
  // Usuń klasę 'active' ze wszystkich tabów
  [elements.tabQuizzes, elements.tabWorkouts, elements.tabListening, elements.tabMore]
    .forEach(btn => btn?.classList.remove('active'));
  
  // Dodaj klasę 'active' do aktywnego taba
  const activeTabButton = {
    'quizzes': elements.tabQuizzes,
    'workouts': elements.tabWorkouts,
    'listening': elements.tabListening,
    'more': elements.tabMore
  }[tab];
  activeTabButton?.classList.add('active');
  
  // Pokaż odpowiedni widok
  if (tab === 'more') {
    showMoreScreen();
  } else if (tab === 'listening') {
    showListeningList();
  } else {
    renderContentCards(); // Dla quizzes i workouts
  }
}
```

### 2.6 Pliki do Modyfikacji (Etap 2)

- `index.html` - struktura HTML, dodanie Tab Bar
- `js/app.js` - aktualizacja stanu i elementów DOM
- `js/ui-manager.js` - nowe funkcje `switchTab`, `showMoreScreen`
- Dodanie stylów CSS (inline lub w `<style>`)

---

## Etap 3: Implementacja Odtwarzacza

### 3.1 Nowy Moduł: `listening-engine.js`

**Lokalizacja:** `/js/listening-engine.js`

#### Struktura Modułu

```javascript
/**
 * Listening Engine - Moduł do odtwarzania zestawów językowych
 * Używa Web Speech API (TTS) do syntezy mowy
 */

(function() {
'use strict';

// Stan odtwarzacza
const playerState = {
  currentSet: null,
  currentIndex: 0,
  isPlaying: false,
  isLooping: false,
  langOrder: 'lang1-first', // 'lang1-first' lub 'lang2-first'
  lang1Code: 'pl-PL',
  lang2Code: 'es-ES',
  lang1Key: 'pl',
  lang2Key: 'es',
  synth: null,
  utterance: null,
  pauseBetweenLangs: 1000, // ms
  pauseBetweenPairs: 3000, // ms
  pauseAfterHeader: 4000, // ms
};

// Elementy DOM
const elements = {
  // Lista zestawów
  listeningList: document.getElementById('listening-list'),
  listeningListCards: document.getElementById('listening-list-cards'),
  listeningListLoader: document.getElementById('listening-list-loader'),
  listeningListError: document.getElementById('listening-list-error'),
  
  // Odtwarzacz
  playerContainer: document.getElementById('listening-player'),
  playerTitle: document.getElementById('player-title'),
  playerDescription: document.getElementById('player-description'),
  playerProgress: document.getElementById('player-progress'),
  playerProgressText: document.getElementById('player-progress-text'),
  playerCurrentPair: document.getElementById('player-current-pair'),
  playerLang1Text: document.getElementById('player-lang1-text'),
  playerLang2Text: document.getElementById('player-lang2-text'),
  
  // Kontrolki
  btnPlayPause: document.getElementById('btn-play-pause'),
  btnPlayIcon: document.getElementById('btn-play-icon'),
  btnPauseIcon: document.getElementById('btn-pause-icon'),
  btnLoop: document.getElementById('btn-loop'),
  btnSwitchLang: document.getElementById('btn-switch-lang'),
  btnPrevious: document.getElementById('btn-previous'),
  btnNext: document.getElementById('btn-next'),
  btnBackToList: document.getElementById('btn-back-to-list'),
  
  // Ikona kolejności języków
  langOrderText: document.getElementById('lang-order-text'),
};

/**
 * Inicjalizacja modułu
 */
function init(navigateFn, appState) {
  console.log('🎧 Inicjalizacja Listening Engine...');
  
  // Sprawdź wsparcie dla Web Speech API
  if (!('speechSynthesis' in window)) {
    console.error('❌ Web Speech API nie jest wspierane w tej przeglądarce!');
    return;
  }
  
  playerState.synth = window.speechSynthesis;
  
  // Event listeners
  setupEventListeners();
}

/**
 * Konfiguracja event listeners
 */
function setupEventListeners() {
  // Play/Pause
  elements.btnPlayPause?.addEventListener('click', togglePlayPause);
  
  // Loop
  elements.btnLoop?.addEventListener('click', toggleLoop);
  
  // Zmiana kolejności języków
  elements.btnSwitchLang?.addEventListener('click', switchLanguageOrder);
  
  // Poprzednia/następna para
  elements.btnPrevious?.addEventListener('click', () => navigatePair(-1));
  elements.btnNext?.addEventListener('click', () => navigatePair(1));
  
  // Powrót do listy
  elements.btnBackToList?.addEventListener('click', showListeningList);
}

/**
 * Wyświetl listę zestawów do nauki
 */
async function showListeningList() {
  // Zatrzymaj odtwarzanie jeśli aktywne
  stopPlayback();
  
  // Pokaż ekran listy
  elements.listeningList?.classList.remove('hidden');
  elements.playerContainer?.classList.add('hidden');
  
  // Załaduj zestawy z Supabase
  await loadListeningSets();
}

/**
 * Załaduj zestawy z Supabase
 */
async function loadListeningSets() {
  elements.listeningListLoader?.classList.remove('hidden');
  elements.listeningListError?.classList.add('hidden');
  elements.listeningListCards.innerHTML = '';
  
  try {
    const { data, error } = await supabaseClient
      .from('listening_sets')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    renderListeningCards(data);
  } catch (error) {
    console.error('Błąd ładowania zestawów:', error);
    elements.listeningListError?.classList.remove('hidden');
    elements.listeningListError.textContent = 'Nie udało się załadować zestawów. Spróbuj ponownie.';
  } finally {
    elements.listeningListLoader?.classList.add('hidden');
  }
}

/**
 * Renderuj karty zestawów
 */
function renderListeningCards(sets) {
  if (!sets || sets.length === 0) {
    elements.listeningListCards.innerHTML = '<p class="text-gray-400 text-center py-8">Brak zestawów do wyświetlenia.</p>';
    return;
  }
  
  const cardsHTML = sets.map(set => `
    <div class="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition cursor-pointer" 
         data-set-id="${set.id}">
      <div class="flex items-start gap-3">
        <span class="text-3xl">🎧</span>
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-white mb-1">${escapeHtml(set.title)}</h3>
          <p class="text-sm text-gray-400 mb-2">${escapeHtml(set.description || '')}</p>
          <div class="flex gap-2 text-xs text-gray-500">
            <span>🗣️ ${set.lang1_code} → ${set.lang2_code}</span>
            <span>•</span>
            <span>${set.content.length} par</span>
          </div>
        </div>
      </div>
    </div>
  `).join('');
  
  elements.listeningListCards.innerHTML = cardsHTML;
  
  // Dodaj event listeners do kart
  document.querySelectorAll('[data-set-id]').forEach(card => {
    card.addEventListener('click', () => {
      const setId = card.dataset.setId;
      const set = sets.find(s => s.id === setId);
      if (set) openPlayer(set);
    });
  });
}

/**
 * Otwórz odtwarzacz dla zestawu
 */
function openPlayer(set) {
  playerState.currentSet = set;
  playerState.currentIndex = 0;
  playerState.isPlaying = false;
  
  // Wykryj klucze języków z pierwszej pary
  const firstPair = set.content[0];
  const keys = Object.keys(firstPair);
  playerState.lang1Key = keys[0];
  playerState.lang2Key = keys[1];
  playerState.lang1Code = set.lang1_code;
  playerState.lang2Code = set.lang2_code;
  
  // Ukryj listę, pokaż odtwarzacz
  elements.listeningList?.classList.add('hidden');
  elements.playerContainer?.classList.remove('hidden');
  
  // Wypełnij dane
  elements.playerTitle.textContent = set.title;
  elements.playerDescription.textContent = set.description || '';
  
  updatePlayerUI();
}

/**
 * Aktualizuj UI odtwarzacza
 */
function updatePlayerUI() {
  const set = playerState.currentSet;
  if (!set) return;
  
  const currentPair = set.content[playerState.currentIndex];
  const total = set.content.length;
  
  // Postęp
  elements.playerProgress.style.width = `${((playerState.currentIndex + 1) / total) * 100}%`;
  elements.playerProgressText.textContent = `${playerState.currentIndex + 1} / ${total}`;
  
  // Tekst pary
  elements.playerLang1Text.textContent = currentPair[playerState.lang1Key] || '';
  elements.playerLang2Text.textContent = currentPair[playerState.lang2Key] || '';
  
  // Kolejność języków
  elements.langOrderText.textContent = 
    playerState.langOrder === 'lang1-first' 
      ? `${playerState.lang1Code.split('-')[0].toUpperCase()} → ${playerState.lang2Code.split('-')[0].toUpperCase()}`
      : `${playerState.lang2Code.split('-')[0].toUpperCase()} → ${playerState.lang1Code.split('-')[0].toUpperCase()}`;
  
  // Ikona play/pause
  if (playerState.isPlaying) {
    elements.btnPlayIcon?.classList.add('hidden');
    elements.btnPauseIcon?.classList.remove('hidden');
  } else {
    elements.btnPlayIcon?.classList.remove('hidden');
    elements.btnPauseIcon?.classList.add('hidden');
  }
  
  // Ikona loop
  if (playerState.isLooping) {
    elements.btnLoop?.classList.add('bg-blue-600');
    elements.btnLoop?.classList.remove('bg-gray-700');
  } else {
    elements.btnLoop?.classList.remove('bg-blue-600');
    elements.btnLoop?.classList.add('bg-gray-700');
  }
}

/**
 * Toggle Play/Pause
 */
function togglePlayPause() {
  if (playerState.isPlaying) {
    pausePlayback();
  } else {
    startPlayback();
  }
}

/**
 * Rozpocznij odtwarzanie
 */
function startPlayback() {
  playerState.isPlaying = true;
  updatePlayerUI();
  playCurrentPair();
}

/**
 * Zatrzymaj odtwarzanie (pauza)
 */
function pausePlayback() {
  playerState.isPlaying = false;
  playerState.synth.cancel(); // Zatrzymaj wszystkie aktywne utterances
  updatePlayerUI();
}

/**
 * Całkowicie zatrzymaj odtwarzanie
 */
function stopPlayback() {
  playerState.isPlaying = false;
  playerState.synth.cancel();
}

/**
 * Odtwórz aktualną parę
 */
async function playCurrentPair() {
  if (!playerState.isPlaying) return;
  
  const set = playerState.currentSet;
  const currentPair = set.content[playerState.currentIndex];
  
  // Sprawdź czy to nagłówek sekcji (separator)
  const isHeader = isSectionHeader(currentPair);
  
  if (isHeader) {
    // Dla nagłówka: odtwórz tylko w jednym języku (domyślnie lang2)
    await speakText(currentPair[playerState.lang2Key], playerState.lang2Code);
    await wait(playerState.pauseAfterHeader);
  } else {
    // Normalna para
    const order = playerState.langOrder === 'lang1-first' 
      ? [playerState.lang1Key, playerState.lang2Key]
      : [playerState.lang2Key, playerState.lang1Key];
    
    const codes = playerState.langOrder === 'lang1-first'
      ? [playerState.lang1Code, playerState.lang2Code]
      : [playerState.lang2Code, playerState.lang1Code];
    
    // Odtwórz pierwszy język
    await speakText(currentPair[order[0]], codes[0]);
    await wait(playerState.pauseBetweenLangs);
    
    // Odtwórz drugi język
    await speakText(currentPair[order[1]], codes[1]);
    await wait(playerState.pauseBetweenPairs);
  }
  
  // Przejdź do następnej pary
  if (playerState.isPlaying) {
    navigatePair(1, true); // auto-advance
  }
}

/**
 * Odtwórz tekst przez TTS
 */
function speakText(text, langCode) {
  return new Promise((resolve) => {
    if (!playerState.isPlaying) {
      resolve();
      return;
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = 0.85; // Wolniej dla lepszego zrozumienia
    
    utterance.onend = () => resolve();
    utterance.onerror = (err) => {
      console.error('Błąd TTS:', err);
      resolve();
    };
    
    playerState.synth.speak(utterance);
  });
}

/**
 * Poczekaj X milisekund
 */
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Sprawdź czy para to nagłówek sekcji
 */
function isSectionHeader(pair) {
  const values = Object.values(pair);
  return values.some(val => val.startsWith('---') && val.endsWith('---'));
}

/**
 * Nawigacja do poprzedniej/następnej pary
 */
function navigatePair(direction, autoAdvance = false) {
  const set = playerState.currentSet;
  if (!set) return;
  
  const newIndex = playerState.currentIndex + direction;
  
  // Sprawdź granice
  if (newIndex < 0) {
    playerState.currentIndex = 0;
  } else if (newIndex >= set.content.length) {
    // Koniec zestawu
    if (playerState.isLooping && autoAdvance) {
      playerState.currentIndex = 0; // Rozpocznij od początku
    } else {
      pausePlayback();
      return;
    }
  } else {
    playerState.currentIndex = newIndex;
  }
  
  updatePlayerUI();
  
  // Kontynuuj odtwarzanie jeśli aktywne
  if (playerState.isPlaying) {
    playCurrentPair();
  }
}

/**
 * Toggle zapętlanie
 */
function toggleLoop() {
  playerState.isLooping = !playerState.isLooping;
  updatePlayerUI();
}

/**
 * Zmień kolejność odtwarzania języków
 */
function switchLanguageOrder() {
  playerState.langOrder = 
    playerState.langOrder === 'lang1-first' 
      ? 'lang2-first' 
      : 'lang1-first';
  updatePlayerUI();
}

/**
 * Escape HTML (bezpieczeństwo)
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Eksportuj funkcje publiczne
window.initListeningEngine = init;
window.showListeningList = showListeningList;

})();
```

### 3.2 HTML dla Odtwarzacza

Dodaj do `index.html` (przed zamknięciem `<body>`):

```html
<!-- Ekran: Słuchanie -->
<div id="listening-screen" class="hidden">
  
  <!-- Lista zestawów -->
  <div id="listening-list">
    <h2 class="text-2xl font-bold mb-6">🎧 Nauka ze Słuchu</h2>
    
    <!-- Loader -->
    <div id="listening-list-loader" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-600 border-t-blue-500"></div>
    </div>
    
    <!-- Error -->
    <div id="listening-list-error" class="hidden bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded mb-4"></div>
    
    <!-- Karty zestawów -->
    <div id="listening-list-cards" class="grid gap-4"></div>
  </div>
  
  <!-- Odtwarzacz -->
  <div id="listening-player" class="hidden">
    
    <!-- Header -->
    <div class="mb-6">
      <button id="btn-back-to-list" class="flex items-center gap-2 text-gray-400 hover:text-white mb-4">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        <span>Powrót do listy</span>
      </button>
      
      <h2 id="player-title" class="text-2xl font-bold mb-2"></h2>
      <p id="player-description" class="text-gray-400 text-sm"></p>
    </div>
    
    <!-- Pasek postępu -->
    <div class="mb-6">
      <div class="bg-gray-700 h-2 rounded-full overflow-hidden mb-2">
        <div id="player-progress" class="bg-blue-500 h-full transition-all duration-300" style="width: 0%"></div>
      </div>
      <p id="player-progress-text" class="text-center text-sm text-gray-400">0 / 0</p>
    </div>
    
    <!-- Aktualnie odtwarzana para -->
    <div id="player-current-pair" class="bg-gray-800 rounded-lg p-6 mb-6">
      <div class="space-y-4">
        <div class="text-center">
          <p id="player-lang1-text" class="text-xl font-medium text-white"></p>
        </div>
        <div class="border-t border-gray-700"></div>
        <div class="text-center">
          <p id="player-lang2-text" class="text-xl font-medium text-blue-400"></p>
        </div>
      </div>
    </div>
    
    <!-- Kontrolki -->
    <div class="space-y-4">
      
      <!-- Główne kontrolki -->
      <div class="flex justify-center items-center gap-4">
        
        <!-- Poprzednia -->
        <button id="btn-previous" class="p-3 bg-gray-700 hover:bg-gray-600 rounded-full transition">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <!-- Play/Pause -->
        <button id="btn-play-pause" class="p-6 bg-blue-600 hover:bg-blue-700 rounded-full transition shadow-lg">
          <svg id="btn-play-icon" class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          <svg id="btn-pause-icon" class="w-8 h-8 hidden" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        </button>
        
        <!-- Następna -->
        <button id="btn-next" class="p-3 bg-gray-700 hover:bg-gray-600 rounded-full transition">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        
      </div>
      
      <!-- Dodatkowe kontrolki -->
      <div class="flex justify-center items-center gap-3">
        
        <!-- Zapętlanie -->
        <button id="btn-loop" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span class="text-sm">Zapętl</span>
        </button>
        
        <!-- Zmiana kolejności języków -->
        <button id="btn-switch-lang" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          <span id="lang-order-text" class="text-sm font-mono">PL → ES</span>
        </button>
        
      </div>
      
    </div>
    
  </div>
  
</div>
```

### 3.3 Integracja z `app.js`

W `app.js`, w funkcji `init()`:

```javascript
// Inicjalizuj Listening Engine
if (typeof initListeningEngine === 'function') {
  initListeningEngine(
    (screen) => uiManager.showScreen(screen, state, elements, contentManager, sessionManager),
    state
  );
}
```

### 3.4 Aktualizacja `data-service.js`

Dodaj funkcje do pobierania zestawów z Supabase:

```javascript
/**
 * Pobierz wszystkie zestawy do nauki słuchu
 */
async function getListeningSets() {
  const { data, error } = await supabaseClient
    .from('listening_sets')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Błąd pobierania zestawów:', error);
    throw error;
  }
  
  return data;
}

/**
 * Pobierz pojedynczy zestaw
 */
async function getListeningSet(id) {
  const { data, error } = await supabaseClient
    .from('listening_sets')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Błąd pobierania zestawu:', error);
    throw error;
  }
  
  return data;
}

/**
 * Utwórz nowy zestaw
 */
async function createListeningSet(title, description, lang1Code, lang2Code, content) {
  const user = await authService.getCurrentUser();
  if (!user) throw new Error('Musisz być zalogowany');
  
  const { data, error } = await supabaseClient
    .from('listening_sets')
    .insert([{
      user_id: user.id,
      title,
      description,
      lang1_code: lang1Code,
      lang2_code: lang2Code,
      content,
      is_sample: false
    }])
    .select()
    .single();
  
  if (error) {
    console.error('Błąd tworzenia zestawu:', error);
    throw error;
  }
  
  return data;
}

/**
 * Usuń zestaw
 */
async function deleteListeningSet(id) {
  const { error } = await supabaseClient
    .from('listening_sets')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Błąd usuwania zestawu:', error);
    throw error;
  }
}

// Eksportuj
window.dataService = {
  // ... istniejące funkcje ...
  getListeningSets,
  getListeningSet,
  createListeningSet,
  deleteListeningSet
};
```

### 3.5 Pliki do Stworzenia/Modyfikacji (Etap 3)

- **NOWE**: `js/listening-engine.js` - główna logika odtwarzacza
- `index.html` - dodanie HTML dla ekranu słuchania
- `js/app.js` - inicjalizacja listening engine
- `js/data-service.js` - funkcje do komunikacji z Supabase
- `js/ui-manager.js` - integracja z nawigacją

---

## Etap 4: Integracja z AI (Przyszłość)

> **Uwaga**: Ten etap będzie realizowany w przyszłości, po ukończeniu Etapów 1-3.

### 4.1 Rozszerzenie Generatora AI

**W `ai-prompts.js`** - dodaj nowy prompt:

```javascript
function getListeningSetPrompt(userInput) {
  return `Jesteś ekspertem od nauki języków. Wygeneruj zestaw par językowych w formacie JSON zgodnie z poniższą specyfikacją.

INSTRUKCJE UŻYTKOWNIKA:
${userInput}

FORMAT WYJŚCIOWY (JSON):
{
  "title": "Tytuł zestawu",
  "description": "Krótki opis",
  "lang1_code": "pl-PL",
  "lang2_code": "es-ES",
  "content": [
    {"pl": "--- SEKCJA 1 ---", "es": "--- SECCIÓN 1 ---"},
    {"pl": "tekst po polsku", "es": "texto en español"},
    ...
  ]
}

WYMAGANIA:
1. Wygeneruj minimum 20 par językowych
2. Grupuj pary w logiczne sekcje (używając separatorów ---)
3. Upewnij się, że klucze w "content" odpowiadają kodom języków (np. "pl", "es")
4. Dodaj różnorodność: słowa, frazy, zdania
5. Zwróć TYLKO poprawny JSON, bez dodatkowych komentarzy

Wygeneruj teraz zestaw:`;
}
```

### 4.2 Aktualizacja UI Generatora

W modalu AI, dodaj radio button do wyboru typu:
- Quiz
- Trening
- **Zestaw do nauki** (NOWE)

### 4.3 Logika Zapisu

Po wygenerowaniu przez AI, automatycznie zapisz do Supabase używając `createListeningSet()`.

---

## Zależności i Wymagania

### Technologie
- **Supabase**: Baza danych PostgreSQL + Auth
- **Web Speech API**: TTS (Text-to-Speech)
- **Tailwind CSS**: Stylizacja
- **Vanilla JavaScript**: Logika aplikacji

### Wymagania Przeglądarki
- Chrome/Edge 90+ (zalecane - najlepsze wsparcie TTS)
- Firefox 88+
- Safari 14+

### Wymagane Uprawnienia
Brak - Web Speech API nie wymaga uprawnień użytkownika.

---

## Testy

### Testy Manualne

#### Test 1: Utworzenie Tabeli
- [ ] Uruchom SQL w Supabase Dashboard
- [ ] Zweryfikuj strukturę tabeli
- [ ] Sprawdź czy RLS jest włączone

#### Test 2: Dodanie Sample Content
- [ ] Wstaw przykładowy zestaw
- [ ] Zweryfikuj czy jest widoczny dla niezalogowanych

#### Test 3: Nawigacja
- [ ] Sprawdź czy Tab Bar jest widoczny na dole
- [ ] Sprawdź czy wszystkie taby działają
- [ ] Zweryfikuj responsywność na mobile

#### Test 4: Odtwarzacz - Podstawy
- [ ] Otwórz zestaw z listy
- [ ] Sprawdź czy UI się prawidłowo renderuje
- [ ] Kliknij Play - czy TTS działa?

#### Test 5: Odtwarzacz - Kontrolki
- [ ] Test Play/Pause
- [ ] Test Zapętlania
- [ ] Test zmiany kolejności języków
- [ ] Test nawigacji (poprzednia/następna para)

#### Test 6: Odtwarzacz - Logika
- [ ] Sprawdź czy przerwy są odpowiednie (1s/3s/4s)
- [ ] Sprawdź obsługę separatorów (nagłówków)
- [ ] Sprawdź zachowanie na końcu listy
- [ ] Sprawdź zapętlanie

#### Test 7: CRUD Operations
- [ ] Dodanie zestawu (przyszłość - przez AI lub import)
- [ ] Edycja zestawu (przyszłość)
- [ ] Usuwanie zestawu

### Testy Automatyczne (Opcjonalnie)

Możesz dodać testy jednostkowe dla:
- Parsowania danych JSON
- Wykrywania nagłówków sekcji
- Logiki nawigacji

---

## Checklist Implementacji

### Etap 1: Baza Danych ✅
- [ ] Utworzyć nową tabelę `listening_sets` w Supabase
- [ ] Skonfigurować polityki RLS
- [ ] Dodać przykładowe sample content
- [ ] Zaktualizować `supabase/schema.sql`
- [ ] Zaktualizować `DB_SCHEMA.md`
- [ ] Przetestować zapytania SELECT/INSERT

### Etap 2: Nawigacja ✅
- [ ] Usunąć stare przyciski zakładek z HTML
- [ ] Dodać nowy Tab Bar na dole strony
- [ ] Stworzyć ekran "Więcej"
- [ ] Zaktualizować CSS (klasa `.tab-button`, `.safe-area-bottom`)
- [ ] Zaktualizować `app.js` (stan, elementy)
- [ ] Zaktualizować `ui-manager.js` (funkcja `switchTab`)
- [ ] Przenieść przyciski "Dodaj" i "Generator AI" do ekranu "Więcej"
- [ ] Przetestować nawigację na różnych zakładkach
- [ ] Przetestować responsywność na mobile

### Etap 3: Odtwarzacz ✅
- [ ] Stworzyć nowy plik `js/listening-engine.js`
- [ ] Dodać HTML dla ekranu słuchania (lista + odtwarzacz)
- [ ] Zaimplementować funkcję `showListeningList()`
- [ ] Zaimplementować funkcję `loadListeningSets()` (połączenie z Supabase)
- [ ] Zaimplementować renderowanie kart zestawów
- [ ] Zaimplementować funkcję `openPlayer()`
- [ ] Zaimplementować UI odtwarzacza (wyświetlanie par)
- [ ] Zaimplementować logikę TTS (Web Speech API)
- [ ] Zaimplementować kontrolki (play/pause/loop/switch)
- [ ] Zaimplementować nawigację między parami
- [ ] Zaimplementować obsługę separatorów (nagłówków)
- [ ] Zaktualizować `data-service.js` (funkcje CRUD dla listening_sets)
- [ ] Zintegrować z `app.js` (inicjalizacja modułu)
- [ ] Przetestować całą funkcjonalność

### Etap 4: AI (Przyszłość) 🔮
- [ ] Rozszerzyć `ai-prompts.js` o nowy prompt
- [ ] Dodać opcję "Zestaw do nauki" w modalu AI
- [ ] Zaimplementować logikę zapisu do Supabase
- [ ] Przetestować generowanie przez AI

---

## Uwagi Końcowe

### Najważniejsze Punkty
1. **Supabase RLS** - Kluczowe dla bezpieczeństwa. Upewnij się, że polityki są prawidłowo skonfigurowane.
2. **Web Speech API** - Sprawdź wsparcie przeglądarki i graceful degradation.
3. **Responsywność** - Tab Bar musi dobrze wyglądać zarówno na mobile jak i desktop.
4. **User Experience** - Przerwy między odtwarzaniem muszą być naturalne i komfortowe.

### Potencjalne Problemy i Rozwiązania

| Problem | Rozwiązanie |
|---------|-------------|
| TTS nie działa | Sprawdź wsparcie przeglądarki, dodaj fallback z informacją |
| Odtwarzanie się "zacina" | Użyj `Promise` dla synchronizacji, dodaj error handling |
| Tab Bar zasłania treść | Dodaj `padding-bottom` do głównego kontenera |
| Wolne ładowanie z Supabase | Dodaj loader, rozważ paginację dla dużej liczby zestawów |

### Następne Kroki Po Implementacji
1. Zebrać feedback od użytkowników
2. Rozważyć dodatkowe funkcje:
   - Regulacja prędkości mowy
   - Wybór głosu lektora
   - Zakładki/ulubione zestawy
   - Eksport zestawów do pliku
3. Optymalizacja wydajności
4. Dodanie statystyk użycia

---

**Dokument stworzony**: 2025-10-28  
**Wersja**: 1.0  
**Status**: Gotowy do implementacji




