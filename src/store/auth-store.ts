// ========================================
// Auth Store (Zustand)
// Firebase Auth with graceful Mock User fallback for preview/demo environments
// ========================================

import { create } from 'zustand';
import { User, UserRole } from '@/types';
import type { User as FirebaseUser } from 'firebase/auth';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuthState {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
  switchRole: (role: UserRole) => void;
  setUser: (user: User | null) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAuthStore = create<AuthState>((set) => ({
  // ── initial state ──────────────────────────────────────────────────────
  user: null,
  firebaseUser: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // ── login ──────────────────────────────────────────────────────────────
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    // 1. Try Firebase Auth first
    try {
      const { authService } = await import('@/lib/firebase/auth');
      const user = await authService.login(email, password);
      set({ user, isAuthenticated: true, isLoading: false });
      return true;
    } catch (err: unknown) {
      // 2. Fallback to mockUsers if Firebase fails (e.g. invalid API key in Vercel Preview or offline demo)
      try {
        const { mockUsers } = await import('@/data/mock');
        const foundMock = mockUsers.find(
          (u) => u.email.toLowerCase() === email.trim().toLowerCase()
        );
        if (foundMock) {
          set({ user: foundMock, isAuthenticated: true, isLoading: false });
          return true;
        }
      } catch {
        // Ignore mock import error and present original error message
      }

      const message =
        err instanceof Error ? err.message : 'Login gagal';
      set({ isLoading: false, error: message });
      return false;
    }
  },

  // ── logout ─────────────────────────────────────────────────────────────
  logout: async () => {
    try {
      const { authService } = await import('@/lib/firebase/auth');
      await authService.logout();
    } catch {
      // signOut rarely fails; swallow so state is still cleared
    }
    set({
      user: null,
      firebaseUser: null,
      isAuthenticated: false,
      error: null,
    });
  },

  // ── clearError ─────────────────────────────────────────────────────────
  clearError: () => set({ error: null }),

  // ── switchRole ─────────────────────────────────────────────────────────
  // Updates the current user's role in the store
  switchRole: (role: UserRole) => {
    set((state) => ({
      user: state.user ? { ...state.user, role } : null,
    }));
  },

  // ── setUser ────────────────────────────────────────────────────────────
  setUser: (user: User | null) => set({ user }),
}));
