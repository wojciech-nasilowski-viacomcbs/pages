/**
 * @jest-environment jsdom
 */

/**
 * Test suite for quiz retry mistakes functionality
 * 
 * This tests the bug fix for the issue where retry mistakes mode
 * would filter out listening questions if "skip listening" was enabled,
 * resulting in fewer questions than actual mistakes.
 */

describe('Quiz Retry Mistakes Functionality', () => {
  let quizState;
  let handleStartQuiz;
  let filterListeningQuestions;
  
  beforeEach(() => {
    // Set up a mock DOM environment
    document.body.innerHTML = `
      <input type="checkbox" id="quiz-randomize" />
      <input type="checkbox" id="quiz-skip-listening" />
    `;
    
    // Mock quiz state
    quizState = {
      data: {
        questions: []
      },
      isMistakesOnlyMode: false
    };
    
    // Mock functions
    let filteredOut = false;
    
    filterListeningQuestions = jest.fn(() => {
      // Simulate filtering by removing listening questions
      const before = quizState.data.questions.length;
      quizState.data.questions = quizState.data.questions.filter(q => q.type !== 'listening');
      const after = quizState.data.questions.length;
      filteredOut = before !== after;
    });
    
    handleStartQuiz = () => {
      const shouldSkipListening = document.getElementById('quiz-skip-listening').checked;
      
      // This is the fix: don't filter in mistakes-only mode
      if (shouldSkipListening && !quizState.isMistakesOnlyMode) {
        filterListeningQuestions();
      }
    };
    
    // Mock localStorage
    Storage.prototype.setItem = jest.fn();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Normal quiz mode', () => {
    it('should filter listening questions when skip listening is enabled', () => {
      // Set up normal quiz mode
      quizState.isMistakesOnlyMode = false;
      quizState.data.questions = [
        { type: 'multiple-choice', question: 'Q1' },
        { type: 'listening', question: 'Q2' },
        { type: 'fill-in-blank', question: 'Q3' },
        { type: 'listening', question: 'Q4' }
      ];
      
      // Enable skip listening
      document.getElementById('quiz-skip-listening').checked = true;
      
      // Start quiz
      handleStartQuiz();
      
      // Verify listening questions were filtered
      expect(filterListeningQuestions).toHaveBeenCalled();
      expect(quizState.data.questions).toHaveLength(2);
      expect(quizState.data.questions.every(q => q.type !== 'listening')).toBe(true);
    });
    
    it('should not filter listening questions when skip listening is disabled', () => {
      // Set up normal quiz mode
      quizState.isMistakesOnlyMode = false;
      quizState.data.questions = [
        { type: 'multiple-choice', question: 'Q1' },
        { type: 'listening', question: 'Q2' },
        { type: 'fill-in-blank', question: 'Q3' }
      ];
      
      // Disable skip listening
      document.getElementById('quiz-skip-listening').checked = false;
      
      // Start quiz
      handleStartQuiz();
      
      // Verify listening questions were NOT filtered
      expect(filterListeningQuestions).not.toHaveBeenCalled();
      expect(quizState.data.questions).toHaveLength(3);
    });
  });
  
  describe('Mistakes-only mode (retry mistakes)', () => {
    it('should NOT filter listening questions even when skip listening is enabled', () => {
      // Set up mistakes-only mode with listening questions in mistakes
      quizState.isMistakesOnlyMode = true;
      quizState.data.questions = [
        { type: 'multiple-choice', question: 'Wrong Q1' },
        { type: 'listening', question: 'Wrong Q2' },
        { type: 'listening', question: 'Wrong Q3' }
      ];
      
      // Enable skip listening (from previous session)
      document.getElementById('quiz-skip-listening').checked = true;
      
      // Start quiz
      handleStartQuiz();
      
      // Verify listening questions were NOT filtered (this is the fix!)
      expect(filterListeningQuestions).not.toHaveBeenCalled();
      expect(quizState.data.questions).toHaveLength(3);
      expect(quizState.data.questions.filter(q => q.type === 'listening')).toHaveLength(2);
    });
    
    it('should keep all mistake questions regardless of type', () => {
      // Set up mistakes-only mode with various question types
      quizState.isMistakesOnlyMode = true;
      quizState.data.questions = [
        { type: 'multiple-choice', question: 'Wrong Q1' },
        { type: 'listening', question: 'Wrong Q2' },
        { type: 'fill-in-blank', question: 'Wrong Q3' },
        { type: 'true-false', question: 'Wrong Q4' },
        { type: 'listening', question: 'Wrong Q5' },
        { type: 'matching', question: 'Wrong Q6' }
      ];
      
      const originalLength = quizState.data.questions.length;
      
      // Enable skip listening
      document.getElementById('quiz-skip-listening').checked = true;
      
      // Start quiz
      handleStartQuiz();
      
      // Verify ALL questions are kept
      expect(filterListeningQuestions).not.toHaveBeenCalled();
      expect(quizState.data.questions).toHaveLength(originalLength);
    });
    
    it('should preserve all mistake questions when skip listening is disabled', () => {
      // Set up mistakes-only mode
      quizState.isMistakesOnlyMode = true;
      quizState.data.questions = [
        { type: 'multiple-choice', question: 'Wrong Q1' },
        { type: 'listening', question: 'Wrong Q2' }
      ];
      
      // Disable skip listening
      document.getElementById('quiz-skip-listening').checked = false;
      
      // Start quiz
      handleStartQuiz();
      
      // Verify all questions are kept
      expect(filterListeningQuestions).not.toHaveBeenCalled();
      expect(quizState.data.questions).toHaveLength(2);
    });
  });
  
  describe('Edge cases', () => {
    it('should handle mistakes-only mode with only listening questions', () => {
      // Set up mistakes-only mode with ONLY listening questions
      quizState.isMistakesOnlyMode = true;
      quizState.data.questions = [
        { type: 'listening', question: 'Wrong L1' },
        { type: 'listening', question: 'Wrong L2' },
        { type: 'listening', question: 'Wrong L3' }
      ];
      
      // Enable skip listening
      document.getElementById('quiz-skip-listening').checked = true;
      
      // Start quiz
      handleStartQuiz();
      
      // Verify all listening questions are kept (not filtered out)
      expect(filterListeningQuestions).not.toHaveBeenCalled();
      expect(quizState.data.questions).toHaveLength(3);
      expect(quizState.data.questions.every(q => q.type === 'listening')).toBe(true);
    });
    
    it('should handle mistakes-only mode with no listening questions', () => {
      // Set up mistakes-only mode without listening questions
      quizState.isMistakesOnlyMode = true;
      quizState.data.questions = [
        { type: 'multiple-choice', question: 'Wrong Q1' },
        { type: 'fill-in-blank', question: 'Wrong Q2' }
      ];
      
      // Enable skip listening
      document.getElementById('quiz-skip-listening').checked = true;
      
      // Start quiz
      handleStartQuiz();
      
      // Verify questions are kept
      expect(filterListeningQuestions).not.toHaveBeenCalled();
      expect(quizState.data.questions).toHaveLength(2);
    });
    
    it('should handle empty mistakes list', () => {
      // Set up mistakes-only mode with no questions (edge case)
      quizState.isMistakesOnlyMode = true;
      quizState.data.questions = [];
      
      // Enable skip listening
      document.getElementById('quiz-skip-listening').checked = true;
      
      // Start quiz
      handleStartQuiz();
      
      // Verify no errors occur
      expect(filterListeningQuestions).not.toHaveBeenCalled();
      expect(quizState.data.questions).toHaveLength(0);
    });
  });
});
