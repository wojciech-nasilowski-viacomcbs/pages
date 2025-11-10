/**
 * @fileoverview Serwis walidacji danych (quiz, workout, listening)
 * Wyekstraktowany z content-manager.js w ramach refaktoringu architektury
 * @module validation-service
 */

/**
 * Serwis walidacji treści
 */
export class ValidationService {
  /**
   * Waliduje dane według typu
   * @param {Object} data - Dane do walidacji
   * @param {'quiz'|'workout'|'listening'} type - Typ treści
   * @returns {string[]} - Tablica błędów (pusta = OK)
   */
  validate(data, type) {
    switch (type) {
      case 'quiz':
        return this.validateQuiz(data);
      case 'workout':
        return this.validateWorkout(data);
      case 'listening':
        return this.validateListening(data);
      default:
        return [`Unknown content type: ${type}`];
    }
  }

  /**
   * Walidacja JSON quizu
   * @param {Object} data - Dane quizu
   * @returns {string[]} - Tablica błędów
   */
  validateQuiz(data) {
    const errors = [];

    if (!data.title || typeof data.title !== 'string') {
      errors.push('Brak pola "title" lub nieprawidłowy typ');
    }

    if (!data.description || typeof data.description !== 'string') {
      errors.push('Brak pola "description" lub nieprawidłowy typ');
    }

    if (!Array.isArray(data.questions) || data.questions.length === 0) {
      errors.push('Brak pytań lub "questions" nie jest tablicą');
    }

    if (Array.isArray(data.questions)) {
      data.questions.forEach((q, idx) => {
        if (!q.question || typeof q.question !== 'string') {
          errors.push(`Pytanie ${idx + 1}: brak pola "question"`);
        }

        if (
          !q.type ||
          !['multiple-choice', 'true-false', 'fill-in-blank', 'matching', 'listening'].includes(
            q.type
          )
        ) {
          errors.push(`Pytanie ${idx + 1}: nieprawidłowy typ "${q.type}"`);
        }

        if (q.type === 'multiple-choice') {
          if (!Array.isArray(q.options) || q.options.length < 2) {
            errors.push(`Pytanie ${idx + 1}: brak opcji odpowiedzi`);
          }
          if (q.correctAnswer === undefined || q.correctAnswer === null) {
            errors.push(`Pytanie ${idx + 1}: brak "correctAnswer"`);
          }
          // Konwersja string → number
          if (typeof q.correctAnswer === 'string') {
            const parsed = parseInt(q.correctAnswer, 10);
            if (isNaN(parsed)) {
              errors.push(
                `Pytanie ${idx + 1}: "correctAnswer" "${q.correctAnswer}" nie jest poprawną liczbą`
              );
            } else {
              q.correctAnswer = parsed;
            }
          }
          if (
            typeof q.correctAnswer === 'number' &&
            (q.correctAnswer < 0 || q.correctAnswer >= q.options.length)
          ) {
            errors.push(
              `Pytanie ${idx + 1}: "correctAnswer" (${q.correctAnswer}) poza zakresem (0-${q.options.length - 1})`
            );
          }
        }

        if (q.type === 'true-false') {
          // Konwersja string → boolean
          if (typeof q.correctAnswer === 'string') {
            if (q.correctAnswer === 'true') {
              q.correctAnswer = true;
            } else if (q.correctAnswer === 'false') {
              q.correctAnswer = false;
            } else {
              errors.push(
                `Pytanie ${idx + 1}: "correctAnswer" "${q.correctAnswer}" nie jest poprawną wartością (true/false)`
              );
            }
          }
          if (typeof q.correctAnswer !== 'boolean') {
            errors.push(
              `Pytanie ${idx + 1}: "correctAnswer" musi być boolean (true/false), otrzymano: ${typeof q.correctAnswer}`
            );
          }
        }

        if (q.type === 'fill-in-blank') {
          if (!q.correctAnswer || typeof q.correctAnswer !== 'string') {
            errors.push(`Pytanie ${idx + 1}: brak "correctAnswer" (string)`);
          }
        }

        if (q.type === 'matching') {
          if (!Array.isArray(q.pairs) || q.pairs.length === 0) {
            errors.push(`Pytanie ${idx + 1}: brak "pairs"`);
          }
        }

        if (q.type === 'listening') {
          if (!q.audioText || typeof q.audioText !== 'string') {
            errors.push(`Pytanie ${idx + 1}: brak "audioText"`);
          }
          if (!q.audioLang || typeof q.audioLang !== 'string') {
            errors.push(`Pytanie ${idx + 1}: brak "audioLang"`);
          }
          if (!q.correctAnswer || typeof q.correctAnswer !== 'string') {
            errors.push(`Pytanie ${idx + 1}: brak "correctAnswer"`);
          }
        }
      });
    }

    return errors;
  }

