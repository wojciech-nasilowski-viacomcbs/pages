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
  pauseBetweenLangs: 700, // ms - skrócone (było 1000ms)
  pauseBetweenPairs: 2000, // ms - skrócone (było 3000ms)
  pauseAfterHeader: 2500, // ms - skrócone (było 4000ms)
  pendingTimeouts: [], // Tablica ID timeoutów do anulowania (pauzy między parami)
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
  btnRestart: document.getElementById('btn-listening-restart'),
  
  // Ikona kolejności języków
  langOrderText: document.getElementById('lang-order-text'),
  
  // Wskazówka o wygaszaniu ekranu
  screenTimeoutTip: document.getElementById('screen-timeout-tip'),
  closeScreenTip: document.getElementById('close-screen-tip'),
  dismissScreenTip: document.getElementById('dismiss-screen-tip'),
  
  // Dialogi
  restartDialog: document.getElementById('restart-dialog'),
  restartConfirm: document.getElementById('restart-confirm'),
  restartCancel: document.getElementById('restart-cancel')
};

// Referencje do funkcji z innych modułów
let navigateToScreen = null;
let appState = null;

/**
 * Inicjalizacja modułu
 */
function init(navigateFn, state) {
  navigateToScreen = navigateFn;
  appState = state;
  
  // Sprawdź wsparcie dla Web Speech API
  if (!('speechSynthesis' in window)) {
    console.error('❌ Web Speech API nie jest wspierane w tej przeglądarce!');
    return;
  }
  
  playerState.synth = window.speechSynthesis;
  
  // Załaduj głosy (czasami są dostępne dopiero po chwili)
  loadVoices();
  
  // Event listeners
  setupEventListeners();
}

/**
 * Załaduj dostępne głosy TTS
 */
function loadVoices() {
  // Pobierz głosy
  let voices = playerState.synth.getVoices();
  
  if (voices.length > 0) {
    // Głosy już dostępne
  } else {
    // Czasami głosy ładują się asynchronicznie
    playerState.synth.onvoiceschanged = () => {
      voices = playerState.synth.getVoices();
    };
  }
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
  
  // Wskazówka o wygaszaniu ekranu
  setupScreenTipListeners();
  
  // Poprzednia/następna para
  elements.btnPrevious?.addEventListener('click', () => navigatePair(-1));
  elements.btnNext?.addEventListener('click', () => navigatePair(1));
  
  // Powrót do listy
  elements.btnBackToList?.addEventListener('click', showListeningList);
  
  // Restart
  elements.btnRestart?.addEventListener('click', handleRestartClick);
  elements.restartConfirm?.addEventListener('click', handleRestartConfirm);
  elements.restartCancel?.addEventListener('click', handleRestartCancel);
}

/**
 * Wyświetl listę zestawów do nauki
 */
async function showListeningList() {
  // Zatrzymaj odtwarzanie jeśli aktywne
  stopPlayback();
  
  // Pokaż ekran listy
  if (elements.listeningList) elements.listeningList.classList.remove('hidden');
  if (elements.playerContainer) elements.playerContainer.classList.add('hidden');
  
  // Pokaż tab bar na liście zestawów (używamy nowego state managera)
  if (window.uiState) {
    window.uiState.setListeningPlayerActive(false);
  } else if (window.uiManager && window.uiManager.updateTabBarVisibility) {
    // Fallback dla kompatybilności wstecznej
    window.uiManager.updateTabBarVisibility('listening', false);
  }
  
  // Załaduj zestawy z Supabase
  await loadListeningSets();
}

/**
 * Załaduj zestawy z Supabase
 */
