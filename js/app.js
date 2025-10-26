/**
 * Główna logika aplikacji - v2.0 z Supabase
 * Zarządza nawigacją, ładowaniem danych i stanem aplikacji
 */

(function() {
'use strict';

// Stan aplikacji
const state = {
  currentView: 'main',
  currentTab: 'quizzes',
  quizzes: [],
  workouts: [],
  currentUser: null
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
  console.log('🚀 Inicjalizacja aplikacji v2.0...');
  
  // Inicjalizuj moduły (bez importów - używamy globalnych funkcji)
  if (typeof initQuizEngine === 'function') {
    initQuizEngine(showScreen, state);
  }
  if (typeof initWorkoutEngine === 'function') {
    initWorkoutEngine(showScreen, state);
  }
  
  // Podłącz event listenery
  attachEventListeners();
  
  // Sprawdź stan autentykacji
  await checkAuthState();
  
  // Wczytaj dane z Supabase
  await loadData();
  
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
  elements.quizHome.addEventListener('click', () => {
    if (typeof resetMistakes === 'function') {
      resetMistakes(); // Resetuj błędy przy wyjściu z podsumowania
    }
    showScreen('main');
  });
  elements.workoutHome.addEventListener('click', () => showScreen('main'));
}

/**
 * Sprawdza stan autentykacji użytkownika
 */
async function checkAuthState() {
  try {
    state.currentUser = await getCurrentUser();
    console.log('👤 Stan autentykacji:', state.currentUser ? 'Zalogowany' : 'Gość');
  } catch (error) {
    console.error('Błąd sprawdzania autentykacji:', error);
    state.currentUser = null;
  }
}

/**
 * Wczytuje dane z Supabase (quizy i treningi)
 */
async function loadData() {
  try {
    elements.loader.classList.remove('hidden');
    elements.errorMessage.classList.add('hidden');
    
    // Wczytaj quizy i treningi równolegle
    const [quizzes, workouts] = await Promise.all([
      dataService.fetchQuizzes(false), // false = pobierz sample + własne
      dataService.fetchWorkouts(false)
    ]);
    
    // Przekształć dane do formatu używanego przez UI
    state.quizzes = quizzes.map(quiz => ({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      isSample: quiz.is_sample,
      questionCount: 0 // Będzie wczytane przy starcie quizu
    }));
    
    state.workouts = workouts.map(workout => ({
      id: workout.id,
      title: workout.title,
      description: workout.description,
      isSample: workout.is_sample,
      exerciseCount: 0 // Będzie wczytane przy starcie treningu
    }));
    
    console.log('✅ Dane wczytane z Supabase');
    console.log('📝 Quizy:', state.quizzes.length);
    console.log('💪 Treningi:', state.workouts.length);
    
  } catch (error) {
    console.error('❌ Błąd wczytywania danych:', error);
    showError('Nie udało się wczytać treści. Sprawdź połączenie i odśwież stronę.');
  } finally {
    elements.loader.classList.add('hidden');
  }
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
        <p class="text-sm">${state.currentUser ? 'Zaimportuj swoje treści lub przeglądaj przykłady' : 'Zaloguj się, aby dodać własne treści'}</p>
      </div>
    `;
    return;
  }
  
  elements.contentCards.innerHTML = items.map(item => {
    const icon = state.currentTab === 'quizzes' ? '📝' : '💪';
    const badge = item.isSample ? '<span class="text-xs bg-blue-600 px-2 py-1 rounded">Przykład</span>' : '';
    
    return `
      <div class="bg-gray-800 p-6 rounded-xl hover:bg-gray-750 transition cursor-pointer group"
           data-id="${item.id}">
        <div class="flex justify-between items-start mb-3">
          <div class="text-4xl">${icon}</div>
          ${badge}
        </div>
        <h3 class="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition">
          ${item.title}
        </h3>
        <p class="text-gray-400 text-sm">${item.description || 'Brak opisu'}</p>
      </div>
    `;
  }).join('');
  
  // Dodaj event listenery do kart
  elements.contentCards.querySelectorAll('[data-id]').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      if (state.currentTab === 'quizzes') {
        loadAndStartQuiz(id);
      } else {
        loadAndStartWorkout(id);
      }
    });
  });
}

/**
 * Wczytuje i rozpoczyna quiz
 */
async function loadAndStartQuiz(quizId, skipSessionCheck = false) {
  // Sprawdź czy jest zapisana sesja dla tego quizu (chyba że skipSessionCheck = true)
  if (!skipSessionCheck) {
    const savedSession = localStorage.getItem('currentSession');
    if (savedSession) {
      const session = JSON.parse(savedSession);
      
      // Jeśli to ten sam quiz i sesja nie jest starsza niż 24h
      if (session.type === 'quiz' && session.id === quizId) {
        const sessionAge = Date.now() - session.timestamp;
        if (sessionAge < 24 * 60 * 60 * 1000) {
          // Pokaż dialog kontynuacji
          showContinueDialog(session);
          return;
        }
      }
    }
  }
  
  try {
    showScreen('loading');
    const quizData = await dataService.fetchQuizById(quizId);
    
    if (typeof startQuiz === 'function') {
      startQuiz(quizData, quizId);
    }
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
async function loadAndStartWorkout(workoutId) {
  try {
    showScreen('loading');
    const workoutData = await dataService.fetchWorkoutById(workoutId);
    
    if (typeof startWorkout === 'function') {
      startWorkout(workoutData, workoutId);
    }
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
function showScreen(screenName) {
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
 * Sprawdza, czy jest zapisana sesja (wywoływane przy starcie aplikacji)
 * Teraz tylko czyści wygasłe sesje, dialog pokazuje się przy kliknięciu w quiz
 */
function checkSavedSession() {
  const savedSession = localStorage.getItem('currentSession');
  if (savedSession) {
    const session = JSON.parse(savedSession);
    
    // Sprawdź, czy sesja nie jest starsza niż 24h
    const sessionAge = Date.now() - session.timestamp;
    if (sessionAge >= 24 * 60 * 60 * 1000) {
      // Sesja wygasła - wyczyść
      localStorage.removeItem('currentSession');
    }
    // Jeśli sesja jest aktualna, zostaw ją - dialog pokaże się przy kliknięciu w quiz
  }
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
    loadAndStartQuiz(session.id, true); // skipSessionCheck = true, bo już jesteśmy w dialogu
  } else if (session.type === 'workout') {
    loadAndStartWorkout(session.id);
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
  
  // NIE usuwamy sesji - ma być zapamiętana
  // Przy następnym kliknięciu w quiz pojawi się dialog kontynuacji
  
  // Resetuj błędy quizu przy wyjściu
  if (state.currentView === 'quiz') {
    resetMistakes();
  }
  
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

})(); // End of IIFE
