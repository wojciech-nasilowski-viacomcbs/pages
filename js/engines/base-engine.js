/**
 * @fileoverview Bazowa klasa dla wszystkich silników treści
 * Definiuje jednolity interfejs dla quiz, workout, listening, KB
 *
 * FAZA 3, Krok 9: Utworzenie BaseEngine
 *
 * @module base-engine
 */

/**
 * Bazowa klasa dla silników aktywności
 * @abstract
 */
export class BaseEngine {
  /**
   * @param {string} engineName - Nazwa silnika (np. 'quiz', 'workout')
   * @param {Object} elements - Referencje do elementów DOM
   */
  constructor(engineName, elements) {
    if (new.target === BaseEngine) {
      throw new TypeError('Cannot construct BaseEngine instances directly - use a subclass');
    }

    this.engineName = engineName;
    this.elements = elements;
    this.isInitialized = false;
    this.isActive = false;
    this.currentData = null;
    this.currentId = null;
  }

  // ========== LIFECYCLE METHODS (muszą być zaimplementowane w subclassach) ==========

  /**
   * Inicjalizacja silnika (event listeners, setup)
   * Wywoływane raz przy starcie aplikacji
   * @abstract
   * @returns {void}
   */
  init() {
    throw new Error(`${this.constructor.name}.init() must be implemented by subclass`);
  }

  /**
   * Rozpocznij aktywność
   * @abstract
   * @param {Object} data - Dane (quiz/workout/listening)
   * @param {string} id - ID treści
   * @param {Object} [options={}] - Dodatkowe opcje
   * @returns {void}
   */
  start(data, id, options = {}) {
    throw new Error(`${this.constructor.name}.start() must be implemented by subclass`);
  }

  /**
   * Pauza (opcjonalne - nie wszystkie silniki muszą to implementować)
   * @returns {void}
   */
  pause() {
    console.warn(`${this.constructor.name}.pause() not implemented`);
  }

  /**
   * Wznów (opcjonalne)
   * @returns {void}
   */
  resume() {
    console.warn(`${this.constructor.name}.resume() not implemented`);
  }

  /**
   * Zatrzymaj i wyczyść
   * @abstract
   * @returns {void}
   */
  stop() {
    throw new Error(`${this.constructor.name}.stop() must be implemented by subclass`);
  }

  /**
   * Restart od początku (opcjonalne)
   * @returns {void}
   */
  restart() {
    if (this.currentData && this.currentId) {
      this.stop();
      this.start(this.currentData, this.currentId);
    } else {
      console.warn(`${this.constructor.name}.restart() called but no current data`);
    }
  }

  // ========== STATE MANAGEMENT ==========

  /**
   * Pobierz aktualny postęp
   * @abstract
   * @returns {Object} - { current, total, percentage, ... }
   */
  getProgress() {
    throw new Error(`${this.constructor.name}.getProgress() must be implemented by subclass`);
  }

  /**
   * Zapisz postęp (do localStorage lub Supabase)
   * Opcjonalne - subclassy mogą nadpisać
   * @returns {void}
   */
  saveProgress() {
    // Default: do nothing
    console.log(`${this.constructor.name}.saveProgress() - no implementation`);
  }

  /**
   * Wczytaj postęp
   * Opcjonalne - subclassy mogą nadpisać
   * @returns {Object|null} - Zapisany stan lub null
   */
  loadProgress() {
    // Default: do nothing
    return null;
  }

  // ========== HELPER METHODS ==========

  /**
   * Sprawdź czy silnik jest zainicjalizowany
   * @throws {Error} Jeśli silnik nie został zainicjalizowany
   * @returns {void}
   */
  ensureInitialized() {
    if (!this.isInitialized) {
      throw new Error(`${this.constructor.name} not initialized. Call init() first.`);
    }
  }

  /**
   * Sprawdź czy aktywność jest aktywna
   * @returns {boolean}
   */
  isActivityActive() {
    return this.isActive;
  }

  /**
   * Pobierz obecne dane
   * @returns {Object|null}
   */
  getCurrentData() {
    return this.currentData;
  }

  /**
   * Pobierz obecne ID
   * @returns {string|null}
   */
  getCurrentId() {
    return this.currentId;
  }

  /**
   * Wyczyść stan silnika
   * @protected
   * @returns {void}
   */
  _clearState() {
    this.isActive = false;
    this.currentData = null;
    this.currentId = null;
  }

  /**
   * Ustaw obecne dane
   * @protected
   * @param {Object} data - Dane aktywności
   * @param {string} id - ID aktywności
   * @returns {void}
   */
  _setCurrentData(data, id) {
    this.currentData = data;
    this.currentId = id;
    this.isActive = true;
  }

  // ========== LOGGING ==========

  /**
   * Log z prefiksem nazwy silnika
   * @param {string} message - Wiadomość do zalogowania
   * @param {...any} args - Dodatkowe argumenty
   * @returns {void}
   */
  log(message, ...args) {
    console.log(`[${this.engineName.toUpperCase()}]`, message, ...args);
  }

  /**
   * Error log z prefiksem nazwy silnika
   * @param {string} message - Wiadomość błędu
   * @param {...any} args - Dodatkowe argumenty
   * @returns {void}
   */
  error(message, ...args) {
    console.error(`[${this.engineName.toUpperCase()}]`, message, ...args);
  }

  /**
   * Warning log z prefiksem nazwy silnika
   * @param {string} message - Ostrzeżenie
   * @param {...any} args - Dodatkowe argumenty
   * @returns {void}
   */
  warn(message, ...args) {
    console.warn(`[${this.engineName.toUpperCase()}]`, message, ...args);
  }
}

/**
 * Przykład użycia:
 *
 * ```javascript
 * import { BaseEngine } from './base-engine.js';
 *
 * export class QuizEngine extends BaseEngine {
 *   constructor(elements) {
 *     super('quiz', elements);
 *     this.quizState = {
 *       currentQuestionIndex: 0,
 *       score: 0,
 *       answers: []
 *     };
 *   }
 *
 *   init() {
 *     this.log('Initializing...');
 *     // Setup event listeners
 *     this.isInitialized = true;
 *   }
 *
 *   start(quizData, quizId, options = {}) {
 *     this.ensureInitialized();
 *     this._setCurrentData(quizData, quizId);
 *     this.log('Starting quiz:', quizData.title);
 *     // Quiz logic...
 *   }
 *
 *   stop() {
 *     this.log('Stopping...');
 *     this._clearState();
 *     // Cleanup...
 *   }
 *
 *   getProgress() {
 *     return {
 *       current: this.quizState.currentQuestionIndex + 1,
 *       total: this.currentData?.questions.length || 0,
 *       percentage: Math.round(((this.quizState.currentQuestionIndex + 1) / this.currentData.questions.length) * 100)
 *     };
 *   }
 * }
 * ```
 */

console.log('✅ BaseEngine loaded');
