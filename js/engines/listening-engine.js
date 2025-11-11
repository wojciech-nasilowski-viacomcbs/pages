/**
 * @fileoverview Listening Engine - wersja ES6 Class
 * Refactored w FAZIE 3.4 - dziedziczenie po BaseEngine
 * Obsługuje odtwarzanie zestawów językowych z Web Speech API (TTS)
 */

import { BaseEngine } from './base-engine.js';
import { CardRenderer } from '../ui/card-renderer.js';

/**
 * Silnik odtwarzania zestawów językowych
 * @extends BaseEngine
 */
export class ListeningEngine extends BaseEngine {
  /**
   * @param {Object} elements - Referencje do elementów DOM
   * @param {Function} navigateFn - Funkcja nawigacji
   * @param {Object} appState - Globalny stan aplikacji
   */
  constructor(elements, navigateFn, appState) {
    super('listening', elements);

    this.navigateToScreen = navigateFn;
    this.appState = appState;
    this.cardRenderer = new CardRenderer();

    // Stan odtwarzacza (lokalny)
    this.playerState = {
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
      pauseBetweenLangs: 700, // ms
      pauseBetweenPairs: 2000, // ms
      pauseAfterHeader: 2500, // ms
      pendingTimeouts: []
    };

    // Voices cache
    this.voices = [];
  }

  // ========== LIFECYCLE METHODS (BaseEngine implementation) ==========

  /**
   * Inicjalizacja silnika
   * @override
   */
  init() {
    this.log('Initializing...');

    // Sprawdź wsparcie dla Web Speech API
    if (!('speechSynthesis' in window)) {
      this.error('Web Speech API not supported');
      return;
    }

    this.playerState.synth = window.speechSynthesis;

    // Pobierz elementy DOM
    this._initDOMElements();

    // Załaduj głosy TTS
    this._loadVoices();

    // Dodaj event listenery
    this._attachEventListeners();

    // Ukryj wskazówkę o wygaszaniu ekranu na desktop
    this._setupScreenTimeoutTip();

    this.isInitialized = true;
    this.log('Initialized successfully');
  }

  /**
   * Rozpocznij odtwarzanie zestawu
   * @override
   * @param {Object} setData - Dane zestawu językowego
   * @param {string} setId - ID zestawu
   * @param {Object} [options={}] - Opcje
   */
  start(setData, setId, options = {}) {
    this.ensureInitialized();

    this.log('Starting listening set:', setData.title);

    // Reset stanu
    this.playerState.currentSet = setData;
    this.playerState.currentIndex = 0;
    this.playerState.isPlaying = false;
    this.playerState.isLooping = options.loop || false;
    this.playerState.lang1Code = setData.lang1_code || 'pl-PL';
    this.playerState.lang2Code = setData.lang2_code || 'es-ES';
    this.playerState.lang1Key = setData.lang1_key || 'pl';
    this.playerState.lang2Key = setData.lang2_key || 'es';

    this._setCurrentData(setData, setId);

    // Update UI
    this._updatePlayerUI();

    // Pokaż odtwarzacz
    this._showPlayer();

    // Rozpocznij odtwarzanie jeśli autoplay
    if (options.autoplay) {
      this._playPause();
    }
  }

  /**
   * Zatrzymaj odtwarzanie
   * @override
   */
  stop() {
    this.log('Stopping...');

    // Zatrzymaj TTS
    this._stopSpeaking();

    // Anuluj timeouty
    this._clearAllTimeouts();

    // Reset stanu
    this.playerState = {
      ...this.playerState,
      currentSet: null,
      currentIndex: 0,
      isPlaying: false,
      pendingTimeouts: []
    };

    this._clearState();

    // Ukryj odtwarzacz
    this._hidePlayer();
  }

  /**
   * Pauza odtwarzania
   * @override
   */
  pause() {
    if (this.playerState.isPlaying) {
      this._stopSpeaking();
      this._clearAllTimeouts();
      this.playerState.isPlaying = false;
      this._updatePlayPauseButton();
      this.log('Paused');
    }
  }

  /**
   * Wznów odtwarzanie
   * @override
   */
  resume() {
    if (!this.playerState.isPlaying && this.playerState.currentSet) {
      this._playCurrentPair();
      this.log('Resumed');
    }
  }

