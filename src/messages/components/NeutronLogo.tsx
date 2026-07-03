import React from 'react';

interface NeutronLogoProps {
  className?: string; // Applied to the wrapper container
  size?: number | string; // Size of the SVG itself
  showText?: boolean; // Whether to display the futuristic "neutron" text below
  textColor?: string;
}

export default function NeutronLogo({
  className = '',
  size = 48,
  showText = false,
  textColor = 'text-white'
}: NeutronLogoProps) {
  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      <div className="relative flex items-center justify-center">
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="overflow-visible"
        >
          <defs>
            {/* Linear gradient for orbital trail */}
            <linearGradient id="orbitGradient" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#7CC8FF" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#4DA6FF" />
              <stop offset="100%" stopColor="#8A51FF" stopOpacity="0.4" />
            </linearGradient>

            {/* Neon Glow filters resembling the vacuum space aesthetics */}
            <filter id="neutronSoftGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            
            <filter id="neutronStarGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background Ambient Aura */}
          <circle 
            cx="50" 
            cy="52" 
            r="38" 
            fill="#4DA6FF" 
            fillOpacity="0.04" 
            filter="url(#neutronSoftGlow)" 
          />

          {/* Floating Orbit Outer Path (The Organic fluid ring from the official logo) */}
          <path
            d="M 50,21 C 34,22 26,29 27,42 C 28,52 23,60 31,70 C 39,81 58,82 68,77 C 78,72 87,63 86,49 C 85,34 77,29 67,29 C 61,29 58,21 50,21 Z"
            stroke="url(#orbitGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            filter="url(#neutronSoftGlow)"
            className="animate-[pulse_4s_ease-in-out_infinite]"
          />

          {/* Inner Accent Path for extra layered depth */}
          <path
            d="M 50,21 C 34,22 26,29 27,42 C 28,52 23,60 31,70"
            stroke="#FFFFFF"
            strokeWidth="1"
            strokeOpacity="0.6"
            strokeLinecap="round"
            className="opacity-75"
          />

          {/* Glowing central 4-point Star representing the security seed */}
          <path
            d="M 50,34 Q 50,51 32,51 Q 50,51 50,68 Q 50,51 68,51 Q 50,51 50,34 Z"
            fill="#FFFFFF"
            filter="url(#neutronStarGlow)"
            className="drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]"
          />

          {/* Orbiting Satellite/Sphere atop the path (High right position) */}
          <circle
            cx="75"
            cy="39"
            r="4.5"
            fill="#FFFFFF"
            filter="url(#neutronSoftGlow)"
            className="drop-shadow-[0_0_6px_#7CC8FF]"
          />
        </svg>
      </div>

      {showText && (
        <span className={`font-display font-light text-xl tracking-[0.22em] lowercase text-center mt-3 ${textColor}`}>
          neutron
        </span>
      )}
    </div>
  );
}
