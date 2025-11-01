/**
 * @fileoverview Supabase client initialization and authentication helpers
 * This module initializes the Supabase client and provides basic auth helper functions
 * @module supabase-client
 */

/** @typedef {import('./types.js').User} User */
/** @typedef {import('./types.js').Session} Session */
/** @typedef {import('./types.js').SupabaseClient} SupabaseClient */

// ============================================
// SUPABASE CLIENT CONFIGURATION
// ============================================

// Supabase configuration from config.js
const SUPABASE_URL = window.APP_CONFIG?.SUPABASE_URL;
const SUPABASE_ANON_KEY = window.APP_CONFIG?.SUPABASE_ANON_KEY;

// Validate configuration
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    '❌ Missing Supabase configuration! Make sure js/config.js exists and contains valid values.'
  );
  throw new Error(
    'Supabase configuration missing. Copy js/config.example.js to js/config.js and fill in your values.'
  );
}

/**
 * Supabase client instance
 * @type {SupabaseClient}
 */
export const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// AUTHENTICATION HELPERS
// ============================================

/**
 * Get the current authenticated user
 * @returns {Promise<User|null>} User object or null if not authenticated
 * @example
 * const user = await getCurrentUser();
 * if (user) {
 *   console.log('Logged in as:', user.email);
 * }
 */
export async function getCurrentUser() {
  try {
    const {
      data: { user },
      error
    } = await supabaseClient.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Check if user is currently logged in
 * @returns {Promise<boolean>} True if user is authenticated
 * @example
 * if (await isLoggedIn()) {
 *   // Show user content
 * }
 */
export async function isLoggedIn() {
  const user = await getCurrentUser();
  return user !== null;
}

/**
 * Get the current session
 * @returns {Promise<Session|null>} Session object or null if not authenticated
 * @example
 * const session = await getSession();
 * if (session) {
 *   console.log('Access token:', session.access_token);
 * }
 */
export async function getSession() {
  try {
    const {
      data: { session },
      error
    } = await supabaseClient.auth.getSession();
    if (error) throw error;
    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

console.log('✅ Supabase client initialized');
