/**
 * @jest-environment jsdom
 */

describe('Data Validation', () => {
  describe('Quiz Data Structure', () => {
    it('should validate quiz has required fields', () => {
      const validQuiz = {
        title: 'Test Quiz',
        description: 'Test description',
        language: 'pl-PL',
        questions: []
      };

      expect(validQuiz).toHaveProperty('title');
      expect(validQuiz).toHaveProperty('description');
      expect(validQuiz).toHaveProperty('language');
      expect(validQuiz).toHaveProperty('questions');
      expect(Array.isArray(validQuiz.questions)).toBe(true);
    });

    it('should validate multiple-choice question structure', () => {
      const question = {
        type: 'multiple-choice',
        question: 'What is 2+2?',
        options: ['3', '4', '5', '6'],
        correctAnswer: 1,
        explanation: 'Basic math'
      };

      expect(question.type).toBe('multiple-choice');
      expect(Array.isArray(question.options)).toBe(true);
      expect(question.options.length).toBeGreaterThan(0);
      expect(typeof question.correctAnswer).toBe('number');
      expect(question.correctAnswer).toBeGreaterThanOrEqual(0);
      expect(question.correctAnswer).toBeLessThan(question.options.length);
    });

    it('should validate true-false question structure', () => {
      const question = {
        type: 'true-false',
        question: 'The sky is blue',
        isCorrect: true,
        explanation: 'The sky appears blue due to light scattering'
      };

      expect(question.type).toBe('true-false');
      expect(typeof question.isCorrect).toBe('boolean');
      expect(question).toHaveProperty('question');
      expect(question).toHaveProperty('explanation');
    });

    it('should validate fill-in-the-blank question structure', () => {
      const question = {
        type: 'fill-in-the-blank',
        question: 'The capital of France is ___',
        correctAnswer: 'Paris',
        explanation: 'Paris is the capital city of France'
      };

      expect(question.type).toBe('fill-in-the-blank');
      expect(typeof question.correctAnswer).toBe('string');
      expect(question.correctAnswer.length).toBeGreaterThan(0);
    });

    it('should validate matching question structure', () => {
      const question = {
        type: 'matching',
        question: 'Match the countries with their capitals',
        pairs: [
          { item: 'France', match: 'Paris' },
          { item: 'Spain', match: 'Madrid' }
        ]
      };

      expect(question.type).toBe('matching');
      expect(Array.isArray(question.pairs)).toBe(true);
      expect(question.pairs.length).toBeGreaterThan(0);
      question.pairs.forEach(pair => {
        expect(pair).toHaveProperty('item');
        expect(pair).toHaveProperty('match');
        expect(typeof pair.item).toBe('string');
        expect(typeof pair.match).toBe('string');
      });
    });

    it('should validate listening question structure', () => {
      const question = {
        type: 'listening',
        text: 'Hello world',
        language: 'en-US',
        correctAnswer: 'Hello world',
        acceptableAnswers: ['hello world', 'helloworld']
      };

      expect(question.type).toBe('listening');
      expect(typeof question.text).toBe('string');
      expect(typeof question.language).toBe('string');
      expect(typeof question.correctAnswer).toBe('string');
      if (question.acceptableAnswers) {
        expect(Array.isArray(question.acceptableAnswers)).toBe(true);
      }
    });
  });

  describe('Workout Data Structure', () => {
    it('should validate workout has required fields', () => {
      const validWorkout = {
        title: 'Test Workout',
        description: 'Test description',
        phases: []
      };

      expect(validWorkout).toHaveProperty('title');
      expect(validWorkout).toHaveProperty('description');
      expect(validWorkout).toHaveProperty('phases');
      expect(Array.isArray(validWorkout.phases)).toBe(true);
    });

    it('should validate phase structure', () => {
      const phase = {
        name: 'Warm-up',
        exercises: []
      };

      expect(phase).toHaveProperty('name');
      expect(phase).toHaveProperty('exercises');
      expect(Array.isArray(phase.exercises)).toBe(true);
    });

    it('should validate time-based exercise structure', () => {
      const exercise = {
        name: 'Push-ups',
        description: 'Standard push-ups',
        type: 'time',
        duration: 30
      };

      expect(exercise.type).toBe('time');
      expect(typeof exercise.duration).toBe('number');
      expect(exercise.duration).toBeGreaterThan(0);
      expect(exercise).toHaveProperty('name');
      expect(exercise).toHaveProperty('description');
    });

    it('should validate reps-based exercise structure', () => {
      const exercise = {
        name: 'Squats',
        description: 'Deep squats',
        type: 'reps',
        reps: 20
      };

      expect(exercise.type).toBe('reps');
      expect(typeof exercise.reps).toBe('number');
      expect(exercise.reps).toBeGreaterThan(0);
    });
  });

  describe('Text Normalization', () => {
    const normalize = text => {
      return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
    };

    it('should normalize text to lowercase', () => {
      expect(normalize('HELLO')).toBe('hello');
      expect(normalize('Hello World')).toBe('hello world');
    });

    it('should remove diacritics', () => {
      expect(normalize('café')).toBe('cafe');
      expect(normalize('naïve')).toBe('naive');
      expect(normalize('Kraków')).toBe('krakow');
    });

    it('should remove leading/trailing whitespace', () => {
      expect(normalize('  hello  ')).toBe('hello');
      expect(normalize('\thello\n')).toBe('hello');
    });

    it('should handle Polish characters', () => {
      // Note: 'ł' doesn't normalize with NFD, needs special handling
      const normalizePolish = text => {
        return text
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/ł/g, 'l')
          .trim();
      };

      expect(normalizePolish('ąćęłńóśźż')).toBe('acelnoszz');
      expect(normalizePolish('ĄĆĘŁŃÓŚŹŻ')).toBe('acelnoszz');
    });

    it('should handle Spanish characters', () => {
      expect(normalize('¿Cómo estás?')).toBe('¿como estas?');
      expect(normalize('Niño')).toBe('nino');
    });
  });

  describe('JSON Validation', () => {
    it('should parse valid JSON', () => {
      const validJson = '{"title": "Test", "description": "Description"}';

      expect(() => JSON.parse(validJson)).not.toThrow();
      const parsed = JSON.parse(validJson);
      expect(parsed).toHaveProperty('title');
      expect(parsed).toHaveProperty('description');
    });

    it('should reject invalid JSON', () => {
      const invalidJson = '{title: "Test", description: "Description"}'; // Missing quotes

      expect(() => JSON.parse(invalidJson)).toThrow();
    });

    it('should handle empty objects', () => {
      const emptyJson = '{}';

      expect(() => JSON.parse(emptyJson)).not.toThrow();
      const parsed = JSON.parse(emptyJson);
      expect(Object.keys(parsed).length).toBe(0);
    });

    it('should handle arrays', () => {
      const arrayJson = '[1, 2, 3]';

      expect(() => JSON.parse(arrayJson)).not.toThrow();
      const parsed = JSON.parse(arrayJson);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(3);
    });
  });

  describe('Language Code Validation', () => {
    const validLanguageCodes = [
      'pl-PL',
      'en-US',
      'en-GB',
      'es-ES',
      'es-MX',
      'de-DE',
      'fr-FR',
      'it-IT',
      'pt-PT',
      'pt-BR'
    ];

    it('should validate language code format', () => {
      const languageCodePattern = /^[a-z]{2}-[A-Z]{2}$/;

      validLanguageCodes.forEach(code => {
        expect(code).toMatch(languageCodePattern);
      });
    });

    it('should reject invalid language codes', () => {
      const invalidCodes = ['pl', 'en', 'PL-pl', 'en-us', 'english'];
      const languageCodePattern = /^[a-z]{2}-[A-Z]{2}$/;

      invalidCodes.forEach(code => {
        expect(code).not.toMatch(languageCodePattern);
      });
    });
  });
});
