/**
 * Silnik treningów
 * Obsługuje renderowanie i logikę treningów z timerem i Wake Lock API
 */

import { playTimerEndSound } from './audio.js';

let showScreenFn = null;
let appState = null;

// Stan treningu
const workoutState = {
  data: null,
  filename: null,
  currentPhaseIndex: 0,
  currentExerciseIndex: 0,
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
  
  // Ekran końcowy
  restartButton: document.getElementById('workout-restart'),
  homeButton: document.getElementById('workout-home')
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
export function initWorkoutEngine(showScreen, state) {
  showScreenFn = showScreen;
  appState = state;
  
  // Event listenery
  elements.mainButton.addEventListener('click', handleMainButtonClick);
  elements.skipButton.addEventListener('click', handleSkip);
  elements.restartButton.addEventListener('click', handleRestart);
  
  // Zwolnij Wake Lock przy opuszczeniu strony
  document.addEventListener('visibilitychange', handleVisibilityChange);
}

/**
 * Rozpoczyna trening
 */
export function startWorkout(workoutData, filename) {
  workoutState.data = workoutData;
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
  
  // Aktualizuj UI
  elements.phase.textContent = phase.name;
  elements.exerciseName.textContent = exercise.name;
  elements.exerciseDescription.textContent = exercise.description || '';
  
  // Reset przycisku
  resetMainButton();
  
  if (exercise.type === 'time') {
    // Ćwiczenie na czas
    workoutState.timeLeft = exercise.duration;
    const detailsText = exercise.details ? `${exercise.duration}s. ${exercise.details}` : `${exercise.duration} sekund`;
    elements.exerciseDetails.textContent = detailsText;
    elements.buttonText.textContent = 'URUCHOM STOPER';
    elements.buttonIcon.innerHTML = icons.timer;
  } else if (exercise.type === 'reps') {
    // Ćwiczenie na powtórzenia
    elements.exerciseDetails.textContent = exercise.details || 'Wykonaj ćwiczenie';
    elements.buttonText.textContent = 'ZROBIONE! (Dalej)';
    elements.buttonIcon.innerHTML = icons.next;
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
 * Resetuje główny przycisk do stanu początkowego
 */
function resetMainButton() {
  elements.mainButton.disabled = false;
  elements.mainButton.className = 'w-full bg-green-600 hover:bg-green-700 text-white font-bold py-6 px-6 rounded-lg text-2xl transition shadow-lg flex items-center justify-center';
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

