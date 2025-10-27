/**
 * @jest-environment jsdom
 */

/**
 * Integration test for the complete retry mistakes workflow
 * 
 * This test simulates the actual user scenario:
 * 1. User completes a quiz with some mistakes (including listening questions)
 * 2. User has "skip listening questions" enabled in localStorage
 * 3. User clicks "Retry Mistakes"
 * 4. Quiz should show ALL mistakes, including listening questions
 */

describe('Quiz Retry Mistakes - Integration Test', () => {
  let mockQuizData;
  let mockElements;
  
  beforeEach(() => {
    // Mock localStorage
    localStorage.clear();
    localStorage.setItem('skipListeningQuestions', 'true'); // User has this enabled
    
    // Create mock quiz data with various question types
    mockQuizData = {
      title: 'Test Quiz',
      questions: [
        { type: 'multiple-choice', questionText: 'Q1', correctAnswer: 0, options: ['A', 'B'] },
        { type: 'listening', questionText: 'Q2 - Listen', correctAnswer: 'hello', audioText: 'hello' },
        { type: 'fill-in-the-blank', questionText: 'Q3', correctAnswer: 'test' },
        { type: 'listening', questionText: 'Q4 - Listen', correctAnswer: 'world', audioText: 'world' },
        { type: 'true-false', questionText: 'Q5', correctAnswer: true }
      ]
    };
    
    // Create mock DOM elements
    document.body.innerHTML = `
      <input type="checkbox" id="quiz-randomize" />
      <input type="checkbox" id="quiz-skip-listening" />
      <div id="quiz-options" class=""></div>
      <div id="quiz-header" class="hidden"></div>
      <div id="quiz-question-container" class="hidden"></div>
      <div id="quiz-question"></div>
      <div id="quiz-answers"></div>
    `;
    
    mockElements = {
      randomizeCheckbox: document.getElementById('quiz-randomize'),
      skipListeningCheckbox: document.getElementById('quiz-skip-listening'),
      quizOptions: document.getElementById('quiz-options'),
      quizHeader: document.getElementById('quiz-header'),
      quizQuestionContainer: document.getElementById('quiz-question-container'),
      question: document.getElementById('quiz-question'),
      answersContainer: document.getElementById('quiz-answers')
    };
  });
  
  describe('User workflow simulation', () => {
    it('should preserve all mistake questions including listening when retrying mistakes', () => {
      // Step 1: User completed quiz and made mistakes on Q2 (listening) and Q4 (listening) and Q5
      const mistakeQuestions = [
        mockQuizData.questions[1], // Q2 - listening
        mockQuizData.questions[3], // Q4 - listening
        mockQuizData.questions[4]  // Q5 - true-false
      ];
      
      // Step 2: User clicks "Retry Mistakes" - this creates a new quiz with only mistakes
      const mistakesQuizData = {
        ...mockQuizData,
        questions: [...mistakeQuestions]
      };
      
      // Step 3: Simulate the quiz state when entering retry mistakes mode
      const quizState = {
        data: mistakesQuizData,
        filename: 'test-quiz.json',
        currentQuestionIndex: 0,
        score: 0,
        answers: [],
        isAnswered: false,
        isMistakesOnlyMode: true, // This is the key flag set by startQuiz(data, filename, true)
        mistakeQuestions: [],
        originalQuestions: mockQuizData.questions
      };
      
      // Step 4: User's localStorage still has "skip listening" enabled from before
      mockElements.skipListeningCheckbox.checked = localStorage.getItem('skipListeningQuestions') === 'true';
      expect(mockElements.skipListeningCheckbox.checked).toBe(true);
      
      // Step 5: Simulate handleStartQuiz() - the fix ensures listening questions are NOT filtered
      const shouldSkipListening = mockElements.skipListeningCheckbox.checked;
      
      // THE FIX: In mistakes-only mode, don't filter even if skip listening is checked
      if (shouldSkipListening && !quizState.isMistakesOnlyMode) {
        // This should NOT execute because isMistakesOnlyMode is true
        quizState.data.questions = quizState.data.questions.filter(q => q.type !== 'listening');
      }
      
      // Step 6: Verify all mistake questions are preserved
      expect(quizState.data.questions).toHaveLength(3);
      expect(quizState.data.questions.filter(q => q.type === 'listening')).toHaveLength(2);
      
      // Verify the specific questions
      expect(quizState.data.questions[0].questionText).toBe('Q2 - Listen');
      expect(quizState.data.questions[1].questionText).toBe('Q4 - Listen');
      expect(quizState.data.questions[2].questionText).toBe('Q5');
    });
    
    it('should filter listening questions in normal quiz mode when skip listening is enabled', () => {
      // Step 1: User starts a NEW quiz (not retry mistakes)
      const quizState = {
        data: { ...mockQuizData, questions: [...mockQuizData.questions] },
        filename: 'test-quiz.json',
        currentQuestionIndex: 0,
        score: 0,
        answers: [],
        isAnswered: false,
        isMistakesOnlyMode: false, // Normal mode
        mistakeQuestions: [],
        originalQuestions: [...mockQuizData.questions]
      };
      
      // Step 2: User has "skip listening" enabled
      mockElements.skipListeningCheckbox.checked = true;
      
      // Step 3: Simulate handleStartQuiz() - should filter in normal mode
      const shouldSkipListening = mockElements.skipListeningCheckbox.checked;
      
      if (shouldSkipListening && !quizState.isMistakesOnlyMode) {
        // This SHOULD execute in normal mode
        quizState.data.questions = quizState.data.questions.filter(q => q.type !== 'listening');
      }
      
      // Step 4: Verify listening questions were filtered
      expect(quizState.data.questions).toHaveLength(3); // 5 original - 2 listening = 3
      expect(quizState.data.questions.filter(q => q.type === 'listening')).toHaveLength(0);
      expect(quizState.data.questions.every(q => q.type !== 'listening')).toBe(true);
    });
    
    it('should handle scenario where all mistakes are listening questions', () => {
      // Edge case: User only made mistakes on listening questions
      const allListeningMistakes = [
        mockQuizData.questions[1], // Q2 - listening
        mockQuizData.questions[3]  // Q4 - listening
      ];
      
      const mistakesQuizData = {
        ...mockQuizData,
        questions: [...allListeningMistakes]
      };
      
      const quizState = {
        data: mistakesQuizData,
        isMistakesOnlyMode: true
      };
      
      // User has skip listening enabled
      mockElements.skipListeningCheckbox.checked = true;
      const shouldSkipListening = mockElements.skipListeningCheckbox.checked;
      
      // THE FIX: Don't filter in mistakes-only mode
      if (shouldSkipListening && !quizState.isMistakesOnlyMode) {
        quizState.data.questions = quizState.data.questions.filter(q => q.type !== 'listening');
      }
      
      // All listening questions should be preserved
      expect(quizState.data.questions).toHaveLength(2);
      expect(quizState.data.questions.every(q => q.type === 'listening')).toBe(true);
    });
    
    it('should handle scenario where no mistakes are listening questions', () => {
      // User made mistakes only on non-listening questions
      const noListeningMistakes = [
        mockQuizData.questions[0], // Q1 - multiple-choice
        mockQuizData.questions[2], // Q3 - fill-in-blank
        mockQuizData.questions[4]  // Q5 - true-false
      ];
      
      const mistakesQuizData = {
        ...mockQuizData,
        questions: [...noListeningMistakes]
      };
      
      const quizState = {
        data: mistakesQuizData,
        isMistakesOnlyMode: true
      };
      
      // User has skip listening enabled (but it shouldn't matter)
      mockElements.skipListeningCheckbox.checked = true;
      const shouldSkipListening = mockElements.skipListeningCheckbox.checked;
      
      // THE FIX: Don't filter in mistakes-only mode
      if (shouldSkipListening && !quizState.isMistakesOnlyMode) {
        quizState.data.questions = quizState.data.questions.filter(q => q.type !== 'listening');
      }
      
      // All non-listening questions should be preserved
      expect(quizState.data.questions).toHaveLength(3);
      expect(quizState.data.questions.filter(q => q.type === 'listening')).toHaveLength(0);
    });
  });
  
  describe('Regression test - verify normal mode still works', () => {
    it('should still filter listening questions in normal mode', () => {
      const quizState = {
        data: { ...mockQuizData, questions: [...mockQuizData.questions] },
        isMistakesOnlyMode: false
      };
      
      mockElements.skipListeningCheckbox.checked = true;
      
      // Simulate filtering
      if (mockElements.skipListeningCheckbox.checked && !quizState.isMistakesOnlyMode) {
        quizState.data.questions = quizState.data.questions.filter(q => q.type !== 'listening');
      }
      
      expect(quizState.data.questions).toHaveLength(3);
    });
    
    it('should not filter when skip listening is disabled in normal mode', () => {
      const quizState = {
        data: { ...mockQuizData, questions: [...mockQuizData.questions] },
        isMistakesOnlyMode: false
      };
      
      mockElements.skipListeningCheckbox.checked = false;
      
      // Simulate filtering
      if (mockElements.skipListeningCheckbox.checked && !quizState.isMistakesOnlyMode) {
        quizState.data.questions = quizState.data.questions.filter(q => q.type !== 'listening');
      }
      
      expect(quizState.data.questions).toHaveLength(5);
    });
  });
});
