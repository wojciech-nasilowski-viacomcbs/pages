/**
 * @fileoverview Serwis eksportu treści do JSON (quiz, workout, listening)
 */

import dataService from '../data/data-service.js'; // default export

export class ExportService {
  /**
   * Eksportuje treść do pliku JSON
   * @param {string} id - ID treści
   * @param {'quiz'|'workout'|'listening'} type - Typ treści
   * @returns {Promise<void>}
   */
  async export(id, type) {
    try {
      // 1. Pobierz pełne dane z Supabase
      let data, filename;

      if (type === 'quiz') {
        data = await dataService.fetchQuizById(id);
        filename = `quiz-${this.sanitizeFilename(data.title)}.json`;
      } else if (type === 'workout') {
        data = await dataService.fetchWorkoutById(id);
        filename = `workout-${this.sanitizeFilename(data.title)}.json`;
      } else if (type === 'listening') {
        data = await dataService.getListeningSet(id);
        filename = `listening-${this.sanitizeFilename(data.title)}.json`;
      } else {
        throw new Error(`Unknown content type: ${type}`);
      }

      // 2. Usuń metadane Supabase (id, user_id, created_at, is_sample, is_public)
      const cleanData = this.cleanMetadata(data, type);

      // 3. Konwertuj do JSON
      const jsonString = JSON.stringify(cleanData, null, 2);

      // 4. Pobierz plik
      this.downloadFile(jsonString, filename);

      console.log('✅ Wyeksportowano:', filename);
    } catch (error) {
      console.error('Błąd eksportu:', error);
      throw new Error(`Błąd podczas eksportu: ${error.message}`);
    }
  }

  /**
   * Usuwa metadane bazy danych i zwraca czyste dane
   * @param {Object} data - Dane z bazy
   * @param {'quiz'|'workout'|'listening'} type - Typ treści
   * @returns {Object} - Czyste dane do eksportu
   */
  cleanMetadata(data, type) {
    const cleanData = {
      title: data.title,
      description: data.description || ''
    };

    if (type === 'quiz') {
      cleanData.questions = data.questions;
    } else if (type === 'workout') {
      // Dla treningów: dodaj emoji (lub domyślną 💪 jeśli brak)
      cleanData.emoji = data.emoji || '💪';
      cleanData.phases = data.phases;
    } else if (type === 'listening') {
      cleanData.lang1_code = data.lang1_code;
      cleanData.lang2_code = data.lang2_code;
      cleanData.content = data.content;
    }

    return cleanData;
  }

  /**
   * Pobiera plik (tworzy blob i uruchamia download)
   * @param {string} content - Zawartość pliku
   * @param {string} filename - Nazwa pliku
   */
  downloadFile(content, filename) {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Sanityzuje nazwę pliku (usuwa niebezpieczne znaki)
   * @param {string} filename - Nazwa do sanityzacji
   * @returns {string} - Bezpieczna nazwa pliku
   */
  sanitizeFilename(filename) {
    return filename
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
  }
}

// Singleton
export const exportService = new ExportService();

// Eksportuj do window dla kompatybilności z IIFE modułami
window.exportService = exportService;

console.log('✅ Export service initialized');
