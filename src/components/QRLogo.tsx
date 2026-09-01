import React from 'react';
import { QrCode } from 'lucide-react';

interface QRLogoProps {
  size?: number;
  animated?: boolean;
}

// Animated QR logo component for splash screen and branding
export const QRLogo: React.FC<QRLogoProps> = ({ size = 80, animated = true }) => {
  return (
    <div className={`relative ${animated ? 'animate-float' : ''}`}>
      {/* Glow effect behind the logo */}
      <div 
        className="absolute inset-0 gradient-primary rounded-3xl blur-2xl opacity-50"
        style={{ transform: 'scale(1.2)' }}
      />
      
      {/* Main logo container */}
      <div 
        className={`relative gradient-primary p-5 rounded-3xl glow-primary ${animated ? 'animate-qr-morph' : ''}`}
        style={{ width: size, height: size }}
      >
        <QrCode 
          className="w-full h-full text-primary-foreground" 
          strokeWidth={1.5}
        />
      </div>
    </div>
  );
};
