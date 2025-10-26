// ============================================
// SUPABASE CLIENT CONFIGURATION
// ============================================

(function() {
'use strict';

// Supabase configuration
// Replace these with your actual values
const SUPABASE_URL = 'https://gygijehqwtnmnoopwqyg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5Z2lqZWhxd3RubW5vb3B3cXlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MzkzODIsImV4cCI6MjA3NzAxNTM4Mn0.ocOoAYTRPcMF5dP243zPM42rWkLqnHVbgsBtp4jY50g';

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

