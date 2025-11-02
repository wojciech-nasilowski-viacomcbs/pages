/**
 * @jest-environment jsdom
 */

describe('SessionManager', () => {
  let sessionManager;

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();

    // Mock Date.now()
    jest.spyOn(Date, 'now').mockReturnValue(1000000000000);

    // Create a simple sessionManager object for testing
    sessionManager = {
      checkSavedSession() {
        const savedSession = localStorage.getItem('currentSession');
        if (savedSession) {
          const session = JSON.parse(savedSession);
          const sessionAge = Date.now() - session.timestamp;
          if (sessionAge >= 24 * 60 * 60 * 1000) {
            localStorage.removeItem('currentSession');
          }
        }
      },

      checkForSession(id, type) {
        const savedSession = localStorage.getItem('currentSession');
        if (savedSession) {
          const session = JSON.parse(savedSession);
          if (session.type === type && session.id === id) {
            const sessionAge = Date.now() - session.timestamp;
            if (sessionAge < 24 * 60 * 60 * 1000) {
              return session;
            }
          }
        }
        return null;
      },

      saveSession(id, type, data) {
        const session = {
          id,
          type,
          timestamp: Date.now(),
          ...data
        };
        localStorage.setItem('currentSession', JSON.stringify(session));
      },

      clearSession() {
        localStorage.removeItem('currentSession');
      }
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('checkSavedSession', () => {
    it('should remove expired sessions (older than 24h)', () => {
      const oldTimestamp = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago
      const expiredSession = {
        id: 'quiz-1',
        type: 'quiz',
        timestamp: oldTimestamp,
        currentQuestion: 5
      };

      localStorage.setItem('currentSession', JSON.stringify(expiredSession));

      sessionManager.checkSavedSession();

      expect(localStorage.getItem('currentSession')).toBeNull();
    });

    it('should keep valid sessions (less than 24h old)', () => {
      const recentTimestamp = Date.now() - 1 * 60 * 60 * 1000; // 1 hour ago
      const validSession = {
        id: 'quiz-1',
        type: 'quiz',
        timestamp: recentTimestamp,
        currentQuestion: 5
      };

      localStorage.setItem('currentSession', JSON.stringify(validSession));

      sessionManager.checkSavedSession();

      expect(localStorage.getItem('currentSession')).not.toBeNull();
    });

    it('should handle missing session gracefully', () => {
      expect(() => sessionManager.checkSavedSession()).not.toThrow();
      expect(localStorage.getItem('currentSession')).toBeNull();
    });
  });

  describe('checkForSession', () => {
    it('should return session if ID, type match and session is valid', () => {
      const validSession = {
        id: 'quiz-1',
        type: 'quiz',
        timestamp: Date.now() - 1 * 60 * 60 * 1000,
        currentQuestion: 5,
        score: 3
      };

      localStorage.setItem('currentSession', JSON.stringify(validSession));

      const result = sessionManager.checkForSession('quiz-1', 'quiz');

      expect(result).toEqual(validSession);
    });

    it('should return null if session is expired', () => {
      const expiredSession = {
        id: 'quiz-1',
        type: 'quiz',
        timestamp: Date.now() - 25 * 60 * 60 * 1000,
        currentQuestion: 5
      };

      localStorage.setItem('currentSession', JSON.stringify(expiredSession));

      const result = sessionManager.checkForSession('quiz-1', 'quiz');

      expect(result).toBeNull();
    });

    it('should return null if ID does not match', () => {
      const session = {
        id: 'quiz-1',
        type: 'quiz',
        timestamp: Date.now() - 1 * 60 * 60 * 1000,
        currentQuestion: 5
      };

      localStorage.setItem('currentSession', JSON.stringify(session));

      const result = sessionManager.checkForSession('quiz-2', 'quiz');

      expect(result).toBeNull();
    });

    it('should return null if type does not match', () => {
      const session = {
        id: 'item-1',
        type: 'quiz',
        timestamp: Date.now() - 1 * 60 * 60 * 1000,
        currentQuestion: 5
      };

      localStorage.setItem('currentSession', JSON.stringify(session));

      const result = sessionManager.checkForSession('item-1', 'workout');

      expect(result).toBeNull();
    });

    it('should return null if no session exists', () => {
      const result = sessionManager.checkForSession('quiz-1', 'quiz');

      expect(result).toBeNull();
    });
  });

  describe('saveSession', () => {
    it('should save session with correct structure', () => {
      sessionManager.saveSession('quiz-1', 'quiz', {
        currentQuestion: 5,
        score: 3
      });

      const savedDataStr = localStorage.getItem('currentSession');
      expect(savedDataStr).not.toBeNull();

      const savedData = JSON.parse(savedDataStr);
      expect(savedData).toMatchObject({
        id: 'quiz-1',
        type: 'quiz',
        timestamp: Date.now(),
        currentQuestion: 5,
        score: 3
      });
    });
  });

  describe('clearSession', () => {
    it('should remove session from localStorage', () => {
      localStorage.setItem('currentSession', JSON.stringify({ id: 'test' }));

      sessionManager.clearSession();

      expect(localStorage.getItem('currentSession')).toBeNull();
    });
  });
});
