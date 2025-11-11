/**
 * @fileoverview Audio module for sound effects and text-to-speech
 * Provides Web Audio API sound generation and Web Speech API TTS functionality
 * @module audio
 */

/** @typedef {import('./types.js').TTSOptions} TTSOptions */
/** @typedef {import('./types.js').AudioConfig} AudioConfig */

/**
 * Audio context instance (lazy loaded)
 * @type {AudioContext|null}
 */
let audioContext = null;

/**
 * Global mute state
 * @type {boolean}
 */
let isMuted = false;

/**
 * Initializes and returns the AudioContext (lazy loading)
 * @returns {AudioContext} Audio context instance
 * @private
 */
function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

/**
 * Plays a sound for correct answer
 * Pleasant, rising tone (C5 to E5)
 * @example
 * playCorrectSound();
 */
export function playCorrectSound() {
  if (isMuted) return;

  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';

    // Rosnący ton: 523 Hz (C5) -> 659 Hz (E5)
    oscillator.frequency.setValueAtTime(523, ctx.currentTime);
    oscillator.frequency.linearRampToValueAtTime(659, ctx.currentTime + 0.15);

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.15);
  } catch (error) {
    console.warn('Nie udało się odtworzyć dźwięku poprawnej odpowiedzi:', error);
  }
}

/**
 * Plays a sound for incorrect answer
 * Short, low "buzz" sound
 * @example
 * playIncorrectSound();
 */
export function playIncorrectSound() {
  if (isMuted) return;

  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sawtooth';
    oscillator.frequency.value = 200; // Niski ton

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.2);
  } catch (error) {
    console.warn('Nie udało się odtworzyć dźwięku błędnej odpowiedzi:', error);
  }
}

/**
 * Plays a sound when timer ends
 * Two short "beep-beep" signals with optional vibration
 * @example
 * playTimerEndSound();
 */
export function playTimerEndSound() {
  if (isMuted) return;

  try {
    const ctx = getAudioContext();

    // Pierwszy "bip"
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.frequency.value = 800;
    gain1.gain.setValueAtTime(0.3, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.1);

    // Drugi "bip" (po krótkiej przerwie)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.frequency.value = 800;
    gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    osc2.start(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 0.25);

    // Wibracja (jeśli dostępna)
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
  } catch (error) {
    console.warn('Nie udało się odtworzyć dźwięku końca timera:', error);
  }
}

/**
 * Toggles sound mute state
 * @returns {boolean} New mute state (true = muted)
 * @example
 * const muted = toggleMute();
 * console.log('Sound is', muted ? 'muted' : 'unmuted');
 */
export function toggleMute() {
  isMuted = !isMuted;
  return isMuted;
}

/**
 * Checks if sounds are muted
 * @returns {boolean} True if muted
 * @example
 * if (isSoundMuted()) {
 *   console.log('Sounds are muted');
 * }
 */
export function isSoundMuted() {
  return isMuted;
}

/**
 * Sets the mute state
 * @param {boolean} muted - True to mute, false to unmute
 * @example
 * setMuted(true); // Mute all sounds
 */
export function setMuted(muted) {
  isMuted = muted;
}

// ============================================
// Text-to-Speech (TTS) - Web Speech API
// ============================================

/**
 * Normalizuje tekst dla TTS - zapobiega czytaniu wielkich liter jako skrótów
 * Przykład: "ESTAR" → "Estar" (zamiast "E-S-T-A-R")
 * @param {string} text - Tekst do normalizacji
 * @returns {string} Znormalizowany tekst
 * @private
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

  return normalized;
}

/**
 * Speaks text using Web Speech API text-to-speech
 * IMPROVED: Normalizuje tekst przed odtworzeniem dla lepszej wymowy
 * @param {string} text - Text to speak
 * @param {string} [lang='en-US'] - Language code (e.g., 'en-US', 'es-ES', 'pl-PL')
 * @param {number} [rate=0.85] - Speech rate (0.1 - 10, default 0.85 for learning)
 * @example
 * speakText('Hello world', 'en-US');
 * speakText('Hola mundo', 'es-ES', 0.7); // Slower for learning
 */
