/**
 * Silnik quizów
 * Obsługuje renderowanie i logikę wszystkich typów pytań
 */

(function() {
'use strict';

let showScreenFn = null;
let appState = null;

// Stan quizu
const quizState = {
  data: null,
  filename: null,
  currentQuestionIndex: 0,
  score: 0,
  answers: [],
  isAnswered: false,
  questionOrder: null, // Przechowuje indeksy pytań jeśli były losowane
  mistakeQuestions: [], // Pytania z błędnymi odpowiedziami (w bieżącej sesji)
  originalQuestions: null // Oryginalne pytania przed filtrowaniem błędów
};

// Elementy DOM - będą pobrane przy inicjalizacji
let elements = {};

/**
 * Inicjalizacja silnika quizów
 */
function initQuizEngine(showScreen, state) {
  showScreenFn = showScreen;
  appState = state;
  
  // Pobierz elementy DOM
  elements = {
    // Opcje quizu
    quizOptions: document.getElementById('quiz-options'),
    quizTitle: document.getElementById('quiz-title'),
    quizHeader: document.getElementById('quiz-header'),
    quizQuestionContainer: document.getElementById('quiz-question-container'),
    randomizeCheckbox: document.getElementById('quiz-randomize'),
    skipListeningCheckbox: document.getElementById('quiz-skip-listening'), // Checkbox do pomijania pytań słuchowych
    startButton: document.getElementById('quiz-start-btn'),
    
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
    homeButton: document.getElementById('quiz-home')
  };
  
  // Event listenery
  elements.startButton.addEventListener('click', handleStartQuiz);
  elements.nextButton.addEventListener('click', handleNextQuestion);
  elements.retryButton.addEventListener('click', handleRetry);
  elements.retryMistakesButton.addEventListener('click', handleRetryMistakes);
}

/**
 * Resetuje listę błędów (wywołane przy wyjściu z quizu)
 */
function resetMistakes() {
  quizState.mistakeQuestions = [];
  quizState.originalQuestions = null;
}

/**
 * Rozpoczyna quiz (pokazuje opcje)
 */
function startQuiz(quizData, filename, mistakesOnly = false) {
  quizState.data = quizData;
  quizState.filename = filename;
  quizState.currentQuestionIndex = 0;
  quizState.score = 0;
  quizState.answers = [];
  quizState.isAnswered = false;
  
  // Jeśli to nie jest tryb błędów, zapisz oryginalne pytania i resetuj błędy
  if (!mistakesOnly) {
    quizState.mistakeQuestions = [];
    // Zapisz oryginalne pytania PRZED jakimkolwiek losowaniem
    quizState.originalQuestions = [...quizData.questions];
  }
  
  // Sprawdź zapisany postęp
  const savedProgress = loadProgress();
  if (savedProgress && savedProgress.filename === filename && !mistakesOnly) {
    quizState.currentQuestionIndex = savedProgress.currentQuestionIndex;
    quizState.score = savedProgress.score;
    quizState.answers = savedProgress.answers;
    
    // Jeśli kontynuujemy, przywróć kolejność pytań i od razu rozpocznij
    if (savedProgress.questionOrder) {
      quizState.data.questions = savedProgress.questionOrder.map(i => quizData.questions[i]);
    }
    
    // Ukryj opcje, pokaż quiz
    elements.quizOptions.classList.add('hidden');
    elements.quizHeader.classList.remove('hidden');
    elements.quizQuestionContainer.classList.remove('hidden');
    displayQuestion();
  } else {
    // Nowy quiz - pokaż opcje
    showQuizOptions();
  }
}

/**
 * Pokazuje opcje quizu przed rozpoczęciem
 */
function showQuizOptions() {
  elements.quizOptions.classList.remove('hidden');
  elements.quizHeader.classList.add('hidden');
  elements.quizQuestionContainer.classList.add('hidden');
  
  // Ustaw tytuł quizu
  elements.quizTitle.textContent = quizState.data.title || 'Quiz';
  
  // Wczytaj zapisane preferencje losowania
  const savedRandomize = localStorage.getItem('quizRandomize');
  if (savedRandomize !== null) {
    elements.randomizeCheckbox.checked = savedRandomize === 'true';
  }
  
  // Wczytaj zapisaną preferencję pomijania pytań słuchowych
  const savedSkipListening = localStorage.getItem('skipListeningQuestions');
  if (savedSkipListening !== null) {
    elements.skipListeningCheckbox.checked = savedSkipListening === 'true';
  }
}

/**
 * Obsługuje rozpoczęcie quizu po wybraniu opcji
 */
function handleStartQuiz() {
  const shouldRandomize = elements.randomizeCheckbox.checked;
  const shouldSkipListening = elements.skipListeningCheckbox.checked;
  
  // Zapisz preferencje użytkownika w localStorage
  localStorage.setItem('quizRandomize', shouldRandomize);
  localStorage.setItem('skipListeningQuestions', shouldSkipListening);
  
  // Filtruj pytania słuchowe jeśli użytkownik zaznaczył tę opcję
  // WAŻNE: Filtrowanie musi być wykonane PRZED losowaniem
  if (shouldSkipListening) {
    filterListeningQuestions();
  }
  
  // Losuj kolejność pytań jeśli zaznaczono opcję randomizacji
  // Losowanie działa na przefiltrowanych pytaniach
  if (shouldRandomize) {
    randomizeQuestions();
  }
  
  // Ukryj opcje, pokaż quiz
  elements.quizOptions.classList.add('hidden');
  elements.quizHeader.classList.remove('hidden');
  elements.quizQuestionContainer.classList.remove('hidden');
  
  // Rozpocznij quiz
  displayQuestion();
}

/**
 * Losuje kolejność pytań
 */
function randomizeQuestions() {
  const questions = quizState.data.questions;
  const indices = questions.map((_, i) => i);
  
  // Fisher-Yates shuffle
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  
  // Zapisz oryginalną kolejność dla zapisu postępu
  quizState.questionOrder = indices;
  
  // Zmień kolejność pytań
  quizState.data.questions = indices.map(i => questions[i]);
}

/**
 * Filtruje pytania słuchowe (listening) z quizu
 * Usuwa wszystkie pytania typu "listening" z tablicy pytań
 * 
 * Funkcja modyfikuje quizState.data.questions in-place, zachowując
 * tylko pytania, które NIE są typu "listening"
 * 
 * Przykład:
 * - Przed: 69 pytań (w tym 6 typu "listening")
 * - Po: 63 pytania (wszystkie oprócz "listening")
 */
function filterListeningQuestions() {
  quizState.data.questions = quizState.data.questions.filter(q => q.type !== 'listening');
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
    case 'fill-in-blank':  // v2 format
      renderFillInTheBlank(questionData);
      break;
    case 'true-false':
      renderTrueFalse(questionData);
      break;
    case 'matching':
      renderMatching(questionData);
      break;
    case 'listening':
      renderListening(questionData);
      break;
    default:
      console.error('Nieznany typ pytania:', questionData.type);
  }
  
  // Zapisz postęp
  saveProgress();
}

/**
 * Dodaje przycisk audio do pytania (jeśli ma pole audioText)
 */
function addAudioButton(questionData) {
  if (!questionData.audioText || !isTTSAvailable()) return '';
  
  const lang = questionData.audioLang || 'en-US';
  const rate = questionData.audioRate || 0.85;
  
  return `
    <div class="flex gap-2 mb-4">
      <button class="audio-play-btn bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition flex items-center gap-2"
              data-text="${questionData.audioText.replace(/"/g, '&quot;')}"
              data-lang="${lang}"
              data-rate="${rate}">
        🔊 Odtwórz
      </button>
      <button class="audio-slow-btn bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition flex items-center gap-2"
              data-text="${questionData.audioText.replace(/"/g, '&quot;')}"
              data-lang="${lang}"
              data-rate="${rate * 0.7}">
        🐌 Wolniej
      </button>
    </div>
  `;
}

/**
 * Dodaje event listenery do przycisków audio
 */
function attachAudioListeners() {
  document.querySelectorAll('.audio-play-btn, .audio-slow-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const text = btn.dataset.text;
      const lang = btn.dataset.lang;
      const rate = parseFloat(btn.dataset.rate);
      speakText(text, lang, rate);
    });
  });
}

