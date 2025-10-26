// ============================================
// AUTHENTICATION SERVICE
// Handles user authentication with Supabase
// ============================================

(function() {
'use strict';

const authService = {
    
    /**
     * Register a new user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} Result with user data or error
     */
    async signUp(email, password) {
        try {
            const { data, error } = await supabaseClient.auth.signUp({
                email: email,
                password: password,
            });
            
            if (error) throw error;
            
            return {
                success: true,
                user: data.user,
                message: 'Rejestracja udana! Sprawdź swoją skrzynkę email, aby potwierdzić konto.'
            };
        } catch (error) {
            console.error('Sign up error:', error);
            return {
                success: false,
                error: error.message || 'Błąd podczas rejestracji'
            };
        }
    },
    
    /**
     * Sign in an existing user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} Result with user data or error
     */
    async signIn(email, password) {
        try {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password,
            });
            
            if (error) throw error;
            
            return {
                success: true,
                user: data.user,
                session: data.session,
                message: 'Zalogowano pomyślnie!'
            };
        } catch (error) {
            console.error('Sign in error:', error);
            return {
                success: false,
                error: error.message || 'Błąd podczas logowania'
            };
        }
    },
    
    /**
     * Sign out the current user
     * @returns {Promise<Object>} Result
     */
    async signOut() {
        try {
            const { error } = await supabaseClient.auth.signOut();
            
            if (error) throw error;
            
            return {
                success: true,
                message: 'Wylogowano pomyślnie!'
            };
        } catch (error) {
            console.error('Sign out error:', error);
            return {
                success: false,
                error: error.message || 'Błąd podczas wylogowywania'
            };
        }
    },
    
    /**
     * Send password reset email
     * @param {string} email - User email
     * @returns {Promise<Object>} Result
     */
    async resetPassword(email) {
        try {
            const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/reset-password',
            });
            
            if (error) throw error;
            
            return {
                success: true,
                message: 'Link do resetowania hasła został wysłany na Twój email.'
            };
        } catch (error) {
            console.error('Password reset error:', error);
            return {
                success: false,
                error: error.message || 'Błąd podczas resetowania hasła'
            };
        }
    },
    
    /**
     * Listen to authentication state changes
     * @param {Function} callback - Function to call when auth state changes
     * @returns {Object} Subscription object with unsubscribe method
     */
    onAuthStateChange(callback) {
        const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event, session?.user?.email);
            callback(event, session);
        });
        
        return subscription;
    },
    
    /**
     * Get current user
     * @returns {Promise<Object|null>} Current user or null
     */
    async getCurrentUser() {
        return await getCurrentUser();
    },
    
    /**
     * Check if user is logged in
     * @returns {Promise<boolean>}
     */
    async isLoggedIn() {
        return await isLoggedIn();
    }
};

// Export for use in other modules
window.authService = authService;

console.log('✅ Auth service initialized');

})(); // End of IIFE

