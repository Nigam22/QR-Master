import React, { useEffect, useState } from 'react';
import { useAds } from '@/contexts/AdsContext';

interface BannerAdPlaceholderProps {
  screen: 'scan' | 'scanResult' | 'history' | 'generator';
  placement?: 'fixed' | 'inline';
}

// Banner ad placeholder component - handles loading and auto-hide on failure
export const BannerAdPlaceholder: React.FC<BannerAdPlaceholderProps> = ({ screen, placement = 'fixed' }) => {
  const { isPremium, initialized, showBanner, hideBanner } = useAds();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isPremium || !initialized) {
      setVisible(false);
      // Hide any existing banners if premium or not initialized
      hideBanner();
      return;
    }

    const loadBanner = async () => {
      try {
        // showBanner already handles hiding existing banners, so just call it
        await showBanner(screen);
        setVisible(true);
      } catch {
        setVisible(false);
      }
    };

    loadBanner();

    // Cleanup function to hide banner when component unmounts
    return () => {
      // AdMob is single-banner; hide globally to prevent leaking onto the next screen.
      hideBanner();
    };
  }, [screen, isPremium, initialized, showBanner, hideBanner]);

  // For web preview, show a placeholder
  if (isPremium) return null;

  // Positioning
  const positionClasses = placement === 'fixed'
    ? 'fixed bottom-20 left-0 right-0'
    : 'w-full mt-2';

  return (
    <div 
      className={`${positionClasses} bg-background/80 backdrop-blur-sm transition-all duration-300 border-t ${
        visible ? 'h-14 opacity-100' : 'h-0 opacity-0'
      }`}
    >
      {visible && (
        <div className="h-full flex items-center justify-center text-xs text-foreground">
          <span className="px-4 py-2 bg-muted/50 rounded-lg">Ad Space</span>
        </div>
      )}
    </div>
  );
};