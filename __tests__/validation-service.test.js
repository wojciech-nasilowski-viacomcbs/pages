/**
 * @fileoverview Testy dla validation-service.js
 */

import { ValidationService } from '../js/services/validation-service.js';

describe('ValidationService', () => {
  let service;

  beforeEach(() => {
    service = new ValidationService();
  });

  describe('validateQuiz', () => {
    test('validates correct quiz', () => {
      const quiz = {
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
      };

      expect(service.validate(quiz, 'quiz')).toEqual([]);
    });

    test('detects missing title', () => {
      const quiz = {
        description: 'Test',
        questions: []
      };
      const errors = service.validate(quiz, 'quiz');
      expect(errors).toContain('Brak pola "title" lub nieprawidłowy typ');
    });

    test('detects missing description', () => {
      const quiz = {
        title: 'Test',
        questions: []
      };
      const errors = service.validate(quiz, 'quiz');
      expect(errors).toContain('Brak pola "description" lub nieprawidłowy typ');
    });

    test('detects empty questions array', () => {
      const quiz = {
        title: 'Test',
        description: 'Test',
        questions: []
      };
      const errors = service.validate(quiz, 'quiz');
      expect(errors).toContain('Brak pytań lub "questions" nie jest tablicą');
    });

    test('detects invalid question type', () => {
      const quiz = {
        title: 'Test',
        description: 'Test',
        questions: [
          {
            question: 'Q1?',
            type: 'invalid-type',
            options: ['A', 'B'],
            correctAnswer: 0
          }
        ]
      };
      const errors = service.validate(quiz, 'quiz');
      expect(errors.some(e => e.includes('nieprawidłowy typ'))).toBe(true);
    });

    test('converts string correctAnswer to number for multiple-choice', () => {
      const quiz = {
        title: 'Test',
        description: 'Test',
        questions: [
          {
            question: 'Q1?',
            type: 'multiple-choice',
            options: ['A', 'B'],
            correctAnswer: '1'
          }
        ]
      };
      service.validate(quiz, 'quiz');
      expect(quiz.questions[0].correctAnswer).toBe(1);
    });

    test('converts string correctAnswer to boolean for true-false', () => {
      const quiz = {
        title: 'Test',
        description: 'Test',
        questions: [
          {
            question: 'Q1?',
            type: 'true-false',
            correctAnswer: 'true'
          }
        ]
      };
      service.validate(quiz, 'quiz');
      expect(quiz.questions[0].correctAnswer).toBe(true);
    });
  });

  describe('validateWorkout', () => {
    test('validates correct workout', () => {
      const workout = {
        title: 'Test Workout',
        description: 'Test description',
        emoji: '💪',
        phases: [
          {
            name: 'Phase 1',
            exercises: [
              {
                name: 'Push-ups',
                type: 'reps',
                reps: 10
              }
            ]
          }
        ]
      };

      expect(service.validate(workout, 'workout')).toEqual([]);
    });

    test('adds default emoji if missing', () => {
      const workout = {
        title: 'Test',
        description: 'Test',
        phases: [
          {
            name: 'Phase 1',
            exercises: [{ name: 'Ex1', type: 'reps', reps: 10 }]
          }
        ]
      };
      service.validate(workout, 'workout');
      expect(workout.emoji).toBe('💪');
    });

    test('detects missing phases', () => {
      const workout = {
        title: 'Test',
        description: 'Test',
        phases: []
      };
      const errors = service.validate(workout, 'workout');
      expect(errors).toContain('Brak faz lub "phases" nie jest tablicą');
    });

    test('detects invalid exercise type', () => {
      const workout = {
        title: 'Test',
        description: 'Test',
        phases: [
          {
            name: 'Phase 1',
            exercises: [
              {
                name: 'Ex1',
                type: 'invalid'
              }
            ]
          }
        ]
      };
      const errors = service.validate(workout, 'workout');
      expect(errors.some(e => e.includes('nieprawidłowy typ'))).toBe(true);
    });
  });

  describe('validateListening', () => {
    test('validates correct listening set', () => {
      const listening = {
        title: 'Test Listening',
        description: 'Test description',
        lang1_code: 'pl-PL',
        lang2_code: 'en-US',
        content: [
          {
            pl: 'Cześć',
            en: 'Hello'
          }
        ]
      };

      expect(service.validate(listening, 'listening')).toEqual([]);
    });

    test('detects missing lang codes', () => {
      const listening = {
        title: 'Test',
        description: 'Test',
        content: []
      };
      const errors = service.validate(listening, 'listening');
      expect(errors).toContain('Brak pola "lang1_code" lub nieprawidłowy typ');
      expect(errors).toContain('Brak pola "lang2_code" lub nieprawidłowy typ');
    });

    test('detects empty content array', () => {
      const listening = {
        title: 'Test',
        description: 'Test',
        lang1_code: 'pl-PL',
        lang2_code: 'en-US',
        content: []
      };
      const errors = service.validate(listening, 'listening');
      expect(errors).toContain('Brak par lub "content" nie jest tablicą');
    });
  });

  describe('validate (generic)', () => {
    test('returns error for unknown type', () => {
      const errors = service.validate({}, 'unknown');
      expect(errors).toContain('Unknown content type: unknown');
    });
  });
});
