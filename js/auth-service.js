/**
 * @fileoverview Authentication service for user management
 * Handles user registration, login, logout, and password reset using Supabase Auth
 * @module auth-service
 */

/** @typedef {import('./types.js').User} User */
/** @typedef {import('./types.js').Session} Session */
/** @typedef {import('./types.js').AuthResponse} AuthResponse */
/** @typedef {import('./types.js').UserRole} UserRole */

// ============================================
// AUTHENTICATION SERVICE
// Handles user authentication with Supabase
// ============================================

(function() {
'use strict';

/**
 * Authentication service object
 * @namespace authService
 */
const authService = {
    
    /**
     * Register a new user
     * @param {string} email - User email address
     * @param {string} password - User password (min 6 characters)
     * @returns {Promise<{success: boolean, user?: User, message?: string, error?: string}>} Result with user data or error
     * @example
     * const result = await authService.signUp('user@example.com', 'password123');
     * if (result.success) {
     *   console.log('User registered:', result.user.email);
     * }
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
     * @param {string} email - User email address
     * @param {string} password - User password
     * @returns {Promise<{success: boolean, user?: User, session?: Session, message?: string, error?: string}>} Result with user data or error
     * @example
     * const result = await authService.signIn('user@example.com', 'password123');
     * if (result.success) {
     *   console.log('Logged in as:', result.user.email);
     * }
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
     * @returns {Promise<{success: boolean, message?: string, error?: string}>} Result
     * @example
     * const result = await authService.signOut();
     * if (result.success) {
     *   console.log('User logged out');
     * }
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
     * @param {string} email - User email address
     * @returns {Promise<{success: boolean, message?: string, error?: string}>} Result
     * @example
     * const result = await authService.resetPassword('user@example.com');
     * if (result.success) {
     *   console.log('Reset email sent');
     * }
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
     * @param {function(string, Session|null): void} callback - Function to call when auth state changes
     * @returns {{unsubscribe: function(): void}} Subscription object with unsubscribe method
     * @example
     * const subscription = authService.onAuthStateChange((event, session) => {
     *   console.log('Auth event:', event, session?.user?.email);
     * });
     * // Later: subscription.unsubscribe();
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
     * @returns {Promise<User|null>} Current user or null
     * @example
     * const user = await authService.getCurrentUser();
     * if (user) {
     *   console.log('Current user:', user.email);
     * }
     */
    async getCurrentUser() {
        return await getCurrentUser();
    },
    
    /**
     * Check if user is logged in
     * @returns {Promise<boolean>} True if user is authenticated
     * @example
     * if (await authService.isLoggedIn()) {
     *   // Show authenticated content
     * }
     */
    async isLoggedIn() {
        return await isLoggedIn();
    },
    
    /**
     * Get user role from is_super_admin field
     * @param {User|null} [user] - User object (if not provided, fetches current user)
     * @returns {Promise<UserRole>} User role ('admin' or 'user')
     * @example
     * const role = await authService.getUserRole();
     * console.log('User role:', role); // 'admin' or 'user'
     */
    async getUserRole(user = null) {
        try {
            const currentUser = user || await this.getCurrentUser();
            if (!currentUser) {
                return 'user'; // Default role for non-authenticated users
            }
            
            // IMPORTANT: is_super_admin is NOT automatically included in JWT by default
            // We need to query it directly from auth.users table using Supabase Admin API
            // or use a custom RPC function
            
            // Try to get from session first (in case it's in JWT)
            const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
            
            if (sessionError) {
                console.warn('Could not get session for role check:', sessionError);
            }
            
            // Check if is_super_admin is in JWT (some Supabase configs include it)
            let isSuperAdmin = session?.user?.is_super_admin;
            
            // If not in JWT, query directly from database using RPC
            if (isSuperAdmin === undefined) {
                try {
                    // Call RPC function to check admin status
                    const { data, error } = await supabaseClient.rpc('is_user_admin', {
                        user_id: currentUser.id
                    });
                    
                    if (error) {
                        console.warn('RPC is_user_admin not available, checking raw_user_meta_data:', error);
                        // Fallback: check raw_user_meta_data (if available)
                        isSuperAdmin = currentUser.raw_user_meta_data?.is_super_admin || false;
                    } else {
                        isSuperAdmin = data === true;
                    }
                } catch (rpcError) {
                    console.warn('Error calling is_user_admin RPC:', rpcError);
                    isSuperAdmin = false;
                }
            }
            
            const role = isSuperAdmin === true ? 'admin' : 'user';
            
            console.log('🔐 Role check:', {
                userId: currentUser.id,
                email: currentUser.email,
                is_super_admin: isSuperAdmin,
                role: role
            });
            
            return role;
        } catch (error) {
            console.error('Error getting user role:', error);
            return 'user'; // Default to 'user' on error
        }
    },
    
    /**
     * Check if current user is admin
     * @param {User|null} [user] - User object (if not provided, fetches current user)
     * @returns {Promise<boolean>} True if user is admin
     * @example
     * if (await authService.isAdmin()) {
     *   // Show admin features
     * }
     */
    async isAdmin(user = null) {
        const role = await this.getUserRole(user);
        return role === 'admin';
    }
};

// Export for use in other modules
window.authService = authService;

console.log('✅ Auth service initialized');

})(); // End of IIFE

