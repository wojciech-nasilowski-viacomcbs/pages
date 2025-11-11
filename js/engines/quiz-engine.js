/**
 * @fileoverview Silnik quizów - wersja ES6 Class
 * Refactored w FAZIE 3.2 - dziedziczenie po BaseEngine
 * Obsługuje wszystkie typy pytań: single-choice, multiple-choice, true-false, fill-in-blank
 */

import { BaseEngine } from './base-engine.js';
import { playCorrectSound, playIncorrectSound } from '../utils/audio.js';

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

    // Pobierz elementy DOM
    this._initDOMElements();

    // Sprawdź czy elementy DOM istnieją
    if (!this.elements.quizOptions) {
      this.error('Required DOM elements not found');
      return;
    }

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
    // WAŻNE: NIE filtruj w trybie poprawy błędów - użytkownik musi powtórzyć wszystkie błędne pytania
    if (skipListening && !this.quizState.isMistakesOnlyMode) {
      questions = questions.filter(q => q.type !== 'listening');
      this.log(
        `Filtered out ${this.quizState.data.questions.length - questions.length} listening questions`
      );
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
      this.log('Questions randomized');
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
    // Obsłuż oba pola: questionText (stary format) i question (nowy format)
    this.elements.question.textContent = question.questionText || question.question;

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
      case 'matching':
        this._renderMatching(question);
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
        'quiz-option w-full p-4 text-left bg-gray-800 text-gray-100 rounded-lg hover:bg-gray-700 transition border-2 border-gray-700';
      button.textContent = option;
      button.dataset.index = index;
      button.addEventListener('click', () => this._handleAnswer(index));
      this.elements.answersContainer.appendChild(button);
    });
  }

  /**
   * Renderuje pytanie multiple-choice (wybór JEDNEJ poprawnej odpowiedzi)
   * @private
   * @param {Object} question - Pytanie
   */
  _renderMultipleChoice(question) {
    question.options.forEach((option, index) => {
      const button = document.createElement('button');
      button.className =
        'quiz-option w-full p-4 text-left bg-gray-800 text-gray-100 rounded-lg hover:bg-gray-700 transition border-2 border-gray-700';
      button.textContent = option;
      button.dataset.index = index;
      button.addEventListener('click', () => this._handleAnswer(index));
      this.elements.answersContainer.appendChild(button);
    });
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
        'quiz-option w-full p-4 text-left bg-gray-800 text-gray-100 rounded-lg hover:bg-gray-700 transition border-2 border-gray-700';
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
      'w-full p-4 text-lg border-2 border-gray-600 rounded-lg focus:border-blue-500 bg-gray-700 text-white placeholder-gray-400';
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
   * Renderuje pytanie matching (dopasowywanie)
   * @private
   * @param {Object} question - Pytanie
   */
  _renderMatching(question) {
    // Stwórz tablicę z unikalnymi indeksami dla prawej kolumny (aby obsłużyć duplikaty)
    const rightItemsWithIndex = question.pairs.map((p, idx) => ({
      text: p.match,
      originalIndex: idx
    }));
    // Losowa kolejność
    rightItemsWithIndex.sort(() => Math.random() - 0.5);

    // Instrukcja
    const instruction = document.createElement('div');
    instruction.className = 'text-sm text-gray-400 mb-4';
    instruction.innerHTML = `
      Kliknij element z lewej, a potem odpowiadający mu element z prawej. 
      <span class="text-yellow-400">Kliknij ponownie na dopasowaną parę, aby ją cofnąć.</span>
    `;
    this.elements.answersContainer.appendChild(instruction);

    // Grid container
    const gridContainer = document.createElement('div');
    gridContainer.className = 'grid grid-cols-2 gap-4';

    // Lewa kolumna
    const leftColumn = document.createElement('div');
    leftColumn.className = 'space-y-2';
    question.pairs.forEach((pair, index) => {
      const button = document.createElement('button');
      button.className =
        'matching-left w-full p-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition border-2 border-gray-700 text-left';
      button.dataset.index = index;
      button.textContent = pair.item;
      leftColumn.appendChild(button);
    });

    // Prawa kolumna
    const rightColumn = document.createElement('div');
    rightColumn.className = 'space-y-2';
    rightItemsWithIndex.forEach((item, displayIndex) => {
      const button = document.createElement('button');
      button.className =
        'matching-right w-full p-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition border-2 border-gray-700 text-left';
      button.dataset.rightIndex = displayIndex;
      button.dataset.originalIndex = item.originalIndex;
      button.textContent = item.text;
      rightColumn.appendChild(button);
    });

    gridContainer.appendChild(leftColumn);
    gridContainer.appendChild(rightColumn);
    this.elements.answersContainer.appendChild(gridContainer);

    // Submit button
    const submitContainer = document.createElement('div');
    submitContainer.className = 'mt-4 text-center';
    const submitBtn = document.createElement('button');
    submitBtn.id = 'matching-submit';
    submitBtn.className =
      'bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed';
    submitBtn.textContent = 'Sprawdź odpowiedzi';
    submitBtn.disabled = true;
    submitContainer.appendChild(submitBtn);
    this.elements.answersContainer.appendChild(submitContainer);

    // State
    let selectedLeft = null;
    const userMatches = [];

    const updateSubmitButton = () => {
      if (userMatches.length === question.pairs.length) {
        submitBtn.disabled = false;
      } else {
        submitBtn.disabled = true;
      }
    };

    // Event listeners dla lewej kolumny
    leftColumn.querySelectorAll('.matching-left').forEach(btn => {
      btn.addEventListener('click', () => {
        const leftIndex = parseInt(btn.dataset.index);

        // Sprawdź czy ten element jest już dopasowany
        const existingMatch = userMatches.find(m => m.leftIndex === leftIndex);

        if (existingMatch) {
          // Cofnij dopasowanie
          const matchIndex = userMatches.indexOf(existingMatch);
          userMatches.splice(matchIndex, 1);

          // Odblokuj przyciski
          btn.classList.remove('opacity-50', 'bg-purple-700', 'border-purple-500');
          btn.classList.add('bg-gray-800', 'hover:bg-gray-700');

          const rightBtn = rightColumn.querySelector(
            `.matching-right[data-right-index="${existingMatch.rightIndex}"]`
          );
          rightBtn.classList.remove('opacity-50', 'bg-purple-700', 'border-purple-500');
          rightBtn.classList.add('bg-gray-800', 'hover:bg-gray-700');

          updateSubmitButton();
          return;
        }

        // Jeśli kliknięto ten sam element (zaznaczony, ale nie dopasowany) - odznacz go
        if (selectedLeft === leftIndex) {
          btn.classList.remove(
            'border-blue-400',
            'bg-blue-600',
            'border-4',
            'shadow-lg',
            'shadow-blue-500/50'
          );
          selectedLeft = null;
          return;
        }

        // Odznacz poprzedni
        leftColumn.querySelectorAll('.matching-left').forEach(b => {
          if (!userMatches.find(m => m.leftIndex === parseInt(b.dataset.index))) {
            b.classList.remove(
              'border-blue-400',
              'bg-blue-600',
              'border-4',
              'shadow-lg',
              'shadow-blue-500/50'
            );
          }
        });

        // Zaznacz aktualny
        btn.classList.add(
          'border-blue-400',
          'bg-blue-600',
          'border-4',
          'shadow-lg',
          'shadow-blue-500/50'
        );
        selectedLeft = leftIndex;
      });
    });

    // Event listeners dla prawej kolumny
    rightColumn.querySelectorAll('.matching-right').forEach(btn => {
      btn.addEventListener('click', () => {
        if (selectedLeft === null) return;

        const rightIndex = parseInt(btn.dataset.rightIndex);
        const originalIndex = parseInt(btn.dataset.originalIndex);

        // Sprawdź czy ten element jest już dopasowany
        const existingMatch = userMatches.find(m => m.rightIndex === rightIndex);

        if (existingMatch) {
          // Cofnij dopasowanie
          const matchIndex = userMatches.indexOf(existingMatch);
          userMatches.splice(matchIndex, 1);

          // Odblokuj przyciski
          btn.classList.remove('opacity-50', 'bg-purple-700', 'border-purple-500');
          btn.classList.add('bg-gray-800', 'hover:bg-gray-700');

          const leftBtn = leftColumn.querySelector(
            `.matching-left[data-index="${existingMatch.leftIndex}"]`
          );
          leftBtn.classList.remove('opacity-50', 'bg-purple-700', 'border-purple-500');
          leftBtn.classList.add('bg-gray-800', 'hover:bg-gray-700');

          updateSubmitButton();
          return;
        }

        // Dopasuj
        userMatches.push({
          leftIndex: selectedLeft,
          rightIndex: rightIndex,
          originalIndex: originalIndex
        });

        // Zaznacz jako dopasowane
        const leftBtn = leftColumn.querySelector(`.matching-left[data-index="${selectedLeft}"]`);
        leftBtn.classList.remove(
          'border-blue-400',
          'bg-blue-600',
          'border-4',
          'shadow-lg',
          'shadow-blue-500/50',
          'hover:bg-gray-700'
        );
        leftBtn.classList.add('opacity-50', 'bg-purple-700', 'border-purple-500');

        btn.classList.remove('hover:bg-gray-700');
        btn.classList.add('opacity-50', 'bg-purple-700', 'border-purple-500');

        selectedLeft = null;
        updateSubmitButton();
      });
    });

    // Submit handler
    submitBtn.addEventListener('click', () => {
      // Sprawdź odpowiedzi
      let correctCount = 0;
      userMatches.forEach(match => {
        if (match.leftIndex === match.originalIndex) {
          correctCount++;
        }
      });

      const isCorrect = correctCount === question.pairs.length;

      // Zapisz userMatches do użycia w _highlightAnswers
      this._currentMatchingUserMatches = userMatches;
      this._currentMatchingCorrectCount = correctCount;

      this._handleAnswer(isCorrect);
    });
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
      'w-full mb-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2';
    playBtn.innerHTML = '🔊 Odtwórz nagranie';
    playBtn.addEventListener('click', () => {
      if (window.speakText) {
        window.speakText(
          question.audioText,
          question.audioLang || 'en-US',
          question.audioRate || 0.85
        );
      }
    });
    this.elements.answersContainer.appendChild(playBtn);

    // Info box
    const infoBox = document.createElement('div');
    infoBox.className = 'bg-blue-900/30 border border-blue-700 rounded-lg p-4 mb-4';
    infoBox.innerHTML = `
      <p class="text-blue-200 text-sm">
        🎧 Posłuchaj nagrania i wpisz, co usłyszałeś/aś. Możesz odtworzyć nagranie wielokrotnie.
      </p>
    `;
    this.elements.answersContainer.appendChild(infoBox);

    // Input field
    const input = document.createElement('input');
    input.type = 'text';
    input.className =
      'w-full p-4 rounded-lg bg-gray-700 text-white border-2 border-gray-600 focus:border-blue-500 focus:outline-none text-lg mb-4 placeholder-gray-400';
    input.placeholder = 'Wpisz, co usłyszałeś/aś...';
    input.autocomplete = 'off';
    input.autocorrect = 'off';
    input.autocapitalize = 'off';
    input.spellcheck = false;
    this.elements.answersContainer.appendChild(input);

    // Submit button
    const submitBtn = document.createElement('button');
    submitBtn.className =
      'w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition';
    submitBtn.textContent = 'Sprawdź odpowiedź';
    submitBtn.addEventListener('click', () => {
      const userAnswer = input.value.trim();
      if (userAnswer) {
        this._handleAnswer(userAnswer);
      }
    });
    this.elements.answersContainer.appendChild(submitBtn);

    // Focus input
    input.focus();

    // Enter key support
    input.addEventListener('keypress', e => {
      if (e.key === 'Enter') {
        submitBtn.click();
      }
    });

    // Automatycznie odtwórz nagranie przy pierwszym załadowaniu
    setTimeout(() => {
      if (window.speakText) {
        window.speakText(
          question.audioText,
          question.audioLang || 'en-US',
          question.audioRate || 0.85
        );
      }
    }, 500); // Krótkie opóźnienie dla lepszego UX
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
      // Zapisz błędne pytanie (sprawdź czy już nie jest na liście)
      this._recordMistake(question);
    }

    // Podświetl odpowiedzi (dla pytań z przyciskami)
    this._highlightAnswers(question, userAnswer, isCorrect);

    // Pokaż feedback
    this._showFeedback(isCorrect, question);

    // Pokaż next button
    this.elements.nextButton.classList.remove('hidden');
  }

  /**
   * Podświetla odpowiedzi po udzieleniu odpowiedzi
   * @private
   * @param {Object} question - Pytanie
   * @param {*} userAnswer - Odpowiedź użytkownika
   * @param {boolean} isCorrect - Czy odpowiedź była poprawna
   */
  _highlightAnswers(question, userAnswer, isCorrect) {
    // Obsługa pytań matching (łączenie w pary)
    if (question.type === 'matching') {
      this._highlightMatchingAnswers(question);
      return;
    }

    // Podświetlenie działa tylko dla pytań z przyciskami (single-choice, multiple-choice, true-false)
    if (!['single-choice', 'multiple-choice', 'true-false'].includes(question.type)) {
      return;
    }

    const buttons = this.elements.answersContainer.querySelectorAll('.quiz-option');
    const correctIndex = question.correctAnswer;

    buttons.forEach((btn, index) => {
      btn.disabled = true;

      // Dla true-false: userAnswer to boolean, więc porównujemy inaczej
      if (question.type === 'true-false') {
        const btnAnswer = index === 0; // 0 = Prawda, 1 = Fałsz
        const correctAnswer = question.correctAnswer;

        if (btnAnswer === correctAnswer) {
          // Poprawna odpowiedź - zawsze zielona
          btn.classList.remove(
            'bg-gray-800',
            'bg-gray-700',
            'hover:bg-gray-700',
            'border-gray-700'
          );
          btn.classList.add('!bg-green-600', '!border-green-400');
        } else if (btnAnswer === userAnswer) {
          // Wybrana niepoprawna odpowiedź - czerwona
          btn.classList.remove(
            'bg-gray-800',
            'bg-gray-700',
            'hover:bg-gray-700',
            'border-gray-700'
          );
          btn.classList.add('!bg-red-600', '!border-red-400');
        } else {
          // Pozostałe - przyciemnione
          btn.classList.add('opacity-50');
        }
      } else {
        // Dla single-choice i multiple-choice: userAnswer to index
        if (index === correctIndex) {
          // Poprawna odpowiedź - zawsze zielona
          btn.classList.remove(
            'bg-gray-800',
            'bg-gray-700',
            'hover:bg-gray-700',
            'border-gray-700'
          );
          btn.classList.add('!bg-green-600', '!border-green-400');
        } else if (index === userAnswer) {
          // Wybrana niepoprawna odpowiedź - czerwona
          btn.classList.remove(
            'bg-gray-800',
            'bg-gray-700',
            'hover:bg-gray-700',
            'border-gray-700'
          );
          btn.classList.add('!bg-red-600', '!border-red-400');
        } else {
          // Pozostałe - przyciemnione
          btn.classList.add('opacity-50');
        }
      }
    });
  }

  /**
   * Podświetla odpowiedzi dla pytań matching (łączenie w pary)
   * @private
   * @param {Object} question - Pytanie
   */
  _highlightMatchingAnswers(question) {
    const userMatches = this._currentMatchingUserMatches;
    if (!userMatches) return;

    // Pokoloruj pary
    userMatches.forEach(match => {
      const leftBtn = this.elements.answersContainer.querySelector(
        `.matching-left[data-index="${match.leftIndex}"]`
      );
      const rightBtn = this.elements.answersContainer.querySelector(
        `.matching-right[data-right-index="${match.rightIndex}"]`
      );

      if (!leftBtn || !rightBtn) return;

      const isMatchCorrect = match.leftIndex === match.originalIndex;

      // Usuń poprzednie kolory (fioletowy z dopasowania + szary border)
      leftBtn.classList.remove(
        'bg-purple-700',
        'border-purple-500',
        'opacity-50',
        'bg-gray-800',
        'hover:bg-gray-700',
        'border-gray-700'
      );
      rightBtn.classList.remove(
        'bg-purple-700',
        'border-purple-500',
        'opacity-50',
        'bg-gray-800',
        'hover:bg-gray-700',
        'border-gray-700'
      );

      if (isMatchCorrect) {
        // Poprawna para - zielona
        leftBtn.classList.add('!bg-green-600', '!border-green-400');
        rightBtn.classList.add('!bg-green-600', '!border-green-400');
      } else {
        // Błędna para - czerwona
        leftBtn.classList.add('!bg-red-600', '!border-red-400');
        rightBtn.classList.add('!bg-red-600', '!border-red-400');
      }

      // Wyłącz przyciski
      leftBtn.disabled = true;
      rightBtn.disabled = true;
    });

    // Wyczyść tymczasowe dane
    this._currentMatchingUserMatches = null;
    this._currentMatchingCorrectCount = null;
  }

  /**
   * Normalizuje string - usuwa akcenty, wielkość liter, znaki interpunkcyjne
   * @private
   * @param {string} str - String do normalizacji
   * @returns {string}
   */
  _normalizeString(str) {
    return (
      String(str)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Usuń akcenty (á, é, í, ó, ú, ñ)
        // Mapowanie polskich znaków diakrytycznych
        .replace(/ą/g, 'a')
        .replace(/ć/g, 'c')
        .replace(/ę/g, 'e')
        .replace(/ł/g, 'l')
        .replace(/ń/g, 'n')
        .replace(/ó/g, 'o')
        .replace(/ś/g, 's')
        .replace(/ź/g, 'z')
        .replace(/ż/g, 'z')
        .replace(/[^\w\s]/g, '') // Usuń znaki interpunkcyjne
        .trim()
    );
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
      case 'multiple-choice': // multiple-choice to też single choice (wybór JEDNEJ odpowiedzi)
        return userAnswer === question.correctAnswer;

      case 'true-false':
        return userAnswer === question.correctAnswer;

      case 'listening': {
        // Normalizuj odpowiedzi (bez wielkości liter, akcentów i interpunkcji)
        const normalizedUser = this._normalizeString(userAnswer);
        const normalizedCorrect = this._normalizeString(question.correctAnswer);

        // Sprawdź dokładne dopasowanie
        if (normalizedUser === normalizedCorrect) {
          return true;
        }

        // Sprawdź alternatywne odpowiedzi (jeśli istnieją)
        if (question.acceptableAnswers && Array.isArray(question.acceptableAnswers)) {
          return question.acceptableAnswers.some(
            alt => this._normalizeString(alt) === normalizedUser
          );
        }

        return false;
      }

      case 'fill-in-blank': {
        // Normalizuj odpowiedzi (bez wielkości liter, akcentów i interpunkcji)
        const normalizedUser = this._normalizeString(userAnswer);
        const normalizedCorrect = this._normalizeString(question.correctAnswer);

        // Sprawdź dokładne dopasowanie
        if (normalizedUser === normalizedCorrect) {
          return true;
        }

        // Sprawdź alternatywne odpowiedzi (jeśli istnieją)
        if (question.acceptableAnswers && Array.isArray(question.acceptableAnswers)) {
          return question.acceptableAnswers.some(
            alt => this._normalizeString(alt) === normalizedUser
          );
        }

        return false;
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
        'mt-4 p-4 bg-green-900/50 border border-green-700 rounded-lg';

      let feedbackHTML = '<p class="font-semibold mb-2 text-green-300">✅ Poprawna odpowiedź!</p>';

      // Dla matching - dodaj informację o wszystkich parach
      if (question.type === 'matching') {
        feedbackHTML +=
          '<p class="text-sm text-green-200">Świetnie! Wszystkie pary dopasowane poprawnie.</p>';
      }

      // Dodaj wyjaśnienie jeśli istnieje
      if (question.explanation) {
        feedbackHTML += `<p class="text-sm text-green-200">${question.explanation}</p>`;
      }

      this.elements.feedback.innerHTML = feedbackHTML;
    } else {
      this.elements.feedback.className = 'mt-4 p-4 bg-red-900/50 border border-red-700 rounded-lg';

      let feedbackHTML = '<p class="font-semibold mb-2 text-red-300">❌ Niepoprawna odpowiedź</p>';

      // Dla matching - pokaż szczegóły i prawidłowe dopasowania
      if (question.type === 'matching') {
        const correctCount = this._currentMatchingCorrectCount || 0;
        feedbackHTML += `<p class="text-sm text-red-200 mb-2">Poprawnie dopasowano ${correctCount} z ${question.pairs.length} par.</p>`;
        feedbackHTML +=
          '<div class="mt-3 text-sm"><strong class="text-red-200">Prawidłowe dopasowania:</strong><ul class="mt-2 space-y-1 text-red-200">';
        question.pairs.forEach(pair => {
          feedbackHTML += `<li>• <span class="text-blue-300">${pair.item}</span> → <span class="text-green-300">${pair.match}</span></li>`;
        });
        feedbackHTML += '</ul></div>';
      } else {
        // Dla innych typów pytań
        let correctAnswerText = '';

        if (question.type === 'multiple-choice' || question.type === 'single-choice') {
          // correctAnswer to indeks opcji
          correctAnswerText = question.options[question.correctAnswer];
        } else if (question.type === 'listening' || question.type === 'fill-in-blank') {
          // correctAnswer to string
          correctAnswerText = String(question.correctAnswer);
        } else if (question.type === 'true-false') {
          // correctAnswer to boolean
          correctAnswerText = question.correctAnswer ? 'Prawda' : 'Fałsz';
        } else {
          correctAnswerText = String(question.correctAnswer);
        }

        feedbackHTML += `<p class="text-sm text-red-200 mb-2">Poprawna odpowiedź: <strong>${correctAnswerText}</strong></p>`;

        // Dodaj wyjaśnienie jeśli istnieje
        if (question.explanation) {
          feedbackHTML += `<p class="text-sm text-red-200">${question.explanation}</p>`;
        }
      }

      this.elements.feedback.innerHTML = feedbackHTML;
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

    // Update podsumowanie
    this.elements.finalScore.textContent = `${percentage}%`;
    this.elements.finalDetails.textContent = `${score} / ${totalQuestions} poprawnych odpowiedzi`;

    // Pokaż informację o błędach
    const mistakesCount = this.quizState.mistakeQuestions.length;

    if (mistakesCount > 0) {
      this.elements.mistakesInfo.textContent = `Pomyłki: ${mistakesCount} z ${totalQuestions} pytań`;
      this.elements.retryMistakesButton.classList.remove('hidden');
    } else {
      this.elements.mistakesInfo.textContent = 'Brawo! Wszystkie odpowiedzi poprawne! 🎉';
      this.elements.retryMistakesButton.classList.add('hidden');
    }

    this.log(`Quiz completed: ${score}/${totalQuestions} (${percentage}%)`);

    // Przejdź do ekranu podsumowania
    if (this.showScreenFn && this.appState) {
      this.showScreenFn('quiz-summary', this.appState, this.elements);
    }
  }

  /**
   * Handler: Retry button (rozpocznij quiz od początku)
   * @private
   */
  _handleRetry() {
    const filename = this.quizState.filename;

    if (!filename) {
      this.error('Cannot retry - no filename');
      return;
    }

    // Wczytaj oryginalne dane quizu ponownie (na wypadek gdyby były zmodyfikowane)
    fetch(`data/quizzes/${filename}`)
      .then(response => response.json())
      .then(quizData => {
        // Reset błędów - nowy quiz od początku
        this.quizState.mistakeQuestions = [];
        this.quizState.originalQuestions = null;
        this.quizState.isMistakesOnlyMode = false;

        // Rozpocznij quiz od początku (pokaże opcje)
        this.start(quizData, filename);

        // Przejdź do ekranu quizu
        if (this.showScreenFn && this.appState) {
          this.showScreenFn('quiz', this.appState, this.elements);
        }
      })
      .catch(error => {
        this.error('Error loading quiz:', error);
      });
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
   * Handler: Restart confirm (restart podczas quizu)
   * @private
   */
  _handleRestartConfirm() {
    this.elements.restartDialog?.classList.add('hidden');

    // Użyj oryginalnych pytań jeśli są dostępne (tryb mistakes-only)
    // W przeciwnym razie użyj obecnych danych
    const quizData = this.quizState.originalQuestions
      ? { ...this.quizState.data, questions: this.quizState.originalQuestions }
      : this.quizState.data;

    const filename = this.quizState.filename;

    // Reset błędów - nowy quiz od początku
    this.quizState.mistakeQuestions = [];
    this.quizState.originalQuestions = null;
    this.quizState.isMistakesOnlyMode = false;

    // Rozpocznij quiz od początku (pokaże opcje)
    this.start(quizData, filename);
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
    // Pokazuj wynik jako: liczba poprawnych / liczba dotychczas udzielonych odpowiedzi
    this.elements.scoreDisplay.textContent = `Wynik: ${this.quizState.score} / ${this.quizState.currentQuestionIndex}`;

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

  /**
   * Zapisuje błędne pytanie (sprawdza duplikaty)
   * @private
   * @param {Object} question - Pytanie do zapisania
   */
  _recordMistake(question) {
    // Pobierz tekst pytania (obsłuż oba pola: question i questionText)
    const currentQuestionText = question.question || question.questionText;

    // Sprawdź czy to pytanie już nie jest na liście (porównanie po treści pytania)
    const alreadyRecorded = this.quizState.mistakeQuestions.some(q => {
      const qText = q.question || q.questionText;
      return qText === currentQuestionText;
    });

    // Dodaj tylko jeśli nie ma jeszcze na liście
    if (!alreadyRecorded) {
      this.quizState.mistakeQuestions.push(question);
      this.log(`Mistake recorded: "${currentQuestionText.substring(0, 50)}..."`);
    }
  }
}

// ========== BACKWARD COMPATIBILITY FACADE ==========
// TODO-PHASE-6: Facade functions dla IIFE modules (app.js, content-manager.js)
// Zostanie usunięte po konwersji tych plików do ES6 modules

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

console.log('✅ QuizEngine (ES6 Class) loaded');
