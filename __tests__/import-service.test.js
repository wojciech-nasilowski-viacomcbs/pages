/**
 * @fileoverview Testy dla import-service.js
 */

// Mock Supabase client PRZED jakimikolwiek importami
jest.mock('../js/data/supabase-client.js', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getSession: jest.fn(),
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn()
    }
  }
}));

import { ImportService } from '../js/services/import-service.js';
import { validationService } from '../js/services/validation-service.js';
import dataService from '../js/data/data-service.js';

// Mock dependencies
jest.mock('../js/services/validation-service.js');
// Ręczne mockowanie dataService, aby uniknąć problemów z default export
dataService.saveQuiz = jest.fn();
dataService.saveWorkout = jest.fn();
dataService.createListeningSet = jest.fn();

describe('ImportService', () => {
  let importService;

  beforeEach(() => {
    importService = new ImportService();
    jest.clearAllMocks();
    validationService.validate.mockReturnValue([]);
  });

  describe('importFromJSON', () => {
    test('imports valid quiz JSON', async () => {
      dataService.saveQuiz.mockResolvedValue({ id: 'quiz-123', title: 'Test Quiz' });
      const quizJSON = JSON.stringify({ title: 'Test Quiz', questions: [] });

      const result = await importService.importFromJSON(quizJSON, 'quiz', false);
      expect(result.id).toBe('quiz-123');
      expect(result.title).toBe('Test Quiz');
    });

    test('throws error for invalid JSON', async () => {
      await expect(importService.importFromJSON('invalid json', 'quiz')).rejects.toThrow(
        'Nieprawidłowy JSON'
      );
    });

    test('throws error for validation failures', async () => {
      const invalidQuiz = JSON.stringify({ title: 'Invalid' });
      validationService.validate.mockReturnValue(['Błąd 1', 'Błąd 2']);

      await expect(importService.importFromJSON(invalidQuiz, 'quiz')).rejects.toThrow(
        'Błędy walidacji'
      );
    });
  });

  describe('convertLegacyFormat', () => {
    test('converts questionText to question', () => {
      const oldFormat = {
        questions: [{ questionText: 'Old format question' }]
      };
      const converted = importService.convertLegacyFormat(oldFormat, 'quiz');
      expect(converted.questions[0].question).toBe('Old format question');
      expect(converted.questions[0].questionText).toBeUndefined();
    });

    test('converts fill-in-the-blank to fill-in-blank', () => {
      const oldFormat = {
        questions: [{ type: 'fill-in-the-blank' }]
      };
      const converted = importService.convertLegacyFormat(oldFormat, 'quiz');
      expect(converted.questions[0].type).toBe('fill-in-blank');
    });

    test('converts isCorrect to correctAnswer for true-false', () => {
      const oldFormat = {
        questions: [{ type: 'true-false', isCorrect: true }]
      };
      const converted = importService.convertLegacyFormat(oldFormat, 'quiz');
      expect(converted.questions[0].correctAnswer).toBe(true);
      expect(converted.questions[0].isCorrect).toBeUndefined();
    });

    test('converts object options to string array', () => {
      const oldFormat = {
        questions: [
          {
            type: 'multiple-choice',
            options: [
              { text: 'Option A', isCorrect: false },
              { text: 'Option B', isCorrect: true }
            ]
          }
        ]
      };
      const converted = importService.convertLegacyFormat(oldFormat, 'quiz');
      expect(converted.questions[0].options).toEqual(['Option A', 'Option B']);
      expect(converted.questions[0].correctAnswer).toBe(1);
    });

    test('preserves audioText and audioLang for listening questions', () => {
      const data = {
        questions: [
          {
            type: 'listening',
            audioText: 'Hello',
            audioLang: 'en-US'
          }
        ]
      };
      const converted = importService.convertLegacyFormat(data, 'quiz');
      expect(converted.questions[0].audioText).toBe('Hello');
      expect(converted.questions[0].audioLang).toBe('en-US');
    });

    test('removes audioText and audioLang for non-listening questions', () => {
      const data = {
        questions: [
          {
            type: 'multiple-choice',
            audioText: 'Hello',
            audioLang: 'en-US'
          }
        ]
      };
      const converted = importService.convertLegacyFormat(data, 'quiz');
      expect(converted.questions[0].audioText).toBeUndefined();
      expect(converted.questions[0].audioLang).toBeUndefined();
    });
  });

  describe('import', () => {
    test('imports quiz with public flag', async () => {
      const quiz = { title: 'Test Quiz' };
      dataService.saveQuiz.mockResolvedValue({ id: 'quiz-123', ...quiz });

      await importService.import(quiz, 'quiz', true);
      expect(dataService.saveQuiz).toHaveBeenCalledWith(quiz, true);
    });

    test('imports workout', async () => {
      const workout = { title: 'Test Workout' };
      dataService.saveWorkout.mockResolvedValue({ id: 'workout-456', ...workout });

      await importService.import(workout, 'workout', false);
      expect(dataService.saveWorkout).toHaveBeenCalledWith(workout, false);
    });

    test('imports listening set', async () => {
      const listening = {
        title: 'Test Listening',
        description: 'Test',
        lang1_code: 'pl-PL',
        lang2_code: 'en-US',
        content: []
      };
      dataService.createListeningSet.mockResolvedValue({ id: 'listening-789', ...listening });

      await importService.import(listening, 'listening', false);
      expect(dataService.createListeningSet).toHaveBeenCalledWith(
        'Test Listening',
        'Test',
        'pl-PL',
        'en-US',
        [],
        false
      );
    });

    test('throws error for unknown type', async () => {
      await expect(importService.import({}, 'unknown', false)).rejects.toThrow(
        'Unknown type: unknown'
      );
    });
  });
});
