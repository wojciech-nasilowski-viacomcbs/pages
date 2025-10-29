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
  pendingTimeouts: [], // Tablica ID timeoutów do anulowania
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

// Referencje do funkcji z innych modułów
let navigateToScreen = null;
let appState = null;

/**
 * Inicjalizacja modułu
 */
function init(navigateFn, state) {
  console.log('🎧 Inicjalizacja Listening Engine...');
  
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
    console.log('🗣️ Dostępne głosy TTS:', voices.length);
    logAvailableVoices(voices);
  } else {
    // Czasami głosy ładują się asynchronicznie
    playerState.synth.onvoiceschanged = () => {
      voices = playerState.synth.getVoices();
      console.log('🗣️ Dostępne głosy TTS (załadowane):', voices.length);
      logAvailableVoices(voices);
    };
  }
}

/**
 * Wyloguj dostępne głosy (dla debugowania)
 */
function logAvailableVoices(voices) {
  // Grupuj głosy według języka
  const voicesByLang = {};
  voices.forEach(voice => {
    const lang = voice.lang.split('-')[0].toLowerCase();
    if (!voicesByLang[lang]) {
      voicesByLang[lang] = [];
    }
    voicesByLang[lang].push(voice);
  });
  
  // Wyloguj wszystkie dostępne języki
  console.log('🗣️ Dostępne języki TTS:', Object.keys(voicesByLang).sort().join(', '));
  
  // Szczegóły dla każdego języka (opcjonalnie)
  Object.keys(voicesByLang).sort().forEach(lang => {
    const langVoices = voicesByLang[lang];
    console.log(`  ${lang.toUpperCase()}: ${langVoices.length} głos(ów) - ${langVoices.map(v => v.name).join(', ')}`);
  });
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
  console.log('📋 Pokazuję listę zestawów...');
  
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
    
    console.log('✅ Załadowano zestawy:', sets.length);
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
  console.log('▶️ Otwieranie odtwarzacza dla:', set.title);
  
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
  
  console.log(`🔑 Klucze: lang1="${playerState.lang1Key}" (${playerState.lang1Code}), lang2="${playerState.lang2Key}" (${playerState.lang2Code})`);
  
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
  console.log('▶️ Start odtwarzania');
  playerState.isPlaying = true;
  updatePlayerUI();
  playCurrentPair();
}

/**
 * Zatrzymaj odtwarzanie (pauza)
 */
function pausePlayback() {
  console.log('⏸️ Pauza');
  playerState.isPlaying = false;
  
  // Anuluj wszystkie oczekujące timeouty
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
  console.log('⏹️ Stop');
  playerState.isPlaying = false;
  
  // Anuluj wszystkie oczekujące timeouty
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
    
    // Odtwórz nagłówek w pierwszym języku
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
    
    // Odtwórz pierwszy język
    await speakText(text1, codes[0]);
    if (!playerState.isPlaying) return;
    await wait(playerState.pauseBetweenLangs);
    
    // Odtwórz drugi język
    if (!playerState.isPlaying) return;
    await speakText(text2, codes[1]);
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
      
      // WAŻNE: Dodaj opóźnienie przed speak() żeby uniknąć ucinania początku
      // Web Speech API ma bug gdzie pierwsze głoski są ucięte
      // Rozwiązanie: dodaj cichą pauzę na początku tekstu
      // Użyj znaku spacji + przecinka dla naturalnej pauzy
      utterance.text = ' , ' + normalizedText;
      
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
      
      // Dodatkowe krótkie opóźnienie dla stabilności
      const timeoutId = setTimeout(() => {
        // KRYTYCZNE: Sprawdź ponownie czy nadal odtwarzamy
        if (!playerState.isPlaying) {
          resolve();
          return;
        }
        
        // Dodaj utterance do kolejki
        playerState.synth.speak(utterance);
      }, 100);
      
      // Zapisz timeout ID żeby móc go anulować
      if (!playerState.pendingTimeouts) {
        playerState.pendingTimeouts = [];
      }
      playerState.pendingTimeouts.push(timeoutId);
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
    console.warn('⚠️ Brak dostępnych głosów!');
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
  
  // Jeśli to manualne przejście (kliknięcie strzałki), zatrzymaj TTS
  if (!autoAdvance) {
    // KROK 1: Zatrzymaj odtwarzanie (przerywa Promise w playCurrentPair)
    playerState.isPlaying = false;
    
    // KROK 2: Anuluj wszystkie oczekujące timeouty (z setTimeout w speakText)
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

// Eksportuj funkcje publiczne
window.initListeningEngine = init;
window.showListeningList = showListeningList;
window.listeningEngine = {
  isPlaying: () => playerState.isPlaying,
  getCurrentSet: () => playerState.currentSet
};

})();

