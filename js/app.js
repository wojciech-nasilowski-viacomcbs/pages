/**
 * Główna logika aplikacji
 * Zarządza nawigacją, ładowaniem danych i stanem aplikacji
 */

import { toggleMute, isSoundMuted } from './audio.js';
import { initQuizEngine, startQuiz } from './quiz-engine.js';
import { initWorkoutEngine, startWorkout } from './workout-engine.js';

// Stan aplikacji
const state = {
  currentView: 'main',
  currentTab: 'quizzes',
  quizzes: [],
  workouts: [],
  manifest: null
};

// Elementy DOM
const elements = {
  // Ekrany
  mainScreen: document.getElementById('main-screen'),
  quizScreen: document.getElementById('quiz-screen'),
  quizSummaryScreen: document.getElementById('quiz-summary-screen'),
  workoutScreen: document.getElementById('workout-screen'),
  workoutEndScreen: document.getElementById('workout-end-screen'),
  continueDialog: document.getElementById('continue-dialog'),
  exitDialog: document.getElementById('exit-dialog'),
  
  // Główny ekran
  tabQuizzes: document.getElementById('tab-quizzes'),
  tabWorkouts: document.getElementById('tab-workouts'),
  contentCards: document.getElementById('content-cards'),
  loader: document.getElementById('loader'),
  errorMessage: document.getElementById('error-message'),
  
  // Przyciski nawigacji
  homeButton: document.getElementById('home-button'),
  soundToggle: document.getElementById('sound-toggle'),
  soundIconOn: document.getElementById('sound-icon-on'),
  soundIconOff: document.getElementById('sound-icon-off'),
  
  // Dialog kontynuacji
  continueYes: document.getElementById('continue-yes'),
  continueNo: document.getElementById('continue-no'),
  
  // Dialog wyjścia
  exitConfirm: document.getElementById('exit-confirm'),
  exitCancel: document.getElementById('exit-cancel'),
  
  // Przyciski powrotu do menu
  quizHome: document.getElementById('quiz-home'),
  workoutHome: document.getElementById('workout-home')
};

/**
 * Inicjalizacja aplikacji
 */
async function init() {
  console.log('🚀 Inicjalizacja aplikacji...');
  
  // Inicjalizuj moduły
  initQuizEngine(showScreen, state);
  initWorkoutEngine(showScreen, state);
  
  // Podłącz event listenery
  attachEventListeners();
  
  // Wczytaj dane
  await loadManifest();
  
  // Sprawdź zapisaną sesję
  checkSavedSession();
  
  // Pokaż domyślną zakładkę
  switchTab('quizzes');
}

/**
 * Podłącza event listenery
 */
function attachEventListeners() {
  // Zakładki
  elements.tabQuizzes.addEventListener('click', () => switchTab('quizzes'));
  elements.tabWorkouts.addEventListener('click', () => switchTab('workouts'));
  
  // Przycisk powrotu do strony głównej
  elements.homeButton.addEventListener('click', handleHomeButtonClick);
  
  // Przycisk dźwięku
  elements.soundToggle.addEventListener('click', handleSoundToggle);
  
  // Dialog kontynuacji
  elements.continueYes.addEventListener('click', handleContinueYes);
  elements.continueNo.addEventListener('click', handleContinueNo);
  
  // Dialog wyjścia
  elements.exitConfirm.addEventListener('click', handleExitConfirm);
  elements.exitCancel.addEventListener('click', handleExitCancel);
  
  // Przyciski powrotu do menu
  elements.quizHome.addEventListener('click', () => showScreen('main'));
  elements.workoutHome.addEventListener('click', () => showScreen('main'));
}

/**
 * Wczytuje manifest z listą plików
 */
async function loadManifest() {
  try {
    elements.loader.classList.remove('hidden');
    elements.errorMessage.classList.add('hidden');
    
    const response = await fetch('data/manifest.json');
    if (!response.ok) {
      throw new Error('Nie udało się wczytać manifestu');
    }
    
    state.manifest = await response.json();
    console.log('✅ Manifest wczytany:', state.manifest);
    
    // Wczytaj metadane quizów i treningów
    await loadQuizzesMetadata();
    await loadWorkoutsMetadata();
    
  } catch (error) {
    console.error('❌ Błąd wczytywania manifestu:', error);
    showError('Nie udało się wczytać listy treści. Sprawdź połączenie i odśwież stronę.');
  } finally {
    elements.loader.classList.add('hidden');
  }
}

/**
 * Wczytuje metadane quizów (tytuł, opis)
 */
