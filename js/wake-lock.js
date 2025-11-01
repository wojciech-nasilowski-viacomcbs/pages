/**
 * @fileoverview Screen Wake Lock API - zapobiega wygaszaniu ekranu
 * Uniwersalny moduł zarządzający blokadą ekranu dla różnych aktywności
 * (treningi, nauka ze słuchu, quizy itp.)
 * 
 * Używa systemu referencji - blokada jest aktywna dopóki przynajmniej
 * jedna aktywność jej potrzebuje.
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
 * @property {function(): Promise<void>} acquire
 * @property {function(): Promise<void>} release
 */

(function(window) {
  'use strict';

  /** @type {WakeLockSentinel | null} */
  let wakeLock = null;
  
  /** @type {Set<string>} - Zbiór aktywnych źródeł wymagających blokady */
  const activeReferences = new Set();
  
  /** @type {HTMLVideoElement | null} - Ukryte wideo jako fallback dla iOS */
  let dummyVideo = null;
  
  /** @type {ReturnType<typeof setInterval> | null} - Interval ID dla keepalive */
  let keepaliveInterval = null;

  /**
   * Sprawdza, czy API Wake Lock jest obsługiwane przez przeglądarkę
   * @returns {boolean}
   */
  function isSupported() {
    return 'wakeLock' in navigator;
  }

  /**
   * Tworzy ukryte wideo jako fallback (dla starszych urządzeń/przeglądarek)
   * @private
   */
  function _createDummyVideo() {
    if (dummyVideo) return;
    
    try {
      dummyVideo = document.createElement('video');
      dummyVideo.setAttribute('playsinline', '');
      dummyVideo.setAttribute('muted', '');
      dummyVideo.setAttribute('loop', '');
      dummyVideo.style.position = 'fixed';
      dummyVideo.style.opacity = '0.01'; // Prawie niewidoczne, ale nie 0
      dummyVideo.style.width = '1px';
      dummyVideo.style.height = '1px';
      dummyVideo.style.bottom = '0';
      dummyVideo.style.right = '0';
      dummyVideo.style.pointerEvents = 'none';
      dummyVideo.style.zIndex = '-1000';
      
      // Bardzo krótkie, ciche wideo w formacie data URL (1 sekunda ciszy)
      dummyVideo.src = 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAu1tZGF0AAACrQYF//+p3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE1NSByMjkwMSA3ZDBmZjIyIC0gSC4yNjQvTVBFRy00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMtMjAxOCAtIGh0dHA6Ly93d3cudmlkZW9sYW4ub3JnL3gyNjQuaHRtbCAtIG9wdGlvbnM6IGNhYmFjPTEgcmVmPTMgZGVibG9jaz0xOjA6MCBhbmFseXNlPTB4MzoweDExMyBtZT1oZXggc3VibWU9NyBwc3k9MSBwc3lfcmQ9MS4wMDowLjAwIG1peGVkX3JlZj0xIG1lX3JhbmdlPTE2IGNocm9tYV9tZT0xIHRyZWxsaXM9MSA4eDhkY3Q9MSBjcW09MCBkZWFkem9uZT0yMSwxMSBmYXN0X3Bza2lwPTEgY2hyb21hX3FwX29mZnNldD0tMiB0aHJlYWRzPTEgbG9va2FoZWFkX3RocmVhZHM9MSBzbGljZWRfdGhyZWFkcz0wIG5yPTAgZGVjaW1hdGU9MSBpbnRlcmxhY2VkPTAgYmx1cmF5X2NvbXBhdD0wIGNvbnN0cmFpbmVkX2ludHJhPTAgYmZyYW1lcz0zIGJfcHlyYW1pZD0yIGJfYWRhcHQ9MSBiX2JpYXM9MCBkaXJlY3Q9MSB3ZWlnaHRiPTEgb3Blbl9nb3A9MCB3ZWlnaHRwPTIga2V5aW50PTI1MCBrZXlpbnRfbWluPTEgc2NlbmVjdXQ9NDAgaW50cmFfcmVmcmVzaD0wIHJjX2xvb2thaGVhZD00MCByYz1jcmYgbWJ0cmVlPTEgY3JmPTIzLjAgcWNvbXA9MC42MCBxcG1pbj0wIHFwbWF4PTY5IHFwc3RlcD00IGlwX3JhdGlvPTEuNDAgYXE9MToxLjAwAIAAAAAwZYiEAD//8m+P5OXfBeLGOf/+VqoAK4APADgDgB8A8AeAPAHgDwB4A8AeAPAHgDwB4A8AAAADSG1vb3YAAABsbXZoZAAAAAAAAAAAAAAAAAAAA+gAAAPoAAEAAAEAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAIUdHJhawAAAFx0a2hkAAAAAwAAAAAAAAAAAAAAAQAAAAAAAAPoAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAACgAAAAWgAAAAAAJGVkdHMAAAAcZWxzdAAAAAAAAAABAAAD6AAAAAAAAQAAAAABjG1kaWEAAAAgbWRoZAAAAAAAAAAAAAAAAAAAKAAAACgAVcQAAAAAAC1oZGxyAAAAAAAAAAB2aWRlAAAAAAAAAAAAAAAAVmlkZW9IYW5kbGVyAAAAAT';
      
      document.body.appendChild(dummyVideo);
      console.log('📹 Dummy video created as fallback');
    } catch (err) {
      console.warn('⚠️ Could not create dummy video:', err);
    }
  }
  
  /**
   * Usuwa ukryte wideo
   * @private
   */
  function _removeDummyVideo() {
    if (dummyVideo) {
      try {
        dummyVideo.pause();
        dummyVideo.remove();
        dummyVideo = null;
        console.log('📹 Dummy video removed');
      } catch (err) {
        console.warn('⚠️ Error removing dummy video:', err);
      }
    }
  }
  
  /**
   * Uruchamia keepalive interval (dodatkowa ochrona)
   * @private
   */
  function _startKeepalive() {
    if (keepaliveInterval) return;
    
    // Co 10 sekund wykonuj małą operację aby utrzymać aktywność
    keepaliveInterval = setInterval(() => {
      if (activeReferences.size > 0) {
        // Małe "ping" - wymuś reflow
        document.body.offsetHeight;
        
        // Jeśli mamy dummy video, upewnij się że gra
        if (dummyVideo && dummyVideo.paused) {
          dummyVideo.play().catch(() => {});
        }
        
        console.log('💓 Keepalive ping (active sources:', activeReferences.size, ')');
      }
    }, 10000); // Co 10 sekund
    
    console.log('💓 Keepalive started');
  }
  
  /**
   * Zatrzymuje keepalive interval
   * @private
   */
  function _stopKeepalive() {
    if (keepaliveInterval) {
      clearInterval(keepaliveInterval);
      keepaliveInterval = null;
      console.log('💓 Keepalive stopped');
    }
  }

  /**
   * Wewnętrzna funkcja aktywująca blokadę ekranu
   * @returns {Promise<void>}
   * @private
   */
  async function _acquireWakeLock() {
    if (!isSupported()) {
      console.log('⚠️ Wake Lock API not supported - using fallback methods');
      // Nawet jeśli Wake Lock nie jest wspierane, użyj fallbacków
      _createDummyVideo();
      if (dummyVideo) {
        await dummyVideo.play().catch(() => {});
      }
      _startKeepalive();
      return;
    }

    if (wakeLock !== null) {
      // Blokada już aktywna
      return;
    }

    try {
      wakeLock = await navigator.wakeLock.request('screen');
      console.log('✅ Wake Lock acquired - screen will stay on');

      wakeLock.addEventListener('release', () => {
        console.log('🔓 Wake Lock released (possibly by system)');
        wakeLock = null;
        
        // Jeśli nadal są aktywne referencje, spróbuj ponownie
        if (activeReferences.size > 0) {
          console.log('🔄 Attempting to reacquire Wake Lock...');
          setTimeout(() => _acquireWakeLock(), 100);
        }
      });
      
      // Dodatkowe zabezpieczenia dla Androida
      _createDummyVideo();
      if (dummyVideo) {
        await dummyVideo.play().catch(() => {});
      }
      _startKeepalive();
      
    } catch (err) {
      console.error(`❌ Wake Lock error: ${err.name}, ${err.message}`);
      console.log('⚠️ Falling back to alternative methods');
      
      // Fallback - użyj dummy video i keepalive
      _createDummyVideo();
      if (dummyVideo) {
        await dummyVideo.play().catch(() => {});
      }
      _startKeepalive();
    }
  }

  /**
   * Wewnętrzna funkcja zwalniająca blokadę ekranu
   * @returns {Promise<void>}
   * @private
   */
  async function _releaseWakeLock() {
    // Zwolnij Wake Lock API
    if (wakeLock !== null) {
      try {
        await wakeLock.release();
        wakeLock = null;
      } catch (err) {
        console.error(`❌ Wake Lock release error: ${err.name}, ${err.message}`);
      }
    }
    
    // Zatrzymaj fallbacki
    _stopKeepalive();
    _removeDummyVideo();
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
    
    // Legacy API (dla kompatybilności wstecznej)
    acquire: () => addReference('legacy'),
    release: () => removeReference('legacy')
  };

  // @ts-ignore - Dodajemy do window
  window.wakeLockManager = manager;

  console.log('✅ Wake Lock Manager initialized');

})(window);
