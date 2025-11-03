/**
 * @jest-environment jsdom
 */

/**
 * App Test Harness - Setup real application environment for integration tests
 *
 * This helper initializes the application with REAL modules (not mocks) to test
 * actual integration between components. Only external dependencies are mocked.
 *
 * Philosophy:
 * - Use REAL ui-manager, content-manager, session-manager, etc.
 * - Mock ONLY external services (Supabase, network, etc.)
 * - Provide controlled environment for localStorage, DOM
 * - Enable testing of actual user flows
 */

/**
 * Creates a complete DOM structure for the application
 * This matches the real index.html structure
 */
function createAppDOM() {
  document.body.innerHTML = `
    <!-- Main Screens -->
    <div id="main-screen" class="hidden"></div>
    <div id="quiz-screen" class="hidden">
      <!-- Quiz Options -->
      <div id="quiz-options" class="hidden">
        <h2 id="quiz-title"></h2>
        <input type="checkbox" id="quiz-randomize" />
        <input type="checkbox" id="quiz-skip-listening" />
        <button id="quiz-start-btn">Start</button>
      </div>
      
      <!-- Quiz Content -->
      <div id="quiz-header" class="hidden">
        <div id="quiz-progress"></div>
        <div id="quiz-score"></div>
        <div id="quiz-progress-bar"></div>
      </div>
      <div id="quiz-question-container" class="hidden">
        <div id="quiz-question"></div>
        <div id="quiz-answers"></div>
        <div id="quiz-feedback" class="hidden"></div>
        <button id="quiz-next" class="hidden">Next</button>
      </div>
      <button id="quiz-restart-btn">Restart</button>
    </div>
    
    <div id="quiz-summary-screen" class="hidden">
      <div id="quiz-final-score"></div>
      <div id="quiz-final-details"></div>
      <div id="quiz-mistakes-info"></div>
      <button id="quiz-retry">Retry</button>
      <button id="quiz-retry-mistakes">Retry Mistakes</button>
      <button id="quiz-home">Home</button>
    </div>
    
    <div id="workout-screen" class="hidden">
      <div id="workout-phase"></div>
      <div id="workout-exercise-name"></div>
      <div id="workout-exercise-description"></div>
      <div id="workout-exercise-details"></div>
      <button id="workout-main-button">
        <span id="workout-button-text"></span>
        <span id="workout-button-icon"></span>
      </button>
      <button id="workout-skip-button">Skip</button>
      <button id="workout-restart-btn">Restart</button>
      <div id="workout-screen-timeout-tip" class="hidden">
        <button id="close-workout-screen-tip">X</button>
        <button id="dismiss-workout-screen-tip">Don't show again</button>
      </div>
    </div>
    
    <div id="workout-end-screen" class="hidden">
      <button id="workout-restart">Restart</button>
      <button id="workout-home">Home</button>
    </div>
    
    <div id="listening-screen" class="hidden">
      <div id="listening-list"></div>
      <div id="listening-player" class="hidden"></div>
    </div>
    
    <div id="knowledge-base-screen" class="hidden">
      <div id="knowledge-base-list">
        <div id="kb-articles-container"></div>
        <div id="kb-list-loader" class="hidden"></div>
        <div id="kb-list-error" class="hidden"></div>
        <div id="kb-empty-state" class="hidden"></div>
        <button id="kb-add-article" class="hidden">Add Article</button>
      </div>
      <div id="knowledge-base-article" class="hidden">
        <div id="kb-article-loader" class="hidden"></div>
        <div id="kb-article-error" class="hidden"></div>
        <div id="kb-article-content" class="hidden">
          <div id="kb-article-icon"></div>
          <h1 id="kb-article-title"></h1>
          <p id="kb-article-description"></p>
          <div id="kb-article-category"></div>
          <div id="kb-article-date"></div>
          <div id="kb-article-views"></div>
          <div id="kb-article-tags"></div>
          <div id="kb-article-body"></div>
          <button id="kb-copy-link">Copy Link</button>
          <div id="kb-article-admin-actions" class="hidden">
            <button id="kb-edit-article">Edit</button>
            <button id="kb-delete-article">Delete</button>
          </div>
        </div>
      </div>
      <div id="knowledge-base-editor" class="hidden">
        <h2 id="kb-editor-title"></h2>
        <form id="kb-editor-form">
          <input id="kb-editor-input-title" />
          <input id="kb-editor-input-slug" />
          <textarea id="kb-editor-input-description"></textarea>
          <input id="kb-editor-input-category" />
          <input id="kb-editor-input-icon" />
          <input id="kb-editor-input-tags" />
          <input type="checkbox" id="kb-editor-input-published" />
          <input type="checkbox" id="kb-editor-input-featured" />
          <div id="kb-editor-quill"></div>
        </form>
      </div>
    </div>
    
    <div id="more-screen" class="hidden"></div>
    
    <!-- Navigation -->
    <nav id="tab-bar">
      <button id="tab-workouts" class="tab-button" data-tab="workouts">Workouts</button>
      <button id="tab-quizzes" class="tab-button" data-tab="quizzes">Quizzes</button>
      <button id="tab-listening" class="tab-button" data-tab="listening">Listening</button>
      <button id="tab-knowledge-base" class="tab-button" data-tab="knowledge-base">Knowledge Base</button>
      <button id="tab-import" class="tab-button" data-tab="import">Import</button>
      <button id="tab-ai-generator" class="tab-button" data-tab="ai-generator">AI Generator</button>
      <button id="tab-more" class="tab-button" data-tab="more">More</button>
    </nav>
    
    <button id="home-button">Home</button>
    <button id="sound-toggle">
      <span id="sound-icon-on">🔊</span>
      <span id="sound-icon-off" class="hidden">🔇</span>
    </button>
    
    <!-- Content Cards Container -->
    <div id="content-cards"></div>
    <div id="loader" class="hidden">Loading...</div>
    <div id="error-message" class="hidden">
      <p></p>
    </div>
    
    <!-- Dialogs -->
    <div id="continue-dialog" class="hidden">
      <button id="continue-yes">Yes</button>
      <button id="continue-no">No</button>
    </div>
    
    <div id="exit-dialog" class="hidden">
      <button id="exit-confirm">Confirm</button>
      <button id="exit-cancel">Cancel</button>
    </div>
    
    <div id="restart-dialog" class="hidden">
      <button id="restart-confirm">Confirm</button>
      <button id="restart-cancel">Cancel</button>
    </div>
    
    <!-- Auth UI -->
    <button id="user-menu-button">User Menu</button>
    <div id="user-menu-dropdown" class="hidden">
      <div id="guest-menu">
        <button id="login-button">Login</button>
        <button id="register-button">Register</button>
      </div>
      <div id="user-menu-logged" class="hidden">
        <span id="user-email"></span>
        <button id="logout-button">Logout</button>
      </div>
    </div>
    
    <!-- Auth Modals -->
    <div id="login-modal" class="hidden">
      <form id="login-form">
        <input id="login-email" type="email" />
        <input id="login-password" type="password" />
        <div id="login-error" class="hidden"></div>
        <div id="login-success" class="hidden"></div>
        <button type="submit">Login</button>
        <button type="button" id="login-cancel">Cancel</button>
        <a id="forgot-password-link">Forgot password?</a>
      </form>
    </div>
    
    <div id="register-modal" class="hidden">
      <form id="register-form">
        <input id="register-email" type="email" />
        <input id="register-password" type="password" />
        <input id="register-password-confirm" type="password" />
        <div id="register-error" class="hidden"></div>
        <div id="register-success" class="hidden"></div>
        <button type="submit">Register</button>
        <button type="button" id="register-cancel">Cancel</button>
      </form>
    </div>
    
    <div id="reset-password-modal" class="hidden">
      <form id="reset-password-form">
        <input id="reset-email" type="email" />
        <div id="reset-error" class="hidden"></div>
        <div id="reset-success" class="hidden"></div>
        <button type="submit">Reset</button>
        <button type="button" id="reset-cancel">Cancel</button>
      </form>
    </div>
    
    <div id="new-password-modal" class="hidden">
      <form id="new-password-form">
        <input id="new-password" type="password" />
        <input id="new-password-confirm" type="password" />
        <div id="new-password-error" class="hidden"></div>
        <div id="new-password-success" class="hidden"></div>
        <button type="submit">Set Password</button>
      </form>
    </div>
    
    <!-- Import Modal -->
    <div id="import-modal" class="hidden">
      <h2 id="import-title">Import Content</h2>
      <button id="import-type-quiz">Quiz</button>
      <button id="import-type-workout">Workout</button>
      <button id="import-type-listening">Listening</button>
      <button id="import-tab-file">File</button>
      <button id="import-tab-paste">Paste</button>
      <div id="import-file-panel">
        <div id="drop-zone">
          <input type="file" id="file-input" accept=".json" />
          <button id="file-select-btn">Select File</button>
          <div id="file-name" class="hidden">
            <span id="file-name-text"></span>
          </div>
        </div>
      </div>
      <div id="import-paste-panel" class="hidden">
        <textarea id="json-input"></textarea>
      </div>
      <div id="import-error" class="hidden"></div>
      <div id="import-success" class="hidden"></div>
      <div id="import-public-option">
        <input type="checkbox" id="import-make-public" />
      </div>
      <button id="import-submit">Import</button>
      <button id="import-cancel">Cancel</button>
      <button id="import-close">Close</button>
    </div>
    
    <!-- Delete Modal -->
    <div id="delete-modal" class="hidden">
      <div id="delete-item-title"></div>
      <button id="delete-confirm">Delete</button>
      <button id="delete-cancel">Cancel</button>
    </div>
    
    <!-- AI Generator Modal -->
    <div id="ai-generator-modal" class="hidden">
      <button id="ai-type-quiz">Quiz</button>
      <button id="ai-type-workout">Workout</button>
      <button id="ai-type-listening">Listening</button>
      <div id="ai-hint-quiz"></div>
      <div id="ai-hint-workout"></div>
      <div id="ai-hint-listening"></div>
      <div id="ai-language-selection">
        <select id="ai-lang1"></select>
        <select id="ai-lang2"></select>
      </div>
      <textarea id="ai-prompt"></textarea>
      <div id="ai-error" class="hidden"></div>
      <div id="ai-success" class="hidden"></div>
      <div id="ai-loading" class="hidden"></div>
      <div id="ai-public-option">
        <input type="checkbox" id="ai-make-public" />
      </div>
      <button id="ai-generate">Generate</button>
      <button id="ai-cancel">Cancel</button>
      <button id="ai-close">Close</button>
    </div>
    
    <!-- More Screen Buttons -->
    <button id="add-content-button-more" class="hidden">Add Content</button>
    <button id="ai-generator-button-more" class="hidden">AI Generator</button>
  `;
}