async function loadQuizzesMetadata() {
  const promises = state.manifest.quizzes.map(async (filename) => {
    try {
      const response = await fetch(`data/quizzes/${filename}`);
      const data = await response.json();
      return {
        filename,
        title: data.title,
        description: data.description,
        questionCount: data.questions?.length || 0
      };
    } catch (error) {
      console.error(`Błąd wczytywania ${filename}:`, error);
      return null;
    }
  });
  
  const results = await Promise.all(promises);
  state.quizzes = results.filter(q => q !== null);
  console.log('📝 Wczytano quizy:', state.quizzes);
}

/**
 * Wczytuje metadane treningów (tytuł, opis)
 */
async function loadWorkoutsMetadata() {
  const promises = state.manifest.workouts.map(async (filename) => {
    try {
      const response = await fetch(`data/workouts/${filename}`);
      const data = await response.json();
      
      // Policz łączną liczbę ćwiczeń
      const exerciseCount = data.phases?.reduce((sum, phase) => 
        sum + (phase.exercises?.length || 0), 0) || 0;
      
      return {
        filename,
        title: data.title,
        description: data.description,
        exerciseCount
      };
    } catch (error) {
      console.error(`Błąd wczytywania ${filename}:`, error);
      return null;
    }
  });
  
  const results = await Promise.all(promises);
  state.workouts = results.filter(w => w !== null);
  console.log('💪 Wczytano treningi:', state.workouts);
}

/**
 * Przełącza zakładki (Quizy / Treningi)
 */
function switchTab(tab) {
  state.currentTab = tab;
  
  // Aktualizuj style zakładek
  if (tab === 'quizzes') {
    elements.tabQuizzes.className = 'flex-1 py-3 px-4 rounded-lg font-semibold transition bg-blue-600 text-white';
    elements.tabWorkouts.className = 'flex-1 py-3 px-4 rounded-lg font-semibold transition bg-gray-800 text-gray-300 hover:bg-gray-700';
  } else {
    elements.tabWorkouts.className = 'flex-1 py-3 px-4 rounded-lg font-semibold transition bg-blue-600 text-white';
    elements.tabQuizzes.className = 'flex-1 py-3 px-4 rounded-lg font-semibold transition bg-gray-800 text-gray-300 hover:bg-gray-700';
  }
  
  // Renderuj karty
  renderCards();
}

/**
 * Renderuje karty quizów lub treningów
 */
function renderCards() {
  const items = state.currentTab === 'quizzes' ? state.quizzes : state.workouts;
  
  if (items.length === 0) {
    elements.contentCards.innerHTML = `
      <div class="col-span-full text-center py-12 text-gray-400">
        <p class="text-xl mb-2">Brak dostępnych treści</p>
        <p class="text-sm">Dodaj pliki JSON do folderu data/${state.currentTab}/</p>
      </div>
    `;
    return;
  }
  
  elements.contentCards.innerHTML = items.map(item => {
    const icon = state.currentTab === 'quizzes' ? '📝' : '💪';
    const countLabel = state.currentTab === 'quizzes' 
      ? `${item.questionCount} pytań` 
      : `${item.exerciseCount} ćwiczeń`;
    
    return `
      <div class="bg-gray-800 p-6 rounded-xl hover:bg-gray-750 transition cursor-pointer group"
           data-filename="${item.filename}">
        <div class="text-4xl mb-3">${icon}</div>
        <h3 class="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition">
          ${item.title}
        </h3>
        <p class="text-gray-400 text-sm mb-3">${item.description}</p>
        <p class="text-xs text-gray-500">${countLabel}</p>
      </div>
    `;
  }).join('');
  
  // Dodaj event listenery do kart
  elements.contentCards.querySelectorAll('[data-filename]').forEach(card => {
    card.addEventListener('click', () => {
      const filename = card.dataset.filename;
      if (state.currentTab === 'quizzes') {
        loadAndStartQuiz(filename);
      } else {
        loadAndStartWorkout(filename);
      }
    });
  });
}

/**
 * Wczytuje i rozpoczyna quiz
 */
async function loadAndStartQuiz(filename) {
  try {
    showScreen('loading');
    const response = await fetch(`data/quizzes/${filename}`);
    if (!response.ok) throw new Error('Nie udało się wczytać quizu');
    
    const quizData = await response.json();
    startQuiz(quizData, filename);
    showScreen('quiz');
  } catch (error) {
    console.error('Błąd wczytywania quizu:', error);
    showError('Nie udało się wczytać quizu. Spróbuj ponownie.');
    showScreen('main');
  }
}

/**
 * Wczytuje i rozpoczyna trening
 */
async function loadAndStartWorkout(filename) {
  try {
    showScreen('loading');
    const response = await fetch(`data/workouts/${filename}`);
    if (!response.ok) throw new Error('Nie udało się wczytać treningu');
    
    const workoutData = await response.json();
    startWorkout(workoutData, filename);
    showScreen('workout');
  } catch (error) {
    console.error('Błąd wczytywania treningu:', error);
    showError('Nie udało się wczytać treningu. Spróbuj ponownie.');
    showScreen('main');
  }
}

