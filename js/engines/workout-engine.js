/**
 * @fileoverview Silnik treningów - wersja ES6 Class
 * Refactored w FAZIE 3.3 - dziedziczenie po BaseEngine
 * Obsługuje trening z timerem, fazami i Wake Lock API
 */

import { BaseEngine } from './base-engine.js';
import { playTimerEndSound } from '../utils/audio.js';

/**
 * Silnik treningów
 * @extends BaseEngine
 */
export class WorkoutEngine extends BaseEngine {
  /**
   * @param {Object} elements - Referencje do elementów DOM
   * @param {Function} showScreenFn - Funkcja do zmiany ekranów
   * @param {Object} appState - Globalny stan aplikacji
   */
  constructor(elements, showScreenFn, appState) {
    super('workout', elements);

    this.showScreenFn = showScreenFn;
    this.appState = appState;

    // Stan treningu (lokalny)
    this.workoutState = {
      data: null,
      filename: null,
      currentPhaseIndex: 0,
      currentExerciseIndex: 0,
      timerInterval: null,
      timeLeft: 0,
      isPaused: false
    };

    // Ikony SVG
    this.icons = {
      timer: `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>`,
      next: `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
      </svg>`,
      check: `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>`
    };
  }

  // ========== LIFECYCLE METHODS (BaseEngine implementation) ==========

  /**
   * Inicjalizacja silnika treningów
   * @override
   */
  init() {
    this.log('Initializing...');

    // Pobierz elementy DOM
    this._initDOMElements();

    // Dodaj event listenery
    this._attachEventListeners();

    // Setup Wake Lock
    this._setupWakeLock();

    // Ukryj wskazówkę o wygaszaniu ekranu na desktop
    this._setupScreenTimeoutTip();

    this.isInitialized = true;
    this.log('Initialized successfully');
  }

  /**
   * Rozpocznij trening
   * @override
   * @param {Object} workoutData - Dane treningu
   * @param {string} filename - Nazwa pliku treningu
   * @param {Object} [options={}] - Opcje
   */
  start(workoutData, filename, options = {}) {
    this.ensureInitialized();

    this.log('Starting workout:', workoutData.title);

    // Rozwij ćwiczenia z wieloma seriami
    const expandedWorkoutData = {
      ...workoutData,
      phases: this._expandExerciseSets(workoutData.phases)
    };

    // Reset stanu
    this.workoutState = {
      data: expandedWorkoutData,
      filename: filename,
      currentPhaseIndex: 0,
      currentExerciseIndex: 0,
      timerInterval: null,
      timeLeft: 0,
      isPaused: false
    };

    this._setCurrentData(expandedWorkoutData, filename);

    // Rozpocznij Wake Lock
    this._requestWakeLock();

    // Pokaż pierwsze ćwiczenie
    this._showExercise();
  }

  /**
   * Zatrzymaj trening
   * @override
   */
  stop() {
    this.log('Stopping...');

    // Zatrzymaj timer
    this._stopTimer();

    // Zwolnij Wake Lock
    this._releaseWakeLock();

    // Reset stanu
    this.workoutState = {
      data: null,
      filename: null,
      currentPhaseIndex: 0,
      currentExerciseIndex: 0,
      timerInterval: null,
      timeLeft: 0,
      isPaused: false
    };

    this._clearState();

    // Ukryj ekran treningu
    if (this.showScreenFn && this.appState) {
      this.showScreenFn('main', this.appState, this.elements);
    }
  }

  /**
   * Pauza treningu
   * @override
   */
  pause() {
    if (this.workoutState.timerInterval) {
      this._stopTimer();
      this.workoutState.isPaused = true;
      this.log('Paused');
    }
  }

  /**
   * Wznów trening
   * @override
   */
  resume() {
    if (this.workoutState.isPaused && this.workoutState.timeLeft > 0) {
      this._startTimer();
      this.workoutState.isPaused = false;
      this.log('Resumed');
    }
  }

  /**
   * Restart treningu
   * @override
   */
  restart() {
    this.log('Restarting...');

    if (this.workoutState.data && this.workoutState.filename) {
      // Zachowaj oryginalne dane (przed rozwinięciem serii)
      const originalData = this.currentData;
      const filename = this.workoutState.filename;

      this.stop();
      this.start(originalData, filename);
    } else {
      this.warn('Cannot restart - no workout data');
    }
  }

