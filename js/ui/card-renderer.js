/**
 * @fileoverview Renderer kart treści (quiz, workout)
 * Odpowiedzialny za generowanie HTML kart i zarządzanie event listenerami
 */

export class CardRenderer {
  /**
   * Renderuje kartę treści
   * @param {Object} item - Dane treści (quiz lub workout)
   * @param {Object} options - Opcje renderowania
   * @param {'quiz'|'workout'} options.type - Typ treści
   * @param {boolean} options.isAdmin - Czy użytkownik jest adminem
   * @returns {string} - HTML karty
   */
  renderCard(item, options = {}) {
    const { type = 'quiz', isAdmin = false } = options;

    // Ikona: dla quizów zawsze 📝, dla treningów użyj emoji z danych lub domyślnie 💪
    const icon = type === 'quiz' ? '📝' : item.emoji || '💪';

    // Badge: Przykład (sample) lub Publiczny (is_public)
    const badge = this.renderBadge(item);

    // Przyciski akcji (tylko dla nie-przykładowych treści)
    const actionButtons = !item.isSample ? this.renderActionButtons(item, isAdmin) : '';

    return `
      <div class="content-card bg-gray-800 p-6 rounded-xl hover:bg-gray-750 transition cursor-pointer group relative"
           data-id="${item.id}">
        ${actionButtons}
        <div class="flex justify-between items-start mb-3">
          <div class="text-4xl">${icon}</div>
          ${badge}
        </div>
        <h3 class="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition">
          ${this.escapeHtml(item.title)}
        </h3>
        <p class="text-gray-400 text-sm">${this.escapeHtml(item.description || 'Brak opisu')}</p>
      </div>
    `;
  }

  /**
   * Renderuje badge (Przykład/Publiczny)
   * @param {Object} item - Dane treści
   * @returns {string} - HTML badge
   * @private
   */
  renderBadge(item) {
    if (item.isSample) {
      return '<span class="text-xs bg-blue-600 px-2 py-1 rounded">Przykład</span>';
    } else if (item.isPublic) {
      return '<span class="text-xs bg-green-600 px-2 py-1 rounded">Publiczny</span>';
    }
    return '';
  }

  /**
   * Renderuje przyciski akcji (toggle public, share, export, delete)
   * @param {Object} item - Dane treści
   * @param {boolean} isAdmin - Czy użytkownik jest adminem
   * @returns {string} - HTML przycisków
   * @private
   */
  renderActionButtons(item, isAdmin) {
    // Przycisk toggle public/private (tylko dla adminów)
    const togglePublicBtn = isAdmin
      ? `
        <button class="toggle-public-btn bg-gray-700/90 md:bg-transparent text-gray-300 hover:text-purple-500 active:scale-95 md:hover:scale-110 text-2xl md:text-xl p-2 md:p-0 rounded-lg md:rounded-none min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center"
                data-id="${item.id}"
                data-is-public="${item.isPublic || false}"
                data-title="${this.escapeAttr(item.title)}"
                title="${item.isPublic ? 'Zmień na prywatny' : 'Opublikuj dla wszystkich'}">
          ${item.isPublic ? '🔒' : '🌍'}
        </button>
      `
      : '';

    return `
      <div class="absolute top-2 right-2 md:top-3 md:right-3 md:opacity-0 md:group-hover:opacity-100 transition-all duration-200 flex gap-2 z-10">
        ${togglePublicBtn}
        <button class="share-btn bg-gray-700/90 md:bg-transparent text-gray-300 hover:text-blue-500 active:scale-95 md:hover:scale-110 text-2xl md:text-xl p-2 md:p-0 rounded-lg md:rounded-none min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center"
                data-id="${item.id}"
                data-title="${this.escapeAttr(item.title)}"
                title="Udostępnij link">
          🔗
        </button>
        <button class="export-btn bg-gray-700/90 md:bg-transparent text-gray-300 hover:text-green-500 active:scale-95 md:hover:scale-110 text-2xl md:text-xl p-2 md:p-0 rounded-lg md:rounded-none min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center"
                data-id="${item.id}"
                data-title="${this.escapeAttr(item.title)}"
                title="Eksportuj JSON">
          ⬇
        </button>
        <button class="delete-btn bg-gray-700/90 md:bg-transparent text-gray-300 hover:text-red-500 active:scale-95 md:hover:scale-110 text-2xl md:text-xl p-2 md:p-0 rounded-lg md:rounded-none min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center"
                data-id="${item.id}"
                data-title="${this.escapeAttr(item.title)}"
                title="Usuń">
          ×
        </button>
      </div>
    `;
  }

  /**
   * Renderuje ekran logowania (dla niezalogowanych użytkowników)
   * @param {string[]} enabledFeatures - Lista włączonych funkcjonalności
   * @returns {string} - HTML ekranu logowania
   */
  renderLoginScreen(enabledFeatures = []) {
    const featuresList =
      enabledFeatures.length > 0
        ? enabledFeatures
            .map(
              feature =>
                `<div class="flex items-center gap-3 text-lg"><span class="text-green-400">✓</span><span>${feature}</span></div>`
            )
            .join('')
        : '<p class="text-gray-400 text-lg">Brak dostępnych modułów. Skontaktuj się z administratorem.</p>';

    return `
      <div class="col-span-full flex items-center justify-center min-h-[60vh]">
        <div class="max-w-lg mx-auto text-center px-4">
          <h1 class="text-5xl font-bold text-white mb-4">Witaj w eTrener! 👋</h1>
          <p class="text-xl text-gray-300 mb-8">
            Zaloguj się, aby uzyskać dostęp do:
          </p>
          <div class="bg-gray-800/50 rounded-2xl p-8 mb-8 space-y-4 text-left">
            ${featuresList}
          </div>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <button onclick="document.getElementById('login-button').click()" 
                    class="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition text-lg shadow-lg">
              Zaloguj się
            </button>
            <button onclick="document.getElementById('register-button').click()" 
                    class="px-8 py-4 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition text-lg">
              Nie masz konta? Zarejestruj się
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Renderuje ekran pustej listy
   * @returns {string} - HTML pustej listy
   */
  renderEmptyState() {
    return `
      <div class="col-span-full text-center py-12 text-gray-400">
        <p class="text-xl mb-2">Brak dostępnych treści</p>
        <p class="text-sm">Zaimportuj swoje treści lub poczekaj na przykładowe dane</p>
      </div>
    `;
  }

  /**
   * Renderuje ekran braku aktywnych modułów
   * @returns {string} - HTML ekranu błędu
   */
  renderNoModulesScreen() {
    return `
      <div class="col-span-full text-center py-16">
        <div class="max-w-2xl mx-auto">
          <h2 class="text-4xl font-bold text-white mb-4">Brak aktywnych modułów</h2>
          <p class="text-xl text-gray-300">
            Administrator nie włączył żadnych funkcjonalności. Skontaktuj się z pomocą techniczną.
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Escape HTML (bezpieczeństwo XSS)
   * @param {string} text - Tekst do escape
   * @returns {string} - Bezpieczny HTML
   * @private
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Escape atrybutu HTML (bezpieczeństwo XSS)
   * @param {string} text - Tekst do escape
   * @returns {string} - Bezpieczny atrybut
   * @private
   */
  escapeAttr(text) {
    return text.replace(/"/g, '&quot;');
  }
}

// Singleton
export const cardRenderer = new CardRenderer();
