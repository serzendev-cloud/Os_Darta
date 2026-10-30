import React from 'react';

export interface MosqueOrnament3DProps {
  className?: string;
  width?: number | string;
  height?: number | string;
  opacity?: number;
  goldAccent?: boolean;
  glowColor?: string;
}

/**
 * Volumetric 3D Mosque Ornament
 * Features lighting gradients, dome specular highlights, and dimensional depth.
 * Accessibility: Strictly aria-hidden and pointer-events-none so text remains legible and interactable.
 */
export const MosqueOrnament3D: React.FC<MosqueOrnament3DProps> = ({
  className = '',
  width = 240,
  height = 180,
  opacity = 0.85,
  goldAccent = false,
  glowColor,
}) => {
  const finialFill = goldAccent ? 'url(#goldFinialGrad)' : 'url(#domeSpecular)';
  const starFill = goldAccent ? '#F3C74A' : '#7DD3FC';

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 320 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`pointer-events-none select-none ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      <defs>
        {/* Main Dome Volumetric Gradient */}
        <radialGradient
          id="mainDomeVolumetric"
          cx="38%"
          cy="32%"
          r="68%"
          fx="35%"
          fy="28%"
        >
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="25%" stopColor="#7DD3FC" stopOpacity="0.45" />
          <stop offset="65%" stopColor="#0284C7" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#075985" stopOpacity="0.85" />
        </radialGradient>

        {/* Dome Specular Light Sweep */}
        <linearGradient id="domeSpecular" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
          <stop offset="45%" stopColor="#38BDF8" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#0369A1" stopOpacity="0.0" />
        </linearGradient>

        {/* Secondary Domes Gradient */}
        <radialGradient
          id="subDomeGrad"
          cx="40%"
          cy="35%"
          r="60%"
        >
          <stop offset="0%" stopColor="#BAE6FD" stopOpacity="0.5" />
          <stop offset="50%" stopColor="#0284C7" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#034E78" stopOpacity="0.8" />
        </radialGradient>

        {/* Gold Finial Gradient */}
        <linearGradient id="goldFinialGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="50%" stopColor="#F3C74A" />
          <stop offset="100%" stopColor="#C9962B" />
        </linearGradient>

        {/* Ambient Base Shadow */}
        <linearGradient id="baseShadow" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#075985" stopOpacity="0" />
          <stop offset="100%" stopColor="#032540" stopOpacity="0.65" />
        </linearGradient>

        {/* Arched Window Inset Depth */}
        <linearGradient id="archDepth" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#021E38" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#075985" stopOpacity="0.25" />
        </linearGradient>

        {/* Soft Radial Ambient Glow */}
        <radialGradient id="ambientGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={glowColor || '#38BDF8'} stopOpacity="0.35" />
          <stop offset="100%" stopColor={glowColor || '#38BDF8'} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ambient Glow Aura */}
      <circle cx="160" cy="110" r="100" fill="url(#ambientGlow)" />

      {/* Background Architectural Silhouette Base */}
      <rect x="50" y="150" width="220" height="90" rx="4" fill="url(#baseShadow)" />

      {/* Left Sub-Dome */}
      <path
        d="M 60 160 C 60 125, 95 110, 105 95 C 115 110, 150 125, 150 160 Z"
        fill="url(#subDomeGrad)"
      />
      {/* Left Sub-Dome Specular Highlight */}
      <path
        d="M 68 158 C 72 135, 95 120, 105 102 C 104 116, 90 138, 76 158 Z"
        fill="url(#domeSpecular)"
        opacity="0.6"
      />
      <circle cx="105" cy="92" r="3" fill={finialFill} />

      {/* Right Sub-Dome */}
      <path
        d="M 170 160 C 170 125, 205 110, 215 95 C 225 110, 260 125, 260 160 Z"
        fill="url(#subDomeGrad)"
      />
      {/* Right Sub-Dome Specular Highlight */}
      <path
        d="M 178 158 C 182 135, 205 120, 215 102 C 214 116, 200 138, 186 158 Z"
        fill="url(#domeSpecular)"
        opacity="0.6"
      />
      <circle cx="215" cy="92" r="3" fill={finialFill} />

      {/* Central Grand Dome (Volumetric 3D) */}
      <path
        d="M 100 165 C 100 110, 145 75, 160 55 C 175 75, 220 110, 220 165 Z"
        fill="url(#mainDomeVolumetric)"
      />

      {/* Central Dome Specular Light Arc */}
      <path
        d="M 112 160 C 114 125, 145 95, 160 63 C 158 84, 138 120, 122 160 Z"
        fill="url(#domeSpecular)"
        opacity="0.8"
      />

      {/* Dome Rib Curves (Giving 3D spherical curvature) */}
      <path
        d="M 160 58 Q 140 105 130 165"
        stroke="#FFFFFF"
        strokeWidth="1"
        strokeOpacity="0.25"
      />
      <path
        d="M 160 58 Q 180 105 190 165"
        stroke="#075985"
        strokeWidth="1.2"
        strokeOpacity="0.35"
      />

      {/* Central Dome Finial & Crescent */}
      <path
        d="M 160 55 L 160 35 M 157 42 L 163 42"
        stroke={finialFill}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="160" cy="32" r="3.5" fill={finialFill} />
      {/* Crescent */}
      <path
        d="M 162 25 A 5 5 0 1 0 162 33 A 4 4 0 1 1 162 25 Z"
        fill={finialFill}
      />

      {/* Left Minaret Tower */}
      <g opacity="0.9">
        <rect x="36" y="80" width="14" height="150" fill="url(#subDomeGrad)" />
        <rect x="33" y="76" width="20" height="5" rx="1.5" fill={finialFill} />
        <path d="M 36 76 C 36 60, 43 50, 43 50 C 43 50, 50 60, 50 76 Z" fill="url(#mainDomeVolumetric)" />
        <line x1="43" y1="50" x2="43" y2="40" stroke={finialFill} strokeWidth="1.5" />
        <circle cx="43" cy="38" r="2" fill={finialFill} />
      </g>

      {/* Right Minaret Tower */}
      <g opacity="0.9">
        <rect x="270" y="80" width="14" height="150" fill="url(#subDomeGrad)" />
        <rect x="267" y="76" width="20" height="5" rx="1.5" fill={finialFill} />
        <path d="M 270 76 C 270 60, 277 50, 277 50 C 277 50, 284 60, 284 76 Z" fill="url(#mainDomeVolumetric)" />
        <line x1="277" y1="50" x2="277" y2="40" stroke={finialFill} strokeWidth="1.5" />
        <circle cx="277" cy="38" r="2" fill={finialFill} />
      </g>

      {/* Arched Portals (Depth & Windows) */}
      <path
        d="M 148 190 C 148 175, 160 165, 160 165 C 160 165, 172 175, 172 190 L 172 230 L 148 230 Z"
        fill="url(#archDepth)"
      />
      <path
        d="M 115 195 C 115 182, 125 174, 125 174 C 125 174, 135 182, 135 195 L 135 230 L 115 230 Z"
        fill="url(#archDepth)"
        opacity="0.8"
      />
      <path
        d="M 185 195 C 185 182, 195 174, 195 174 C 195 174, 205 182, 205 195 L 205 230 L 185 230 Z"
        fill="url(#archDepth)"
        opacity="0.8"
      />

      {/* Subtle Star Particle Highlights */}
      <circle cx="70" cy="50" r="1.5" fill={starFill} opacity="0.75" />
      <circle cx="250" cy="45" r="1.5" fill={starFill} opacity="0.75" />
      <circle cx="120" cy="30" r="1" fill="#FFFFFF" opacity="0.6" />
      <circle cx="200" cy="25" r="1" fill="#FFFFFF" opacity="0.6" />
    </svg>
  );
};

