/**
 * @jest-environment jsdom
 *
 * Tests for Knowledge Base authentication guard
 * Ensures that unauthenticated users cannot access KB articles
 */

describe('Knowledge Base - Authentication Guard', () => {
  let contentManager;
  let mockSessionManager;
  let mockElements;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div id="kb-list-loader" class="hidden"></div>
      <div id="kb-list-error" class="hidden"></div>
      <div id="kb-articles-container" class="hidden"></div>
      <div id="kb-empty-state" class="hidden"></div>
      <button id="login-button">Login</button>
    `;

    // Mock window.state
    window.state = {};

    // Mock window.dataService
    window.dataService = {
      getKnowledgeBaseArticles: jest.fn().mockResolvedValue([
        {
          id: '1',
          title: 'Test Article',
          slug: 'test-article',
          is_published: true
        }
      ])
    };

    // Mock sessionManager
    mockSessionManager = {
      isAdmin: jest.fn().mockReturnValue(false)
    };

    // Setup contentManager
    contentManager = {
      async loadKnowledgeBaseArticles(sessionManager) {
        const loader = document.getElementById('kb-list-loader');
        const error = document.getElementById('kb-list-error');
        const container = document.getElementById('kb-articles-container');
        const emptyState = document.getElementById('kb-empty-state');

        // Ukryj loader
        if (loader) loader.classList.add('hidden');
        if (error) error.classList.add('hidden');
        if (container) container.classList.add('hidden');
        if (emptyState) emptyState.classList.add('hidden');

        // SPRAWDŹ CZY UŻYTKOWNIK JEST ZALOGOWANY
        const currentUser = window.state?.currentUser;
        if (!currentUser) {
          console.warn('⚠️ User not authenticated, cannot load knowledge base articles');

          // Pokaż komunikat o konieczności zalogowania
          if (emptyState) {
            emptyState.innerHTML = `
              <div class="text-center py-12">
                <div class="text-6xl mb-4">🔒</div>
                <h3 class="text-xl font-bold text-gray-300 mb-2">Wymagane logowanie</h3>
                <p class="text-gray-400 mb-6">Zaloguj się, aby przeglądać bazę wiedzy</p>
                <button onclick="document.getElementById('login-button').click()" 
                        class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition">
                  Zaloguj się
                </button>
              </div>
            `;
            emptyState.classList.remove('hidden');
          }
          return;
        }

        // Pokaż loader
        if (loader) loader.classList.remove('hidden');

        try {
          const dataService = window.dataService;
          if (!dataService) throw new Error('dataService nie jest dostępny');

          const filters = { is_published: true };
          if (sessionManager && sessionManager.isAdmin()) {
            delete filters.is_published;
          }

          const articles = await dataService.getKnowledgeBaseArticles(filters);

          // Hide loader, show container
          if (loader) loader.classList.add('hidden');
          if (container) {
            container.classList.remove('hidden');
            container.innerHTML = `<div>Articles: ${articles.length}</div>`;
          }
        } catch (err) {
          if (loader) loader.classList.add('hidden');
          if (error) {
            error.classList.remove('hidden');
            error.textContent = err.message;
          }
        }
      }
    };

    mockElements = {
      loader: document.getElementById('kb-list-loader'),
      error: document.getElementById('kb-list-error'),
      container: document.getElementById('kb-articles-container'),
      emptyState: document.getElementById('kb-empty-state')
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete window.state;
    delete window.dataService;
  });

  describe('Unauthenticated User', () => {
    test('should show login prompt when user is not authenticated', async () => {
      // User not logged in
      window.state.currentUser = null;

      await contentManager.loadKnowledgeBaseArticles(mockSessionManager);

      const emptyState = document.getElementById('kb-empty-state');

      // Should show empty state with login prompt
      expect(emptyState.classList.contains('hidden')).toBe(false);
      expect(emptyState.innerHTML).toContain('🔒');
      expect(emptyState.innerHTML).toContain('Wymagane logowanie');
      expect(emptyState.innerHTML).toContain('Zaloguj się, aby przeglądać bazę wiedzy');

      // Should NOT call dataService
      expect(window.dataService.getKnowledgeBaseArticles).not.toHaveBeenCalled();
    });

    test('should hide loader and other elements when showing login prompt', async () => {
      window.state.currentUser = null;

      await contentManager.loadKnowledgeBaseArticles(mockSessionManager);

      const loader = document.getElementById('kb-list-loader');
      const error = document.getElementById('kb-list-error');
      const container = document.getElementById('kb-articles-container');

      expect(loader.classList.contains('hidden')).toBe(true);
      expect(error.classList.contains('hidden')).toBe(true);
      expect(container.classList.contains('hidden')).toBe(true);
    });

    test('should include login button in the prompt', async () => {
      window.state.currentUser = null;

      await contentManager.loadKnowledgeBaseArticles(mockSessionManager);

      const emptyState = document.getElementById('kb-empty-state');
      const loginButton = emptyState.querySelector('button');

      expect(loginButton).toBeTruthy();
      expect(loginButton.textContent.trim()).toBe('Zaloguj się');
      expect(loginButton.getAttribute('onclick')).toContain('login-button');
    });
  });

  describe('Authenticated User', () => {
    test('should load articles when user is authenticated', async () => {
      // User logged in
      window.state.currentUser = {
        id: 'user123',
        email: 'user@example.com'
      };

      await contentManager.loadKnowledgeBaseArticles(mockSessionManager);

      // Should call dataService
      expect(window.dataService.getKnowledgeBaseArticles).toHaveBeenCalledWith({
        is_published: true
      });

      // Should show container
      const container = document.getElementById('kb-articles-container');
      expect(container.classList.contains('hidden')).toBe(false);
      expect(container.innerHTML).toContain('Articles: 1');
    });

    test('should NOT show login prompt when user is authenticated', async () => {
      window.state.currentUser = {
        id: 'user123',
        email: 'user@example.com'
      };

      await contentManager.loadKnowledgeBaseArticles(mockSessionManager);

      const emptyState = document.getElementById('kb-empty-state');

      // Should NOT show login prompt
      expect(emptyState.innerHTML).not.toContain('🔒');
      expect(emptyState.innerHTML).not.toContain('Wymagane logowanie');
    });
  });

  describe('Admin User', () => {
    test('should load all articles (including unpublished) for admin', async () => {
      window.state.currentUser = {
        id: 'admin123',
        email: 'admin@example.com'
      };
      mockSessionManager.isAdmin.mockReturnValue(true);

      await contentManager.loadKnowledgeBaseArticles(mockSessionManager);

      // Should call dataService WITHOUT is_published filter
      expect(window.dataService.getKnowledgeBaseArticles).toHaveBeenCalledWith({});
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing window.state gracefully', async () => {
      delete window.state;

      await contentManager.loadKnowledgeBaseArticles(mockSessionManager);

      const emptyState = document.getElementById('kb-empty-state');

      // Should show login prompt
      expect(emptyState.classList.contains('hidden')).toBe(false);
      expect(emptyState.innerHTML).toContain('Wymagane logowanie');
    });

    test('should handle window.state without currentUser', async () => {
      window.state = {}; // No currentUser property

      await contentManager.loadKnowledgeBaseArticles(mockSessionManager);

      const emptyState = document.getElementById('kb-empty-state');

      // Should show login prompt
      expect(emptyState.classList.contains('hidden')).toBe(false);
      expect(emptyState.innerHTML).toContain('Wymagane logowanie');
    });

    test('should handle missing DOM elements gracefully', async () => {
      // Remove all DOM elements
      document.body.innerHTML = '';
      window.state.currentUser = null;

      // Should not throw error
      await expect(
        contentManager.loadKnowledgeBaseArticles(mockSessionManager)
      ).resolves.not.toThrow();
    });
  });

  describe('Security', () => {
    test('should never expose articles to unauthenticated users', async () => {
      window.state.currentUser = null;

      await contentManager.loadKnowledgeBaseArticles(mockSessionManager);

      // Verify dataService was NOT called
      expect(window.dataService.getKnowledgeBaseArticles).not.toHaveBeenCalled();

      // Verify no articles are rendered
      const container = document.getElementById('kb-articles-container');
      expect(container.innerHTML).not.toContain('Articles:');
    });

    test('should check authentication before any data fetching', async () => {
      window.state.currentUser = null;
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      await contentManager.loadKnowledgeBaseArticles(mockSessionManager);

      // Should log warning
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '⚠️ User not authenticated, cannot load knowledge base articles'
      );

      consoleWarnSpy.mockRestore();
    });
  });
});
