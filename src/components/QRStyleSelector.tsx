import React from 'react';
import { Lock, Check, Sparkles } from 'lucide-react';
import { QR_STYLES, QRStyleConfig } from '@/utils/qrStyles';
import { useAds } from '@/contexts/AdsContext';
import { RewardedAdButton } from '@/components/ads/RewardedAdButton';

interface QRStyleSelectorProps {
  selectedStyleId: string;
  onSelectStyle: (style: QRStyleConfig) => void;
}

export const QRStyleSelector: React.FC<QRStyleSelectorProps> = ({
  selectedStyleId,
  onSelectStyle,
}) => {
  const { isCustomQrUnlocked, unlockedStyleId, refreshUnlockStatus } = useAds();
  
  // Refresh unlock status when component mounts
  React.useEffect(() => {
    refreshUnlockStatus();
  }, [refreshUnlockStatus]);
  
  const canUsePremiumStyle = (style: QRStyleConfig) => {
    if (!style.premium) return true;
    // After watching ad, ALL premium themes are unlocked temporarily
    const unlocked = isCustomQrUnlocked;
    console.log('[QRStyleSelector] canUsePremiumStyle for', style.id, ':', unlocked, '(isCustomQrUnlocked:', isCustomQrUnlocked, ')');
    return unlocked;
  };

  const handleStyleClick = (style: QRStyleConfig) => {
    // Always allow selection of any style
    onSelectStyle(style);
  };

  const selectedStyle = QR_STYLES.find((s) => s.id === selectedStyleId);

  // Debug log for button visibility/state
  React.useEffect(() => {
    console.log('[QRStyleSelector] render; selectedStyleId', selectedStyleId, 'unlockedStyleId', unlockedStyleId);
  }, [selectedStyleId, unlockedStyleId]);

  const getStylePreview = (style: QRStyleConfig) => {
    if (style.gradient) {
      return `linear-gradient(${style.gradient.rotation || 45}deg, ${style.gradient.colors.join(', ')})`;
    }
    return style.fgColor;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          <span className="font-semibold">QR Style</span>
        </div>
        
        {/* Always show "Watch Ad to Unlock" button when themes are locked */}
        {!isCustomQrUnlocked && (
          <RewardedAdButton
            onUnlock={() => refreshUnlockStatus()}
            targetStyleId="all-themes"
            className="text-xs px-3 py-1.5 rounded-lg bg-accent/10 hover:bg-accent/20 transition-colors flex items-center gap-1"
          >
            <Lock className="w-3 h-3" />
            <span>Watch Ad to Unlock</span>
          </RewardedAdButton>
        )}
        
        {/* Show "1 use left" when themes are unlocked */}
        {isCustomQrUnlocked && (
          <span className="text-xs text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
            1 use left - Pick any theme
          </span>
        )}
      </div>
      
      {/* Horizontal scroll style selector */}
      <div className="overflow-x-auto -mx-4 px-4 pb-2">
        <div className="flex gap-3 min-w-max">
          {QR_STYLES.map((style) => {
            const isSelected = selectedStyleId === style.id;
            const canUse = canUsePremiumStyle(style);
            
            return (
              <button
                key={style.id}
                onClick={() => handleStyleClick(style)}
                className={`relative flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${
                  isSelected
                    ? 'bg-primary/10 ring-2 ring-primary scale-105'
                    : 'bg-muted/50 hover:bg-muted'
                }`}
              >
                {/* Style preview circle */}
                <div
                  className={`w-12 h-12 rounded-xl relative overflow-hidden ${
                    style.dotStyle === 'dots' ? 'p-1' : ''
                  }`}
                  style={{ background: getStylePreview(style) }}
                >
                  {style.dotStyle === 'dots' && (
                    <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-0.5 p-1">
                      {[...Array(9)].map((_, i) => (
                        <div key={i} className="w-2 h-2 rounded-full bg-white/30" />
                      ))}
                    </div>
                  )}
                  {style.dotStyle === 'rounded' && (
                    <div className="absolute inset-2 rounded-lg bg-white/20" />
                  )}
                </div>

                {/* Style name */}
                <span className="text-xs font-medium">{style.name}</span>

                {/* Selected indicator */}
                {isSelected && (
                  <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}

                {/* Premium badge - always show for premium themes */}
                {style.premium && (
                  <div className="absolute -top-1 -left-1">
                    <Sparkles className="w-4 h-4 text-accent" />
                  </div>
                )}
                
                {/* Lock overlay for premium styles when not unlocked */}
                {style.premium && !canUse && (
                  <div className="absolute inset-0 bg-black/20 rounded-2xl flex items-center justify-center backdrop-blur-[1px]">
                    <Lock className="w-5 h-5 text-white/80" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};