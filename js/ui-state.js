/**
 * @fileoverview UI State Manager - centralne zarządzanie stanem interfejsu użytkownika
 * Zarządza widocznością ekranów, tab bara i innych elementów UI
 * @module ui-state
 */

import { createStore } from './state-manager.js';

/**
 * Typy ekranów w aplikacji
 * @typedef {'main'|'quiz'|'quiz-summary'|'workout'|'workout-end'|'listening'|'more'|'loading'} ScreenType
 */

/**
 * Stan UI aplikacji
 * @typedef {Object} UIState
 * @property {ScreenType} currentScreen - Aktualnie wyświetlany ekran
 * @property {string} currentTab - Aktywna zakładka ('workouts', 'knowledge-base', 'quizzes', 'listening', 'more')
 * @property {boolean} isActivity - Czy trwa aktywność (quiz/trening/słuchanie)
 * @property {boolean} showTabBar - Czy pokazywać dolny pasek nawigacji
 * @property {boolean} isListeningPlayerActive - Czy odtwarzacz słuchania jest aktywny
 */

// Przywróć ostatnią aktywną zakładkę z localStorage lub użyj domyślnej
let initialTab = 'workouts'; // Domyślna zakładka
try {
  const lastTab = localStorage.getItem('lastActiveTab');
  if (lastTab && ['workouts', 'knowledge-base', 'quizzes', 'listening', 'more'].includes(lastTab)) {
    initialTab = lastTab;
  }
} catch (e) {
  console.warn('Nie można odczytać zakładki z localStorage:', e);
}

// Inicjalizacja store
const uiStore = createStore({
  currentScreen: 'loading',
  currentTab: initialTab,
  isActivity: false,
  showTabBar: true,
  isListeningPlayerActive: false
});

/**
 * Automatyczna synchronizacja tab bara z stanem
 */
uiStore.subscribe((state, prevState) => {
  // Synchronizuj widoczność tab bara tylko jeśli się zmieniła
  if (state.showTabBar !== prevState.showTabBar) {
    const tabBar = document.getElementById('tab-bar');
    if (tabBar) {
      if (state.showTabBar) {
        tabBar.classList.remove('hidden');
      } else {
        tabBar.classList.add('hidden');
      }
    }
  }

  // Debug log (można wyłączyć w produkcji)
  if (
    state.currentScreen !== prevState.currentScreen ||
    state.isActivity !== prevState.isActivity
  ) {
    console.log('🎨 UI State:', {
      screen: state.currentScreen,
      isActivity: state.isActivity,
      showTabBar: state.showTabBar
    });
  }
});

/**
 * Zarządzanie blokadą ekranu (Wake Lock) w zależności od stanu odtwarzacza
 */
uiStore.subscribe(async (state, prevState) => {
  if (state.isListeningPlayerActive !== prevState.isListeningPlayerActive) {
    if (window.wakeLockManager && window.wakeLockManager.isSupported()) {
      if (state.isListeningPlayerActive) {
        await window.wakeLockManager.addReference('listening');
      } else {
        await window.wakeLockManager.removeReference('listening');
      }
    }
  }
});

/**
 * Określa czy dany ekran to aktywność (quiz/trening/odtwarzacz)
 * @param {ScreenType} screenName - Nazwa ekranu
 * @returns {boolean} True jeśli to aktywność
 */
export function isActivityScreen(screenName) {
  return ['quiz', 'workout'].includes(screenName);
}

/**
 * Określa czy dany ekran to ekran nawigacyjny (lista/wybór)
 * @param {ScreenType} screenName - Nazwa ekranu
 * @returns {boolean} True jeśli to ekran nawigacyjny
 */
export function isNavigationScreen(screenName) {
  return ['main', 'more', 'loading'].includes(screenName);
}

/**
 * Określa czy dany ekran to podsumowanie
 * @param {ScreenType} screenName - Nazwa ekranu
 * @returns {boolean} True jeśli to podsumowanie
 */
export function isSummaryScreen(screenName) {
  return ['quiz-summary', 'workout-end'].includes(screenName);
}

