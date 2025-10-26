// ============================================
// SESSION MANAGER - Session handling, Continue dialog
// ============================================

(function() {
'use strict';

const sessionManager = {
  savedSession: null,
  
  /**
   * Sprawdza czy jest zapisana sesja (wywoływane przy starcie aplikacji)
   * Czyści wygasłe sesje
   */
  checkSavedSession() {
    const savedSession = localStorage.getItem('currentSession');
    if (savedSession) {
      const session = JSON.parse(savedSession);
      
      // Sprawdź, czy sesja nie jest starsza niż 24h
      const sessionAge = Date.now() - session.timestamp;
      if (sessionAge >= 24 * 60 * 60 * 1000) {
        // Sesja wygasła - wyczyść
        localStorage.removeItem('currentSession');
      }
    }
  },
  
  /**
   * Sprawdza czy jest sesja dla danego ID i typu
   * @returns {Object|null} Session object lub null
   */
  checkForSession(id, type) {
    const savedSession = localStorage.getItem('currentSession');
    if (savedSession) {
      const session = JSON.parse(savedSession);
      
      // Jeśli to ten sam quiz/trening i sesja nie jest starsza niż 24h
      if (session.type === type && session.id === id) {
        const sessionAge = Date.now() - session.timestamp;
        if (sessionAge < 24 * 60 * 60 * 1000) {
          return session;
        }
      }
    }
    return null;
  },
  
  /**
   * Pokazuje dialog kontynuacji sesji
   */
  showContinueDialog(session, elements) {
    if (!elements) return;
    
    elements.continueDialog.classList.remove('hidden');
    this.savedSession = session;
  },
  
  /**
   * Obsługa: Tak, kontynuuj sesję
   */
  handleContinueYes(elements, contentManager, state, uiManager) {
    elements.continueDialog.classList.add('hidden');
    
    const session = this.savedSession;
    if (session.type === 'quiz') {
      contentManager.loadAndStartQuiz(session.id, state, elements, null, uiManager, true); // skipSessionCheck = true
    } else if (session.type === 'workout') {
      contentManager.loadAndStartWorkout(session.id, state, elements, uiManager, this);
    }
  },
  
  /**
   * Obsługa: Nie, zacznij od nowa
   */
  handleContinueNo(elements, state) {
    elements.continueDialog.classList.add('hidden');
    localStorage.removeItem('currentSession');
    this.savedSession = null;
  },
  
  /**
   * Obsługa kliknięcia przycisku Home
   */
  handleHomeButtonClick(state, elements, uiManager, contentManager) {
    // Jeśli jesteśmy na stronie głównej, nic nie rób
    if (state.currentView === 'main') {
      return;
    }
    
    // Jeśli jesteśmy w quizie lub treningu, pokaż dialog potwierdzenia
    if (state.currentView === 'quiz' || state.currentView === 'workout') {
      elements.exitDialog.classList.remove('hidden');
    } else {
      // Jeśli jesteśmy na ekranie podsumowania, wróć od razu
      uiManager.showScreen('main', state, elements, contentManager, this);
    }
  },
  
  /**
   * Obsługa: Potwierdź wyjście do menu
   */
  handleExitConfirm(elements, state, uiManager, contentManager) {
    elements.exitDialog.classList.add('hidden');
    
    // NIE usuwamy sesji - ma być zapamiętana
    
    // Resetuj błędy quizu przy wyjściu
    if (state.currentView === 'quiz' && typeof resetMistakes === 'function') {
      resetMistakes();
    }
    
    uiManager.showScreen('main', state, elements, contentManager, this);
  },
  
  /**
   * Obsługa: Anuluj wyjście
   */
  handleExitCancel(elements) {
    elements.exitDialog.classList.add('hidden');
  }
};

// Eksportuj globalnie
window.sessionManager = sessionManager;

console.log('✅ Session manager initialized');

})(); // End of IIFE

