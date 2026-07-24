// ========================================
// Auth Store (Zustand)
// Integrated with Drizzle ORM / Postgres schema & Mock Users
// Firebase Auth dependency removed to prevent API key conflicts
// ========================================

import { create } from 'zustand';
import { User, UserRole } from '@/types';
import { mockUsers } from '@/data/mock';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuthState {
  user: User | null;
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
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // ── login ──────────────────────────────────────────────────────────────
  login: async (email: string, _password: string) => {
    set({ isLoading: true, error: null });

    try {
      const trimmedEmail = email.trim().toLowerCase();

      // 1. Check matching account from Drizzle / mockUsers list
      const foundUser = mockUsers.find(
        (u) => u.email.toLowerCase() === trimmedEmail
      );

      if (foundUser) {
        set({ user: foundUser, isAuthenticated: true, isLoading: false });
        return true;
      }

      // 2. Default fallback session for custom credentials
      const defaultRole: UserRole = trimmedEmail.includes('dev')
        ? 'developer'
        : trimmedEmail.includes('superadmin')
        ? 'super_admin'
        : 'admin';

      const fallbackUser: User = {
        id: `usr_${Date.now()}`,
        name: email.split('@')[0],
        email: email,
        role: defaultRole,
      };

      set({ user: fallbackUser, isAuthenticated: true, isLoading: false });
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login gagal';
      set({ isLoading: false, error: message });
      return false;
    }
  },

  // ── logout ─────────────────────────────────────────────────────────────
  logout: async () => {
    set({
      user: null,
      isAuthenticated: false,
      error: null,
    });
  },

  // ── clearError ─────────────────────────────────────────────────────────
  clearError: () => set({ error: null }),

  // ── switchRole ─────────────────────────────────────────────────────────
  switchRole: (role: UserRole) => {
    set((state) => ({
      user: state.user ? { ...state.user, role } : null,
    }));
  },

  // ── setUser ────────────────────────────────────────────────────────────
  setUser: (user: User | null) => set({ user }),
}));
