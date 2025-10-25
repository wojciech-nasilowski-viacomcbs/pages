/**
 * Moduł do generowania dźwięków za pomocą Web Audio API
 */

let audioContext = null;
let isMuted = false;

/**
 * Inicjalizuje AudioContext (lazy loading)
 */
function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

/**
 * Generuje ton o określonej częstotliwości i czasie trwania
 */
function playTone(frequency, duration, type = 'sine') {
  if (isMuted) return;
  
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    
    // Envelope (fade in/out dla gładszego dźwięku)
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (error) {
    console.warn('Nie udało się odtworzyć dźwięku:', error);
  }
}

/**
 * Dźwięk dla poprawnej odpowiedzi
 * Przyjemny, rosnący ton
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
 * Dźwięk dla błędnej odpowiedzi
 * Krótki, niski "buzz"
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
 * Dźwięk na koniec timera
 * Dwa krótkie sygnały "bip-bip"
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
 * Przełącza wyciszenie dźwięków
 */
export function toggleMute() {
  isMuted = !isMuted;
  return isMuted;
}

/**
 * Sprawdza, czy dźwięki są wyciszone
 */
export function isSoundMuted() {
  return isMuted;
}

/**
 * Ustawia stan wyciszenia
 */
export function setMuted(muted) {
  isMuted = muted;
}

// ============================================
// Text-to-Speech (TTS) - Web Speech API
// ============================================

/**
 * Odtwarza tekst za pomocą syntezatora mowy
 * @param {string} text - Tekst do wypowiedzenia
 * @param {string} lang - Kod języka (np. 'en-US', 'es-ES', 'pl-PL')
 * @param {number} rate - Prędkość mowy (0.1 - 10, domyślnie 0.85 dla nauki)
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
    utterance.onerror = (event) => {
      console.warn('Błąd TTS:', event.error);
    };
    
    speechSynthesis.speak(utterance);
  } catch (error) {
    console.warn('Nie udało się odtworzyć tekstu:', error);
  }
}

/**
 * Zatrzymuje bieżące odtwarzanie TTS
 */
export function stopSpeaking() {
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel();
  }
}

/**
 * Sprawdza, czy TTS jest dostępne w przeglądarce
 */
export function isTTSAvailable() {
  return 'speechSynthesis' in window;
}

/**
 * Pobiera listę dostępnych głosów dla danego języka
 * @param {string} lang - Kod języka (np. 'en', 'es', 'pl')
 * @returns {Array} Tablica dostępnych głosów
 */
export function getAvailableVoices(lang = null) {
  if (!isTTSAvailable()) return [];
  
  const voices = speechSynthesis.getVoices();
  
  if (lang) {
    return voices.filter(voice => voice.lang.startsWith(lang));
  }
  
  return voices;
}

