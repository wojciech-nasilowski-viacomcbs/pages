/**
 * @jest-environment jsdom
 */

describe('Utility Functions', () => {
  describe('Array Shuffling', () => {
    const shuffleArray = array => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    it('should return array of same length', () => {
      const original = [1, 2, 3, 4, 5];
      const shuffled = shuffleArray(original);

      expect(shuffled.length).toBe(original.length);
    });

    it('should contain all original elements', () => {
      const original = [1, 2, 3, 4, 5];
      const shuffled = shuffleArray(original);

      original.forEach(item => {
        expect(shuffled).toContain(item);
      });
    });

    it('should not modify original array', () => {
      const original = [1, 2, 3, 4, 5];
      const originalCopy = [...original];
      shuffleArray(original);

      expect(original).toEqual(originalCopy);
    });

    it('should handle empty array', () => {
      const empty = [];
      const shuffled = shuffleArray(empty);

      expect(shuffled).toEqual([]);
    });

    it('should handle single element array', () => {
      const single = [42];
      const shuffled = shuffleArray(single);

      expect(shuffled).toEqual([42]);
    });
  });

  describe('Time Formatting', () => {
    const formatTime = seconds => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    it('should format seconds correctly', () => {
      expect(formatTime(30)).toBe('0:30');
      expect(formatTime(5)).toBe('0:05');
      expect(formatTime(0)).toBe('0:00');
    });

    it('should format minutes and seconds correctly', () => {
      expect(formatTime(60)).toBe('1:00');
      expect(formatTime(90)).toBe('1:30');
      expect(formatTime(125)).toBe('2:05');
    });

    it('should handle large values', () => {
      expect(formatTime(3600)).toBe('60:00');
      expect(formatTime(3661)).toBe('61:01');
    });
  });

  describe('Score Calculation', () => {
    const calculatePercentage = (correct, total) => {
      if (total === 0) return 0;
      return Math.round((correct / total) * 100);
    };

    it('should calculate percentage correctly', () => {
      expect(calculatePercentage(5, 10)).toBe(50);
      expect(calculatePercentage(7, 10)).toBe(70);
      expect(calculatePercentage(10, 10)).toBe(100);
    });

    it('should round to nearest integer', () => {
      expect(calculatePercentage(1, 3)).toBe(33);
      expect(calculatePercentage(2, 3)).toBe(67);
    });

    it('should handle zero total', () => {
      expect(calculatePercentage(0, 0)).toBe(0);
      expect(calculatePercentage(5, 0)).toBe(0);
    });

    it('should handle zero correct', () => {
      expect(calculatePercentage(0, 10)).toBe(0);
    });
  });

  describe('Emoji Message Selection', () => {
    const getEmojiMessage = percentage => {
      if (percentage === 100) return '🎉 Doskonale!';
      if (percentage >= 90) return '🌟 Świetnie!';
      if (percentage >= 70) return '👍 Dobrze!';
      if (percentage >= 50) return '💪 Nieźle!';
      return '📚 Jeszcze trochę praktyki!';
    };

    it('should return perfect message for 100%', () => {
      expect(getEmojiMessage(100)).toBe('🎉 Doskonale!');
    });

    it('should return excellent message for 90-99%', () => {
      expect(getEmojiMessage(90)).toBe('🌟 Świetnie!');
      expect(getEmojiMessage(95)).toBe('🌟 Świetnie!');
      expect(getEmojiMessage(99)).toBe('🌟 Świetnie!');
    });

    it('should return good message for 70-89%', () => {
      expect(getEmojiMessage(70)).toBe('👍 Dobrze!');
      expect(getEmojiMessage(80)).toBe('👍 Dobrze!');
      expect(getEmojiMessage(89)).toBe('👍 Dobrze!');
    });

    it('should return decent message for 50-69%', () => {
      expect(getEmojiMessage(50)).toBe('💪 Nieźle!');
      expect(getEmojiMessage(60)).toBe('💪 Nieźle!');
      expect(getEmojiMessage(69)).toBe('💪 Nieźle!');
    });

    it('should return practice message for below 50%', () => {
      expect(getEmojiMessage(0)).toBe('📚 Jeszcze trochę praktyki!');
      expect(getEmojiMessage(25)).toBe('📚 Jeszcze trochę praktyki!');
      expect(getEmojiMessage(49)).toBe('📚 Jeszcze trochę praktyki!');
    });
  });

  describe('Answer Comparison', () => {
    const normalizeAnswer = text => {
      return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s]/g, '')
        .trim();
    };

    const compareAnswers = (userAnswer, correctAnswer) => {
      return normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswer);
    };

    it('should match identical answers', () => {
      expect(compareAnswers('Paris', 'Paris')).toBe(true);
      expect(compareAnswers('hello', 'hello')).toBe(true);
    });

    it('should ignore case differences', () => {
      expect(compareAnswers('Paris', 'paris')).toBe(true);
      expect(compareAnswers('HELLO', 'hello')).toBe(true);
    });

    it('should ignore diacritics', () => {
      expect(compareAnswers('café', 'cafe')).toBe(true);
      expect(compareAnswers('Kraków', 'Krakow')).toBe(true);
    });

    it('should ignore punctuation', () => {
      expect(compareAnswers('Hello!', 'Hello')).toBe(true);
      expect(compareAnswers('¿Cómo estás?', 'Como estas')).toBe(true);
    });

    it('should ignore extra whitespace', () => {
      expect(compareAnswers('  hello  ', 'hello')).toBe(true);
      expect(compareAnswers('hello world', 'hello   world')).toBe(false); // internal spaces preserved
    });

    it('should reject different answers', () => {
      expect(compareAnswers('Paris', 'London')).toBe(false);
      expect(compareAnswers('hello', 'goodbye')).toBe(false);
    });
  });

  describe('Local Storage Helpers', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('should save and retrieve data', () => {
      const key = 'testKey';
      const value = { name: 'Test', score: 100 };

      localStorage.setItem(key, JSON.stringify(value));
      const retrieved = JSON.parse(localStorage.getItem(key));

      expect(retrieved).toEqual(value);
    });

    it('should return null for non-existent keys', () => {
      const result = localStorage.getItem('nonExistentKey');
      expect(result).toBeNull();
    });

    it('should remove items', () => {
      localStorage.setItem('testKey', 'testValue');
      localStorage.removeItem('testKey');

      expect(localStorage.getItem('testKey')).toBeNull();
    });

    it('should clear all items', () => {
      localStorage.setItem('key1', 'value1');
      localStorage.setItem('key2', 'value2');
      localStorage.clear();

      expect(localStorage.getItem('key1')).toBeNull();
      expect(localStorage.getItem('key2')).toBeNull();
    });
  });

  describe('URL Validation', () => {
    const isValidUrl = string => {
      try {
        new URL(string);
        return true;
      } catch (_) {
        return false;
      }
    };

    it('should validate correct URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
      expect(isValidUrl('https://example.com/path/to/resource')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('not a url')).toBe(false);
      expect(isValidUrl('example.com')).toBe(false);
      expect(isValidUrl('')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(isValidUrl('ftp://files.example.com')).toBe(true);
      expect(isValidUrl('https://example.com:8080')).toBe(true);
      expect(isValidUrl('https://example.com?query=value')).toBe(true);
    });
  });

  describe('Deep Clone', () => {
    const deepClone = obj => {
      return JSON.parse(JSON.stringify(obj));
    };

    it('should clone simple objects', () => {
      const original = { name: 'Test', value: 42 };
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
    });

    it('should clone nested objects', () => {
      const original = {
        user: { name: 'John', age: 30 },
        scores: [10, 20, 30]
      };
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned.user).not.toBe(original.user);
      expect(cloned.scores).not.toBe(original.scores);
    });

    it('should handle arrays', () => {
      const original = [1, 2, { value: 3 }];
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned[2]).not.toBe(original[2]);
    });

    it('should handle null and primitives', () => {
      expect(deepClone(null)).toBeNull();
      expect(deepClone(42)).toBe(42);
      expect(deepClone('text')).toBe('text');
      expect(deepClone(true)).toBe(true);
    });
  });
});