async function loadListeningSets() {
  if (!elements.listeningListLoader || !elements.listeningListCards) return;
  
  elements.listeningListLoader.classList.remove('hidden');
  if (elements.listeningListError) elements.listeningListError.classList.add('hidden');
  elements.listeningListCards.innerHTML = '';
  
  try {
    // Pobierz zestawy przez dataService
    const sets = await window.dataService.getListeningSets();
    renderListeningCards(sets);
  } catch (error) {
    console.error('❌ Błąd ładowania zestawów:', error);
    if (elements.listeningListError) {
      elements.listeningListError.classList.remove('hidden');
      elements.listeningListError.textContent = 'Nie udało się załadować zestawów. Spróbuj ponownie.';
    }
  } finally {
    elements.listeningListLoader.classList.add('hidden');
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
    card.addEventListener('click', async () => { // Dodano async
      const setId = card.dataset.setId;
      const set = sets.find(s => s.id === setId);
      if (set) {
        await openPlayer(set); // Dodano await
      }
    });
  });
}

/**
 * Otwórz odtwarzacz dla zestawu
 */
async function openPlayer(set) {
  // Etap 1: Rozgrzewka Web Audio API (jednorazowo)
  if (typeof window.initAudio === 'function') {
    await window.initAudio();
    window.initAudio = null; // Wykonaj tylko raz
  }

  // Etap 2: Rozgrzewka silnika TTS (za każdym razem)
  warmUpTTS();

  // Dajmy systemowi chwilę (100ms) na przetworzenie rozgrzewki
  await wait(100);

  playerState.currentSet = set;
  playerState.currentIndex = 0;
  playerState.isPlaying = false;
  
  // Przypisz kody języków
  playerState.lang1Code = set.lang1_code;
  playerState.lang2Code = set.lang2_code;
  
  // Wykryj klucze języków z pierwszej pary (nie-nagłówkowej)
  const firstNonHeaderPair = set.content.find(pair => !isSectionHeader(pair));
  if (!firstNonHeaderPair) {
    console.error('❌ Brak par do odtworzenia!');
    return;
  }
  
  const keys = Object.keys(firstNonHeaderPair);
  
  // Dopasuj klucze do kodów języków
  // lang1_code to np. "pl-PL", więc szukamy klucza "pl"
  const lang1Prefix = set.lang1_code.split('-')[0]; // "pl-PL" → "pl"
  const lang2Prefix = set.lang2_code.split('-')[0]; // "es-ES" → "es"
  
  playerState.lang1Key = keys.find(k => k === lang1Prefix) || keys[0];
  playerState.lang2Key = keys.find(k => k === lang2Prefix) || keys[1];
  
  // Ukryj listę, pokaż odtwarzacz
  if (elements.listeningList) elements.listeningList.classList.add('hidden');
  if (elements.playerContainer) elements.playerContainer.classList.remove('hidden');
  
  // Ukryj tab bar podczas odtwarzania (używamy nowego state managera)
  if (window.uiState) {
    window.uiState.setListeningPlayerActive(true);
  } else if (window.uiManager && window.uiManager.updateTabBarVisibility) {
    // Fallback dla kompatybilności wstecznej
    window.uiManager.updateTabBarVisibility('listening', true);
  }
  
  // Wypełnij dane
  if (elements.playerTitle) elements.playerTitle.textContent = set.title;
  if (elements.playerDescription) elements.playerDescription.textContent = set.description || '';
  
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
  if (elements.playerProgress) {
    elements.playerProgress.style.width = `${((playerState.currentIndex + 1) / total) * 100}%`;
  }
  if (elements.playerProgressText) {
    elements.playerProgressText.textContent = `${playerState.currentIndex + 1} / ${total}`;
  }
  
  // Tekst pary - wyświetl zgodnie z kolejnością odtwarzania
  const displayOrder = playerState.langOrder === 'lang1-first'
    ? [playerState.lang1Key, playerState.lang2Key]
    : [playerState.lang2Key, playerState.lang1Key];
  
  if (elements.playerLang1Text) {
    elements.playerLang1Text.textContent = currentPair[displayOrder[0]] || '';
  }
  if (elements.playerLang2Text) {
    elements.playerLang2Text.textContent = currentPair[displayOrder[1]] || '';
  }
  
  // Kolejność języków
  if (elements.langOrderText) {
    elements.langOrderText.textContent = 
      playerState.langOrder === 'lang1-first' 
        ? `${playerState.lang1Code.split('-')[0].toUpperCase()} → ${playerState.lang2Code.split('-')[0].toUpperCase()}`
        : `${playerState.lang2Code.split('-')[0].toUpperCase()} → ${playerState.lang1Code.split('-')[0].toUpperCase()}`;
  }
  
  // Ikona play/pause
  if (playerState.isPlaying) {
    if (elements.btnPlayIcon) elements.btnPlayIcon.classList.add('hidden');
    if (elements.btnPauseIcon) elements.btnPauseIcon.classList.remove('hidden');
  } else {
    if (elements.btnPlayIcon) elements.btnPlayIcon.classList.remove('hidden');
    if (elements.btnPauseIcon) elements.btnPauseIcon.classList.add('hidden');
  }
  
  // Ikona loop
  if (elements.btnLoop) {
    if (playerState.isLooping) {
      elements.btnLoop.classList.add('bg-blue-600');
      elements.btnLoop.classList.remove('bg-gray-700');
    } else {
      elements.btnLoop.classList.remove('bg-blue-600');
      elements.btnLoop.classList.add('bg-gray-700');
    }
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
  
  // Anuluj timeouty z wait() (pauzy między parami)
  if (playerState.pendingTimeouts && playerState.pendingTimeouts.length > 0) {
    playerState.pendingTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    playerState.pendingTimeouts = [];
  }
  
  // Zatrzymaj wszystkie aktywne utterances
  playerState.synth.cancel();
  
  updatePlayerUI();
}

/**
 * Całkowicie zatrzymaj odtwarzanie
 */
function stopPlayback() {
  playerState.isPlaying = false;
  
  // Anuluj timeouty z wait() (pauzy między parami)
  if (playerState.pendingTimeouts && playerState.pendingTimeouts.length > 0) {
    playerState.pendingTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    playerState.pendingTimeouts = [];
  }
  
  // Zatrzymaj wszystkie aktywne utterances
  if (playerState.synth) {
    playerState.synth.cancel();
  }
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
    // Dla nagłówka: odtwórz w obu językach jak normalną parę
    const order = playerState.langOrder === 'lang1-first' 
      ? [playerState.lang1Key, playerState.lang2Key]
      : [playerState.lang2Key, playerState.lang1Key];
    
    const codes = playerState.langOrder === 'lang1-first'
      ? [playerState.lang1Code, playerState.lang2Code]
      : [playerState.lang2Code, playerState.lang1Code];
    
    const headerText1 = currentPair[order[0]];
    const headerText2 = currentPair[order[1]];
    
    // Odtwórz nagłówek w pierwszym języku (bez prefiksu - nagłówki są już opisowe)
    await speakText(headerText1, codes[0]);
    if (!playerState.isPlaying) return;
    await wait(playerState.pauseBetweenLangs);
    
    // Odtwórz nagłówek w drugim języku
    if (!playerState.isPlaying) return;
    await speakText(headerText2, codes[1]);
    await wait(playerState.pauseAfterHeader);
  } else {
    // Normalna para
    const order = playerState.langOrder === 'lang1-first' 
      ? [playerState.lang1Key, playerState.lang2Key]
      : [playerState.lang2Key, playerState.lang1Key];
    
    const codes = playerState.langOrder === 'lang1-first'
      ? [playerState.lang1Code, playerState.lang2Code]
      : [playerState.lang2Code, playerState.lang1Code];
    
    const text1 = currentPair[order[0]];
    const text2 = currentPair[order[1]];
    
    // Odtwórz pierwszy język z prefiksem "1."
    const textWithPrefix1 = `${text1}`;
    await speakText(textWithPrefix1, codes[0]);
    if (!playerState.isPlaying) return;
    await wait(playerState.pauseBetweenLangs);
    
    // Odtwórz drugi język z prefiksem "2."
    if (!playerState.isPlaying) return;
    const textWithPrefix2 = `${text2}`;
    await speakText(textWithPrefix2, codes[1]);
    if (!playerState.isPlaying) return;
    await wait(playerState.pauseBetweenPairs);
  }
  
  // WAŻNE: Sprawdź czy nadal odtwarzamy PRZED przejściem do następnej pary
  if (!playerState.isPlaying) return;
  
  // Przejdź do następnej pary
  const newIndex = playerState.currentIndex + 1;
  
  if (newIndex >= set.content.length) {
    // Koniec zestawu
    if (playerState.isLooping) {
      playerState.currentIndex = 0;
      updatePlayerUI();
      playCurrentPair(); // Rekurencyjnie odtwórz od początku
    } else {
      pausePlayback();
    }
  } else {
    playerState.currentIndex = newIndex;
    updatePlayerUI();
    playCurrentPair(); // Rekurencyjnie odtwórz następną parę
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
    
    // WAŻNE: Czekaj aż TTS zakończy wszystkie poprzednie utterances
    // ALE: jeśli isPlaying zmieni się na false, natychmiast przerwij
    const waitForSilence = () => {
      // Sprawdź czy nadal odtwarzamy
      if (!playerState.isPlaying) {
        resolve();
        return;
      }
      
      if (playerState.synth.speaking) {
        setTimeout(waitForSilence, 50);
      } else {
        startSpeaking();
      }
    };
    
    const startSpeaking = () => {
      // Sprawdź ponownie czy nadal odtwarzamy
      if (!playerState.isPlaying) {
        resolve();
        return;
      }
      
      // Normalizuj tekst - zamień na lowercase z wielką literą na początku
      // To zapobiega czytaniu wielkich liter jako skrótów (K-O-T -> Kot)
      const normalizedText = normalizeTextForTTS(text);
      
      const utterance = new SpeechSynthesisUtterance(normalizedText);
      utterance.lang = langCode;
      utterance.rate = 0.85; // Wolniej dla lepszego zrozumienia
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // Spróbuj znaleźć odpowiedni głos dla języka
      const voices = playerState.synth.getVoices();
      const preferredVoice = findBestVoice(voices, langCode);
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      // Czysty tekst, bez żadnego paddingu
      utterance.text = normalizedText;

      // Obsługa zakończenia i błędów
      utterance.onend = () => {
        // Sprawdź czy nadal odtwarzamy przed resolve
        if (playerState.isPlaying) {
          resolve();
        } else {
          // Jeśli zatrzymano, anuluj wszystko
          playerState.synth.cancel();
          resolve();
        }
      };

      utterance.onerror = (event) => {
        console.warn('TTS error:', event.error);
        resolve();
      };

      // Dodaj utterance do kolejki bez opóźnienia
      if (!playerState.isPlaying) {
        resolve();
        return;
      }
      playerState.synth.speak(utterance);
    };
    
    // Rozpocznij od sprawdzenia czy TTS jest cichy
    waitForSilence();
  });
}

