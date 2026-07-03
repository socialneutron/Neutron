import React from 'react';

interface NeutronLogoProps {
  className?: string;
  glow?: boolean;
}

export default function NeutronLogo({ className = "w-10 h-10", glow = true }: NeutronLogoProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${glow ? 'drop-shadow-[0_0_12px_rgba(0,191,255,0.45)]' : ''} transition-all duration-300`}
    >
      {/* Outer Glow & Blur Filters */}
      <defs>
        <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="star-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Orbit Trajectory (Dynamic fluid nucleus loop) */}
      <path
        d="M 45 22 
           C 55 22, 63 26, 64.5 31
           M 70 38
           C 74 46, 75 58, 62 67
           C 51 75, 43 78, 32 75
           C 22 72, 20 62, 23 50
           C 26 38, 35 22, 45 22 Z"
        stroke="url(#orbit-gradient)"
        strokeWidth="2.8"
        strokeLinecap="round"
        filter="url(#neon-glow)"
        className="animate-[pulse_4s_ease-in-out_infinite]"
      />

      {/* Trajectory Underlay Gradient for precise glow matching image */}
      <path
        d="M 45 22 
           C 55 22, 63 26, 64.5 31
           M 70 38
           C 74 46, 75 58, 62 67
           C 51 75, 43 78, 32 75
           C 22 72, 20 62, 23 50
           C 26 38, 35 22, 45 22 Z"
        stroke="#FFFFFF"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.9"
      />

      {/* Orbiting Electron Dot (Positioned right outside top-right curve near gap) */}
      <circle
        cx="67"
        cy="33"
        r="3.5"
        fill="#FFFFFF"
        filter="url(#neon-glow)"
        className="animate-[pulse_2s_ease-in-out_infinite]"
      />
      
      {/* Centered four-point shining star */}
      <path
        d="M 48 31
           Q 48 45, 34 45
           Q 48 45, 48 59
           Q 48 45, 62 45
           Q 48 45, 48 31 Z"
        fill="#FFFFFF"
        filter="url(#star-glow)"
      />

      {/* Gradients */}
      <defs>
        <linearGradient id="orbit-gradient" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E0F7FF" />
          <stop offset="40%" stopColor="#00BFFF" />
          <stop offset="100%" stopColor="#4B0082" />
        </linearGradient>
      </defs>
    </svg>
  );
}
