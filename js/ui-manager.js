// ============================================
// UI MANAGER - Screens, Tabs, Errors, Sound
// ============================================

(function() {
'use strict';

const uiManager = {
  
  /**
   * Przełącza widoki aplikacji
   */
  showScreen(screenName, state, elements, contentManager, sessionManager) {
    // Ukryj wszystkie ekrany
    elements.mainScreen.classList.add('hidden');
    elements.quizScreen.classList.add('hidden');
    elements.quizSummaryScreen.classList.add('hidden');
    elements.workoutScreen.classList.add('hidden');
    elements.workoutEndScreen.classList.add('hidden');
    if (elements.moreScreen) elements.moreScreen.classList.add('hidden');
    if (elements.listeningScreen) elements.listeningScreen.classList.add('hidden');
    if (elements.knowledgeBaseScreen) elements.knowledgeBaseScreen.classList.add('hidden');
    
    // Pokaż wybrany ekran
    switch (screenName) {
      case 'main':
        elements.mainScreen.classList.remove('hidden');
        state.currentView = 'main';
        if (contentManager) {
          contentManager.renderCards(state, elements, this, sessionManager);
        }
        break;
      case 'quiz':
        elements.quizScreen.classList.remove('hidden');
        state.currentView = 'quiz';
        break;
      case 'quiz-summary':
        elements.quizSummaryScreen.classList.remove('hidden');
        state.currentView = 'quiz-summary';
        break;
      case 'workout':
        elements.workoutScreen.classList.remove('hidden');
        state.currentView = 'workout';
        break;
      case 'workout-end':
        elements.workoutEndScreen.classList.remove('hidden');
        state.currentView = 'workout-end';
        break;
      case 'more':
        if (elements.moreScreen) elements.moreScreen.classList.remove('hidden');
        state.currentView = 'more';
        break;
      case 'listening':
        if (elements.listeningScreen) elements.listeningScreen.classList.remove('hidden');
        state.currentView = 'listening';
        break;
      case 'knowledge-base':
        if (elements.knowledgeBaseScreen) elements.knowledgeBaseScreen.classList.remove('hidden');
        state.currentView = 'knowledge-base';
        // Załaduj artykuły Bazy Wiedzy
        if (contentManager && contentManager.loadKnowledgeBaseArticles) {
          contentManager.loadKnowledgeBaseArticles(sessionManager);
        }
        break;
      case 'loading':
        // Pokaż loader na głównym ekranie
        elements.mainScreen.classList.remove('hidden');
        break;
    }
    
    // Aktualizuj UI state (zarządza tab barem automatycznie)
    if (window.uiState) {
      window.uiState.navigateToScreen(screenName);
    } else {
      // Fallback jeśli uiState nie jest jeszcze załadowany
      this.updateTabBarVisibility(screenName);
    }
    
    // Scroll do góry
    window.scrollTo(0, 0);
  },
  
  /**
   * Zarządza widocznością dolnego paska nawigacji (tab bar)
   * Pokazuje go na ekranach nawigacyjnych/wyboru, ukrywa podczas aktywności
   * @param {string} screenName - Nazwa ekranu ('main', 'quiz', 'workout', 'listening', etc.)
   * @param {boolean} [isActivity=null] - Opcjonalnie: czy to aktywność (test/trening/odtwarzanie)
   */
  updateTabBarVisibility(screenName, isActivity = null) {
    const tabBar = document.getElementById('tab-bar');
    if (!tabBar) return;
    
    // Jeśli isActivity jest jawnie określone, użyj tego
    if (isActivity !== null) {
      if (isActivity) {
        tabBar.classList.add('hidden');
      } else {
        tabBar.classList.remove('hidden');
      }
      return;
    }
    
    // Automatyczna detekcja na podstawie screenName
    const navigationScreens = ['main', 'more', 'loading'];
    const activityScreens = ['quiz', 'workout'];
    const summaryScreens = ['quiz-summary', 'workout-end'];
    
    if (navigationScreens.includes(screenName)) {
      // Ekrany nawigacyjne - pokaż tab bar
      tabBar.classList.remove('hidden');
    } else if (activityScreens.includes(screenName)) {
      // Aktywne ćwiczenia - ukryj tab bar
      tabBar.classList.add('hidden');
    } else if (summaryScreens.includes(screenName)) {
      // Podsumowania - pokaż tab bar (użytkownik może chcieć przejść dalej)
      tabBar.classList.remove('hidden');
    } else if (screenName === 'listening') {
      // Dla listening domyślnie pokaż (lista zestawów)
      // Będzie ukrywany przez listening-engine gdy odtwarzacz się włączy
      tabBar.classList.remove('hidden');
    } else {
      // Domyślnie ukryj dla nieznanych ekranów
      tabBar.classList.add('hidden');
    }
  },
  
  /**
   * Przełącza zakładki (Quizy / Treningi / Słuchanie / Więcej)
   */
  switchTab(tab, state, elements, contentManager, sessionManager) {
    // Sprawdź, czy wybrana zakładka jest włączona
    const enabledTabs = featureFlags.getEnabledTabs();
    let targetTab = tab;

    if (!enabledTabs.includes(targetTab)) {
      // Jeśli wybrana zakładka jest wyłączona, przełącz na pierwszą dostępną
      targetTab = enabledTabs.length > 0 ? enabledTabs[0] : null;
      if (!targetTab) {
        console.warn('Brak włączonych zakładek do wyświetlenia.');
        // Opcjonalnie: ukryj tab bar całkowicie, jeśli nie ma żadnych zakładek
        const tabBar = document.getElementById('tab-bar');
        if (tabBar) tabBar.classList.add('hidden');
        return; // Nie rób nic więcej
      }
    }

    state.currentTab = targetTab;
    
    // Aktualizuj UI state
    if (window.uiState) {
      window.uiState.switchTab(targetTab);
    }
    
    // Zapisz aktualną zakładkę w localStorage
    try {
      localStorage.setItem('lastActiveTab', targetTab);
    } catch (e) {
      console.warn('Nie można zapisać zakładki w localStorage:', e);
    }
    
    // Usuń klasę 'active' ze wszystkich tabów
    [elements.tabQuizzes, elements.tabWorkouts, elements.tabListening, elements.tabKnowledgeBase,
     elements.tabImport, elements.tabAIGenerator, elements.tabMore]
      .forEach(btn => btn?.classList.remove('active'));
    
    // Dodaj klasę 'active' do aktywnego taba
    const activeTabButton = {
      'quizzes': elements.tabQuizzes,
      'workouts': elements.tabWorkouts,
      'listening': elements.tabListening,
      'knowledge-base': elements.tabKnowledgeBase,
      'import': elements.tabImport,
      'ai-generator': elements.tabAIGenerator,
      'more': elements.tabMore
    }[targetTab];
    activeTabButton?.classList.add('active');
    
    // Pokaż odpowiedni widok
    if (targetTab === 'more') {
      this.showScreen('more', state, elements, contentManager, sessionManager);
    } else if (targetTab === 'listening') {
      this.showScreen('listening', state, elements, contentManager, sessionManager);
      // Pokaż listę zestawów
      if (typeof showListeningList === 'function') {
        showListeningList();
      }
    } else if (targetTab === 'knowledge-base') {
      this.showScreen('knowledge-base', state, elements, contentManager, sessionManager);
    } else {
      // Dla quizzes i workouts - renderuj karty
      this.showScreen('main', state, elements, contentManager, sessionManager);
    }
  },
  
  /**
   * Pokazuje komunikat o błędzie
   */
  showError(message, elements) {
    if (!elements) return;
    
    elements.errorMessage.classList.remove('hidden');
    elements.errorMessage.querySelector('p').textContent = message;
    
    setTimeout(() => {
      elements.errorMessage.classList.add('hidden');
    }, 5000);
  },
  
  /**
   * Obsługa przycisku wyciszenia
   */
  handleSoundToggle(elements) {
    const muted = toggleMute();
    
    if (muted) {
      elements.soundIconOn.classList.add('hidden');
      elements.soundIconOff.classList.remove('hidden');
      elements.soundToggle.title = 'Włącz dźwięki';
    } else {
      elements.soundIconOn.classList.remove('hidden');
      elements.soundIconOff.classList.add('hidden');
      elements.soundToggle.title = 'Wycisz dźwięki';
    }
  },
  
  /**
   * Aktualizuje UI w zależności od stanu autentykacji
   */
  updateAuthUI(state, elements, contentManager, sessionManager) {
    if (state.currentUser) {
      // Zalogowany
      elements.guestButtons.classList.add('hidden');
      elements.userInfo.classList.remove('hidden');
      elements.userEmail.textContent = state.currentUser.email;
    } else {
      // Gość
      elements.guestButtons.classList.remove('hidden');
      elements.userInfo.classList.add('hidden');
    }
    
    // Odśwież widok
    if (contentManager) {
      contentManager.renderCards(state, elements, this, sessionManager);
    }
  },

  // ============================================
  // BAZA WIEDZY
  // ============================================

  /**
   * Wyświetla listę artykułów Bazy Wiedzy
   * @param {Array} articles - Tablica artykułów
   * @param {Object} sessionManager - Manager sesji (sprawdzenie roli admina)
   */
  showKnowledgeBaseList(articles, sessionManager) {
    const container = document.getElementById('kb-articles-container');
    const loader = document.getElementById('kb-list-loader');
    const error = document.getElementById('kb-list-error');
    const emptyState = document.getElementById('kb-empty-state');
    const addButton = document.getElementById('kb-add-article');

    // Ukryj loader
    if (loader) loader.classList.add('hidden');
    if (error) error.classList.add('hidden');

    // Pokaż/ukryj przycisk dodawania dla admina
    if (addButton && sessionManager) {
      if (sessionManager.isAdmin()) {
        addButton.classList.remove('hidden');
      } else {
        addButton.classList.add('hidden');
      }
    }

    // Jeśli brak artykułów
    if (!articles || articles.length === 0) {
      if (container) container.classList.add('hidden');
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    // Ukryj empty state
    if (emptyState) emptyState.classList.add('hidden');
    if (container) container.classList.remove('hidden');

    // Renderuj artykuły
    this.renderKnowledgeBaseList(articles, container, sessionManager);
  },

  /**
   * Renderuje karty artykułów
   * @param {Array} articles - Tablica artykułów
   * @param {HTMLElement} container - Kontener na karty
   * @param {Object} sessionManager - Manager sesji
   */
  renderKnowledgeBaseList(articles, container, sessionManager) {
    if (!container) return;

    const isAdmin = sessionManager && sessionManager.isAdmin();

    container.innerHTML = articles.map(article => {
      const icon = article.icon || '📄';
      const category = article.category || 'Ogólne';
      const date = article.created_at ? new Date(article.created_at).toLocaleDateString('pl-PL') : '';
      const views = article.view_count || 0;
      const tags = Array.isArray(article.tags) ? article.tags.slice(0, 3) : [];
      const isFeatured = article.featured;

      // Przyciski admina
      const adminButtons = isAdmin ? `
        <div class="flex gap-2 mt-3">
          <button 
            class="kb-edit-btn flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 px-3 rounded transition"
            data-article-id="${article.id}"
            data-article-slug="${article.slug}"
          >
            ✏️ Edytuj
          </button>
          <button 
            class="kb-delete-btn bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2 px-3 rounded transition"
            data-article-id="${article.id}"
            data-article-title="${article.title}"
          >
            🗑️
          </button>
        </div>
      ` : '';

      return `
        <div class="bg-gray-800 rounded-lg p-5 hover:bg-gray-750 transition cursor-pointer kb-article-card" data-slug="${article.slug}">
          ${isFeatured ? '<div class="text-yellow-400 text-sm font-bold mb-2">⭐ Wyróżniony</div>' : ''}
          
          <div class="flex items-start gap-3 mb-3">
            <div class="text-3xl">${icon}</div>
            <div class="flex-1">
              <h3 class="text-xl font-bold mb-1">${article.title}</h3>
              ${article.description ? `<p class="text-gray-400 text-sm line-clamp-2">${article.description}</p>` : ''}
            </div>
          </div>

          <div class="flex flex-wrap gap-2 text-xs text-gray-500 mb-3">
            <span>📁 ${category}</span>
            ${date ? `<span>📅 ${date}</span>` : ''}
            <span>👁️ ${views}</span>
          </div>

          ${tags.length > 0 ? `
            <div class="flex flex-wrap gap-2 mb-3">
              ${tags.map(tag => `<span class="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded">#${tag}</span>`).join('')}
            </div>
          ` : ''}

          ${adminButtons}
        </div>
      `;
    }).join('');

    // Dodaj event listenery dla kart (otwieranie artykułu)
    container.querySelectorAll('.kb-article-card').forEach(card => {
      card.addEventListener('click', (e) => {
        // Nie otwieraj artykułu jeśli kliknięto przycisk admina
        if (e.target.closest('.kb-edit-btn') || e.target.closest('.kb-delete-btn')) {
          return;
        }
        const slug = card.dataset.slug;
        if (slug) {
          this.showKnowledgeBaseArticle(slug, sessionManager);
        }
      });
    });

    // Event listenery dla przycisków admina
    if (isAdmin) {
      // Edycja
      container.querySelectorAll('.kb-edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const slug = btn.dataset.articleSlug;
          if (slug) {
            this.showKnowledgeBaseEditor(slug);
          }
        });
      });

      // Usuwanie
      container.querySelectorAll('.kb-delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.dataset.articleId;
          const title = btn.dataset.articleTitle;
          if (id && confirm(`Czy na pewno usunąć artykuł "${title}"?`)) {
            this.deleteKnowledgeBaseArticle(id);
          }
        });
      });
    }
  },

  /**
   * Wyświetla pojedynczy artykuł
   * @param {string} slug - Slug artykułu
   * @param {Object} sessionManager - Manager sesji
   */
  async showKnowledgeBaseArticle(slug, sessionManager) {
    const listView = document.getElementById('knowledge-base-list');
    const articleView = document.getElementById('knowledge-base-article');
    const loader = document.getElementById('kb-article-loader');
    const error = document.getElementById('kb-article-error');
    const content = document.getElementById('kb-article-content');
    const adminActions = document.getElementById('kb-article-admin-actions');

    // Ukryj listę, pokaż widok artykułu
    if (listView) listView.classList.add('hidden');
    if (articleView) articleView.classList.remove('hidden');
    if (loader) loader.classList.remove('hidden');
    if (error) error.classList.add('hidden');
    if (content) content.classList.add('hidden');

    try {
      // Pobierz artykuł z dataService
      const dataService = window.dataService;
      if (!dataService) throw new Error('dataService nie jest dostępny');

      const article = await dataService.getKnowledgeBaseArticle(slug);
      if (!article) throw new Error('Artykuł nie znaleziony');

      // Ukryj loader
      if (loader) loader.classList.add('hidden');
      if (content) content.classList.remove('hidden');

      // Wypełnij dane
      const iconEl = document.getElementById('kb-article-icon');
      const titleEl = document.getElementById('kb-article-title');
      const descriptionEl = document.getElementById('kb-article-description');
      const categoryEl = document.getElementById('kb-article-category');
      const dateEl = document.getElementById('kb-article-date');
      const viewsEl = document.getElementById('kb-article-views');
      const tagsEl = document.getElementById('kb-article-tags');
      const bodyEl = document.getElementById('kb-article-body');

      if (iconEl) iconEl.textContent = article.icon || '📄';
      if (titleEl) titleEl.textContent = article.title;
      if (descriptionEl) {
        if (article.description) {
          descriptionEl.textContent = article.description;
          descriptionEl.classList.remove('hidden');
        } else {
          descriptionEl.classList.add('hidden');
        }
      }
      if (categoryEl) categoryEl.textContent = `📁 ${article.category || 'Ogólne'}`;
      if (dateEl) dateEl.textContent = `📅 ${new Date(article.created_at).toLocaleDateString('pl-PL')}`;
      if (viewsEl) viewsEl.textContent = `👁️ ${article.view_count || 0} wyświetleń`;
      
      // Tagi
      if (tagsEl && Array.isArray(article.tags)) {
        tagsEl.innerHTML = article.tags.map(tag => 
          `<span class="bg-gray-700 text-gray-300 text-sm px-3 py-1 rounded">#${tag}</span>`
        ).join('');
      }

      // Treść HTML
      if (bodyEl) bodyEl.innerHTML = article.content || '<p class="text-gray-400">Brak treści.</p>';

      // Przyciski admina
      if (adminActions && sessionManager) {
        if (sessionManager.isAdmin()) {
          adminActions.classList.remove('hidden');
          // Ustaw data-attributes dla przycisków
          const editBtn = document.getElementById('kb-edit-article');
          const deleteBtn = document.getElementById('kb-delete-article');
          if (editBtn) {
            editBtn.dataset.articleSlug = article.slug;
            editBtn.dataset.articleId = article.id;
          }
          if (deleteBtn) {
            deleteBtn.dataset.articleId = article.id;
            deleteBtn.dataset.articleTitle = article.title;
          }
        } else {
          adminActions.classList.add('hidden');
        }
      }

      // Inkrementuj licznik wyświetleń (w tle)
      dataService.incrementKnowledgeBaseArticleViews(article.id).catch(err => {
        console.warn('Nie udało się zaktualizować licznika wyświetleń:', err);
      });

    } catch (err) {
      console.error('Błąd ładowania artykułu:', err);
      if (loader) loader.classList.add('hidden');
      if (error) {
        error.textContent = err.message || 'Nie udało się załadować artykułu';
        error.classList.remove('hidden');
      }
    }
  },

  /**
   * Wyświetla edytor artykułu (nowy lub edycja)
   * @param {string|null} slug - Slug artykułu do edycji (null = nowy artykuł)
   */
  async showKnowledgeBaseEditor(slug = null) {
    const listView = document.getElementById('knowledge-base-list');
    const articleView = document.getElementById('knowledge-base-article');
    const editorView = document.getElementById('knowledge-base-editor');
    const editorTitle = document.getElementById('kb-editor-title');

    // Ukryj inne widoki, pokaż edytor
    if (listView) listView.classList.add('hidden');
    if (articleView) articleView.classList.add('hidden');
    if (editorView) editorView.classList.remove('hidden');

    // Zmień tytuł
    if (editorTitle) {
      editorTitle.textContent = slug ? '✏️ Edycja artykułu' : '➕ Nowy artykuł';
    }

    // Jeśli edycja, załaduj dane artykułu
    if (slug) {
      try {
        const dataService = window.dataService;
        const article = await dataService.getKnowledgeBaseArticle(slug);
        
        // Wypełnij formularz
        document.getElementById('kb-editor-input-title').value = article.title || '';
        document.getElementById('kb-editor-input-slug').value = article.slug || '';
        document.getElementById('kb-editor-input-description').value = article.description || '';
        document.getElementById('kb-editor-input-category').value = article.category || '';
        document.getElementById('kb-editor-input-icon').value = article.icon || '';
        document.getElementById('kb-editor-input-tags').value = Array.isArray(article.tags) ? article.tags.join(', ') : '';
        document.getElementById('kb-editor-input-published').checked = article.is_published !== false;
        document.getElementById('kb-editor-input-featured').checked = article.featured === true;

        // Załaduj treść do Quill (jeśli zainicjalizowany)
        const quillEditor = window.knowledgeBaseQuillEditor;
        if (quillEditor && article.content) {
          quillEditor.root.innerHTML = article.content;
        }

        // Zapisz ID artykułu w formularzu (do późniejszego update)
        const form = document.getElementById('kb-editor-form');
        if (form) form.dataset.articleId = article.id;

      } catch (err) {
        console.error('Błąd ładowania artykułu do edycji:', err);
        alert('Nie udało się załadować artykułu do edycji');
        this.showKnowledgeBaseListView();
      }
    } else {
      // Nowy artykuł - wyczyść formularz
      document.getElementById('kb-editor-form').reset();
      document.getElementById('kb-editor-form').removeAttribute('data-article-id');
      
      const quillEditor = window.knowledgeBaseQuillEditor;
      if (quillEditor) {
        quillEditor.root.innerHTML = '';
      }
    }
  },

  /**
   * Usuwa artykuł
   * @param {string} id - ID artykułu
   */
  async deleteKnowledgeBaseArticle(id) {
    try {
      const dataService = window.dataService;
      if (!dataService) throw new Error('dataService nie jest dostępny');

      await dataService.deleteKnowledgeBaseArticle(id);
      
      // Odśwież listę
      this.showKnowledgeBaseListView();
      
      // Pokaż komunikat
      alert('Artykuł został usunięty');

    } catch (err) {
      console.error('Błąd usuwania artykułu:', err);
      alert('Nie udało się usunąć artykułu: ' + err.message);
    }
  },

  /**
   * Pokazuje widok listy artykułów
   */
  showKnowledgeBaseListView() {
    const listView = document.getElementById('knowledge-base-list');
    const articleView = document.getElementById('knowledge-base-article');
    const editorView = document.getElementById('knowledge-base-editor');

    if (listView) listView.classList.remove('hidden');
    if (articleView) articleView.classList.add('hidden');
    if (editorView) editorView.classList.add('hidden');

    // Przeładuj listę artykułów
    const contentManager = window.contentManager;
    const sessionManager = window.sessionManager;
    if (contentManager && contentManager.loadKnowledgeBaseArticles) {
      contentManager.loadKnowledgeBaseArticles(sessionManager);
    }
  }
};

// Eksportuj globalnie
window.uiManager = uiManager;

console.log('✅ UI manager initialized');

})(); // End of IIFE

