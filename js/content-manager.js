// ============================================
// CONTENT MANAGER - Import, Delete, Render, Load
// ============================================

(function() {
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
    const coreTabs = featureFlags.getActiveCoreTabs();
    const isMoreTabEnabled = featureFlags.getEnabledTabs().includes('more');

    // Sprawdź, czy jakikolwiek moduł jest włączony
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

    // Jeśli użytkownik nie jest zalogowany, pokaż landing page
    if (!state.currentUser) {
      // Buduj dynamicznie karty funkcji na podstawie włączonych modułów
      let featureCards = '';
      
      if (featureFlags.isQuizzesEnabled()) {
        featureCards += `
          <div class="bg-gray-800 p-6 rounded-xl">
            <div class="text-4xl mb-3">📝</div>
            <h3 class="text-xl font-bold text-white mb-2">Quizy</h3>
            <p class="text-gray-400 text-sm">
              Różne typy pytań: wielokrotnego wyboru, prawda/fałsz, uzupełnianie, dopasowywanie, słuchowe.
            </p>
          </div>
        `;
      }
      
      if (featureFlags.isWorkoutsEnabled()) {
        featureCards += `
          <div class="bg-gray-800 p-6 rounded-xl">
            <div class="text-4xl mb-3">💪</div>
            <h3 class="text-xl font-bold text-white mb-2">Treningi</h3>
            <p class="text-gray-400 text-sm">
              Interaktywne treningi z timerem, licznikiem powtórzeń i Wake Lock API.
            </p>
          </div>
        `;
      }
      
      if (featureFlags.isListeningEnabled()) {
        featureCards += `
          <div class="bg-gray-800 p-6 rounded-xl">
            <div class="text-4xl mb-3">🎧</div>
            <h3 class="text-xl font-bold text-white mb-2">Słuchanie</h3>
            <p class="text-gray-400 text-sm">
              Nauka języków przez słuchanie i powtarzanie par słów z automatycznym TTS.
            </p>
          </div>
        `;
      }
      
      elements.contentCards.innerHTML = `
        <div class="col-span-full text-center py-16">
          <div class="max-w-2xl mx-auto">
            <h2 class="text-4xl font-bold text-white mb-4">Witaj w eTrener!</h2>
            <p class="text-xl text-gray-300 mb-8">
              Twórz własne treści, importuj z JSON lub generuj za pomocą AI.
            </p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-left">
              ${featureCards}
            </div>
            <div class="flex gap-4 justify-center">
              <button onclick="document.getElementById('login-button').click()" 
                      class="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition text-lg">
                Zaloguj się
              </button>
              <button onclick="document.getElementById('register-button').click()" 
                      class="px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition text-lg">
                Zarejestruj się
              </button>
            </div>
            <p class="text-gray-500 text-sm mt-6">
              Twoje dane są chronione przez Row Level Security. Tylko Ty masz dostęp do swoich treści.
            </p>
          </div>
        </div>
      `;
      return;
    }
    
    // Dla zalogowanych użytkowników
    const items = state.currentTab === 'quizzes' ? state.quizzes : state.workouts;
    
    if (items.length === 0) {
      elements.contentCards.innerHTML = `
        <div class="col-span-full text-center py-12 text-gray-400">
          <p class="text-xl mb-2">Brak dostępnych treści</p>
          <p class="text-sm">Zaimportuj swoje treści lub poczekaj na przykładowe dane</p>
        </div>
      `;
      return;
    }
    
    elements.contentCards.innerHTML = items.map(item => {
      const icon = state.currentTab === 'quizzes' ? '📝' : '💪';
      const badge = item.isSample ? '<span class="text-xs bg-blue-600 px-2 py-1 rounded">Przykład</span>' : '';
      const actionButtons = !item.isSample ? `
        <div class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 flex gap-2 z-10">
          <button class="export-btn text-gray-400 hover:text-green-500 hover:scale-110 text-xl"
                  data-id="${item.id}"
                  data-title="${item.title.replace(/"/g, '&quot;')}"
                  title="Eksportuj JSON">
            ⬇
          </button>
          <button class="delete-btn text-gray-400 hover:text-red-500 hover:scale-110 text-xl"
                  data-id="${item.id}"
                  data-title="${item.title.replace(/"/g, '&quot;')}"
                  title="Usuń">
            ×
          </button>
        </div>
      ` : '';
      
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
    }).join('');
    
    // Dodaj event listenery do przycisków usuń/eksportuj NAJPIERW
    elements.contentCards.querySelectorAll('.export-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        const id = btn.dataset.id;
        this.exportContent(id, state, elements);
        return false;
      });
    });
    
    elements.contentCards.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
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
      card.addEventListener('click', (e) => {
        // Jeśli kliknięto w przyciski akcji, ignoruj
        if (e.target.closest('.export-btn') || e.target.closest('.delete-btn')) {
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
        questionCount: 0
      }));
      
      state.workouts = workouts.map(workout => ({
        id: workout.id,
        title: workout.title,
        description: workout.description,
        isSample: workout.is_sample,
        exerciseCount: 0
      }));
      
      console.log('✅ Dane wczytane z Supabase');
      console.log('📝 Quizy:', state.quizzes.length);
      console.log('💪 Treningi:', state.workouts.length);
      
    } catch (error) {
      console.error('❌ Błąd wczytywania danych:', error);
      uiManager.showError('Nie udało się wczytać treści. Sprawdź połączenie i odśwież stronę.', elements);
    } finally {
      elements.loader.classList.add('hidden');
    }
  },
  
  /**
   * Wczytuje i rozpoczyna quiz
   */
  async loadAndStartQuiz(quizId, state, elements, sessionManager, uiManager, skipSessionCheck = false) {
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
      
      if (typeof startQuiz === 'function') {
        startQuiz(quizData, quizId);
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
      
      if (typeof startWorkout === 'function') {
        startWorkout(workoutData, workoutId);
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
  async exportContent(id, state, elements) {
    try {
      let data, filename;
      
      // Pobierz pełne dane z Supabase
      if (state.currentTab === 'quizzes') {
        data = await dataService.fetchQuizById(id);
        filename = `quiz-${this.sanitizeFilename(data.title)}.json`;
      } else {
        data = await dataService.fetchWorkoutById(id);
        filename = `workout-${this.sanitizeFilename(data.title)}.json`;
      }
      
      // Usuń metadane Supabase (id, user_id, created_at, is_sample)
      const cleanData = {
        title: data.title,
        description: data.description
      };
      
      if (state.currentTab === 'quizzes') {
        cleanData.questions = data.questions;
      } else {
        cleanData.phases = data.phases;
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
      alert('Błąd podczas eksportu: ' + error.message);
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
  openImportModal(state, elements) {
    this.currentImportType = state.currentTab === 'quizzes' ? 'quiz' : 'workout';
    this.currentImportTab = 'file';
    this.selectedFile = null;
    
    // Ustaw tytuł
    elements.importTitle.textContent = this.currentImportType === 'quiz' ? 'Dodaj Quiz' : 'Dodaj Trening';
    
    // Resetuj formularz
    elements.fileInput.value = '';
    elements.jsonInput.value = '';
    elements.fileName.classList.add('hidden');
    elements.importError.classList.add('hidden');
    elements.importSuccess.classList.add('hidden');
    
    // Pokaż panel pliku
    elements.importFilePanel.classList.remove('hidden');
    elements.importPastePanel.classList.add('hidden');
    
    // Ustaw aktywną zakładkę
    elements.importTabFile.classList.add('bg-blue-600', 'text-white');
    elements.importTabFile.classList.remove('bg-gray-700', 'text-gray-300');
    elements.importTabPaste.classList.add('bg-gray-700', 'text-gray-300');
    elements.importTabPaste.classList.remove('bg-blue-600', 'text-white');
    
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
    
    let jsonData;
    
    try {
      // Pobierz JSON
      if (this.currentImportTab === 'file') {
        if (!this.selectedFile) {
          this.showImportError('Wybierz plik JSON', elements);
          return;
        }
        
        const text = await this.selectedFile.text();
        jsonData = JSON.parse(text);
      } else {
        const text = elements.jsonInput.value.trim();
        if (!text) {
          this.showImportError('Wklej JSON', elements);
          return;
        }
        
        jsonData = JSON.parse(text);
      }
    } catch (error) {
      this.showImportError('Nieprawidłowy format JSON: ' + error.message, elements);
      return;
    }
    
    // Konwertuj stary format (v1) na nowy (v2)
    jsonData = this.convertLegacyFormat(jsonData, this.currentImportType);
    
    // Waliduj JSON
    const errors = this.currentImportType === 'quiz' 
      ? this.validateQuizJSON(jsonData) 
      : this.validateWorkoutJSON(jsonData);
    
    if (errors.length > 0) {
      this.showImportError('Błędy walidacji:\n• ' + errors.join('\n• '), elements);
      return;
    }
    
    // Zapisz do Supabase
    try {
      if (this.currentImportType === 'quiz') {
        await dataService.saveQuiz(jsonData);
      } else {
        await dataService.saveWorkout(jsonData);
      }
      
      this.showImportSuccess('✅ Zaimportowano pomyślnie!', elements);
      
      // Odśwież dane
      await this.loadData(state, elements, uiManager);
      this.renderCards(state, elements, uiManager, window.sessionManager);
      
      // Zamknij modal po 1.5s
      setTimeout(() => {
        this.closeImportModal(elements);
      }, 1500);
    } catch (error) {
      this.showImportError('Błąd podczas zapisywania: ' + error.message, elements);
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
          
          if (q.type === 'true-false' && q.isCorrect !== undefined && q.correctAnswer === undefined) {
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
        
        if (!q.type || !['multiple-choice', 'true-false', 'fill-in-blank', 'matching', 'listening'].includes(q.type)) {
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
              errors.push(`Pytanie ${idx + 1}: "correctAnswer" "${q.correctAnswer}" nie jest poprawną liczbą`);
            } else {
              q.correctAnswer = parsed;
            }
          }
          if (typeof q.correctAnswer === 'number' && (q.correctAnswer < 0 || q.correctAnswer >= q.options.length)) {
            errors.push(`Pytanie ${idx + 1}: "correctAnswer" (${q.correctAnswer}) poza zakresem (0-${q.options.length - 1})`);
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
              errors.push(`Pytanie ${idx + 1}: "correctAnswer" "${q.correctAnswer}" nie jest poprawną wartością (true/false)`);
            }
          }
          if (typeof q.correctAnswer !== 'boolean') {
            errors.push(`Pytanie ${idx + 1}: "correctAnswer" musi być boolean (true/false), otrzymano: ${typeof q.correctAnswer}`);
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
              errors.push(`Faza ${idx + 1}, Ćwiczenie ${exIdx + 1}: nieprawidłowy typ "${ex.type}"`);
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
  
  // ============================================
  // USUWANIE TREŚCI
  // ============================================
  
  /**
   * Pokaż modal potwierdzenia usunięcia
   */
  confirmDelete(id, title, elements) {
    this.itemToDelete = id;
    elements.deleteItemTitle.textContent = title;
    elements.deleteModal.classList.remove('hidden');
  },
  
  /**
   * Zamknij modal usuwania
   */
  closeDeleteModal(elements) {
    this.itemToDelete = null;
    elements.deleteModal.classList.add('hidden');
  },
  
  /**
   * Usuń element
   */
  async handleDelete(state, elements, uiManager) {
    if (!this.itemToDelete) return;
    
    try {
      if (state.currentTab === 'quizzes') {
        await dataService.deleteQuiz(this.itemToDelete);
      } else {
        await dataService.deleteWorkout(this.itemToDelete);
      }
      
      // Odśwież dane
      await this.loadData(state, elements, uiManager);
      this.renderCards(state, elements, uiManager, window.sessionManager);
      
      // Zamknij modal
      this.closeDeleteModal(elements);
    } catch (error) {
      console.error('Błąd podczas usuwania:', error);
      alert('Błąd podczas usuwania: ' + error.message);
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
    this.selectedAIType = state.currentTab === 'quizzes' ? 'quiz' : 'workout';
    
    // Resetuj formularz
    elements.aiPrompt.value = '';
    elements.aiError.classList.add('hidden');
    elements.aiSuccess.classList.add('hidden');
    elements.aiLoading.classList.add('hidden');
    
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
    const hintQuiz = elements.aiHintQuiz;
    const hintWorkout = elements.aiHintWorkout;
    const promptInput = elements.aiPrompt;
    
    if (this.selectedAIType === 'quiz') {
      quizBtn.classList.add('bg-blue-600', 'border-blue-600', 'text-white');
      quizBtn.classList.remove('border-gray-600', 'text-gray-300');
      workoutBtn.classList.add('border-gray-600', 'text-gray-300');
      workoutBtn.classList.remove('bg-green-600', 'border-green-600', 'text-white');
      hintQuiz.classList.remove('hidden');
      hintWorkout.classList.add('hidden');
      promptInput.placeholder = 'Przykład: Quiz o angielskim dla początkujących, 10 pytań: 5 multiple-choice, 3 listening (en-US), 2 fill-in-blank';
    } else {
      workoutBtn.classList.add('bg-green-600', 'border-green-600', 'text-white');
      workoutBtn.classList.remove('border-gray-600', 'text-gray-300');
      quizBtn.classList.add('border-gray-600', 'text-gray-300');
      quizBtn.classList.remove('bg-blue-600', 'border-blue-600', 'text-white');
      hintWorkout.classList.remove('hidden');
      hintQuiz.classList.add('hidden');
      promptInput.placeholder = 'Przykład: Trening FBW dla początkujących, 30 minut, bez sprzętu, 3 fazy';
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
    
    // Pokaż loading
    elements.aiError.classList.add('hidden');
    elements.aiSuccess.classList.add('hidden');
    elements.aiLoading.classList.remove('hidden');
    elements.aiGenerate.disabled = true;
    
    try {
      // Wywołaj AI API (przez Vercel Function lub bezpośrednio)
      const generatedData = await this.callAIAPI(prompt, contentType);
      
      // Waliduj wygenerowane dane
      const errors = contentType === 'quiz' 
        ? this.validateQuizJSON(generatedData) 
        : this.validateWorkoutJSON(generatedData);
      
      if (errors.length > 0) {
        throw new Error('Wygenerowane dane są nieprawidłowe: ' + errors.join(', '));
      }
      
      // Zapisz do Supabase
      if (contentType === 'quiz') {
        await dataService.saveQuiz(generatedData);
      } else {
        await dataService.saveWorkout(generatedData);
      }
      
      this.showAISuccess('✅ Treść wygenerowana i zapisana!', elements);
      
      // Odśwież dane
      await this.loadData(state, elements, uiManager);
      this.renderCards(state, elements, uiManager, window.sessionManager);
      
      // Zamknij modal po 2s
      setTimeout(() => {
        this.closeAIGeneratorModal(elements);
      }, 2000);
      
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
  async callAIAPI(userPrompt, contentType) {
    // Pobierz szablon promptu z AI_PROMPTS
    const promptTemplate = contentType === 'quiz' 
      ? window.AI_PROMPTS.quiz
      : window.AI_PROMPTS.workout;
    
    // Zastąp {USER_PROMPT} rzeczywistym promptem użytkownika
    const systemPrompt = promptTemplate.replace('{USER_PROMPT}', userPrompt);
    
    // Sprawdź czy jesteśmy na produkcji (Vercel) czy lokalnie
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // Jeśli używamy file:// lub nie mamy hostname, zawsze używaj OpenRouter bezpośrednio
    const isFileProtocol = protocol === 'file:' || hostname === '';
    
    // Sprawdź czy jesteśmy na Vercel (produkcja)
    const isVercel = hostname.includes('vercel.app') || hostname.includes('vercel.com');
    
    // Dla innych domen sprawdź czy to nie localhost
    const isLocalhost = hostname === 'localhost' || 
                       hostname === '127.0.0.1' ||
                       hostname.includes('192.168') ||
                       hostname.includes('.local');
    
    // Używaj Vercel Function tylko jeśli jesteśmy na Vercel
    const useVercelFunction = isVercel && !isLocalhost && !isFileProtocol;
    
    console.log(`🤖 Generowanie ${contentType} przez AI...`);
    console.log(`📍 Hostname: ${hostname || 'file://'}`);
    console.log(`📍 Protocol: ${protocol}`);
    console.log(`📍 Środowisko: ${useVercelFunction ? 'Produkcja (Vercel Function)' : 'Lokalne (OpenRouter Direct)'}`);
    
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
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'eTrener - AI Generator'
        },
        body: JSON.stringify({
          // Available OpenRouter models (2025):
          // - anthropic/claude-sonnet-4.5: Najlepsza jakość, najnowszy model (zalecane)
          // - anthropic/claude-3.5-sonnet: Stabilny, świetny stosunek ceny do jakości
          // - anthropic/claude-3-opus: Najwyższa jakość dla złożonych zadań (droższy)
          model: 'anthropic/claude-sonnet-4.5',
          messages: [
            { role: 'user', content: systemPrompt }
          ],
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
      throw new Error('AI zwróciło nieprawidłową odpowiedź (HTML). Sprawdź klucz API i spróbuj ponownie.');
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
  }
};

// Eksportuj globalnie
window.contentManager = contentManager;

console.log('✅ Content manager initialized');

})(); // End of IIFE

