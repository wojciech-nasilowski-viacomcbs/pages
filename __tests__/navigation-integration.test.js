/**
 * @jest-environment jsdom
 */

/**
 * Kompleksowe testy integracyjne nawigacji
 *
 * Cel: Zapobieganie regresjom w nawigacji między ekranami i zakładkami
 *
 * Testowane scenariusze:
 * 1. Przełączanie zakładek (tab switching)
 * 2. Przycisk Home z różnych ekranów
 * 3. Synchronizacja state.currentTab i wizualnego podświetlenia
 * 4. Renderowanie właściwych treści dla każdej zakładki
 * 5. Zachowanie kontekstu nawigacji
 */

describe('Navigation Integration Tests', () => {
  let state;
  let elements;
  let uiManager;
  let contentManager;
  let sessionManager;

  // Mock window.uiState
  beforeAll(() => {
    window.uiState = {
      navigateToScreen: jest.fn(),
      switchTab: jest.fn(),
      setListeningPlayerActive: jest.fn(),
      getState: jest.fn(() => ({ isActivity: false }))
    };

    // Mock featureFlags
    window.featureFlags = {
      getEnabledTabs: jest.fn(() => ['workouts', 'quizzes', 'listening', 'knowledge-base', 'more']),
      getActiveCoreTabs: jest.fn(() => ['workouts', 'quizzes', 'listening', 'knowledge-base']),
      isQuizzesEnabled: jest.fn(() => true),
      isWorkoutsEnabled: jest.fn(() => true),
      isListeningEnabled: jest.fn(() => true),
      isKnowledgeBaseEnabled: jest.fn(() => true),
      isFileImportEnabled: jest.fn(() => true),
      isAIGeneratorEnabled: jest.fn(() => true)
    };
  });

  beforeEach(() => {
    // Mock window.scrollTo (not implemented in jsdom)
    window.scrollTo = jest.fn();

    // Setup DOM
    document.body.innerHTML = `
      <div id="main-screen" class="hidden"></div>
      <div id="quiz-screen" class="hidden"></div>
      <div id="quiz-summary-screen" class="hidden"></div>
      <div id="workout-screen" class="hidden"></div>
      <div id="workout-end-screen" class="hidden"></div>
      <div id="more-screen" class="hidden"></div>
      <div id="listening-screen" class="hidden">
        <div id="listening-list"></div>
        <div id="listening-player" class="hidden"></div>
      </div>
      <div id="knowledge-base-screen" class="hidden"></div>
      <div id="content-cards"></div>
      <div id="exit-dialog" class="hidden"></div>
      
      <nav id="tab-bar">
        <button id="tab-workouts" class="tab-button" data-tab="workouts">Treningi</button>
        <button id="tab-quizzes" class="tab-button" data-tab="quizzes">Quizy</button>
        <button id="tab-listening" class="tab-button" data-tab="listening">Słuchanie</button>
        <button id="tab-knowledge-base" class="tab-button" data-tab="knowledge-base">Wiedza</button>
        <button id="tab-more" class="tab-button" data-tab="more">Więcej</button>
      </nav>
      
      <button id="home-button">Home</button>
    `;

    // Mock localStorage
    Storage.prototype.getItem = jest.fn();
    Storage.prototype.setItem = jest.fn();

    // Mock state
    state = {
      currentView: 'main',
      currentTab: 'workouts',
      quizzes: [
        { id: 'q1', title: 'Quiz 1', filename: 'quiz1.json' },
        { id: 'q2', title: 'Quiz 2', filename: 'quiz2.json' }
      ],
      workouts: [
        { id: 'w1', title: 'Workout 1', filename: 'workout1.json', emoji: '💪' },
        { id: 'w2', title: 'Workout 2', filename: 'workout2.json', emoji: '🏃' }
      ],
      listeningSets: [{ id: 'l1', title: 'Spanish 101' }],
      currentUser: { id: 'user-123', email: 'test@example.com' }
    };

    // Mock elements
    elements = {
      mainScreen: document.getElementById('main-screen'),
      quizScreen: document.getElementById('quiz-screen'),
      quizSummaryScreen: document.getElementById('quiz-summary-screen'),
      workoutScreen: document.getElementById('workout-screen'),
      workoutEndScreen: document.getElementById('workout-end-screen'),
      moreScreen: document.getElementById('more-screen'),
      listeningScreen: document.getElementById('listening-screen'),
      knowledgeBaseScreen: document.getElementById('knowledge-base-screen'),
      contentCards: document.getElementById('content-cards'),
      exitDialog: document.getElementById('exit-dialog'),
      tabWorkouts: document.getElementById('tab-workouts'),
      tabQuizzes: document.getElementById('tab-quizzes'),
      tabListening: document.getElementById('tab-listening'),
      tabKnowledgeBase: document.getElementById('tab-knowledge-base'),
      tabMore: document.getElementById('tab-more'),
      homeButton: document.getElementById('home-button')
    };

    // Mock managers
    contentManager = {
      renderCards: jest.fn((state, elements) => {
        // Simulate real renderCards behavior
        const items = state.currentTab === 'quizzes' ? state.quizzes : state.workouts;
        elements.contentCards.innerHTML = items
          .map(item => `<div class="card" data-id="${item.id}">${item.title}</div>`)
          .join('');
      }),
      loadKnowledgeBaseArticles: jest.fn()
    };

    sessionManager = {
      handleHomeButtonClick: jest.fn(),
      handleExitConfirm: jest.fn(),
      isAdmin: jest.fn(() => false)
    };

    // Import real ui-manager
    require('../js/ui-manager.js');
    uiManager = window.uiManager;

    // Clear mocks
    jest.clearAllMocks();
  });

  describe('Tab Switching - Basic Functionality', () => {
    test('should switch from Workouts to Quizzes tab', () => {
      // Given: User is on Workouts tab
      state.currentTab = 'workouts';
      state.currentView = 'main';

      // When: User clicks Quizzes tab
      uiManager.switchTab('quizzes', state, elements, contentManager, sessionManager);

      // Then: State should update
      expect(state.currentTab).toBe('quizzes');
      expect(state.currentView).toBe('main');

      // And: Visual highlight should update
      expect(elements.tabQuizzes.classList.contains('active')).toBe(true);
      expect(elements.tabWorkouts.classList.contains('active')).toBe(false);

      // And: Quizzes should be rendered
      expect(contentManager.renderCards).toHaveBeenCalled();
      expect(elements.contentCards.innerHTML).toContain('Quiz 1');
      expect(elements.contentCards.innerHTML).toContain('Quiz 2');
      expect(elements.contentCards.innerHTML).not.toContain('Workout 1');
    });

    test('should switch from Quizzes to Workouts tab', () => {
      // Given: User is on Quizzes tab
      state.currentTab = 'quizzes';
      state.currentView = 'main';

      // When: User clicks Workouts tab
      uiManager.switchTab('workouts', state, elements, contentManager, sessionManager);

      // Then: State should update
      expect(state.currentTab).toBe('workouts');

      // And: Visual highlight should update
      expect(elements.tabWorkouts.classList.contains('active')).toBe(true);
      expect(elements.tabQuizzes.classList.contains('active')).toBe(false);

      // And: Workouts should be rendered
      expect(elements.contentCards.innerHTML).toContain('Workout 1');
      expect(elements.contentCards.innerHTML).toContain('Workout 2');
      expect(elements.contentCards.innerHTML).not.toContain('Quiz 1');
    });

    test('should save currentTab to localStorage when switching', () => {
      // When: User switches to Quizzes
      uiManager.switchTab('quizzes', state, elements, contentManager, sessionManager);

      // Then: localStorage should be updated
      expect(localStorage.setItem).toHaveBeenCalledWith('lastActiveTab', 'quizzes');
    });

    test('should switch to Listening tab', () => {
      // When: User clicks Listening tab
      uiManager.switchTab('listening', state, elements, contentManager, sessionManager);

      // Then: State should update
      expect(state.currentTab).toBe('listening');
      expect(state.currentView).toBe('listening');

      // And: Listening screen should be visible
      expect(elements.listeningScreen.classList.contains('hidden')).toBe(false);
      expect(elements.mainScreen.classList.contains('hidden')).toBe(true);
    });

    test('should switch to Knowledge Base tab', () => {
      // When: User clicks Knowledge Base tab
      uiManager.switchTab('knowledge-base', state, elements, contentManager, sessionManager);

      // Then: State should update
      expect(state.currentTab).toBe('knowledge-base');
      expect(state.currentView).toBe('knowledge-base');

      // And: Knowledge Base screen should be visible
      expect(elements.knowledgeBaseScreen.classList.contains('hidden')).toBe(false);
      expect(contentManager.loadKnowledgeBaseArticles).toHaveBeenCalled();
    });

    test('should switch to More tab', () => {
      // When: User clicks More tab
      uiManager.switchTab('more', state, elements, contentManager, sessionManager);

      // Then: State should update
      expect(state.currentTab).toBe('more');
      expect(state.currentView).toBe('more');

      // And: More screen should be visible
      expect(elements.moreScreen.classList.contains('hidden')).toBe(false);
    });
  });

  describe('Home Button - Context Preservation', () => {
    test('should preserve Workouts tab when returning from workout', () => {
      // Given: User is on Workouts tab and in a workout
      state.currentTab = 'workouts';
      state.currentView = 'workout';
      elements.workoutScreen.classList.remove('hidden');

      // When: User clicks Home
      uiManager.showScreen('main', state, elements, contentManager, sessionManager);

      // Then: Should return to Workouts list
      expect(state.currentView).toBe('main');
      expect(state.currentTab).toBe('workouts'); // NOT changed
      expect(elements.tabWorkouts.classList.contains('active')).toBe(true);
      expect(elements.tabQuizzes.classList.contains('active')).toBe(false);

      // And: Workouts should be rendered
      expect(elements.contentCards.innerHTML).toContain('Workout 1');
      expect(elements.contentCards.innerHTML).not.toContain('Quiz 1');
    });

    test('should preserve Quizzes tab when returning from quiz', () => {
      // Given: User is on Quizzes tab and in a quiz
      state.currentTab = 'quizzes';
      state.currentView = 'quiz';
      elements.quizScreen.classList.remove('hidden');

      // When: User clicks Home
      uiManager.showScreen('main', state, elements, contentManager, sessionManager);

      // Then: Should return to Quizzes list
      expect(state.currentView).toBe('main');
      expect(state.currentTab).toBe('quizzes'); // NOT changed
      expect(elements.tabQuizzes.classList.contains('active')).toBe(true);
      expect(elements.tabWorkouts.classList.contains('active')).toBe(false);

      // And: Quizzes should be rendered
      expect(elements.contentCards.innerHTML).toContain('Quiz 1');
      expect(elements.contentCards.innerHTML).not.toContain('Workout 1');
    });

    test('should preserve Quizzes tab when returning from quiz summary', () => {
      // Given: User completed a quiz
      state.currentTab = 'quizzes';
      state.currentView = 'quiz-summary';

      // When: User clicks Home
      uiManager.showScreen('main', state, elements, contentManager, sessionManager);

      // Then: Should return to Quizzes list with correct tab highlighted
      expect(state.currentTab).toBe('quizzes');
      expect(elements.tabQuizzes.classList.contains('active')).toBe(true);
    });

    test('should preserve Workouts tab when returning from workout end', () => {
      // Given: User completed a workout
      state.currentTab = 'workouts';
      state.currentView = 'workout-end';

      // When: User clicks Home
      uiManager.showScreen('main', state, elements, contentManager, sessionManager);

      // Then: Should return to Workouts list with correct tab highlighted
      expect(state.currentTab).toBe('workouts');
      expect(elements.tabWorkouts.classList.contains('active')).toBe(true);
    });
  });

  describe('Complex Navigation Flows', () => {
    test('Flow: Workouts → Quizzes → Start Quiz → Home → Should show Quizzes', () => {
      // Step 1: User starts on Workouts
      state.currentTab = 'workouts';
      state.currentView = 'main';
      uiManager.updateActiveTab(state, elements);

      // Step 2: User switches to Quizzes
      uiManager.switchTab('quizzes', state, elements, contentManager, sessionManager);
      expect(state.currentTab).toBe('quizzes');

      // Step 3: User starts a quiz
      state.currentView = 'quiz';
      uiManager.showScreen('quiz', state, elements, contentManager, sessionManager);

      // Step 4: User clicks Home
      uiManager.showScreen('main', state, elements, contentManager, sessionManager);

      // Step 5: Verify user is on Quizzes list (NOT Workouts)
      expect(state.currentTab).toBe('quizzes');
      expect(elements.tabQuizzes.classList.contains('active')).toBe(true);
      expect(elements.tabWorkouts.classList.contains('active')).toBe(false);
      expect(elements.contentCards.innerHTML).toContain('Quiz 1');
      expect(elements.contentCards.innerHTML).not.toContain('Workout 1');
    });

    test('Flow: Quizzes → Start Quiz → Complete → Home → Start Another Quiz', () => {
      // Step 1: User is on Quizzes
      state.currentTab = 'quizzes';
      uiManager.switchTab('quizzes', state, elements, contentManager, sessionManager);

      // Step 2: User starts a quiz
      state.currentView = 'quiz';

      // Step 3: User completes quiz
      state.currentView = 'quiz-summary';
      uiManager.showScreen('quiz-summary', state, elements, contentManager, sessionManager);

      // Step 4: User clicks Home
      uiManager.showScreen('main', state, elements, contentManager, sessionManager);

      // Step 5: Verify still on Quizzes tab
      expect(state.currentTab).toBe('quizzes');
      expect(elements.tabQuizzes.classList.contains('active')).toBe(true);

      // Step 6: User starts another quiz
      state.currentView = 'quiz';
      uiManager.showScreen('quiz', state, elements, contentManager, sessionManager);

      // Step 7: User clicks Home again
      uiManager.showScreen('main', state, elements, contentManager, sessionManager);

      // Step 8: Verify STILL on Quizzes tab
      expect(state.currentTab).toBe('quizzes');
      expect(elements.tabQuizzes.classList.contains('active')).toBe(true);
    });

    test('Flow: Multiple tab switches should maintain correct state', () => {
      // Workouts → Quizzes → Listening → Quizzes → Workouts
      uiManager.switchTab('workouts', state, elements, contentManager, sessionManager);
      expect(state.currentTab).toBe('workouts');
      expect(elements.tabWorkouts.classList.contains('active')).toBe(true);

      uiManager.switchTab('quizzes', state, elements, contentManager, sessionManager);
      expect(state.currentTab).toBe('quizzes');
      expect(elements.tabQuizzes.classList.contains('active')).toBe(true);
      expect(elements.tabWorkouts.classList.contains('active')).toBe(false);

      uiManager.switchTab('listening', state, elements, contentManager, sessionManager);
      expect(state.currentTab).toBe('listening');
      expect(elements.tabListening.classList.contains('active')).toBe(true);
      expect(elements.tabQuizzes.classList.contains('active')).toBe(false);

      uiManager.switchTab('quizzes', state, elements, contentManager, sessionManager);
      expect(state.currentTab).toBe('quizzes');
      expect(elements.tabQuizzes.classList.contains('active')).toBe(true);

      uiManager.switchTab('workouts', state, elements, contentManager, sessionManager);
      expect(state.currentTab).toBe('workouts');
      expect(elements.tabWorkouts.classList.contains('active')).toBe(true);
      expect(elements.tabQuizzes.classList.contains('active')).toBe(false);
    });
  });

  describe('Regression Tests - Known Bugs', () => {
    test('BUG: Clicking Home on Quizzes list should NOT switch to Workouts', () => {
      // This is the reported bug!

      // Given: User is on Quizzes list (already on main screen)
      state.currentTab = 'quizzes';
      state.currentView = 'main';
      uiManager.switchTab('quizzes', state, elements, contentManager, sessionManager);

      // Verify initial state
      expect(state.currentTab).toBe('quizzes');
      expect(elements.contentCards.innerHTML).toContain('Quiz 1');

      // When: User clicks Home (even though already on main)
      uiManager.showScreen('main', state, elements, contentManager, sessionManager);

      // Then: Should STAY on Quizzes (NOT switch to Workouts)
      expect(state.currentTab).toBe('quizzes');
      expect(elements.tabQuizzes.classList.contains('active')).toBe(true);
      expect(elements.tabWorkouts.classList.contains('active')).toBe(false);
      expect(elements.contentCards.innerHTML).toContain('Quiz 1');
      expect(elements.contentCards.innerHTML).not.toContain('Workout 1');
    });

    test('BUG: Tab highlight should persist after returning from activity', () => {
      // Given: User is on Quizzes tab
      uiManager.switchTab('quizzes', state, elements, contentManager, sessionManager);
      expect(elements.tabQuizzes.classList.contains('active')).toBe(true);

      // When: User starts and completes a quiz
      state.currentView = 'quiz';
      uiManager.showScreen('quiz', state, elements, contentManager, sessionManager);

      state.currentView = 'quiz-summary';
      uiManager.showScreen('quiz-summary', state, elements, contentManager, sessionManager);

      // When: User returns to main
      uiManager.showScreen('main', state, elements, contentManager, sessionManager);

      // Then: Quizzes tab should STILL be highlighted
      expect(elements.tabQuizzes.classList.contains('active')).toBe(true);
      expect(elements.tabWorkouts.classList.contains('active')).toBe(false);
    });

    test('BUG: updateActiveTab should be called when showing main screen', () => {
      // Given: User is in a quiz
      state.currentTab = 'quizzes';
      state.currentView = 'quiz';

      // Spy on updateActiveTab
      const updateActiveTabSpy = jest.spyOn(uiManager, 'updateActiveTab');

      // When: Returning to main screen
      uiManager.showScreen('main', state, elements, contentManager, sessionManager);

      // Then: updateActiveTab should have been called
      expect(updateActiveTabSpy).toHaveBeenCalledWith(state, elements);
    });

    test('BUG: Clicking Home from Knowledge Base should preserve Knowledge Base tab', () => {
      // This is the CRITICAL bug reported by user!

      // Given: User is on Knowledge Base, viewing an article
      state.currentTab = 'knowledge-base';
      state.currentView = 'knowledge-base';
      uiManager.switchTab('knowledge-base', state, elements, contentManager, sessionManager);

      // Verify initial state
      expect(state.currentTab).toBe('knowledge-base');
      expect(elements.tabKnowledgeBase.classList.contains('active')).toBe(true);

      // When: User clicks Home (to return to KB list)
      uiManager.showScreen('main', state, elements, contentManager, sessionManager);

      // Then: Should STAY on Knowledge Base tab (NOT switch to Workouts!)
      expect(state.currentTab).toBe('knowledge-base');
      expect(state.currentView).toBe('knowledge-base'); // Pokazuje ekran KB, nie main
      expect(elements.tabKnowledgeBase.classList.contains('active')).toBe(true);
      expect(elements.tabWorkouts.classList.contains('active')).toBe(false);
      expect(elements.tabQuizzes.classList.contains('active')).toBe(false);

      // And: Knowledge Base screen should be visible (not empty main screen)
      expect(elements.knowledgeBaseScreen.classList.contains('hidden')).toBe(false);
      expect(elements.mainScreen.classList.contains('hidden')).toBe(true);
    });

    test('BUG: Clicking Home from Listening should preserve Listening tab', () => {
      // Given: User is on Listening tab
      state.currentTab = 'listening';
      state.currentView = 'listening';
      uiManager.switchTab('listening', state, elements, contentManager, sessionManager);

      // When: User clicks Home
      uiManager.showScreen('main', state, elements, contentManager, sessionManager);

      // Then: Should STAY on Listening tab
      expect(state.currentTab).toBe('listening');
      expect(state.currentView).toBe('listening'); // Pokazuje ekran Listening, nie main
      expect(elements.tabListening.classList.contains('active')).toBe(true);
      expect(elements.tabWorkouts.classList.contains('active')).toBe(false);

      // And: Listening screen should be visible
      expect(elements.listeningScreen.classList.contains('hidden')).toBe(false);
      expect(elements.mainScreen.classList.contains('hidden')).toBe(true);
    });

    test('BUG: Clicking Home from More should preserve More tab', () => {
      // Given: User is on More tab
      state.currentTab = 'more';
      state.currentView = 'more';
      uiManager.switchTab('more', state, elements, contentManager, sessionManager);

      // When: User clicks Home
      uiManager.showScreen('main', state, elements, contentManager, sessionManager);

      // Then: Should STAY on More tab
      expect(state.currentTab).toBe('more');
      expect(state.currentView).toBe('more'); // Pokazuje ekran More, nie main
      expect(elements.tabMore.classList.contains('active')).toBe(true);
      expect(elements.tabWorkouts.classList.contains('active')).toBe(false);

      // And: More screen should be visible
      expect(elements.moreScreen.classList.contains('hidden')).toBe(false);
      expect(elements.mainScreen.classList.contains('hidden')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle switching to same tab (no-op)', () => {
      // Given: User is on Workouts
      state.currentTab = 'workouts';
      uiManager.switchTab('workouts', state, elements, contentManager, sessionManager);

      // When: User clicks Workouts again
      const renderCallsBefore = contentManager.renderCards.mock.calls.length;
      uiManager.switchTab('workouts', state, elements, contentManager, sessionManager);

      // Then: Should still work (re-render is OK)
      expect(state.currentTab).toBe('workouts');
      expect(contentManager.renderCards.mock.calls.length).toBeGreaterThan(renderCallsBefore);
    });

    test('should handle empty quizzes array', () => {
      // Given: No quizzes available
      state.quizzes = [];
      state.currentTab = 'quizzes';

      // When: Switching to Quizzes tab
      uiManager.switchTab('quizzes', state, elements, contentManager, sessionManager);

      // Then: Should not crash
      expect(state.currentTab).toBe('quizzes');
      expect(elements.tabQuizzes.classList.contains('active')).toBe(true);
    });

    test('should handle empty workouts array', () => {
      // Given: No workouts available
      state.workouts = [];
      state.currentTab = 'workouts';

      // When: Switching to Workouts tab
      uiManager.switchTab('workouts', state, elements, contentManager, sessionManager);

      // Then: Should not crash
      expect(state.currentTab).toBe('workouts');
      expect(elements.tabWorkouts.classList.contains('active')).toBe(true);
    });

    test('should handle missing tab elements', () => {
      // Given: Some tab elements are null
      elements.tabListening = null;
      elements.tabKnowledgeBase = null;

      // When: Updating active tab
      expect(() => {
        uiManager.updateActiveTab(state, elements);
      }).not.toThrow();
    });
  });

  describe('State Consistency', () => {
    test('currentTab and visual highlight should always match', () => {
      const tabs = ['workouts', 'quizzes', 'listening', 'knowledge-base', 'more'];

      tabs.forEach(tab => {
        // When: Switching to each tab
        uiManager.switchTab(tab, state, elements, contentManager, sessionManager);

        // Then: State and visual should match
        expect(state.currentTab).toBe(tab);

        const tabElement =
          elements[`tab${tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', '')}`] ||
          elements[
            `tab${tab
              .split('-')
              .map(w => w.charAt(0).toUpperCase() + w.slice(1))
              .join('')}`
          ];

        if (tabElement) {
          expect(tabElement.classList.contains('active')).toBe(true);
        }
      });
    });

    test('only one tab should be active at a time', () => {
      // When: Switching between tabs
      uiManager.switchTab('workouts', state, elements, contentManager, sessionManager);

      let activeTabs = [
        elements.tabWorkouts,
        elements.tabQuizzes,
        elements.tabListening,
        elements.tabKnowledgeBase,
        elements.tabMore
      ].filter(tab => tab && tab.classList.contains('active'));

      expect(activeTabs.length).toBe(1);

      // Switch to another tab
      uiManager.switchTab('quizzes', state, elements, contentManager, sessionManager);

      activeTabs = [
        elements.tabWorkouts,
        elements.tabQuizzes,
        elements.tabListening,
        elements.tabKnowledgeBase,
        elements.tabMore
      ].filter(tab => tab && tab.classList.contains('active'));

      expect(activeTabs.length).toBe(1);
      expect(activeTabs[0]).toBe(elements.tabQuizzes);
    });

    test('currentView should update when showing different screens', () => {
      const screens = [
        { name: 'main', view: 'main' },
        { name: 'quiz', view: 'quiz' },
        { name: 'workout', view: 'workout' },
        { name: 'listening', view: 'listening' },
        { name: 'knowledge-base', view: 'knowledge-base' },
        { name: 'more', view: 'more' }
      ];

      screens.forEach(({ name, view }) => {
        uiManager.showScreen(name, state, elements, contentManager, sessionManager);
        expect(state.currentView).toBe(view);
      });
    });
  });

  describe('Content Rendering', () => {
    test('should render correct content for Workouts tab', () => {
      // When: On Workouts tab
      uiManager.switchTab('workouts', state, elements, contentManager, sessionManager);

      // Then: Should show workouts, not quizzes
      expect(elements.contentCards.innerHTML).toContain('Workout 1');
      expect(elements.contentCards.innerHTML).toContain('Workout 2');
      expect(elements.contentCards.innerHTML).not.toContain('Quiz 1');
      expect(elements.contentCards.innerHTML).not.toContain('Quiz 2');
    });

    test('should render correct content for Quizzes tab', () => {
      // When: On Quizzes tab
      uiManager.switchTab('quizzes', state, elements, contentManager, sessionManager);

      // Then: Should show quizzes, not workouts
      expect(elements.contentCards.innerHTML).toContain('Quiz 1');
      expect(elements.contentCards.innerHTML).toContain('Quiz 2');
      expect(elements.contentCards.innerHTML).not.toContain('Workout 1');
      expect(elements.contentCards.innerHTML).not.toContain('Workout 2');
    });

    test('should re-render content when switching tabs', () => {
      // Start on Workouts
      uiManager.switchTab('workouts', state, elements, contentManager, sessionManager);
      expect(elements.contentCards.innerHTML).toContain('Workout 1');

      // Switch to Quizzes
      uiManager.switchTab('quizzes', state, elements, contentManager, sessionManager);
      expect(elements.contentCards.innerHTML).toContain('Quiz 1');
      expect(elements.contentCards.innerHTML).not.toContain('Workout 1');

      // Switch back to Workouts
      uiManager.switchTab('workouts', state, elements, contentManager, sessionManager);
      expect(elements.contentCards.innerHTML).toContain('Workout 1');
      expect(elements.contentCards.innerHTML).not.toContain('Quiz 1');
    });
  });
});
