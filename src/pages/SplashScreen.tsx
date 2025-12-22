import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import appIcon from '@/assets/app-icon.jpg';

// Animated splash screen shown on app launch (max 3 seconds)
export const SplashScreen: React.FC = () => {
  const navigate = useNavigate();
  const [fadeOut, setFadeOut] = useState(false);
  const hasShownSplash = useRef(false);
  
  useEffect(() => {
    // Prevent showing splash screen when returning from background
    // Check if we've already shown the splash in this session
    const splashShown = sessionStorage.getItem('splashShown');
    
    if (splashShown) {
      // Already shown splash, go directly to home
      navigate('/home');
      return;
    }
    
    // Mark that splash has been shown in this session
    sessionStorage.setItem('splashShown', 'true');
    
    // Current time: 2100ms, 30% more = 2100 * 1.3 = 2730ms
    // Show splash for ~2.7 seconds then navigate to home (total under 3.2s)
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => navigate('/home'), 400);
    }, 2730);
    
    return () => clearTimeout(timer);
  }, [navigate]);
  
  return (
    <div 
      className={`min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900 flex flex-col items-center justify-center transition-opacity duration-400 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
    >
      {/* App icon */}
      <div className="animate-scale-in">
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-3xl blur-2xl opacity-60 bg-gradient-to-br from-purple-500 to-pink-500 scale-110" />
          
          {/* Icon container */}
          <img 
            src={appIcon} 
            alt="QR Master" 
            className="relative w-28 h-28 rounded-3xl shadow-2xl object-cover"
          />
        </div>
      </div>
      
      {/* App title */}
      <h1 className="mt-8 text-4xl font-bold text-white animate-fade-in">
        QR Master
      </h1>
      <p className="mt-2 text-purple-200/80 text-lg animate-fade-in">
        Scanner & Generator
      </p>
      
      {/* Loading indicator */}
      <div className="mt-12 flex gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-purple-400/70 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
};