/**
 * @fileoverview Silnik quizów - wersja ES6 Class
 * Refactored w FAZIE 3.2 - dziedziczenie po BaseEngine
 * Obsługuje wszystkie typy pytań: single-choice, multiple-choice, true-false, fill-in-blank
 */

import { BaseEngine } from './base-engine.js';
import { playCorrectSound, playIncorrectSound } from '../audio.js';

/**
 * Silnik quizów
 * @extends BaseEngine
 */
export class QuizEngine extends BaseEngine {
  /**
   * @param {Object} elements - Referencje do elementów DOM
   * @param {Function} showScreenFn - Funkcja do zmiany ekranów
   * @param {Object} appState - Globalny stan aplikacji
   */
  constructor(elements, showScreenFn, appState) {
    super('quiz', elements);

    this.showScreenFn = showScreenFn;
    this.appState = appState;

    // Stan quizu (lokalny)
    this.quizState = {
      data: null,
      filename: null,
      currentQuestionIndex: 0,
      score: 0,
      answers: [],
      isAnswered: false,
      questionOrder: null,
      mistakeQuestions: [],
      originalQuestions: null,
      isMistakesOnlyMode: false
    };
  }

  // ========== LIFECYCLE METHODS (BaseEngine implementation) ==========

  /**
   * Inicjalizacja silnika quizów
   * @override
   */
  init() {
    this.log('Initializing...');

    // Sprawdź czy elementy DOM istnieją
    if (!this.elements.quizOptions) {
      this.error('Required DOM elements not found');
      return;
    }

    // Pobierz dodatkowe elementy DOM
    this._initDOMElements();

    // Dodaj event listenery
    this._attachEventListeners();

    this.isInitialized = true;
    this.log('Initialized successfully');
  }

  /**
   * Rozpocznij quiz
   * @override
   * @param {Object} quizData - Dane quizu
   * @param {string} filename - Nazwa pliku quizu
   * @param {Object} [options={}] - Opcje (mistakesOnly, randomize, skipListening)
   */
  start(quizData, filename, options = {}) {
    this.ensureInitialized();

    this.log('Starting quiz:', quizData.title);

    // Reset stanu
    this.quizState = {
      data: quizData,
      filename: filename,
      currentQuestionIndex: 0,
      score: 0,
      answers: [],
      isAnswered: false,
      questionOrder: null,
      mistakeQuestions: [],
      originalQuestions: null,
      isMistakesOnlyMode: options.mistakesOnly || false
    };

    this._setCurrentData(quizData, filename);

    // Pokaż opcje quizu lub rozpocznij od razu
    if (options.mistakesOnly) {
      this._startQuizDirectly(options);
    } else {
      this._showQuizOptions();
    }
  }

  /**
   * Zatrzymaj quiz
   * @override
   */
  stop() {
    this.log('Stopping...');

    // Reset stanu
    this.quizState = {
      data: null,
      filename: null,
      currentQuestionIndex: 0,
      score: 0,
      answers: [],
      isAnswered: false,
      questionOrder: null,
      mistakeQuestions: [],
      originalQuestions: null,
      isMistakesOnlyMode: false
    };

    this._clearState();

    // Ukryj ekran quizu
    if (this.showScreenFn && this.appState) {
      this.showScreenFn('main', this.appState, this.elements);
    }
  }

  /**
   * Restart quizu
   * @override
   */
  restart() {
    this.log('Restarting...');

    if (this.quizState.data && this.quizState.filename) {
      const data = this.quizState.data;
      const filename = this.quizState.filename;
      const isMistakesMode = this.quizState.isMistakesOnlyMode;

      this.stop();
      this.start(data, filename, { mistakesOnly: isMistakesMode });
    } else {
      this.warn('Cannot restart - no quiz data');
    }
  }

  /**
   * Pobierz postęp quizu
   * @override
   * @returns {Object} - { current, total, percentage }
   */
  getProgress() {
    const questions = this._getCurrentQuestions();
    const current = this.quizState.currentQuestionIndex + 1;
    const total = questions.length;
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

    return { current, total, percentage };
  }

  // ========== PUBLIC API ==========

  /**
   * Resetuje listę błędów
   */
  resetMistakes() {
    this.quizState.mistakeQuestions = [];
    this.quizState.originalQuestions = null;
    this.quizState.isMistakesOnlyMode = false;
    this.log('Mistakes reset');
  }

  // ========== PRIVATE METHODS ==========