  /**
   * Restart od początku
   * @override
   */
  restart() {
    this.log('Restarting...');

    if (this.playerState.currentSet) {
      this.playerState.currentIndex = 0;
      this.playerState.isPlaying = false;
      this._stopSpeaking();
      this._clearAllTimeouts();
      this._updatePlayerUI();
      this._playPause(); // Rozpocznij od początku
    }
  }

  /**
   * Pobierz postęp odtwarzania
   * @override
   * @returns {Object} - { current, total, percentage }
   */
  getProgress() {
    const total = this.playerState.currentSet?.content?.length || 0;
    const current = this.playerState.currentIndex + 1;
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

    return { current, total, percentage };
  }

  // ========== PUBLIC API ==========

  /**
   * Pokaż listę zestawów
   */
  async showListeningList() {
    this.log('Showing listening list');

    const listContainer = document.getElementById('listening-list');
    const cardsContainer = document.getElementById('listening-list-cards');
    const loaderElement = document.getElementById('listening-list-loader');
    const errorElement = document.getElementById('listening-list-error');

    if (!listContainer || !cardsContainer) {
      this.error('Listening list elements not found');
      return;
    }

    // Pokaż listę, ukryj player
    listContainer.classList.remove('hidden');
    if (this.elements.listeningPlayer) {
      this.elements.listeningPlayer.classList.add('hidden');
    }

    // Pokaż loader
    if (loaderElement) loaderElement.classList.remove('hidden');
    if (errorElement) errorElement.classList.add('hidden');
    cardsContainer.innerHTML = '';

    try {
      // Pobierz zestawy z dataService
      const sets = await window.dataService.getListeningSets();

      // Ukryj loader
      if (loaderElement) loaderElement.classList.add('hidden');

      if (!sets || sets.length === 0) {
        cardsContainer.innerHTML = `
          <div class="col-span-full text-center py-12 text-gray-400">
            <p class="text-xl mb-2">Brak dostępnych zestawów</p>
            <p class="text-sm">Zaimportuj swoje zestawy lub poczekaj na przykładowe dane</p>
          </div>
        `;
        return;
      }

      // Sprawdź czy użytkownik jest adminem
      const isAdmin = window.sessionManager ? window.sessionManager.isAdmin() : false;

      // Renderuj karty używając CardRenderer
      cardsContainer.innerHTML = sets
        .map(set => {
          // Przekształć dane do formatu zgodnego z CardRenderer
          const cardData = {
            id: set.id,
            title: set.title,
            description: set.description,
            emoji: set.emoji || '🎧',
            isSample: set.is_sample,
            isPublic: set.is_public,
            // Dodatkowe dane dla listening
            pairsCount: set.content ? set.content.length : 0
          };

          return this.cardRenderer.renderCard(cardData, {
            type: 'listening',
            isAdmin: isAdmin,
            onClick: `window.listeningEngine.loadAndStartListening('${set.id}', { autoplay: true })`
          });
        })
        .join('');

      // Dodaj event listenery do przycisków akcji
      this._attachActionButtonListeners(cardsContainer);
    } catch (error) {
      this.error('Failed to load listening sets:', error);

      // Ukryj loader, pokaż błąd
      if (loaderElement) loaderElement.classList.add('hidden');
      if (errorElement) {
        errorElement.textContent = 'Nie udało się załadować zestawów. Spróbuj ponownie.';
        errorElement.classList.remove('hidden');
      }
    }
  }

  /**
   * Załaduj i rozpocznij odtwarzanie zestawu
   * @param {string} setId - ID zestawu
   * @param {Object} options - Opcje odtwarzania
   * @param {boolean} options.autoplay - Czy automatycznie rozpocząć odtwarzanie
   */
  async loadAndStartListening(setId, options = {}) {
    try {
      // Pobierz dane zestawu z dataService
      if (window.dataService && window.dataService.getListeningSet) {
        const setData = await window.dataService.getListeningSet(setId);
        // Domyślnie autoplay: false (zgodnie z polityką przeglądarek)
        // Tylko przy kliknięciu w kartę można użyć autoplay: true
        this.start(setData, setId, { autoplay: options.autoplay || false });
      } else {
        this.error('dataService not available');
      }
    } catch (error) {
      this.error('Failed to load listening set:', error);
    }
  }

  // ========== PRIVATE METHODS ==========

