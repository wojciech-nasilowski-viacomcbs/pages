/**
 * Silnik treningów
 * Obsługuje renderowanie i logikę treningów z timerem i Wake Lock API
 */

(function() {
'use strict';

let showScreenFn = null;
let appState = null;

// Stan treningu
const workoutState = {
  data: null,
  filename: null,
  currentPhaseIndex: 0,
  currentExerciseIndex: 0,
  currentSet: 1,
  totalSets: 1,
  timerInterval: null,
  timeLeft: 0,
  wakeLock: null
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
  skipAllButton: document.getElementById('workout-skip-all-button'),
  restartBtn: document.getElementById('workout-restart-btn'),
  restIndicator: document.getElementById('workout-rest-indicator'),
  
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
 * Inicjalizacja silnika treningów
 */
function initWorkoutEngine(showScreen, state) {
  showScreenFn = showScreen;
  appState = state;
  
  // Event listenery
  elements.mainButton.addEventListener('click', handleMainButtonClick);
  elements.skipButton.addEventListener('click', handleSkip);
  elements.skipAllButton?.addEventListener('click', skipAllSets);
  elements.restartButton.addEventListener('click', handleRestart);
  elements.restartBtn?.addEventListener('click', handleRestartClick);
  elements.restartConfirm?.addEventListener('click', handleRestartConfirm);
  elements.restartCancel?.addEventListener('click', handleRestartCancel);
  
  // Zwolnij Wake Lock przy opuszczeniu strony
  document.addEventListener('visibilitychange', handleVisibilityChange);
}

/**
 * Rozpoczyna trening
 */
function startWorkout(workoutData, filename) {
  workoutState.data = workoutData;
  workoutState.filename = filename;
  workoutState.currentPhaseIndex = 0;
  workoutState.currentExerciseIndex = 0;
  workoutState.currentSet = 0;
  workoutState.totalSets = 1;
  
  // Sprawdź zapisany postęp
  const savedProgress = loadProgress();
  if (savedProgress && savedProgress.filename === filename) {
    workoutState.currentPhaseIndex = savedProgress.currentPhaseIndex;
    workoutState.currentExerciseIndex = savedProgress.currentExerciseIndex;
    workoutState.currentSet = savedProgress.currentSet || 0;
    workoutState.totalSets = savedProgress.totalSets || 1;
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
  
  // Rozróżnienie wizualne dla odpoczynku
  const isRest = exercise.name.toLowerCase().includes('odpoczynek');
  
  // Sprawdź czy to nowe ćwiczenie (nie odpoczynek)
  if (!isRest) {
    // Dla nie-odpoczynku: ustaw totalSets na podstawie details
    const setsFromDetails = parseSetsFromDetails(exercise.details);
    workoutState.totalSets = setsFromDetails;
    
    // Jeśli currentSet === 0, to nowe ćwiczenie, ustaw na 1
    if (workoutState.currentSet === 0) {
      workoutState.currentSet = 1;
    }
  } else {
    // Dla odpoczynku: totalSets zawsze 1
    workoutState.totalSets = 1;
    // currentSet nie ma znaczenia dla odpoczynku, ale ustaw na 1 dla spójności
    if (workoutState.currentSet === 0) {
      workoutState.currentSet = 1;
    }
  }
  
  // Aktualizuj UI
  elements.phase.textContent = phase.name;
  elements.exerciseName.textContent = exercise.name;
  elements.exerciseDescription.textContent = exercise.description || '';
  
  // Pokaż/ukryj wskaźnik odpoczynku
  if (elements.restIndicator) {
    if (isRest) {
      elements.restIndicator.classList.remove('hidden');
    } else {
      elements.restIndicator.classList.add('hidden');
    }
  }
  
  // Reset przycisku
  resetMainButton(isRest);
  
  if (exercise.type === 'time') {
    // Ćwiczenie na czas
    workoutState.timeLeft = exercise.duration;
    let detailsText = '';
    
    if (isRest) {
      // Odpoczynek
      detailsText = `${exercise.duration} sekund przerwy`;
      elements.exerciseDetails.textContent = detailsText;
      elements.buttonText.textContent = 'ROZPOCZNIJ ODPOCZYNEK';
      elements.buttonIcon.innerHTML = icons.timer;
    } else {
      // Normalne ćwiczenie na czas
      if (workoutState.totalSets > 1) {
        detailsText = `Seria ${workoutState.currentSet}/${workoutState.totalSets} - ${exercise.duration}s`;
      } else {
        detailsText = exercise.details ? `${exercise.duration}s. ${exercise.details}` : `${exercise.duration} sekund`;
      }
      elements.exerciseDetails.textContent = detailsText;
      elements.buttonText.textContent = 'URUCHOM STOPER';
      elements.buttonIcon.innerHTML = icons.timer;
    }
  } else if (exercise.type === 'reps') {
    // Ćwiczenie na powtórzenia
    let detailsText = exercise.details || 'Wykonaj ćwiczenie';
    if (workoutState.totalSets > 1) {
      detailsText = `Seria ${workoutState.currentSet}/${workoutState.totalSets} - ${exercise.details || ''}`;
    }
    elements.exerciseDetails.textContent = detailsText;
    elements.buttonText.textContent = 'ZROBIONE! (Dalej)';
    elements.buttonIcon.innerHTML = icons.next;
  }
  
  // Zaktualizuj przyciski pomijania
  updateSkipButtons(isRest);
  
  // Zapisz postęp
  saveProgress();
}

/**
 * Parsuje liczbę serii z tekstu szczegółów ćwiczenia
 * Przykłady: "4 serie × 15 powtórzeń" -> 4, "3 serie" -> 3
 */
function parseSetsFromDetails(details) {
  if (!details) return 1;
  
  // Szukaj wzorca "X serie" lub "X serii"
  const match = details.match(/(\d+)\s*seri[eai]/i);
  if (match) {
    return parseInt(match[1], 10);
  }
  
  return 1;
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
 * Resetuje główny przycisk do stanu początkowego
 */
function resetMainButton(isRest = false) {
  elements.mainButton.disabled = false;
  
  if (isRest) {
    // Kolor pomarańczowy dla odpoczynku
    elements.mainButton.className = 'w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-6 px-6 rounded-lg text-2xl transition shadow-lg flex items-center justify-center';
  } else {
    // Kolor zielony dla normalnych ćwiczeń
    elements.mainButton.className = 'w-full bg-green-600 hover:bg-green-700 text-white font-bold py-6 px-6 rounded-lg text-2xl transition shadow-lg flex items-center justify-center';
  }
}

/**
 * Zaktualizowuje przyciski pomijania w zależności od kontekstu
 */
function updateSkipButtons(isRest) {
  if (!elements.skipButton) return;
  
  if (isRest) {
    // Podczas odpoczynku - "Pomiń odpoczynek"
    elements.skipButton.textContent = 'Pomiń odpoczynek';
  } else if (workoutState.totalSets > 1) {
    // Ćwiczenie z wieloma seriami - "Pomiń serię"
    elements.skipButton.textContent = 'Pomiń serię';
    
    // Pokaż przycisk "Pomiń wszystkie serie"
    if (elements.skipAllButton) {
      elements.skipAllButton.classList.remove('hidden');
      elements.skipAllButton.textContent = `Pomiń wszystkie serie (${workoutState.totalSets - workoutState.currentSet + 1} pozostało)`;
    }
  } else {
    // Ćwiczenie bez serii - "Pomiń ćwiczenie"
    elements.skipButton.textContent = 'Pomiń ćwiczenie';
    
    // Ukryj przycisk "Pomiń wszystkie serie"
    if (elements.skipAllButton) {
      elements.skipAllButton.classList.add('hidden');
    }
  }
  
  // Ukryj "Pomiń wszystkie serie" podczas odpoczynku
  if (isRest && elements.skipAllButton) {
    elements.skipAllButton.classList.add('hidden');
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
  elements.mainButton.className = 'w-full bg-gray-500 cursor-not-allowed text-white font-bold py-6 px-6 rounded-lg text-2xl transition shadow-lg flex items-center justify-center';
  
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
      elements.mainButton.className = 'w-full bg-red-600 text-white font-bold py-6 px-6 rounded-lg text-2xl shadow-lg flex items-center justify-center pulse-red-animate';
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
  elements.mainButton.className = 'w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 px-6 rounded-lg text-2xl transition shadow-lg flex items-center justify-center';
  elements.buttonText.textContent = 'GOTOWE! (Dalej)';
  elements.buttonIcon.innerHTML = icons.check;
  
  // Zmień funkcję przycisku na "następne ćwiczenie"
  elements.mainButton.onclick = () => {
    elements.mainButton.onclick = handleMainButtonClick; // Przywróć domyślną funkcję
    nextExercise();
  };
}

/**
 * Przechodzi do następnego ćwiczenia lub następnej serii
 */
function nextExercise() {
  const phase = getCurrentPhase();
  const exercise = getCurrentExercise();
  const isRest = exercise.name.toLowerCase().includes('odpoczynek');
  
  if (isRest) {
    // Po odpoczynku, wróć do poprzedniego ćwiczenia (które ma wiele serii)
    const prevExerciseIndex = workoutState.currentExerciseIndex - 1;
    if (prevExerciseIndex >= 0) {
      const prevExercise = phase.exercises[prevExerciseIndex];
      const prevExerciseSets = parseSetsFromDetails(prevExercise.details);
      
      // Jeśli poprzednie ćwiczenie ma jeszcze serie, wróć do niego
      if (workoutState.currentSet < prevExerciseSets) {
        workoutState.currentExerciseIndex = prevExerciseIndex;
        workoutState.currentSet++;
        displayExercise();
        return;
      }
    }
    
    // Jeśli nie ma już więcej serii, przejdź do następnego ćwiczenia
    workoutState.currentExerciseIndex++;
    workoutState.currentSet = 0;
    
    // Sprawdź, czy koniec fazy
    if (workoutState.currentExerciseIndex >= phase.exercises.length) {
      workoutState.currentPhaseIndex++;
      workoutState.currentExerciseIndex = 0;
      workoutState.currentSet = 0;
    }
    
    displayExercise();
    return;
  }
  
  // Dla nie-odpoczynku: sprawdź czy ma wiele serii
  if (workoutState.currentSet < workoutState.totalSets) {
    // Ma jeszcze serie - szukaj odpoczynku lub przejdź do następnego
    const nextIndex = workoutState.currentExerciseIndex + 1;
    
    if (nextIndex < phase.exercises.length) {
      const nextExercise = phase.exercises[nextIndex];
      const nextIsRest = nextExercise.name.toLowerCase().includes('odpoczynek');
      
      if (nextIsRest) {
        // Następne to odpoczynek - przejdź do niego
        workoutState.currentExerciseIndex = nextIndex;
        displayExercise();
        return;
      }
    }
    
    // Brak odpoczynku - przejdź do następnej serii bezpośrednio
    workoutState.currentSet++;
    displayExercise();
    return;
  }
  
  // Wszystkie serie zakończone, przejdź do następnego ćwiczenia
  workoutState.currentExerciseIndex++;
  workoutState.currentSet = 0;
  
  // Pomiń odpoczynek jeśli to następne ćwiczenie (bo nie ma już serii do wykonania)
  if (workoutState.currentExerciseIndex < phase.exercises.length) {
    const nextExercise = phase.exercises[workoutState.currentExerciseIndex];
    if (nextExercise.name.toLowerCase().includes('odpoczynek')) {
      workoutState.currentExerciseIndex++;
    }
  }
  
  // Sprawdź, czy koniec fazy
  if (workoutState.currentExerciseIndex >= phase.exercises.length) {
    workoutState.currentPhaseIndex++;
    workoutState.currentExerciseIndex = 0;
    workoutState.currentSet = 0;
  }
  
  displayExercise();
}

/**
 * Pomija aktualny krok (odpoczynek lub serię)
 */
function handleSkip() {
  // Zatrzymaj timer jeśli działa
  if (workoutState.timerInterval) {
    clearInterval(workoutState.timerInterval);
    workoutState.timerInterval = null;
  }
  
  // Przywróć domyślną funkcję przycisku
  elements.mainButton.onclick = handleMainButtonClick;
  
  const exercise = getCurrentExercise();
  const isRest = exercise.name.toLowerCase().includes('odpoczynek');
  
  if (isRest) {
    // Pomijanie odpoczynku - przejdź do następnej serii
    nextExercise();
  } else {
    // Pomijanie serii - przejdź do odpoczynku lub następnej serii
    nextExercise();
  }
}

/**
 * Pomija wszystkie pozostałe serie bieżącego ćwiczenia
 */
function skipAllSets() {
  // Zatrzymaj timer jeśli działa
  if (workoutState.timerInterval) {
    clearInterval(workoutState.timerInterval);
    workoutState.timerInterval = null;
  }
  
  // Przywróć domyślną funkcję przycisku
  elements.mainButton.onclick = handleMainButtonClick;
  
  const phase = getCurrentPhase();
  const exercise = getCurrentExercise();
  const isRest = exercise.name.toLowerCase().includes('odpoczynek');
  
  if (isRest) {
    // Jeśli jesteśmy na odpoczynku, pomiń wszystkie pozostałe serie poprzedniego ćwiczenia
    workoutState.currentExerciseIndex++;
    workoutState.currentSet = 0;
    
    // Pomiń odpoczynek jeśli następne ćwiczenie to odpoczynek
    if (workoutState.currentExerciseIndex < phase.exercises.length) {
      const nextExercise = phase.exercises[workoutState.currentExerciseIndex];
      if (nextExercise.name.toLowerCase().includes('odpoczynek')) {
        workoutState.currentExerciseIndex++;
      }
    }
  } else {
    // Pomiń wszystkie serie - przejdź do następnego ćwiczenia
    workoutState.currentExerciseIndex++;
    workoutState.currentSet = 0;
    
    // Pomiń odpoczynek jeśli następne ćwiczenie to odpoczynek
    if (workoutState.currentExerciseIndex < phase.exercises.length) {
      const nextExercise = phase.exercises[workoutState.currentExerciseIndex];
      if (nextExercise.name.toLowerCase().includes('odpoczynek')) {
        workoutState.currentExerciseIndex++;
      }
    }
  }
  
  // Sprawdź, czy koniec fazy
  if (workoutState.currentExerciseIndex >= phase.exercises.length) {
    workoutState.currentPhaseIndex++;
    workoutState.currentExerciseIndex = 0;
    workoutState.currentSet = 0;
  }
  
  displayExercise();
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
    currentSet: workoutState.currentSet,
    totalSets: workoutState.totalSets,
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
 */
async function requestWakeLock() {
  if (!('wakeLock' in navigator)) {
    console.warn('Wake Lock API nie jest dostępne w tej przeglądarce');
    return;
  }
  
  try {
    workoutState.wakeLock = await navigator.wakeLock.request('screen');
    console.log('✅ Wake Lock aktywny - ekran nie zgaśnie');
    
    // Obsługa zwolnienia Wake Lock
    workoutState.wakeLock.addEventListener('release', () => {
      console.log('Wake Lock zwolniony');
    });
  } catch (err) {
    console.error('Nie udało się aktywować Wake Lock:', err);
  }
}

/**
 * Zwalnia Wake Lock
 */
function releaseWakeLock() {
  if (workoutState.wakeLock) {
    workoutState.wakeLock.release();
    workoutState.wakeLock = null;
    console.log('Wake Lock zwolniony');
  }
}

/**
 * Obsługuje zmianę widoczności strony
 * Ponownie aktywuje Wake Lock gdy użytkownik wraca do karty
 */
function handleVisibilityChange() {
  if (document.visibilityState === 'visible' && appState.currentView === 'workout') {
    // Strona ponownie widoczna i jesteśmy w treningu
    if (!workoutState.wakeLock) {
      requestWakeLock();
    }
  }
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
  workoutState.currentSet = 0;
  workoutState.totalSets = 1;
  
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



// ============================================
// EXPORTS (Global scope for non-module usage)
// ============================================

window.initWorkoutEngine = initWorkoutEngine;
window.startWorkout = startWorkout;

console.log("✅ Workout engine initialized");

})(); // End of IIFE