/**
 * Renderuje pytanie słuchowe (listening)
 */
function renderListening(questionData) {
  const audioBtn = addAudioButton(questionData);
  
  elements.answersContainer.innerHTML = `
    ${audioBtn}
    <div class="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mb-4">
      <p class="text-blue-200 text-sm">
        🎧 Posłuchaj nagrania i wpisz, co usłyszałeś/aś. Możesz odtworzyć nagranie wielokrotnie.
      </p>
    </div>
    <div class="space-y-4">
      <input type="text" 
             id="listening-input"
             class="w-full p-4 rounded-lg bg-gray-700 text-white border-2 border-gray-600 focus:border-blue-500 focus:outline-none text-lg"
             placeholder="Wpisz, co usłyszałeś/aś..."
             autocomplete="off"
             autocorrect="off"
             autocapitalize="off"
             spellcheck="false">
      <button id="listening-submit" 
              class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition">
        Sprawdź odpowiedź
      </button>
    </div>
  `;
  
  attachAudioListeners();
  
  const input = document.getElementById('listening-input');
  const submitBtn = document.getElementById('listening-submit');
  
  // Enter = submit
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      submitBtn.click();
    }
  });
  
  submitBtn.addEventListener('click', () => handleListeningAnswer(questionData, input.value));
  
  // Automatyczne odtworzenie przy pierwszym wyświetleniu
  if (questionData.audioText && questionData.autoPlay !== false) {
    setTimeout(() => {
      speakText(questionData.audioText, questionData.audioLang || 'en-US', questionData.audioRate || 0.85);
    }, 500);
  }
  
  // Autofocus
  input.focus();
}

