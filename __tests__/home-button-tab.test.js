/**
 * @jest-environment jsdom
 */

/**
 * Testy dla bugfixa: Przycisk Home zachowuje aktywną zakładkę
 *
 * Problem: Po kliknięciu przycisku Home aplikacja wracała do ekranu głównego,
 * ale nie aktualizowała wizualnie aktywnej zakładki w dolnym menu.
 *
 * Rozwiązanie: Dodano funkcję updateActiveTab() która synchronizuje wizualną
 * reprezentację z state.currentTab.
 */

describe('Home Button - Active Tab Preservation', () => {
  let state;
  let elements;
  let uiManager;
  let sessionManager;
  let contentManager;

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
      <div id="listening-screen" class="hidden"></div>
      <div id="knowledge-base-screen" class="hidden"></div>
      <div id="content-cards"></div>
      <div id="exit-dialog" class="hidden"></div>
      
      <nav id="tab-bar">
        <button id="tab-workouts" class="tab-button"></button>
        <button id="tab-quizzes" class="tab-button"></button>
        <button id="tab-listening" class="tab-button"></button>
        <button id="tab-knowledge-base" class="tab-button"></button>
        <button id="tab-more" class="tab-button"></button>
      </nav>
    `;

    // Mock state
    state = {
      currentView: 'main',
      currentTab: 'workouts',
      quizzes: [
        { id: 'q1', title: 'Test Quiz 1', filename: 'quiz1.json' },
        { id: 'q2', title: 'Test Quiz 2', filename: 'quiz2.json' }
      ],
      workouts: [
        { id: 'w1', title: 'Test Workout 1', filename: 'workout1.json' },
        { id: 'w2', title: 'Test Workout 2', filename: 'workout2.json' }
      ],
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
      tabMore: document.getElementById('tab-more')
    };

    // Mock managers
    contentManager = {
      renderCards: jest.fn()
    };

    sessionManager = {
      handleHomeButtonClick: jest.fn(),
      handleExitConfirm: jest.fn()
    };

    // Import real ui-manager
    require('../js/ui-manager.js');
    uiManager = window.uiManager;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateActiveTab()', () => {
    test('should highlight the active tab based on state.currentTab', () => {
      // Given: currentTab is 'quizzes'
      state.currentTab = 'quizzes';

      // When: updateActiveTab is called
      uiManager.updateActiveTab(state, elements);

      // Then: only quizzes tab should have 'active' class
      expect(elements.tabQuizzes.classList.contains('active')).toBe(true);
      expect(elements.tabWorkouts.classList.contains('active')).toBe(false);
      expect(elements.tabListening.classList.contains('active')).toBe(false);
      expect(elements.tabKnowledgeBase.classList.contains('active')).toBe(false);
      expect(elements.tabMore.classList.contains('active')).toBe(false);
    });

    test('should highlight workouts tab when currentTab is workouts', () => {
      // Given: currentTab is 'workouts'
      state.currentTab = 'workouts';

      // When: updateActiveTab is called
      uiManager.updateActiveTab(state, elements);

      // Then: only workouts tab should have 'active' class
      expect(elements.tabWorkouts.classList.contains('active')).toBe(true);
      expect(elements.tabQuizzes.classList.contains('active')).toBe(false);
    });

    test('should remove active class from all tabs before highlighting', () => {
      // Given: quizzes tab is active
      elements.tabQuizzes.classList.add('active');
      elements.tabWorkouts.classList.add('active'); // Multiple active (shouldn't happen but test it)
      state.currentTab = 'listening';

      // When: updateActiveTab is called
      uiManager.updateActiveTab(state, elements);

      // Then: only listening tab should be active
      expect(elements.tabListening.classList.contains('active')).toBe(true);
      expect(elements.tabQuizzes.classList.contains('active')).toBe(false);
      expect(elements.tabWorkouts.classList.contains('active')).toBe(false);
    });

    test('should handle knowledge-base tab', () => {
      state.currentTab = 'knowledge-base';
      uiManager.updateActiveTab(state, elements);
      expect(elements.tabKnowledgeBase.classList.contains('active')).toBe(true);
    });

    test('should handle more tab', () => {
      state.currentTab = 'more';
      uiManager.updateActiveTab(state, elements);
      expect(elements.tabMore.classList.contains('active')).toBe(true);
    });
  });

  describe('showScreen("main") integration', () => {
    test('should call updateActiveTab when showing main screen', () => {
      // Given: user is on quizzes tab
      state.currentTab = 'quizzes';
      state.currentView = 'quiz';

      // When: showScreen('main') is called
      uiManager.showScreen('main', state, elements, contentManager, sessionManager);

      // Then: main screen should be visible
      expect(elements.mainScreen.classList.contains('hidden')).toBe(false);
      expect(state.currentView).toBe('main');

      // And: quizzes tab should be highlighted
      expect(elements.tabQuizzes.classList.contains('active')).toBe(true);
      expect(elements.tabWorkouts.classList.contains('active')).toBe(false);
    });

    test('should preserve currentTab when returning from workout', () => {
      // Given: user is on workouts tab and in a workout
      state.currentTab = 'workouts';
      state.currentView = 'workout';

      // When: returning to main screen
      uiManager.showScreen('main', state, elements, contentManager, sessionManager);

      // Then: workouts tab should still be highlighted
      expect(elements.tabWorkouts.classList.contains('active')).toBe(true);
      expect(state.currentTab).toBe('workouts');
    });

    test('should preserve currentTab when returning from quiz', () => {
      // Given: user is on quizzes tab and in a quiz
      state.currentTab = 'quizzes';
      state.currentView = 'quiz';

      // When: returning to main screen
      uiManager.showScreen('main', state, elements, contentManager, sessionManager);

      // Then: quizzes tab should still be highlighted
      expect(elements.tabQuizzes.classList.contains('active')).toBe(true);
      expect(state.currentTab).toBe('quizzes');
    });
  });

  describe('User flow scenarios', () => {
    test('Scenario: User on Workouts tab -> starts workout -> clicks Home -> returns to Workouts list', () => {
      // Step 1: User is on Workouts tab
      state.currentTab = 'workouts';
      state.currentView = 'main';
      elements.tabWorkouts.classList.add('active');

      // Step 2: User starts a workout
      state.currentView = 'workout';
      uiManager.showScreen('workout', state, elements, contentManager, sessionManager);

      // Step 3: User clicks Home and confirms exit
      uiManager.showScreen('main', state, elements, contentManager, sessionManager);

      // Step 4: Verify Workouts tab is still highlighted
      expect(state.currentTab).toBe('workouts');
      expect(elements.tabWorkouts.classList.contains('active')).toBe(true);
      expect(elements.tabQuizzes.classList.contains('active')).toBe(false);
    });

    test('Scenario: User on Quizzes tab -> starts quiz -> clicks Home -> returns to Quizzes list', () => {
      // Step 1: User is on Quizzes tab
      state.currentTab = 'quizzes';
      state.currentView = 'main';
      elements.tabQuizzes.classList.add('active');

      // Step 2: User starts a quiz
      state.currentView = 'quiz';
      uiManager.showScreen('quiz', state, elements, contentManager, sessionManager);

      // Step 3: User clicks Home
      uiManager.showScreen('main', state, elements, contentManager, sessionManager);

      // Step 4: Verify Quizzes tab is still highlighted
      expect(state.currentTab).toBe('quizzes');
      expect(elements.tabQuizzes.classList.contains('active')).toBe(true);
      expect(elements.tabWorkouts.classList.contains('active')).toBe(false);
    });

    test('Scenario: User switches from Workouts to Quizzes -> starts quiz -> clicks Home', () => {
      // Step 1: User is on Workouts tab
      state.currentTab = 'workouts';
      state.currentView = 'main';

      // Step 2: User switches to Quizzes tab
      state.currentTab = 'quizzes';
      uiManager.updateActiveTab(state, elements);

      // Step 3: User starts a quiz
      state.currentView = 'quiz';

      // Step 4: User clicks Home
      uiManager.showScreen('main', state, elements, contentManager, sessionManager);

      // Step 5: Verify Quizzes tab is highlighted (not Workouts)
      expect(state.currentTab).toBe('quizzes');
      expect(elements.tabQuizzes.classList.contains('active')).toBe(true);
      expect(elements.tabWorkouts.classList.contains('active')).toBe(false);
    });

    test('Scenario: User on Quizzes list -> clicks Home -> should stay on Quizzes (no change)', () => {
      // Given: User is already on Quizzes list (main screen)
      state.currentTab = 'quizzes';
      state.currentView = 'main';
      elements.tabQuizzes.classList.add('active');

      // When: User clicks Home (already on main screen)
      // sessionManager.handleHomeButtonClick would return early
      // But if showScreen is called anyway:
      uiManager.showScreen('main', state, elements, contentManager, sessionManager);

      // Then: Should still be on Quizzes tab
      expect(state.currentTab).toBe('quizzes');
      expect(elements.tabQuizzes.classList.contains('active')).toBe(true);
      expect(elements.tabWorkouts.classList.contains('active')).toBe(false);
    });
  });

  describe('Edge cases', () => {
    test('should handle missing tab elements gracefully', () => {
      // Given: some tab elements are null
      elements.tabListening = null;
      elements.tabKnowledgeBase = null;
      state.currentTab = 'quizzes';

      // When: updateActiveTab is called
      expect(() => {
        uiManager.updateActiveTab(state, elements);
      }).not.toThrow();

      // Then: quizzes tab should still be highlighted
      expect(elements.tabQuizzes.classList.contains('active')).toBe(true);
    });

    test('should handle invalid currentTab value', () => {
      // Given: currentTab has invalid value
      state.currentTab = 'invalid-tab';

      // When: updateActiveTab is called
      expect(() => {
        uiManager.updateActiveTab(state, elements);
      }).not.toThrow();

      // Then: no tab should be highlighted
      expect(elements.tabQuizzes.classList.contains('active')).toBe(false);
      expect(elements.tabWorkouts.classList.contains('active')).toBe(false);
    });

    test('should handle undefined currentTab', () => {
      // Given: currentTab is undefined
      state.currentTab = undefined;

      // When: updateActiveTab is called
      expect(() => {
        uiManager.updateActiveTab(state, elements);
      }).not.toThrow();
    });
  });

  describe('Regression tests', () => {
    test('should not change state.currentTab when showing main screen', () => {
      // Given: user is on quizzes tab
      const originalTab = 'quizzes';
      state.currentTab = originalTab;
      state.currentView = 'quiz';

      // When: showScreen('main') is called
      uiManager.showScreen('main', state, elements, contentManager, sessionManager);

      // Then: currentTab should not change
      expect(state.currentTab).toBe(originalTab);
    });

    test('should call renderCards when showing main screen', () => {
      // Given: user is returning to main screen
      state.currentView = 'quiz';

      // When: showScreen('main') is called
      uiManager.showScreen('main', state, elements, contentManager, sessionManager);

      // Then: renderCards should be called
      expect(contentManager.renderCards).toHaveBeenCalledWith(
        state,
        elements,
        uiManager,
        sessionManager
      );
    });
  });
});
