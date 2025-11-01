/**
 * @fileoverview Screen Wake Lock API - zapobiega wygaszaniu ekranu
 * Uniwersalny moduł zarządzający blokadą ekranu dla różnych aktywności.
 * 
 * UWAGA: Wake Lock API nie zawsze działa na urządzeniach mobilnych,
 * szczególnie z Web Speech API (TTS). Użytkownik powinien zmienić
 * ustawienia telefonu (Wygaszanie ekranu → 10 minut).
 * 
 * @module wake-lock
 */

/**
 * @typedef {Object} WakeLockManager
 * @property {function(string): Promise<void>} addReference
 * @property {function(string): Promise<void>} removeReference
 * @property {function(): boolean} isSupported
 * @property {function(string): boolean} hasReference
 * @property {function(): number} getReferenceCount
 * @property {function(): string[]} getActiveSources
 * @property {function(): Promise<void>} reacquire
 * @property {function(): boolean} openAndroidDisplaySettings
 * @property {function(): Promise<void>} acquire
 * @property {function(): Promise<void>} release
 */

(function(window) {
  'use strict';

  /** @type {WakeLockSentinel | null} */
  let wakeLock = null;
  
  /** @type {Set<string>} - Zbiór aktywnych źródeł wymagających blokady */
  const activeReferences = new Set();

  /**
   * Sprawdza, czy API Wake Lock jest obsługiwane przez przeglądarkę
   * @returns {boolean}
   */
  function isSupported() {
    return 'wakeLock' in navigator;
  }

  /**
   * Otwiera ustawienia systemowe Androida (wyświetlacz/wygaszanie ekranu)
   * Działa tylko na urządzeniach Android w przeglądarkach obsługujących Intent URLs
   * @returns {boolean} - true jeśli udało się otworzyć ustawienia, false w przeciwnym razie
   */
  function openAndroidDisplaySettings() {
    // Sprawdź czy to Android
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    if (!isAndroid) {
      console.log('⚠️ Not an Android device');
      return false;
    }

    try {
      // Próbuj otworzyć ustawienia wyświetlacza
      // Intent URL dla ustawień wyświetlacza Androida
      const intentUrl = 'intent://settings/display#Intent;scheme=android.settings;end';
      
      // Alternatywnie można użyć:
      // - 'android.settings.DISPLAY_SETTINGS' - ustawienia wyświetlacza
      // - 'android.settings.SETTINGS' - główne ustawienia
      
      window.location.href = intentUrl;
      console.log('✅ Opening Android display settings');
      return true;
    } catch (err) {
      console.error('❌ Failed to open Android settings:', err);
      return false;
    }
  }


  /**
   * Wewnętrzna funkcja aktywująca blokadę ekranu
   * @returns {Promise<void>}
   * @private
   */
  async function _acquireWakeLock() {
    if (!isSupported()) {
      console.log('⚠️ Wake Lock API not supported');
      return;
    }

    if (wakeLock !== null) {
      // Blokada już aktywna
      return;
    }

    try {
      wakeLock = await navigator.wakeLock.request('screen');
      console.log('✅ Wake Lock acquired');

      wakeLock.addEventListener('release', () => {
        console.log('🔓 Wake Lock released');
        wakeLock = null;
      });
      
    } catch (err) {
      console.error(`❌ Wake Lock error: ${err.name}, ${err.message}`);
    }
  }

  /**
   * Wewnętrzna funkcja zwalniająca blokadę ekranu
   * @returns {Promise<void>}
   * @private
   */
  async function _releaseWakeLock() {
    if (wakeLock !== null) {
      try {
        await wakeLock.release();
        wakeLock = null;
      } catch (err) {
        console.error(`❌ Wake Lock release error: ${err.name}, ${err.message}`);
      }
    }
  }

  /**
   * Dodaje referencję do blokady ekranu
   * Jeśli to pierwsza referencja, aktywuje blokadę
   * 
   * @param {string} source - Identyfikator źródła (np. 'workout', 'listening', 'quiz')
   * @returns {Promise<void>}
   * 
   * @example
   * await wakeLockManager.addReference('workout');
   */
  async function addReference(source) {
    if (!source) {
      console.warn('⚠️ Wake Lock: source identifier required');
      return;
    }

    activeReferences.add(source);
    console.log(`🔒 Wake Lock reference added: ${source} (total: ${activeReferences.size})`);

    // Aktywuj blokadę jeśli to pierwsza referencja
    if (activeReferences.size === 1) {
      await _acquireWakeLock();
    }
  }

  /**
   * Usuwa referencję do blokady ekranu
   * Jeśli to ostatnia referencja, zwalnia blokadę
   * 
   * @param {string} source - Identyfikator źródła (np. 'workout', 'listening', 'quiz')
   * @returns {Promise<void>}
   * 
   * @example
   * await wakeLockManager.removeReference('workout');
   */
  async function removeReference(source) {
    if (!source) {
      console.warn('⚠️ Wake Lock: source identifier required');
      return;
    }

    const wasPresent = activeReferences.delete(source);
    if (wasPresent) {
      console.log(`🔓 Wake Lock reference removed: ${source} (remaining: ${activeReferences.size})`);
    }

    // Zwolnij blokadę jeśli nie ma więcej referencji
    if (activeReferences.size === 0) {
      await _releaseWakeLock();
    }
  }

  /**
   * Sprawdza czy dana aktywność ma aktywną referencję
   * @param {string} source - Identyfikator źródła
   * @returns {boolean}
   */
  function hasReference(source) {
    return activeReferences.has(source);
  }

  /**
   * Pobiera liczbę aktywnych referencji
   * @returns {number}
   */
  function getReferenceCount() {
    return activeReferences.size;
  }

  /**
   * Pobiera listę aktywnych źródeł
   * @returns {string[]}
   */
  function getActiveSources() {
    return Array.from(activeReferences);
  }

  /**
   * Wymusza ponowne aktywowanie blokady jeśli są aktywne referencje
   * Używane gdy dokument staje się ponownie widoczny
   * @returns {Promise<void>}
   */
  async function reacquire() {
    if (activeReferences.size > 0 && wakeLock === null) {
      console.log('🔄 Reacquiring Wake Lock...');
      await _acquireWakeLock();
    }
  }
  
  /**
   * Obsługuje zmianę widoczności dokumentu
   * Ponownie aktywuje blokadę gdy użytkownik wraca do karty
   */
  async function handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      await reacquire();
    }
  }
  
  // Nasłuchuj zmiany widoczności
  document.addEventListener('visibilitychange', handleVisibilityChange);
  document.addEventListener('fullscreenchange', handleVisibilityChange);

  // Expose to global scope
  /** @type {WakeLockManager} */
  const manager = {
    // Główne API
    addReference,
    removeReference,
    
    // Gettery
    isSupported,
    hasReference,
    getReferenceCount,
    getActiveSources,
    
    // Utility
    reacquire,
    openAndroidDisplaySettings,
    
    // Legacy API (dla kompatybilności wstecznej)
    acquire: () => addReference('legacy'),
    release: () => removeReference('legacy')
  };

  // @ts-ignore - Dodajemy do window
  window.wakeLockManager = manager;

  console.log('✅ Wake Lock Manager initialized');

})(window);
