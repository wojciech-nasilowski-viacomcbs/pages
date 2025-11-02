/**
 * @fileoverview Type definitions for the entire application
 * This file contains JSDoc type definitions used across all modules
 * @module types
 */

// ============================================================================
// USER & AUTH TYPES
// ============================================================================

/**
 * @typedef {'admin'|'user'} UserRole
 * User role type - 'admin' has elevated permissions, 'user' is default
 */

/**
 * @typedef {Object} UserMetadata
 * @property {UserRole} [role] - User role (undefined = 'user', 'admin' = admin)
 */

/**
 * @typedef {Object} User
 * @property {string} id - Unique user ID from Supabase Auth
 * @property {string} email - User's email address
 * @property {UserMetadata} [user_metadata] - Additional user metadata (includes role)
 * @property {string} [created_at] - Account creation timestamp
 */

/**
 * @typedef {Object} Session
 * @property {string} access_token - JWT access token
 * @property {string} refresh_token - JWT refresh token
 * @property {User} user - User object
 * @property {number} expires_in - Token expiration time in seconds
 * @property {string} token_type - Token type (usually 'bearer')
 */

/**
 * @typedef {Object} AuthResponse
 * @property {User|null} user - User object or null
 * @property {Session|null} session - Session object or null
 * @property {Error|null} error - Error object if authentication failed
 */

// ============================================================================
// QUIZ TYPES
// ============================================================================

/**
 * @typedef {Object} Quiz
 * @property {string} id - Unique quiz ID
 * @property {string} user_id - Owner's user ID
 * @property {string} title - Quiz title
 * @property {string} description - Quiz description
 * @property {boolean} is_sample - Whether this is a sample/public quiz
 * @property {string} created_at - Creation timestamp
 * @property {Question[]} [questions] - Array of questions (loaded separately)
 */

/**
 * @typedef {Object} QuestionBase
 * @property {string} id - Unique question ID
 * @property {string} quiz_id - Parent quiz ID
 * @property {number} order - Question order in quiz
 * @property {string} type - Question type
 */

/**
 * @typedef {Object} MultipleChoiceQuestion
 * @property {'multiple-choice'} type
 * @property {string} question - Question text
 * @property {string[]} options - Array of answer options
 * @property {number} correctAnswer - Index of correct answer (0-based)
 * @property {string} [explanation] - Explanation for the answer
 */

/**
 * @typedef {Object} FillInBlankQuestion
 * @property {'fill-in-the-blank'} type
 * @property {string} question - Question text with blank (use ___ for blank)
 * @property {string[]} correctAnswers - Array of acceptable answers
 * @property {string} [explanation] - Explanation for the answer
 */

/**
 * @typedef {Object} TrueFalseQuestion
 * @property {'true-false'} type
 * @property {string} question - Question text
 * @property {boolean} correctAnswer - True or false
 * @property {string} [explanation] - Explanation for the answer
 */

/**
 * @typedef {Object} MatchingQuestion
 * @property {'matching'} type
 * @property {string} question - Question text/instructions
 * @property {Array<{left: string, right: string}>} pairs - Pairs to match
 * @property {string} [explanation] - Explanation for the answer
 */

/**
 * @typedef {Object} ListeningQuestion
 * @property {'listening'} type
 * @property {string} question - Question text
 * @property {string} audioText - Text to be read by TTS
 * @property {string} langCode - Language code (e.g., 'en-US', 'es-ES')
 * @property {string[]} options - Array of answer options
 * @property {number} correctAnswer - Index of correct answer (0-based)
 * @property {string} [explanation] - Explanation for the answer
 */

/**
 * @typedef {MultipleChoiceQuestion|FillInBlankQuestion|TrueFalseQuestion|MatchingQuestion|ListeningQuestion} Question
 */

/**
 * @typedef {Object} QuizSession
 * @property {string} quizId - Quiz ID
 * @property {number} currentQuestionIndex - Current question index
 * @property {Object.<number, any>} answers - User answers by question index
 * @property {number} score - Current score
 * @property {boolean} completed - Whether quiz is completed
 * @property {number} startTime - Session start timestamp
 * @property {number[]} [mistakeIndices] - Indices of incorrectly answered questions
 */

// ============================================================================
// WORKOUT TYPES
// ============================================================================

/**
 * @typedef {Object} Workout
 * @property {string} id - Unique workout ID
 * @property {string} user_id - Owner's user ID
 * @property {string} title - Workout title
 * @property {string} description - Workout description
 * @property {boolean} is_sample - Whether this is a sample/public workout
 * @property {string} created_at - Creation timestamp
 * @property {Phase[]} [phases] - Array of phases (loaded separately)
 */

