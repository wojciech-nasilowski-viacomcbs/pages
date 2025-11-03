/**
 * @fileoverview Centralny, reaktywny store aplikacji
 * FAZA 5.1: Scalony z ui-state.js - jeden store dla całej aplikacji!
 * ZAWIERA: user, navigation, currentTab, UI state
 * NIE ZAWIERA: szczegółów aktywności (quizState, workoutState - to w silnikach!)
 * @module app-state
 */

import { createStore } from './store.js';

/**
 * Typy ekranów w aplikacji
 * @typedef {'main'|'quiz'|'quiz-summary'|'workout'|'workout-end'|'listening'|'more'|'loading'} ScreenType
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

/**
 * Główny store aplikacji
 * @type {import('./store.js').Store}
 */
export const appState = createStore({
  // User & Auth
  currentUser: null,
  userRole: 'user',

  // Navigation (single source of truth!)
  currentScreen: 'loading',
  currentTab: initialTab, // workouts | quizzes | listening | knowledge-base | more

  // UI State
  isActivity: false,
  showTabBar: true,
  isListeningPlayerActive: false
});

// ========== AUTOMATYCZNA SYNCHRONIZACJA UI ==========

/**
 * Automatyczna synchronizacja tab bara z stanem
 */
appState.subscribe((state, prevState) => {
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
appState.subscribe(async (state, prevState) => {
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

// ========== HELPER FUNCTIONS ==========

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
 * navigateToScreen('quiz'); // Automatycznie wykryje że to aktywność
 * navigateToScreen('listening', { isActivity: true }); // Jawnie określ
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
    const state = appState.getState();
    showTabBar = !state.isListeningPlayerActive;
  }

  // Aktualizuj stan
  appState.setState({
    currentScreen: screenName,
    isActivity,
    showTabBar
  });
}

/**
 * Ustawia aktualnego użytkownika
 * @param {Object|null} user - Obiekt użytkownika z Supabase
 */
export function setCurrentUser(user) {
  appState.setState({ currentUser: user });
}

/**
 * Ustawia rolę użytkownika
 * @param {'user'|'admin'} role - Rola użytkownika
 */
export function setUserRole(role) {
  appState.setState({ userRole: role });
}

/**
 * Ustawia aktualny ekran (low-level, użyj navigateToScreen zamiast tego!)
 * @param {'loading'|'main'|'quiz'|'quiz-summary'|'workout'|'workout-end'|'listening'|'knowledge-base'|'more'} screen - Nazwa ekranu
 * @deprecated Użyj navigateToScreen() zamiast tego
 */
export function setCurrentScreen(screen) {
  appState.setState({ currentScreen: screen });
}

/**
 * Przełącza zakładkę (tab)
 * @param {string} tabName - Nazwa zakładki ('quizzes', 'workouts', 'listening', 'more')
 *
 * @example
 * switchTab('workouts');
 */
export function switchTab(tabName) {
  appState.setState({
    currentTab: tabName
  });

  // Zapisz do localStorage
  try {
    localStorage.setItem('lastActiveTab', tabName);
  } catch (e) {
    console.warn('Nie można zapisać zakładki do localStorage:', e);
  }
}

/**
 * Ustawia aktualną zakładkę (alias dla switchTab)
 * @param {'workouts'|'quizzes'|'listening'|'knowledge-base'|'more'} tab - Nazwa zakładki
 * @deprecated Użyj switchTab() zamiast tego
 */
export function setCurrentTab(tab) {
  switchTab(tab);
}

/**
 * Ustawia czy trwa aktywność (quiz/trening/słuchanie)
 * @param {boolean} isActivity - Czy trwa aktywność
 */
export function setActivity(isActivity) {
  appState.setState({ isActivity });
}

/**
 * Pokazuje/ukrywa tab bar
 * @param {boolean} show - True = pokaż, false = ukryj
 *
 * @example
 * setTabBarVisible(false); // Ukryj tab bar
 */
export function setTabBarVisible(show) {
  appState.setState({
    showTabBar: show
  });
}

/**
 * Ustawia widoczność tab bara (alias dla setTabBarVisible)
 * @param {boolean} show - Czy pokazywać tab bar
 * @deprecated Użyj setTabBarVisible() zamiast tego
 */
export function setTabBarVisibility(show) {
  setTabBarVisible(show);
}

/**
 * Ustawia stan odtwarzacza słuchania
 * @param {boolean} isActive - Czy odtwarzacz jest aktywny
 *
 * @example
 * setListeningPlayerActive(true); // Odtwarzacz włączony - ukryj tab bar
 * setListeningPlayerActive(false); // Lista zestawów - pokaż tab bar
 */
export function setListeningPlayerActive(isActive) {
  const state = appState.getState();

  appState.setState({
    isListeningPlayerActive: isActive,
    isActivity: isActive,
    // Jeśli jesteśmy na ekranie listening, zaktualizuj showTabBar
    showTabBar: state.currentScreen === 'listening' ? !isActive : state.showTabBar
  });
}

/**
 * Pobiera aktualny stan
 * @returns {Object} - Aktualny stan aplikacji
 */
export function getAppState() {
  return appState.getState();
}

/**
 * Pobiera aktualny stan (alias dla getAppState)
 * @returns {Object} Aktualny stan
 */
export function getState() {
  return appState.getState();
}

/**
 * Subskrybuje zmiany stanu
 * @param {(state: Object, prevState: Object) => void} listener - Callback
 * @returns {() => void} Funkcja do anulowania subskrypcji
 */
export function subscribe(listener) {
  return appState.subscribe(listener);
}

/**
 * Resetuje stan do wartości domyślnych
 */
export function reset() {
  appState.reset();
}

// ========== BACKWARD COMPATIBILITY FOR IIFE MODULES ==========
// TODO-PHASE-6: Eksport do window dla IIFE modules (app.js, ui-manager.js, content-manager.js)
// Zostanie usunięte po konwersji tych plików do ES6 modules
if (typeof window !== 'undefined') {
  window.appState = appState;
  window.setCurrentUser = setCurrentUser;
  window.setUserRole = setUserRole;
  window.setCurrentScreen = setCurrentScreen;
  window.setCurrentTab = setCurrentTab;
  window.setActivity = setActivity;
  window.setTabBarVisibility = setTabBarVisibility;
  window.setTabBarVisible = setTabBarVisible;
  window.setListeningPlayerActive = setListeningPlayerActive;
  window.getAppState = getAppState;
  window.getState = getState;
  window.subscribe = subscribe;
  window.reset = reset;
  window.navigateToScreen = navigateToScreen;
  window.switchTab = switchTab;
  window.isActivityScreen = isActivityScreen;
  window.isNavigationScreen = isNavigationScreen;
  window.isSummaryScreen = isSummaryScreen;

  // Alias dla ui-state (backward compatibility)
  window.uiState = {
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
    store: appState
  };
}

console.log('✅ App state initialized (merged with ui-state)');