  /**
   * Inicjalizuje elementy DOM
   * @private
   */
  _initDOMElements() {
    // Elementy już przekazane w konstruktorze, ale możemy dodać więcej jeśli potrzeba
    this.elements = {
      ...this.elements,
      // Opcje quizu
      quizOptions: document.getElementById('quiz-options'),
      quizTitle: document.getElementById('quiz-title'),
      quizHeader: document.getElementById('quiz-header'),
      quizQuestionContainer: document.getElementById('quiz-question-container'),
      randomizeCheckbox: document.getElementById('quiz-randomize'),
      skipListeningCheckbox: document.getElementById('quiz-skip-listening'),
      startButton: document.getElementById('quiz-start-btn'),
      restartButton: document.getElementById('quiz-restart-btn'),

      // Quiz
      progress: document.getElementById('quiz-progress'),
      scoreDisplay: document.getElementById('quiz-score'),
      progressBar: document.getElementById('quiz-progress-bar'),
      question: document.getElementById('quiz-question'),
      answersContainer: document.getElementById('quiz-answers'),
      feedback: document.getElementById('quiz-feedback'),
      nextButton: document.getElementById('quiz-next'),

      // Podsumowanie
      finalScore: document.getElementById('quiz-final-score'),
      finalDetails: document.getElementById('quiz-final-details'),
      mistakesInfo: document.getElementById('quiz-mistakes-info'),
      retryButton: document.getElementById('quiz-retry'),
      retryMistakesButton: document.getElementById('quiz-retry-mistakes'),
      homeButton: document.getElementById('quiz-home'),

      // Dialogi
      restartDialog: document.getElementById('restart-dialog'),
      restartConfirm: document.getElementById('restart-confirm'),
      restartCancel: document.getElementById('restart-cancel')
    };
  }

  /**
   * Dodaje event listenery
   * @private
   */
  _attachEventListeners() {
    this.elements.startButton?.addEventListener('click', () => this._handleStartQuiz());
    this.elements.nextButton?.addEventListener('click', () => this._handleNextQuestion());
    this.elements.retryButton?.addEventListener('click', () => this._handleRetry());
    this.elements.retryMistakesButton?.addEventListener('click', () => this._handleRetryMistakes());
    this.elements.restartButton?.addEventListener('click', () => this._handleRestartClick());
    this.elements.restartConfirm?.addEventListener('click', () => this._handleRestartConfirm());
    this.elements.restartCancel?.addEventListener('click', () => this._handleRestartCancel());
    this.elements.homeButton?.addEventListener('click', () => this.stop());
  }

  /**
   * Pokazuje opcje quizu
   * @private
   */
  _showQuizOptions() {
    this.elements.quizTitle.textContent = this.quizState.data.title;
    this.elements.quizOptions.classList.remove('hidden');
    this.elements.quizQuestionContainer.classList.add('hidden');
  }

  /**
   * Rozpoczyna quiz bezpośrednio (bez opcji)
   * @private
   * @param {Object} options - Opcje quizu
   */
  _startQuizDirectly(options) {
    const randomize = options.randomize || false;
    const skipListening = options.skipListening || false;

    this._prepareQuestions(randomize, skipListening);
    this._showQuestion();
  }

  /**
   * Handler: Start quiz button
   * @private
   */
  _handleStartQuiz() {
    const randomize = this.elements.randomizeCheckbox?.checked || false;
    const skipListening = this.elements.skipListeningCheckbox?.checked || false;

    this._prepareQuestions(randomize, skipListening);

    // Ukryj opcje, pokaż pytania
    this.elements.quizOptions.classList.add('hidden');
    this.elements.quizQuestionContainer.classList.remove('hidden');

    this._showQuestion();
  }