/**
 * @typedef {Object} Phase
 * @property {string} id - Unique phase ID
 * @property {string} workout_id - Parent workout ID
 * @property {number} order - Phase order in workout
 * @property {string} name - Phase name (e.g., "Rozgrzewka", "Trening główny")
 * @property {Exercise[]} [exercises] - Array of exercises (loaded separately)
 */

/**
 * @typedef {Object} ExerciseBase
 * @property {string} name - Exercise name
 * @property {string} description - Detailed description
 * @property {string} [details] - Additional details/technique tips
 * @property {string} [gif] - URL to GIF/image (optional)
 */

/**
 * @typedef {ExerciseBase & {type: 'time', duration: number}} TimeExercise
 * @typedef {ExerciseBase & {type: 'reps', reps: number, sets?: number}} RepsExercise
 * @typedef {TimeExercise|RepsExercise} Exercise
 */

/**
 * @typedef {Object} WorkoutSession
 * @property {string} workoutId - Workout ID
 * @property {number} currentPhaseIndex - Current phase index
 * @property {number} currentExerciseIndex - Current exercise index
 * @property {boolean} completed - Whether workout is completed
 * @property {number} startTime - Session start timestamp
 * @property {boolean} isPaused - Whether workout is paused
 */

// ============================================================================
// LISTENING TYPES
// ============================================================================

/**
 * @typedef {Object} ListeningSet
 * @property {string} id - Unique set ID
 * @property {string} user_id - Owner's user ID
 * @property {string} title - Set title
 * @property {string} description - Set description
 * @property {string} lang1_code - First language code (e.g., 'pl-PL')
 * @property {string} lang2_code - Second language code (e.g., 'es-ES')
 * @property {LanguagePair[]} content - Array of language pairs
 * @property {boolean} is_sample - Whether this is a sample/public set
 * @property {string} created_at - Creation timestamp
 */

/**
 * @typedef {Object} LanguagePair
 * @property {string} pl - Text in first language (key matches lang1_code)
 * @property {string} es - Text in second language (key matches lang2_code)
 * Note: Keys are dynamic based on language codes
 */

/**
 * @typedef {Object} ListeningSession
 * @property {string} setId - Listening set ID
 * @property {number} currentIndex - Current pair index
 * @property {boolean} isPlaying - Whether audio is playing
 * @property {boolean} isLooping - Whether looping is enabled
 * @property {boolean} isReversed - Whether language order is reversed
 * @property {number} [lastPlayedIndex] - Last played pair index
 */

// ============================================================================
// UI & NAVIGATION TYPES
// ============================================================================

/**
 * @typedef {'quizzes'|'workouts'|'listening'|'more'} TabName
 */

/**
 * @typedef {Object} NavigationState
 * @property {TabName} currentTab - Currently active tab
 * @property {string|null} currentView - Current view/subpage
 * @property {Object.<string, any>} viewParams - Parameters for current view
 */

/**
 * @typedef {Object} UIState
 * @property {boolean} isLoading - Global loading state
 * @property {boolean} isSoundEnabled - Whether sound effects are enabled
 * @property {string|null} errorMessage - Current error message
 * @property {string|null} successMessage - Current success message
 */

// ============================================================================
// DATA SERVICE TYPES
// ============================================================================

/**
 * @typedef {Object} DataServiceResponse
 * @property {any} [data] - Response data
 * @property {Error|null} error - Error object if operation failed
 * @property {number} [count] - Count of items (for list operations)
 */

/**
 * @typedef {Object} ImportResult
 * @property {boolean} success - Whether import was successful
 * @property {string} [id] - ID of imported item
 * @property {string} [message] - Success/error message
 * @property {Error} [error] - Error object if import failed
 */

// ============================================================================
// AI GENERATOR TYPES
// ============================================================================

/**
 * @typedef {'quiz'|'workout'|'listening'} ContentType
 */

/**
 * @typedef {Object} AIGenerateRequest
 * @property {ContentType} type - Type of content to generate
 * @property {string} prompt - User's prompt/description
 * @property {Object} [options] - Additional generation options
 * @property {string} [options.language] - Target language
 * @property {number} [options.questionCount] - Number of questions (for quizzes)
 * @property {string} [options.difficulty] - Difficulty level
 */

/**
 * @typedef {Object} AIGenerateResponse
 * @property {boolean} success - Whether generation was successful
 * @property {Quiz|Workout|ListeningSet} [data] - Generated content
 * @property {string} [error] - Error message if generation failed
 * @property {number} [tokensUsed] - Number of tokens used
 */

// ============================================================================
// STORAGE TYPES
// ============================================================================

/**
 * @typedef {Object} StorageKeys
 * @property {'currentTab'} CURRENT_TAB
 * @property {'soundEnabled'} SOUND_ENABLED
 * @property {'quizSession_'} QUIZ_SESSION_PREFIX
 * @property {'workoutSession_'} WORKOUT_SESSION_PREFIX
 * @property {'listeningSession_'} LISTENING_SESSION_PREFIX
 */