  /**
   * Inicjalizuje elementy DOM
   * @private
   */
  _initDOMElements() {
    this.elements = {
      ...this.elements,
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
  }

  /**
   * Dodaje event listenery
   * @private
   */
  _attachEventListeners() {
    this.elements.btnPlayPause?.addEventListener('click', () => this._playPause());
    this.elements.btnPrevious?.addEventListener('click', () => this._previous());
    this.elements.btnNext?.addEventListener('click', () => this._next());
    this.elements.btnLoop?.addEventListener('click', () => this._toggleLoop());
    this.elements.btnSwitchLang?.addEventListener('click', () => this._switchLanguageOrder());
    this.elements.btnBackToList?.addEventListener('click', () => this._backToList());
    this.elements.btnRestart?.addEventListener('click', () => this._handleRestartClick());
    this.elements.restartConfirm?.addEventListener('click', () => this._handleRestartConfirm());
    this.elements.restartCancel?.addEventListener('click', () => this._handleRestartCancel());

    // Wskazówka o wygaszaniu ekranu
    this.elements.closeScreenTip?.addEventListener('click', () => this._hideScreenTip());
    this.elements.dismissScreenTip?.addEventListener('click', () => this._dismissScreenTip());
  }

  /**
   * Załaduj dostępne głosy TTS
   * @private
   */
  _loadVoices() {
    this.voices = this.playerState.synth.getVoices();

    // Głosy mogą być ładowane asynchronicznie
    if (this.voices.length === 0) {
      this.playerState.synth.addEventListener('voiceschanged', () => {
        this.voices = this.playerState.synth.getVoices();
        this.log(`Loaded ${this.voices.length} voices`);
      });
    } else {
      this.log(`Loaded ${this.voices.length} voices`);
    }
  }

  /**
   * Znajdź najlepszy głos dla języka
   * @private
   * @param {string} langCode - Kod języka (np. 'pl-PL')
   * @returns {SpeechSynthesisVoice|null}
   */
  _findVoiceForLanguage(langCode) {
    if (!this.voices || this.voices.length === 0) {
      return null;
    }

    // Wyciągnij kod języka (np. 'pl' z 'pl-PL')
    const lang = langCode.split('-')[0].toLowerCase();
    const country = langCode.split('-')[1]?.toLowerCase();

    // PRIORYTET: Google głosy są najlepszej jakości i nie ucinają początku

    // Priorytet 1: Google głos z dokładnym kodem języka
    let voice = this.voices.find(
      v =>
        v.name.toLowerCase().includes('google') && v.lang.toLowerCase() === langCode.toLowerCase()
    );
    if (voice) return voice;

    // Priorytet 2: Google głos z tym samym językiem
    voice = this.voices.find(
      v => v.name.toLowerCase().includes('google') && v.lang.toLowerCase().startsWith(lang)
    );
    if (voice) return voice;

    // Priorytet 3: Głos z dokładnym kodem języka i kraju
    voice = this.voices.find(v => v.lang.toLowerCase() === langCode.toLowerCase());
    if (voice) return voice;

    // Priorytet 4: Głos z tym samym językiem i krajem
    if (country) {
      voice = this.voices.find(v => {
        const vLang = v.lang.split('-')[0].toLowerCase();
        const vCountry = v.lang.split('-')[1]?.toLowerCase();
        return vLang === lang && vCountry === country;
      });
      if (voice) return voice;
    }

    // Priorytet 5: Dowolny głos z tym samym językiem
    voice = this.voices.find(v => v.lang.toLowerCase().startsWith(lang));
    if (voice) return voice;

    // Priorytet 6: Głos lokalny dla danego języka
    voice = this.voices.find(v => v.localService && v.lang.toLowerCase().startsWith(lang));
    if (voice) return voice;

    return null;
  }

  /**
   * Normalizuj tekst dla TTS - zapobiega czytaniu wielkich liter jako skrótów
   * @private
   * @param {string} text - Tekst do normalizacji
   * @returns {string} - Znormalizowany tekst
   */
  _normalizeTextForTTS(text) {
    // Zamień wszystkie wielkie litery na lowercase z kapitalizacją
    // To zapobiega czytaniu ESTAR jako E-S-T-A-R

    // Najpierw zamień cały tekst na lowercase
    let normalized = text.toLowerCase();

    // Kapitalizuj pierwszą literę
    if (normalized.length > 0) {
      normalized = normalized.charAt(0).toUpperCase() + normalized.slice(1);
    }

    return normalized;
  }

  /**
   * Mów tekst w danym języku
   * @private
   * @param {string} text - Tekst do wymówienia
   * @param {string} langCode - Kod języka
   * @returns {Promise<void>}
   */
  _speak(text, langCode) {
    return new Promise((resolve, reject) => {
      // Zatrzymaj poprzednie
      this._stopSpeaking();

      // Normalizuj tekst - zapobiega czytaniu wielkich liter jako skrótów (K-O-T -> Kot)
      const normalizedText = this._normalizeTextForTTS(text);

      const utterance = new SpeechSynthesisUtterance(normalizedText);
      utterance.lang = langCode;

      // Znajdź głos dla języka
      const voice = this._findVoiceForLanguage(langCode);
      if (voice) {
        utterance.voice = voice;
      }

      // Ustawienia
      utterance.rate = 0.85; // Wolniej dla lepszego zrozumienia (było 0.9 - za szybko!)
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onend = () => resolve();
      utterance.onerror = error => {
        this.error('Speech error:', error);
        reject(error);
      };

      this.playerState.utterance = utterance;
      this.playerState.synth.speak(utterance);
    });
  }

  /**
   * Zatrzymaj mówienie
   * @private
   */
  _stopSpeaking() {
    if (this.playerState.synth) {
      this.playerState.synth.cancel();
      this.playerState.utterance = null;
    }
  }

  /**
   * Anuluj wszystkie oczekujące timeouty
   * @private
   */
  _clearAllTimeouts() {
    this.playerState.pendingTimeouts.forEach(id => clearTimeout(id));
    this.playerState.pendingTimeouts = [];
  }

  /**
   * Play/Pause toggle
   * @private
   */
  _playPause() {
    if (this.playerState.isPlaying) {
      this.pause();
    } else {
      this.playerState.isPlaying = true;
      this._updatePlayPauseButton();
      this._playCurrentPair();
    }
  }

  /**
   * Odtwórz obecną parę
   * @private
   */
  async _playCurrentPair() {
    if (!this.playerState.isPlaying) return;

    const content = this.playerState.currentSet.content;
    const pair = content[this.playerState.currentIndex];

    if (!pair) {
      // Koniec zestawu
      if (this.playerState.isLooping) {
        this.playerState.currentIndex = 0;
        this._updatePlayerUI();
        this._playCurrentPair();
      } else {
        this.playerState.isPlaying = false;
        this._updatePlayPauseButton();
        this.log('Playback finished');
      }
      return;
    }

    // Update UI
    this._updatePlayerUI();

    try {
      // Odtwórz w odpowiedniej kolejności
      if (this.playerState.langOrder === 'lang1-first') {
        await this._speak(pair[this.playerState.lang1Key], this.playerState.lang1Code);
        await this._pause(this.playerState.pauseBetweenLangs);
        await this._speak(pair[this.playerState.lang2Key], this.playerState.lang2Code);
      } else {
        await this._speak(pair[this.playerState.lang2Key], this.playerState.lang2Code);
        await this._pause(this.playerState.pauseBetweenLangs);
        await this._speak(pair[this.playerState.lang1Key], this.playerState.lang1Code);
      }

      // Pauza między parami
      await this._pause(this.playerState.pauseBetweenPairs);

      // Następna para
      if (this.playerState.isPlaying) {
        this.playerState.currentIndex++;
        this._playCurrentPair();
      }
    } catch (error) {
      this.error('Playback error:', error);
      this.playerState.isPlaying = false;
      this._updatePlayPauseButton();
    }
  }

  /**
   * Pauza (Promise-based)
   * @private
   * @param {number} ms - Milisekundy
   * @returns {Promise<void>}
   */
  _pause(ms) {
    return new Promise(resolve => {
      const timeoutId = setTimeout(resolve, ms);
      this.playerState.pendingTimeouts.push(timeoutId);
    });
  }

  /**
   * Poprzednia para
   * @private
   */
  _previous() {
    this._stopSpeaking();
    this._clearAllTimeouts();

    if (this.playerState.currentIndex > 0) {
      this.playerState.currentIndex--;
    } else {
      this.playerState.currentIndex = this.playerState.currentSet.content.length - 1;
    }

    this._updatePlayerUI();

    if (this.playerState.isPlaying) {
      this._playCurrentPair();
    }
  }

  /**
   * Następna para
   * @private
   */
  _next() {
    this._stopSpeaking();
    this._clearAllTimeouts();

    this.playerState.currentIndex++;

    if (this.playerState.currentIndex >= this.playerState.currentSet.content.length) {
      this.playerState.currentIndex = 0;
    }

    this._updatePlayerUI();

    if (this.playerState.isPlaying) {
      this._playCurrentPair();
    }
  }

  /**
   * Toggle loop
   * @private
   */
  _toggleLoop() {
    this.playerState.isLooping = !this.playerState.isLooping;
    this.elements.btnLoop?.classList.toggle('active', this.playerState.isLooping);
    this.log('Loop:', this.playerState.isLooping);
  }

  /**
   * Zmień kolejność języków
   * @private
   */
  _switchLanguageOrder() {
    this.playerState.langOrder =
      this.playerState.langOrder === 'lang1-first' ? 'lang2-first' : 'lang1-first';

    this._updateLanguageOrderUI();
    this.log('Language order:', this.playerState.langOrder);
  }

  /**
   * Update UI odtwarzacza
   * @private
   */
  _updatePlayerUI() {
    const set = this.playerState.currentSet;
    const pair = set.content[this.playerState.currentIndex];
    const progress = this.getProgress();

    // Tytuł i opis
    this.elements.playerTitle.textContent = set.title;
    this.elements.playerDescription.textContent = set.description || '';

    // Progress
    this.elements.playerProgressText.textContent = `${progress.current} / ${progress.total}`;
    if (this.elements.playerProgress) {
      this.elements.playerProgress.style.width = `${progress.percentage}%`;
    }

    // Obecna para
    if (pair) {
      this.elements.playerLang1Text.textContent = pair[this.playerState.lang1Key];
      this.elements.playerLang2Text.textContent = pair[this.playerState.lang2Key];
    }

    // Kolejność języków
    this._updateLanguageOrderUI();
  }

  /**
   * Update przycisku Play/Pause
   * @private
   */
  _updatePlayPauseButton() {
    if (this.playerState.isPlaying) {
      this.elements.btnPlayIcon?.classList.add('hidden');
      this.elements.btnPauseIcon?.classList.remove('hidden');
    } else {
      this.elements.btnPlayIcon?.classList.remove('hidden');
      this.elements.btnPauseIcon?.classList.add('hidden');
    }
  }

  /**
   * Update UI kolejności języków
   * @private
   */
  _updateLanguageOrderUI() {
    if (this.elements.langOrderText) {
      const lang1 = this.playerState.lang1Key.toUpperCase();
      const lang2 = this.playerState.lang2Key.toUpperCase();

      if (this.playerState.langOrder === 'lang1-first') {
        this.elements.langOrderText.textContent = `${lang1} → ${lang2}`;
      } else {
        this.elements.langOrderText.textContent = `${lang2} → ${lang1}`;
      }
    }
  }

  /**
   * Pokaż odtwarzacz
   * @private
   */
  _showPlayer() {
    this.elements.playerContainer?.classList.remove('hidden');
    this.elements.listeningList?.classList.add('hidden');

    // Pokaż wskazówkę o wygaszaniu ekranu (tylko na mobile)
    if (this._isMobileDevice() && !this._isScreenTipDismissed()) {
      this.elements.screenTimeoutTip?.classList.remove('hidden');
    }
  }

  /**
   * Ukryj odtwarzacz
   * @private
   */
  _hidePlayer() {
    this.elements.playerContainer?.classList.add('hidden');
    this.elements.listeningList?.classList.remove('hidden');
  }

  /**
   * Powrót do listy
   * @private
   */
  _backToList() {
    this.stop();
  }

  /**
   * Handler: Restart button click
   * @private
   */
  _handleRestartClick() {
    this.elements.restartDialog?.classList.remove('hidden');
  }

  /**
   * Handler: Restart confirm
   * @private
   */
  _handleRestartConfirm() {
    this.elements.restartDialog?.classList.add('hidden');
    this.restart();
  }

  /**
   * Handler: Restart cancel
   * @private
   */
  _handleRestartCancel() {
    this.elements.restartDialog?.classList.add('hidden');
  }

  /**
   * Ukryj wskazówkę o wygaszaniu ekranu
   * @private
   */
  _hideScreenTip() {
    this.elements.screenTimeoutTip?.classList.add('hidden');
  }

  /**
   * Odrzuć wskazówkę (zapisz w localStorage)
   * @private
   */
  _dismissScreenTip() {
    localStorage.setItem('listeningScreenTipDismissed', 'true');
    this._hideScreenTip();
  }

  /**
   * Sprawdź czy wskazówka została odrzucona
   * @private
   * @returns {boolean}
   */
  _isScreenTipDismissed() {
    return localStorage.getItem('listeningScreenTipDismissed') === 'true';
  }

  /**
   * Setup screen timeout tip (hide on desktop)
   * @private
   */
  _setupScreenTimeoutTip() {
    const screenTip = document.getElementById('screen-timeout-tip');

    if (!screenTip) {
      return;
    }

    // Ukryj wskazówkę na desktopie (nie dotyczy)
    if (!this._isMobileDevice()) {
      screenTip.classList.add('hidden');
      return;
    }

    // Sprawdź czy użytkownik już ukrył wskazówkę
    if (localStorage.getItem('listeningScreenTipDismissed') === 'true') {
      screenTip.classList.add('hidden');
      return;
    }

    // Przycisk "Rozumiem, nie pokazuj więcej"
    const dismissBtn = document.getElementById('dismiss-screen-tip');
    dismissBtn?.addEventListener('click', () => {
      screenTip.classList.add('hidden');
      localStorage.setItem('listeningScreenTipDismissed', 'true');
    });
  }

  /**
   * Sprawdź czy urządzenie mobilne
   * @private
   * @returns {boolean}
   */
  _isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  /**
   * Dodaje event listenery do przycisków akcji
   * @param {HTMLElement} container - Kontener z kartami
   * @private
   */
  _attachActionButtonListeners(container) {
    // Share button
    container.querySelectorAll('.share-btn').forEach(btn => {
      btn.addEventListener('click', async e => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        if (btn.disabled) return false;
        const id = btn.dataset.id;
        const title = btn.dataset.title;
        const type = btn.dataset.type || 'listening';
        btn.disabled = true;
        btn.style.opacity = '0.5';
        try {
          if (window.contentManager && window.contentManager.copyShareLink) {
            await window.contentManager.copyShareLink(type, id, title);
          }
        } finally {
          btn.disabled = false;
          btn.style.opacity = '1';
        }
        return false;
      });
    });

    // Export button
    container.querySelectorAll('.export-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        const id = btn.dataset.id;
        if (window.contentManager && window.contentManager.exportContent) {
          const state = this.appState ? this.appState.getState() : window.getAppState();
          const elements = window.elements || {};
          window.contentManager.exportContent(id, state, elements);
        }
        return false;
      });
    });

    // Delete button
    container.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        const id = btn.dataset.id;
        const title = btn.dataset.title;
        if (window.contentManager && window.contentManager.confirmDelete) {
          const elements = window.elements || {};
          window.contentManager.confirmDelete(id, title, elements);
        }
        return false;
      });
    });

    // Toggle public button
    container.querySelectorAll('.toggle-public-btn').forEach(btn => {
      btn.addEventListener('click', async e => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        const id = btn.dataset.id;
        const title = btn.dataset.title;
        const currentIsPublic = btn.dataset.isPublic === 'true';
        const newIsPublic = !currentIsPublic;
        if (window.contentManager && window.contentManager.togglePublicStatus) {
          const state = this.appState ? this.appState.getState() : window.getAppState();
          const elements = window.elements || {};
          const uiManager = window.uiManager;
          const sessionManager = window.sessionManager;
          await window.contentManager.togglePublicStatus(
            id,
            newIsPublic,
            title,
            state,
            elements,
            uiManager,
            sessionManager
          );
        }
        return false;
      });
    });
  }
}

// ========== BACKWARD COMPATIBILITY FACADE ==========
// TODO-PHASE-6: Facade functions dla IIFE modules (app.js, ui-manager.js)
// Zostanie usunięte po konwersji tych plików do ES6 modules

let listeningEngineInstance = null;

/**
 * Inicjalizuje silnik listening (backward compatibility)
 * @param {Function} navigateFn - Funkcja nawigacji
 * @param {Object} state - Stan aplikacji
 * @returns {ListeningEngine}
 */
export function initListeningEngine(navigateFn, state) {
  const elements = {}; // Elementy będą pobrane w init()
  listeningEngineInstance = new ListeningEngine(elements, navigateFn, state);
  listeningEngineInstance.init();
  return listeningEngineInstance;
}

/**
 * Pokaż listę zestawów (backward compatibility)
 */
export function showListeningList() {
  if (listeningEngineInstance) {
    listeningEngineInstance.showListeningList();
  }
}

/**
 * Pobiera instancję silnika listening (backward compatibility)
 * @returns {ListeningEngine|null}
 */
export function getListeningEngineInstance() {
  return listeningEngineInstance;
}

console.log('✅ ListeningEngine (ES6 Class) loaded');
// BUILD: 1762868366
