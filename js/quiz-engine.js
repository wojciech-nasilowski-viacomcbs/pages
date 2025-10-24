/**
 * Silnik quizów
 * Obsługuje renderowanie i logikę wszystkich typów pytań
 */

import { playCorrectSound, playIncorrectSound } from './audio.js';

let showScreenFn = null;
let appState = null;

// Stan quizu
const quizState = {
  data: null,
  filename: null,
  currentQuestionIndex: 0,
  score: 0,
  answers: [],
  isAnswered: false
};

// Elementy DOM
const elements = {
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
  retryButton: document.getElementById('quiz-retry'),
  homeButton: document.getElementById('quiz-home')
};

/**
 * Inicjalizacja silnika quizów
 */
export function initQuizEngine(showScreen, state) {
  showScreenFn = showScreen;
  appState = state;
  
  // Event listenery
  elements.nextButton.addEventListener('click', handleNextQuestion);
  elements.retryButton.addEventListener('click', handleRetry);
}

/**
 * Rozpoczyna quiz
 */
export function startQuiz(quizData, filename) {
  quizState.data = quizData;
  quizState.filename = filename;
  quizState.currentQuestionIndex = 0;
  quizState.score = 0;
  quizState.answers = [];
  quizState.isAnswered = false;
  
  // Sprawdź zapisany postęp
  const savedProgress = loadProgress();
  if (savedProgress && savedProgress.filename === filename) {
    quizState.currentQuestionIndex = savedProgress.currentQuestionIndex;
    quizState.score = savedProgress.score;
    quizState.answers = savedProgress.answers;
  }
  
  displayQuestion();
}

/**
 * Wyświetla aktualne pytanie
 */
function displayQuestion() {
  const questionData = quizState.data.questions[quizState.currentQuestionIndex];
  quizState.isAnswered = false;
  
  // Aktualizuj progress
  const totalQuestions = quizState.data.questions.length;
  const currentNum = quizState.currentQuestionIndex + 1;
  elements.progress.textContent = `Pytanie ${currentNum} / ${totalQuestions}`;
  elements.scoreDisplay.textContent = `Wynik: ${quizState.score} / ${quizState.currentQuestionIndex}`;
  
  const progressPercent = (quizState.currentQuestionIndex / totalQuestions) * 100;
  elements.progressBar.style.width = `${progressPercent}%`;
  
  // Wyświetl pytanie
  elements.question.textContent = questionData.questionText || questionData.question;
  
  // Ukryj feedback i przycisk dalej
  elements.feedback.classList.add('hidden');
  elements.nextButton.classList.add('hidden');
  
  // Renderuj odpowiedzi w zależności od typu
  switch (questionData.type) {
    case 'multiple-choice':
      renderMultipleChoice(questionData);
      break;
    case 'fill-in-the-blank':
      renderFillInTheBlank(questionData);
      break;
    case 'true-false':
      renderTrueFalse(questionData);
      break;
    case 'matching':
      renderMatching(questionData);
      break;
    default:
      console.error('Nieznany typ pytania:', questionData.type);
  }
  
  // Zapisz postęp
  saveProgress();
}

/**
 * Renderuje pytanie wielokrotnego wyboru
 */
function renderMultipleChoice(questionData) {
  elements.answersContainer.innerHTML = questionData.options.map((option, index) => `
    <button class="quiz-option w-full text-left p-4 rounded-lg bg-gray-700 hover:bg-gray-600 transition border-2 border-transparent"
            data-index="${index}">
      <span class="font-medium">${String.fromCharCode(65 + index)}.</span> ${option.text}
    </button>
  `).join('');
  
  // Event listenery
  elements.answersContainer.querySelectorAll('.quiz-option').forEach(btn => {
    btn.addEventListener('click', () => handleMultipleChoiceAnswer(questionData, parseInt(btn.dataset.index)));
  });
}

/**
 * Obsługuje odpowiedź na pytanie wielokrotnego wyboru
 */