/**
 * Creates mock Supabase client with controlled behavior
 */
function createMockSupabase() {
  const mockSupabase = {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
      onAuthStateChange: jest.fn(callback => {
        // Store callback for manual triggering in tests
        mockSupabase._authCallback = callback;
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      })
    },
    from: jest.fn(table => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      // Mock data storage
      _mockData: {},
      _setMockData: function (data) {
        this._mockData[table] = data;
        return this;
      },
      _getMockData: function () {
        return { data: this._mockData[table] || [], error: null };
      }
    })),
    // Helper to trigger auth state change
    _triggerAuthChange: function (event, session) {
      if (this._authCallback) {
        this._authCallback(event, session);
      }
    }
  };

  return mockSupabase;
}

/**
 * Creates a controlled localStorage mock
 */
function createMockLocalStorage() {
  const store = {};

  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    // Helper to inspect storage
    _getStore: () => ({ ...store }),
    // Helper to set initial state
    _setStore: data => {
      Object.assign(store, data);
    }
  };
}

/**
 * Initializes the real application with mocked external dependencies
 *
 * @param {Object} options - Configuration options
 * @param {Object} options.initialState - Initial app state
 * @param {Object} options.mockData - Mock data for Supabase
 * @param {Object} options.localStorage - Initial localStorage data
 * @param {Object} options.user - Mock user (null = not logged in)
 * @param {Array} options.enabledFeatures - Feature flags to enable
 * @returns {Object} App context with all modules and helpers
 */
