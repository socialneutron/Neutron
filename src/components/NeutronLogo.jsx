export const NeutronLogo = ({ size = 80, animated = false }) => (
  <div className={`logo-container ${animated ? 'logo-animated' : ''}`} style={{ width: size, height: size }}>
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
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
      
      {/* Organic Orbital Path */}
      <path 
        d="M50 15C30 15 15 35 15 55C15 75 35 85 55 85C75 85 85 65 85 45C85 25 70 15 50 15Z" 
        stroke="white" 
        strokeWidth="2.5" 
        strokeLinecap="round"
        filter="url(#glow)"
        style={{ opacity: 0.9 }}
      />
      
      {/* The small dot on the path */}
      <circle cx="78" cy="30" r="4" fill="white" filter="url(#glow)" />
      
      {/* 4-pointed Star in center */}
      <path 
        d="M50 35C50 45 45 50 35 50C45 50 50 55 50 65C50 55 55 50 65 50C55 50 50 45 50 35Z" 
        fill="white" 
        filter="url(#outer-glow)"
      />
    </svg>
    <style dangerouslySetInnerHTML={{ __html: `
      .logo-container { 
        position: relative; 
        display: flex; 
        align-items: center; 
        justify-content: center;
        filter: drop-shadow(0 0 15px rgba(77, 171, 255, 0.4));
      }
      .logo-animated svg { animation: floatLogo 6s ease-in-out infinite; }
      @keyframes floatLogo {
        0%, 100% { transform: translateY(0) scale(1); }
        50% { transform: translateY(-5px) scale(1.02); }
      }
    `}} />
  </div>
)

