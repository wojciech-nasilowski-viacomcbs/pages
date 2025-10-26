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
      case 'loading':
        // Pokaż loader na głównym ekranie
        elements.mainScreen.classList.remove('hidden');
        break;
    }
    
    // Scroll do góry
    window.scrollTo(0, 0);
  },
  
  /**
   * Przełącza zakładki (Quizy / Treningi)
   */
  switchTab(tab, state, elements, contentManager, sessionManager) {
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
    if (contentManager) {
      contentManager.renderCards(state, elements, this, sessionManager);
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
      
      // Pokaż zakładki i przyciski
      elements.tabQuizzes.parentElement.classList.remove('hidden');
      elements.addContentButton.classList.remove('hidden');
      elements.aiGeneratorButton.classList.remove('hidden');
    } else {
      // Gość
      elements.guestButtons.classList.remove('hidden');
      elements.userInfo.classList.add('hidden');
      
      // Ukryj zakładki i przyciski
      elements.tabQuizzes.parentElement.classList.add('hidden');
      elements.addContentButton.classList.add('hidden');
      elements.aiGeneratorButton.classList.add('hidden');
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