function handleMultipleChoiceAnswer(questionData, selectedIndex) {
  if (quizState.isAnswered) return;
  quizState.isAnswered = true;
  
  const selectedOption = questionData.options[selectedIndex];
  const isCorrect = selectedOption.isCorrect;
  
  // Aktualizuj wynik
  if (isCorrect) {
    quizState.score++;
    playCorrectSound();
  } else {
    playIncorrectSound();
  }
  
  // Pokoloruj odpowiedzi
  const buttons = elements.answersContainer.querySelectorAll('.quiz-option');
  buttons.forEach((btn, index) => {
    btn.disabled = true;
    const option = questionData.options[index];
    
    if (option.isCorrect) {
      btn.classList.add('bg-green-600', 'border-green-400');
      btn.classList.remove('bg-gray-700', 'hover:bg-gray-600');
    } else if (index === selectedIndex) {
      btn.classList.add('bg-red-600', 'border-red-400');
      btn.classList.remove('bg-gray-700', 'hover:bg-gray-600');
    } else {
      btn.classList.add('opacity-50');
    }
  });
  
  // Pokaż feedback
  showFeedback(isCorrect, selectedOption.explanation);
}

/**
 * Renderuje pytanie z luką do uzupełnienia
 */
function renderFillInTheBlank(questionData) {
  elements.answersContainer.innerHTML = `
    <div class="space-y-4">
      <input type="text" 
             id="fill-blank-input"
             class="w-full p-4 rounded-lg bg-gray-700 text-white border-2 border-gray-600 focus:border-blue-500 focus:outline-none text-lg"
             placeholder="Wpisz odpowiedź..."
             autocomplete="off">
      <button id="fill-blank-submit" 
              class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition">
        Sprawdź odpowiedź
      </button>
    </div>
  `;
  
  const input = document.getElementById('fill-blank-input');
  const submitBtn = document.getElementById('fill-blank-submit');
  
  // Enter = submit
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      submitBtn.click();
    }
  });
  
  submitBtn.addEventListener('click', () => handleFillInTheBlankAnswer(questionData, input.value));
  
  // Autofocus
  input.focus();
}

/**
 * Obsługuje odpowiedź na pytanie z luką
 */
function handleFillInTheBlankAnswer(questionData, userAnswer) {
  if (quizState.isAnswered) return;
  if (!userAnswer.trim()) return;
  
  quizState.isAnswered = true;
  
  // Normalizuj odpowiedzi (bez wielkości liter i akcentów)
  const normalize = (str) => str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Usuń akcenty
    .trim();
  
  const isCorrect = normalize(userAnswer) === normalize(questionData.correctAnswer);
  
  if (isCorrect) {
    quizState.score++;
    playCorrectSound();
  } else {
    playIncorrectSound();
  }
  
  // Zablokuj input i przycisk
  const input = document.getElementById('fill-blank-input');
  const submitBtn = document.getElementById('fill-blank-submit');
  input.disabled = true;
  submitBtn.disabled = true;
  
  if (isCorrect) {
    input.classList.add('border-green-500', 'bg-green-900/30');
  } else {
    input.classList.add('border-red-500', 'bg-red-900/30');
  }
  
  // Pokaż feedback
  const explanation = isCorrect 
    ? questionData.explanation 
    : `Niepoprawnie. Poprawna odpowiedź to: "${questionData.correctAnswer}". ${questionData.explanation}`;
  
  showFeedback(isCorrect, explanation);
}

/**
 * Renderuje pytanie prawda/fałsz
 */
function renderTrueFalse(questionData) {
  elements.answersContainer.innerHTML = `
    <div class="grid grid-cols-2 gap-4">
      <button class="quiz-tf-option p-6 rounded-lg bg-gray-700 hover:bg-gray-600 transition border-2 border-transparent font-bold text-lg"
              data-answer="true">
        ✓ Prawda
      </button>
      <button class="quiz-tf-option p-6 rounded-lg bg-gray-700 hover:bg-gray-600 transition border-2 border-transparent font-bold text-lg"
              data-answer="false">
        ✗ Fałsz
      </button>
    </div>
  `;
  
  elements.answersContainer.querySelectorAll('.quiz-tf-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const userAnswer = btn.dataset.answer === 'true';
      handleTrueFalseAnswer(questionData, userAnswer);
    });
  });
}

