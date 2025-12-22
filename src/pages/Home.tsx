import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanLine, QrCode, History, Sparkles } from 'lucide-react';
import { QRLogo } from '@/components/QRLogo';
import { AnimatedCard } from '@/components/ui/AnimatedCard';

// Home screen with main action buttons
export const Home: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen pb-24 px-4">
      {/* Header section with gradient background */}
      <div className="gradient-primary -mx-4 px-4 pt-12 pb-16 rounded-b-[3rem] mb-8">
        <div className="flex flex-col items-center text-center">
          <QRLogo size={80} animated={false} />
          <h1 className="mt-4 text-3xl font-bold text-primary-foreground">
            QR Master
          </h1>
          <p className="mt-1 text-primary-foreground/80">
            Scan & Generate QR Codes Instantly
          </p>
        </div>
      </div>
      
      {/* Main action buttons */}
      <div className="space-y-4 animate-slide-up">
        {/* Scan QR Button */}
        <AnimatedCard 
          onClick={() => navigate('/scan')}
          className="flex items-center gap-4"
          glowing
        >
          <div className="p-4 rounded-2xl gradient-primary">
            <ScanLine className="w-8 h-8 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-foreground">Scan QR Code</h2>
            <p className="text-muted-foreground text-sm">Use camera or gallery</p>
          </div>
          <Sparkles className="w-5 h-5 text-primary" />
        </AnimatedCard>
        
        {/* Generate QR Button */}
        <AnimatedCard 
          onClick={() => navigate('/generate')}
          className="flex items-center gap-4"
        >
          <div className="p-4 rounded-2xl gradient-secondary">
            <QrCode className="w-8 h-8 text-secondary-foreground" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-foreground">Generate QR Code</h2>
            <p className="text-muted-foreground text-sm">Text, URL, WiFi, Contact & more</p>
          </div>
          <Sparkles className="w-5 h-5 text-accent" />
        </AnimatedCard>
        
        {/* Quick access to history */}
        <AnimatedCard 
          onClick={() => navigate('/history')}
          className="flex items-center gap-4"
          hoverable
        >
          <div className="p-4 rounded-2xl bg-muted">
            <History className="w-8 h-8 text-foreground" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-foreground">View History</h2>
            <p className="text-muted-foreground text-sm">Past scans & generated codes</p>
          </div>
        </AnimatedCard>
      </div>
      
      {/* Features highlight */}
      <div className="mt-8 grid grid-cols-3 gap-3 animate-fade-in">
        {[
          { icon: '⚡', label: 'Fast' },
          { icon: '🔒', label: 'Secure' },
          { icon: '📱', label: 'Offline' },
        ].map(({ icon, label }) => (
          <div 
            key={label}
            className="glass rounded-xl p-3 text-center"
          >
            <span className="text-2xl">{icon}</span>
            <p className="text-sm text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
