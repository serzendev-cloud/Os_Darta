// ========================================
// Auth Store (Zustand) — Derived Client State
// Canonical Authority: Supabase Auth (@supabase/ssr)
// Traceability: WP-AUTH-SSR-INTEGRATION-002 | Zero-Trust Architecture
// ========================================

import { create } from 'zustand';
import { User, UserRole } from '@/types';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseAuthUser } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function normalizeUserRole(rawRole?: string | null): UserRole {
  if (!rawRole) return 'admin';
  const lower = rawRole.toLowerCase().trim();
  if (lower === 'super_admin' || lower === 'superadmin') return 'super_admin';
  if (lower === 'developer' || lower === 'dev') return 'developer';
  if (lower === 'admin') return 'admin';
  if (lower === 'musyrif') return 'musyrif';
  if (lower === 'wali') return 'wali';
  if (lower === 'santri') return 'santri';
  if (lower === 'staff') return 'staff';
  if (lower === 'kepala_kesiswaan') return 'kepala_kesiswaan';
  if (lower === 'guru') return 'guru';
  if (lower === 'wali_kelas') return 'wali_kelas';
  if (lower === 'alumni') return 'alumni';
  return 'admin';
}

export function mapSupabaseUser(authUser: SupabaseAuthUser): User {
  const role = normalizeUserRole(
    (authUser.app_metadata?.role as string) || (authUser.user_metadata?.role as string)
  );
  const name =
    (authUser.user_metadata?.name as string) ||
    (authUser.user_metadata?.full_name as string) ||
    authUser.email?.split('@')[0] ||
    'User';

  return {
    id: authUser.id,
    name,
    email: authUser.email || '',
    role,
    avatar: (authUser.user_metadata?.avatar_url as string) || undefined,
  };
}

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
  syncUser: (authUser: SupabaseAuthUser | null) => void;
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

  // ── login (delegated strictly to Supabase Auth) ─────────────────────────
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      const trimmedEmail = email.trim().toLowerCase();
      if (!trimmedEmail || !password) {
        set({ isLoading: false, error: 'Email dan password wajib diisi' });
        return false;
      }

      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        let displayError = 'Email atau password yang Anda masukkan salah.';
        if (error.message.toLowerCase().includes('email not confirmed')) {
          displayError = 'Email belum dikonfirmasi. Silakan periksa kotak masuk email Anda.';
        } else if (error.message.toLowerCase().includes('rate limit')) {
          displayError = 'Terlalu banyak percobaan login. Silakan tunggu beberapa saat.';
        }
        set({ isLoading: false, error: displayError });
        return false;
      }

      if (data?.user) {
        const appUser = mapSupabaseUser(data.user);
        set({ user: appUser, isAuthenticated: true, isLoading: false, error: null });
        return true;
      }

      set({ isLoading: false, error: 'Login gagal. Tidak ada sesi yang diterima.' });
      return false;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan pada sistem autentikasi';
      set({ isLoading: false, error: message });
      return false;
    }
  },

  // ── logout (delegated strictly to Supabase Auth) ────────────────────────
  logout: async () => {
    set({ isLoading: true });
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Supabase signOut error:', err);
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
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
  setUser: (user: User | null) => set({ user, isAuthenticated: !!user }),

  // ── syncUser (hydrate/sync derived state from Supabase Auth) ───────────
  syncUser: (authUser: SupabaseAuthUser | null) => {
    if (!authUser) {
      set({ user: null, isAuthenticated: false, isLoading: false, error: null });
    } else {
      set({ user: mapSupabaseUser(authUser), isAuthenticated: true, isLoading: false, error: null });
    }
  },
}));