/**
 * Obsługuje odpowiedź na pytanie prawda/fałsz
 */
function handleTrueFalseAnswer(questionData, userAnswer) {
  if (quizState.isAnswered) return;
  quizState.isAnswered = true;
  
  const isCorrect = userAnswer === questionData.isCorrect;
  
  if (isCorrect) {
    quizState.score++;
    playCorrectSound();
  } else {
    playIncorrectSound();
  }
  
  // Pokoloruj przyciski
  const buttons = elements.answersContainer.querySelectorAll('.quiz-tf-option');
  buttons.forEach(btn => {
    btn.disabled = true;
    const btnAnswer = btn.dataset.answer === 'true';
    
    if (btnAnswer === questionData.isCorrect) {
      btn.classList.add('bg-green-600', 'border-green-400');
      btn.classList.remove('bg-gray-700', 'hover:bg-gray-600');
    } else if (btnAnswer === userAnswer) {
      btn.classList.add('bg-red-600', 'border-red-400');
      btn.classList.remove('bg-gray-700', 'hover:bg-gray-600');
    } else {
      btn.classList.add('opacity-50');
    }
  });
  
  showFeedback(isCorrect, questionData.explanation);
}

/**
 * Renderuje pytanie dopasowywania
 */
function renderMatching(questionData) {
  // Losowa kolejność dla prawej kolumny
  const rightItems = [...questionData.pairs.map(p => p.match)].sort(() => Math.random() - 0.5);
  
  elements.answersContainer.innerHTML = `
    <div class="text-sm text-gray-400 mb-4">Kliknij element z lewej, a potem odpowiadający mu element z prawej.</div>
    <div class="grid grid-cols-2 gap-4">
      <div class="space-y-2">
        ${questionData.pairs.map((pair, index) => `
          <button class="matching-left w-full p-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition border-2 border-transparent text-left"
                  data-index="${index}">
            ${pair.item}
          </button>
        `).join('')}
      </div>
      <div class="space-y-2">
        ${rightItems.map((item, index) => `
          <button class="matching-right w-full p-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition border-2 border-transparent text-left"
                  data-match="${item}">
            ${item}
          </button>
        `).join('')}
      </div>
    </div>
  `;
  
  let selectedLeft = null;
  const userMatches = [];
  
  // Event listenery
  elements.answersContainer.querySelectorAll('.matching-left').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      
      // Odznacz poprzedni
      elements.answersContainer.querySelectorAll('.matching-left').forEach(b => {
        b.classList.remove('border-blue-500', 'bg-blue-900', 'border-4');
      });
      
      // Zaznacz aktualny - wyraźniejsze zaznaczenie
      btn.classList.add('border-blue-500', 'bg-blue-900', 'border-4');
      selectedLeft = parseInt(btn.dataset.index);
    });
  });
  
  elements.answersContainer.querySelectorAll('.matching-right').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.disabled || selectedLeft === null) return;
      
      const leftIndex = selectedLeft;
      const rightMatch = btn.dataset.match;
      
      // Zapisz dopasowanie
      userMatches.push({ leftIndex, rightMatch });
      
      // Zablokuj przyciski
      const leftBtn = elements.answersContainer.querySelector(`.matching-left[data-index="${leftIndex}"]`);
      leftBtn.disabled = true;
      leftBtn.classList.remove('border-blue-500', 'bg-blue-900', 'border-4');
      leftBtn.classList.add('opacity-50');
      
      btn.disabled = true;
      btn.classList.add('opacity-50');
      
      selectedLeft = null;
      
      // Sprawdź, czy wszystkie dopasowane
      if (userMatches.length === questionData.pairs.length) {
        handleMatchingAnswer(questionData, userMatches);
      }
    });
  });
}

/**
 * Obsługuje odpowiedź na pytanie dopasowywania
 */
