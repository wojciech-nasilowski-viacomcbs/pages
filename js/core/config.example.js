// ============================================
// APPLICATION CONFIGURATION TEMPLATE
// Copy this file to config.js and fill in your actual values
// ============================================

window.APP_CONFIG = {
  SUPABASE_URL: 'YOUR_SUPABASE_PROJECT_URL',
  SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY',

  // OpenRouter API Key for AI Generator
  // Get your key at: https://openrouter.ai/keys
  // On Vercel: Set as environment variable OPENROUTER_API_KEY
  OPENROUTER_API_KEY: 'YOUR_OPENROUTER_API_KEY',

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
