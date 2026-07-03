import React, { createContext, useContext, useState, useEffect } from 'react';

interface AnimationContextType {
  animationsEnabled: boolean;
  toggleAnimations: () => void;
  statusMessage: string;
}

const AnimationContext = createContext<AnimationContextType | undefined>(undefined);

export function AnimationProvider({ children }: { children: React.ReactNode }) {
  const [animationsEnabled, setAnimationsEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('neutron_animations_enabled');
    return saved === null ? true : saved === 'true';
  });
  const [statusMessage, setStatusMessage] = useState<string>('');

  useEffect(() => {
    localStorage.setItem('neutron_animations_enabled', String(animationsEnabled));
    // Trigger the notification
    setStatusMessage(animationsEnabled ? 'Animations Enabled' : 'Animations Disabled');
    const timer = setTimeout(() => {
      setStatusMessage('');
    }, 3000);
    return () => clearTimeout(timer);
  }, [animationsEnabled]);

  const toggleAnimations = () => {
    setAnimationsEnabled(prev => !prev);
  };

  return (
    <AnimationContext.Provider value={{ animationsEnabled, toggleAnimations, statusMessage }}>
      {children}
      {statusMessage && (
        <div 
          id="toast-status-msg"
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl border transition-all duration-300 transform scale-100 flex items-center space-x-3 backdrop-blur-md ${
            animationsEnabled 
              ? 'bg-neutral-900/95 border-[#00BFFF] text-white shadow-[#00BFFF]/20' 
              : 'bg-neutral-900 border-neutral-800 text-neutral-400'
          }`}
        >
          <div className={`w-2.5 h-2.5 rounded-full ${animationsEnabled ? 'bg-[#00BFFF] animate-pulse shadow-[0_0_8px_#00BFFF]' : 'bg-neutral-600'}`}></div>
          <span className="text-sm font-mono tracking-wider font-semibold uppercase">{statusMessage}</span>
        </div>
      )}
    </AnimationContext.Provider>
  );
}

export function useAnimations() {
  const context = useContext(AnimationContext);
  if (context === undefined) {
    throw new Error('useAnimations must be used within an AnimationProvider');
  }
  return context;
}
