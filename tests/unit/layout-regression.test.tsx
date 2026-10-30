import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { cn } from '@/lib/utils';

// Mocks for Next.js navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: vi.fn(),
  }),
}));

// Mock hooks
vi.mock('@/hooks', () => ({
  useCollection: () => ({ data: [] }),
  useIsRole: () => false,
}));

// Mock stores
vi.mock('@/store/auth-store', () => ({
  useAuthStore: () => ({
    user: {
      id: 'usr_admin',
      name: 'Super Admin',
      email: 'admin@platform.local',
      role: 'super_admin',
    },
    logout: vi.fn(),
    switchRole: vi.fn(),
  }),
}));

vi.mock('@/store/sidebar-store', () => ({
  useSidebarStore: () => ({
    isCollapsed: false,
    isMobileOpen: false,
    toggle: vi.fn(),
    setMobileOpen: vi.fn(),
  }),
}));

describe('Layout Regression Tests (WP-UI-001d)', () => {
  it('Sidebar aside element preserves "fixed" and does NOT contain conflicting "relative"', () => {
    const { container } = render(<Sidebar />);
    const aside = container.querySelector('aside');
    expect(aside).not.toBeNull();

    const className = aside?.getAttribute('class') || '';

    // Verify 'fixed' is present and active
    expect(className.split(/\s+/)).toContain('fixed');
    expect(className.split(/\s+/)).toContain('top-0');
    expect(className.split(/\s+/)).toContain('left-0');
    expect(className.split(/\s+/)).toContain('z-50');
    expect(className.split(/\s+/)).toContain('h-dvh');

    // Regression check: 'relative' must NOT be in aside classes (which previously caused twMerge to drop fixed)
    expect(className.split(/\s+/)).not.toContain('relative');
  });

  it('Topbar header element preserves "sticky" and does NOT contain conflicting "relative"', () => {
    const { container } = render(<Topbar />);
    const header = container.querySelector('header');
    expect(header).not.toBeNull();

    const className = header?.getAttribute('class') || '';

    // Verify 'sticky' is present and active
    expect(className.split(/\s+/)).toContain('sticky');
    expect(className.split(/\s+/)).toContain('top-0');
    expect(className.split(/\s+/)).toContain('z-30');

    // Regression check: 'relative' must NOT collide with 'sticky' on header
    expect(className.split(/\s+/)).not.toContain('relative');
  });

  describe('twMerge position collision resolution mechanics', () => {
    it('demonstrates why the bug occurred: passing "relative" after "fixed" drops "fixed"', () => {
      const buggyResult = cn('fixed top-0 left-0', 'bg-card relative overflow-hidden');
      expect(buggyResult.split(/\s+/)).toContain('relative');
      expect(buggyResult.split(/\s+/)).not.toContain('fixed');
    });

    it('demonstrates the fix: removing "relative" preserves "fixed" properly', () => {
      const fixedResult = cn('fixed top-0 left-0', 'bg-card overflow-hidden');
      expect(fixedResult.split(/\s+/)).toContain('fixed');
      expect(fixedResult.split(/\s+/)).not.toContain('relative');
    });
  });
});

