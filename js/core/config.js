// ============================================
// APPLICATION CONFIGURATION
// ⚠️ This file contains sensitive data and should NOT be committed to Git
// ============================================

window.APP_CONFIG = {
  SUPABASE_URL: 'https://gygijehqwtnmnoopwqyg.supabase.co',
  SUPABASE_ANON_KEY:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5Z2lqZWhxd3RubW5vb3B3cXlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MzkzODIsImV4cCI6MjA3NzAxNTM4Mn0.ocOoAYTRPcMF5dP243zPM42rWkLqnHVbgsBtp4jY50g',

  // OpenRouter API Key for AI Generator
  // Get your key at: https://openrouter.ai/keys
  OPENROUTER_API_KEY: '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',

  // ============================================
  // FEATURE FLAGS
  // ============================================
  // Set to true to enable a feature, false to disable.
  // These can be overridden by Vercel environment variables.
  FEATURE_FLAGS: {
    // Main modules
    ENABLE_QUIZZES: true,
    ENABLE_WORKOUTS: true,
    ENABLE_LISTENING: true,
    ENABLE_KNOWLEDGE_BASE: true,

    // Additional features
    ENABLE_FILE_IMPORT: true,
    ENABLE_AI_GENERATOR: true
  }
};