  /**
   * Pobierz postęp treningu
   * @override
   * @returns {Object} - { current, total, percentage, phase }
   */
  getProgress() {
    const phases = this.workoutState.data?.phases || [];
    let totalExercises = 0;
    let currentExercise = 0;

    phases.forEach((phase, phaseIdx) => {
      phase.exercises.forEach((_, exIdx) => {
        if (
          phaseIdx < this.workoutState.currentPhaseIndex ||
          (phaseIdx === this.workoutState.currentPhaseIndex &&
            exIdx < this.workoutState.currentExerciseIndex)
        ) {
          currentExercise++;
        }
        totalExercises++;
      });
    });

    const percentage =
      totalExercises > 0 ? Math.round((currentExercise / totalExercises) * 100) : 0;

    return {
      current: currentExercise + 1,
      total: totalExercises,
      percentage,
      phase: this.workoutState.currentPhaseIndex + 1,
      totalPhases: phases.length
    };
  }

  // ========== PRIVATE METHODS ==========

  /**
   * Inicjalizuje elementy DOM
   * @private
   */
  _initDOMElements() {
    this.elements = {
      ...this.elements,
      phase: document.getElementById('workout-phase'),
      exerciseName: document.getElementById('workout-exercise-name'),
      exerciseDescription: document.getElementById('workout-exercise-description'),
      exerciseDetails: document.getElementById('workout-exercise-details'),
      mainButton: document.getElementById('workout-main-button'),
      buttonText: document.getElementById('workout-button-text'),
      buttonIcon: document.getElementById('workout-button-icon'),
      skipButton: document.getElementById('workout-skip-button'),
      restartBtn: document.getElementById('workout-restart-btn'),
      restartButton: document.getElementById('workout-restart'),
      homeButton: document.getElementById('workout-home'),
      restartDialog: document.getElementById('restart-dialog'),
      restartConfirm: document.getElementById('restart-confirm'),
      restartCancel: document.getElementById('restart-cancel'),
      timer: document.getElementById('workout-timer')
    };
  }

  /**
   * Dodaje event listenery
   * @private
   */
  _attachEventListeners() {
    this.elements.mainButton?.addEventListener('click', () => this._handleMainButtonClick());
    this.elements.skipButton?.addEventListener('click', () => this._handleSkip());
    this.elements.restartButton?.addEventListener('click', () => this.restart());
    this.elements.restartBtn?.addEventListener('click', () => this._handleRestartClick());
    this.elements.restartConfirm?.addEventListener('click', () => this._handleRestartConfirm());
    this.elements.restartCancel?.addEventListener('click', () => this._handleRestartCancel());
    this.elements.homeButton?.addEventListener('click', () => this.stop());
  }

