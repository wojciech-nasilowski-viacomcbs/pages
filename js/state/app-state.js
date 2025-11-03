/**
 * @fileoverview Centralny, reaktywny store aplikacji
 * ZAWIERA TYLKO: user, navigation, currentTab
 * NIE ZAWIERA: szczegółów aktywności (quizState, workoutState - to w silnikach!)
 * @module app-state
 */

import { createStore } from './store.js';

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
  currentTab: 'workouts', // workouts | quizzes | listening | knowledge-base | more

  // UI State
  isActivity: false,
  showTabBar: true,
  isListeningPlayerActive: false
});

// ========== HELPER FUNCTIONS ==========

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
 * Ustawia aktualny ekran
 * @param {'loading'|'main'|'quiz'|'quiz-summary'|'workout'|'workout-end'|'listening'|'knowledge-base'|'more'} screen - Nazwa ekranu
 */
export function setCurrentScreen(screen) {
  appState.setState({ currentScreen: screen });
}

/**
 * Ustawia aktualną zakładkę
 * @param {'workouts'|'quizzes'|'listening'|'knowledge-base'|'more'} tab - Nazwa zakładki
 */
export function setCurrentTab(tab) {
  appState.setState({ currentTab: tab });
  // Zapisz do localStorage
  try {
    localStorage.setItem('lastTab', tab);
  } catch (e) {
    console.warn('Nie można zapisać zakładki do localStorage:', e);
  }
}

/**
 * Ustawia czy trwa aktywność (quiz/trening/słuchanie)
 * @param {boolean} isActivity - Czy trwa aktywność
 */
export function setActivity(isActivity) {
  appState.setState({ isActivity });
}

/**
 * Ustawia widoczność tab bara
 * @param {boolean} show - Czy pokazywać tab bar
 */
export function setTabBarVisibility(show) {
  appState.setState({ showTabBar: show });
}

/**
 * Ustawia czy odtwarzacz słuchania jest aktywny
 * @param {boolean} active - Czy odtwarzacz jest aktywny
 */
export function setListeningPlayerActive(active) {
  appState.setState({ isListeningPlayerActive: active });
}

/**
 * Pobiera aktualny stan
 * @returns {Object} - Aktualny stan aplikacji
 */
export function getAppState() {
  return appState.getState();
}

// ========== BACKWARD COMPATIBILITY (TEMPORARY!) ==========
// TODO-REFACTOR-CLEANUP: Backward compatibility shim (FAZA 5, Krok 17)
// Eksport do window (do usunięcia w Kroku 17)
// Po zakończeniu refaktoringu wszystkie moduły będą używać ES6 imports
if (typeof window !== 'undefined') {
  window.appState = appState; // TODO-REFACTOR-CLEANUP
  window.setCurrentUser = setCurrentUser; // TODO-REFACTOR-CLEANUP
  window.setUserRole = setUserRole; // TODO-REFACTOR-CLEANUP
  window.setCurrentScreen = setCurrentScreen; // TODO-REFACTOR-CLEANUP
  window.setCurrentTab = setCurrentTab; // TODO-REFACTOR-CLEANUP
  window.setActivity = setActivity; // TODO-REFACTOR-CLEANUP
  window.setTabBarVisibility = setTabBarVisibility; // TODO-REFACTOR-CLEANUP
  window.setListeningPlayerActive = setListeningPlayerActive; // TODO-REFACTOR-CLEANUP
  window.getAppState = getAppState; // TODO-REFACTOR-CLEANUP
}

console.log('✅ App state initialized');