/**
 * Normalizuj tekst dla TTS - zapobiega czytaniu wielkich liter jako skrótów
 */
function normalizeTextForTTS(text) {
  // Zamień wszystkie wielkie litery na lowercase z kapitalizacją
  // To zapobiega czytaniu ESTAR jako E-S-T-A-R

  // Najpierw zamień cały tekst na lowercase
  let normalized = text.toLowerCase();

  // Kapitalizuj pierwszą literę
  if (normalized.length > 0) {
    normalized = normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }

  // Kapitalizuj litery po kropce, wykrzykniku, pytajniku
  normalized = normalized.replace(/([.!?]\s+)(\w)/g, (match, punctuation, letter) => {
    return punctuation + letter.toUpperCase();
  });

  // Kapitalizuj pierwszą literę po nawiasie otwierającym
  normalized = normalized.replace(/(\(\s*)(\w)/g, (match, bracket, letter) => {
    return bracket + letter.toUpperCase();
  });

  return normalized;
}

/**
 * Znajdź najlepszy głos dla danego języka
 */
function findBestVoice(voices, langCode) {
  if (!voices || voices.length === 0) {
    return null;
  }
  
  // Wyciągnij kod języka (np. 'pl' z 'pl-PL')
  const lang = langCode.split('-')[0].toLowerCase();
  const country = langCode.split('-')[1]?.toLowerCase();
  
  // Znajdź najlepszy głos dla języka
  
  // NOWY PRIORYTET: Google głosy są najlepszej jakości i nie ucinają początku
  
  // Priorytet 1: Google głos z dokładnym kodem języka
  let voice = voices.find(v => 
    v.name.toLowerCase().includes('google') && 
    v.lang.toLowerCase() === langCode.toLowerCase()
  );
  if (voice) return voice;
  
  // Priorytet 2: Google głos z tym samym językiem
  voice = voices.find(v => 
    v.name.toLowerCase().includes('google') && 
    v.lang.toLowerCase().startsWith(lang)
  );
  if (voice) return voice;
  
  // Priorytet 3: Głos z dokładnym kodem języka i kraju
  voice = voices.find(v => v.lang.toLowerCase() === langCode.toLowerCase());
  if (voice) return voice;
  
  // Priorytet 4: Głos z tym samym językiem i krajem
  if (country) {
    voice = voices.find(v => {
      const vLang = v.lang.split('-')[0].toLowerCase();
      const vCountry = v.lang.split('-')[1]?.toLowerCase();
      return vLang === lang && vCountry === country;
    });
    if (voice) return voice;
  }
  
  // Priorytet 5: Dowolny głos z tym samym językiem
  voice = voices.find(v => v.lang.toLowerCase().startsWith(lang));
  if (voice) return voice;
  
  // Priorytet 6: Głos lokalny dla danego języka
  voice = voices.find(v => v.localService && v.lang.toLowerCase().startsWith(lang));
  if (voice) return voice;
  
  return null;
}

/**
 * Rozgrzewa silnik TTS, odtwarzając krótki, cichy dźwięk.
 * To jest DRUGI etap rozgrzewki, po inicjalizacji AudioContext.
 */
function warmUpTTS() {
  if (!playerState.synth || playerState.synth.speaking || playerState.synth.pending) {
    return;
  }
  const warmUpUtterance = new SpeechSynthesisUtterance(' ');
  warmUpUtterance.volume = 0; // Całkowicie cicho
  warmUpUtterance.rate = 10;    // Maksymalna prędkość
  playerState.synth.speak(warmUpUtterance);
}


/**
 * Poczekaj X milisekund
 * Zwraca Promise który można przerwać przez zmianę playerState.isPlaying
 */
function wait(ms) {
  return new Promise(resolve => {
    const timeoutId = setTimeout(resolve, ms);
    
    // Śledź timeout żeby móc go anulować
    if (!playerState.pendingTimeouts) {
      playerState.pendingTimeouts = [];
    }
    playerState.pendingTimeouts.push(timeoutId);
  });
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
  
  // Jeśli to manualne przejście (kliknięcie strzałki), zatrzymaj TTS
  if (!autoAdvance) {
    // KROK 1: Zatrzymaj odtwarzanie (przerywa Promise w playCurrentPair)
    playerState.isPlaying = false;
    
    // KROK 2: Anuluj timeouty z wait() (pauzy między parami)
    if (playerState.pendingTimeouts && playerState.pendingTimeouts.length > 0) {
      playerState.pendingTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
      playerState.pendingTimeouts = [];
    }
    
    // KROK 3: Anuluj wszystkie aktywne utterances
    if (playerState.synth) {
      playerState.synth.cancel();
    }
    
    // KROK 4: Poczekaj dłużej żeby wszystkie Promise i timeouty się zakończyły
    // Zwiększono z 100ms do 300ms dla pewności
    setTimeout(() => {
      // KROK 5: Anuluj ponownie na wszelki wypadek
      if (playerState.synth) {
        playerState.synth.cancel();
      }
      
      // KROK 6: Wyczyść listę timeoutów
      playerState.pendingTimeouts = [];
      
      // KROK 7: Kontynuuj nawigację (ale NIE przywracaj isPlaying)
      // Po manualnej nawigacji zatrzymujemy się na nowej parze
      continueNavigation();
    }, 300);
    
    return; // Wyjdź z funkcji, kontynuacja w setTimeout
  }
  
  // Auto-advance - kontynuuj normalnie
  continueNavigation();
  
  function continueNavigation() {
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

/**
 * Obsługuje kliknięcie przycisku restart - pokazuje dialog potwierdzenia
 */
function handleRestartClick() {
  if (elements.restartDialog) {
    // Oznacz że restart został wywołany z listening
    elements.restartDialog.dataset.source = 'listening';
    elements.restartDialog.classList.remove('hidden');
  }
}

/**
 * Obsługuje potwierdzenie restartu - rozpoczyna zestaw od nowa
 */
function handleRestartConfirm() {
  // Sprawdź czy dialog został wywołany z listening
  if (elements.restartDialog && elements.restartDialog.dataset.source !== 'listening') {
    return; // To nie nasz restart
  }
  
  // Ukryj dialog
  if (elements.restartDialog) {
    elements.restartDialog.classList.add('hidden');
    delete elements.restartDialog.dataset.source;
  }
  
  // Zatrzymaj odtwarzanie
  stopPlayback();
  
  // Resetuj do początku zestawu
  playerState.currentIndex = 0;
  playerState.isPlaying = false;
  
  // Odśwież UI
  updatePlayerUI();
}

/**
 * Obsługuje anulowanie restartu - ukrywa dialog
 */
function handleRestartCancel() {
  // Sprawdź czy dialog został wywołany z listening
  if (elements.restartDialog && elements.restartDialog.dataset.source !== 'listening') {
    return; // To nie nasz restart
  }
  
  if (elements.restartDialog) {
    elements.restartDialog.classList.add('hidden');
    delete elements.restartDialog.dataset.source;
  }
}

/**
 * Konfiguracja event listeners dla wskazówki o wygaszaniu ekranu
 */
function setupScreenTipListeners() {
  // Sprawdź czy użytkownik już ukrył wskazówkę
  const tipDismissed = localStorage.getItem('screenTipDismissed');
  if (tipDismissed === 'true' && elements.screenTimeoutTip) {
    elements.screenTimeoutTip.classList.add('hidden');
  }
  
  // Przycisk zamknięcia (X) - ukrywa tylko tymczasowo
  elements.closeScreenTip?.addEventListener('click', () => {
    if (elements.screenTimeoutTip) {
      elements.screenTimeoutTip.classList.add('hidden');
    }
  });
  
  // Przycisk "Rozumiem, nie pokazuj więcej" - ukrywa na stałe
  elements.dismissScreenTip?.addEventListener('click', () => {
    if (elements.screenTimeoutTip) {
      elements.screenTimeoutTip.classList.add('hidden');
      localStorage.setItem('screenTipDismissed', 'true');
    }
  });
  
  // Przycisk "Otwórz ustawienia" dla Androida
  const openSettingsBtn = document.getElementById('open-android-settings-listening');
  openSettingsBtn?.addEventListener('click', () => {
    if (window.wakeLockManager && window.wakeLockManager.openAndroidDisplaySettings) {
      const success = window.wakeLockManager.openAndroidDisplaySettings();
      if (!success) {
        // Jeśli nie udało się otworzyć (np. nie Android), pokaż komunikat
        alert('Ta funkcja działa tylko na urządzeniach Android.');
      }
    }
  });
}

// Eksportuj funkcje publiczne
window.initListeningEngine = init;
window.showListeningList = showListeningList;
window.listeningEngine = {
  isPlaying: () => playerState.isPlaying,
  getCurrentSet: () => playerState.currentSet
};

})();