  /**
   * Setup Wake Lock listeners
   * @private
   */
  _setupWakeLock() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this._releaseWakeLock();
      } else if (this.isActive) {
        this._requestWakeLock();
      }
    });
  }

  /**
   * Rozwija ćwiczenia z wieloma seriami
   * @private
   * @param {Array} phases - Fazy treningu
   * @returns {Array} - Fazy z rozwiniętymi ćwiczeniami
   */
  _expandExerciseSets(phases) {
    return phases.map(phase => {
      const expandedExercises = [];

      phase.exercises.forEach(exercise => {
        if (exercise.sets && exercise.sets >= 2) {
          // Rozwij na serie
          for (let i = 1; i <= exercise.sets; i++) {
            const seriesExercise = {
              ...exercise,
              name: `${exercise.name} seria ${i}/${exercise.sets}`,
              sets: undefined
            };

            if (exercise.type === 'reps' && exercise.reps) {
              seriesExercise.details = `${exercise.reps} powtórzeń`;
            }

            expandedExercises.push(seriesExercise);

            // Dodaj odpoczynek między seriami
            if (i < exercise.sets) {
              const restDuration = exercise.restBetweenSets || 30;
              expandedExercises.push({
                name: 'Odpoczynek',
                type: 'time',
                duration: restDuration,
                description: 'Przerwa między seriami.',
                details: '',
                mediaUrl: ''
              });
            }
          }
        } else {
          // Zachowaj ćwiczenie bez zmian
          const singleExercise = { ...exercise };

          if (exercise.type === 'reps' && exercise.reps && !exercise.details) {
            singleExercise.details = `${exercise.reps} powtórzeń`;
          }

          expandedExercises.push(singleExercise);
        }
      });

      return {
        ...phase,
        exercises: expandedExercises
      };
    });
  }

  /**
   * Pokazuje obecne ćwiczenie
   * @private
   */
  _showExercise() {
    const phase = this.workoutState.data.phases[this.workoutState.currentPhaseIndex];
    const exercise = phase.exercises[this.workoutState.currentExerciseIndex];

    // Reset stanu timera przed pokazaniem nowego ćwiczenia
    this._stopTimer();
    this.workoutState.isPaused = false;

    // Update UI
    this.elements.phase.textContent = `Faza ${this.workoutState.currentPhaseIndex + 1}: ${phase.name}`;
    this.elements.exerciseName.textContent = exercise.name;
    this.elements.exerciseDescription.textContent = exercise.description || '';
    this.elements.exerciseDetails.textContent = exercise.details || '';

    // Pokaż media jeśli jest
    if (exercise.mediaUrl) {
      // TODO: Implementacja pokazywania obrazu/video
    }

    // Sprawdź czy to odpoczynek
    const isRest = exercise.name && exercise.name.toLowerCase().includes('odpoczynek');

    // Setup przycisku w zależności od typu ćwiczenia
    if (exercise.type === 'time') {
      this.workoutState.timeLeft = exercise.duration;
      this._updateTimerDisplay();
      this.elements.timer?.classList.remove('hidden'); // Pokaż timer

      // Odpoczynek startuje automatycznie, ćwiczenia czekają na przycisk
      if (isRest) {
        this._startTimer();
        this._showButton('pause-timer', 'Pauza', this.icons.timer);
      } else {
        this._showButton('start-timer', 'Rozpocznij', this.icons.timer);
      }
    } else {
      this.elements.timer?.classList.add('hidden'); // Ukryj timer
      this._showButton('complete', 'Gotowe', this.icons.check);
    }

    // Pokaż przycisk Skip z odpowiednim tekstem
    this.elements.skipButton.classList.remove('hidden');

    // Zmień tekst przycisku Skip w zależności od typu ćwiczenia
    if (isRest) {
      this.elements.skipButton.textContent = 'Pomiń odpoczynek';
    } else {
      this.elements.skipButton.textContent = 'Pomiń ćwiczenie';
    }
  }

  /**
   * Pokazuje przycisk z odpowiednim tekstem i ikoną
   * @private
   * @param {string} action - Akcja przycisku
   * @param {string} text - Tekst przycisku
   * @param {string} icon - HTML ikony
   */
  _showButton(action, text, icon) {
    this.elements.mainButton.dataset.action = action;
    this.elements.buttonText.textContent = text;
    this.elements.buttonIcon.innerHTML = icon;
  }

  /**
   * Handler: Main button click
   * @private
   */
  _handleMainButtonClick() {
    const action = this.elements.mainButton.dataset.action;

    switch (action) {
      case 'start-timer':
        this._startTimer();
        this._showButton('pause-timer', 'Pauza', this.icons.timer);
        break;

      case 'pause-timer':
        this.pause();
        this._showButton('resume-timer', 'Wznów', this.icons.timer);
        break;

      case 'resume-timer':
        this.resume();
        this._showButton('pause-timer', 'Pauza', this.icons.timer);
        break;

      case 'complete':
        playTimerEndSound(); // Odtwórz dźwięk zakończenia ćwiczenia
        this._handleNext();
        break;

      default:
        this.warn('Unknown button action:', action);
    }
  }

  /**
   * Rozpoczyna timer
   * @private
   */
  _startTimer() {
    this._stopTimer(); // Zatrzymaj poprzedni jeśli był

    this.workoutState.timerInterval = setInterval(() => {
      this.workoutState.timeLeft--;
      this._updateTimerDisplay();

      // Sprawdź czy timer się skończył
      if (this.workoutState.timeLeft <= 0) {
        this._stopTimer();
        playTimerEndSound();
        this._handleNext();
      }

      // Pulsuj timer w ostatnich 5 sekundach
      if (this.workoutState.timeLeft <= 5 && this.workoutState.timeLeft > 0) {
        this.elements.timer?.classList.add('pulse-red-animate');
      } else {
        this.elements.timer?.classList.remove('pulse-red-animate');
      }
    }, 1000);
  }

  /**
   * Zatrzymuje timer
   * @private
   */
  _stopTimer() {
    if (this.workoutState.timerInterval) {
      clearInterval(this.workoutState.timerInterval);
      this.workoutState.timerInterval = null;
      this.elements.timer?.classList.remove('pulse-red-animate');
    }
  }

  /**
   * Update timer display
   * @private
   */
  _updateTimerDisplay() {
    if (this.elements.timer) {
      const minutes = Math.floor(this.workoutState.timeLeft / 60);
      const seconds = this.workoutState.timeLeft % 60;
      this.elements.timer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  /**
   * Handler: Next exercise
   * @private
   */
  _handleNext() {
    const phase = this.workoutState.data.phases[this.workoutState.currentPhaseIndex];

    // Przejdź do następnego ćwiczenia
    this.workoutState.currentExerciseIndex++;

    // Sprawdź czy koniec fazy
    if (this.workoutState.currentExerciseIndex >= phase.exercises.length) {
      this.workoutState.currentPhaseIndex++;
      this.workoutState.currentExerciseIndex = 0;

      // Sprawdź czy koniec treningu
      if (this.workoutState.currentPhaseIndex >= this.workoutState.data.phases.length) {
        this._showSummary();
        return;
      }
    }

    this._showExercise();
  }

  /**
   * Handler: Skip exercise
   * @private
   */
  _handleSkip() {
    this._stopTimer();
    this._handleNext();
  }

  /**
   * Pokazuje podsumowanie treningu
   * @private
   */
  _showSummary() {
    this._stopTimer();
    this._releaseWakeLock();

    // Ukryj przyciski treningu
    this.elements.mainButton?.classList.add('hidden');
    this.elements.skipButton?.classList.add('hidden');

    // Pokaż podsumowanie
    this.elements.phase.textContent = 'Trening zakończony!';
    this.elements.exerciseName.textContent = '🎉 Gratulacje!';
    this.elements.exerciseDescription.textContent = 'Ukończyłeś cały trening.';
    this.elements.exerciseDetails.textContent = '';

    // Pokaż przyciski restart/home
    this.elements.restartButton?.classList.remove('hidden');
    this.elements.homeButton?.classList.remove('hidden');

    this.log('Workout completed');
  }

  /**
   * Handler: Restart button click
   * @private
   */
  _handleRestartClick() {
    this.elements.restartDialog?.classList.remove('hidden');
  }

  /**
   * Handler: Restart confirm
   * @private
   */
  _handleRestartConfirm() {
    this.elements.restartDialog?.classList.add('hidden');
    this.restart();
  }

  /**
   * Handler: Restart cancel
   * @private
   */
  _handleRestartCancel() {
    this.elements.restartDialog?.classList.add('hidden');
  }

  /**
   * Request Wake Lock
   * @private
   */
  async _requestWakeLock() {
    if (window.wakeLockManager && window.wakeLockManager.request) {
      try {
        await window.wakeLockManager.request();
        this.log('Wake Lock acquired');
      } catch (error) {
        this.warn('Wake Lock request failed:', error);
      }
    }
  }

  /**
   * Release Wake Lock
   * @private
   */
  async _releaseWakeLock() {
    if (window.wakeLockManager && window.wakeLockManager.release) {
      try {
        await window.wakeLockManager.release();
        this.log('Wake Lock released');
      } catch (error) {
        this.warn('Wake Lock release failed:', error);
      }
    }
  }

  /**
   * Setup screen timeout tip (hide on desktop)
   * @private
   */
  _setupScreenTimeoutTip() {
    const screenTip = document.getElementById('workout-screen-timeout-tip');

    if (!screenTip) {
      return;
    }

    // Ukryj wskazówkę na desktopie (nie dotyczy)
    if (!this._isMobileDevice()) {
      screenTip.classList.add('hidden');
      return;
    }

    // Sprawdź czy użytkownik już ukrył wskazówkę
    if (localStorage.getItem('workoutScreenTipDismissed') === 'true') {
      screenTip.classList.add('hidden');
      return;
    }

    // Przycisk "Rozumiem, nie pokazuj więcej"
    const dismissBtn = document.getElementById('dismiss-workout-screen-tip');
    dismissBtn?.addEventListener('click', () => {
      screenTip.classList.add('hidden');
      localStorage.setItem('workoutScreenTipDismissed', 'true');
    });
  }

  /**
   * Sprawdza czy urządzenie jest mobilne
   * @private
   * @returns {boolean}
   */
  _isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }
}

// ========== BACKWARD COMPATIBILITY FACADE ==========
// TODO-PHASE-6: Facade functions dla IIFE modules (app.js, content-manager.js)
// Zostanie usunięte po konwersji tych plików do ES6 modules

let workoutEngineInstance = null;

/**
 * Inicjalizuje silnik treningów (backward compatibility)
 * @param {Function} showScreen - Funkcja zmiany ekranu
 * @param {Object} state - Stan aplikacji
 * @returns {WorkoutEngine}
 */
export function initWorkoutEngine(showScreen, state) {
  const elements = {}; // Elementy będą pobrane w init()
  workoutEngineInstance = new WorkoutEngine(elements, showScreen, state);
  workoutEngineInstance.init();
  return workoutEngineInstance;
}

/**
 * Rozpoczyna trening (backward compatibility)
 * @param {Object} workoutData - Dane treningu
 * @param {string} filename - Nazwa pliku
 */
export function startWorkout(workoutData, filename) {
  if (workoutEngineInstance) {
    workoutEngineInstance.start(workoutData, filename);
  } else {
    console.error('[WORKOUT] Engine not initialized');
  }
}

console.log('✅ WorkoutEngine (ES6 Class) loaded');
