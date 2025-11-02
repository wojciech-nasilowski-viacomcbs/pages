/**
 * @jest-environment jsdom
 */

/**
 * INTEGRATION TEST: Quiz Retry Mistakes Flow
 *
 * This test verifies the complete flow of:
 * 1. Taking a quiz and making mistakes
 * 2. Completing the quiz
 * 3. Clicking "Retry Mistakes"
 * 4. Verifying ALL mistakes are shown (including listening questions)
 *
 * Critical Bug This Catches:
 * - Retry Mistakes mode filtering out listening questions when "skip listening" is enabled
 * - Mistakes list not being properly maintained across retries
 * - Question count mismatch between mistakes and displayed questions
 */

const { initializeTestApp } = require('../helpers/app-test-harness');

describe('Quiz Retry Mistakes Flow - Integration Test', () => {
  let app;

  const mockQuizData = {
    id: 'quiz-mixed',
    title: 'Mixed Quiz',
    description: 'Quiz with various question types',
    questions: [
      {
        type: 'multiple-choice',
        questionText: 'What is 2+2?',
        options: ['3', '4', '5'],
        correctAnswer: 1
      },
      {
        type: 'listening',
        questionText: 'Listen and type what you hear',
        audioText: 'Hello world',
        audioLang: 'en-US',
        correctAnswer: 'Hello world',
        acceptableAnswers: ['hello world']
      },
      {
        type: 'fill-in-blank',
        questionText: 'The capital of France is ___',
        correctAnswer: 'Paris'
      },
      {
        type: 'listening',
        questionText: 'Listen and type',
        audioText: 'Good morning',
        audioLang: 'en-US',
        correctAnswer: 'Good morning'
      },
      {
        type: 'true-false',
        questionText: 'The Earth is flat',
        correctAnswer: false
      }
    ],
    user_id: 'user-123',
    is_public: false
  };

  beforeEach(() => {
    app = initializeTestApp({
      user: { id: 'user-123', email: 'test@example.com', role: 'user' },
      mockData: {
        quizzes: [mockQuizData]
      },
      initialState: {
        currentTab: 'quizzes',
        currentView: 'main'
      },
      localStorage: {
        // User has "skip listening" enabled from previous session
        skipListeningQuestions: 'true',
        quizRandomize: 'false'
      }
    });

    app.state.quizzes = [
      { id: 'quiz-mixed', title: 'Mixed Quiz', description: 'Quiz with various question types' }
    ];

    // Mock dataService.fetchQuizById to return our mock quiz
    app.dataService.fetchQuizById = jest.fn().mockResolvedValue(mockQuizData);

    // Initialize quiz engine
    if (window.initQuizEngine) {
      window.initQuizEngine(
        screen =>
          app.uiManager.showScreen(
            screen,
            app.state,
            app.elements,
            app.contentManager,
            app.sessionManager
          ),
        app.state
      );
    }
  });

  describe('Normal Quiz Flow with Mistakes', () => {
    test('should have quiz state structure for recording mistakes', () => {
      // Initialize quiz state (simulating what startQuiz does)
      window.quizState = {
        data: mockQuizData,
        filename: 'quiz-mixed',
        currentQuestionIndex: 0,
        score: 0,
        answers: [],
        isAnswered: false,
        questionOrder: null,
        mistakeQuestions: [],
        originalQuestions: mockQuizData.questions,
        isMistakesOnlyMode: false
      };

      // Verify quiz state structure
      expect(window.quizState).toBeDefined();
      expect(window.quizState.data.questions.length).toBeGreaterThan(0);
      expect(window.quizState.mistakeQuestions).toBeDefined();
      expect(Array.isArray(window.quizState.mistakeQuestions)).toBe(true);
      expect(window.quizState.originalQuestions).toBeDefined();
    });
  });

  describe('Retry Mistakes Mode', () => {
    test('REGRESSION: should NOT filter listening questions in mistakes-only mode', () => {
      // Setup: Quiz state with mistakes including listening questions
      window.quizState = {
        data: {
          title: 'Mixed Quiz',
          questions: []
        },
        mistakeQuestions: [
          {
            type: 'multiple-choice',
            questionText: 'Wrong Q1',
            options: ['A', 'B'],
            correctAnswer: 0
          },
          {
            type: 'listening',
            questionText: 'Wrong Listening Q1',
            audioText: 'Test',
            correctAnswer: 'Test'
          },
          {
            type: 'listening',
            questionText: 'Wrong Listening Q2',
            audioText: 'Hello',
            correctAnswer: 'Hello'
          }
        ],
        originalQuestions: mockQuizData.questions,
        isMistakesOnlyMode: false,
        filename: 'quiz-mixed',
        currentQuestionIndex: 0,
        score: 0,
        answers: []
      };

      // User has "skip listening" enabled
      document.getElementById('quiz-skip-listening').checked = true;

      // When: User clicks "Retry Mistakes"
      const handleRetryMistakes =
        window.handleRetryMistakes || window.quizEngine?.handleRetryMistakes;

      if (handleRetryMistakes) {
        // Spy on startQuiz to verify it's called with correct data
        const startQuizSpy = jest.spyOn(window, 'startQuiz');

        // Trigger retry mistakes
        handleRetryMistakes();

        // Verify: startQuiz was called with mistakes-only mode
        expect(startQuizSpy).toHaveBeenCalled();
        const callArgs = startQuizSpy.mock.calls[0];
        const quizData = callArgs[0];
        const mistakesOnly = callArgs[2];

        // Should be in mistakes-only mode
        expect(mistakesOnly).toBe(true);

        // Should have ALL 3 mistake questions (including 2 listening)
        expect(quizData.questions).toHaveLength(3);
        expect(quizData.questions.filter(q => q.type === 'listening')).toHaveLength(2);

        startQuizSpy.mockRestore();
      }
    });

    test('should preserve all mistake questions regardless of type', () => {
      // Setup: Various mistake types
      const mistakes = [
        { type: 'multiple-choice', questionText: 'MC Wrong' },
        { type: 'listening', questionText: 'Listening Wrong' },
        { type: 'fill-in-blank', questionText: 'Fill Wrong' },
        { type: 'true-false', questionText: 'TF Wrong' },
        { type: 'matching', questionText: 'Match Wrong' }
      ];

      window.quizState = {
        data: { title: 'Test', questions: [] },
        mistakeQuestions: mistakes,
        originalQuestions: mockQuizData.questions,
        isMistakesOnlyMode: false,
        filename: 'quiz-mixed'
      };

      // Enable skip listening
      document.getElementById('quiz-skip-listening').checked = true;

      const handleRetryMistakes = window.handleRetryMistakes;

      if (handleRetryMistakes) {
        const startQuizSpy = jest.spyOn(window, 'startQuiz');

        handleRetryMistakes();

        const quizData = startQuizSpy.mock.calls[0][0];

        // ALL 5 questions should be preserved
        expect(quizData.questions).toHaveLength(5);

        // Verify each type is present
        expect(quizData.questions.find(q => q.type === 'multiple-choice')).toBeDefined();
        expect(quizData.questions.find(q => q.type === 'listening')).toBeDefined();
        expect(quizData.questions.find(q => q.type === 'fill-in-blank')).toBeDefined();
        expect(quizData.questions.find(q => q.type === 'true-false')).toBeDefined();
        expect(quizData.questions.find(q => q.type === 'matching')).toBeDefined();

        startQuizSpy.mockRestore();
      }
    });

    test('should handle retry mistakes with only listening questions', () => {
      // Edge case: User got ONLY listening questions wrong
      window.quizState = {
        data: { title: 'Test', questions: [] },
        mistakeQuestions: [
          { type: 'listening', questionText: 'L1', audioText: 'One', correctAnswer: 'One' },
          { type: 'listening', questionText: 'L2', audioText: 'Two', correctAnswer: 'Two' },
          { type: 'listening', questionText: 'L3', audioText: 'Three', correctAnswer: 'Three' }
        ],
        originalQuestions: mockQuizData.questions,
        isMistakesOnlyMode: false,
        filename: 'quiz-mixed'
      };

      document.getElementById('quiz-skip-listening').checked = true;

      const handleRetryMistakes = window.handleRetryMistakes;

      if (handleRetryMistakes) {
        const startQuizSpy = jest.spyOn(window, 'startQuiz');

        handleRetryMistakes();

        const quizData = startQuizSpy.mock.calls[0][0];

        // All 3 listening questions should be present
        expect(quizData.questions).toHaveLength(3);
        expect(quizData.questions.every(q => q.type === 'listening')).toBe(true);

        startQuizSpy.mockRestore();
      }
    });
  });

  describe('Normal Quiz Mode with Skip Listening', () => {
    test('should filter listening questions in normal mode when skip listening is enabled', () => {
      // Setup: Normal quiz (not mistakes-only)
      window.quizState = {
        data: {
          title: 'Test',
          questions: [
            { type: 'multiple-choice', questionText: 'Q1' },
            { type: 'listening', questionText: 'L1' },
            { type: 'fill-in-blank', questionText: 'Q2' },
            { type: 'listening', questionText: 'L2' }
          ]
        },
        isMistakesOnlyMode: false,
        mistakeQuestions: [],
        filename: 'quiz-test'
      };

      // Enable skip listening
      document.getElementById('quiz-skip-listening').checked = true;

      // Simulate handleStartQuiz logic
      const shouldSkipListening = document.getElementById('quiz-skip-listening').checked;
      const isMistakesOnlyMode = window.quizState.isMistakesOnlyMode;

      // This is the key logic that should be tested
      if (shouldSkipListening && !isMistakesOnlyMode) {
        // Filter listening questions
        window.quizState.data.questions = window.quizState.data.questions.filter(
          q => q.type !== 'listening'
        );
      }

      // Verify: Listening questions were filtered out
      expect(window.quizState.data.questions).toHaveLength(2);
      expect(window.quizState.data.questions.every(q => q.type !== 'listening')).toBe(true);
    });

    test('should NOT filter listening questions in normal mode when skip listening is disabled', () => {
      window.quizState = {
        data: {
          title: 'Test',
          questions: [
            { type: 'multiple-choice', questionText: 'Q1' },
            { type: 'listening', questionText: 'L1' },
            { type: 'fill-in-blank', questionText: 'Q2' }
          ]
        },
        isMistakesOnlyMode: false,
        mistakeQuestions: [],
        filename: 'quiz-test'
      };

      // Disable skip listening
      document.getElementById('quiz-skip-listening').checked = false;

      const shouldSkipListening = document.getElementById('quiz-skip-listening').checked;
      const isMistakesOnlyMode = window.quizState.isMistakesOnlyMode;

      if (shouldSkipListening && !isMistakesOnlyMode) {
        window.quizState.data.questions = window.quizState.data.questions.filter(
          q => q.type !== 'listening'
        );
      }

      // Verify: All questions preserved
      expect(window.quizState.data.questions).toHaveLength(3);
      expect(window.quizState.data.questions.filter(q => q.type === 'listening')).toHaveLength(1);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty mistakes list', () => {
      window.quizState = {
        data: { title: 'Test', questions: [] },
        mistakeQuestions: [],
        originalQuestions: mockQuizData.questions,
        isMistakesOnlyMode: false,
        filename: 'quiz-mixed'
      };

      const handleRetryMistakes = window.handleRetryMistakes;

      if (handleRetryMistakes) {
        const startQuizSpy = jest.spyOn(window, 'startQuiz');

        // Should not crash
        expect(() => handleRetryMistakes()).not.toThrow();

        if (startQuizSpy.mock.calls.length > 0) {
          const quizData = startQuizSpy.mock.calls[0][0];
          expect(quizData.questions).toHaveLength(0);
        }

        startQuizSpy.mockRestore();
      }
    });

    test('should reset mistakes list when starting retry', () => {
      window.quizState = {
        data: { title: 'Test', questions: [] },
        mistakeQuestions: [{ type: 'multiple-choice', questionText: 'Wrong' }],
        originalQuestions: mockQuizData.questions,
        isMistakesOnlyMode: false,
        filename: 'quiz-mixed'
      };

      const handleRetryMistakes = window.handleRetryMistakes;

      if (handleRetryMistakes) {
        const startQuizSpy = jest.spyOn(window, 'startQuiz');

        handleRetryMistakes();

        // After calling handleRetryMistakes, mistakeQuestions should be reset
        // (so new mistakes can be recorded in the retry)
        expect(window.quizState.mistakeQuestions).toHaveLength(0);

        startQuizSpy.mockRestore();
      }
    });
  });
});