  /**
   * Walidacja JSON treningu
   * @param {Object} data - Dane treningu
   * @returns {string[]} - Tablica błędów
   */
  validateWorkout(data) {
    const errors = [];

    if (!data.title || typeof data.title !== 'string') {
      errors.push('Brak pola "title" lub nieprawidłowy typ');
    }

    if (!data.description || typeof data.description !== 'string') {
      errors.push('Brak pola "description" lub nieprawidłowy typ');
    }

    // Emoji jest opcjonalne - jeśli brak, użyj domyślnej 💪
    if (!data.emoji) {
      data.emoji = '💪';
    }

    if (!Array.isArray(data.phases) || data.phases.length === 0) {
      errors.push('Brak faz lub "phases" nie jest tablicą');
    }

    if (Array.isArray(data.phases)) {
      data.phases.forEach((phase, idx) => {
        if (!phase.name || typeof phase.name !== 'string') {
          errors.push(`Faza ${idx + 1}: brak pola "name"`);
        }

        if (!Array.isArray(phase.exercises) || phase.exercises.length === 0) {
          errors.push(`Faza ${idx + 1}: brak ćwiczeń`);
        }

        if (Array.isArray(phase.exercises)) {
          phase.exercises.forEach((ex, exIdx) => {
            if (!ex.name || typeof ex.name !== 'string') {
              errors.push(`Faza ${idx + 1}, Ćwiczenie ${exIdx + 1}: brak "name"`);
            }

            if (!ex.type || !['reps', 'time'].includes(ex.type)) {
              errors.push(
                `Faza ${idx + 1}, Ćwiczenie ${exIdx + 1}: nieprawidłowy typ "${ex.type}"`
              );
            }

            if (ex.type === 'time' && (!ex.duration || typeof ex.duration !== 'number')) {
              errors.push(`Faza ${idx + 1}, Ćwiczenie ${exIdx + 1}: brak "duration"`);
            }
          });
        }
      });
    }

    return errors;
  }

  /**
   * Walidacja JSON zestawu Listening
   * @param {Object} data - Dane zestawu listening
   * @returns {string[]} - Tablica błędów
   */
  validateListening(data) {
    const errors = [];

    if (!data.title || typeof data.title !== 'string') {
      errors.push('Brak pola "title" lub nieprawidłowy typ');
    }

    if (!data.description || typeof data.description !== 'string') {
      errors.push('Brak pola "description" lub nieprawidłowy typ');
    }

    if (!data.lang1_code || typeof data.lang1_code !== 'string') {
      errors.push('Brak pola "lang1_code" lub nieprawidłowy typ');
    }

    if (!data.lang2_code || typeof data.lang2_code !== 'string') {
      errors.push('Brak pola "lang2_code" lub nieprawidłowy typ');
    }

    if (!Array.isArray(data.content) || data.content.length === 0) {
      errors.push('Brak par lub "content" nie jest tablicą');
    }

    if (Array.isArray(data.content)) {
      // Wykryj klucze języków z pierwszej pary (nie-nagłówkowej)
      const firstNonHeaderPair = data.content.find(pair => {
        const values = Object.values(pair);
        return !values.some(
          val => typeof val === 'string' && val.startsWith('---') && val.endsWith('---')
        );
      });

      if (!firstNonHeaderPair) {
        errors.push('Brak prawidłowych par (wszystkie są nagłówkami)');
        return errors;
      }

      const keys = Object.keys(firstNonHeaderPair);
      if (keys.length < 2) {
        errors.push('Para musi mieć co najmniej 2 klucze (języki)');
      }

      const lang1Key = keys[0];
      const lang2Key = keys[1];

      data.content.forEach((pair, idx) => {
        // Sprawdź czy to nagłówek (opcjonalne)
        const values = Object.values(pair);
        const isHeader = values.some(
          val => typeof val === 'string' && val.startsWith('---') && val.endsWith('---')
        );

        if (isHeader) {
          // Nagłówki są OK, pomijamy walidację
          return;
        }

        // Walidacja normalnej pary
        if (!pair[lang1Key] || typeof pair[lang1Key] !== 'string') {
          errors.push(`Para ${idx + 1}: brak tekstu w języku 1 (${lang1Key})`);
        }

        if (!pair[lang2Key] || typeof pair[lang2Key] !== 'string') {
          errors.push(`Para ${idx + 1}: brak tekstu w języku 2 (${lang2Key})`);
        }
      });
    }

    return errors;
  }
}

// Singleton instance
export const validationService = new ValidationService();

// Eksportuj do window dla kompatybilności z IIFE modułami
window.validationService = validationService;

console.log('✅ Validation service initialized');
