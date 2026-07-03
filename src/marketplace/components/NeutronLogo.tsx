import React from "react";
import { motion } from "motion/react";

export default function NeutronLogo({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-[0_0_12px_rgba(59,130,246,0.5)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Radial gradient for the orbital ring glow */}
          <linearGradient id="orbitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="35%" stopColor="#60a5fa" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.85" />
          </linearGradient>

          {/* Intense core glow filter */}
          <filter id="coreGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Organic main orbital loop (the blob) */}
        <motion.path
          d="M 48 18 C 65 17, 72 22, 79 38 C 85 52, 85 68, 71 78 C 58 87, 36 84, 25 76 C 14 67, 16 52, 23 38 C 29 25, 35 19, 48 18 Z"
          stroke="url(#orbitGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          filter="url(#coreGlow)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />

        {/* 2. Crisp, glowing 4-pointed Star (the neutron focus) */}
        <motion.path
          d="M 50 36 Q 50 50 64 50 Q 50 50 50 64 Q 50 50 36 50 Q 50 50 50 36 Z"
          fill="#ffffff"
          filter="url(#coreGlow)"
          animate={{
            scale: [1, 1.06, 1],
            opacity: [0.9, 1, 0.9],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* 3. Tiny glowing decorative orbit particle */}
        <motion.circle
          cx="79"
          cy="38"
          r="3"
          fill="#ffffff"
          filter="url(#coreGlow)"
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.85, 1, 0.85],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </svg>
    </div>
  );
}