/**
 * Przełącza na wybrany ekran i automatycznie zarządza stanem UI
 * @param {ScreenType} screenName - Nazwa ekranu do wyświetlenia
 * @param {Object} [options] - Dodatkowe opcje
 * @param {boolean} [options.isActivity] - Jawnie określ czy to aktywność
 *
 * @example
 * uiState.navigateToScreen('quiz'); // Automatycznie wykryje że to aktywność
 * uiState.navigateToScreen('listening', { isActivity: true }); // Jawnie określ
 */
export function navigateToScreen(screenName, options = {}) {
  const isActivity =
    options.isActivity !== undefined ? options.isActivity : isActivityScreen(screenName);

  // Określ czy pokazywać tab bar
  let showTabBar = true;

  if (isActivity) {
    // Aktywności - ukryj tab bar
    showTabBar = false;
  } else if (isNavigationScreen(screenName)) {
    // Ekrany nawigacyjne - pokaż tab bar
    showTabBar = true;
  } else if (isSummaryScreen(screenName)) {
    // Podsumowania - pokaż tab bar (łatwa nawigacja)
    showTabBar = true;
  } else if (screenName === 'listening') {
    // Listening - domyślnie pokaż (lista), ale może być ukryty przez odtwarzacz
    const state = uiStore.getState();
    showTabBar = !state.isListeningPlayerActive;
  }

  // Aktualizuj stan
  uiStore.setState({
    currentScreen: screenName,
    isActivity,
    showTabBar
  });
}

/**
 * Ustawia stan odtwarzacza słuchania
 * @param {boolean} isActive - Czy odtwarzacz jest aktywny
 *
 * @example
 * uiState.setListeningPlayerActive(true); // Odtwarzacz włączony - ukryj tab bar
 * uiState.setListeningPlayerActive(false); // Lista zestawów - pokaż tab bar
 */
export function setListeningPlayerActive(isActive) {
  const state = uiStore.getState();

  uiStore.setState({
    isListeningPlayerActive: isActive,
    isActivity: isActive,
    // Jeśli jesteśmy na ekranie listening, zaktualizuj showTabBar
    showTabBar: state.currentScreen === 'listening' ? !isActive : state.showTabBar
  });
}

/**
 * Przełącza zakładkę (tab)
 * @param {string} tabName - Nazwa zakładki ('quizzes', 'workouts', 'listening', 'more')
 *
 * @example
 * uiState.switchTab('workouts');
 */
export function switchTab(tabName) {
  uiStore.setState({
    currentTab: tabName
  });
}

/**
 * Pokazuje/ukrywa tab bar
 * @param {boolean} show - True = pokaż, false = ukryj
 *
 * @example
 * uiState.setTabBarVisible(false); // Ukryj tab bar
 */
export function setTabBarVisible(show) {
  uiStore.setState({
    showTabBar: show
  });
}

/**
 * Pobiera aktualny stan UI
 * @returns {UIState} Aktualny stan
 *
 * @example
 * const state = uiState.getState();
 * console.log('Current screen:', state.currentScreen);
 */
export function getState() {
  return uiStore.getState();
}

/**
 * Subskrybuje zmiany stanu UI
 * @param {(state: UIState, prevState: UIState) => void} listener - Callback
 * @returns {() => void} Funkcja do anulowania subskrypcji
 *
 * @example
 * const unsubscribe = uiState.subscribe((state) => {
 *   console.log('Screen changed to:', state.currentScreen);
 * });
 * // Później: unsubscribe();
 */
export function subscribe(listener) {
  return uiStore.subscribe(listener);
}

/**
 * Resetuje stan UI do wartości domyślnych
 */
export function reset() {
  uiStore.reset();
}

// Export default object for backward compatibility
export default {
  navigateToScreen,
  setListeningPlayerActive,
  switchTab,
  setTabBarVisible,
  getState,
  subscribe,
  reset,
  isActivityScreen,
  isNavigationScreen,
  isSummaryScreen,
  store: uiStore
};

console.log('✅ UI State manager initialized');
