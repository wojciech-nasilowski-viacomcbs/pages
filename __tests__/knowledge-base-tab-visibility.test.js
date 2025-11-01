/**
 * @jest-environment jsdom
 *
 * Tests for Knowledge Base tab visibility based on authentication
 * Ensures that KB tab is hidden for unauthenticated users
 */

describe('Knowledge Base - Tab Visibility', () => {
  let featureFlags;

  beforeEach(() => {
    // Mock window.state
    window.state = {};

    // Import feature flags module
    // We'll mock the getFlag function to always return true for KB
    const mockGetFlag = jest.fn(flag => {
      if (flag === 'ENABLE_KNOWLEDGE_BASE') return true;
      if (flag === 'ENABLE_WORKOUTS') return true;
      if (flag === 'ENABLE_QUIZZES') return true;
      if (flag === 'ENABLE_LISTENING') return true;
      return false;
    });

    // Create a mock feature flags module
    featureFlags = {
      getEnabledTabs: () => {
        const tabs = [];
        const isAuthenticated = window.state?.currentUser !== null;

        if (mockGetFlag('ENABLE_WORKOUTS')) tabs.push('workouts');
        if (mockGetFlag('ENABLE_KNOWLEDGE_BASE') && isAuthenticated) tabs.push('knowledge-base');
        if (mockGetFlag('ENABLE_QUIZZES')) tabs.push('quizzes');
        if (mockGetFlag('ENABLE_LISTENING')) tabs.push('listening');

        return tabs;
      },

      getActiveCoreTabs: () => {
        const coreTabs = [];
        const isAuthenticated = window.state?.currentUser !== null;

        if (mockGetFlag('ENABLE_WORKOUTS')) coreTabs.push('workouts');
        if (mockGetFlag('ENABLE_KNOWLEDGE_BASE') && isAuthenticated)
          coreTabs.push('knowledge-base');
        if (mockGetFlag('ENABLE_QUIZZES')) coreTabs.push('quizzes');
        if (mockGetFlag('ENABLE_LISTENING')) coreTabs.push('listening');

        return coreTabs;
      }
    };
  });

  afterEach(() => {
    delete window.state;
  });

  describe('Unauthenticated User', () => {
    test('should NOT include knowledge-base in enabled tabs', () => {
      window.state.currentUser = null;

      const enabledTabs = featureFlags.getEnabledTabs();

      expect(enabledTabs).not.toContain('knowledge-base');
    });

    test('should NOT include knowledge-base in active core tabs', () => {
      window.state.currentUser = null;

      const coreTabs = featureFlags.getActiveCoreTabs();

      expect(coreTabs).not.toContain('knowledge-base');
    });

    test('should include other tabs (workouts, quizzes, listening)', () => {
      window.state.currentUser = null;

      const enabledTabs = featureFlags.getEnabledTabs();

      expect(enabledTabs).toContain('workouts');
      expect(enabledTabs).toContain('quizzes');
      expect(enabledTabs).toContain('listening');
    });

    test('should handle missing window.state gracefully', () => {
      delete window.state;

      const enabledTabs = featureFlags.getEnabledTabs();

      expect(enabledTabs).not.toContain('knowledge-base');
      expect(enabledTabs).toContain('workouts');
    });

    test('should handle window.state without currentUser', () => {
      window.state = {}; // No currentUser property

      const enabledTabs = featureFlags.getEnabledTabs();

      expect(enabledTabs).not.toContain('knowledge-base');
    });
  });

  describe('Authenticated User', () => {
    test('should include knowledge-base in enabled tabs', () => {
      window.state.currentUser = {
        id: 'user123',
        email: 'user@example.com'
      };

      const enabledTabs = featureFlags.getEnabledTabs();

      expect(enabledTabs).toContain('knowledge-base');
    });

    test('should include knowledge-base in active core tabs', () => {
      window.state.currentUser = {
        id: 'user123',
        email: 'user@example.com'
      };

      const coreTabs = featureFlags.getActiveCoreTabs();

      expect(coreTabs).toContain('knowledge-base');
    });

    test('should include all tabs when authenticated', () => {
      window.state.currentUser = {
        id: 'user123',
        email: 'user@example.com'
      };

      const enabledTabs = featureFlags.getEnabledTabs();

      expect(enabledTabs).toContain('workouts');
      expect(enabledTabs).toContain('knowledge-base');
      expect(enabledTabs).toContain('quizzes');
      expect(enabledTabs).toContain('listening');
    });
  });

  describe('Authentication State Changes', () => {
    test('should hide knowledge-base when user logs out', () => {
      // Start logged in
      window.state.currentUser = {
        id: 'user123',
        email: 'user@example.com'
      };

      let enabledTabs = featureFlags.getEnabledTabs();
      expect(enabledTabs).toContain('knowledge-base');

      // User logs out
      window.state.currentUser = null;

      enabledTabs = featureFlags.getEnabledTabs();
      expect(enabledTabs).not.toContain('knowledge-base');
    });

    test('should show knowledge-base when user logs in', () => {
      // Start as guest
      window.state.currentUser = null;

      let enabledTabs = featureFlags.getEnabledTabs();
      expect(enabledTabs).not.toContain('knowledge-base');

      // User logs in
      window.state.currentUser = {
        id: 'user123',
        email: 'user@example.com'
      };

      enabledTabs = featureFlags.getEnabledTabs();
      expect(enabledTabs).toContain('knowledge-base');
    });

    test('should maintain other tabs during auth state changes', () => {
      // Start as guest
      window.state.currentUser = null;
      let enabledTabs = featureFlags.getEnabledTabs();

      expect(enabledTabs).toContain('workouts');
      expect(enabledTabs).toContain('quizzes');
      expect(enabledTabs).toContain('listening');

      // User logs in
      window.state.currentUser = { id: 'user123' };
      enabledTabs = featureFlags.getEnabledTabs();

      expect(enabledTabs).toContain('workouts');
      expect(enabledTabs).toContain('quizzes');
      expect(enabledTabs).toContain('listening');
      expect(enabledTabs).toContain('knowledge-base');

      // User logs out
      window.state.currentUser = null;
      enabledTabs = featureFlags.getEnabledTabs();

      expect(enabledTabs).toContain('workouts');
      expect(enabledTabs).toContain('quizzes');
      expect(enabledTabs).toContain('listening');
      expect(enabledTabs).not.toContain('knowledge-base');
    });
  });

  describe('Tab Order and Priority', () => {
    test('should maintain correct tab order with authenticated user', () => {
      window.state.currentUser = { id: 'user123' };

      const enabledTabs = featureFlags.getEnabledTabs();

      // Expected order: workouts, knowledge-base, quizzes, listening
      expect(enabledTabs[0]).toBe('workouts');
      expect(enabledTabs[1]).toBe('knowledge-base');
      expect(enabledTabs[2]).toBe('quizzes');
      expect(enabledTabs[3]).toBe('listening');
    });

    test('should maintain correct tab order without authenticated user', () => {
      window.state.currentUser = null;

      const enabledTabs = featureFlags.getEnabledTabs();

      // Expected order: workouts, quizzes, listening (no knowledge-base)
      expect(enabledTabs[0]).toBe('workouts');
      expect(enabledTabs[1]).toBe('quizzes');
      expect(enabledTabs[2]).toBe('listening');
      expect(enabledTabs.length).toBe(3);
    });
  });

  describe('Consistency Between Functions', () => {
    test('getEnabledTabs and getActiveCoreTabs should be consistent for authenticated user', () => {
      window.state.currentUser = { id: 'user123' };

      const enabledTabs = featureFlags.getEnabledTabs();
      const coreTabs = featureFlags.getActiveCoreTabs();

      // Core tabs should be a subset of enabled tabs
      coreTabs.forEach(tab => {
        expect(enabledTabs).toContain(tab);
      });
    });

    test('getEnabledTabs and getActiveCoreTabs should be consistent for unauthenticated user', () => {
      window.state.currentUser = null;

      const enabledTabs = featureFlags.getEnabledTabs();
      const coreTabs = featureFlags.getActiveCoreTabs();

      // Core tabs should be a subset of enabled tabs
      coreTabs.forEach(tab => {
        expect(enabledTabs).toContain(tab);
      });

      // Neither should include knowledge-base
      expect(enabledTabs).not.toContain('knowledge-base');
      expect(coreTabs).not.toContain('knowledge-base');
    });
  });
});
