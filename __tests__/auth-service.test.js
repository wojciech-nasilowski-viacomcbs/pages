/**
 * @jest-environment jsdom
 */

// Mock the supabase-client module BEFORE importing anything
jest.mock('../js/supabase-client.js', () => ({
  supabaseClient: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      onAuthStateChange: jest.fn(),
      getUser: jest.fn(),
      getSession: jest.fn()
    },
    rpc: jest.fn()
  },
  getCurrentUser: jest.fn(),
  isLoggedIn: jest.fn(),
  getSession: jest.fn()
}));

// Now import modules (after mocking)
import authService from '../js/auth-service.js';
import { supabaseClient, getCurrentUser, isLoggedIn } from '../js/supabase-client.js';

const {
  signUp,
  signIn,
  signOut,
  resetPassword,
  onAuthStateChange,
  getCurrentUser: getUser,
  isLoggedIn: checkLoggedIn,
  getUserRole,
  isAdmin
} = authService;

// Setup global mocks
beforeAll(() => {
  global.window = global;
  // Mock window.location (JSDOM doesn't allow direct assignment)
  delete global.window.location;
  global.window.location = { origin: 'http://localhost' };
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Auth Service', () => {
  // ============================================
  // SIGN UP
  // ============================================

  describe('signUp', () => {
    it('should successfully register a new user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2025-01-01'
      };

      supabaseClient.auth.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const result = await signUp('test@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(result.message).toContain('Rejestracja udana');
      expect(supabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });

    it('should handle registration errors', async () => {
      supabaseClient.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'Email already registered' }
      });

      const result = await signUp('existing@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email already registered');
      expect(result.user).toBeUndefined();
    });

    it('should handle weak password error', async () => {
      supabaseClient.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'Password should be at least 6 characters' }
      });

      const result = await signUp('test@example.com', '123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('6 characters');
    });

    it('should handle network errors during signup', async () => {
      supabaseClient.auth.signUp.mockRejectedValue(new Error('Network error'));

      const result = await signUp('test@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  // ============================================
  // SIGN IN
  // ============================================

  describe('signIn', () => {
    it('should successfully sign in a user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com'
      };
      const mockSession = {
        access_token: 'token-abc',
        refresh_token: 'refresh-xyz'
      };

      supabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      });

      const result = await signIn('test@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(result.session).toEqual(mockSession);
      expect(result.message).toContain('Zalogowano pomyślnie');
      expect(supabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });

    it('should handle invalid credentials', async () => {
      supabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' }
      });

      const result = await signIn('wrong@example.com', 'wrongpass');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid login credentials');
      expect(result.user).toBeUndefined();
      expect(result.session).toBeUndefined();
    });

    it('should handle email not confirmed error', async () => {
      supabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email not confirmed' }
      });

      const result = await signIn('test@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Email not confirmed');
    });

    it('should handle network errors during signin', async () => {
      supabaseClient.auth.signInWithPassword.mockRejectedValue(new Error('Connection timeout'));

      const result = await signIn('test@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Connection timeout');
    });
  });

  // ============================================
  // SIGN OUT
  // ============================================

  describe('signOut', () => {
    it('should successfully sign out a user', async () => {
      supabaseClient.auth.signOut.mockResolvedValue({
        error: null
      });

      const result = await signOut();

      expect(result.success).toBe(true);
      expect(result.message).toContain('Wylogowano pomyślnie');
      expect(supabaseClient.auth.signOut).toHaveBeenCalled();
    });

    it('should handle sign out errors', async () => {
      supabaseClient.auth.signOut.mockResolvedValue({
        error: { message: 'Session expired' }
      });

      const result = await signOut();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Session expired');
    });

    it('should handle network errors during signout', async () => {
      supabaseClient.auth.signOut.mockRejectedValue(new Error('Network error'));

      const result = await signOut();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  // ============================================
  // PASSWORD RESET
  // ============================================

  describe('resetPassword', () => {
    it('should successfully send password reset email', async () => {
      supabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null
      });

      const result = await resetPassword('test@example.com');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Link do resetowania hasła');
      expect(supabaseClient.auth.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com', {
        redirectTo: 'http://localhost/reset-password'
      });
    });

    it('should handle invalid email error', async () => {
      supabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
        data: null,
        error: { message: 'Invalid email' }
      });

      const result = await resetPassword('invalid-email');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email');
    });

    it('should handle user not found error', async () => {
      supabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
        data: null,
        error: { message: 'User not found' }
      });

      const result = await resetPassword('nonexistent@example.com');

      expect(result.success).toBe(false);
      expect(result.error).toContain('User not found');
    });
  });

  // ============================================
  // AUTH STATE CHANGE
  // ============================================

  describe('onAuthStateChange', () => {
    it('should subscribe to auth state changes', () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();
      const mockSubscription = { unsubscribe: mockUnsubscribe };

      supabaseClient.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: mockSubscription }
      });

      const subscription = onAuthStateChange(mockCallback);

      expect(supabaseClient.auth.onAuthStateChange).toHaveBeenCalled();
      expect(subscription).toBe(mockSubscription);
    });

    it('should call callback when auth state changes', () => {
      const mockCallback = jest.fn();
      let authChangeHandler;

      supabaseClient.auth.onAuthStateChange.mockImplementation(handler => {
        authChangeHandler = handler;
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      });

      onAuthStateChange(mockCallback);

      // Simulate auth state change
      const mockSession = { user: { email: 'test@example.com' } };
      authChangeHandler('SIGNED_IN', mockSession);

      expect(mockCallback).toHaveBeenCalledWith('SIGNED_IN', mockSession);
    });
  });

  // ============================================
  // GET USER & CHECK LOGGED IN
  // ============================================

  describe('getUser', () => {
    it('should return current user', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      getCurrentUser.mockResolvedValue(mockUser);

      const user = await getUser();

      expect(user).toEqual(mockUser);
      expect(getCurrentUser).toHaveBeenCalled();
    });
  });

  describe('checkLoggedIn', () => {
    it('should return true when user is logged in', async () => {
      isLoggedIn.mockResolvedValue(true);

      const result = await checkLoggedIn();

      expect(result).toBe(true);
      expect(isLoggedIn).toHaveBeenCalled();
    });

    it('should return false when user is not logged in', async () => {
      isLoggedIn.mockResolvedValue(false);

      const result = await checkLoggedIn();

      expect(result).toBe(false);
    });
  });

  // ============================================
  // GET USER ROLE
  // ============================================

  describe('getUserRole', () => {
    it('should return "user" for non-authenticated users', async () => {
      getCurrentUser.mockResolvedValue(null);

      const role = await getUserRole();

      expect(role).toBe('user');
    });

    it('should return "admin" for super admin from JWT', async () => {
      const mockUser = { id: 'user-123', email: 'admin@example.com' };
      const mockSession = {
        user: { id: 'user-123', is_super_admin: true }
      };

      getCurrentUser.mockResolvedValue(mockUser);
      supabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      const role = await getUserRole();

      expect(role).toBe('admin');
    });

    it('should return "user" for regular user from JWT', async () => {
      const mockUser = { id: 'user-123', email: 'user@example.com' };
      const mockSession = {
        user: { id: 'user-123', is_super_admin: false }
      };

      getCurrentUser.mockResolvedValue(mockUser);
      supabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      const role = await getUserRole();

      expect(role).toBe('user');
    });

    it('should query RPC when is_super_admin not in JWT', async () => {
      const mockUser = { id: 'user-123', email: 'admin@example.com' };
      const mockSession = { user: { id: 'user-123' } }; // No is_super_admin

      getCurrentUser.mockResolvedValue(mockUser);
      supabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });
      supabaseClient.rpc.mockResolvedValue({
        data: true,
        error: null
      });

      const role = await getUserRole();

      expect(supabaseClient.rpc).toHaveBeenCalledWith('is_user_admin', {
        user_id: 'user-123'
      });
      expect(role).toBe('admin');
    });

    it('should fallback to raw_user_meta_data when RPC fails', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'admin@example.com',
        raw_user_meta_data: { is_super_admin: true }
      };
      const mockSession = { user: { id: 'user-123' } };

      getCurrentUser.mockResolvedValue(mockUser);
      supabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });
      supabaseClient.rpc.mockResolvedValue({
        data: null,
        error: { message: 'RPC not available' }
      });

      const role = await getUserRole();

      expect(role).toBe('admin');
    });

    it('should return "user" on errors', async () => {
      getCurrentUser.mockRejectedValue(new Error('Database error'));

      const role = await getUserRole();

      expect(role).toBe('user');
    });

    it('should accept user parameter to avoid refetching', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockSession = {
        user: { id: 'user-123', is_super_admin: false }
      };

      supabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      const role = await getUserRole(mockUser);

      expect(role).toBe('user');
      expect(getCurrentUser).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // IS ADMIN
  // ============================================

  describe('isAdmin', () => {
    it('should return true for admin users', async () => {
      const mockUser = { id: 'user-123', email: 'admin@example.com' };
      const mockSession = {
        user: { id: 'user-123', is_super_admin: true }
      };

      getCurrentUser.mockResolvedValue(mockUser);
      supabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      const result = await isAdmin();

      expect(result).toBe(true);
    });

    it('should return false for regular users', async () => {
      const mockUser = { id: 'user-123', email: 'user@example.com' };
      const mockSession = {
        user: { id: 'user-123', is_super_admin: false }
      };

      getCurrentUser.mockResolvedValue(mockUser);
      supabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      const result = await isAdmin();

      expect(result).toBe(false);
    });

    it('should return false for non-authenticated users', async () => {
      getCurrentUser.mockResolvedValue(null);

      const result = await isAdmin();

      expect(result).toBe(false);
    });

    it('should accept user parameter', async () => {
      const mockUser = { id: 'user-123', email: 'admin@example.com' };
      const mockSession = {
        user: { id: 'user-123', is_super_admin: true }
      };

      supabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      const result = await isAdmin(mockUser);

      expect(result).toBe(true);
      expect(getCurrentUser).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // EDGE CASES & SECURITY
  // ============================================

  describe('Edge Cases', () => {
    it('should handle empty email in signUp', async () => {
      supabaseClient.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'Email is required' }
      });

      const result = await signUp('', 'password123');

      expect(result.success).toBe(false);
    });

    it('should handle empty password in signIn', async () => {
      supabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Password is required' }
      });

      const result = await signIn('test@example.com', '');

      expect(result.success).toBe(false);
    });

    it('should handle malformed email in resetPassword', async () => {
      supabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
        data: null,
        error: { message: 'Invalid email format' }
      });

      const result = await resetPassword('not-an-email');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid email');
    });
  });
});
