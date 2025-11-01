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

/** @type {WakeLockSentinel | null} */
let wakeLock = null;

/** @type {Set<string>} - Zbiór aktywnych źródeł wymagających blokady */
const activeReferences = new Set();

/**
 * Sprawdza, czy API Wake Lock jest obsługiwane przez przeglądarkę
 * @returns {boolean}
 */
export function isSupported() {
  return 'wakeLock' in navigator;
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
export async function addReference(source) {
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
export async function removeReference(source) {
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
export function hasReference(source) {
  return activeReferences.has(source);
}

/**
 * Pobiera liczbę aktywnych referencji
 * @returns {number}
 */
export function getReferenceCount() {
  return activeReferences.size;
}

/**
 * Pobiera listę aktywnych źródeł
 * @returns {string[]}
 */
export function getActiveSources() {
  return Array.from(activeReferences);
}

/**
 * Wymusza ponowne aktywowanie blokady jeśli są aktywne referencje
 * Używane gdy dokument staje się ponownie widoczny
 * @returns {Promise<void>}
 */
export async function reacquire() {
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

// Legacy API (dla kompatybilności wstecznej)
export const acquire = () => addReference('legacy');
export const release = () => removeReference('legacy');

// Export default object for backward compatibility
export default {
  addReference,
  removeReference,
  isSupported,
  hasReference,
  getReferenceCount,
  getActiveSources,
  reacquire,
  acquire,
  release
};

console.log('✅ Wake Lock Manager initialized');
