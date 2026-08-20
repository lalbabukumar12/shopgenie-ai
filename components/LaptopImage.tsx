import React from 'react';

interface LaptopImageProps {
  brand: string;
  className?: string;
}

export default function LaptopImage({ brand, className = '' }: LaptopImageProps) {
  const normalizedBrand = brand.toLowerCase();

  // Define brand-specific visual theme elements
  let screenGradientId = 'screen-grad-default';
  let ambientColor = 'rgba(99, 102, 241, 0.15)'; // default indigo glow
  let glowColor = '#6366f1';
  let baseColor = '#475569'; // default slate-600
  let bezelColor = '#1e293b'; // default slate-800
  let accentColor = '#3b82f6'; // default blue

  // Customize based on brand
  if (normalizedBrand.includes('apple')) {
    screenGradientId = 'screen-grad-apple';
    ambientColor = 'rgba(236, 72, 153, 0.15)'; // rose pink/orange ambient
    glowColor = '#f43f5e';
    baseColor = '#d1d5db'; // silver slate-300
    bezelColor = '#111827'; // deep black
    accentColor = '#f43f5e';
  } else if (normalizedBrand.includes('asus') || normalizedBrand.includes('rog') || normalizedBrand.includes('gigabyte')) {
    screenGradientId = 'screen-grad-gaming';
    ambientColor = 'rgba(239, 68, 68, 0.2)'; // gaming red/purple ambient
    glowColor = '#ef4444';
    baseColor = '#1e293b'; // gunmetal dark slate
    bezelColor = '#0f172a'; // obsidian black
    accentColor = '#f43f5e';
  } else if (normalizedBrand.includes('dell')) {
    screenGradientId = 'screen-grad-dell';
    ambientColor = 'rgba(6, 182, 212, 0.15)'; // cyan ambient
    glowColor = '#06b6d4';
    baseColor = '#94a3b8'; // platinum silver-slate
    bezelColor = '#0f172a'; // thin borders
    accentColor = '#06b6d4';
  } else if (normalizedBrand.includes('lenovo') || normalizedBrand.includes('thinkpad')) {
    screenGradientId = 'screen-grad-lenovo';
    ambientColor = 'rgba(220, 38, 38, 0.1)'; // deep red highlight
    glowColor = '#dc2626';
    baseColor = '#1f2937'; // matte carbon gray
    bezelColor = '#111827'; // matte black
    accentColor = '#dc2626';
  } else if (normalizedBrand.includes('hp')) {
    screenGradientId = 'screen-grad-hp';
    ambientColor = 'rgba(59, 130, 246, 0.12)';
    glowColor = '#3b82f6';
    baseColor = '#cbd5e1'; // warm silver
    bezelColor = '#1e293b';
    accentColor = '#0284c7';
  }

  return (
    <div className={`relative flex items-center justify-center p-4 transition-all duration-300 group ${className}`}>
      {/* Background Ambient Glow */}
      <div
        className="absolute inset-0 rounded-full blur-3xl opacity-75 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle, ${ambientColor} 0%, rgba(0,0,0,0) 70%)`
        }}
      />

      <svg
        className="w-full h-auto max-w-[240px] relative z-10 filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.4)]"
        viewBox="0 0 400 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Apple Style Gradient: Warm pastel orange-pink-blue */}
          <linearGradient id="screen-grad-apple" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="50%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>

          {/* Gaming Style Gradient: Angry neon red, dark purple and violet */}
          <linearGradient id="screen-grad-gaming" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>

          {/* Dell Style Gradient: Tech cyan, teal and royal blue */}
          <linearGradient id="screen-grad-dell" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="60%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>

          {/* Lenovo Style Gradient: Minimalistic dark abstract gray-red */}
          <linearGradient id="screen-grad-lenovo" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1f2937" />
            <stop offset="70%" stopColor="#111827" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>

          {/* HP Style Gradient: Professional teal and corporate blue */}
          <linearGradient id="screen-grad-hp" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#312e81" />
          </linearGradient>

          {/* Default Gradient */}
          <linearGradient id="screen-grad-default" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>

          {/* Bevel Shading */}
          <linearGradient id="bevel-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
          </linearGradient>

          {/* Screen Gloss Overlay */}
          <linearGradient id="screen-gloss" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.1" />
            <stop offset="30%" stopColor="#ffffff" stopOpacity="0.05" />
            <stop offset="31%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* Laptop Base Shadow */}
          <filter id="base-shadow" x="-10%" y="-10%" width="120%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#000000" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Display Lid / Back Cover Outer (Slightly larger than bezel) */}
        <rect x="52" y="32" width="296" height="186" rx="10" fill={baseColor} />
        <rect x="52" y="32" width="296" height="186" rx="10" fill="url(#bevel-grad)" />

        {/* Screen Bezel (Inner) */}
        {normalizedBrand.includes('dell') ? (
          // Dell XPS style ultra-thin bezel
          <rect x="55" y="35" width="290" height="180" rx="4" fill={bezelColor} />
        ) : (
          // Standard bezel
          <rect x="57" y="37" width="286" height="176" rx="6" fill={bezelColor} />
        )}

        {/* The Screen / Active Display */}
        {normalizedBrand.includes('dell') ? (
          // Dell XPS screen
          <rect x="57" y="37" width="286" height="174" rx="2" fill={`url(#${screenGradientId})`} />
        ) : (
          // Standard screen
          <rect x="67" y="47" width="266" height="156" rx="3" fill={`url(#${screenGradientId})`} />
        )}

        {/* Grid pattern overlay on screen for technology vibe */}
        <g opacity="0.15">
          <line x1="67" y1="80" x2="333" y2="80" stroke="#fff" strokeWidth="0.5" />
          <line x1="67" y1="120" x2="333" y2="120" stroke="#fff" strokeWidth="0.5" />
          <line x1="67" y1="160" x2="333" y2="160" stroke="#fff" strokeWidth="0.5" />
          <line x1="120" y1="47" x2="120" y2="203" stroke="#fff" strokeWidth="0.5" />
          <line x1="200" y1="47" x2="200" y2="203" stroke="#fff" strokeWidth="0.5" />
          <line x1="280" y1="47" x2="280" y2="203" stroke="#fff" strokeWidth="0.5" />
        </g>

        {/* Stylized code lines or graphics on the screen */}
        <g opacity="0.4">
          {normalizedBrand.includes('gaming') || normalizedBrand.includes('asus') ? (
            // Gaming wave graph
            <path d="M 80 160 Q 130 110 180 150 T 280 100 T 320 130" stroke={glowColor} strokeWidth="3" strokeLinecap="round" />
          ) : (
            // Code block layout
            <>
              <rect x="80" y="65" width="50" height="6" rx="2" fill="#fff" opacity="0.8" />
              <rect x="80" y="80" width="100" height="5" rx="2" fill="#fff" opacity="0.5" />
              <rect x="95" y="92" width="70" height="5" rx="2" fill={glowColor} opacity="0.9" />
              <rect x="95" y="104" width="120" height="5" rx="2" fill="#fff" opacity="0.5" />
              <rect x="110" y="116" width="60" height="5" rx="2" fill="#fff" opacity="0.4" />
              <rect x="80" y="140" width="80" height="5" rx="2" fill="#fff" opacity="0.5" />
              <rect x="95" y="152" width="90" height="5" rx="2" fill={glowColor} opacity="0.9" />
            </>
          )}
        </g>

        {/* Screen Glossy Reflection */}
        {normalizedBrand.includes('dell') ? (
          <rect x="57" y="37" width="286" height="174" rx="2" fill="url(#screen-gloss)" pointerEvents="none" />
        ) : (
          <rect x="67" y="47" width="266" height="156" rx="3" fill="url(#screen-gloss)" pointerEvents="none" />
        )}

        {/* Web Camera Dot */}
        <circle cx="200" cy="42" r="1.5" fill="#334155" />
        <circle cx="200" cy="42" r="0.5" fill="#0284c7" />

        {/* Display Brand Logo Placement */}
        {normalizedBrand.includes('apple') ? (
          // Apple logo (leaf & apple outline)
          <path d="M 200 165 C 198 165 196 167 196 169 C 196 172 198 174 200 174 C 202 174 204 172 204 169 C 204 167 202 165 200 165 Z" fill="#64748b" opacity="0.5" />
        ) : normalizedBrand.includes('dell') ? (
          // Dell circle logo
          <circle cx="200" cy="180" r="4" stroke="#64748b" strokeWidth="0.8" opacity="0.6" />
        ) : normalizedBrand.includes('lenovo') || normalizedBrand.includes('thinkpad') ? (
          // Lenovo text placeholder tag on bottom-right of bezel
          <rect x="285" y="174" width="14" height="5" fill="#374151" rx="1" opacity="0.5" />
        ) : (
          // Default generic emblem
          <polygon points="197,173 203,173 200,168" fill="#64748b" opacity="0.5" />
        )}

        {/* Hinge Connection */}
        <rect x="140" y="212" width="120" height="8" rx="2" fill="#1e293b" />
        <rect x="140" y="212" width="120" height="4" rx="1" fill="#475569" opacity="0.4" />

        {/* Laptop Keyboard Base (Bottom Shell) */}
        {/* Draw main base trapezoid for 3D perspective */}
        <path
          d="M 40 216 L 360 216 L 388 238 L 12 238 Z"
          fill={baseColor}
          filter="url(#base-shadow)"
        />
        <path
          d="M 40 216 L 360 216 L 388 238 L 12 238 Z"
          fill="url(#bevel-grad)"
        />

        {/* Laptop Keyboard Area Recess */}
        <path
          d="M 64 220 L 336 220 L 350 230 L 50 230 Z"
          fill="#0f172a"
          opacity="0.65"
        />

        {/* Stylized Keyboard Key Rows */}
        <g opacity="0.55">
          {/* Top F-keys row */}
          <line x1="68" y1="222" x2="332" y2="222" stroke="#475569" strokeWidth="1.5" strokeDasharray="6 2" />
          {/* Main Key rows */}
          <line x1="66" y1="224" x2="334" y2="224" stroke="#64748b" strokeWidth="1.8" strokeDasharray="8 2 12 2 10 2" />
          <line x1="64" y1="226" x2="336" y2="226" stroke="#64748b" strokeWidth="1.8" strokeDasharray="10 3 6 2 14 3" />
          <line x1="62" y1="228" x2="338" y2="228" stroke="#64748b" strokeWidth="1.8" strokeDasharray="14 2 8 2 12 2 6 2" />
        </g>

        {/* Lenovo ThinkPad RED TRACKPOINT! */}
        {(normalizedBrand.includes('lenovo') || normalizedBrand.includes('thinkpad')) && (
          <circle cx="200" cy="225" r="1.8" fill="#dc2626" />
        )}

        {/* Trackpad */}
        {normalizedBrand.includes('apple') ? (
          // Apple has a huge trackpad
          <path
            d="M 170 232 L 230 232 L 232 237 L 168 237 Z"
            fill="#94a3b8"
            stroke="#cbd5e1"
            strokeWidth="0.5"
            opacity="0.8"
          />
        ) : (
          // Standard trackpad
          <path
            d="M 180 232 L 220 232 L 221 237 L 179 237 Z"
            fill="#334155"
            stroke="#475569"
            strokeWidth="0.5"
            opacity="0.65"
          />
        )}

        {/* Front Edge Highlight (Adds 3D thickness) */}
        <path
          d="M 12 238 L 388 238 L 384 242 L 16 242 Z"
          fill={baseColor}
        />
        {/* Soft neon underglow casting onto front edge */}
        <path
          d="M 80 239 L 320 239 L 316 241 L 84 241 Z"
          fill={accentColor}
          opacity="0.6"
        />

        {/* Display Lid rubber foot bumpers shadow / reflection */}
        <ellipse cx="200" cy="246" rx="140" ry="4" fill="#000" opacity="0.25" />
      </svg>
    </div>
  );
}