  /**
   * Przygotowuje pytania (losowanie, filtrowanie)
   * @private
   * @param {boolean} randomize - Czy losować kolejność
   * @param {boolean} skipListening - Czy pomijać pytania słuchowe
   */
  _prepareQuestions(randomize, skipListening) {
    let questions = [...this.quizState.data.questions];

    // Filtruj pytania słuchowe jeśli zaznaczono
    if (skipListening) {
      questions = questions.filter(q => q.type !== 'listening');
    }

    // Losuj kolejność jeśli zaznaczono
    if (randomize) {
      const indices = questions.map((_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      this.quizState.questionOrder = indices;
      questions = indices.map(i => questions[i]);
    }

    // Zapisz przygotowane pytania
    this.quizState.data.questions = questions;
  }

  /**
   * Pokazuje obecne pytanie
   * @private
   */
  _showQuestion() {
    const questions = this._getCurrentQuestions();
    const questionIndex = this.quizState.currentQuestionIndex;

    if (questionIndex >= questions.length) {
      this._showSummary();
      return;
    }

    const question = questions[questionIndex];
    this.quizState.isAnswered = false;

    // Update progress
    this._updateProgress();

    // Render pytania
    this._renderQuestion(question);

    // Ukryj feedback i next button
    this.elements.feedback.classList.add('hidden');
    this.elements.nextButton.classList.add('hidden');
  }

  /**
   * Renderuje pytanie (deleguje do specyficznych metod)
   * @private
   * @param {Object} question - Obiekt pytania
   */
  _renderQuestion(question) {
    // Wyczyść poprzednie odpowiedzi
    this.elements.answersContainer.innerHTML = '';
    this.elements.question.textContent = question.question;

    // Deleguj do odpowiedniej metody renderowania
    switch (question.type) {
      case 'single-choice':
        this._renderSingleChoice(question);
        break;
      case 'multiple-choice':
        this._renderMultipleChoice(question);
        break;
      case 'true-false':
        this._renderTrueFalse(question);
        break;
      case 'fill-in-blank':
        this._renderFillInBlank(question);
        break;
      case 'listening':
        this._renderListening(question);
        break;
      default:
        this.error('Unknown question type:', question.type);
    }
  }

  /**
   * Renderuje pytanie single-choice
   * @private
   * @param {Object} question - Pytanie
   */
  _renderSingleChoice(question) {
    question.options.forEach((option, index) => {
      const button = document.createElement('button');
      button.className =
        'quiz-option w-full p-4 text-left bg-white dark:bg-gray-800 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition';
      button.textContent = option;
      button.dataset.index = index;
      button.addEventListener('click', () => this._handleAnswer(index));
      this.elements.answersContainer.appendChild(button);
    });
  }

  /**
   * Renderuje pytanie multiple-choice
   * @private
   * @param {Object} question - Pytanie
   */
  _renderMultipleChoice(question) {
    const selectedAnswers = new Set();

    question.options.forEach((option, index) => {
      const label = document.createElement('label');
      label.className =
        'quiz-option flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition cursor-pointer';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'mr-3 w-5 h-5';
      checkbox.dataset.index = index;
      checkbox.addEventListener('change', e => {
        if (e.target.checked) {
          selectedAnswers.add(index);
        } else {
          selectedAnswers.delete(index);
        }
      });

      const span = document.createElement('span');
      span.textContent = option;

      label.appendChild(checkbox);
      label.appendChild(span);
      this.elements.answersContainer.appendChild(label);
    });

    // Przycisk Submit
    const submitBtn = document.createElement('button');
    submitBtn.className =
      'w-full mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition';
    submitBtn.textContent = 'Sprawdź odpowiedź';
    submitBtn.addEventListener('click', () => {
      this._handleAnswer(Array.from(selectedAnswers));
    });
    this.elements.answersContainer.appendChild(submitBtn);
  }

  /**
   * Renderuje pytanie true-false
   * @private
   * @param {Object} _question - Pytanie (unused)
   */
  _renderTrueFalse(_question) {
    const options = ['Prawda', 'Fałsz'];
    options.forEach((option, index) => {
      const button = document.createElement('button');
      button.className =
        'quiz-option w-full p-4 text-left bg-white dark:bg-gray-800 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition';
      button.textContent = option;
      button.dataset.index = index;
      button.addEventListener('click', () => this._handleAnswer(index === 0));
      this.elements.answersContainer.appendChild(button);
    });
  }

  /**
   * Renderuje pytanie fill-in-blank
   * @private
   * @param {Object} _question - Pytanie (unused)
   */
  _renderFillInBlank(_question) {
    const input = document.createElement('input');
    input.type = 'text';
    input.className =
      'w-full p-4 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 dark:bg-gray-800';
    input.placeholder = 'Wpisz odpowiedź...';
    input.addEventListener('keypress', e => {
      if (e.key === 'Enter') {
        this._handleAnswer(input.value.trim());
      }
    });

    const submitBtn = document.createElement('button');
    submitBtn.className =
      'w-full mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition';
    submitBtn.textContent = 'Sprawdź odpowiedź';
    submitBtn.addEventListener('click', () => {
      this._handleAnswer(input.value.trim());
    });

    this.elements.answersContainer.appendChild(input);
    this.elements.answersContainer.appendChild(submitBtn);
    input.focus();
  }

  /**
   * Renderuje pytanie listening
   * @private
   * @param {Object} question - Pytanie
   */
  _renderListening(question) {
    // Play button
    const playBtn = document.createElement('button');
    playBtn.className =
      'w-full mb-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition';
    playBtn.innerHTML = '🔊 Odtwórz nagranie';
    playBtn.addEventListener('click', () => {
      if (window.speakText) {
        window.speakText(question.audioText, question.lang || 'pl-PL');
      }
    });
    this.elements.answersContainer.appendChild(playBtn);

    // Opcje odpowiedzi
    question.options.forEach((option, index) => {
      const button = document.createElement('button');
      button.className =
        'quiz-option w-full p-4 text-left bg-white dark:bg-gray-800 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition';
      button.textContent = option;
      button.dataset.index = index;
      button.addEventListener('click', () => this._handleAnswer(index));
      this.elements.answersContainer.appendChild(button);
    });
  }

  /**
   * Obsługuje odpowiedź użytkownika
   * @private
   * @param {*} userAnswer - Odpowiedź użytkownika
   */
  _handleAnswer(userAnswer) {
    if (this.quizState.isAnswered) return;

    const questions = this._getCurrentQuestions();
    const question = questions[this.quizState.currentQuestionIndex];
    const isCorrect = this._checkAnswer(question, userAnswer);

    this.quizState.isAnswered = true;

    // Zapisz odpowiedź
    this.quizState.answers.push({
      questionIndex: this.quizState.currentQuestionIndex,
      userAnswer,
      correctAnswer: question.correctAnswer,
      isCorrect
    });

    // Update score
    if (isCorrect) {
      this.quizState.score++;
      playCorrectSound();
    } else {
      playIncorrectSound();
      // Dodaj do błędów (jeśli nie jesteśmy już w trybie błędów)
      if (!this.quizState.isMistakesOnlyMode) {
        this.quizState.mistakeQuestions.push(question);
      }
    }

    // Pokaż feedback
    this._showFeedback(isCorrect, question);

    // Pokaż next button
    this.elements.nextButton.classList.remove('hidden');
  }

  /**
   * Sprawdza czy odpowiedź jest poprawna
   * @private
   * @param {Object} question - Pytanie
   * @param {*} userAnswer - Odpowiedź użytkownika
   * @returns {boolean}
   */
  _checkAnswer(question, userAnswer) {
    switch (question.type) {
      case 'single-choice':
      case 'listening':
        return userAnswer === question.correctAnswer;

      case 'multiple-choice': {
        if (!Array.isArray(userAnswer) || !Array.isArray(question.correctAnswer)) {
          return false;
        }
        if (userAnswer.length !== question.correctAnswer.length) {
          return false;
        }
        const sortedUser = [...userAnswer].sort();
        const sortedCorrect = [...question.correctAnswer].sort();
        return sortedUser.every((val, idx) => val === sortedCorrect[idx]);
      }

      case 'true-false':
        return userAnswer === question.correctAnswer;

      case 'fill-in-blank': {
        const userLower = String(userAnswer).toLowerCase().trim();
        const correctLower = String(question.correctAnswer).toLowerCase().trim();
        return userLower === correctLower;
      }

      default:
        return false;
    }
  }

  /**
   * Pokazuje feedback po odpowiedzi
   * @private
   * @param {boolean} isCorrect - Czy odpowiedź poprawna
   * @param {Object} question - Pytanie
   */
  _showFeedback(isCorrect, question) {
    this.elements.feedback.classList.remove('hidden');

    if (isCorrect) {
      this.elements.feedback.className =
        'p-4 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg';
      this.elements.feedback.textContent = '✅ Poprawna odpowiedź!';
    } else {
      this.elements.feedback.className =
        'p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg';
      let correctAnswerText = '';

      if (question.type === 'multiple-choice') {
        const correctOptions = question.correctAnswer.map(i => question.options[i]);
        correctAnswerText = correctOptions.join(', ');
      } else if (question.type === 'single-choice' || question.type === 'listening') {
        correctAnswerText = question.options[question.correctAnswer];
      } else {
        correctAnswerText = String(question.correctAnswer);
      }

      this.elements.feedback.innerHTML = `❌ Niepoprawna odpowiedź!<br>Poprawna odpowiedź: <strong>${correctAnswerText}</strong>`;
    }
  }

  /**
   * Handler: Next question button
   * @private
   */
  _handleNextQuestion() {
    this.quizState.currentQuestionIndex++;
    this._showQuestion();
  }

  /**
   * Pokazuje podsumowanie quizu
   * @private
   */
  _showSummary() {
    const questions = this._getCurrentQuestions();
    const totalQuestions = questions.length;
    const score = this.quizState.score;
    const percentage = Math.round((score / totalQuestions) * 100);

    // Ukryj pytania, pokaż podsumowanie
    this.elements.quizQuestionContainer.classList.add('hidden');

    // Update podsumowanie
    this.elements.finalScore.textContent = `${score} / ${totalQuestions}`;
    this.elements.finalDetails.textContent = `Wynik: ${percentage}%`;

    // Pokaż przycisk "Powtórz błędy" jeśli są błędy
    if (this.quizState.mistakeQuestions.length > 0 && !this.quizState.isMistakesOnlyMode) {
      this.elements.mistakesInfo.classList.remove('hidden');
      this.elements.mistakesInfo.textContent = `Masz ${this.quizState.mistakeQuestions.length} błędnych odpowiedzi`;
      this.elements.retryMistakesButton.classList.remove('hidden');
    } else {
      this.elements.mistakesInfo.classList.add('hidden');
      this.elements.retryMistakesButton.classList.add('hidden');
    }

    this.log(`Quiz completed: ${score}/${totalQuestions} (${percentage}%)`);
  }

  /**
   * Handler: Retry button
   * @private
   */
  _handleRetry() {
    this.restart();
  }

  /**
   * Handler: Retry mistakes button
   * @private
   */
  _handleRetryMistakes() {
    if (this.quizState.mistakeQuestions.length === 0) {
      this.warn('No mistakes to retry');
      return;
    }

    // Zapisz oryginalne pytania
    this.quizState.originalQuestions = this.quizState.data.questions;

    // Ustaw tylko błędne pytania
    this.quizState.data.questions = [...this.quizState.mistakeQuestions];
    this.quizState.mistakeQuestions = [];
    this.quizState.isMistakesOnlyMode = true;

    // Restart
    this.start(this.quizState.data, this.quizState.filename, { mistakesOnly: true });
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
   * Update progress bar
   * @private
   */
  _updateProgress() {
    const progress = this.getProgress();
    this.elements.progress.textContent = `Pytanie ${progress.current} / ${progress.total}`;
    this.elements.scoreDisplay.textContent = `Wynik: ${this.quizState.score}`;

    if (this.elements.progressBar) {
      this.elements.progressBar.style.width = `${progress.percentage}%`;
    }
  }

  /**
   * Pobiera obecne pytania (normalne lub tylko błędy)
   * @private
   * @returns {Array}
   */
  _getCurrentQuestions() {
    return this.quizState.data?.questions || [];
  }
}

// ========== BACKWARD COMPATIBILITY FACADE ==========
// TODO-REFACTOR-CLEANUP: Usunąć w FAZIE 5, Krok 17

let quizEngineInstance = null;

/**
 * Inicjalizuje silnik quizów (backward compatibility)
 * @param {Function} showScreen - Funkcja zmiany ekranu
 * @param {Object} state - Stan aplikacji
 * @returns {QuizEngine}
 */
export function initQuizEngine(showScreen, state) {
  const elements = {}; // Elementy będą pobrane w init()
  quizEngineInstance = new QuizEngine(elements, showScreen, state);
  quizEngineInstance.init();
  return quizEngineInstance;
}

/**
 * Rozpoczyna quiz (backward compatibility)
 * @param {Object} quizData - Dane quizu
 * @param {string} filename - Nazwa pliku
 * @param {boolean} [mistakesOnly=false] - Czy tylko błędy
 */
export function startQuiz(quizData, filename, mistakesOnly = false) {
  if (quizEngineInstance) {
    quizEngineInstance.start(quizData, filename, { mistakesOnly });
  } else {
    console.error('[QUIZ] Engine not initialized');
  }
}

/**
 * Resetuje błędy (backward compatibility)
 */
export function resetMistakes() {
  if (quizEngineInstance) {
    quizEngineInstance.resetMistakes();
  }
}

// TODO-REFACTOR-CLEANUP: Eksport do window (backward compatibility)
if (typeof window !== 'undefined') {
  window.initQuizEngine = initQuizEngine;
  window.startQuiz = startQuiz;
  window.resetMistakes = resetMistakes;
}

console.log('✅ QuizEngine (ES6 Class) loaded');
