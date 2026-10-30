import React from 'react';

export interface AbstractPatternProps {
  className?: string;
  width?: number | string;
  height?: number | string;
  opacity?: number;
  primaryColor?: string;
  /**
   * Whether to render the Islamic 8-point geometric star lattice overlay.
   * Strict Rule: Must be FALSE for White-Label and all Netral themes.
   */
  showLattice?: boolean;
}

/**
 * Modern Layered Paper-Cut Wave Pattern
 * Designed for White-Label Default and neutral themes (pure curves, zero religious lattice).
 * Accessibility: Strictly aria-hidden and pointer-events-none.
 */
export const AbstractPattern: React.FC<AbstractPatternProps> = ({
  className = '',
  width = '100%',
  height = '100%',
  opacity = 0.45,
  primaryColor = '#38BDF8',
  showLattice = false,
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 600 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      className={`pointer-events-none select-none ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="paperLayer1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
          <stop offset="100%" stopColor={primaryColor} stopOpacity="0.10" />
        </linearGradient>

        <linearGradient id="paperLayer2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={primaryColor} stopOpacity="0.30" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.05" />
        </linearGradient>

        <linearGradient id="paperLayer3" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.25" />
          <stop offset="100%" stopColor={primaryColor} stopOpacity="0.02" />
        </linearGradient>

        {showLattice && (
          <pattern
            id="geometricLattice"
            x="0"
            y="0"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 20 0 L 26 14 L 40 20 L 26 26 L 20 40 L 14 26 L 0 20 L 14 14 Z"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="0.75"
              strokeOpacity="0.12"
            />
            <circle cx="20" cy="20" r="1.5" fill="#FFFFFF" fillOpacity="0.15" />
          </pattern>
        )}
      </defs>

      {/* Layer 1: Bottom Deep Sweep */}
      <path
        d="M 0 100 Q 180 20 360 130 T 600 90 L 600 300 L 0 300 Z"
        fill="url(#paperLayer1)"
      />

      {/* Layer 2: Mid Dynamic Curve */}
      <path
        d="M 0 160 Q 150 240 330 160 T 600 210 L 600 300 L 0 300 Z"
        fill="url(#paperLayer2)"
      />

      {/* Layer 3: Top Wave Crest */}
      <path
        d="M 0 220 C 140 180, 280 280, 440 210 C 520 180, 570 210, 600 240 L 600 300 L 0 300 Z"
        fill="url(#paperLayer3)"
      />

      {/* Lattice Overlay — ONLY rendered if showLattice is explicitly true */}
      {showLattice && (
        <rect x="0" y="0" width="600" height="300" fill="url(#geometricLattice)" />
      )}
    </svg>
  );
};