/**
 * Obsługuje odpowiedź na pytanie słuchowe
 */
function handleListeningAnswer(questionData, userAnswer) {
  if (quizState.isAnswered) return;
  if (!userAnswer.trim()) return;
  
  quizState.isAnswered = true;
  
  // Zatrzymaj odtwarzanie audio
  stopSpeaking();
  
  // Normalizuj odpowiedzi (bez wielkości liter i akcentów)
  const normalize = (str) => str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Usuń akcenty
    .replace(/[^\w\s]/g, '') // Usuń znaki interpunkcyjne
    .trim();
  
  const normalizedUser = normalize(userAnswer);
  const normalizedCorrect = normalize(questionData.correctAnswer);
  
  // Sprawdź czy odpowiedź jest poprawna (dokładne dopasowanie lub alternatywne odpowiedzi)
  let isCorrect = normalizedUser === normalizedCorrect;
  
  // Sprawdź alternatywne odpowiedzi (jeśli istnieją)
  if (!isCorrect && questionData.acceptableAnswers) {
    isCorrect = questionData.acceptableAnswers.some(alt => normalize(alt) === normalizedUser);
  }
  
  if (isCorrect) {
    quizState.score++;
    playCorrectSound();
  } else {
    playIncorrectSound();
    recordMistake();
  }
  
  // Zablokuj input i przyciski
  const input = document.getElementById('listening-input');
  const submitBtn = document.getElementById('listening-submit');
  const audioButtons = document.querySelectorAll('.audio-play-btn, .audio-slow-btn');
  
  input.disabled = true;
  submitBtn.disabled = true;
  audioButtons.forEach(btn => btn.disabled = true);
  
  if (isCorrect) {
    input.classList.add('border-green-500', 'bg-green-900/30');
  } else {
    input.classList.add('border-red-500', 'bg-red-900/30');
  }
  
  // Pokaż feedback
  const explanation = isCorrect 
    ? (questionData.explanation || '') 
    : `Niepoprawnie. Poprawna odpowiedź to: "${questionData.correctAnswer}".${questionData.explanation ? ' ' + questionData.explanation : ''}`;
  
  showFeedback(isCorrect, explanation);
}

/**
 * Renderuje pytanie wielokrotnego wyboru
 */
