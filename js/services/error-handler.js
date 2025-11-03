/**
 * @fileoverview Centralny handler błędów aplikacji
 * Zapewnia spójną obsługę i prezentację błędów użytkownikowi
 */

export class ErrorHandler {
  /**
   * Obsługuje błąd - loguje i pokazuje użytkownikowi
   * @param {Error|string} error - Błąd do obsłużenia
   * @param {Object} options - Opcje obsługi
   * @param {string} [options.context] - Kontekst błędu (np. "Ładowanie quizu")
   * @param {boolean} [options.showToUser=true] - Czy pokazać użytkownikowi
   * @param {Function} [options.onError] - Callback po obsłużeniu błędu
   */
  handle(error, options = {}) {
    const { context = 'Operacja', showToUser = true, onError = null } = options;

    // 1. Loguj do konsoli
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ ${context}:`, error);

    // 2. Pokaż użytkownikowi (jeśli włączone)
    if (showToUser) {
      this.showUserMessage(context, errorMessage);
    }

    // 3. Wywołaj callback (jeśli podany)
    if (onError && typeof onError === 'function') {
      onError(error);
    }
  }

  /**
   * Pokazuje komunikat użytkownikowi
   * @param {string} context - Kontekst błędu
   * @param {string} message - Treść błędu
   * @private
   */
  showUserMessage(context, message) {
    // Sprawdź czy jest dostępny toast (lepsze UX)
    if (window.showToast && typeof window.showToast === 'function') {
      window.showToast(`${context}: ${message}`, 'error');
    }
    // Sprawdź czy jest dostępny uiManager.showError
    else if (window.uiManager && typeof window.uiManager.showError === 'function') {
      window.uiManager.showError(`${context}: ${message}`);
    }
    // Fallback: alert
    else {
      alert(`${context}\n\n${message}`);
    }
  }

  /**
   * Obsługuje błąd sieciowy (fetch)
   * @param {Error} error - Błąd fetch
   * @param {Object} options - Opcje obsługi
   */
  handleNetworkError(error, options = {}) {
    const defaultOptions = {
      context: 'Błąd połączenia',
      showToUser: true,
      ...options
    };

    // Sprawdź czy to błąd sieci
    if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
      this.handle(new Error('Sprawdź połączenie z internetem i spróbuj ponownie'), defaultOptions);
    } else {
      this.handle(error, defaultOptions);
    }
  }

  /**
   * Obsługuje błąd walidacji
   * @param {string[]} errors - Lista błędów walidacji
   * @param {Object} options - Opcje obsługi
   */
  handleValidationErrors(errors, options = {}) {
    const defaultOptions = {
      context: 'Błąd walidacji',
      showToUser: true,
      ...options
    };

    const errorMessage = errors.join('\n• ');
    this.handle(new Error(`\n• ${errorMessage}`), defaultOptions);
  }

  /**
   * Obsługuje błąd autoryzacji (401, 403)
   * @param {Error} error - Błąd autoryzacji
   * @param {Object} options - Opcje obsługi
   */
  handleAuthError(error, options = {}) {
    const defaultOptions = {
      context: 'Błąd autoryzacji',
      showToUser: true,
      onError: () => {
        // Opcjonalnie: przekieruj do logowania
        if (window.uiManager && typeof window.uiManager.showScreen === 'function') {
          console.log('🔐 Wymagane ponowne logowanie');
        }
      },
      ...options
    };

    this.handle(error, defaultOptions);
  }

  /**
   * Obsługuje nieoczekiwany błąd (500, unknown)
   * @param {Error} error - Nieoczekiwany błąd
   * @param {Object} options - Opcje obsługi
   */
  handleUnexpectedError(error, options = {}) {
    const defaultOptions = {
      context: 'Nieoczekiwany błąd',
      showToUser: true,
      ...options
    };

    // Loguj szczegóły dla debugowania
    console.error('🔥 Unexpected error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    this.handle(new Error('Coś poszło nie tak. Spróbuj odświeżyć stronę.'), defaultOptions);
  }

  /**
   * Wrapper dla async funkcji - automatyczna obsługa błędów
   * @param {Function} fn - Async funkcja do wykonania
   * @param {Object} options - Opcje obsługi błędów
   * @returns {Promise<any>} - Wynik funkcji lub undefined w przypadku błędu
   */
  async wrap(fn, options = {}) {
    try {
      return await fn();
    } catch (error) {
      this.handle(error, options);
      return undefined;
    }
  }
}

// Singleton
export const errorHandler = new ErrorHandler();
