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
  workoutHome: document.getElementById('workout-home'),
  
  // Autentykacja - przyciski
  guestButtons: document.getElementById('guest-buttons'),
  userInfo: document.getElementById('user-info'),
  userEmail: document.getElementById('user-email'),
  loginButton: document.getElementById('login-button'),
  registerButton: document.getElementById('register-button'),
  logoutButton: document.getElementById('logout-button'),
  
  // Autentykacja - modale
  loginModal: document.getElementById('login-modal'),
  loginForm: document.getElementById('login-form'),
  loginEmail: document.getElementById('login-email'),
  loginPassword: document.getElementById('login-password'),
  loginError: document.getElementById('login-error'),
  loginSuccess: document.getElementById('login-success'),
  loginCancel: document.getElementById('login-cancel'),
  forgotPasswordLink: document.getElementById('forgot-password-link'),
  
  registerModal: document.getElementById('register-modal'),
  registerForm: document.getElementById('register-form'),
  registerEmail: document.getElementById('register-email'),
  registerPassword: document.getElementById('register-password'),
  registerPasswordConfirm: document.getElementById('register-password-confirm'),
  registerError: document.getElementById('register-error'),
  registerSuccess: document.getElementById('register-success'),
  registerCancel: document.getElementById('register-cancel'),
  
  resetPasswordModal: document.getElementById('reset-password-modal'),
  resetPasswordForm: document.getElementById('reset-password-form'),
  resetEmail: document.getElementById('reset-email'),
  resetError: document.getElementById('reset-error'),
  resetSuccess: document.getElementById('reset-success'),
  resetCancel: document.getElementById('reset-cancel'),
  
  newPasswordModal: document.getElementById('new-password-modal'),
  newPasswordForm: document.getElementById('new-password-form'),
  newPassword: document.getElementById('new-password'),
  newPasswordConfirm: document.getElementById('new-password-confirm'),
  newPasswordError: document.getElementById('new-password-error'),
  newPasswordSuccess: document.getElementById('new-password-success'),
  
  // Import JSON
  addContentButton: document.getElementById('add-content-button'),
  importModal: document.getElementById('import-modal'),
  importTitle: document.getElementById('import-title'),
  importTabFile: document.getElementById('import-tab-file'),
  importTabPaste: document.getElementById('import-tab-paste'),
  importFilePanel: document.getElementById('import-file-panel'),
  importPastePanel: document.getElementById('import-paste-panel'),
  dropZone: document.getElementById('drop-zone'),
  fileInput: document.getElementById('file-input'),
  fileSelectBtn: document.getElementById('file-select-btn'),
  fileName: document.getElementById('file-name'),
  fileNameText: document.getElementById('file-name-text'),
  jsonInput: document.getElementById('json-input'),
  importError: document.getElementById('import-error'),
  importSuccess: document.getElementById('import-success'),
  importSubmit: document.getElementById('import-submit'),
  importCancel: document.getElementById('import-cancel'),
  importClose: document.getElementById('import-close'),
  
  // Delete modal
  deleteModal: document.getElementById('delete-modal'),
  deleteItemTitle: document.getElementById('delete-item-title'),
  deleteConfirm: document.getElementById('delete-confirm'),
  deleteCancel: document.getElementById('delete-cancel')
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
  
  // Nasłuchuj zmian stanu autentykacji
  setupAuthListener();
  
  // Sprawdź czy to recovery link (reset hasła)
  checkPasswordRecovery();
  
  // Wczytaj dane z Supabase
  await loadData();
  
  // Sprawdź zapisaną sesję
  checkSavedSession();
  
  // Pokaż domyślną zakładkę
  switchTab('quizzes');
  
  // Aktualizuj UI autentykacji
  updateAuthUI();
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
  
  // Autentykacja - przyciski
  elements.loginButton.addEventListener('click', () => showModal('login'));
  elements.registerButton.addEventListener('click', () => showModal('register'));
  elements.logoutButton.addEventListener('click', handleLogout);
  
  // Autentykacja - formularze
  elements.loginForm.addEventListener('submit', handleLogin);
  elements.loginCancel.addEventListener('click', () => hideModal('login'));
  elements.forgotPasswordLink.addEventListener('click', () => {
    hideModal('login');
    showModal('reset');
  });
  
  elements.registerForm.addEventListener('submit', handleRegister);
  elements.registerCancel.addEventListener('click', () => hideModal('register'));
  
  elements.resetPasswordForm.addEventListener('submit', handleResetPassword);
  elements.resetCancel.addEventListener('click', () => hideModal('reset'));
  
  elements.newPasswordForm.addEventListener('submit', handleNewPassword);
  
  // Import JSON
  elements.addContentButton.addEventListener('click', openImportModal);
  elements.importClose.addEventListener('click', closeImportModal);
  elements.importCancel.addEventListener('click', closeImportModal);
  elements.importTabFile.addEventListener('click', () => switchImportTab('file'));
  elements.importTabPaste.addEventListener('click', () => switchImportTab('paste'));
  elements.fileSelectBtn.addEventListener('click', () => elements.fileInput.click());
  elements.fileInput.addEventListener('change', handleFileSelect);
  elements.dropZone.addEventListener('click', () => elements.fileInput.click());
  elements.dropZone.addEventListener('dragover', handleDragOver);
  elements.dropZone.addEventListener('dragleave', handleDragLeave);
  elements.dropZone.addEventListener('drop', handleDrop);
  elements.importSubmit.addEventListener('click', handleImport);
  
  // Delete modal
  elements.deleteConfirm.addEventListener('click', handleDelete);
  elements.deleteCancel.addEventListener('click', closeDeleteModal);
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
 * Tylko dla zalogowanych użytkowników
 */
