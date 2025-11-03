/**
 * @fileoverview Serwis importu JSON (quiz, workout, listening)
 * Wyekstraktowany z content-manager.js w ramach refaktoringu architektury
 * @module import-service
 */

import { validationService } from './validation-service.js';
import dataService from '../data/data-service.js'; // default export

/**
 * Serwis importu treści
 */
export class ImportService {
  /**
   * Import z pliku
   * @param {File} file - Plik JSON
   * @param {'quiz'|'workout'|'listening'} type - Typ treści
   * @param {boolean} isPublic - Czy treść ma być publiczna
   * @returns {Promise<Object>} - Zaimportowane dane
   */
  async importFromFile(file, type, isPublic = false) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      return await this.import(data, type, isPublic);
    } catch (error) {
      throw new Error(`Nieprawidłowy format JSON: ${error.message}`);
    }
  }

  /**
   * Import z JSON string
   * @param {string} jsonString - JSON jako string
   * @param {'quiz'|'workout'|'listening'} type - Typ treści
   * @param {boolean} isPublic - Czy treść ma być publiczna
   * @returns {Promise<Object>} - Zaimportowane dane
   */
  async importFromJSON(jsonString, type, isPublic = false) {
    try {
      const data = JSON.parse(jsonString);
      return await this.import(data, type, isPublic);
    } catch (error) {
      throw new Error(`Nieprawidłowy JSON: ${error.message}`);
    }
  }

  /**
   * Główna logika importu
   * @param {Object} data - Dane do zaimportowania
   * @param {'quiz'|'workout'|'listening'} type - Typ treści
   * @param {boolean} isPublic - Czy treść ma być publiczna
   * @returns {Promise<Object>} - Zaimportowane dane
   */
  async import(data, type, isPublic = false) {
    // 1. Convert legacy format (jeśli potrzeba)
    data = this.convertLegacyFormat(data, type);

    // 2. Validate
    const errors = validationService.validate(data, type);
    if (errors.length > 0) {
      throw new Error(`Błędy walidacji:\n• ${errors.join('\n• ')}`);
    }

    // 3. Save to Supabase
    let result;
    if (type === 'quiz') {
      result = await dataService.saveQuiz(data, isPublic);
    } else if (type === 'workout') {
      result = await dataService.saveWorkout(data, isPublic);
    } else if (type === 'listening') {
      result = await dataService.createListeningSet(
        data.title,
        data.description,
        data.lang1_code,
        data.lang2_code,
        data.content,
        isPublic
      );
    } else {
      throw new Error(`Unknown type: ${type}`);
    }

    return result;
  }

  /**
   * Konwertuje stary format JSON (v1) na nowy (v2)
   * @param {Object} data - Dane do konwersji
   * @param {'quiz'|'workout'|'listening'} type - Typ treści
   * @returns {Object} - Skonwertowane dane
   */
  convertLegacyFormat(data, type) {
    if (type === 'quiz') {
      if (data.questions) {
        data.questions = data.questions.map(q => {
          const converted = { ...q };

          // Konwersja: questionText → question
          if (q.questionText && !q.question) {
            converted.question = q.questionText;
            delete converted.questionText;
          }

          // Konwersja: fill-in-the-blank → fill-in-blank
          if (q.type === 'fill-in-the-blank') {
            converted.type = 'fill-in-blank';
          }

          // Konwersja: isCorrect → correctAnswer (dla true-false)
          if (
            q.type === 'true-false' &&
            q.isCorrect !== undefined &&
            q.correctAnswer === undefined
          ) {
            converted.correctAnswer = q.isCorrect;
            delete converted.isCorrect;
          }

          // Konwersja: opcje z obiektem {text, isCorrect} → proste stringi
          if (q.type === 'multiple-choice' && Array.isArray(q.options)) {
            if (q.options[0] && typeof q.options[0] === 'object' && q.options[0].text) {
              const correctIndex = q.options.findIndex(opt => opt.isCorrect);
              converted.options = q.options.map(opt => opt.text);
              if (correctIndex !== -1) {
                converted.correctAnswer = correctIndex;
              }
            }
          }

          // Usuń nieużywane pola (ale ZACHOWAJ audioText, audioLang dla listening)
          if (converted.type !== 'listening') {
            delete converted.audioText;
            delete converted.audioLang;
            delete converted.audioRate;
          }
          delete converted.acceptableAnswers;
          delete converted.autoPlay;
          delete converted.caseSensitive;

          return converted;
        });

        // NIE usuwamy pytań listening - są obsługiwane w v2!
      }
    }

    // Dla workout i listening - na razie brak konwersji legacy
    // (można dodać w przyszłości jeśli będą potrzebne)

    return data;
  }
}

// Singleton instance
export const importService = new ImportService();

console.log('✅ Import service initialized');
