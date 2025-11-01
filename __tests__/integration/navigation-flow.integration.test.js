/**
 * @jest-environment jsdom
 */

/**
 * INTEGRATION TEST: Navigation Flow
 *
 * This test uses REAL modules (not mocks) to verify actual integration
 * between ui-manager, content-manager, session-manager, and state.
 *
 * Critical User Flow:
 * 1. User switches between tabs (Workouts ↔ Quizzes)
 * 2. User starts an activity (quiz/workout)
 * 3. User clicks Home button
 * 4. User should return to the CORRECT tab (not default)
 *
 * This test catches regressions where:
 * - Home button switches to wrong tab
 * - Tab highlight doesn't update
 * - state.currentTab gets overwritten
 * - Visual state doesn't match logical state
 */

const { initializeTestApp } = require('../helpers/app-test-harness');
const { clickElement, getActiveTab, getCurrentScreen, waitFor } = require('../helpers/dom-helpers');
const {
  assertTabIsActive,
  assertScreenIsVisible,
  assertCardsContain,
  assertCardsDoNotContain,
  assertStateTab,
  assertOnlyOneTabActive
} = require('../helpers/assertions');

describe('Navigation Flow - Integration Test', () => {
  let app;

  beforeEach(() => {
    // Initialize app with REAL modules and mock data
    app = initializeTestApp({
      user: { id: 'user-123', email: 'test@example.com', role: 'user' },
      mockData: {
        quizzes: [
          {
            id: 'quiz-1',
            title: 'Spanish A1',
            description: 'Basic Spanish',
            questions: [
              {
                type: 'multiple-choice',
                question: 'What is "hello"?',
                options: ['Hola', 'Adiós'],
                correctAnswer: 0
              }
            ],
            user_id: 'user-123',
            is_public: false
          },
          {
            id: 'quiz-2',
            title: 'English Advanced',
            description: 'Advanced English',
            questions: [
              {
                type: 'multiple-choice',
                question: 'What is "goodbye"?',
                options: ['Hello', 'Goodbye'],
                correctAnswer: 1
              }
            ],
            user_id: 'user-123',
            is_public: false
          }
        ],
        workouts: [
          {
            id: 'workout-1',
            title: 'Morning Routine',
            description: 'Quick morning workout',
            emoji: '🏃',
            phases: [
              {
                name: 'Warm-up',
                exercises: [{ name: 'Jumping Jacks', type: 'time', duration: 30 }]
              }
            ],
            user_id: 'user-123',
            is_public: false
          },
          {
            id: 'workout-2',
            title: 'Evening Stretch',
            description: 'Relaxing stretches',
            emoji: '🧘',
            phases: [
              {
                name: 'Stretch',
                exercises: [{ name: 'Hamstring Stretch', type: 'time', duration: 20 }]
              }
            ],
            user_id: 'user-123',
            is_public: false
          }
        ]
      },
      initialState: {
        currentTab: 'workouts',
        currentView: 'main'
      }
    });

    // Load data into state (simulates app.js loadData)
    app.state.quizzes = [
      { id: 'quiz-1', title: 'Spanish A1', description: 'Basic Spanish' },
      { id: 'quiz-2', title: 'English Advanced', description: 'Advanced English' }
    ];
    app.state.workouts = [
      {
        id: 'workout-1',
        title: 'Morning Routine',
        description: 'Quick morning workout',
        emoji: '🏃'
      },
      { id: 'workout-2', title: 'Evening Stretch', description: 'Relaxing stretches', emoji: '🧘' }
    ];
  });

  describe('Tab Switching - Basic Navigation', () => {
    test('should switch from Workouts to Quizzes and render correct content', () => {
      // GIVEN: User is on Workouts tab
      app.state.currentTab = 'workouts';
      app.uiManager.switchTab(
        'workouts',
        app.state,
        app.elements,
        app.contentManager,
        app.sessionManager
      );

      // Verify initial state
      assertTabIsActive('workouts');
      assertCardsContain('Morning Routine');
      assertCardsDoNotContain('Spanish A1');

      // WHEN: User clicks Quizzes tab
      app.uiManager.switchTab(
        'quizzes',
        app.state,
        app.elements,
        app.contentManager,
        app.sessionManager
      );

      // THEN: Should switch to Quizzes
      assertTabIsActive('quizzes');
      assertStateTab(app.state, 'quizzes');
      assertCardsContain('Spanish A1');
      assertCardsContain('English Advanced');
      assertCardsDoNotContain('Morning Routine');
      assertOnlyOneTabActive();
    });

    test('should switch from Quizzes to Workouts and render correct content', () => {
      // GIVEN: User is on Quizzes tab
      app.state.currentTab = 'quizzes';
      app.uiManager.switchTab(
        'quizzes',
        app.state,
        app.elements,
        app.contentManager,
        app.sessionManager
      );

      assertTabIsActive('quizzes');
      assertCardsContain('Spanish A1');

      // WHEN: User clicks Workouts tab
      app.uiManager.switchTab(
        'workouts',
        app.state,
        app.elements,
        app.contentManager,
        app.sessionManager
      );

      // THEN: Should switch to Workouts
      assertTabIsActive('workouts');
      assertStateTab(app.state, 'workouts');
      assertCardsContain('Morning Routine');
      assertCardsDoNotContain('Spanish A1');
    });

    test('should save currentTab to localStorage when switching', () => {
      // WHEN: User switches to Quizzes
      app.uiManager.switchTab(
        'quizzes',
        app.state,
        app.elements,
        app.contentManager,
        app.sessionManager
      );

      // THEN: localStorage should be updated
      expect(app.mockLocalStorage.getItem('lastActiveTab')).toBe('quizzes');

      // WHEN: User switches to Workouts
      app.uiManager.switchTab(
        'workouts',
        app.state,
        app.elements,
        app.contentManager,
        app.sessionManager
      );

      // THEN: localStorage should be updated again
      expect(app.mockLocalStorage.getItem('lastActiveTab')).toBe('workouts');
    });
  });

  describe('Home Button - Context Preservation (CRITICAL)', () => {
    test('REGRESSION: Home from Workouts tab should stay on Workouts', () => {
      // GIVEN: User is on Workouts tab
      app.state.currentTab = 'workouts';
      app.state.currentView = 'main';
      app.uiManager.switchTab(
        'workouts',
        app.state,
        app.elements,
        app.contentManager,
        app.sessionManager
      );

      assertTabIsActive('workouts');
      assertCardsContain('Morning Routine');

      // WHEN: User clicks Home (already on main, but simulates the flow)
      app.uiManager.showScreen(
        'main',
        app.state,
        app.elements,
        app.contentManager,
        app.sessionManager
      );

      // THEN: Should STAY on Workouts tab (NOT switch to default)
      assertTabIsActive('workouts');
      assertStateTab(app.state, 'workouts');
      assertCardsContain('Morning Routine');
      assertCardsDoNotContain('Spanish A1');
    });

    test('REGRESSION: Home from Quizzes tab should stay on Quizzes', () => {
      // GIVEN: User is on Quizzes tab
      app.state.currentTab = 'quizzes';
      app.state.currentView = 'main';
      app.uiManager.switchTab(
        'quizzes',
        app.state,
        app.elements,
        app.contentManager,
        app.sessionManager
      );

      assertTabIsActive('quizzes');
      assertCardsContain('Spanish A1');

      // WHEN: User clicks Home
      app.uiManager.showScreen(
        'main',
        app.state,
        app.elements,
        app.contentManager,
        app.sessionManager
      );

      // THEN: Should STAY on Quizzes tab
      assertTabIsActive('quizzes');
      assertStateTab(app.state, 'quizzes');
      assertCardsContain('Spanish A1');
      assertCardsDoNotContain('Morning Routine');
    });

    test('REGRESSION: Home from quiz activity should return to Quizzes list', () => {
      // GIVEN: User switched to Quizzes and started a quiz
      app.state.currentTab = 'quizzes';
      app.uiManager.switchTab(
        'quizzes',
        app.state,
        app.elements,
        app.contentManager,
        app.sessionManager
      );

      // Simulate starting a quiz (change view)
      app.state.currentView = 'quiz';
      app.uiManager.showScreen(
        'quiz',
        app.state,
        app.elements,
        app.contentManager,
        app.sessionManager
      );

      expect(getCurrentScreen()).toBe('quiz');

      // WHEN: User clicks Home and confirms exit
      app.sessionManager.handleHomeButtonClick(
        app.state,
        app.elements,
        app.uiManager,
        app.contentManager
      );

      // Dialog should appear
      expect(app.elements.exitDialog.classList.contains('hidden')).toBe(false);

      // User confirms exit
      app.sessionManager.handleExitConfirm(
        app.elements,
        app.state,
        app.uiManager,
        app.contentManager
      );

      // THEN: Should return to Quizzes list (NOT Workouts)
      expect(getCurrentScreen()).toBe('main');
      assertTabIsActive('quizzes');
      assertStateTab(app.state, 'quizzes');
      assertCardsContain('Spanish A1');
      assertCardsDoNotContain('Morning Routine');
    });

    test('REGRESSION: Home from workout activity should return to Workouts list', () => {
      // GIVEN: User is on Workouts and started a workout
      app.state.currentTab = 'workouts';
      app.uiManager.switchTab(
        'workouts',
        app.state,
        app.elements,
        app.contentManager,
        app.sessionManager
      );

      // Simulate starting a workout
      app.state.currentView = 'workout';
      app.uiManager.showScreen(
        'workout',
        app.state,
        app.elements,
        app.contentManager,
        app.sessionManager
      );

      expect(getCurrentScreen()).toBe('workout');

      // WHEN: User clicks Home and confirms
      app.sessionManager.handleHomeButtonClick(
        app.state,
        app.elements,
        app.uiManager,
        app.contentManager
      );
      app.sessionManager.handleExitConfirm(
        app.elements,
        app.state,
        app.uiManager,
        app.contentManager
      );

      // THEN: Should return to Workouts list
      expect(getCurrentScreen()).toBe('main');
      assertTabIsActive('workouts');
      assertStateTab(app.state, 'workouts');
      assertCardsContain('Morning Routine');
      assertCardsDoNotContain('Spanish A1');
    });
  });

  describe('Complex Navigation Flows', () => {
    test('Flow: Workouts → Quizzes → Start Quiz → Home → Should show Quizzes', () => {
      // Step 1: Start on Workouts
      app.state.currentTab = 'workouts';
      app.uiManager.switchTab(
        'workouts',
        app.state,
        app.elements,
        app.contentManager,
        app.sessionManager
      );
      assertTabIsActive('workouts');

      // Step 2: Switch to Quizzes
      app.uiManager.switchTab(
        'quizzes',
        app.state,
        app.elements,
        app.contentManager,
        app.sessionManager
      );
      assertTabIsActive('quizzes');
      assertCardsContain('Spanish A1');

      // Step 3: Start a quiz
      app.state.currentView = 'quiz';
      app.uiManager.showScreen(
        'quiz',
        app.state,
        app.elements,
        app.contentManager,
        app.sessionManager
      );
      expect(getCurrentScreen()).toBe('quiz');

      // Step 4: Click Home
      app.sessionManager.handleHomeButtonClick(
        app.state,
        app.elements,
        app.uiManager,
        app.contentManager
      );
      app.sessionManager.handleExitConfirm(
        app.elements,
        app.state,
        app.uiManager,
        app.contentManager
      );

      // Step 5: Verify - should be on Quizzes list (NOT Workouts)
      expect(getCurrentScreen()).toBe('main');
      assertTabIsActive('quizzes');
      assertStateTab(app.state, 'quizzes');
      assertCardsContain('Spanish A1');
      assertCardsDoNotContain('Morning Routine');
    });

    test('Flow: Multiple tab switches should maintain correct state', () => {
      // Workouts → Quizzes → Workouts → Quizzes
      app.uiManager.switchTab(
        'workouts',
        app.state,
        app.elements,
        app.contentManager,
        app.sessionManager
      );
      assertTabIsActive('workouts');
      assertStateTab(app.state, 'workouts');

      app.uiManager.switchTab(
        'quizzes',
        app.state,
        app.elements,
        app.contentManager,
        app.sessionManager
      );
      assertTabIsActive('quizzes');
      assertStateTab(app.state, 'quizzes');
      assertOnlyOneTabActive();

      app.uiManager.switchTab(
        'workouts',
        app.state,
        app.elements,
        app.contentManager,
        app.sessionManager
      );
      assertTabIsActive('workouts');
      assertStateTab(app.state, 'workouts');
      assertOnlyOneTabActive();

      app.uiManager.switchTab(
        'quizzes',
        app.state,
        app.elements,
        app.contentManager,
        app.sessionManager
      );
      assertTabIsActive('quizzes');
      assertStateTab(app.state, 'quizzes');
      assertOnlyOneTabActive();

      // Final verification
      assertCardsContain('Spanish A1');
      assertCardsDoNotContain('Morning Routine');
    });

    test('Flow: Quiz → Complete → Home → Start Another Quiz → Home', () => {
      // Step 1: Start on Quizzes
      app.uiManager.switchTab(
        'quizzes',
        app.state,
        app.elements,
        app.contentManager,
        app.sessionManager
      );

      // Step 2: Start a quiz
      app.state.currentView = 'quiz';
      app.uiManager.showScreen(
        'quiz',
        app.state,
        app.elements,
        app.contentManager,
        app.sessionManager
      );

      // Step 3: Complete quiz
      app.state.currentView = 'quiz-summary';
      app.uiManager.showScreen(
        'quiz-summary',
        app.state,
        app.elements,
        app.contentManager,
        app.sessionManager
      );
      expect(getCurrentScreen()).toBe('quiz-summary');

      // Step 4: Click Home
      app.uiManager.showScreen(
        'main',
        app.state,
        app.elements,
        app.contentManager,
        app.sessionManager
      );

      // Verify still on Quizzes
      assertTabIsActive('quizzes');
      assertStateTab(app.state, 'quizzes');

      // Step 5: Start another quiz
      app.state.currentView = 'quiz';
      app.uiManager.showScreen(
        'quiz',
        app.state,
        app.elements,
        app.contentManager,
        app.sessionManager
      );

      // Step 6: Click Home again
      app.sessionManager.handleHomeButtonClick(
        app.state,
        app.elements,
        app.uiManager,
        app.contentManager
      );
      app.sessionManager.handleExitConfirm(
        app.elements,
        app.state,
        app.uiManager,
        app.contentManager
      );

      // Step 7: Verify STILL on Quizzes
      assertTabIsActive('quizzes');
      assertStateTab(app.state, 'quizzes');
      assertCardsContain('Spanish A1');
    });
  });

  describe('Edge Cases', () => {
    test('should handle clicking Home when already on main screen', () => {
      // GIVEN: User is on Quizzes list (main screen)
      app.state.currentTab = 'quizzes';
      app.state.currentView = 'main';
      app.uiManager.switchTab(
        'quizzes',
        app.state,
        app.elements,
        app.contentManager,
        app.sessionManager
      );

      // WHEN: User clicks Home (already on main)
      app.sessionManager.handleHomeButtonClick(
        app.state,
        app.elements,
        app.uiManager,
        app.contentManager
      );

      // THEN: Should do nothing (no dialog, stay on Quizzes)
      expect(app.elements.exitDialog.classList.contains('hidden')).toBe(true);
      assertTabIsActive('quizzes');
      assertStateTab(app.state, 'quizzes');
    });

    test('should handle switching to same tab (no-op)', () => {
      // GIVEN: User is on Workouts
      app.uiManager.switchTab(
        'workouts',
        app.state,
        app.elements,
        app.contentManager,
        app.sessionManager
      );
      const renderCallsBefore = app.contentManager.renderCards.mock?.calls?.length || 0;

      // WHEN: User clicks Workouts again
      app.uiManager.switchTab(
        'workouts',
        app.state,
        app.elements,
        app.contentManager,
        app.sessionManager
      );

      // THEN: Should still work (re-render is OK)
      assertTabIsActive('workouts');
      assertStateTab(app.state, 'workouts');
      // Note: renderCards might be called again, which is fine
    });

    test('should handle empty content arrays gracefully', () => {
      // GIVEN: No quizzes available
      app.state.quizzes = [];

      // WHEN: Switch to Quizzes tab
      app.uiManager.switchTab(
        'quizzes',
        app.state,
        app.elements,
        app.contentManager,
        app.sessionManager
      );

      // THEN: Should not crash, show empty state
      assertTabIsActive('quizzes');
      assertStateTab(app.state, 'quizzes');
      expect(app.elements.contentCards.innerHTML).toContain('Brak dostępnych treści');
    });

    test('should maintain tab state across multiple screen transitions', () => {
      // Complex flow: Workouts → Quiz screen → Workout screen → Main
      app.uiManager.switchTab(
        'workouts',
        app.state,
        app.elements,
        app.contentManager,
        app.sessionManager
      );
      assertTabIsActive('workouts');

      // Go to quiz screen (without changing tab)
      app.state.currentView = 'quiz';
      app.uiManager.showScreen(
        'quiz',
        app.state,
        app.elements,
        app.contentManager,
        app.sessionManager
      );

      // Go to workout screen
      app.state.currentView = 'workout';
      app.uiManager.showScreen(
        'workout',
        app.state,
        app.elements,
        app.contentManager,
        app.sessionManager
      );

      // Return to main
      app.uiManager.showScreen(
        'main',
        app.state,
        app.elements,
        app.contentManager,
        app.sessionManager
      );

      // Should still be on Workouts tab
      assertTabIsActive('workouts');
      assertStateTab(app.state, 'workouts');
    });
  });

  describe('State Consistency', () => {
    test('currentTab and visual highlight should always match', () => {
      const tabs = ['workouts', 'quizzes'];

      tabs.forEach(tab => {
        app.uiManager.switchTab(
          tab,
          app.state,
          app.elements,
          app.contentManager,
          app.sessionManager
        );

        // State and visual should match
        assertStateTab(app.state, tab);
        assertTabIsActive(tab);
      });
    });

    test('only one tab should be active at a time', () => {
      app.uiManager.switchTab(
        'workouts',
        app.state,
        app.elements,
        app.contentManager,
        app.sessionManager
      );
      assertOnlyOneTabActive();

      app.uiManager.switchTab(
        'quizzes',
        app.state,
        app.elements,
        app.contentManager,
        app.sessionManager
      );
      assertOnlyOneTabActive();
    });

    test('updateActiveTab should be called when showing main screen', () => {
      // Spy on updateActiveTab
      const updateActiveTabSpy = jest.spyOn(app.uiManager, 'updateActiveTab');

      // GIVEN: User is in a quiz
      app.state.currentTab = 'quizzes';
      app.state.currentView = 'quiz';

      // WHEN: Returning to main screen
      app.uiManager.showScreen(
        'main',
        app.state,
        app.elements,
        app.contentManager,
        app.sessionManager
      );

      // THEN: updateActiveTab should have been called
      expect(updateActiveTabSpy).toHaveBeenCalledWith(app.state, app.elements);

      updateActiveTabSpy.mockRestore();
    });
  });
});