async function loadData() {
  // Jeśli użytkownik nie jest zalogowany, wyczyść dane
  if (!state.currentUser) {
    state.quizzes = [];
    state.workouts = [];
    console.log('👤 Gość - brak danych do wyświetlenia');
    return;
  }
  
  try {
    elements.loader.classList.remove('hidden');
    elements.errorMessage.classList.add('hidden');
    
    // Wczytaj quizy i treningi równolegle (sample + własne)
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
  // Jeśli użytkownik nie jest zalogowany, pokaż landing page
  if (!state.currentUser) {
    elements.contentCards.innerHTML = `
      <div class="col-span-full text-center py-16">
        <div class="max-w-2xl mx-auto">
          <h2 class="text-4xl font-bold text-white mb-4">Witaj w Quizy & Treningi!</h2>
          <p class="text-xl text-gray-300 mb-8">
            Twórz własne quizy i treningi, importuj z JSON lub generuj za pomocą AI.
          </p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-left">
            <div class="bg-gray-800 p-6 rounded-xl">
              <div class="text-4xl mb-3">📝</div>
              <h3 class="text-xl font-bold text-white mb-2">Quizy</h3>
              <p class="text-gray-400 text-sm">
                Różne typy pytań: wielokrotnego wyboru, prawda/fałsz, uzupełnianie, dopasowywanie, słuchowe.
              </p>
            </div>
            <div class="bg-gray-800 p-6 rounded-xl">
              <div class="text-4xl mb-3">💪</div>
              <h3 class="text-xl font-bold text-white mb-2">Treningi</h3>
              <p class="text-gray-400 text-sm">
                Interaktywne treningi z timerem, licznikiem powtórzeń i Wake Lock API.
              </p>
            </div>
          </div>
          <div class="flex gap-4 justify-center">
            <button onclick="document.getElementById('login-button').click()" 
                    class="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition text-lg">
              Zaloguj się
            </button>
            <button onclick="document.getElementById('register-button').click()" 
                    class="px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition text-lg">
              Zarejestruj się
            </button>
          </div>
          <p class="text-gray-500 text-sm mt-6">
            Twoje dane są chronione przez Row Level Security. Tylko Ty masz dostęp do swoich treści.
          </p>
        </div>
      </div>
    `;
    return;
  }
  
  // Dla zalogowanych użytkowników
  const items = state.currentTab === 'quizzes' ? state.quizzes : state.workouts;
  
  if (items.length === 0) {
    elements.contentCards.innerHTML = `
      <div class="col-span-full text-center py-12 text-gray-400">
        <p class="text-xl mb-2">Brak dostępnych treści</p>
        <p class="text-sm">Zaimportuj swoje treści lub poczekaj na przykładowe dane</p>
      </div>
    `;
    return;
  }
  
  elements.contentCards.innerHTML = items.map(item => {
    const icon = state.currentTab === 'quizzes' ? '📝' : '💪';
    const badge = item.isSample ? '<span class="text-xs bg-blue-600 px-2 py-1 rounded">Przykład</span>' : '';
    const deleteButton = !item.isSample ? `
      <button class="delete-btn absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 text-gray-400 hover:text-red-500 hover:scale-110 text-xl z-10"
              data-id="${item.id}"
              data-title="${item.title.replace(/"/g, '&quot;')}"
              title="Usuń">
        ×
      </button>
    ` : '';
    
    return `
      <div class="bg-gray-800 p-6 rounded-xl hover:bg-gray-750 transition cursor-pointer group relative"
           data-id="${item.id}">
        ${deleteButton}
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
  
  // Dodaj event listenery do przycisków usuń
  elements.contentCards.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.dataset.id;
      const title = btn.dataset.title;
      confirmDelete(id, title);
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

// ============================================
// AUTENTYKACJA
// ============================================

/**
 * Aktualizuje UI w zależności od stanu autentykacji
 */
function updateAuthUI() {
  if (state.currentUser) {
    // Zalogowany - pokaż email i przycisk wyloguj
    elements.guestButtons.classList.add('hidden');
    elements.userInfo.classList.remove('hidden');
    elements.userEmail.textContent = state.currentUser.email;
    
    // Pokaż zakładki i przycisk dodawania
    elements.tabQuizzes.parentElement.classList.remove('hidden');
    elements.addContentButton.classList.remove('hidden');
  } else {
    // Gość - pokaż przyciski logowania
    elements.guestButtons.classList.remove('hidden');
    elements.userInfo.classList.add('hidden');
    
    // Ukryj zakładki i przycisk dodawania
    elements.tabQuizzes.parentElement.classList.add('hidden');
    elements.addContentButton.classList.add('hidden');
  }
  
  // Odśwież widok
  renderCards();
}

/**
 * Nasłuchuje zmian stanu autentykacji
 */
function setupAuthListener() {
  authService.onAuthStateChange(async (event, session) => {
    console.log('🔄 Auth state changed:', event);
    
    if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
      state.currentUser = session?.user || null;
      await loadData(); // NAJPIERW załaduj dane
      updateAuthUI(); // POTEM zaktualizuj UI
    } else if (event === 'SIGNED_OUT') {
      state.currentUser = null;
      await loadData(); // NAJPIERW wyczyść dane
      updateAuthUI(); // POTEM zaktualizuj UI
    }
  });
}

/**
 * Sprawdza czy URL zawiera token recovery (reset hasła)
 */
function checkPasswordRecovery() {
  const hash = window.location.hash;
  if (hash.includes('type=recovery')) {
    showModal('newPassword');
  }
}

/**
 * Pokazuje modal
 */
function showModal(type) {
  // Ukryj wszystkie modale
  elements.loginModal.classList.add('hidden');
  elements.registerModal.classList.add('hidden');
  elements.resetPasswordModal.classList.add('hidden');
  elements.newPasswordModal.classList.add('hidden');
  
  // Wyczyść formularze i komunikaty
  clearModalMessages();
  
  // Pokaż wybrany modal
  switch(type) {
    case 'login':
      elements.loginModal.classList.remove('hidden');
      elements.loginEmail.focus();
      break;
    case 'register':
      elements.registerModal.classList.remove('hidden');
      elements.registerEmail.focus();
      break;
    case 'reset':
      elements.resetPasswordModal.classList.remove('hidden');
      elements.resetEmail.focus();
      break;
    case 'newPassword':
      elements.newPasswordModal.classList.remove('hidden');
      elements.newPassword.focus();
      break;
  }
}

/**
 * Ukrywa modal
 */
function hideModal(type) {
  switch(type) {
    case 'login':
      elements.loginModal.classList.add('hidden');
      elements.loginForm.reset();
      break;
    case 'register':
      elements.registerModal.classList.add('hidden');
      elements.registerForm.reset();
      break;
    case 'reset':
      elements.resetPasswordModal.classList.add('hidden');
      elements.resetPasswordForm.reset();
      break;
    case 'newPassword':
      elements.newPasswordModal.classList.add('hidden');
      elements.newPasswordForm.reset();
      break;
  }
  clearModalMessages();
}

/**
 * Czyści komunikaty w modalach
 */
function clearModalMessages() {
  elements.loginError.classList.add('hidden');
  elements.loginSuccess.classList.add('hidden');
  elements.registerError.classList.add('hidden');
  elements.registerSuccess.classList.add('hidden');
  elements.resetError.classList.add('hidden');
  elements.resetSuccess.classList.add('hidden');
  elements.newPasswordError.classList.add('hidden');
  elements.newPasswordSuccess.classList.add('hidden');
}

/**
 * Pokazuje komunikat błędu w modalu
 */
function showModalError(type, message) {
  const errorElement = elements[type + 'Error'];
  errorElement.textContent = message;
  errorElement.classList.remove('hidden');
}

/**
 * Pokazuje komunikat sukcesu w modalu
 */
function showModalSuccess(type, message) {
  const successElement = elements[type + 'Success'];
  successElement.textContent = message;
  successElement.classList.remove('hidden');
}

/**
 * Obsługa logowania
 */
async function handleLogin(e) {
  e.preventDefault();
  clearModalMessages();
  
  const email = elements.loginEmail.value.trim();
  const password = elements.loginPassword.value;
  
  if (!email || !password) {
    showModalError('login', 'Wypełnij wszystkie pola');
    return;
  }
  
  const result = await authService.signIn(email, password);
  
  if (result.success) {
    showModalSuccess('login', result.message);
    setTimeout(() => {
      hideModal('login');
    }, 1000);
  } else {
    showModalError('login', result.error);
  }
}

/**
 * Obsługa rejestracji
 */
async function handleRegister(e) {
  e.preventDefault();
  clearModalMessages();
  
  const email = elements.registerEmail.value.trim();
  const password = elements.registerPassword.value;
  const passwordConfirm = elements.registerPasswordConfirm.value;
  
  if (!email || !password || !passwordConfirm) {
    showModalError('register', 'Wypełnij wszystkie pola');
    return;
  }
  
  if (password.length < 8) {
    showModalError('register', 'Hasło musi mieć minimum 8 znaków');
    return;
  }
  
  if (password !== passwordConfirm) {
    showModalError('register', 'Hasła nie są identyczne');
    return;
  }
  
  const result = await authService.signUp(email, password);
  
  if (result.success) {
    showModalSuccess('register', 'Konto utworzone! Możesz się teraz zalogować.');
    setTimeout(() => {
      hideModal('register');
      showModal('login');
      elements.loginEmail.value = email;
    }, 2000);
  } else {
    showModalError('register', result.error);
  }
}

/**
 * Obsługa wylogowania
 */
async function handleLogout() {
  const result = await authService.signOut();
  
  if (result.success) {
    console.log('✅ Wylogowano');
    // Auth listener automatycznie zaktualizuje UI
  } else {
    showError('Błąd podczas wylogowywania: ' + result.error);
  }
}

/**
 * Obsługa resetowania hasła
 */
async function handleResetPassword(e) {
  e.preventDefault();
  clearModalMessages();
  
  const email = elements.resetEmail.value.trim();
  
  if (!email) {
    showModalError('reset', 'Podaj adres email');
    return;
  }
  
  const result = await authService.resetPassword(email);
  
  if (result.success) {
    showModalSuccess('reset', result.message + ' Sprawdź skrzynkę (także SPAM).');
    setTimeout(() => {
      hideModal('reset');
    }, 3000);
  } else {
    showModalError('reset', result.error);
  }
}

/**
 * Obsługa ustawiania nowego hasła
 */
async function handleNewPassword(e) {
  e.preventDefault();
  clearModalMessages();
  
  const password = elements.newPassword.value;
  const passwordConfirm = elements.newPasswordConfirm.value;
  
  if (!password || !passwordConfirm) {
    showModalError('newPassword', 'Wypełnij wszystkie pola');
    return;
  }
  
  if (password.length < 8) {
    showModalError('newPassword', 'Hasło musi mieć minimum 8 znaków');
    return;
  }
  
  if (password !== passwordConfirm) {
    showModalError('newPassword', 'Hasła nie są identyczne');
    return;
  }
  
  try {
    const { error } = await supabaseClient.auth.updateUser({
      password: password
    });
    
    if (error) throw error;
    
    showModalSuccess('newPassword', 'Hasło zmienione! Możesz się teraz zalogować.');
    setTimeout(() => {
      hideModal('newPassword');
      window.location.hash = ''; // Wyczyść hash z URL
      showModal('login');
    }, 2000);
  } catch (error) {
    showModalError('newPassword', error.message || 'Błąd podczas zmiany hasła');
  }
}

/**
 * ========================================
 * IMPORT JSON
 * ========================================
 */

let currentImportType = 'quiz'; // 'quiz' lub 'workout'
let currentImportTab = 'file'; // 'file' lub 'paste'
let selectedFile = null;

/**
 * Walidacja JSON quizu
 */
function validateQuizJSON(data) {
  const errors = [];
  
  // Sprawdź podstawowe pola
  if (!data.title || typeof data.title !== 'string') {
    errors.push('Brak pola "title" lub nieprawidłowy typ');
  }
  
  if (!data.description || typeof data.description !== 'string') {
    errors.push('Brak pola "description" lub nieprawidłowy typ');
  }
  
  if (!Array.isArray(data.questions) || data.questions.length === 0) {
    errors.push('Brak pytań lub "questions" nie jest tablicą');
  }
  
  // Sprawdź pytania
  if (Array.isArray(data.questions)) {
    data.questions.forEach((q, idx) => {
      if (!q.question || typeof q.question !== 'string') {
        errors.push(`Pytanie ${idx + 1}: brak pola "question"`);
      }
      
      if (!q.type || !['multiple-choice', 'true-false', 'fill-in-blank', 'matching'].includes(q.type)) {
        errors.push(`Pytanie ${idx + 1}: nieprawidłowy typ "${q.type}"`);
      }
      
      if (q.type === 'multiple-choice') {
        if (!Array.isArray(q.options) || q.options.length < 2) {
          errors.push(`Pytanie ${idx + 1}: brak opcji odpowiedzi`);
        }
        if (q.correctAnswer === undefined) {
          errors.push(`Pytanie ${idx + 1}: brak "correctAnswer"`);
        }
      }
      
      if (q.type === 'true-false') {
        if (typeof q.correctAnswer !== 'boolean') {
          errors.push(`Pytanie ${idx + 1}: "correctAnswer" musi być boolean`);
        }
      }
      
      if (q.type === 'fill-in-blank') {
        if (!q.correctAnswer || typeof q.correctAnswer !== 'string') {
          errors.push(`Pytanie ${idx + 1}: brak "correctAnswer"`);
        }
      }
      
      if (q.type === 'matching') {
        if (!Array.isArray(q.pairs) || q.pairs.length === 0) {
          errors.push(`Pytanie ${idx + 1}: brak "pairs"`);
        }
      }
    });
  }
  
  return errors;
}

/**
 * Walidacja JSON treningu
 */
function validateWorkoutJSON(data) {
  const errors = [];
  
  // Sprawdź podstawowe pola
  if (!data.title || typeof data.title !== 'string') {
    errors.push('Brak pola "title" lub nieprawidłowy typ');
  }
  
  if (!data.description || typeof data.description !== 'string') {
    errors.push('Brak pola "description" lub nieprawidłowy typ');
  }
  
  if (!Array.isArray(data.phases) || data.phases.length === 0) {
    errors.push('Brak faz lub "phases" nie jest tablicą');
  }
  
  // Sprawdź fazy
  if (Array.isArray(data.phases)) {
    data.phases.forEach((phase, idx) => {
      if (!phase.name || typeof phase.name !== 'string') {
        errors.push(`Faza ${idx + 1}: brak pola "name"`);
      }
      
      if (!Array.isArray(phase.exercises) || phase.exercises.length === 0) {
        errors.push(`Faza ${idx + 1}: brak ćwiczeń`);
      }
      
      if (Array.isArray(phase.exercises)) {
        phase.exercises.forEach((ex, exIdx) => {
          if (!ex.name || typeof ex.name !== 'string') {
            errors.push(`Faza ${idx + 1}, Ćwiczenie ${exIdx + 1}: brak "name"`);
          }
          
          if (!ex.type || !['reps', 'time'].includes(ex.type)) {
            errors.push(`Faza ${idx + 1}, Ćwiczenie ${exIdx + 1}: nieprawidłowy typ "${ex.type}"`);
          }
          
          if (ex.type === 'reps' && (!ex.reps || typeof ex.reps !== 'number')) {
            errors.push(`Faza ${idx + 1}, Ćwiczenie ${exIdx + 1}: brak "reps"`);
          }
          
          if (ex.type === 'time' && (!ex.duration || typeof ex.duration !== 'number')) {
            errors.push(`Faza ${idx + 1}, Ćwiczenie ${exIdx + 1}: brak "duration"`);
          }
        });
      }
    });
  }
  
  return errors;
}

/**
 * Otwórz modal importu
 */
function openImportModal() {
  currentImportType = state.currentTab === 'quizzes' ? 'quiz' : 'workout';
  currentImportTab = 'file';
  selectedFile = null;
  
  // Ustaw tytuł
  elements.importTitle.textContent = currentImportType === 'quiz' ? 'Dodaj Quiz' : 'Dodaj Trening';
  
  // Resetuj formularz
  elements.fileInput.value = '';
  elements.jsonInput.value = '';
  elements.fileName.classList.add('hidden');
  elements.importError.classList.add('hidden');
  elements.importSuccess.classList.add('hidden');
  
  // Pokaż panel pliku
  elements.importFilePanel.classList.remove('hidden');
  elements.importPastePanel.classList.add('hidden');
  
  // Ustaw aktywną zakładkę
  elements.importTabFile.classList.add('bg-blue-600', 'text-white');
  elements.importTabFile.classList.remove('bg-gray-700', 'text-gray-300');
  elements.importTabPaste.classList.add('bg-gray-700', 'text-gray-300');
  elements.importTabPaste.classList.remove('bg-blue-600', 'text-white');
  
  // Pokaż modal
  elements.importModal.classList.remove('hidden');
}

/**
 * Zamknij modal importu
 */
function closeImportModal() {
  elements.importModal.classList.add('hidden');
}

/**
 * Przełącz zakładkę importu
 */
function switchImportTab(tab) {
  currentImportTab = tab;
  
  if (tab === 'file') {
    elements.importFilePanel.classList.remove('hidden');
    elements.importPastePanel.classList.add('hidden');
    elements.importTabFile.classList.add('bg-blue-600', 'text-white');
    elements.importTabFile.classList.remove('bg-gray-700', 'text-gray-300');
    elements.importTabPaste.classList.add('bg-gray-700', 'text-gray-300');
    elements.importTabPaste.classList.remove('bg-blue-600', 'text-white');
  } else {
    elements.importFilePanel.classList.add('hidden');
    elements.importPastePanel.classList.remove('hidden');
    elements.importTabFile.classList.add('bg-gray-700', 'text-gray-300');
    elements.importTabFile.classList.remove('bg-blue-600', 'text-white');
    elements.importTabPaste.classList.add('bg-blue-600', 'text-white');
    elements.importTabPaste.classList.remove('bg-gray-700', 'text-gray-300');
  }
}

/**
 * Obsługa wyboru pliku
 */
function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) {
    selectedFile = file;
    elements.fileNameText.textContent = file.name;
    elements.fileName.classList.remove('hidden');
  }
}

/**
 * Obsługa drag & drop
 */
function handleDragOver(e) {
  e.preventDefault();
  e.stopPropagation();
  elements.dropZone.classList.add('border-blue-500');
}

function handleDragLeave(e) {
  e.preventDefault();
  e.stopPropagation();
  elements.dropZone.classList.remove('border-blue-500');
}

function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  elements.dropZone.classList.remove('border-blue-500');
  
  const file = e.dataTransfer.files[0];
  if (file && file.type === 'application/json') {
    selectedFile = file;
    elements.fileNameText.textContent = file.name;
    elements.fileName.classList.remove('hidden');
    elements.fileInput.files = e.dataTransfer.files;
  } else {
    showImportError('Proszę wybrać plik JSON');
  }
}

/**
 * Pokaż błąd importu
 */
function showImportError(message) {
  elements.importError.textContent = message;
  elements.importError.classList.remove('hidden');
  elements.importSuccess.classList.add('hidden');
}

/**
 * Pokaż sukces importu
 */
function showImportSuccess(message) {
  elements.importSuccess.textContent = message;
  elements.importSuccess.classList.remove('hidden');
  elements.importError.classList.add('hidden');
}

/**
 * Konwertuje stary format JSON (v1) na nowy (v2)
 */
function convertLegacyFormat(data, type) {
  if (type === 'quiz') {
    // Konwertuj pytania
    if (data.questions) {
      data.questions = data.questions.map(q => {
        const converted = { ...q };
        
        // Konwertuj questionText -> question
        if (q.questionText && !q.question) {
          converted.question = q.questionText;
          delete converted.questionText;
        }
        
        // Konwertuj typy pytań
        if (q.type === 'fill-in-the-blank') {
          converted.type = 'fill-in-blank';
        }
        
        // Konwertuj true-false: isCorrect -> correctAnswer
        if (q.type === 'true-false' && q.isCorrect !== undefined && q.correctAnswer === undefined) {
          converted.correctAnswer = q.isCorrect;
          delete converted.isCorrect;
        }
        
        // Konwertuj multiple-choice: options array
        if (q.type === 'multiple-choice' && Array.isArray(q.options)) {
          // Sprawdź czy options to array obiektów {text, isCorrect}
          if (q.options[0] && typeof q.options[0] === 'object' && q.options[0].text) {
            // Konwertuj na prosty array stringów
            const correctIndex = q.options.findIndex(opt => opt.isCorrect);
            converted.options = q.options.map(opt => opt.text);
            if (correctIndex !== -1) {
              converted.correctAnswer = correctIndex;
            }
          }
        }
        
        // Usuń nieużywane pola
        delete converted.audioText;
        delete converted.audioLang;
        delete converted.audioRate;
        delete converted.acceptableAnswers;
        delete converted.autoPlay;
        delete converted.caseSensitive;
        
        return converted;
      });
      
      // Usuń pytania typu "listening" (nieobsługiwane w v2)
      data.questions = data.questions.filter(q => q.type !== 'listening');
    }
  } else if (type === 'workout') {
    // Konwertuj treningi (jeśli potrzeba)
    // Na razie format treningów jest kompatybilny
  }
  
  return data;
}

/**
 * Obsługa importu
 */
async function handleImport() {
  elements.importError.classList.add('hidden');
  elements.importSuccess.classList.add('hidden');
  
  let jsonData;
  
  try {
    // Pobierz JSON
    if (currentImportTab === 'file') {
      if (!selectedFile) {
        showImportError('Wybierz plik JSON');
        return;
      }
      
      const text = await selectedFile.text();
      jsonData = JSON.parse(text);
    } else {
      const text = elements.jsonInput.value.trim();
      if (!text) {
        showImportError('Wklej JSON');
        return;
      }
      
      jsonData = JSON.parse(text);
    }
  } catch (error) {
    showImportError('Nieprawidłowy format JSON: ' + error.message);
    return;
  }
  
  // Konwertuj stary format (v1) na nowy (v2)
  const originalQuestionsCount = jsonData.questions ? jsonData.questions.length : 0;
  jsonData = convertLegacyFormat(jsonData, currentImportType);
  const convertedQuestionsCount = jsonData.questions ? jsonData.questions.length : 0;
  
  // Informuj o konwersji (opcjonalnie)
  // if (currentImportType === 'quiz' && originalQuestionsCount !== convertedQuestionsCount) {
  //   const removed = originalQuestionsCount - convertedQuestionsCount;
  //   console.log(`ℹ️ Usunięto ${removed} pytań typu "listening" (nieobsługiwane w v2)`);
  // }
  
  // Waliduj JSON
  const errors = currentImportType === 'quiz' 
    ? validateQuizJSON(jsonData) 
    : validateWorkoutJSON(jsonData);
  
  if (errors.length > 0) {
    showImportError('Błędy walidacji:\n• ' + errors.join('\n• '));
    return;
  }
  
  // Zapisz do Supabase
  try {
    if (currentImportType === 'quiz') {
      await dataService.saveQuiz(jsonData);
    } else {
      await dataService.saveWorkout(jsonData);
    }
    
    showImportSuccess('✅ Zaimportowano pomyślnie!');
    
    // Odśwież dane
    await loadData();
    renderCards();
    
    // Zamknij modal po 1.5s
    setTimeout(() => {
      closeImportModal();
    }, 1500);
  } catch (error) {
    showImportError('Błąd podczas zapisywania: ' + error.message);
  }
}

/**
 * ========================================
 * USUWANIE TREŚCI
 * ========================================
 */

let itemToDelete = null;

/**
 * Pokaż modal potwierdzenia usunięcia
 */
function confirmDelete(id, title) {
  itemToDelete = id;
  elements.deleteItemTitle.textContent = title;
  elements.deleteModal.classList.remove('hidden');
}

/**
 * Zamknij modal usuwania
 */
function closeDeleteModal() {
  itemToDelete = null;
  elements.deleteModal.classList.add('hidden');
}

/**
 * Usuń element
 */
async function handleDelete() {
  if (!itemToDelete) return;
  
  try {
    if (state.currentTab === 'quizzes') {
      await dataService.deleteQuiz(itemToDelete);
    } else {
      await dataService.deleteWorkout(itemToDelete);
    }
    
    // Odśwież dane
    await loadData();
    renderCards();
    
    // Zamknij modal
    closeDeleteModal();
  } catch (error) {
    console.error('Błąd podczas usuwania:', error);
    alert('Błąd podczas usuwania: ' + error.message);
  }
}

// Inicjalizuj aplikację po załadowaniu DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})(); // End of IIFE