function renderMultipleChoice(questionData) {
  const audioBtn = addAudioButton(questionData);
  
  elements.answersContainer.innerHTML = `
    ${audioBtn}
    ${questionData.options.map((option, index) => {
      // Obsługa obu formatów: string (v2) lub obiekt {text, isCorrect} (v1)
      const optionText = typeof option === 'string' ? option : option.text;
      return `
        <button class="quiz-option w-full text-left p-4 rounded-lg bg-gray-700 hover:bg-gray-600 transition border-2 border-transparent"
                data-index="${index}">
          <span class="font-medium">${String.fromCharCode(65 + index)}.</span> ${optionText}
        </button>
      `;
    }).join('')}
  `;
  
  attachAudioListeners();
  
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
  // Obsługa obu formatów: v2 (correctAnswer: index) lub v1 (isCorrect w opcji)
  const isCorrect = questionData.correctAnswer !== undefined 
    ? selectedIndex === questionData.correctAnswer 
    : selectedOption.isCorrect;
  
  // Aktualizuj wynik
  if (isCorrect) {
    quizState.score++;
    playCorrectSound();
  } else {
    playIncorrectSound();
    // Zapisz indeks błędnego pytania
    recordMistake();
  }
  
  // Pokoloruj odpowiedzi
  const buttons = elements.answersContainer.querySelectorAll('.quiz-option');
  const correctIndex = questionData.correctAnswer !== undefined 
    ? questionData.correctAnswer 
    : questionData.options.findIndex(opt => opt.isCorrect);
  
  buttons.forEach((btn, index) => {
    btn.disabled = true;
    
    if (index === correctIndex) {
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
  const explanation = typeof selectedOption === 'string' 
    ? (questionData.explanation || '') 
    : (selectedOption.explanation || '');
  showFeedback(isCorrect, explanation);
}

/**
 * Renderuje pytanie z luką do uzupełnienia
 */
function renderFillInTheBlank(questionData) {
  const audioBtn = addAudioButton(questionData);
  
  elements.answersContainer.innerHTML = `
    ${audioBtn}
    <div class="space-y-4">
      <input type="text" 
             id="fill-blank-input"
             class="w-full p-4 rounded-lg bg-gray-700 text-white border-2 border-gray-600 focus:border-blue-500 focus:outline-none text-lg"
             placeholder="Wpisz odpowiedź..."
             autocomplete="off"
             autocorrect="off"
             autocapitalize="off"
             spellcheck="false">
      <button id="fill-blank-submit" 
              class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition">
        Sprawdź odpowiedź
      </button>
    </div>
  `;
  
  attachAudioListeners();
  
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
    // Zapisz indeks błędnego pytania
    recordMistake();
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
    ? (questionData.explanation || '') 
    : `Niepoprawnie. Poprawna odpowiedź to: "${questionData.correctAnswer}".${questionData.explanation ? ' ' + questionData.explanation : ''}`;
  
  showFeedback(isCorrect, explanation);
}

/**
 * Renderuje pytanie prawda/fałsz
 */
function renderTrueFalse(questionData) {
  const audioBtn = addAudioButton(questionData);
  
  elements.answersContainer.innerHTML = `
    ${audioBtn}
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
  
  attachAudioListeners();
  
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
  
  // Obsługa obu formatów: v2 (correctAnswer) lub v1 (isCorrect)
  const correctAnswer = questionData.correctAnswer !== undefined 
    ? questionData.correctAnswer 
    : questionData.isCorrect;
  const isCorrect = userAnswer === correctAnswer;
  
  if (isCorrect) {
    quizState.score++;
    playCorrectSound();
  } else {
    playIncorrectSound();
    // Zapisz indeks błędnego pytania
    recordMistake();
  }
  
  // Pokoloruj przyciski
  const buttons = elements.answersContainer.querySelectorAll('.quiz-tf-option');
  buttons.forEach(btn => {
    btn.disabled = true;
    const btnAnswer = btn.dataset.answer === 'true';
    
    if (btnAnswer === correctAnswer) {
      btn.classList.add('bg-green-600', 'border-green-400');
      btn.classList.remove('bg-gray-700', 'hover:bg-gray-600');
    } else if (btnAnswer === userAnswer) {
      btn.classList.add('bg-red-600', 'border-red-400');
      btn.classList.remove('bg-gray-700', 'hover:bg-gray-600');
    } else {
      btn.classList.add('opacity-50');
    }
  });
  
  showFeedback(isCorrect, questionData.explanation || '');
}

/**
 * Renderuje pytanie dopasowywania
 */
function renderMatching(questionData) {
  // Losowa kolejność dla prawej kolumny
  const rightItems = [...questionData.pairs.map(p => p.match)].sort(() => Math.random() - 0.5);
  
  elements.answersContainer.innerHTML = `
    <div class="text-sm text-gray-400 mb-4">
      Kliknij element z lewej, a potem odpowiadający mu element z prawej. 
      <span class="text-yellow-400">Kliknij ponownie na dopasowaną parę, aby ją cofnąć.</span>
    </div>
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
    <div class="mt-4 text-center">
      <button id="matching-submit" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed" disabled>
        Sprawdź odpowiedzi
      </button>
    </div>
  `;
  
  let selectedLeft = null;
  const userMatches = [];
  
  const updateSubmitButton = () => {
    const submitBtn = document.getElementById('matching-submit');
    if (userMatches.length === questionData.pairs.length) {
      submitBtn.disabled = false;
    } else {
      submitBtn.disabled = true;
    }
  };
  
  // Event listenery dla lewej kolumny
  elements.answersContainer.querySelectorAll('.matching-left').forEach(btn => {
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
        btn.classList.add('bg-gray-700', 'hover:bg-gray-600');
        
        const rightBtns = elements.answersContainer.querySelectorAll('.matching-right');
        const rightBtn = Array.from(rightBtns).find(b => b.dataset.match === existingMatch.rightMatch);
        rightBtn.classList.remove('opacity-50', 'bg-purple-700', 'border-purple-500');
        rightBtn.classList.add('bg-gray-700', 'hover:bg-gray-600');
        
        updateSubmitButton();
        return;
      }
      
      // Jeśli kliknięto ten sam element (zaznaczony, ale nie dopasowany) - odznacz go
      if (selectedLeft === leftIndex) {
        btn.classList.remove('border-blue-400', 'bg-blue-600', 'border-4', 'shadow-lg', 'shadow-blue-500/50');
        selectedLeft = null;
        return;
      }
      
      // Odznacz poprzedni
      elements.answersContainer.querySelectorAll('.matching-left').forEach(b => {
        if (!userMatches.find(m => m.leftIndex === parseInt(b.dataset.index))) {
          b.classList.remove('border-blue-400', 'bg-blue-600', 'border-4', 'shadow-lg', 'shadow-blue-500/50');
        }
      });
      
      // Zaznacz aktualny - wyraźniejsze zaznaczenie z cieniem dla mobile
      btn.classList.add('border-blue-400', 'bg-blue-600', 'border-4', 'shadow-lg', 'shadow-blue-500/50');
      selectedLeft = leftIndex;
    });
  });
  
  // Event listenery dla prawej kolumny
  elements.answersContainer.querySelectorAll('.matching-right').forEach(btn => {
    btn.addEventListener('click', () => {
      const rightMatch = btn.dataset.match;
      
      // Sprawdź czy ten element jest już dopasowany
      const existingMatch = userMatches.find(m => m.rightMatch === rightMatch);
      
      if (existingMatch) {
        // Cofnij dopasowanie
        const matchIndex = userMatches.indexOf(existingMatch);
        userMatches.splice(matchIndex, 1);
        
        // Odblokuj przyciski
        btn.classList.remove('opacity-50', 'bg-purple-700', 'border-purple-500');
        btn.classList.add('bg-gray-700', 'hover:bg-gray-600');
        
        const leftBtn = elements.answersContainer.querySelector(`.matching-left[data-index="${existingMatch.leftIndex}"]`);
        leftBtn.classList.remove('opacity-50', 'bg-purple-700', 'border-purple-500');
        leftBtn.classList.add('bg-gray-700', 'hover:bg-gray-600');
        
        updateSubmitButton();
        return;
      }
      
      // Normalny flow - dopasowanie
      if (selectedLeft === null) return;
      
      const leftIndex = selectedLeft;
      
      // Zapisz dopasowanie
      userMatches.push({ leftIndex, rightMatch });
      
      // Oznacz dopasowane przyciski (fioletowy = dopasowane, ale można cofnąć)
      const leftBtn = elements.answersContainer.querySelector(`.matching-left[data-index="${leftIndex}"]`);
      leftBtn.classList.remove('border-blue-400', 'bg-blue-600', 'border-4', 'shadow-lg', 'shadow-blue-500/50', 'bg-gray-700', 'hover:bg-gray-600');
      leftBtn.classList.add('opacity-50', 'bg-purple-700', 'border-purple-500', 'border-2');
      
      btn.classList.remove('bg-gray-700', 'hover:bg-gray-600');
      btn.classList.add('opacity-50', 'bg-purple-700', 'border-purple-500', 'border-2');
      
      selectedLeft = null;
      
      updateSubmitButton();
    });
  });
  
  // Przycisk sprawdzania
  document.getElementById('matching-submit').addEventListener('click', () => {
    handleMatchingAnswer(questionData, userMatches);
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
    // Zapisz indeks błędnego pytania
    recordMistake();
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
  
  // Przygotuj wyjaśnienie z poprawnymi odpowiedziami
  let explanation = '';
  if (isCorrect) {
    explanation = 'Świetnie! Wszystkie pary dopasowane poprawnie.';
  } else {
    explanation = `Poprawnie dopasowano ${correctCount} z ${questionData.pairs.length} par.\n\n`;
    explanation += '<div class="mt-3 text-sm"><strong>Prawidłowe dopasowania:</strong><ul class="mt-2 space-y-1">';
    questionData.pairs.forEach(pair => {
      explanation += `<li>• <span class="text-blue-300">${pair.item}</span> → <span class="text-green-300">${pair.match}</span></li>`;
    });
    explanation += '</ul></div>';
  }
  
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
  
  // Przewiń do przycisku "Następne pytanie" po krótkiej chwili (aby animacja się zakończyła)
  setTimeout(() => {
    elements.nextButton.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 100);
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
  
  // Pokaż informację o błędach
  const mistakesCount = quizState.mistakeQuestions.length;
  
  if (mistakesCount > 0) {
    elements.mistakesInfo.textContent = `Pomyłki: ${mistakesCount} z ${totalQuestions} pytań`;
    elements.retryMistakesButton.classList.remove('hidden');
  } else {
    elements.mistakesInfo.textContent = 'Brawo! Wszystkie odpowiedzi poprawne! 🎉';
    elements.retryMistakesButton.classList.add('hidden');
  }
  
  // Wyczyść zapisany postęp
  localStorage.removeItem('currentSession');
  
  showScreenFn('quiz-summary');
}

/**
 * Powtarza quiz od początku
 */
function handleRetry() {
  // Wyczyść zapisany postęp, aby pokazać opcje quizu ponownie
  localStorage.removeItem('currentSession');
  
  // Wczytaj oryginalne dane quizu ponownie
  const filename = quizState.filename;
  fetch(`data/quizzes/${filename}`)
    .then(response => response.json())
    .then(quizData => {
      // Reset błędów - nowy quiz od początku
      quizState.mistakeQuestions = [];
      quizState.originalQuestions = null;
      
      startQuiz(quizData, filename);
      showScreenFn('quiz');
    })
    .catch(error => {
      console.error('Błąd wczytywania quizu:', error);
    });
}

/**
 * Zapisuje błędne pytanie
 */
function recordMistake() {
  // Zapisz bieżące pytanie jako błędne
  const currentQuestion = quizState.data.questions[quizState.currentQuestionIndex];
  
  // Pobierz tekst pytania (obsłuż oba pola)
  const currentQuestionText = currentQuestion.questionText || currentQuestion.question;
  
  // Sprawdź czy to pytanie już nie jest na liście (porównanie po treści pytania)
  const alreadyRecorded = quizState.mistakeQuestions.some(q => {
    const qText = q.questionText || q.question;
    return qText === currentQuestionText;
  });
  
  if (!alreadyRecorded) {
    quizState.mistakeQuestions.push(currentQuestion);
  }
}

/**
 * Rozpoczyna quiz tylko z błędnymi pytaniami
 */
function handleRetryMistakes() {
  // Wyczyść zapisany postęp
  localStorage.removeItem('currentSession');
  
  // Zachowaj oryginalne pytania dla kolejnych prób
  const originalQuestionsBackup = [...quizState.originalQuestions];
  
  // Zachowaj listę błędnych pytań PRZED resetowaniem
  const mistakeQuestionsBackup = [...quizState.mistakeQuestions];
  
  // Resetuj listę błędów dla nowej próby (PRZED startQuiz!)
  quizState.mistakeQuestions = [];
  
  // Stwórz nowe dane quizu tylko z błędnymi pytaniami
  const mistakesQuizData = {
    ...quizState.data,
    questions: mistakeQuestionsBackup
  };
  
  // Rozpocznij quiz z błędnymi pytaniami (mistakesOnly=true, więc nie resetuje mistakeQuestions)
  startQuiz(mistakesQuizData, quizState.filename, true);
  
  // Przywróć oryginalne pytania (dla mapowania nowych błędów)
  quizState.originalQuestions = originalQuestionsBackup;
  
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
    questionOrder: quizState.questionOrder, // Zapisz kolejność pytań jeśli była losowana
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

// ============================================
// EXPORTS (Global scope for non-module usage)
// ============================================

window.initQuizEngine = initQuizEngine;
window.startQuiz = startQuiz;
window.resetMistakes = resetMistakes;

console.log('✅ Quiz engine initialized');

})(); // End of IIFE
