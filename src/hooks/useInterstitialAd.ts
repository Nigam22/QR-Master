import { useCallback } from 'react';
import { useAds } from '@/contexts/AdsContext';

// Hook to handle interstitial ad logic
export const useInterstitialAd = () => {
  const { showInterstitialIfNeeded, incrementAction } = useAds();

  // Call this after a scan or generate action
  const onActionComplete = useCallback(async () => {
    // Increment action count, then decide if we should show interstitial
    incrementAction();
    await showInterstitialIfNeeded();
  }, [incrementAction, showInterstitialIfNeeded]);

  return {
    onActionComplete,
  };
};
