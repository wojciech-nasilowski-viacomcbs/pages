/**
 * @fileoverview Testy dla import-service.js
 */

import { ImportService } from '../js/services/import-service.js';

// Mock data-service
jest.mock('../js/data-service.js', () => ({
  dataService: {
    saveQuiz: jest.fn(data => Promise.resolve({ id: 'quiz-123', ...data })),
    saveWorkout: jest.fn(data => Promise.resolve({ id: 'workout-123', ...data })),
    createListeningSet: jest.fn(() => Promise.resolve({ id: 'listening-123' }))
  }
}));

describe('ImportService', () => {
  let service;

  beforeEach(() => {
    service = new ImportService();
    jest.clearAllMocks();
  });

  describe('importFromJSON', () => {
    test('imports valid quiz JSON', async () => {
      const quizJSON = JSON.stringify({
        title: 'Test Quiz',
        description: 'Test description',
        questions: [
          {
            question: 'Q1?',
            type: 'multiple-choice',
            options: ['A', 'B'],
            correctAnswer: 0
          }
        ]
      });

      const result = await service.importFromJSON(quizJSON, 'quiz', false);
      expect(result.id).toBe('quiz-123');
      expect(result.title).toBe('Test Quiz');
    });

    test('throws error for invalid JSON', async () => {
      await expect(service.importFromJSON('invalid json', 'quiz')).rejects.toThrow(
        'Nieprawidłowy JSON'
      );
    });

    test('throws error for validation failures', async () => {
      const invalidQuiz = JSON.stringify({
        title: 'Test',
        description: 'Test',
        questions: [] // Empty questions - validation error
      });

      await expect(service.importFromJSON(invalidQuiz, 'quiz')).rejects.toThrow('Błędy walidacji');
    });
  });

  describe('convertLegacyFormat', () => {
    test('converts questionText to question', () => {
      const oldFormat = {
        title: 'Test',
        description: 'Test',
        questions: [
          {
            questionText: 'Old format question',
            type: 'multiple-choice',
            options: ['A', 'B'],
            correctAnswer: 0
          }
        ]
      };

      const converted = service.convertLegacyFormat(oldFormat, 'quiz');
      expect(converted.questions[0].question).toBe('Old format question');
      expect(converted.questions[0].questionText).toBeUndefined();
    });

    test('converts fill-in-the-blank to fill-in-blank', () => {
      const oldFormat = {
        title: 'Test',
        description: 'Test',
        questions: [
          {
            question: 'Q1',
            type: 'fill-in-the-blank',
            correctAnswer: 'answer'
          }
        ]
      };

      const converted = service.convertLegacyFormat(oldFormat, 'quiz');
      expect(converted.questions[0].type).toBe('fill-in-blank');
    });

    test('converts isCorrect to correctAnswer for true-false', () => {
      const oldFormat = {
        title: 'Test',
        description: 'Test',
        questions: [
          {
            question: 'Q1',
            type: 'true-false',
            isCorrect: true
          }
        ]
      };

      const converted = service.convertLegacyFormat(oldFormat, 'quiz');
      expect(converted.questions[0].correctAnswer).toBe(true);
      expect(converted.questions[0].isCorrect).toBeUndefined();
    });

    test('converts object options to string array', () => {
      const oldFormat = {
        title: 'Test',
        description: 'Test',
        questions: [
          {
            question: 'Q1',
            type: 'multiple-choice',
            options: [
              { text: 'Option A', isCorrect: false },
              { text: 'Option B', isCorrect: true }
            ]
          }
        ]
      };

      const converted = service.convertLegacyFormat(oldFormat, 'quiz');
      expect(converted.questions[0].options).toEqual(['Option A', 'Option B']);
      expect(converted.questions[0].correctAnswer).toBe(1);
    });

    test('preserves audioText and audioLang for listening questions', () => {
      const data = {
        title: 'Test',
        description: 'Test',
        questions: [
          {
            question: 'Q1',
            type: 'listening',
            audioText: 'Hello',
            audioLang: 'en-US',
            correctAnswer: 'Hello'
          }
        ]
      };

      const converted = service.convertLegacyFormat(data, 'quiz');
      expect(converted.questions[0].audioText).toBe('Hello');
      expect(converted.questions[0].audioLang).toBe('en-US');
    });

    test('removes audioText and audioLang for non-listening questions', () => {
      const data = {
        title: 'Test',
        description: 'Test',
        questions: [
          {
            question: 'Q1',
            type: 'multiple-choice',
            options: ['A', 'B'],
            correctAnswer: 0,
            audioText: 'Should be removed',
            audioLang: 'en-US'
          }
        ]
      };

      const converted = service.convertLegacyFormat(data, 'quiz');
      expect(converted.questions[0].audioText).toBeUndefined();
      expect(converted.questions[0].audioLang).toBeUndefined();
    });
  });

  describe('import', () => {
    test('imports quiz with public flag', async () => {
      const { dataService } = require('../js/data-service.js');

      const quiz = {
        title: 'Public Quiz',
        description: 'Test',
        questions: [
          {
            question: 'Q1',
            type: 'multiple-choice',
            options: ['A', 'B'],
            correctAnswer: 0
          }
        ]
      };

      await service.import(quiz, 'quiz', true);
      expect(dataService.saveQuiz).toHaveBeenCalledWith(quiz, true);
    });

    test('imports workout', async () => {
      const { dataService } = require('../js/data-service.js');

      const workout = {
        title: 'Test Workout',
        description: 'Test',
        emoji: '💪',
        phases: [
          {
            name: 'Phase 1',
            exercises: [{ name: 'Push-ups', type: 'reps', reps: 10 }]
          }
        ]
      };

      await service.import(workout, 'workout', false);
      expect(dataService.saveWorkout).toHaveBeenCalledWith(workout, false);
    });

    test('imports listening set', async () => {
      const { dataService } = require('../js/data-service.js');

      const listening = {
        title: 'Test Listening',
        description: 'Test',
        lang1_code: 'pl-PL',
        lang2_code: 'en-US',
        content: [{ pl: 'Cześć', en: 'Hello' }]
      };

      await service.import(listening, 'listening', false);
      expect(dataService.createListeningSet).toHaveBeenCalledWith(
        'Test Listening',
        'Test',
        'pl-PL',
        'en-US',
        [{ pl: 'Cześć', en: 'Hello' }],
        false
      );
    });

    test('throws error for unknown type', async () => {
      await expect(service.import({}, 'unknown')).rejects.toThrow('Unknown content type');
    });
  });
});
