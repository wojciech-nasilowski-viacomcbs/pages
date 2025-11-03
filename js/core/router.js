/**
 * @fileoverview Centralny router aplikacji
 * FAZA 4, KROK 13: Centralna nawigacja między ekranami
 *
 * Router zarządza nawigacją między ekranami aplikacji i synchronizuje stan z appState.
 * Zastępuje rozproszoną logikę nawigacji z ui-manager.js
 */

import { appState } from '../state/app-state.js';

/**
 * Bazowa klasa dla ekranów
 * @class Screen
 */
export class Screen {
  /**
   * @param {string} name - Nazwa ekranu
   * @param {HTMLElement} element - Element DOM ekranu
   * @param {Object} options - Opcje ekranu
   * @param {boolean} options.isActivity - Czy ekran jest aktywnością (ukrywa tab bar)
   */
  constructor(name, element, options = {}) {
    this.name = name;
    this.element = element;
    this.isActivity = options.isActivity || false;
  }

  /**
   * Pokazuje ekran
   * @param {Object} options - Opcje wyświetlania
   */
  show(options = {}) {
    this.element.classList.remove('hidden');
    this.onShow(options);
  }

  /**
   * Ukrywa ekran
   */
  hide() {
    this.element.classList.add('hidden');
    this.onHide();
  }

  /**
   * Hook wywoływany przy pokazaniu ekranu
   * Do nadpisania w subclassach
   * @param {Object} options - Opcje wyświetlania
   */
  onShow(options) {}

  /**
   * Hook wywoływany przy ukryciu ekranu
   * Do nadpisania w subclassach
   */
  onHide() {}
}

/**
 * Router - centralna nawigacja
 * @class Router
 */
export class Router {
  /**
   * @param {Map<string, Screen>} screens - Mapa ekranów (nazwa -> Screen)
   */
  constructor(screens = new Map()) {
    this.screens = screens;
    this.currentScreen = null;
    this.history = [];

    console.log('🧭 Router initialized with', screens.size, 'screens');
  }

  /**
   * Rejestruje nowy ekran
   * @param {string} name - Nazwa ekranu
   * @param {Screen} screen - Instancja ekranu
   */
  registerScreen(name, screen) {
    this.screens.set(name, screen);
    console.log(`🧭 Router: registered screen "${name}"`);
  }

  /**
   * Nawiguj do ekranu
   * @param {string} screenName - Nazwa docelowego ekranu
   * @param {Object} options - Opcje nawigacji
   * @param {boolean} skipHistory - Czy pominąć dodawanie do historii (używane przez back())
   * @returns {boolean} - Czy nawigacja się powiodła
   */
  navigate(screenName, options = {}, skipHistory = false) {
    console.log(`🧭 Router: navigating to "${screenName}"`, options);

    // 1. Sprawdź czy ekran istnieje
    const screen = this.screens.get(screenName);
    if (!screen) {
      console.error(`🧭 Router: Screen "${screenName}" not found`);
      return false;
    }

    // 2. Ukryj obecny ekran i dodaj do historii (jeśli nie skipHistory)
    if (this.currentScreen && this.currentScreen.name !== screenName) {
      this.currentScreen.hide();
      if (!skipHistory) {
        this.history.push(this.currentScreen.name);
      }
    }

    // 3. Zaktualizuj globalny stan
    appState.setState({
      currentScreen: screenName,
      isActivity: screen.isActivity,
      showTabBar: !screen.isActivity
    });

    // 4. Pokaż nowy ekran
    screen.show(options);
    this.currentScreen = screen;

    return true;
  }

  /**
   * Wróć do poprzedniego ekranu
   * @returns {boolean} - Czy nawigacja się powiodła
   */
  back() {
    if (this.history.length > 0) {
      const previousScreen = this.history.pop();
      console.log(`🧭 Router: going back to "${previousScreen}"`);
      return this.navigate(previousScreen, {}, true); // skipHistory = true
    } else {
      console.log('🧭 Router: no history, going to main');
      return this.navigate('main', {}, true); // skipHistory = true
    }
  }

  /**
   * Wyczyść historię nawigacji
   */
  clearHistory() {
    this.history = [];
    console.log('🧭 Router: history cleared');
  }

  /**
   * Pobierz aktualny ekran
   * @returns {Screen|null}
   */
  getCurrentScreen() {
    return this.currentScreen;
  }

  /**
   * Pobierz nazwę aktualnego ekranu
   * @returns {string|null}
   */
  getCurrentScreenName() {
    return this.currentScreen ? this.currentScreen.name : null;
  }

  /**
   * Sprawdź czy ekran jest zarejestrowany
   * @param {string} screenName - Nazwa ekranu
   * @returns {boolean}
   */
  hasScreen(screenName) {
    return this.screens.has(screenName);
  }

  /**
   * Pobierz listę zarejestrowanych ekranów
   * @returns {string[]}
   */
  getScreenNames() {
    return Array.from(this.screens.keys());
  }
}

// TODO-PHASE-6: Export do window dla IIFE modules (app.js)
// Zostanie usunięte po konwersji app.js do ES6 module
if (typeof window !== 'undefined') {
  window.Screen = Screen;
  window.Router = Router;
}

console.log('✅ Router module loaded');
