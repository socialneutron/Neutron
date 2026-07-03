export const NeutronLogo = ({ size = 80, animated = false, showText = false }) => {
  const imgSrc = '/neutron-logo.png'

  return (
    <div
      className={`logo-container ${animated ? 'logo-animated' : ''}`}
      style={{ width: size, height: size, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: showText ? 8 : 0 }}
    >
      <img
        src={imgSrc}
        alt="Neutron"
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          filter: 'drop-shadow(0 0 20px rgba(100, 140, 255, 0.35))',
        }}
        onError={(e) => {
          // Fallback to SVG if PNG not found
          e.target.style.display = 'none'
          e.target.nextSibling.style.display = 'block'
        }}
      />
      {/* SVG fallback */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'none', position: 'absolute' }}
      >
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="outer-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feFlood floodColor="#4dabff" floodOpacity="0.5" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feComposite in="SourceGraphic" in2="glow" operator="over" />
          </filter>
        </defs>
        <path
          d="M50 15C30 15 15 35 15 55C15 75 35 85 55 85C75 85 85 65 85 45C85 25 70 15 50 15Z"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          filter="url(#glow)"
          style={{ opacity: 0.9 }}
        />
        <circle cx="78" cy="30" r="4" fill="white" filter="url(#glow)" />
        <path
          d="M50 35C50 45 45 50 35 50C45 50 50 55 50 65C50 55 55 50 65 50C55 50 50 45 50 35Z"
          fill="white"
          filter="url(#outer-glow)"
        />
      </svg>
      {showText && (
        <span
          className="neutron-brand"
          style={{ fontSize: Math.max(12, size * 0.22), letterSpacing: '0.15em' }}
        >
          neutron
        </span>
      )}
      <style dangerouslySetInnerHTML={{ __html: `
        .logo-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .logo-animated img,
        .logo-animated svg {
          animation: floatLogo 6s ease-in-out infinite;
        }
        @keyframes floatLogo {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-5px) scale(1.02); }
        }
      `}} />
    </div>
  )
}
