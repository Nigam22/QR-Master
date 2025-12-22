import React from 'react';

// Neon scanner overlay with animated scan line
export const ScannerOverlay: React.FC = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {/* Scanner frame */}
      <div className="relative w-72 h-72">
        {/* Corner decorations */}
        <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-scanner-neon rounded-tl-lg animate-pulse-glow" />
        <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-scanner-neon rounded-tr-lg animate-pulse-glow" />
        <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-scanner-neon rounded-bl-lg animate-pulse-glow" />
        <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-scanner-neon rounded-br-lg animate-pulse-glow" />
        
        {/* Animated scan line */}
        <div 
          className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-scanner-neon to-transparent animate-scan-line"
          style={{
            boxShadow: '0 0 10px hsl(150 100% 50% / 0.8), 0 0 20px hsl(150 100% 50% / 0.6)',
          }}
        />
        
        {/* Glow effect */}
        <div className="absolute inset-4 border border-scanner-neon/20 rounded-lg" />
      </div>
    </div>
  );
};
