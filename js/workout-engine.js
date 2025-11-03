/**
 * Silnik treningów
 * Obsługuje renderowanie i logikę treningów z timerem i Wake Lock API
 */

(function () {
  'use strict';

  let showScreenFn = null;
  let _appState = null;

  // Stan treningu
  const workoutState = {
    data: null,
    filename: null,
    currentPhaseIndex: 0,
    currentExerciseIndex: 0,
    timerInterval: null,
    timeLeft: 0
  };

  // Elementy DOM
  const elements = {
    phase: document.getElementById('workout-phase'),
    exerciseName: document.getElementById('workout-exercise-name'),
    exerciseDescription: document.getElementById('workout-exercise-description'),
    exerciseDetails: document.getElementById('workout-exercise-details'),
    mainButton: document.getElementById('workout-main-button'),
    buttonText: document.getElementById('workout-button-text'),
    buttonIcon: document.getElementById('workout-button-icon'),
    skipButton: document.getElementById('workout-skip-button'),
    restartBtn: document.getElementById('workout-restart-btn'),

    // Ekran końcowy
    restartButton: document.getElementById('workout-restart'),
    homeButton: document.getElementById('workout-home'),

    // Dialogi
    restartDialog: document.getElementById('restart-dialog'),
    restartConfirm: document.getElementById('restart-confirm'),
    restartCancel: document.getElementById('restart-cancel')
  };

  // Ikony SVG
  const icons = {
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

  /**
   * Rozwija ćwiczenia z wieloma seriami na oddzielne kroki z odpoczynkami
   * @param {Array} phases - Tablica faz treningu
   * @returns {Array} Tablica faz z rozwiniętymi ćwiczeniami
   */
  function expandExerciseSets(phases) {
    return phases.map(phase => {
      const expandedExercises = [];

      phase.exercises.forEach(exercise => {
        // Sprawdź czy ćwiczenie ma wiele serii (sets >= 2)
        if (exercise.sets && exercise.sets >= 2) {
          // Rozwij na serie
          for (let i = 1; i <= exercise.sets; i++) {
            // Dodaj ćwiczenie dla danej serii
            const seriesExercise = {
              ...exercise,
              name: `${exercise.name} seria ${i}/${exercise.sets}`,
              // Usuń pole sets z pojedynczego ćwiczenia (już rozwinięte)
              sets: undefined
            };

            // Dla ćwiczeń na powtórzenia - użyj reps jako details dla wyświetlenia
            if (exercise.type === 'reps' && exercise.reps) {
              seriesExercise.details = `${exercise.reps} powtórzeń`;
            }

            expandedExercises.push(seriesExercise);

            // Dodaj odpoczynek między seriami (nie po ostatniej)
            if (i < exercise.sets) {
              const restDuration = exercise.restBetweenSets || 30; // domyślnie 30s
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
          // Zachowaj ćwiczenie bez zmian (pojedyncze lub sets < 2)
          // Zapewnij kompatybilność wsteczną dla starych ćwiczeń z details zamiast reps
          const singleExercise = { ...exercise };

          // Jeśli ma reps ale nie ma details, stwórz details
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
   * Inicjalizacja silnika treningów
   */
  function initWorkoutEngine(showScreen, state) {
    showScreenFn = showScreen;
    _appState = state;

    // Event listenery
    elements.mainButton.addEventListener('click', handleMainButtonClick);
    elements.skipButton.addEventListener('click', handleSkip);
    elements.restartButton.addEventListener('click', handleRestart);
    elements.restartBtn?.addEventListener('click', handleRestartClick);
    elements.restartConfirm?.addEventListener('click', handleRestartConfirm);
    elements.restartCancel?.addEventListener('click', handleRestartCancel);

    // Wskazówka o wygaszaniu ekranu
    setupWorkoutScreenTipListeners();

    // Zwolnij Wake Lock przy opuszczeniu strony
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  /**
   * Rozpoczyna trening
   */
  function startWorkout(workoutData, filename) {
    // Rozwij ćwiczenia z wieloma seriami przed rozpoczęciem treningu
    const expandedWorkoutData = {
      ...workoutData,
      phases: expandExerciseSets(workoutData.phases)
    };

    workoutState.data = expandedWorkoutData;
    workoutState.filename = filename;
    workoutState.currentPhaseIndex = 0;
    workoutState.currentExerciseIndex = 0;

    // Sprawdź zapisany postęp
    const savedProgress = loadProgress();
    if (savedProgress && savedProgress.filename === filename) {
      workoutState.currentPhaseIndex = savedProgress.currentPhaseIndex;
      workoutState.currentExerciseIndex = savedProgress.currentExerciseIndex;
    }

    // Aktywuj Wake Lock
    requestWakeLock();

    displayExercise();
  }

  /**
   * Wyświetla aktualne ćwiczenie
   */
  function displayExercise() {
    const phase = getCurrentPhase();
    const exercise = getCurrentExercise();

    if (!phase || !exercise) {
      // Koniec treningu
      finishWorkout();
      return;
    }

    // WAŻNE: Zatrzymaj poprzedni timer jeśli jeszcze działa
    if (workoutState.timerInterval) {
      clearInterval(workoutState.timerInterval);
      workoutState.timerInterval = null;
    }

    // Aktualizuj UI
    elements.phase.textContent = phase.name;
    elements.exerciseName.textContent = exercise.name;
    elements.exerciseDescription.textContent = exercise.description || '';

    // Reset przycisku
    resetMainButton();

    const isRest = isRestExercise();

    if (exercise.type === 'time') {
      // Ćwiczenie na czas
      workoutState.timeLeft = exercise.duration;
      const detailsText = exercise.details
        ? `${exercise.duration}s. ${exercise.details}`
        : `${exercise.duration} sekund`;
      elements.exerciseDetails.textContent = detailsText;
      elements.buttonText.textContent = 'URUCHOM STOPER';
      elements.buttonIcon.innerHTML = icons.timer;

      // Automatycznie uruchom timer dla wszystkich ćwiczeń czasowych (tylko jeśli nie działa już)
      if (!workoutState.timerInterval) {
        setTimeout(() => {
          // Sprawdź ponownie czy timer nie został już uruchomiony
          if (!workoutState.timerInterval) {
            startTimer();
          }
        }, 100);
      }

      // Dla odpoczynku: zmień UI przycisku "Pomiń" na bardziej widoczny
      if (isRest) {
        updateSkipButtonForRest(true);
      } else {
        // Przywróć normalny wygląd przycisku "Pomiń"
        updateSkipButtonForRest(false);
      }
    } else if (exercise.type === 'reps') {
      // Ćwiczenie na powtórzenia
      elements.exerciseDetails.textContent = exercise.details || 'Wykonaj ćwiczenie';
      elements.buttonText.textContent = 'ZROBIONE! (Dalej)';
      elements.buttonIcon.innerHTML = icons.next;

      // Przywróć normalny wygląd przycisku "Pomiń"
      updateSkipButtonForRest(false);
    }

    // Zapisz postęp
    saveProgress();
  }

  /**
   * Pobiera aktualną fazę
   */
  function getCurrentPhase() {
    return workoutState.data.phases[workoutState.currentPhaseIndex];
  }

  /**
   * Pobiera aktualne ćwiczenie
   */
  function getCurrentExercise() {
    const phase = getCurrentPhase();
    if (!phase) return null;
    return phase.exercises[workoutState.currentExerciseIndex];
  }

  /**
   * Sprawdza czy aktualne ćwiczenie to odpoczynek
   * @returns {boolean} true jeśli to odpoczynek
   */
  function isRestExercise() {
    const exercise = getCurrentExercise();
    if (!exercise) return false;

    // Odpoczynek to ćwiczenie czasowe o nazwie "Odpoczynek"
    return exercise.type === 'time' && exercise.name === 'Odpoczynek';
  }

  /**
   * Resetuje główny przycisk do stanu początkowego
   */
  function resetMainButton() {
    elements.mainButton.disabled = false;
    elements.mainButton.className =
      'w-full bg-green-600 hover:bg-green-700 text-white font-bold py-6 px-6 rounded-lg text-2xl transition shadow-lg flex items-center justify-center';
  }

  /**
   * Zmienia wygląd przycisku "Pomiń" w zależności czy to odpoczynek
   * @param {boolean} isRest - czy aktualne ćwiczenie to odpoczynek
   */
  function updateSkipButtonForRest(isRest) {
    if (!elements.skipButton) return;

    if (isRest) {
      // Dla odpoczynku: większy, bardziej widoczny przycisk w kolorze pomarańczowym
      elements.skipButton.className =
        'w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-lg text-xl transition shadow-lg';
      elements.skipButton.innerHTML = '⏭️ Pomiń odpoczynek';
    } else {
      // Normalny przycisk "Pomiń ćwiczenie" (szary, mniejszy)
      elements.skipButton.className =
        'w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition';
      elements.skipButton.textContent = 'Pomiń ćwiczenie';
    }
  }

  /**
   * Obsługuje kliknięcie głównego przycisku
   */
  function handleMainButtonClick() {
    const exercise = getCurrentExercise();

    if (exercise.type === 'reps') {
      // Dla ćwiczeń na powtórzenia - przejdź dalej
      nextExercise();
    } else if (exercise.type === 'time') {
      // Dla ćwiczeń na czas - uruchom timer
      if (!workoutState.timerInterval) {
        startTimer();
      }
    }
  }

  /**
   * Uruchamia timer
   */
  function startTimer() {
    // Zablokuj przycisk
    elements.mainButton.disabled = true;
    elements.mainButton.className =
      'w-full bg-gray-500 cursor-not-allowed text-white font-bold py-6 px-6 rounded-lg text-2xl transition shadow-lg flex items-center justify-center';

    workoutState.timerInterval = setInterval(() => {
      workoutState.timeLeft--;
      elements.buttonText.textContent = `${workoutState.timeLeft} s`;

      if (workoutState.timeLeft <= 0) {
        // Timer zakończony
        clearInterval(workoutState.timerInterval);
        workoutState.timerInterval = null;
        timerFinished();
      } else if (workoutState.timeLeft <= 5) {
        // Ostatnie 5 sekund - czerwony, pulsujący
        elements.mainButton.className =
          'w-full bg-red-600 text-white font-bold py-6 px-6 rounded-lg text-2xl shadow-lg flex items-center justify-center pulse-red-animate';
      }
    }, 1000);
  }

  /**
   * Obsługuje zakończenie timera
   */
  function timerFinished() {
    playTimerEndSound();

    // Zmień przycisk na "Gotowe"
    elements.mainButton.disabled = false;
    elements.mainButton.className =
      'w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 px-6 rounded-lg text-2xl transition shadow-lg flex items-center justify-center';
    elements.buttonText.textContent = 'GOTOWE! (Dalej)';
    elements.buttonIcon.innerHTML = icons.check;

    // Zmień funkcję przycisku na "następne ćwiczenie"
    elements.mainButton.onclick = () => {
      elements.mainButton.onclick = handleMainButtonClick; // Przywróć domyślną funkcję
      nextExercise();
    };
  }

  /**
   * Przechodzi do następnego ćwiczenia
   */
  function nextExercise() {
    const phase = getCurrentPhase();

    workoutState.currentExerciseIndex++;

    // Sprawdź, czy koniec fazy
    if (workoutState.currentExerciseIndex >= phase.exercises.length) {
      // Przejdź do następnej fazy
      workoutState.currentPhaseIndex++;
      workoutState.currentExerciseIndex = 0;
    }

    displayExercise();
  }

  /**
   * Pomija aktualne ćwiczenie
   */
  function handleSkip() {
    // Zatrzymaj timer jeśli działa
    if (workoutState.timerInterval) {
      clearInterval(workoutState.timerInterval);
      workoutState.timerInterval = null;
    }

    // Przywróć domyślną funkcję przycisku
    elements.mainButton.onclick = handleMainButtonClick;

    nextExercise();
  }

  /**
   * Kończy trening
   */
  function finishWorkout() {
    // Zwolnij Wake Lock
    releaseWakeLock();

    // Wyczyść zapisany postęp
    localStorage.removeItem('currentSession');

    showScreenFn('workout-end');
  }

  /**
   * Restartuje trening od początku
   */
  function handleRestart() {
    startWorkout(workoutState.data, workoutState.filename);
    showScreenFn('workout');
  }

  /**
   * Zapisuje postęp treningu
   */
  function saveProgress() {
    const progress = {
      type: 'workout',
      filename: workoutState.filename,
      currentPhaseIndex: workoutState.currentPhaseIndex,
      currentExerciseIndex: workoutState.currentExerciseIndex,
      timestamp: Date.now()
    };

    localStorage.setItem('currentSession', JSON.stringify(progress));
  }

  /**
   * Wczytuje zapisany postęp
   */
  function loadProgress() {
    const saved = localStorage.getItem('currentSession');
    if (!saved) return null;

    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }

  /**
   * Aktywuje Wake Lock (zapobiega wygaszaniu ekranu)
   * Używa centralnego wakeLockManager
   */
  async function requestWakeLock() {
    if (window.wakeLockManager && window.wakeLockManager.isSupported()) {
      await window.wakeLockManager.addReference('workout');
    }
  }

  /**
   * Zwalnia Wake Lock
   * Używa centralnego wakeLockManager
   */
  async function releaseWakeLock() {
    if (window.wakeLockManager && window.wakeLockManager.isSupported()) {
      await window.wakeLockManager.removeReference('workout');
    }
  }

  /**
   * Obsługuje zmianę widoczności strony
   * UWAGA: Obsługa visibilitychange jest teraz w centralnym wakeLockManager (js/wake-lock.js)
   * Ta funkcja jest zachowana dla kompatybilności, ale nie jest już potrzebna.
   */
  function handleVisibilityChange() {
    // Centralna obsługa w wakeLockManager automatycznie reaktywuje blokadę
    // gdy dokument staje się widoczny i są aktywne referencje
  }

  /**
   * Obsługuje kliknięcie przycisku restart - pokazuje dialog potwierdzenia
   */
  function handleRestartClick() {
    if (elements.restartDialog) {
      // Oznacz że restart został wywołany z treningu
      elements.restartDialog.dataset.source = 'workout';
      elements.restartDialog.classList.remove('hidden');
    }
  }

  /**
   * Obsługuje potwierdzenie restartu - rozpoczyna trening od nowa
   */
  function handleRestartConfirm() {
    // Sprawdź czy dialog został wywołany z treningu
    if (elements.restartDialog && elements.restartDialog.dataset.source !== 'workout') {
      return; // To nie nasz restart
    }

    // Ukryj dialog
    if (elements.restartDialog) {
      elements.restartDialog.classList.add('hidden');
      delete elements.restartDialog.dataset.source;
    }

    // Sprawdź czy mamy dane treningu
    if (!workoutState.data) {
      console.error('❌ Brak danych treningu do restartu');
      return;
    }

    // Zatrzymaj timer jeśli działa
    if (workoutState.timerInterval) {
      clearInterval(workoutState.timerInterval);
      workoutState.timerInterval = null;
    }

    // Przywróć domyślną funkcję przycisku
    elements.mainButton.onclick = handleMainButtonClick;

    // Wyczyść zapisany postęp
    localStorage.removeItem('currentSession');

    // Rozpocznij trening od początku
    workoutState.currentPhaseIndex = 0;
    workoutState.currentExerciseIndex = 0;

    displayExercise();
  }

  /**
   * Obsługuje anulowanie restartu - ukrywa dialog
   */
  function handleRestartCancel() {
    // Sprawdź czy dialog został wywołany z treningu
    if (elements.restartDialog && elements.restartDialog.dataset.source !== 'workout') {
      return; // To nie nasz restart
    }

    if (elements.restartDialog) {
      elements.restartDialog.classList.add('hidden');
      delete elements.restartDialog.dataset.source;
    }
  }

  /**
   * Wykrywa czy to urządzenie mobilne (Android/iOS)
   */
  function isMobileDevice() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    // Sprawdź Android
    if (/android/i.test(userAgent)) {
      return true;
    }
    // Sprawdź iOS
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
      return true;
    }
    // Sprawdź touch support (dodatkowa heurystyka)
    const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isSmallScreen = window.innerWidth <= 768;
    return hasTouchScreen && isSmallScreen;
  }

  /**
   * Konfiguracja event listeners dla wskazówki o wygaszaniu ekranu (workout)
   */
  function setupWorkoutScreenTipListeners() {
    const screenTip = document.getElementById('workout-screen-timeout-tip');

    // Ukryj wskazówkę na desktopie (nie dotyczy)
    if (!isMobileDevice() && screenTip) {
      screenTip.classList.add('hidden');
      return;
    }

    // Sprawdź czy użytkownik już ukrył wskazówkę
    const tipDismissed = localStorage.getItem('workoutScreenTipDismissed');
    if (tipDismissed === 'true' && screenTip) {
      screenTip.classList.add('hidden');
    }

    // Przycisk zamknięcia (X) - ukrywa tylko tymczasowo
    const closeBtn = document.getElementById('close-workout-screen-tip');
    closeBtn?.addEventListener('click', () => {
      if (screenTip) {
        screenTip.classList.add('hidden');
      }
    });

    // Przycisk "Rozumiem, nie pokazuj więcej" - ukrywa na stałe
    const dismissBtn = document.getElementById('dismiss-workout-screen-tip');
    dismissBtn?.addEventListener('click', () => {
      if (screenTip) {
        screenTip.classList.add('hidden');
        localStorage.setItem('workoutScreenTipDismissed', 'true');
      }
    });
  }

  // ============================================
  // EXPORTS (Global scope for non-module usage)
  // ============================================

  window.initWorkoutEngine = initWorkoutEngine;
  window.startWorkout = startWorkout;

  console.log('✅ Workout engine initialized');
})(); // End of IIFE
