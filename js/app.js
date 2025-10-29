/**
 * Główna logika aplikacji - v2.0 z Supabase
 * Zarządza inicjalizacją, autentykacją i orkiestracją modułów
 */

(function() {
'use strict';

// Stan aplikacji
const state = {
  currentView: 'main',
  currentTab: 'quizzes', // możliwe: 'quizzes', 'workouts', 'listening', 'more' - będzie nadpisane z localStorage
  quizzes: [],
  workouts: [],
  listeningSets: [], // NOWE
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
  listeningScreen: document.getElementById('listening-screen'), // NOWE
  continueDialog: document.getElementById('continue-dialog'),
  exitDialog: document.getElementById('exit-dialog'),
  
  // Główny ekran
  tabQuizzes: document.getElementById('tab-quizzes'),
  tabWorkouts: document.getElementById('tab-workouts'),
  tabListening: document.getElementById('tab-listening'),
  tabImport: document.getElementById('tab-import'), // NOWE - bezpośrednia zakładka Import
  tabAIGenerator: document.getElementById('tab-ai-generator'), // NOWE - bezpośrednia zakładka AI
  tabMore: document.getElementById('tab-more'),
  moreScreen: document.getElementById('more-screen'),
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
  addContentButton: document.getElementById('add-content-button'), // stary (usunięty z HTML)
  addContentButtonMore: document.getElementById('add-content-button-more'), // NOWE
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
  deleteCancel: document.getElementById('delete-cancel'),
  
  // AI Generator
  aiGeneratorButton: document.getElementById('ai-generator-button'), // stary (usunięty z HTML)
  aiGeneratorButtonMore: document.getElementById('ai-generator-button-more'), // NOWE
  aiGeneratorModal: document.getElementById('ai-generator-modal'),
  aiTypeQuiz: document.getElementById('ai-type-quiz'),
  aiTypeWorkout: document.getElementById('ai-type-workout'),
  aiHintQuiz: document.getElementById('ai-hint-quiz'),
  aiHintWorkout: document.getElementById('ai-hint-workout'),
  aiPrompt: document.getElementById('ai-prompt'),
  aiError: document.getElementById('ai-error'),
  aiSuccess: document.getElementById('ai-success'),
  aiLoading: document.getElementById('ai-loading'),
  aiGenerate: document.getElementById('ai-generate'),
  aiCancel: document.getElementById('ai-cancel'),
  aiClose: document.getElementById('ai-close')
};

/**
 * Inicjalizacja aplikacji
 */
async function init() {
  console.log('🚀 Inicjalizacja aplikacji v2.0...');
  
  // Zastosuj feature flagi do UI
  applyFeatureFlags(elements);

  // Przywróć ostatnią aktywną zakładkę z localStorage
  try {
    const lastTab = localStorage.getItem('lastActiveTab');
    if (lastTab && ['quizzes', 'workouts', 'listening', 'more'].includes(lastTab)) {
      state.currentTab = lastTab;
      console.log(`📌 Przywrócono zakładkę: ${lastTab}`);
    }
  } catch (e) {
    console.warn('Nie można odczytać zakładki z localStorage:', e);
  }
  
  // Inicjalizuj moduły (tylko jeśli są włączone)
  if (featureFlags.isQuizzesEnabled() && typeof initQuizEngine === 'function') {
    initQuizEngine(
      (screen) => uiManager.showScreen(screen, state, elements, contentManager, sessionManager),
      state
    );
  }
  if (featureFlags.isWorkoutsEnabled() && typeof initWorkoutEngine === 'function') {
    initWorkoutEngine(
      (screen) => uiManager.showScreen(screen, state, elements, contentManager, sessionManager),
      state
    );
  }
  if (featureFlags.isListeningEnabled() && typeof initListeningEngine === 'function') {
    initListeningEngine(
      (screen) => uiManager.showScreen(screen, state, elements, contentManager, sessionManager),
      state
    );
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
  await contentManager.loadData(state, elements, uiManager);
  
  // Sprawdź zapisaną sesję
  sessionManager.checkSavedSession();
  
  // Pokaż domyślną zakładkę (pierwszą z włączonych)
  const enabledTabs = featureFlags.getActiveCoreTabs();
  const defaultTab = enabledTabs.length > 0 ? enabledTabs[0] : 'more';
  uiManager.switchTab(defaultTab, state, elements, contentManager, sessionManager);
  
  // Aktualizuj UI autentykacji
  uiManager.updateAuthUI(state, elements, contentManager, sessionManager);
  
  // Dodaj potwierdzenie przed opuszczeniem strony
  setupBeforeUnloadWarning();
}

/**
 * Dodaje ostrzeżenie przed opuszczeniem strony (refresh/back/zamknięcie)
 */
function setupBeforeUnloadWarning() {
  window.addEventListener('beforeunload', (e) => {
    // Pokaż ostrzeżenie tylko jeśli użytkownik jest w trakcie aktywności
    const isActive = 
      state.currentView !== 'main' || // Jest w quizie/treningu/odtwarzaczu
      (window.listeningEngine && window.listeningEngine.isPlaying && window.listeningEngine.isPlaying()); // Odtwarza listening
    
    if (isActive) {
      // Standardowa wiadomość przeglądarki
      e.preventDefault();
      e.returnValue = ''; // Chrome wymaga tego
      return ''; // Niektóre przeglądarki
    }
  });
}

/**
 * Podłącza event listenery
 */
function attachEventListeners() {
  // Zakładki (Tab Bar) - tylko dla włączonych modułów
  if (featureFlags.isQuizzesEnabled()) {
    elements.tabQuizzes.addEventListener('click', () => {
      uiManager.switchTab('quizzes', state, elements, contentManager, sessionManager);
    });
  }
  if (featureFlags.isWorkoutsEnabled()) {
    elements.tabWorkouts.addEventListener('click', () => {
      uiManager.switchTab('workouts', state, elements, contentManager, sessionManager);
    });
  }
  if (featureFlags.isListeningEnabled()) {
    elements.tabListening.addEventListener('click', () => {
      uiManager.switchTab('listening', state, elements, contentManager, sessionManager);
    });
  }
  
  // Zakładki dla funkcji dodatkowych (jeśli są w tab barze)
  if (featureFlags.getEnabledTabs().includes('import')) {
    elements.tabImport.addEventListener('click', () => {
      contentManager.openImportModal(state, elements);
    });
  }
  if (featureFlags.getEnabledTabs().includes('ai-generator')) {
    elements.tabAIGenerator.addEventListener('click', () => {
      contentManager.openAIGeneratorModal(state, elements);
    });
  }
  
  if (featureFlags.getEnabledTabs().includes('more')) {
    elements.tabMore.addEventListener('click', () => {
      uiManager.switchTab('more', state, elements, contentManager, sessionManager);
    });
  }
  
  // Przycisk powrotu do strony głównej
  elements.homeButton.addEventListener('click', () => {
    sessionManager.handleHomeButtonClick(state, elements, uiManager, contentManager);
  });
  
  // Przycisk dźwięku
  elements.soundToggle.addEventListener('click', () => {
    uiManager.handleSoundToggle(elements);
  });
  
  // Dialog kontynuacji
  elements.continueYes.addEventListener('click', () => {
    sessionManager.handleContinueYes(elements, contentManager, state, uiManager);
  });
  elements.continueNo.addEventListener('click', () => {
    sessionManager.handleContinueNo(elements, state, contentManager, uiManager);
  });
  
  // Dialog wyjścia
  elements.exitConfirm.addEventListener('click', () => {
    sessionManager.handleExitConfirm(elements, state, uiManager, contentManager);
  });
  elements.exitCancel.addEventListener('click', () => {
    sessionManager.handleExitCancel(elements);
  });
  
  // Przyciski powrotu do menu
  elements.quizHome.addEventListener('click', () => {
    if (typeof resetMistakes === 'function') {
      resetMistakes();
    }
    uiManager.showScreen('main', state, elements, contentManager, sessionManager);
  });
  elements.workoutHome.addEventListener('click', () => {
    uiManager.showScreen('main', state, elements, contentManager, sessionManager);
  });
  
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
  // Stary przycisk (jeśli istnieje - dla kompatybilności)
  if (elements.addContentButton) {
    elements.addContentButton.addEventListener('click', () => {
      contentManager.openImportModal(state, elements);
    });
  }
  // Nowy przycisk w ekranie "Więcej"
  if (featureFlags.isFileImportEnabled()) {
    elements.addContentButtonMore.addEventListener('click', () => {
      contentManager.openImportModal(state, elements);
    });
  }
  elements.importClose.addEventListener('click', () => {
    contentManager.closeImportModal(elements);
  });
  elements.importCancel.addEventListener('click', () => {
    contentManager.closeImportModal(elements);
  });
  elements.importTabFile.addEventListener('click', () => {
    contentManager.switchImportTab('file', elements);
  });
  elements.importTabPaste.addEventListener('click', () => {
    contentManager.switchImportTab('paste', elements);
  });
  elements.fileSelectBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    elements.fileInput.click();
  });
  elements.fileInput.addEventListener('change', (e) => {
    contentManager.handleFileSelect(e, elements);
  });
  elements.dropZone.addEventListener('click', () => elements.fileInput.click());
  elements.dropZone.addEventListener('dragover', (e) => {
    contentManager.handleDragOver(e, elements);
  });
  elements.dropZone.addEventListener('dragleave', (e) => {
    contentManager.handleDragLeave(e, elements);
  });
  elements.dropZone.addEventListener('drop', (e) => {
    contentManager.handleDrop(e, elements);
  });
  elements.importSubmit.addEventListener('click', () => {
    contentManager.handleImport(state, elements, uiManager);
  });
  
  // Delete modal
  elements.deleteConfirm.addEventListener('click', () => {
    contentManager.handleDelete(state, elements, uiManager);
  });
  elements.deleteCancel.addEventListener('click', () => {
    contentManager.closeDeleteModal(elements);
  });
  
  // AI Generator
  // Stary przycisk (jeśli istnieje - dla kompatybilności)
  if (elements.aiGeneratorButton) {
    elements.aiGeneratorButton.addEventListener('click', () => {
      contentManager.openAIGeneratorModal(state, elements);
    });
  }
  // Nowy przycisk w ekranie "Więcej"
  if (featureFlags.isAIGeneratorEnabled()) {
    elements.aiGeneratorButtonMore.addEventListener('click', () => {
      contentManager.openAIGeneratorModal(state, elements);
    });
  }
  // Przyciski wyboru typu treści
  elements.aiTypeQuiz.addEventListener('click', () => {
    contentManager.selectedAIType = 'quiz';
    contentManager.updateAITypeButtons(elements);
  });
  elements.aiTypeWorkout.addEventListener('click', () => {
    contentManager.selectedAIType = 'workout';
    contentManager.updateAITypeButtons(elements);
  });
  elements.aiGenerate.addEventListener('click', () => {
    contentManager.handleAIGenerate(state, elements, uiManager);
  });
  elements.aiCancel.addEventListener('click', () => {
    contentManager.closeAIGeneratorModal(elements);
  });
  elements.aiClose.addEventListener('click', () => {
    contentManager.closeAIGeneratorModal(elements);
  });
}

/**
 * Ukrywa/pokazuje elementy UI na podstawie feature flags
 */
function applyFeatureFlags(elements) {
    const enabledTabs = featureFlags.getEnabledTabs();
    
    // Główne moduły (zakładki)
    if (!featureFlags.isQuizzesEnabled()) {
        elements.tabQuizzes.classList.add('hidden');
    } else {
        elements.tabQuizzes.classList.remove('hidden');
    }
    
    if (!featureFlags.isWorkoutsEnabled()) {
        elements.tabWorkouts.classList.add('hidden');
    } else {
        elements.tabWorkouts.classList.remove('hidden');
    }
    
    if (!featureFlags.isListeningEnabled()) {
        elements.tabListening.classList.add('hidden');
    } else {
        elements.tabListening.classList.remove('hidden');
    }
    
    // Funkcje dodatkowe - mogą być w tab barze lub w "Więcej"
    if (enabledTabs.includes('import')) {
        // Import ma swoją zakładkę w tab barze
        elements.tabImport.classList.remove('hidden');
    } else {
        elements.tabImport.classList.add('hidden');
    }
    
    if (enabledTabs.includes('ai-generator')) {
        // AI Generator ma swoją zakładkę w tab barze
        elements.tabAIGenerator.classList.remove('hidden');
    } else {
        elements.tabAIGenerator.classList.add('hidden');
    }
    
    // Zakładka "Więcej"
    if (enabledTabs.includes('more')) {
        elements.tabMore.classList.remove('hidden');
        
        // Przyciski wewnątrz "Więcej" - pokazuj tylko te, które NIE są w tab barze
        if (featureFlags.isFileImportEnabled() && !enabledTabs.includes('import')) {
            elements.addContentButtonMore.classList.remove('hidden');
        } else {
            elements.addContentButtonMore.classList.add('hidden');
        }
        
        if (featureFlags.isAIGeneratorEnabled() && !enabledTabs.includes('ai-generator')) {
            elements.aiGeneratorButtonMore.classList.remove('hidden');
        } else {
            elements.aiGeneratorButtonMore.classList.add('hidden');
        }
    } else {
        elements.tabMore.classList.add('hidden');
    }
    
    // Sprawdź, czy jakikolwiek moduł jest włączony
    if (enabledTabs.length === 0) {
        // Ukryj cały tab bar, jeśli nic nie jest aktywne
        const tabBar = document.getElementById('tab-bar');
        if (tabBar) {
            tabBar.classList.add('hidden');
        }
    }
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
 * Nasłuchuje zmian stanu autentykacji
 */
function setupAuthListener() {
  authService.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN') {
      // WAŻNE: Wyczyść postęp sesji przy logowaniu (bezpieczeństwo/prywatność)
      // Zapobiega wyświetlaniu postępu poprzedniego użytkownika lub gościa
      const newUserId = session?.user?.id;
      const previousUserId = state.currentUser?.id;
      
      // Wyczyść sesję jeśli to inny użytkownik (lub pierwszy login)
      if (!previousUserId || previousUserId !== newUserId) {
        localStorage.removeItem('currentSession');
      }
      
      state.currentUser = session?.user || null;
      await contentManager.loadData(state, elements, uiManager);
      uiManager.updateAuthUI(state, elements, contentManager, sessionManager);
      // Przywróć zapisaną zakładkę po załadowaniu danych
      uiManager.switchTab(state.currentTab, state, elements, contentManager, sessionManager);
    } else if (event === 'USER_UPDATED') {
      // Przy USER_UPDATED nie czyścimy sesji - to ten sam użytkownik
      state.currentUser = session?.user || null;
      await contentManager.loadData(state, elements, uiManager);
      uiManager.updateAuthUI(state, elements, contentManager, sessionManager);
      // Przywróć zapisaną zakładkę po załadowaniu danych
      uiManager.switchTab(state.currentTab, state, elements, contentManager, sessionManager);
    } else if (event === 'SIGNED_OUT') {
      state.currentUser = null;
      await contentManager.loadData(state, elements, uiManager);
      uiManager.updateAuthUI(state, elements, contentManager, sessionManager);
      // Przywróć zapisaną zakładkę po załadowaniu danych
      uiManager.switchTab(state.currentTab, state, elements, contentManager, sessionManager);
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

// ============================================
// AUTENTYKACJA - UI
// ============================================

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
    // WAŻNE: Wyczyść postęp sesji przy wylogowaniu (bezpieczeństwo/prywatność)
    localStorage.removeItem('currentSession');
    
    // Auth listener automatycznie zaktualizuje UI
  } else {
    uiManager.showError('Błąd podczas wylogowywania: ' + result.error, elements);
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
      window.location.hash = '';
      showModal('login');
    }, 2000);
  } catch (error) {
    showModalError('newPassword', error.message || 'Błąd podczas zmiany hasła');
  }
}

// Inicjalizuj aplikację po załadowaniu DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})(); // End of IIFE
