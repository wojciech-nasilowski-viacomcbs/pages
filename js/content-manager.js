// ============================================
// CONTENT MANAGER - Import, Delete, Render, Load
// ============================================

(function () {
  'use strict';

  const contentManager = {
    // Zmienne stanu dla importu
    currentImportType: 'quiz', // 'quiz' lub 'workout'
    currentImportTab: 'file', // 'file' lub 'paste'
    selectedFile: null,
    itemToDelete: null,

    // Zmienne stanu dla generatora AI
    selectedAIType: 'quiz', // 'quiz' lub 'workout'

    /**
     * Renderuje karty quizów lub treningów
     */
    renderCards(state, elements, uiManager = null, sessionManager = null) {
      // NAJPIERW sprawdź czy użytkownik jest zalogowany
      if (!state.currentUser) {
        // Buduj dynamicznie listę funkcji na podstawie włączonych modułów
        let featuresList = '';

        if (featureFlags.isQuizzesEnabled()) {
          featuresList +=
            '<div class="flex items-center gap-3 text-lg"><span class="text-green-400">✓</span><span>Interaktywnych quizów</span></div>';
        }

        if (featureFlags.isWorkoutsEnabled()) {
          featuresList +=
            '<div class="flex items-center gap-3 text-lg"><span class="text-green-400">✓</span><span>Treningów fitness</span></div>';
        }

        if (featureFlags.isListeningEnabled()) {
          featuresList +=
            '<div class="flex items-center gap-3 text-lg"><span class="text-green-400">✓</span><span>Nauki języków</span></div>';
        }

        if (featureFlags.isKnowledgeBaseEnabled()) {
          featuresList +=
            '<div class="flex items-center gap-3 text-lg"><span class="text-green-400">✓</span><span>Bazy wiedzy</span></div>';
        }

        // Jeśli żaden moduł nie jest włączony, pokaż komunikat
        if (!featuresList) {
          featuresList =
            '<p class="text-gray-400 text-lg">Brak dostępnych modułów. Skontaktuj się z administratorem.</p>';
        }

        elements.contentCards.innerHTML = `
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
        return;
      }

      // Dla zalogowanych użytkowników - sprawdź czy są włączone moduły
      const coreTabs = featureFlags.getActiveCoreTabs();
      const isMoreTabEnabled = featureFlags.getEnabledTabs().includes('more');

      // Sprawdź, czy jakikolwiek moduł jest włączony (dla zalogowanych)
      if (coreTabs.length === 0 && !isMoreTabEnabled) {
        elements.contentCards.innerHTML = `
        <div class="col-span-full text-center py-16">
          <div class="max-w-2xl mx-auto">
            <h2 class="text-4xl font-bold text-white mb-4">Brak aktywnych modułów</h2>
            <p class="text-xl text-gray-300">
              Administrator nie włączył żadnych funkcjonalności. Skontaktuj się z pomocą techniczną.
            </p>
          </div>
        </div>
      `;
        return;
      }

      // Określ które elementy pokazać na podstawie aktywnej zakładki
      // Tylko quizzes i workouts używają ekranu głównego z kartami
      let items = [];
      if (state.currentTab === 'quizzes') {
        items = state.quizzes;
      } else if (state.currentTab === 'workouts') {
        items = state.workouts;
      } else {
        // Dla innych zakładek (listening, knowledge-base, more) nie renderuj kart
        // Te zakładki mają własne ekrany
        elements.contentCards.innerHTML = '';
        return;
      }

      if (items.length === 0) {
        elements.contentCards.innerHTML = `
        <div class="col-span-full text-center py-12 text-gray-400">
          <p class="text-xl mb-2">Brak dostępnych treści</p>
          <p class="text-sm">Zaimportuj swoje treści lub poczekaj na przykładowe dane</p>
        </div>
      `;
        return;
      }

      elements.contentCards.innerHTML = items
        .map(item => {
          // Dla quizów zawsze 📝, dla treningów użyj emoji z danych lub domyślnie 💪
          const icon = state.currentTab === 'quizzes' ? '📝' : item.emoji || '💪';

          // Badge: Przykład (sample) lub Publiczny (is_public)
          let badge = '';
          if (item.isSample) {
            badge = '<span class="text-xs bg-blue-600 px-2 py-1 rounded">Przykład</span>';
          } else if (item.isPublic) {
            badge = '<span class="text-xs bg-green-600 px-2 py-1 rounded">Publiczny</span>';
          }

          // Przyciski akcji - różne dla adminów i zwykłych użytkowników
          let actionButtons = '';
          if (!item.isSample) {
            const isAdmin = state.currentUser && state.currentUser.role === 'admin';

            // Przycisk toggle public/private (tylko dla adminów)
            const togglePublicBtn = isAdmin
              ? `
          <button class="toggle-public-btn bg-gray-700/90 md:bg-transparent text-gray-300 hover:text-purple-500 active:scale-95 md:hover:scale-110 text-2xl md:text-xl p-2 md:p-0 rounded-lg md:rounded-none min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center"
                  data-id="${item.id}"
                  data-is-public="${item.isPublic || false}"
                  data-title="${item.title.replace(/"/g, '&quot;')}"
                  title="${item.isPublic ? 'Zmień na prywatny' : 'Opublikuj dla wszystkich'}">
            ${item.isPublic ? '🔒' : '🌍'}
          </button>
        `
              : '';

            actionButtons = `
          <div class="absolute top-2 right-2 md:top-3 md:right-3 md:opacity-0 md:group-hover:opacity-100 transition-all duration-200 flex gap-2 z-10">
            ${togglePublicBtn}
            <button class="share-btn bg-gray-700/90 md:bg-transparent text-gray-300 hover:text-blue-500 active:scale-95 md:hover:scale-110 text-2xl md:text-xl p-2 md:p-0 rounded-lg md:rounded-none min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center"
                    data-id="${item.id}"
                    data-title="${item.title.replace(/"/g, '&quot;')}"
                    title="Udostępnij link">
              🔗
            </button>
            <button class="export-btn bg-gray-700/90 md:bg-transparent text-gray-300 hover:text-green-500 active:scale-95 md:hover:scale-110 text-2xl md:text-xl p-2 md:p-0 rounded-lg md:rounded-none min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center"
                    data-id="${item.id}"
                    data-title="${item.title.replace(/"/g, '&quot;')}"
                    title="Eksportuj JSON">
              ⬇
            </button>
            <button class="delete-btn bg-gray-700/90 md:bg-transparent text-gray-300 hover:text-red-500 active:scale-95 md:hover:scale-110 text-2xl md:text-xl p-2 md:p-0 rounded-lg md:rounded-none min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center"
                    data-id="${item.id}"
                    data-title="${item.title.replace(/"/g, '&quot;')}"
                    title="Usuń">
              ×
            </button>
          </div>
        `;
          }

          return `
        <div class="content-card bg-gray-800 p-6 rounded-xl hover:bg-gray-750 transition cursor-pointer group relative"
             data-id="${item.id}">
          ${actionButtons}
          <div class="flex justify-between items-start mb-3">
            <div class="text-4xl">${icon}</div>
            ${badge}
          </div>
          <h3 class="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition">
            ${item.title}
          </h3>
          <p class="text-gray-400 text-sm">${item.description || 'Brak opisu'}</p>
        </div>
      `;
        })
        .join('');

      // Dodaj event listenery do przycisków toggle-public/share/eksportuj/usuń NAJPIERW
      elements.contentCards.querySelectorAll('.toggle-public-btn').forEach(btn => {
        btn.addEventListener('click', async e => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          // Zabezpieczenie przed wielokrotnym kliknięciem
          if (btn.disabled) return false;

          const id = btn.dataset.id;
          const isPublic = btn.dataset.isPublic === 'true';

          // Zablokuj przycisk i pokaż spinner
          btn.disabled = true;
          btn.style.opacity = '0.5';
          btn.innerHTML = '⏳';

          try {
            await this.togglePublicStatus(
              id,
              !isPublic,
              btn.dataset.title,
              state,
              elements,
              uiManager,
              sessionManager
            );
          } finally {
            // Przywróć przycisk (renderCards odświeży UI, ale na wszelki wypadek)
            btn.disabled = false;
            btn.style.opacity = '1';
          }

          return false;
        });
      });

      elements.contentCards.querySelectorAll('.share-btn').forEach(btn => {
        btn.addEventListener('click', async e => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          // Zabezpieczenie przed wielokrotnym kliknięciem
          if (btn.disabled) return false;

          const id = btn.dataset.id;
          const title = btn.dataset.title;

          // Pobierz typ z data-type (dodany przez CardRenderer) lub z currentTab jako fallback
          const type = btn.dataset.type || this._getTypeFromTab(state.currentTab);

          // Zablokuj przycisk na czas operacji
          btn.disabled = true;
          btn.style.opacity = '0.5';

          try {
            await this.copyShareLink(type, id, title);
          } finally {
            // Przywróć przycisk
            btn.disabled = false;
            btn.style.opacity = '1';
          }

          return false;
        });
      });

      elements.contentCards.querySelectorAll('.export-btn').forEach(btn => {
        btn.addEventListener('click', e => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          const id = btn.dataset.id;
          this.exportContent(id, state, elements);
          return false;
        });
      });

      elements.contentCards.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', e => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          const id = btn.dataset.id;
          const title = btn.dataset.title;
          this.confirmDelete(id, title, elements);
          return false;
        });
      });

      // Dodaj event listenery do kart
      elements.contentCards.querySelectorAll('.content-card').forEach(card => {
        card.addEventListener('click', e => {
          // Jeśli kliknięto w przyciski akcji, ignoruj
          if (
            e.target.closest('.toggle-public-btn') ||
            e.target.closest('.share-btn') ||
            e.target.closest('.export-btn') ||
            e.target.closest('.delete-btn')
          ) {
            return;
          }

          const id = card.dataset.id;
          if (state.currentTab === 'quizzes') {
            this.loadAndStartQuiz(id, state, elements, sessionManager, uiManager);
          } else {
            this.loadAndStartWorkout(id, state, elements, uiManager, sessionManager);
          }
        });
      });
    },

    /**
     * Wczytuje dane z Supabase (quizy i treningi)
     */
    async loadData(state, elements, uiManager) {
      // Jeśli użytkownik nie jest zalogowany, wyczyść dane
      if (!state.currentUser) {
        state.quizzes = [];
        state.workouts = [];
        elements.loader.classList.add('hidden'); // Ukryj loader dla gości
        console.log('👤 Gość - brak danych do wyświetlenia');
        return;
      }

      try {
        elements.loader.classList.remove('hidden');
        elements.errorMessage.classList.add('hidden');

        // Wczytaj quizy i treningi równolegle
        const [quizzes, workouts] = await Promise.all([
          dataService.fetchQuizzes(false),
          dataService.fetchWorkouts(false)
        ]);

        // Przekształć dane do formatu używanego przez UI
        state.quizzes = quizzes.map(quiz => ({
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          isSample: quiz.is_sample,
          isPublic: quiz.is_public || false,
          userId: quiz.user_id,
          questionCount: 0
        }));

        state.workouts = workouts.map(workout => ({
          id: workout.id,
          title: workout.title,
          description: workout.description,
          emoji: workout.emoji, // Dodaj emoji z danych
          isSample: workout.is_sample,
          isPublic: workout.is_public || false,
          userId: workout.user_id,
          exerciseCount: 0
        }));

        console.log('✅ Dane wczytane z Supabase');
        console.log('📝 Quizy:', state.quizzes.length);
        console.log('💪 Treningi:', state.workouts.length);
      } catch (error) {
        console.error('❌ Błąd wczytywania danych:', error);
        uiManager.showError(
          'Nie udało się wczytać treści. Sprawdź połączenie i odśwież stronę.',
          elements
        );
      } finally {
        elements.loader.classList.add('hidden');
      }
    },

    /**
     * Wczytuje i rozpoczyna quiz
     */
    async loadAndStartQuiz(
      quizId,
      state,
      elements,
      sessionManager,
      uiManager,
      skipSessionCheck = false,
      quizOptions = {}
    ) {
      // Sprawdź czy jest zapisana sesja
      if (!skipSessionCheck && sessionManager) {
        const session = sessionManager.checkForSession(quizId, 'quiz');
        if (session) {
          sessionManager.showContinueDialog(session, elements);
          return;
        }
      }

      try {
        uiManager.showScreen('loading', state, elements, this, sessionManager);
        const quizData = await dataService.fetchQuizById(quizId);

        if (window.startQuiz && typeof window.startQuiz === 'function') {
          // Przekaż opcje do quiz-engine (np. continueFromSaved)
          window.startQuiz(quizData, quizId, quizOptions.mistakesOnly || false, quizOptions);
        }
        uiManager.showScreen('quiz', state, elements, this, sessionManager);
      } catch (error) {
        console.error('Błąd wczytywania quizu:', error);
        uiManager.showError('Nie udało się wczytać quizu. Spróbuj ponownie.', elements);
        uiManager.showScreen('main', state, elements, this, sessionManager);
      }
    },

    /**
     * Wczytuje i rozpoczyna trening
     */
    async loadAndStartWorkout(workoutId, state, elements, uiManager, sessionManager) {
      try {
        uiManager.showScreen('loading', state, elements, this, sessionManager);
        const workoutData = await dataService.fetchWorkoutById(workoutId);

        if (window.startWorkout && typeof window.startWorkout === 'function') {
          window.startWorkout(workoutData, workoutId);
        }
        uiManager.showScreen('workout', state, elements, this, sessionManager);
      } catch (error) {
        console.error('Błąd wczytywania treningu:', error);
        uiManager.showError('Nie udało się wczytać treningu. Spróbuj ponownie.', elements);
        uiManager.showScreen('main', state, elements, this, sessionManager);
      }
    },

    /**
     * Eksportuje treść do pliku JSON
     */
    async exportContent(id, state, _elements) {
      try {
        let data, filename;
        const type = this._getTypeFromTab(state.currentTab);

        // Pobierz pełne dane z Supabase
        if (type === 'quiz') {
          data = await dataService.fetchQuizById(id);
          filename = `quiz-${this.sanitizeFilename(data.title)}.json`;
        } else if (type === 'workout') {
          data = await dataService.fetchWorkoutById(id);
          filename = `workout-${this.sanitizeFilename(data.title)}.json`;
        } else if (type === 'listening') {
          data = await dataService.getListeningSet(id);
          filename = `listening-${this.sanitizeFilename(data.title)}.json`;
        }

        // Usuń metadane Supabase (id, user_id, created_at, is_sample)
        const cleanData = {
          title: data.title,
          description: data.description
        };

        if (type === 'quiz') {
          cleanData.questions = data.questions;
        } else if (type === 'workout') {
          // Dla treningów: dodaj emoji (lub domyślną 💪 jeśli brak)
          cleanData.emoji = data.emoji || '💪';
          cleanData.phases = data.phases;
        } else if (type === 'listening') {
          // Dla listening: dodaj emoji i content
          cleanData.emoji = data.emoji || '🎧';
          cleanData.content = data.content;
        }

        // Konwertuj do JSON
        const jsonString = JSON.stringify(cleanData, null, 2);

        // Utwórz blob i pobierz plik
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('✅ Wyeksportowano:', filename);
      } catch (error) {
        console.error('Błąd eksportu:', error);
        window.alert('Błąd podczas eksportu: ' + error.message);
      }
    },

    /**
     * Sanityzuje nazwę pliku (usuwa niebezpieczne znaki)
     */
    sanitizeFilename(filename) {
      return filename
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 50);
    },

    // ============================================
    // IMPORT JSON
    // ============================================

    /**
     * Otwórz modal importu
     */
    openImportModal(state, _elements) {
      const elements = _elements;
      // Sprawdź, które moduły są włączone
      const quizzesEnabled = featureFlags.isQuizzesEnabled();
      const workoutsEnabled = featureFlags.isWorkoutsEnabled();
      const listeningEnabled = featureFlags.isListeningEnabled();

      // Pokaż/ukryj przyciski wyboru typu na podstawie feature flags
      if (elements.importTypeQuiz) {
        elements.importTypeQuiz.style.display = quizzesEnabled ? 'block' : 'none';
      }
      if (elements.importTypeWorkout) {
        elements.importTypeWorkout.style.display = workoutsEnabled ? 'block' : 'none';
      }
      if (elements.importTypeListening) {
        elements.importTypeListening.style.display = listeningEnabled ? 'block' : 'none';
      }

      // Określ domyślny typ importu na podstawie aktualnej zakładki lub pierwszego dostępnego modułu
      let defaultType = null;
      if (state.currentTab === 'quizzes' && quizzesEnabled) {
        defaultType = 'quiz';
      } else if (state.currentTab === 'workouts' && workoutsEnabled) {
        defaultType = 'workout';
      } else if (state.currentTab === 'listening' && listeningEnabled) {
        defaultType = 'listening';
      } else {
        // Wybierz pierwszy dostępny moduł
        if (quizzesEnabled) defaultType = 'quiz';
        else if (workoutsEnabled) defaultType = 'workout';
        else if (listeningEnabled) defaultType = 'listening';
      }

      this.currentImportType = defaultType || 'quiz';
      this.currentImportTab = 'file';
      this.selectedFile = null;

      // Ustaw tytuł
      elements.importTitle.textContent = 'Dodaj Zawartość';

      // Resetuj formularz
      elements.fileInput.value = '';
      elements.jsonInput.value = '';
      elements.fileName.classList.add('hidden');
      elements.importError.classList.add('hidden');
      elements.importSuccess.classList.add('hidden');

      // Pokaż/ukryj opcję "Udostępnij publicznie" (tylko dla adminów)
      const isAdmin = state.currentUser && state.currentUser.role === 'admin';
      if (isAdmin && elements.importPublicOption) {
        elements.importPublicOption.classList.remove('hidden');
        elements.importMakePublic.checked = false; // Domyślnie odznaczone
      } else if (elements.importPublicOption) {
        elements.importPublicOption.classList.add('hidden');
      }

      // Pokaż panel pliku
      elements.importFilePanel.classList.remove('hidden');
      elements.importPastePanel.classList.add('hidden');

      // Ustaw aktywną zakładkę
      elements.importTabFile.classList.add('bg-blue-600', 'text-white');
      elements.importTabFile.classList.remove('bg-gray-700', 'text-gray-300');
      elements.importTabPaste.classList.add('bg-gray-700', 'text-gray-300');
      elements.importTabPaste.classList.remove('bg-blue-600', 'text-white');

      // Ustaw aktywny typ importu wizualnie
      this.switchImportType(this.currentImportType, elements);

      // Pokaż modal
      elements.importModal.classList.remove('hidden');
    },

    /**
     * Zamknij modal importu
     */
    closeImportModal(elements) {
      elements.importModal.classList.add('hidden');
    },

    /**
     * Przełącz typ importu (quiz/workout/listening)
     */
    switchImportType(type, elements) {
      this.currentImportType = type;

      // Usuń aktywny styl ze wszystkich przycisków
      const allButtons = elements.importModal.querySelectorAll('.import-type-btn');
      allButtons.forEach(btn => {
        btn.classList.remove('bg-blue-600', 'border-blue-600', 'text-white');
        btn.classList.add('border-gray-600', 'text-gray-300');
      });

      // Dodaj aktywny styl do wybranego przycisku
      let activeButton;
      if (type === 'quiz') {
        activeButton = elements.importTypeQuiz;
      } else if (type === 'workout') {
        activeButton = elements.importTypeWorkout;
      } else if (type === 'listening') {
        activeButton = elements.importTypeListening;
      }

      if (activeButton) {
        activeButton.classList.add('bg-blue-600', 'border-blue-600', 'text-white');
        activeButton.classList.remove('border-gray-600', 'text-gray-300');
      }
    },

    /**
     * Przełącz zakładkę importu
     */
    switchImportTab(tab, elements) {
      this.currentImportTab = tab;

      if (tab === 'file') {
        elements.importFilePanel.classList.remove('hidden');
        elements.importPastePanel.classList.add('hidden');
        elements.importTabFile.classList.add('bg-blue-600', 'text-white');
        elements.importTabFile.classList.remove('bg-gray-700', 'text-gray-300');
        elements.importTabPaste.classList.add('bg-gray-700', 'text-gray-300');
        elements.importTabPaste.classList.remove('bg-blue-600', 'text-white');
      } else {
        elements.importFilePanel.classList.add('hidden');
        elements.importPastePanel.classList.remove('hidden');
        elements.importTabFile.classList.add('bg-gray-700', 'text-gray-300');
        elements.importTabFile.classList.remove('bg-blue-600', 'text-white');
        elements.importTabPaste.classList.add('bg-blue-600', 'text-white');
        elements.importTabPaste.classList.remove('bg-gray-700', 'text-gray-300');
      }
    },

    /**
     * Obsługa wyboru pliku
     */
    handleFileSelect(e, elements) {
      const file = e.target.files[0];
      if (file) {
        this.selectedFile = file;
        elements.fileNameText.textContent = file.name;
        elements.fileName.classList.remove('hidden');
      }
    },

    /**
     * Obsługa drag & drop
     */
    handleDragOver(e, elements) {
      e.preventDefault();
      e.stopPropagation();
      elements.dropZone.classList.add('border-blue-500');
    },

    handleDragLeave(e, elements) {
      e.preventDefault();
      e.stopPropagation();
      elements.dropZone.classList.remove('border-blue-500');
    },

    handleDrop(e, elements) {
      e.preventDefault();
      e.stopPropagation();
      elements.dropZone.classList.remove('border-blue-500');

      const file = e.dataTransfer.files[0];
      if (file && file.type === 'application/json') {
        this.selectedFile = file;
        elements.fileNameText.textContent = file.name;
        elements.fileName.classList.remove('hidden');
        elements.fileInput.files = e.dataTransfer.files;
      } else {
        this.showImportError('Proszę wybrać plik JSON', elements);
      }
    },

    showImportError(message, elements) {
      elements.importError.textContent = message;
      elements.importError.classList.remove('hidden');
      elements.importSuccess.classList.add('hidden');
    },

    showImportSuccess(message, elements) {
      elements.importSuccess.textContent = message;
      elements.importSuccess.classList.remove('hidden');
      elements.importError.classList.add('hidden');
    },

    /**
     * Obsługa importu
     */
    async handleImport(state, elements, uiManager) {
      elements.importError.classList.add('hidden');
      elements.importSuccess.classList.add('hidden');

      const importService = window.importService;
      if (!importService) {
        this.showImportError('Błąd: Serwis importu jest niedostępny.', elements);
        return;
      }

      let data;
      const isPublic = elements.importMakePublic && elements.importMakePublic.checked;
      const type = this.currentImportType;

      try {
        if (this.currentImportTab === 'file') {
          if (!this.selectedFile) {
            this.showImportError('Wybierz plik JSON', elements);
            return;
          }
          data = await importService.importFromFile(this.selectedFile, type, isPublic);
        } else {
          const text = elements.jsonInput.value.trim();
          if (!text) {
            this.showImportError('Wklej JSON', elements);
            return;
          }
          data = await importService.importFromJSON(text, type, isPublic);
        }

        this.showImportSuccess('✅ Zaimportowano pomyślnie! Uruchamiam...', elements);

        // Odśwież dane
        await this.loadData(state, elements, uiManager);
        this.renderCards(state, elements, uiManager, window.sessionManager);

        // Zamknij modal i przekieruj
        this.closeImportModal(elements);

        if (data && data.id) {
          if (type === 'quiz') {
            await this.loadAndStartQuiz(
              data.id,
              state,
              elements,
              window.sessionManager,
              uiManager,
              true // skipSessionCheck
            );
          } else if (type === 'workout') {
            await this.loadAndStartWorkout(
              data.id,
              state,
              elements,
              uiManager,
              window.sessionManager
            );
          } else if (type === 'listening') {
            if (
              window.listeningEngine &&
              typeof window.listeningEngine.loadAndStartListening === 'function'
            ) {
              await window.listeningEngine.loadAndStartListening(data.id);
            }
          }
        }
      } catch (error) {
        this.showImportError(error.message, elements);
        console.error('Błąd importu:', error);
      }
    },

    /**
     * Konwertuje stary format JSON (v1) na nowy (v2)
     */
    convertLegacyFormat(data, type) {
      if (type === 'quiz') {
        if (data.questions) {
          data.questions = data.questions.map(q => {
            const converted = { ...q };

            if (q.questionText && !q.question) {
              converted.question = q.questionText;
              delete converted.questionText;
            }

            if (q.type === 'fill-in-the-blank') {
              converted.type = 'fill-in-blank';
            }

            if (
              q.type === 'true-false' &&
              q.isCorrect !== undefined &&
              q.correctAnswer === undefined
            ) {
              converted.correctAnswer = q.isCorrect;
              delete converted.isCorrect;
            }

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

      return data;
    },

    /**
     * Walidacja JSON quizu
     */
    validateQuizJSON(data) {
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
    },

    /**
     * Walidacja JSON treningu
     */
    validateWorkoutJSON(data) {
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
    },

    /**
     * Walidacja JSON zestawu Listening
     */
    validateListeningJSON(data) {
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
          errors.push('Brak par językowych (tylko nagłówki)');
          return errors;
        }

        const expectedKeys = Object.keys(firstNonHeaderPair);

        if (expectedKeys.length !== 2) {
          errors.push(
            `Każda para powinna mieć dokładnie 2 języki, znaleziono: ${expectedKeys.length}`
          );
        }

        // Waliduj każdą parę
        data.content.forEach((pair, idx) => {
          const keys = Object.keys(pair);

          if (keys.length !== 2) {
            errors.push(`Para ${idx + 1}: nieprawidłowa liczba kluczy (${keys.length})`);
          }

          // Sprawdź czy klucze są zgodne z oczekiwanymi
          expectedKeys.forEach(key => {
            if (!Object.hasOwn(pair, key)) {
              errors.push(`Para ${idx + 1}: brak klucza "${key}"`);
            }

            if (typeof pair[key] !== 'string') {
              errors.push(`Para ${idx + 1}: wartość dla "${key}" nie jest stringiem`);
            }
          });
        });
      }

      return errors;
    },

    // ============================================
    // USUWANIE TREŚCI
    // ============================================

    /**
     * Pokaż modal potwierdzenia usunięcia
     */
    confirmDelete(id, title, elements) {
      this.itemToDelete = id;

      // Sprawdź czy elementy istnieją
      if (!elements || !elements.deleteItemTitle || !elements.deleteModal) {
        // Fallback: użyj window.confirm
        const confirmed = window.confirm(`Czy na pewno chcesz usunąć "${title}"?`);
        if (confirmed) {
          // Wywołaj handleDelete bezpośrednio
          const state = window.getAppState ? window.getAppState() : {};
          const uiManager = window.uiManager;
          this.handleDelete(state, elements || {}, uiManager);
        }
        return;
      }

      elements.deleteItemTitle.textContent = title;
      elements.deleteModal.classList.remove('hidden');
    },

    /**
     * Zamknij modal usuwania
     */
    closeDeleteModal(elements) {
      this.itemToDelete = null;
      if (elements && elements.deleteModal) {
        elements.deleteModal.classList.add('hidden');
      }
    },

    /**
     * Usuń element
     */
    async handleDelete(state, elements, uiManager) {
      if (!this.itemToDelete) return;

      try {
        const type = this._getTypeFromTab(state.currentTab);

        if (type === 'quiz') {
          await dataService.deleteQuiz(this.itemToDelete);
        } else if (type === 'workout') {
          await dataService.deleteWorkout(this.itemToDelete);
        } else if (type === 'listening') {
          await dataService.deleteListeningSet(this.itemToDelete);
        }

        // Odśwież dane
        if (type === 'listening') {
          // Dla listening - odśwież listę przez engine
          if (window.listeningEngine && window.listeningEngine.showListeningList) {
            window.listeningEngine.showListeningList();
          }
        } else {
          // Dla quiz i workout - odśwież przez content manager
          await this.loadData(state, elements, uiManager);
          this.renderCards(state, elements, uiManager, window.sessionManager);
        }

        // Zamknij modal (jeśli istnieje)
        if (elements && elements.deleteModal) {
          this.closeDeleteModal(elements);
        }

        // Pokaż powiadomienie sukcesu
        if (window.uiManager && window.uiManager.showNotification) {
          window.uiManager.showNotification('Usunięto pomyślnie', '✅', 'success');
        }
      } catch (error) {
        console.error('Błąd podczas usuwania:', error);
        window.alert('Błąd podczas usuwania: ' + error.message);
      }
    },

    // ============================================
    // GENERATOR AI
    // ============================================

    /**
     * Otwórz modal generatora AI
     */
    openAIGeneratorModal(state, elements) {
      // Domyślnie wybierz typ na podstawie aktualnej zakładki
      if (state.currentTab === 'quizzes') {
        this.selectedAIType = 'quiz';
      } else if (state.currentTab === 'workouts') {
        this.selectedAIType = 'workout';
      } else if (state.currentTab === 'listening') {
        this.selectedAIType = 'listening';
      } else {
        // Fallback - wybierz pierwszy dostępny typ
        if (window.featureFlags.isQuizzesEnabled()) {
          this.selectedAIType = 'quiz';
        } else if (window.featureFlags.isWorkoutsEnabled()) {
          this.selectedAIType = 'workout';
        } else if (window.featureFlags.isListeningEnabled()) {
          this.selectedAIType = 'listening';
        }
      }

      // Ukryj przyciski typów które są wyłączone przez feature flags
      if (!window.featureFlags.isQuizzesEnabled()) {
        elements.aiTypeQuiz.classList.add('hidden');
      } else {
        elements.aiTypeQuiz.classList.remove('hidden');
      }

      if (!window.featureFlags.isWorkoutsEnabled()) {
        elements.aiTypeWorkout.classList.add('hidden');
      } else {
        elements.aiTypeWorkout.classList.remove('hidden');
      }

      if (!window.featureFlags.isListeningEnabled()) {
        elements.aiTypeListening.classList.add('hidden');
      } else {
        elements.aiTypeListening.classList.remove('hidden');
      }

      // Resetuj formularz
      elements.aiPrompt.value = '';
      elements.aiLang1.value = '';
      elements.aiLang2.value = '';
      elements.aiError.classList.add('hidden');
      elements.aiSuccess.classList.add('hidden');
      elements.aiLoading.classList.add('hidden');

      // Pokaż/ukryj opcję "Udostępnij publicznie" (tylko dla adminów)
      const isAdmin = state.currentUser && state.currentUser.role === 'admin';
      if (isAdmin && elements.aiPublicOption) {
        elements.aiPublicOption.classList.remove('hidden');
        elements.aiMakePublic.checked = false; // Domyślnie odznaczone
      } else if (elements.aiPublicOption) {
        elements.aiPublicOption.classList.add('hidden');
      }

      // Ustaw aktywny przycisk typu
      this.updateAITypeButtons(elements);

      // Pokaż modal
      elements.aiGeneratorModal.classList.remove('hidden');
    },

    /**
     * Aktualizuj przyciski wyboru typu AI
     */
    updateAITypeButtons(elements) {
      const quizBtn = elements.aiTypeQuiz;
      const workoutBtn = elements.aiTypeWorkout;
      const listeningBtn = elements.aiTypeListening;
      const hintQuiz = elements.aiHintQuiz;
      const hintWorkout = elements.aiHintWorkout;
      const hintListening = elements.aiHintListening;
      const languageSelection = elements.aiLanguageSelection;
      const promptInput = elements.aiPrompt;

      // Reset wszystkich przycisków
      [quizBtn, workoutBtn, listeningBtn].forEach(btn => {
        btn.classList.add('border-gray-600', 'text-gray-300');
        btn.classList.remove(
          'bg-blue-600',
          'border-blue-600',
          'bg-green-600',
          'border-green-600',
          'bg-purple-600',
          'border-purple-600',
          'text-white'
        );
      });

      // Ukryj wszystkie hinty i sekcję języków
      hintQuiz.classList.add('hidden');
      hintWorkout.classList.add('hidden');
      hintListening.classList.add('hidden');
      languageSelection.classList.add('hidden');

      // Aktywuj wybrany typ
      if (this.selectedAIType === 'quiz') {
        quizBtn.classList.add('bg-blue-600', 'border-blue-600', 'text-white');
        quizBtn.classList.remove('border-gray-600', 'text-gray-300');
        hintQuiz.classList.remove('hidden');
        promptInput.placeholder =
          'Przykład: Quiz o angielskim dla początkujących, 10 pytań: 5 multiple-choice, 3 listening (en-US), 2 fill-in-blank';
      } else if (this.selectedAIType === 'workout') {
        workoutBtn.classList.add('bg-green-600', 'border-green-600', 'text-white');
        workoutBtn.classList.remove('border-gray-600', 'text-gray-300');
        hintWorkout.classList.remove('hidden');
        promptInput.placeholder =
          'Przykład: Trening FBW dla początkujących, 30 minut, bez sprzętu, 3 fazy';
      } else if (this.selectedAIType === 'listening') {
        listeningBtn.classList.add('bg-purple-600', 'border-purple-600', 'text-white');
        listeningBtn.classList.remove('border-gray-600', 'text-gray-300');
        hintListening.classList.remove('hidden');
        languageSelection.classList.remove('hidden');
        promptInput.placeholder =
          'Przykład: Podstawowe czasowniki w hiszpańskim, 20 par z przykładami użycia';
      }
    },

    /**
     * Zamknij modal generatora AI
     */
    closeAIGeneratorModal(elements) {
      elements.aiGeneratorModal.classList.add('hidden');
    },

    /**
     * Obsługa generowania przez AI
     */
    async handleAIGenerate(state, elements, uiManager) {
      // Pobierz dane z formularza
      const prompt = elements.aiPrompt.value.trim();
      const contentType = this.selectedAIType; // Użyj wybranego typu zamiast currentTab

      // Walidacja
      if (!prompt) {
        this.showAIError('Opisz co chcesz wygenerować', elements);
        return;
      }

      // Dodatkowa walidacja dla Listening - sprawdź języki
      if (contentType === 'listening') {
        const lang1 = elements.aiLang1.value;
        const lang2 = elements.aiLang2.value;

        if (!lang1 || !lang2) {
          this.showAIError('Wybierz oba języki', elements);
          return;
        }

        if (lang1 === lang2) {
          this.showAIError('Języki muszą być różne', elements);
          return;
        }
      }

      // Pokaż loading
      elements.aiError.classList.add('hidden');
      elements.aiSuccess.classList.add('hidden');
      elements.aiLoading.classList.remove('hidden');
      elements.aiGenerate.disabled = true;

      try {
        // Wywołaj AI API (przez Vercel Function lub bezpośrednio)
        // Numeracja będzie dodana automatycznie podczas zapisu do bazy
        const generatedData = await this.callAIAPI(prompt, contentType, elements);

        // Waliduj wygenerowane dane
        let errors = [];
        if (contentType === 'quiz') {
          errors = this.validateQuizJSON(generatedData);
        } else if (contentType === 'workout') {
          errors = this.validateWorkoutJSON(generatedData);
        } else if (contentType === 'listening') {
          errors = this.validateListeningJSON(generatedData);
        }

        if (errors.length > 0) {
          throw new Error('Wygenerowane dane są nieprawidłowe: ' + errors.join(', '));
        }

        // Pobierz wartość checkboxa "Udostępnij publicznie"
        const isPublic = elements.aiMakePublic && elements.aiMakePublic.checked;

        // Zapisz do Supabase i pobierz ID nowo utworzonej treści
        let savedItem;
        if (contentType === 'quiz') {
          savedItem = await dataService.saveQuiz(generatedData, isPublic);
        } else if (contentType === 'workout') {
          savedItem = await dataService.saveWorkout(generatedData, isPublic);
        } else if (contentType === 'listening') {
          savedItem = await dataService.createListeningSet(
            generatedData.title,
            generatedData.description,
            generatedData.lang1_code,
            generatedData.lang2_code,
            generatedData.content,
            isPublic
          );
        }

        this.showAISuccess('✅ Treść wygenerowana! Uruchamiam...', elements);

        // Odśwież dane
        await this.loadData(state, elements, uiManager);
        this.renderCards(state, elements, uiManager, window.sessionManager);

        // Zamknij modal
        this.closeAIGeneratorModal(elements);

        // Przekieruj użytkownika do nowo utworzonej treści
        if (savedItem && savedItem.id) {
          if (contentType === 'quiz') {
            await this.loadAndStartQuiz(
              savedItem.id,
              state,
              elements,
              window.sessionManager,
              uiManager,
              true
            );
          } else if (contentType === 'workout') {
            await this.loadAndStartWorkout(
              savedItem.id,
              state,
              elements,
              uiManager,
              window.sessionManager
            );
          } else if (contentType === 'listening') {
            // Dla listening przekieruj do ekranu listening z tym zestawem
            if (
              window.listeningEngine &&
              typeof window.listeningEngine.loadAndStartListening === 'function'
            ) {
              await window.listeningEngine.loadAndStartListening(savedItem.id);
            }
          }
        }
      } catch (error) {
        console.error('Błąd generowania AI:', error);
        this.showAIError('Błąd: ' + error.message, elements);
      } finally {
        elements.aiLoading.classList.add('hidden');
        elements.aiGenerate.disabled = false;
      }
    },

    /**
     * Wywołaj AI API (Vercel Function lub bezpośrednio OpenRouter)
     */
    async callAIAPI(userPrompt, contentType, elements) {
      // Pobierz szablon promptu z AI_PROMPTS
      let promptTemplate;
      if (contentType === 'quiz') {
        promptTemplate = window.AI_PROMPTS.quiz;
      } else if (contentType === 'workout') {
        promptTemplate = window.AI_PROMPTS.workout;
      } else if (contentType === 'listening') {
        promptTemplate = window.AI_PROMPTS.listening;
      }

      // Zastąp {USER_PROMPT} rzeczywistym promptem użytkownika
      let systemPrompt = promptTemplate.replace('{USER_PROMPT}', userPrompt);

      // Dla Listening: zastąp również kody języków
      if (contentType === 'listening') {
        const lang1Code = elements.aiLang1.value; // np. "pl-PL"
        const lang2Code = elements.aiLang2.value; // np. "es-ES"
        const lang1Key = lang1Code.split('-')[0].toLowerCase(); // "pl"
        const lang2Key = lang2Code.split('-')[0].toLowerCase(); // "es"

        systemPrompt = systemPrompt
          .replace(/{LANG1_CODE}/g, lang1Code)
          .replace(/{LANG2_CODE}/g, lang2Code)
          .replace(/{LANG1_KEY}/g, lang1Key)
          .replace(/{LANG2_KEY}/g, lang2Key);
      }

      // Sprawdź czy jesteśmy na produkcji (Vercel) czy lokalnie
      const hostname = window.location.hostname;
      const protocol = window.location.protocol;

      // Jeśli używamy file:// lub nie mamy hostname, zawsze używaj OpenRouter bezpośrednio
      const isFileProtocol = protocol === 'file:' || hostname === '';

      // Sprawdź czy jesteśmy na Vercel (produkcja)
      const isVercel = hostname.includes('vercel.app') || hostname.includes('vercel.com');

      // Dla innych domen sprawdź czy to nie localhost
      const isLocalhost =
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.includes('192.168') ||
        hostname.includes('.local');

      // Używaj Vercel Function tylko jeśli jesteśmy na Vercel
      const useVercelFunction = isVercel && !isLocalhost && !isFileProtocol;

      console.log(`🤖 Generowanie ${contentType} przez AI...`);
      console.log(`📍 Hostname: ${hostname || 'file://'}`);
      console.log(`📍 Protocol: ${protocol}`);
      console.log(
        `📍 Środowisko: ${useVercelFunction ? 'Produkcja (Vercel Function)' : 'Lokalne (OpenRouter Direct)'}`
      );

      let content;

      if (useVercelFunction) {
        // PRODUKCJA: Użyj Vercel Serverless Function
        const response = await fetch('/api/ai-generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            systemPrompt,
            userPrompt,
            contentType
          })
        });

        if (!response.ok) {
          let errorMessage = 'Błąd podczas generowania AI';
          try {
            const error = await response.json();
            errorMessage = error.error || errorMessage;
          } catch (e) {
            // Jeśli nie można sparsować jako JSON, użyj tekstu
            const text = await response.text();
            errorMessage = `Błąd ${response.status}: ${text.substring(0, 200)}`;
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        content = data.content;

        if (!content) {
          throw new Error('Brak odpowiedzi od serwera. Spróbuj ponownie.');
        }
      } else {
        // LOKALNIE: Użyj bezpośrednio OpenRouter API
        const apiKey = window.APP_CONFIG?.OPENROUTER_API_KEY;

        if (!apiKey || apiKey === 'YOUR_OPENROUTER_API_KEY') {
          throw new Error('Brak klucza OpenRouter API. Skonfiguruj OPENROUTER_API_KEY w config.js');
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
            'HTTP-Referer': window.location.origin,
            'X-Title': 'eTrener - AI Generator'
          },
          body: JSON.stringify({
            // Available OpenRouter models (2025):
            // - anthropic/claude-sonnet-4.5: Najlepsza jakość, najnowszy model (zalecane)
            // - anthropic/claude-3.5-sonnet: Stabilny, świetny stosunek ceny do jakości
            // - anthropic/claude-3-opus: Najwyższa jakość dla złożonych zadań (droższy)
            model: 'anthropic/claude-sonnet-4.5',
            messages: [{ role: 'user', content: systemPrompt }],
            temperature: 0.7,
            max_tokens: 4000
          })
        });

        if (!response.ok) {
          let errorMessage = 'Błąd API OpenRouter';
          try {
            const error = await response.json();
            errorMessage = error.error?.message || errorMessage;
          } catch (e) {
            // Jeśli nie można sparsować jako JSON, użyj tekstu
            const text = await response.text();
            errorMessage = `Błąd ${response.status}: ${text.substring(0, 200)}`;
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        content = data.choices?.[0]?.message?.content;

        if (!content) {
          throw new Error('Brak odpowiedzi od AI. Sprawdź klucz API i spróbuj ponownie.');
        }
      }

      // Parsuj JSON z odpowiedzi (usuń markdown jeśli jest)
      let jsonString = content.trim();

      // Sprawdź czy odpowiedź nie jest HTML-em (błąd)
      if (jsonString.startsWith('<!DOCTYPE') || jsonString.startsWith('<html')) {
        throw new Error(
          'AI zwróciło nieprawidłową odpowiedź (HTML). Sprawdź klucz API i spróbuj ponownie.'
        );
      }

      // Usuń markdown
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/```\n?/g, '');
      }

      // Spróbuj sparsować JSON
      try {
        return JSON.parse(jsonString);
      } catch (parseError) {
        console.error('Błąd parsowania JSON:', parseError);
        console.error('Otrzymana odpowiedź:', jsonString.substring(0, 500));
        throw new Error('AI zwróciło nieprawidłowy format JSON. Spróbuj ponownie lub zmień opis.');
      }
    },

    showAIError(message, elements) {
      elements.aiError.textContent = message;
      elements.aiError.classList.remove('hidden');
      elements.aiSuccess.classList.add('hidden');
    },

    showAISuccess(message, elements) {
      elements.aiSuccess.textContent = message;
      elements.aiSuccess.classList.remove('hidden');
      elements.aiError.classList.add('hidden');
    },

    // ============================================
    // BAZA WIEDZY
    // ============================================

    /**
     * Ładuje artykuły Bazy Wiedzy
     * @param {Object} sessionManager - Manager sesji (sprawdzenie roli admina)
     */
    async loadKnowledgeBaseArticles(sessionManager) {
      const loader = document.getElementById('kb-list-loader');
      const error = document.getElementById('kb-list-error');
      const container = document.getElementById('kb-articles-container');
      const emptyState = document.getElementById('kb-empty-state');

      // Pokaż loader
      if (loader) loader.classList.remove('hidden');
      if (error) error.classList.add('hidden');
      if (container) container.classList.add('hidden');
      if (emptyState) emptyState.classList.add('hidden');

      try {
        const dataService = window.dataService;
        if (!dataService) throw new Error('dataService nie jest dostępny');

        // Pobierz filtry z UI
        const searchQuery = document.getElementById('kb-search')?.value || '';
        const category = document.getElementById('kb-category-filter')?.value || '';
        const sortBy = document.getElementById('kb-sort-filter')?.value || 'newest';
        const featuredOnly = document.getElementById('kb-featured-filter')?.checked || false;

        // Przygotuj filtry
        const filters = {
          is_published: true, // Zawsze pokazuj tylko opublikowane (chyba że admin)
          limit: 50
        };

        // Jeśli admin, pokaż wszystkie artykuły (w tym nieopublikowane)
        if (sessionManager && sessionManager.isAdmin()) {
          delete filters.is_published;
        }

        // Dodaj filtry z UI
        if (category) filters.category = category;
        if (featuredOnly) filters.featured = true;

        // Sortowanie
        switch (sortBy) {
          case 'newest':
            filters.order_by = 'created_at';
            filters.order_direction = 'desc';
            break;
          case 'oldest':
            filters.order_by = 'created_at';
            filters.order_direction = 'asc';
            break;
          case 'popular':
            filters.order_by = 'view_count';
            filters.order_direction = 'desc';
            break;
          case 'title':
            filters.order_by = 'title';
            filters.order_direction = 'asc';
            break;
        }

        // Pobierz artykuły
        let articles;
        if (searchQuery.trim()) {
          // Wyszukiwanie full-text
          articles = await dataService.searchKnowledgeBaseArticles(searchQuery, filters.limit);
          // Zastosuj dodatkowe filtry po stronie klienta
          if (category) {
            articles = articles.filter(a => a.category === category);
          }
          if (featuredOnly) {
            articles = articles.filter(a => a.featured === true);
          }
          if (!filters.is_published && sessionManager && !sessionManager.isAdmin()) {
            articles = articles.filter(a => a.is_published === true);
          }
        } else {
          // Zwykłe pobieranie z filtrami
          articles = await dataService.getKnowledgeBaseArticles(filters);
        }

        // Ukryj loader
        if (loader) loader.classList.add('hidden');

        // Wyświetl artykuły
        const uiManager = window.uiManager;
        if (uiManager && uiManager.showKnowledgeBaseList) {
          uiManager.showKnowledgeBaseList(articles, sessionManager);
        }
      } catch (err) {
        console.error('Błąd ładowania artykułów:', err);
        if (loader) loader.classList.add('hidden');
        if (error) {
          error.textContent = err.message || 'Nie udało się załadować artykułów';
          error.classList.remove('hidden');
        }
      }
    },

    /**
     * Inicjalizuje event listenery dla Bazy Wiedzy
     * @param {Object} sessionManager - Manager sesji
     */
    initKnowledgeBaseListeners(sessionManager) {
      // Wyszukiwarka
      const searchInput = document.getElementById('kb-search');
      if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', () => {
          clearTimeout(searchTimeout);
          searchTimeout = setTimeout(() => {
            this.loadKnowledgeBaseArticles(sessionManager);
          }, 500); // Debounce 500ms
        });
      }

      // Filtry
      const categoryFilter = document.getElementById('kb-category-filter');
      const sortFilter = document.getElementById('kb-sort-filter');
      const featuredFilter = document.getElementById('kb-featured-filter');

      if (categoryFilter) {
        categoryFilter.addEventListener('change', () => {
          this.loadKnowledgeBaseArticles(sessionManager);
        });
      }

      if (sortFilter) {
        sortFilter.addEventListener('change', () => {
          this.loadKnowledgeBaseArticles(sessionManager);
        });
      }

      if (featuredFilter) {
        featuredFilter.addEventListener('change', () => {
          this.loadKnowledgeBaseArticles(sessionManager);
        });
      }

      // Przycisk "Nowy artykuł" (tylko dla admina)
      const addButton = document.getElementById('kb-add-article');
      if (addButton) {
        addButton.addEventListener('click', () => {
          const uiManager = window.uiManager;
          if (uiManager && uiManager.showKnowledgeBaseEditor) {
            uiManager.showKnowledgeBaseEditor(null); // null = nowy artykuł
          }
        });
      }

      // Przycisk "Powrót do listy" (z widoku artykułu)
      const backButton = document.getElementById('kb-back-to-list');
      if (backButton) {
        backButton.addEventListener('click', () => {
          const uiManager = window.uiManager;
          if (uiManager && uiManager.showKnowledgeBaseListView) {
            uiManager.showKnowledgeBaseListView();
          }
        });
      }

      // Przyciski admina w widoku artykułu
      const editButton = document.getElementById('kb-edit-article');
      const deleteButton = document.getElementById('kb-delete-article');

      if (editButton) {
        editButton.addEventListener('click', () => {
          const slug = editButton.dataset.articleSlug;
          if (slug) {
            const uiManager = window.uiManager;
            if (uiManager && uiManager.showKnowledgeBaseEditor) {
              uiManager.showKnowledgeBaseEditor(slug);
            }
          }
        });
      }

      if (deleteButton) {
        deleteButton.addEventListener('click', () => {
          const id = deleteButton.dataset.articleId;
          const title = deleteButton.dataset.articleTitle;
          if (id && window.confirm(`Czy na pewno usunąć artykuł "${title}"?`)) {
            const uiManager = window.uiManager;
            if (uiManager && uiManager.deleteKnowledgeBaseArticle) {
              uiManager.deleteKnowledgeBaseArticle(id);
            }
          }
        });
      }

      // Przycisk kopiowania linku do artykułu
      const copyLinkButton = document.getElementById('kb-copy-link');
      if (copyLinkButton) {
        copyLinkButton.addEventListener('click', () => {
          const slug = copyLinkButton.dataset.articleSlug;
          const title = copyLinkButton.dataset.articleTitle;
          if (slug) {
            this.copyShareLink('article', slug, title);
          }
        });
      }

      // Przyciski edytora
      const editorBackButton = document.getElementById('kb-editor-back');
      const editorCancelButton = document.getElementById('kb-editor-cancel');

      if (editorBackButton) {
        editorBackButton.addEventListener('click', () => {
          const uiManager = window.uiManager;
          if (uiManager && uiManager.showKnowledgeBaseListView) {
            uiManager.showKnowledgeBaseListView();
          }
        });
      }

      if (editorCancelButton) {
        editorCancelButton.addEventListener('click', () => {
          const uiManager = window.uiManager;
          if (uiManager && uiManager.showKnowledgeBaseListView) {
            uiManager.showKnowledgeBaseListView();
          }
        });
      }

      // Formularz edytora
      const editorForm = document.getElementById('kb-editor-form');
      if (editorForm) {
        editorForm.addEventListener('submit', async e => {
          e.preventDefault();
          await this.saveKnowledgeBaseArticle(editorForm, sessionManager);
        });
      }

      // Auto-generowanie slug z tytułu
      const titleInput = document.getElementById('kb-editor-input-title');
      const slugInput = document.getElementById('kb-editor-input-slug');
      if (titleInput && slugInput) {
        titleInput.addEventListener('input', () => {
          // Generuj slug tylko jeśli pole slug jest puste
          if (!slugInput.value) {
            const knowledgeBaseEngine = window.knowledgeBaseEngine;
            if (knowledgeBaseEngine && knowledgeBaseEngine.generateSlug) {
              slugInput.value = knowledgeBaseEngine.generateSlug(titleInput.value);
            }
          }
        });
      }

      console.log('✅ Knowledge Base listeners initialized');
    },

    /**
     * Zapisuje artykuł (nowy lub edycja)
     * @param {HTMLFormElement} form - Formularz edytora
     * @param {Object} sessionManager - Manager sesji
     */
    async saveKnowledgeBaseArticle(form, sessionManager) {
      const errorEl = document.getElementById('kb-editor-error');
      const saveButton = document.getElementById('kb-editor-save');

      // Ukryj błędy
      if (errorEl) errorEl.classList.add('hidden');

      // Disable przycisk
      if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = '💾 Zapisywanie...';
      }

      try {
        const dataService = window.dataService;
        if (!dataService) throw new Error('dataService nie jest dostępny');

        // Sprawdź czy admin
        if (!sessionManager || !sessionManager.isAdmin()) {
          throw new Error('Brak uprawnień do zapisu artykułu');
        }

        // Pobierz dane z formularza
        const title = document.getElementById('kb-editor-input-title').value.trim();
        const slug = document.getElementById('kb-editor-input-slug').value.trim();
        const description = document.getElementById('kb-editor-input-description').value.trim();
        const category = document.getElementById('kb-editor-input-category').value.trim();
        const icon = document.getElementById('kb-editor-input-icon').value.trim();
        const tagsString = document.getElementById('kb-editor-input-tags').value.trim();
        const isPublished = document.getElementById('kb-editor-input-published').checked;
        const featured = document.getElementById('kb-editor-input-featured').checked;

        // Pobierz treść z Quill
        const quillEditor = window.knowledgeBaseQuillEditor;
        let content = '';
        if (quillEditor) {
          content = quillEditor.root.innerHTML;
        }

        // Walidacja
        if (!title) throw new Error('Tytuł jest wymagany');
        if (!slug) throw new Error('Slug jest wymagany');
        if (!content || content === '<p><br></p>') throw new Error('Treść jest wymagana');

        // Parsuj tagi
        const knowledgeBaseEngine = window.knowledgeBaseEngine;
        const tags =
          knowledgeBaseEngine && knowledgeBaseEngine.parseTags
            ? knowledgeBaseEngine.parseTags(tagsString)
            : tagsString
                .split(',')
                .map(t => t.trim())
                .filter(t => t);

        // Przygotuj dane artykułu
        const articleData = {
          title,
          slug,
          content,
          description: description || null,
          category: category || null,
          icon: icon || null,
          tags: tags.length > 0 ? tags : null,
          is_published: isPublished,
          featured: featured
        };

        // Sprawdź czy edycja czy nowy artykuł
        const articleId = form.dataset.articleId;

        if (articleId) {
          // Edycja
          await dataService.updateKnowledgeBaseArticle(articleId, articleData);
          window.alert('Artykuł został zaktualizowany');
        } else {
          // Nowy artykuł
          await dataService.createKnowledgeBaseArticle(articleData);
          window.alert('Artykuł został utworzony');
        }

        // Wróć do listy
        const uiManager = window.uiManager;
        if (uiManager && uiManager.showKnowledgeBaseListView) {
          uiManager.showKnowledgeBaseListView();
        }
      } catch (err) {
        console.error('Błąd zapisywania artykułu:', err);
        if (errorEl) {
          errorEl.textContent = err.message || 'Nie udało się zapisać artykułu';
          errorEl.classList.remove('hidden');
        }
      } finally {
        // Enable przycisk
        if (saveButton) {
          saveButton.disabled = false;
          saveButton.textContent = '💾 Zapisz artykuł';
        }
      }
    },

    /**
     * Generuje link do udostępniania treści
     * @param {string} type - Typ treści: 'quiz', 'workout', 'listening', 'article'
     * @param {string} idOrSlug - UUID treści lub slug artykułu
     * @returns {string} Pełny URL do udostępnienia
     */
    generateShareLink(type, idOrSlug) {
      const baseUrl = window.location.origin + window.location.pathname;
      if (type === 'article') {
        return `${baseUrl}?type=article&slug=${idOrSlug}`;
      }
      return `${baseUrl}?type=${type}&id=${idOrSlug}`;
    },

    /**
     * Kopiuje link do schowka i pokazuje powiadomienie
     * @param {string} type - Typ treści ('quiz', 'workout', 'listening', 'article')
     * @param {string} idOrSlug - UUID treści lub slug artykułu
     * @param {string} title - Tytuł treści (do powiadomienia)
     */
    async copyShareLink(type, idOrSlug, title) {
      console.log(`📋 Kopiowanie linku: ${title}`);
      try {
        const link = this.generateShareLink(type, idOrSlug);

        // Skopiuj do schowka
        await navigator.clipboard.writeText(link);

        // Pokaż powiadomienie sukcesu
        if (window.uiManager && window.uiManager.showNotification) {
          window.uiManager.showNotification('Link skopiowany do schowka!', '🔗', 'success');
        }

        console.log(`📋 Link skopiowany: ${link}`);
      } catch (error) {
        console.error('Błąd kopiowania linku:', error);
        // Pokaż powiadomienie błędu
        if (window.uiManager && window.uiManager.showNotification) {
          window.uiManager.showNotification('Nie udało się skopiować linku', '❌', 'error');
        } else {
          window.alert('Nie udało się skopiować linku. Spróbuj ponownie.');
        }
      }
    },

    /**
     * Zmienia status publiczny/prywatny treści (tylko dla adminów)
     * @param {string} id - UUID treści
     * @param {boolean} newIsPublic - Nowy status publiczny
     * @param {string} title - Tytuł treści
     * @param {Object} state - Stan aplikacji
     * @param {Object} elements - Elementy DOM
     * @param {Object} uiManager - Manager UI
     * @param {Object} sessionManager - Manager sesji
     */
    async togglePublicStatus(id, newIsPublic, title, state, elements, uiManager, sessionManager) {
      try {
        // Pobierz typ z currentTab
        const type = this._getTypeFromTab(state.currentTab);

        // Użyj konfiguracji z app.js jeśli dostępna
        if (window.contentTypeConfig && window.contentTypeConfig[type]) {
          await window.contentTypeConfig[type].dataServiceUpdateStatusFn(id, newIsPublic);
        } else {
          // Fallback na starą logikę (dla kompatybilności wstecznej)
          if (type === 'quiz') {
            await dataService.updateQuizPublicStatus(id, newIsPublic);
          } else if (type === 'workout') {
            await dataService.updateWorkoutPublicStatus(id, newIsPublic);
          } else if (type === 'listening') {
            await dataService.updateListeningSetPublicStatus(id, newIsPublic);
          } else {
            throw new Error(`Nieznany typ treści: ${type}`);
          }
        }

        // Pokaż powiadomienie sukcesu
        const icon = newIsPublic ? '🌍' : '🔒';
        const message = newIsPublic ? 'Opublikowano dla wszystkich!' : 'Zmieniono na prywatny';

        if (window.uiManager && window.uiManager.showNotification) {
          window.uiManager.showNotification(message, icon, 'purple');
        }

        // Odśwież listę
        if (type === 'listening') {
          // Dla listening - odśwież listę przez engine
          if (window.listeningEngine && window.listeningEngine.showListeningList) {
            window.listeningEngine.showListeningList();
          }
        } else {
          // Dla quiz i workout - odśwież przez content manager
          await this.loadData(state, elements, uiManager);
          this.renderCards(state, elements, uiManager, sessionManager);
        }
      } catch (error) {
        console.error('Błąd zmiany statusu publicznego:', error);

        let errorMessage = 'Nie udało się zmienić statusu';
        if (error.message && error.message.includes('row-level security')) {
          errorMessage = 'Brak uprawnień. Tylko admini mogą zmieniać status publiczny.';
        } else if (error.message) {
          errorMessage = error.message;
        }

        // Pokaż powiadomienie błędu
        if (window.uiManager && window.uiManager.showNotification) {
          window.uiManager.showNotification(errorMessage, '❌', 'error');
        } else {
          window.alert(errorMessage);
        }
      }
    },

    /**
     * Konwertuje nazwę zakładki na typ treści
     * @param {string} tabName - Nazwa zakładki ('quizzes', 'workouts', 'listening')
     * @returns {string} - Typ treści ('quiz', 'workout', 'listening')
     * @private
     */
    _getTypeFromTab(tabName) {
      const mapping = {
        quizzes: 'quiz',
        workouts: 'workout',
        listening: 'listening'
      };
      return mapping[tabName] || tabName;
    }
  };

  // Eksportuj globalnie
  window.contentManager = contentManager;

  console.log('✅ Content manager initialized');
})(); // End of IIFE
