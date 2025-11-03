/**
 * @fileoverview Bridge module - eksportuje ES6 engines do window dla IIFE modules
 *
 * TODO-PHASE-6: Ten plik będzie usunięty po konwersji app.js, ui-manager.js, content-manager.js do ES6
 *
 * Obecnie potrzebny bo:
 * - app.js (IIFE) wywołuje window.initQuizEngine()
 * - ui-manager.js (IIFE) wywołuje window.showListeningList()
 * - content-manager.js (IIFE) wywołuje window.startQuiz(), window.startWorkout()
 */

import { initQuizEngine, startQuiz, resetMistakes } from './engines/quiz-engine.js';

import { initWorkoutEngine, startWorkout } from './engines/workout-engine.js';

import {
  initListeningEngine,
  showListeningList,
  getListeningEngineInstance
} from './engines/listening-engine.js';

// Eksportuj do window dla IIFE modules
if (typeof window !== 'undefined') {
  // Quiz Engine
  window.initQuizEngine = initQuizEngine;
  window.startQuiz = startQuiz;
  window.resetMistakes = resetMistakes;

  // Workout Engine
  window.initWorkoutEngine = initWorkoutEngine;
  window.startWorkout = startWorkout;

  // Listening Engine
  window.initListeningEngine = initListeningEngine;
  window.showListeningList = showListeningList;

  // Listening Engine instance (dla loadAndStartListening)
  // Będzie dostępny po inicjalizacji
  Object.defineProperty(window, 'listeningEngine', {
    get() {
      return getListeningEngineInstance();
    }
  });

  console.log('✅ Engines bridge loaded (IIFE compatibility)');
}