function handleMatchingAnswer(questionData, userMatches) {
  if (quizState.isAnswered) return;
  quizState.isAnswered = true;
  
  // Sprawdź poprawność
  let correctCount = 0;
  userMatches.forEach(match => {
    const correctMatch = questionData.pairs[match.leftIndex].match;
    if (match.rightMatch === correctMatch) {
      correctCount++;
    }
  });
  
  const isCorrect = correctCount === questionData.pairs.length;
  
  if (isCorrect) {
    quizState.score++;
    playCorrectSound();
  } else {
    playIncorrectSound();
  }
  
  // Pokoloruj odpowiedzi
  userMatches.forEach(match => {
    const leftBtn = elements.answersContainer.querySelector(`.matching-left[data-index="${match.leftIndex}"]`);
    const rightBtns = elements.answersContainer.querySelectorAll('.matching-right');
    const rightBtn = Array.from(rightBtns).find(b => b.dataset.match === match.rightMatch);
    
    const correctMatch = questionData.pairs[match.leftIndex].match;
    const isMatchCorrect = match.rightMatch === correctMatch;
    
    if (isMatchCorrect) {
      leftBtn.classList.add('bg-green-600', 'border-green-400');
      rightBtn.classList.add('bg-green-600', 'border-green-400');
    } else {
      leftBtn.classList.add('bg-red-600', 'border-red-400');
      rightBtn.classList.add('bg-red-600', 'border-red-400');
    }
  });
  
  const explanation = isCorrect 
    ? 'Świetnie! Wszystkie pary dopasowane poprawnie.' 
    : `Poprawnie dopasowano ${correctCount} z ${questionData.pairs.length} par.`;
  
  showFeedback(isCorrect, explanation);
}

/**
 * Pokazuje feedback po odpowiedzi
 */
function showFeedback(isCorrect, explanation) {
  elements.feedback.classList.remove('hidden', 'bg-green-900/50', 'border-green-700', 'bg-red-900/50', 'border-red-700');
  
  if (isCorrect) {
    elements.feedback.classList.add('bg-green-900/50', 'border-green-700', 'border');
  } else {
    elements.feedback.classList.add('bg-red-900/50', 'border-red-700', 'border');
  }
  
  const title = isCorrect ? '✓ Poprawna odpowiedź!' : '✗ Niepoprawna odpowiedź';
  elements.feedback.innerHTML = `
    <p class="font-semibold mb-2 ${isCorrect ? 'text-green-300' : 'text-red-300'}">${title}</p>
    <p class="text-sm ${isCorrect ? 'text-green-200' : 'text-red-200'}">${explanation}</p>
  `;
  
  // Pokaż przycisk dalej
  elements.nextButton.classList.remove('hidden');
}

/**
 * Przechodzi do następnego pytania
 */
function handleNextQuestion() {
  quizState.currentQuestionIndex++;
  
  if (quizState.currentQuestionIndex >= quizState.data.questions.length) {
    // Koniec quizu
    showSummary();
  } else {
    displayQuestion();
  }
}

/**
 * Pokazuje podsumowanie quizu
 */
function showSummary() {
  const totalQuestions = quizState.data.questions.length;
  const percentage = Math.round((quizState.score / totalQuestions) * 100);
  
  elements.finalScore.textContent = `${percentage}%`;
  elements.finalDetails.textContent = `${quizState.score} / ${totalQuestions} poprawnych odpowiedzi`;
  
  // Wyczyść zapisany postęp
  localStorage.removeItem('currentSession');
  
  showScreenFn('quiz-summary');
}

/**
 * Powtarza quiz od początku
 */
function handleRetry() {
  startQuiz(quizState.data, quizState.filename);
  showScreenFn('quiz');
}

/**
 * Zapisuje postęp quizu
 */
function saveProgress() {
  const progress = {
    type: 'quiz',
    filename: quizState.filename,
    currentQuestionIndex: quizState.currentQuestionIndex,
    score: quizState.score,
    answers: quizState.answers,
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

