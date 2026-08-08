// ========================================
// Auth Store — Unit Tests
// Traceability: CIP-WP-009 | Contract Alignment
// ========================================

import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/store/auth-store';
import { mockUsers } from '@/data/mock';

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset store back to initial state before each test
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  // --------------- initial state ---------------

  describe('initial state', () => {
    it('has user null, isAuthenticated false, isLoading false, error null', () => {
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  // --------------- login ---------------

  describe('login', () => {
    it('sets user when credentials match a mock user', async () => {
      const adminUser = mockUsers.find((u) => u.email === 'admin@mahad.sch.id');
      const { login } = useAuthStore.getState();
      const result = await login('admin@mahad.sch.id', 'any-password');

      expect(result).toBe(true);
      const state = useAuthStore.getState();
      expect(state.user).toEqual(adminUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('creates fallback session when email is custom/unlisted', async () => {
      const { login } = useAuthStore.getState();
      const result = await login('custom_teacher@mahad.sch.id', 'any-password');

      expect(result).toBe(true);
      const state = useAuthStore.getState();
      expect(state.user).not.toBeNull();
      expect(state.user?.email).toBe('custom_teacher@mahad.sch.id');
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });
  });

  // --------------- logout ---------------

  describe('logout', () => {
    it('clears user and isAuthenticated', async () => {
      // Pre-set a logged-in user
      useAuthStore.setState({ user: mockUsers[0], isAuthenticated: true });

      const { logout } = useAuthStore.getState();
      await logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  // --------------- clearError ---------------

  describe('clearError', () => {
    it('resets error to null', () => {
      useAuthStore.setState({ error: 'Something went wrong' });

      useAuthStore.getState().clearError();

      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  // --------------- switchRole ---------------

  describe('switchRole', () => {
    it('updates current user role to requested role', () => {
      useAuthStore.setState({ user: mockUsers[0] });

      useAuthStore.getState().switchRole('musyrif');

      const state = useAuthStore.getState();
      expect(state.user?.role).toBe('musyrif');
    });
  });
});