// ============================================================================
// SUPABASE TYPES
// ============================================================================

/**
 * @typedef {Object} SupabaseClient
 * @property {Object} auth - Auth methods
 * @property {Function} from - Query builder
 * @property {Object} storage - Storage methods
 */

/**
 * @typedef {Object} SupabaseError
 * @property {string} message - Error message
 * @property {number} [status] - HTTP status code
 * @property {string} [code] - Error code
 */

// ============================================================================
// EVENT TYPES
// ============================================================================

/**
 * @typedef {Object} CustomEventMap
 * @property {CustomEvent<{tab: TabName}>} tabChange - Tab changed event
 * @property {CustomEvent<{user: User}>} authStateChange - Auth state changed
 * @property {CustomEvent<{quizId: string, completed: boolean}>} quizComplete - Quiz completed
 * @property {CustomEvent<{workoutId: string, completed: boolean}>} workoutComplete - Workout completed
 * @property {CustomEvent<{message: string}>} showToast - Show toast notification
 */

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether validation passed
 * @property {string[]} errors - Array of error messages
 */

/**
 * @typedef {Object} PaginationParams
 * @property {number} page - Current page (0-based)
 * @property {number} pageSize - Items per page
 * @property {string} [sortBy] - Field to sort by
 * @property {'asc'|'desc'} [sortOrder] - Sort order
 */

/**
 * @typedef {Object} FilterParams
 * @property {string} [search] - Search query
 * @property {boolean} [includeSamples] - Include sample content
 * @property {string[]} [tags] - Filter by tags
 */

// ============================================================================
// AUDIO TYPES
// ============================================================================

/**
 * @typedef {Object} AudioConfig
 * @property {number} volume - Volume level (0-1)
 * @property {number} rate - Speech rate (0.1-10)
 * @property {number} pitch - Speech pitch (0-2)
 * @property {string} voice - Voice name/ID
 */

/**
 * @typedef {Object} TTSOptions
 * @property {string} text - Text to speak
 * @property {string} lang - Language code
 * @property {number} [rate] - Speech rate
 * @property {number} [pitch] - Speech pitch
 * @property {number} [volume] - Volume level
 */

// ============================================================================
// KNOWLEDGE BASE TYPES
// ============================================================================

/**
 * @typedef {Object} KnowledgeBaseArticle
 * @property {string} id - Unique article ID (UUID)
 * @property {string} title - Article title
 * @property {string} slug - URL-friendly identifier (e.g., "jak-zaczac-trening")
 * @property {string} [description] - Short description (meta description)
 * @property {string} content - Article content (HTML from WYSIWYG editor)
 * @property {string} [category] - Category (e.g., "Fitness", "Języki", "Quizy")
 * @property {string[]} [tags] - Tags array for better search
 * @property {string} [icon] - Emoji or icon
 * @property {boolean} is_published - Whether article is published
 * @property {boolean} featured - Whether article is featured (shown at top)
 * @property {string} [author_id] - Author's user ID
 * @property {string} created_at - Creation timestamp
 * @property {string} updated_at - Last update timestamp
 * @property {number} view_count - View count
 */

/**
 * @typedef {Object} KnowledgeBaseFilters
 * @property {string} [category] - Filter by category
 * @property {string[]} [tags] - Filter by tags
 * @property {boolean} [featured] - Filter featured articles
 * @property {string} [search] - Search query (title, description, content)
 * @property {'newest'|'oldest'|'popular'|'title'} [sortBy] - Sort order
 * @property {number} [limit] - Limit results
 * @property {number} [offset] - Offset for pagination
 */

/**
 * @typedef {Object} KnowledgeBaseArticleInput
 * @property {string} title - Article title
 * @property {string} slug - URL-friendly identifier
 * @property {string} [description] - Short description
 * @property {string} content - Article content (HTML)
 * @property {string} [category] - Category
 * @property {string[]} [tags] - Tags array
 * @property {string} [icon] - Emoji or icon
 * @property {boolean} [is_published] - Whether article is published (default: true)
 * @property {boolean} [featured] - Whether article is featured (default: false)
 */

// ============================================================================
// FEATURE FLAGS
// ============================================================================

/**
 * @typedef {Object} FeatureFlags
 * @property {boolean} enableAIGenerator - Enable AI content generator
 * @property {boolean} enableListening - Enable listening feature
 * @property {boolean} enableKnowledgeBase - Enable knowledge base feature
 * @property {boolean} enableOfflineMode - Enable offline mode
 * @property {boolean} enableAnalytics - Enable analytics tracking
 */

// Export empty object to make this a module
export {};
