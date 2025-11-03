// ============================================
// SESSION MANAGER - Session handling, Continue dialog, User role management
// ============================================

(function () {
  'use strict';

  const sessionManager = {
    savedSession: null,
    currentUserRole: 'user', // Default role

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
    handleContinueNo(elements, state, contentManager, uiManager) {
      elements.continueDialog.classList.add('hidden');
      localStorage.removeItem('currentSession');

      const session = this.savedSession;
      this.savedSession = null;

      // Rozpocznij quiz/trening od nowa
      if (session && session.type === 'quiz') {
        contentManager.loadAndStartQuiz(session.id, state, elements, null, uiManager, true); // skipSessionCheck = true
      } else if (session && session.type === 'workout') {
        contentManager.loadAndStartWorkout(session.id, state, elements, uiManager, this);
      }
    },

    /**
     * Obsługa kliknięcia przycisku Home
     */
    handleHomeButtonClick(state, elements, uiManager, contentManager) {
      // BUGFIX: Sprawdź czy jakiś modal jest otwarty i zamknij go
      const openModals = [
        elements.aiGeneratorModal,
        elements.importModal,
        elements.loginModal,
        elements.registerModal,
        elements.resetPasswordModal,
        elements.newPasswordModal,
        elements.deleteModal
      ].filter(modal => modal && !modal.classList.contains('hidden'));

      if (openModals.length > 0) {
        // Zamknij wszystkie otwarte modale
        openModals.forEach(modal => modal.classList.add('hidden'));
        return;
      }

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
    },

    /**
     * Ustawia rolę użytkownika (wywoływane po zalogowaniu)
     * @param {'admin'|'user'} role - Rola użytkownika
     */
    setUserRole(role) {
      this.currentUserRole = role || 'user';
      console.log('User role set:', this.currentUserRole);
    },

    /**
     * Pobiera aktualną rolę użytkownika
     * @returns {'admin'|'user'} Rola użytkownika
     */
    getUserRole() {
      return this.currentUserRole;
    },

    /**
     * Sprawdza czy użytkownik jest adminem
     * @returns {boolean} True jeśli admin
     */
    isAdmin() {
      return this.currentUserRole === 'admin';
    },

    /**
     * Resetuje rolę do domyślnej (przy wylogowaniu)
     */
    resetUserRole() {
      this.currentUserRole = 'user';
      console.log('User role reset to default');
    }
  };

  // Eksportuj globalnie
  window.sessionManager = sessionManager;

  console.log('✅ Session manager initialized');
})(); // End of IIFE
