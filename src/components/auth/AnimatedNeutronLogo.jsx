export default function AnimatedNeutronLogo({ size = 280 }) {
  return (
    <div className="animated-logo-root" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="animated-logo-svg"
      >
        <defs>
          <filter id="a-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="a-outer-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feFlood floodColor="#4dabff" floodOpacity="0.5" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feComposite in="SourceGraphic" in2="glow" operator="over" />
          </filter>
          <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4dabff" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#a78bfa" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#4dabff" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* Outer glow ring — breathing animation */}
        <path
          d="M50 15C30 15 15 35 15 55C15 75 35 85 55 85C75 85 85 65 85 45C85 25 70 15 50 15Z"
          stroke="url(#ring-gradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
          filter="url(#a-glow)"
          className="animated-logo-ring"
          style={{ opacity: 0.9 }}
        />

        {/* Star dot */}
        <circle
          cx="78"
          cy="30"
          r="4"
          fill="white"
          filter="url(#a-glow)"
          className="animated-logo-dot"
        />

        {/* Star / sparkle — twinkle animation */}
        <path
          d="M50 35C50 45 45 50 35 50C45 50 50 55 50 65C50 55 55 50 65 50C55 50 50 45 50 35Z"
          fill="white"
          filter="url(#a-outer-glow)"
          className="animated-logo-star"
        />
      </svg>

      <style dangerouslySetInnerHTML={{ __html: `
        .animated-logo-root {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Ring breathing/pulsing glow */
        .animated-logo-ring {
          animation: aRingBreathe 5s ease-in-out infinite;
        }
        @keyframes aRingBreathe {
          0%, 100% { filter: url(#a-glow); opacity: 0.85; }
          50% { filter: url(#a-glow) brightness(1.4); opacity: 1; }
        }

        /* Star twinkle — subtle rotation + opacity */
        .animated-logo-star {
          transform-origin: 50px 50px;
          animation: aStarTwinkle 6s ease-in-out infinite;
        }
        @keyframes aStarTwinkle {
          0%, 100% { transform: rotate(0deg) scale(1); opacity: 0.95; }
          25% { transform: rotate(8deg) scale(1.04); opacity: 1; }
          50% { transform: rotate(0deg) scale(0.97); opacity: 0.85; }
          75% { transform: rotate(-8deg) scale(1.04); opacity: 1; }
        }

        /* Dot shimmer */
        .animated-logo-dot {
          animation: aDotPulse 4s ease-in-out infinite;
        }
        @keyframes aDotPulse {
          0%, 100% { opacity: 0.8; r: 4; }
          50% { opacity: 1; r: 4.5; }
        }

        /* Ring gradient shimmer — rotating stroke */
        .animated-logo-svg {
          animation: aSvgFloat 8s ease-in-out infinite;
        }
        @keyframes aSvgFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-4px) rotate(1deg); }
        }
      `}} />
    </div>
  )
}
