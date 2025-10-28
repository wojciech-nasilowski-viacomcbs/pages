// ============================================
// UI MANAGER - Screens, Tabs, Errors, Sound
// ============================================

(function() {
'use strict';

const uiManager = {
  
  /**
   * Przełącza widoki aplikacji
   */
  showScreen(screenName, state, elements, contentManager, sessionManager) {
    // Ukryj wszystkie ekrany
    elements.mainScreen.classList.add('hidden');
    elements.quizScreen.classList.add('hidden');
    elements.quizSummaryScreen.classList.add('hidden');
    elements.workoutScreen.classList.add('hidden');
    elements.workoutEndScreen.classList.add('hidden');
    if (elements.moreScreen) elements.moreScreen.classList.add('hidden');
    if (elements.listeningScreen) elements.listeningScreen.classList.add('hidden'); // NOWE
    
    // Pokaż wybrany ekran
    switch (screenName) {
      case 'main':
        elements.mainScreen.classList.remove('hidden');
        state.currentView = 'main';
        if (contentManager) {
          contentManager.renderCards(state, elements, this, sessionManager);
        }
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
      case 'more':
        if (elements.moreScreen) elements.moreScreen.classList.remove('hidden');
        state.currentView = 'more';
        break;
      case 'listening':
        if (elements.listeningScreen) elements.listeningScreen.classList.remove('hidden'); // NOWE
        state.currentView = 'listening';
        break;
      case 'loading':
        // Pokaż loader na głównym ekranie
        elements.mainScreen.classList.remove('hidden');
        break;
    }
    
    // Scroll do góry
    window.scrollTo(0, 0);
  },
  
  /**
   * Przełącza zakładki (Quizy / Treningi / Słuchanie / Więcej)
   */
  switchTab(tab, state, elements, contentManager, sessionManager) {
    // Sprawdź, czy wybrana zakładka jest włączona
    const enabledTabs = featureFlags.getEnabledTabs();
    let targetTab = tab;

    if (!enabledTabs.includes(targetTab)) {
      // Jeśli wybrana zakładka jest wyłączona, przełącz na pierwszą dostępną
      targetTab = enabledTabs.length > 0 ? enabledTabs[0] : null;
      if (!targetTab) {
        console.warn('Brak włączonych zakładek do wyświetlenia.');
        // Opcjonalnie: ukryj tab bar całkowicie, jeśli nie ma żadnych zakładek
        const tabBar = document.getElementById('tab-bar');
        if (tabBar) tabBar.classList.add('hidden');
        return; // Nie rób nic więcej
      }
    }

    state.currentTab = targetTab;
    
    // Zapisz aktualną zakładkę w localStorage
    try {
      localStorage.setItem('lastActiveTab', targetTab);
    } catch (e) {
      console.warn('Nie można zapisać zakładki w localStorage:', e);
    }
    
    // Usuń klasę 'active' ze wszystkich tabów
    [elements.tabQuizzes, elements.tabWorkouts, elements.tabListening, 
     elements.tabImport, elements.tabAIGenerator, elements.tabMore]
      .forEach(btn => btn?.classList.remove('active'));
    
    // Dodaj klasę 'active' do aktywnego taba
    const activeTabButton = {
      'quizzes': elements.tabQuizzes,
      'workouts': elements.tabWorkouts,
      'listening': elements.tabListening,
      'import': elements.tabImport,
      'ai-generator': elements.tabAIGenerator,
      'more': elements.tabMore
    }[targetTab];
    activeTabButton?.classList.add('active');
    
    // Pokaż odpowiedni widok
    if (targetTab === 'more') {
      this.showScreen('more', state, elements, contentManager, sessionManager);
    } else if (targetTab === 'listening') {
      this.showScreen('listening', state, elements, contentManager, sessionManager);
      // Pokaż listę zestawów
      if (typeof showListeningList === 'function') {
        showListeningList();
      }
    } else {
      // Dla quizzes i workouts - renderuj karty
      this.showScreen('main', state, elements, contentManager, sessionManager);
    }
  },
  
  /**
   * Pokazuje komunikat o błędzie
   */
  showError(message, elements) {
    if (!elements) return;
    
    elements.errorMessage.classList.remove('hidden');
    elements.errorMessage.querySelector('p').textContent = message;
    
    setTimeout(() => {
      elements.errorMessage.classList.add('hidden');
    }, 5000);
  },
  
  /**
   * Obsługa przycisku wyciszenia
   */
  handleSoundToggle(elements) {
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
  },
  
  /**
   * Aktualizuje UI w zależności od stanu autentykacji
   */
  updateAuthUI(state, elements, contentManager, sessionManager) {
    if (state.currentUser) {
      // Zalogowany
      elements.guestButtons.classList.add('hidden');
      elements.userInfo.classList.remove('hidden');
      elements.userEmail.textContent = state.currentUser.email;
    } else {
      // Gość
      elements.guestButtons.classList.remove('hidden');
      elements.userInfo.classList.add('hidden');
    }
    
    // Odśwież widok
    if (contentManager) {
      contentManager.renderCards(state, elements, this, sessionManager);
    }
  }
};

// Eksportuj globalnie
window.uiManager = uiManager;

console.log('✅ UI manager initialized');

})(); // End of IIFE

