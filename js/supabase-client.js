// ============================================
// SUPABASE CLIENT CONFIGURATION
// ============================================

(function() {
'use strict';

// Supabase configuration from config.js
const SUPABASE_URL = window.APP_CONFIG?.SUPABASE_URL;
const SUPABASE_ANON_KEY = window.APP_CONFIG?.SUPABASE_ANON_KEY;

// Validate configuration
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing Supabase configuration! Make sure js/config.js exists and contains valid values.');
    throw new Error('Supabase configuration missing. Copy js/config.example.js to js/config.js and fill in your values.');
}

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// AUTHENTICATION HELPERS
// ============================================

/**
 * Get the current authenticated user
 * @returns {Promise<Object|null>} User object or null if not authenticated
 */
async function getCurrentUser() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        return user;
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}

/**
 * Check if user is currently logged in
 * @returns {Promise<boolean>}
 */
async function isLoggedIn() {
    const user = await getCurrentUser();
    return user !== null;
}

/**
 * Get the current session
 * @returns {Promise<Object|null>}
 */
async function getSession() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        return session;
    } catch (error) {
        console.error('Error getting session:', error);
        return null;
    }
}

// ============================================
// EXPORTS
// ============================================

// Export for use in other modules
window.supabaseClient = supabase;
window.getCurrentUser = getCurrentUser;
window.isLoggedIn = isLoggedIn;
window.getSession = getSession;

console.log('✅ Supabase client initialized');

})(); // End of IIFE

