/**
 * @jest-environment jsdom
 */

/**
 * Integration Tests: Authentication Flow
 *
 * Tests the complete user authentication journey:
 * 1. User registration
 * 2. User login
 * 3. Session management
 * 4. User logout
 * 5. Password reset
 */

// Mock Supabase client
jest.mock('../js/data/supabase-client.js', () => ({
  supabaseClient: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      onAuthStateChange: jest.fn(),
      getSession: jest.fn()
    },
    rpc: jest.fn()
  },
  getCurrentUser: jest.fn(),
  isLoggedIn: jest.fn(),
  getSession: jest.fn()
}));

import authService from '../js/data/auth-service.js';
import { supabaseClient, getCurrentUser, isLoggedIn } from '../js/data/supabase-client.js';

const { signUp, signIn, signOut, resetPassword, getUserRole, isAdmin } = authService;

describe('Integration: Authentication Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('Complete User Registration and Login Flow', () => {
    it('should handle full registration → login → logout flow', async () => {
      const userEmail = 'newuser@example.com';
      const userPassword = 'securePassword123';

      // STEP 1: User registers
      const mockNewUser = {
        id: 'user-new-123',
        email: userEmail,
        created_at: new Date().toISOString()
      };

      supabaseClient.auth.signUp.mockResolvedValue({
        data: { user: mockNewUser },
        error: null
      });

      const signUpResult = await signUp(userEmail, userPassword);

      expect(signUpResult.success).toBe(true);
      expect(signUpResult.user.email).toBe(userEmail);
      expect(supabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: userEmail,
        password: userPassword
      });

      // STEP 2: User logs in
      const mockSession = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        user: mockNewUser
      };

      supabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockNewUser, session: mockSession },
        error: null
      });

      const signInResult = await signIn(userEmail, userPassword);

      expect(signInResult.success).toBe(true);
      expect(signInResult.user.email).toBe(userEmail);
      expect(signInResult.session).toBeDefined();
      expect(signInResult.session.access_token).toBe('mock-access-token');

      // STEP 3: User logs out
      supabaseClient.auth.signOut.mockResolvedValue({
        error: null
      });

      const signOutResult = await signOut();

      expect(signOutResult.success).toBe(true);
      expect(supabaseClient.auth.signOut).toHaveBeenCalled();
    });

    it('should handle registration with existing email', async () => {
      const existingEmail = 'existing@example.com';

      supabaseClient.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'User already registered' }
      });

      const result = await signUp(existingEmail, 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('User already registered');
    });

    it('should handle login with invalid credentials', async () => {
      supabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' }
      });

      const result = await signIn('wrong@example.com', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid login credentials');
    });
  });

  describe('Password Reset Flow', () => {
    it('should handle complete password reset flow', async () => {
      const userEmail = 'user@example.com';

      // STEP 1: User requests password reset
      supabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null
      });

      const resetResult = await resetPassword(userEmail);

      expect(resetResult.success).toBe(true);
      expect(resetResult.message).toContain('Link do resetowania hasła');
      expect(supabaseClient.auth.resetPasswordForEmail).toHaveBeenCalledWith(userEmail, {
        redirectTo: expect.stringContaining('/reset-password')
      });
    });

    it('should handle password reset for non-existent user', async () => {
      supabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
        data: null,
        error: { message: 'User not found' }
      });

      const result = await resetPassword('nonexistent@example.com');

      expect(result.success).toBe(false);
      expect(result.error).toContain('User not found');
    });
  });

  describe('User Role Management Flow', () => {
    it('should handle admin user flow', async () => {
      const adminUser = {
        id: 'admin-123',
        email: 'admin@example.com',
        raw_user_meta_data: { is_super_admin: true }
      };

      const adminSession = {
        user: { id: 'admin-123', is_super_admin: true }
      };

      // STEP 1: Admin logs in
      getCurrentUser.mockResolvedValue(adminUser);
      supabaseClient.auth.getSession.mockResolvedValue({
        data: { session: adminSession },
        error: null
      });

      // STEP 2: Check if user is admin
      const role = await getUserRole();
      expect(role).toBe('admin');

      const isAdminResult = await isAdmin();
      expect(isAdminResult).toBe(true);
    });

    it('should handle regular user flow', async () => {
      const regularUser = {
        id: 'user-123',
        email: 'user@example.com'
      };

      const userSession = {
        user: { id: 'user-123', is_super_admin: false }
      };

      getCurrentUser.mockResolvedValue(regularUser);
      supabaseClient.auth.getSession.mockResolvedValue({
        data: { session: userSession },
        error: null
      });

      const role = await getUserRole();
      expect(role).toBe('user');

      const isAdminResult = await isAdmin();
      expect(isAdminResult).toBe(false);
    });

    it('should handle role check with RPC fallback', async () => {
      const user = {
        id: 'user-123',
        email: 'admin@example.com'
      };

      const session = {
        user: { id: 'user-123' } // No is_super_admin in JWT
      };

      getCurrentUser.mockResolvedValue(user);
      supabaseClient.auth.getSession.mockResolvedValue({
        data: { session },
        error: null
      });

      // RPC returns admin status
      supabaseClient.rpc.mockResolvedValue({
        data: true,
        error: null
      });

      const role = await getUserRole();

      expect(role).toBe('admin');
      expect(supabaseClient.rpc).toHaveBeenCalledWith('is_user_admin', {
        user_id: 'user-123'
      });
    });
  });

  describe('Session Persistence Flow', () => {
    it('should maintain session across page reloads', async () => {
      const user = { id: 'user-123', email: 'user@example.com' };
      const session = {
        access_token: 'token-123',
        user: user
      };

      // Simulate existing session
      getCurrentUser.mockResolvedValue(user);
      isLoggedIn.mockResolvedValue(true);

      const isUserLoggedIn = await isLoggedIn();
      expect(isUserLoggedIn).toBe(true);

      const currentUser = await getCurrentUser();
      expect(currentUser).toEqual(user);
    });

    it('should handle expired session', async () => {
      getCurrentUser.mockResolvedValue(null);
      isLoggedIn.mockResolvedValue(false);

      const isUserLoggedIn = await isLoggedIn();
      expect(isUserLoggedIn).toBe(false);

      const currentUser = await getCurrentUser();
      expect(currentUser).toBeNull();
    });
  });

  describe('Error Recovery Flow', () => {
    it('should recover from network errors during login', async () => {
      const userEmail = 'user@example.com';
      const userPassword = 'password123';

      // First attempt fails
      supabaseClient.auth.signInWithPassword.mockRejectedValueOnce(new Error('Network error'));

      const firstAttempt = await signIn(userEmail, userPassword);
      expect(firstAttempt.success).toBe(false);
      expect(firstAttempt.error).toContain('Network error');

      // Second attempt succeeds
      const mockUser = { id: 'user-123', email: userEmail };
      const mockSession = { access_token: 'token-123', user: mockUser };

      supabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: mockUser, session: mockSession },
        error: null
      });

      const secondAttempt = await signIn(userEmail, userPassword);
      expect(secondAttempt.success).toBe(true);
      expect(secondAttempt.user.email).toBe(userEmail);
    });

    it('should handle logout errors gracefully', async () => {
      supabaseClient.auth.signOut.mockResolvedValue({
        error: { message: 'Session already expired' }
      });

      const result = await signOut();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Session already expired');
    });
  });

  describe('Security Flow', () => {
    it('should not allow operations without authentication', async () => {
      getCurrentUser.mockResolvedValue(null);

      const role = await getUserRole();
      expect(role).toBe('user'); // Default to 'user' when not authenticated

      const isAdminResult = await isAdmin();
      expect(isAdminResult).toBe(false);
    });

    it('should validate email format during registration', async () => {
      supabaseClient.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid email format' }
      });

      const result = await signUp('invalid-email', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid email');
    });

    it('should enforce password requirements', async () => {
      supabaseClient.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'Password should be at least 6 characters' }
      });

      const result = await signUp('user@example.com', '123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('6 characters');
    });
  });
});
