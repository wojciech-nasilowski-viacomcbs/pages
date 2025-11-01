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
 * Speaks text using Web Speech API text-to-speech
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

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

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

console.log('✅ Audio module initialized');
