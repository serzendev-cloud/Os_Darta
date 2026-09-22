// ========================================
// Auth Store — Unit Tests
// Canonical Authority: Supabase Auth (@supabase/ssr)
// Traceability: WP-AUTH-SSR-INTEGRATION-002
// ========================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '@/store/auth-store';
import { mockUsers } from '@/data/mock';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: vi.fn(async ({ email, password }: { email: string; password: string }) => {
        if (password === 'wrong-password') {
          return { data: { user: null }, error: { message: 'Invalid login credentials' } };
        }
        return {
          data: {
            user: {
              id: 'fed67d26-7d19-4e3c-bf7d-2e45143e864b',
              email,
              app_metadata: { role: 'SUPER_ADMIN' },
              user_metadata: { name: 'Super Admin Test' },
            },
          },
          error: null,
        };
      }),
      signOut: vi.fn(async () => ({ error: null })),
    },
  })),
}));

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
    it('sets user when credentials succeed via Supabase Auth', async () => {
      const { login } = useAuthStore.getState();
      const result = await login('superadmin@madev.id', 'valid-password');

      expect(result).toBe(true);
      const state = useAuthStore.getState();
      expect(state.user).toEqual({
        id: 'fed67d26-7d19-4e3c-bf7d-2e45143e864b',
        name: 'Super Admin Test',
        email: 'superadmin@madev.id',
        role: 'super_admin',
        avatar: undefined,
        status: 'ACTIVE',
      });
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('rejects login when credentials fail via Supabase Auth', async () => {
      const { login } = useAuthStore.getState();
      const result = await login('superadmin@madev.id', 'wrong-password');

      expect(result).toBe(false);
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toContain('Email atau password yang Anda masukkan salah');
    });

    it('rejects login with validation error when email or password is empty', async () => {
      const { login } = useAuthStore.getState();
      const result = await login('', '');

      expect(result).toBe(false);
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBe('Email dan password wajib diisi');
    });
  });

  // --------------- syncUser ---------------

  describe('syncUser', () => {
    it('hydrates derived user state from Supabase Auth user', () => {
      const { syncUser } = useAuthStore.getState();
      syncUser({
        id: 'fed67d26-7d19-4e3c-bf7d-2e45143e864b',
        email: 'superadmin@madev.id',
        app_metadata: { role: 'SUPER_ADMIN' },
        user_metadata: { name: 'Super Admin Platform' },
      } as unknown as Parameters<typeof syncUser>[0]);

      const state = useAuthStore.getState();
      expect(state.user?.id).toBe('fed67d26-7d19-4e3c-bf7d-2e45143e864b');
      expect(state.user?.role).toBe('super_admin');
      expect(state.isAuthenticated).toBe(true);
    });

    it('clears state when syncUser receives null', () => {
      useAuthStore.setState({ user: mockUsers[0], isAuthenticated: true });

      const { syncUser } = useAuthStore.getState();
      syncUser(null);

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
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
