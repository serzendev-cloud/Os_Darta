import React from 'react';
import { MosqueOrnament3D } from './MosqueOrnament3D';
import { AbstractPattern } from './AbstractPattern';

export interface GradientHeaderShellProps {
  children?: React.ReactNode;
  className?: string;
  showOrnament?: boolean;
  ornamentType?: 'mosque' | 'abstract' | 'none';
  showLattice?: boolean;
  goldAccent?: boolean;
  neonGlow?: boolean;
  /**
   * Applies an alpha-composited dark scrim overlay behind the text content
   * to guarantee WCAG AA contrast (>= 4.5:1) without dulling the entire header gradient.
   */
  needScrim?: boolean;
  isLightHeader?: boolean;
}

/**
 * Reusable Shell Header Container
 * Integrates theme gradients, sheen, volumetric 3D ornaments, gold trim, and WCAG contrast protection.
 */
export const GradientHeaderShell: React.FC<GradientHeaderShellProps> = ({
  children,
  className = '',
  showOrnament = true,
  ornamentType = 'abstract',
  showLattice = false,
  goldAccent = false,
  neonGlow = false,
  needScrim = true,
  isLightHeader = false,
}) => {
  return (
    <div
      className={`relative w-full overflow-hidden transition-all duration-300 ${
        isLightHeader ? 'text-slate-900 dark:text-white' : 'text-white'
      } ${className}`}
      style={{
        background: 'var(--theme-header-gradient, linear-gradient(135deg, #7DD3FC 0%, #38A3F0 28%, #2563C7 62%, #173F86 100%))',
      }}
    >
      {/* Light Sheen Overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'var(--theme-header-sheen, linear-gradient(115deg, rgba(255, 255, 255, 0.38), rgba(255, 255, 255, 0) 42%))',
        }}
      />

      {/* Optional Neon Top Glow for Islami-Sky */}
      {neonGlow && (
        <div
          className="absolute top-0 left-0 right-0 h-1 bg-[#FFF44F] shadow-[0_0_12px_#FFF44F] pointer-events-none z-10"
          aria-hidden="true"
        />
      )}

      {/* Decorative Background Ornaments (Aria-hidden) */}
      {showOrnament && ornamentType === 'mosque' && (
        <div className="absolute right-0 bottom-0 pointer-events-none overflow-hidden max-w-[65%] max-h-full flex items-end justify-end">
          <MosqueOrnament3D goldAccent={goldAccent} opacity={0.65} />
        </div>
      )}

      {showOrnament && ornamentType === 'abstract' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <AbstractPattern opacity={0.35} showLattice={showLattice} />
        </div>
      )}

      {/* WCAG Contrast Scrim: Localized directional scrim on colored headers.
          Light monochrome headers (e.g. Putih) use ink text directly, avoiding muddy washes. */}
      {needScrim && !isLightHeader && (
        <div
          className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none bg-gradient-to-t from-black/35 via-black/10 to-transparent z-0"
          aria-hidden="true"
        />
      )}

      {/* Interactive Content Layer */}
      <div className="relative z-10 w-full">
        {children}
      </div>

      {/* Gold Trim Line: 4px line at the bottom when goldAccent is active */}
      {goldAccent && (
        <div
          className="absolute bottom-0 left-0 right-0 h-1 z-20 pointer-events-none"
          style={{
            background: 'var(--theme-gold-line, linear-gradient(90deg, #C9962B 0%, #F3C74A 50%, #FDE68A 100%))',
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
};
