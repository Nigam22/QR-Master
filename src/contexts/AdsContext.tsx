import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AdsService, AD_UNIT_IDS, FeatureQrType } from '@/services/AdsService';

// Context types
interface AdsContextType {
  initialized: boolean;
  isPremium: boolean;
  isCustomQrUnlocked: boolean;
  unlockedStyleId: string | null;
  isFeatureUnlocked: boolean;
  unlockedFeatureType: FeatureQrType | null;
  setPremium: (isPremium: boolean) => void;
  showBanner: (screen: 'scan' | 'scanResult' | 'history' | 'generator') => Promise<void>;
  hideBanner: (screen?: 'scan' | 'scanResult' | 'history' | 'generator') => Promise<void>;
  showInterstitialIfNeeded: () => Promise<void>;
  incrementAction: () => number;
  watchRewardedAdForCustomQr: (styleId?: string) => Promise<boolean>;
  consumeCustomQrUnlock: () => void;
  watchRewardedAdForFeature: (featureType: FeatureQrType) => Promise<boolean>;
  consumeFeatureUnlock: () => void;
  refreshUnlockStatus: () => void;
}

// Default context values
const AdsContext = createContext<AdsContextType | undefined>(undefined);

// Ad provider component
export const AdsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [initialized, setInitialized] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [isCustomQrUnlocked, setIsCustomQrUnlocked] = useState(false);
  const [unlockedStyleId, setUnlockedStyleId] = useState<string | null>(null);
  const [isFeatureUnlocked, setIsFeatureUnlocked] = useState(false);
  const [unlockedFeatureType, setUnlockedFeatureType] = useState<FeatureQrType | null>(null);

  // Refresh unlock status
  const refreshUnlockStatus = useCallback(() => {
    setIsPremium(AdsService.isPremium());
    setIsCustomQrUnlocked(AdsService.isCustomQrUnlocked());
    setUnlockedStyleId(AdsService.getUnlockedStyleId());
    setIsFeatureUnlocked(AdsService.isFeatureUnlocked());
    setUnlockedFeatureType(AdsService.getUnlockedFeatureType());
  }, []);

  // Initialize ads service
  useEffect(() => {
    const initAds = async () => {
      await AdsService.initialize();
      refreshUnlockStatus();
      setInitialized(true);
    };

    initAds();
  }, [refreshUnlockStatus]);

  const setPremium = useCallback((premium: boolean) => {
    AdsService.setPremiumStatus(premium);
    setIsPremium(premium);
  }, []);

  const showBanner = useCallback(async (screen: 'scan' | 'scanResult' | 'history' | 'generator') => {
    if (isPremium) return;
    
    const adUnitId = screen === 'scanResult' 
      ? AD_UNIT_IDS.BANNER_SCAN_RESULT 
      : screen === 'scan'
      ? AD_UNIT_IDS.BANNER_SCAN_RESULT
      : screen === 'generator'
      ? AD_UNIT_IDS.BANNER_GENERATOR
      : AD_UNIT_IDS.BANNER_HISTORY;
    
    await AdsService.showBanner(screen, adUnitId);
  }, [isPremium]);

  const hideBanner = useCallback(async (screen?: 'scan' | 'scanResult' | 'history' | 'generator') => {
    await AdsService.hideBanner(screen);
  }, []);

  const showInterstitialIfNeeded = useCallback(async () => {
    if (AdsService.shouldShowInterstitial()) {
      await AdsService.showInterstitial();
    }
  }, []);

  const incrementAction = useCallback(() => {
    return AdsService.incrementActionCount();
  }, []);

  const watchRewardedAdForCustomQr = useCallback(async (styleId?: string): Promise<boolean> => {
    if (!styleId) {
      console.warn('[AdsContext] watchRewardedAdForCustomQr called without styleId');
      return false;
    }
    console.log('[AdsContext] watchRewardedAdForCustomQr start for style', styleId);
    const result = await AdsService.showRewardedForCustomQr(styleId);
    if (result.rewarded) {
      refreshUnlockStatus();
      console.log('[AdsContext] reward applied for style', styleId);
    } else {
      console.warn('[AdsContext] reward not granted for style', styleId);
    }
    return result.rewarded;
  }, [refreshUnlockStatus]);

  const consumeCustomQrUnlock = useCallback(() => {
    AdsService.consumeCustomQrUnlock();
    refreshUnlockStatus();
  }, [refreshUnlockStatus]);

  const watchRewardedAdForFeature = useCallback(async (featureType: FeatureQrType): Promise<boolean> => {
    console.log('[AdsContext][Feature] watchRewardedAdForFeature start', featureType);
    const result = await AdsService.showRewardedForFeature(featureType);
    if (result.rewarded) {
      refreshUnlockStatus();
      console.log('[AdsContext][Feature] reward applied', featureType);
    } else {
      console.warn('[AdsContext][Feature] reward not granted', featureType);
    }
    return result.rewarded;
  }, [refreshUnlockStatus]);

  const consumeFeatureUnlock = useCallback(() => {
    AdsService.consumeFeatureUnlock();
    refreshUnlockStatus();
  }, [refreshUnlockStatus]);

  return (
    <AdsContext.Provider
      value={{
        initialized,
        isPremium,
        isCustomQrUnlocked,
        unlockedStyleId,
        isFeatureUnlocked,
        unlockedFeatureType,
        setPremium,
        showBanner,
        hideBanner,
        showInterstitialIfNeeded,
        incrementAction,
        watchRewardedAdForCustomQr,
        consumeCustomQrUnlock,
        watchRewardedAdForFeature,
        consumeFeatureUnlock,
        refreshUnlockStatus,
      }}
    >
      {children}
    </AdsContext.Provider>
  );
};

// Hook to use ads context
export const useAds = () => {
  const context = useContext(AdsContext);
  if (context === undefined) {
    throw new Error('useAds must be used within an AdsProvider');
  }
  return context;
};