function initializeTestApp(options = {}) {
  const {
    initialState = {},
    mockData = {},
    localStorage: initialLocalStorage = {},
    user = null,
    enabledFeatures = ['workouts', 'quizzes', 'listening', 'knowledge-base', 'more']
  } = options;

  // Setup DOM
  createAppDOM();

  // Mock window.scrollTo (not implemented in jsdom)
  window.scrollTo = jest.fn();

  // Setup localStorage
  const mockLocalStorage = createMockLocalStorage();
  mockLocalStorage._setStore(initialLocalStorage);
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true
  });

  // Mock Supabase config globally (to prevent config.js errors)
  window.APP_CONFIG = {
    SUPABASE_URL: 'https://mock-supabase-url.supabase.co',
    SUPABASE_ANON_KEY: 'mock-anon-key'
  };

  // Mock Supabase library (window.supabase.createClient)
  const mockSupabase = createMockSupabase();
  window.supabase = {
    createClient: jest.fn(() => mockSupabase)
  };
  window.supabaseClient = mockSupabase;

  // Setup mock data
  if (mockData.quizzes) {
    mockSupabase.from('quizzes')._setMockData(mockData.quizzes);
  }
  if (mockData.workouts) {
    mockSupabase.from('workouts')._setMockData(mockData.workouts);
  }

  // Setup user session
  if (user) {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user, access_token: 'mock-token' } },
      error: null
    });
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user },
      error: null
    });
  }

  // Setup feature flags
  window.featureFlags = {
    isQuizzesEnabled: jest.fn(() => enabledFeatures.includes('quizzes')),
    isWorkoutsEnabled: jest.fn(() => enabledFeatures.includes('workouts')),
    isListeningEnabled: jest.fn(() => enabledFeatures.includes('listening')),
    isKnowledgeBaseEnabled: jest.fn(() => enabledFeatures.includes('knowledge-base')),
    isFileImportEnabled: jest.fn(() => enabledFeatures.includes('import')),
    isAIGeneratorEnabled: jest.fn(() => enabledFeatures.includes('ai-generator')),
    getEnabledTabs: jest.fn(() => enabledFeatures),
    getActiveCoreTabs: jest.fn(() =>
      enabledFeatures.filter(f =>
        ['workouts', 'quizzes', 'listening', 'knowledge-base'].includes(f)
      )
    )
  };

  // Setup UI state
  window.uiState = {
    _state: { isActivity: false, currentScreen: 'main' },
    navigateToScreen: jest.fn(screen => {
      window.uiState._state.currentScreen = screen;
      window.uiState._state.isActivity = ['quiz', 'workout'].includes(screen);
    }),
    switchTab: jest.fn(),
    setListeningPlayerActive: jest.fn(),
    getState: jest.fn(() => window.uiState._state)
  };

  // Load REAL modules (not mocks!)
  require('../../js/ui/ui-manager.js');
  require('../../js/ui/session-manager.js');
  require('../../js/data/auth-service.js');
  require('../../js/content-manager.js');
  require('../../js/engines/quiz-engine.js');
  require('../../js/engines/workout-engine.js');

  // Get references to real modules
  const uiManager = window.uiManager;
  const sessionManager = window.sessionManager;
  const contentManager = window.contentManager;
  const authService = window.authService;

  // Create mock dataService (since we're mocking Supabase anyway)
  const dataService = {
    fetchQuizzes: jest.fn().mockResolvedValue(mockData.quizzes || []),
    fetchWorkouts: jest.fn().mockResolvedValue(mockData.workouts || []),
    fetchQuizById: jest.fn(id => {
      const quiz = (mockData.quizzes || []).find(q => q.id === id);
      return Promise.resolve(quiz || null);
    }),
    fetchWorkoutById: jest.fn(id => {
      const workout = (mockData.workouts || []).find(w => w.id === id);
      return Promise.resolve(workout || null);
    }),
    saveQuiz: jest.fn().mockResolvedValue({ success: true }),
    saveWorkout: jest.fn().mockResolvedValue({ success: true }),
    deleteQuiz: jest.fn().mockResolvedValue({ success: true }),
    deleteWorkout: jest.fn().mockResolvedValue({ success: true }),
    updateQuizPublicStatus: jest.fn().mockResolvedValue({ success: true }),
    updateWorkoutPublicStatus: jest.fn().mockResolvedValue({ success: true })
  };
  window.dataService = dataService;

  // Create app state
  const state = {
    currentView: 'main',
    currentTab: 'workouts',
    quizzes: [],
    workouts: [],
    listeningSets: [],
    currentUser: user,
    ...initialState
  };

  // Export state to window (like real app does)
  window.state = state;

  // Get DOM elements (like real app does)
  const elements = {
    mainScreen: document.getElementById('main-screen'),
    quizScreen: document.getElementById('quiz-screen'),
    quizSummaryScreen: document.getElementById('quiz-summary-screen'),
    workoutScreen: document.getElementById('workout-screen'),
    workoutEndScreen: document.getElementById('workout-end-screen'),
    moreScreen: document.getElementById('more-screen'),
    listeningScreen: document.getElementById('listening-screen'),
    knowledgeBaseScreen: document.getElementById('knowledge-base-screen'),
    contentCards: document.getElementById('content-cards'),
    exitDialog: document.getElementById('exit-dialog'),
    continueDialog: document.getElementById('continue-dialog'),
    loader: document.getElementById('loader'),
    errorMessage: document.getElementById('error-message'),
    tabWorkouts: document.getElementById('tab-workouts'),
    tabQuizzes: document.getElementById('tab-quizzes'),
    tabListening: document.getElementById('tab-listening'),
    tabKnowledgeBase: document.getElementById('tab-knowledge-base'),
    tabImport: document.getElementById('tab-import'),
    tabAIGenerator: document.getElementById('tab-ai-generator'),
    tabMore: document.getElementById('tab-more'),
    homeButton: document.getElementById('home-button'),
    soundToggle: document.getElementById('sound-toggle'),
    soundIconOn: document.getElementById('sound-icon-on'),
    soundIconOff: document.getElementById('sound-icon-off'),
    userMenuButton: document.getElementById('user-menu-button'),
    userMenuDropdown: document.getElementById('user-menu-dropdown'),
    guestMenu: document.getElementById('guest-menu'),
    userMenuLogged: document.getElementById('user-menu-logged'),
    userEmail: document.getElementById('user-email'),
    loginButton: document.getElementById('login-button'),
    registerButton: document.getElementById('register-button'),
    logoutButton: document.getElementById('logout-button')
  };

  // Initialize engines (if needed)
  if (window.initQuizEngine) {
    window.initQuizEngine(
      screen => uiManager.showScreen(screen, state, elements, contentManager, sessionManager),
      state
    );
  }

  if (window.initWorkoutEngine) {
    window.initWorkoutEngine(
      screen => uiManager.showScreen(screen, state, elements, contentManager, sessionManager),
      state
    );
  }

  // Return app context
  return {
    // Real modules
    uiManager,
    sessionManager,
    contentManager,
    dataService,
    authService,

    // App state
    state,
    elements,

    // Mocks (for inspection/control)
    mockSupabase,
    mockLocalStorage,

    // Helper methods
    helpers: {
      /**
       * Simulates user clicking an element
       */
      click: selector => {
        const el = document.querySelector(selector);
        if (!el) throw new Error(`Element not found: ${selector}`);
        el.click();
      },

      /**
       * Gets currently active tab
       */
      getActiveTab: () => {
        const activeTab = document.querySelector('.tab-button.active');
        return activeTab ? activeTab.dataset.tab : null;
      },

      /**
       * Gets current visible screen
       */
      getCurrentScreen: () => {
        const screens = [
          'main',
          'quiz',
          'quiz-summary',
          'workout',
          'workout-end',
          'listening',
          'knowledge-base',
          'more'
        ];
        for (const screen of screens) {
          const el = document.getElementById(`${screen}-screen`);
          if (el && !el.classList.contains('hidden')) {
            return screen;
          }
        }
        return null;
      },

      /**
       * Gets rendered cards content
       */
      getRenderedCards: () => {
        return elements.contentCards.innerHTML;
      },

      /**
       * Waits for condition to be true
       */
      waitFor: async (condition, timeout = 1000) => {
        const startTime = Date.now();
        while (!condition()) {
          if (Date.now() - startTime > timeout) {
            throw new Error('Timeout waiting for condition');
          }
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      },

      /**
       * Triggers auth state change (for testing auth flows)
       */
      triggerAuthChange: (event, session) => {
        mockSupabase._triggerAuthChange(event, session);
      }
    }
  };
}

module.exports = {
  initializeTestApp,
  createAppDOM,
  createMockSupabase,
  createMockLocalStorage
};