/**
 * Przełącza widoki aplikacji
 */
export function showScreen(screenName) {
  // Ukryj wszystkie ekrany
  elements.mainScreen.classList.add('hidden');
  elements.quizScreen.classList.add('hidden');
  elements.quizSummaryScreen.classList.add('hidden');
  elements.workoutScreen.classList.add('hidden');
  elements.workoutEndScreen.classList.add('hidden');
  
  // Pokaż wybrany ekran
  switch (screenName) {
    case 'main':
      elements.mainScreen.classList.remove('hidden');
      state.currentView = 'main';
      renderCards(); // Odśwież karty
      break;
    case 'quiz':
      elements.quizScreen.classList.remove('hidden');
      state.currentView = 'quiz';
      break;
    case 'quiz-summary':
      elements.quizSummaryScreen.classList.remove('hidden');
      state.currentView = 'quiz-summary';
      break;
    case 'workout':
      elements.workoutScreen.classList.remove('hidden');
      state.currentView = 'workout';
      break;
    case 'workout-end':
      elements.workoutEndScreen.classList.remove('hidden');
      state.currentView = 'workout-end';
      break;
    case 'loading':
      // Pokaż loader na głównym ekranie
      elements.mainScreen.classList.remove('hidden');
      break;
  }
  
  // Scroll do góry
  window.scrollTo(0, 0);
}

/**
 * Pokazuje komunikat o błędzie
 */
function showError(message) {
  elements.errorMessage.classList.remove('hidden');
  elements.errorMessage.querySelector('p').textContent = message;
  
  setTimeout(() => {
    elements.errorMessage.classList.add('hidden');
  }, 5000);
}

/**
 * Obsługa przycisku wyciszenia
 */
function handleSoundToggle() {
  const muted = toggleMute();
  
  if (muted) {
    elements.soundIconOn.classList.add('hidden');
    elements.soundIconOff.classList.remove('hidden');
    elements.soundToggle.title = 'Włącz dźwięki';
  } else {
    elements.soundIconOn.classList.remove('hidden');
    elements.soundIconOff.classList.add('hidden');
    elements.soundToggle.title = 'Wycisz dźwięki';
  }
}

/**
 * Sprawdza, czy jest zapisana sesja
 */
function checkSavedSession() {
  const savedSession = localStorage.getItem('currentSession');
  if (savedSession) {
    const session = JSON.parse(savedSession);
    
    // Sprawdź, czy sesja nie jest starsza niż 24h
    const sessionAge = Date.now() - session.timestamp;
    if (sessionAge < 24 * 60 * 60 * 1000) {
      showContinueDialog(session);
      return;
    }
  }
  
  // Brak sesji lub wygasła - wyczyść
  localStorage.removeItem('currentSession');
}

/**
 * Pokazuje dialog kontynuacji sesji
 */
function showContinueDialog(session) {
  elements.continueDialog.classList.remove('hidden');
  
  // Zapisz sesję w state do późniejszego użycia
  state.savedSession = session;
}

/**
 * Obsługa: Tak, kontynuuj sesję
 */
function handleContinueYes() {
  elements.continueDialog.classList.add('hidden');
  
  const session = state.savedSession;
  if (session.type === 'quiz') {
    loadAndStartQuiz(session.filename);
  } else if (session.type === 'workout') {
    loadAndStartWorkout(session.filename);
  }
}

/**
 * Obsługa: Nie, zacznij od nowa
 */
function handleContinueNo() {
  elements.continueDialog.classList.add('hidden');
  localStorage.removeItem('currentSession');
  state.savedSession = null;
}

/**
 * Obsługa kliknięcia przycisku Home
 */
function handleHomeButtonClick() {
  // Jeśli jesteśmy na stronie głównej, nic nie rób
  if (state.currentView === 'main') {
    return;
  }
  
  // Jeśli jesteśmy w quizie lub treningu, pokaż dialog potwierdzenia
  if (state.currentView === 'quiz' || state.currentView === 'workout') {
    elements.exitDialog.classList.remove('hidden');
  } else {
    // Jeśli jesteśmy na ekranie podsumowania, wróć od razu
    showScreen('main');
  }
}

/**
 * Obsługa: Potwierdź wyjście do menu
 */
function handleExitConfirm() {
  elements.exitDialog.classList.add('hidden');
  showScreen('main');
}

/**
 * Obsługa: Anuluj wyjście
 */
function handleExitCancel() {
  elements.exitDialog.classList.add('hidden');
}

// Inicjalizuj aplikację po załadowaniu DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