export function speakText(text, lang = 'en-US', rate = 0.85) {
  if (isMuted) return;

  if (!('speechSynthesis' in window)) {
    console.warn('Web Speech API nie jest wspierane w tej przeglądarce');
    return;
  }

  try {
    // Zatrzymaj poprzednie odtwarzanie
    stopSpeaking();

    // WAŻNE: Normalizuj tekst - zapobiega czytaniu wielkich liter jako skrótów
    const normalizedText = normalizeTextForTTS(text);

    const utterance = new SpeechSynthesisUtterance(normalizedText);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Znajdź najlepszy głos dla języka
    const voices = speechSynthesis.getVoices();
    const preferredVoice = findBestVoiceForLanguage(voices, lang);
    if (preferredVoice) {
      utterance.voice = preferredVoice;
      console.log(`🔊 TTS using voice: ${preferredVoice.name} (${preferredVoice.lang})`);
    } else {
      console.warn(`⚠️ No voice found for language: ${lang}`);
    }

    // Obsługa błędów
    utterance.onerror = event => {
      console.warn('Błąd TTS:', event.error);
    };

    speechSynthesis.speak(utterance);
  } catch (error) {
    console.warn('Nie udało się odtworzyć tekstu:', error);
  }
}

/**
 * Finds the best voice for a given language
 * IMPROVED: Priorytetowo wybiera głosy Google (najwyższa jakość)
 * @param {SpeechSynthesisVoice[]} voices - Available voices
 * @param {string} langCode - Language code (e.g., 'es-ES', 'pl-PL')
 * @returns {SpeechSynthesisVoice|null} Best matching voice or null
 * @private
 */
function findBestVoiceForLanguage(voices, langCode) {
  if (!voices || voices.length === 0) return null;

  // Wyciągnij kod języka (np. 'pl' z 'pl-PL')
  const lang = langCode.split('-')[0].toLowerCase();
  const country = langCode.split('-')[1]?.toLowerCase();

  // PRIORYTET: Google głosy są najlepszej jakości i nie ucinają początku

  // Priorytet 1: Google głos z dokładnym kodem języka
  let voice = voices.find(
    v => v.name.toLowerCase().includes('google') && v.lang.toLowerCase() === langCode.toLowerCase()
  );
  if (voice) return voice;

  // Priorytet 2: Google głos z tym samym językiem
  voice = voices.find(
    v => v.name.toLowerCase().includes('google') && v.lang.toLowerCase().startsWith(lang)
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

  // Priorytet 7: Pierwszy dostępny głos
  return voices[0];
}

/**
 * Stops current TTS playback
 * @example
 * stopSpeaking();
 */
export function stopSpeaking() {
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel();
  }
}

/**
 * Checks if TTS is available in the browser
 * @returns {boolean} True if Web Speech API is supported
 * @example
 * if (isTTSAvailable()) {
 *   speakText('Hello', 'en-US');
 * }
 */
export function isTTSAvailable() {
  return 'speechSynthesis' in window;
}

/**
 * Gets available voices for a specific language
 * @param {string|null} [lang=null] - Language code prefix (e.g., 'en', 'es', 'pl'), or null for all voices
 * @returns {SpeechSynthesisVoice[]} Array of available voices
 * @example
 * const englishVoices = getAvailableVoices('en');
 * const allVoices = getAvailableVoices();
 */
export function getAvailableVoices(lang = null) {
  if (!isTTSAvailable()) return [];

  const voices = speechSynthesis.getVoices();

  if (lang) {
    return voices.filter(voice => voice.lang.startsWith(lang));
  }

  return voices;
}

/**
 * Inicjalizuje i "rozgrzewa" Web Audio API.
 * Musi być wywołane w odpowiedzi na interakcję użytkownika (np. kliknięcie).
 * @returns {Promise<void>}
 */
export async function initAudio() {
  try {
    const ctx = getAudioContext();
    // Chrome wymaga, aby resume() było wywołane po interakcji użytkownika
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    // Odtwórz pusty bufor, aby "obudzić" system audio
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
    console.log('🔊 AudioContext rozgrzany i gotowy.');
  } catch (error) {
    console.warn('Nie udało się zainicjalizować AudioContext:', error);
  }
}

// TODO-PHASE-6: Backward compatibility dla quiz-engine.js (IIFE)
if (typeof window !== 'undefined') {
  window.speakText = speakText;
  window.playCorrectSound = playCorrectSound;
  window.playIncorrectSound = playIncorrectSound;
  window.playTimerEndSound = playTimerEndSound;
}

console.log('✅ Audio module initialized');
// BUILD: 1731349500 - FINAL FIX
