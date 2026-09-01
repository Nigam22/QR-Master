import React, { useState } from 'react';
import { Play, Unlock, Crown, Loader2 } from 'lucide-react';
import { useAds } from '@/contexts/AdsContext';
import { toast } from 'sonner';

interface RewardedAdButtonProps {
  onUnlock?: () => void;
  targetStyleId?: string;
  children: React.ReactNode;
  className?: string;
}

// Rewarded ad button for single-use QR style unlock
export const RewardedAdButton: React.FC<RewardedAdButtonProps> = ({
  onUnlock,
  targetStyleId,
  children,
  className = '',
}) => {
  const { 
    isCustomQrUnlocked,
    unlockedStyleId,
    watchRewardedAdForCustomQr 
  } = useAds();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    // If already unlocked, just fire the unlock callback
    if (isCustomQrUnlocked) {
      console.log('[RewardedButton] themes already unlocked for one use');
      onUnlock?.();
      return;
    }

    setLoading(true);
    try {
      console.log('[RewardedButton] showing rewarded ad to unlock all themes');
      const success = await watchRewardedAdForCustomQr(targetStyleId || 'all-themes');
      if (success) {
        toast.success('All premium themes unlocked for one use!');
        onUnlock?.();
      } else {
        toast.error('Please watch the full ad to unlock themes.');
      }
    } catch {
      toast.error('Failed to load ad');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleClick}
      disabled={loading}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/10 hover:bg-accent/20 transition-colors disabled:opacity-50 ${className}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          <Play className="w-3 h-3" />
          {children}
        </>
      )}
    </button>
  );
};