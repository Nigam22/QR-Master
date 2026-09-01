// AdMob Ads Service for Capacitor
// Replace these with your actual AdMob unit IDs before production

export const AD_UNIT_IDS = {
  // Production Ad Unit IDs (from your AdMob screenshot)
  // Banners (3 units)
  BANNER_GENERATOR: 'ca-app-pub-3897206764213087/2898965730',
  BANNER_HISTORY: 'ca-app-pub-3897206764213087/6898044204',
  BANNER_SCAN_RESULT: 'ca-app-pub-3897206764213087/5584962538',
  // Interstitial
  INTERSTITIAL: 'ca-app-pub-3897206764213087/2819074685',
  // Rewarded (theme unlock)
  REWARDED: 'ca-app-pub-3897206764213087/2580892220',
  // Rewarded (feature unlock) - using SAME ad unit as theme for now (until app is published)
  REWARDED_FEATURE: 'ca-app-pub-3897206764213087/2580892220', // Same as REWARDED for testing
};

// Storage keys
const STORAGE_KEYS = {
  ACTION_COUNT: 'ads_action_count',
  LAST_INTERSTITIAL: 'ads_last_interstitial', // Stores action count when interstitial last shown
  PREMIUM_STATUS: 'ads_premium_status',
  CUSTOM_QR_SINGLE_USE: 'ads_custom_qr_single_use', // Single use unlock for one QR generation
  CUSTOM_QR_STYLE_ID: 'ads_custom_qr_style_id', // Which premium style is unlocked for one use
  FEATURE_SINGLE_USE: 'ads_feature_single_use', // Single use unlock for one feature QR generation
  FEATURE_TYPE: 'ads_feature_type', // Which feature (qr type) is unlocked for one use
};

// Interstitial frequency (every 3 actions)
const INTERSTITIAL_FREQUENCY = 3;

export interface AdLoadResult {
  success: boolean;
  error?: string;
}

export interface RewardResult {
  rewarded: boolean;
  type?: string;
  amount?: number;
}

export type FeatureQrType = 'upi' | 'wifi' | 'contact' | 'sms';

class AdsServiceClass {
  private initialized = false;
  private bannerVisibleMap = new Map<'scan' | 'scanResult' | 'history' | 'generator', boolean>();
  private interstitialLoaded = false;
  private rewardedLoaded = false;
  private AdMob: any = null;

  // Initialize AdMob
  async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      // Check if we're in a native Capacitor environment
      const { Capacitor } = await import('@capacitor/core');
      if (!Capacitor.isNativePlatform()) {
        console.log('Running in web environment, ads disabled');
        this.initialized = true;
        return true;
      }

      // Dynamically import AdMob only in native environment
      const { AdMob } = await import('@capacitor-community/admob');
      this.AdMob = AdMob;

      // Initialize AdMob with test configuration
      await this.AdMob.initialize({
        // Use real ads. Keep your device/emulator in testingDevices while developing.
        initializeForTesting: false,
        testingDevices: ['EMULATOR'], // Add your real test device IDs here (AdMob Console -> Test devices)
      });

      this.initialized = true;
      console.log('AdMob initialized successfully');
      return true;
    } catch (error) {
      console.error('AdMob initialization failed:', error);
      this.initialized = true; // Still mark as initialized to prevent repeated attempts
      return false;
    }
  }

  // Show Banner Ad with screen-specific positioning
  async showBanner(screen: 'scan' | 'scanResult' | 'history' | 'generator', adUnitId: string): Promise<AdLoadResult> {
    if (this.isPremium() || !this.initialized || !this.AdMob) {
      return { success: false, error: 'Ads disabled or not initialized' };
    }

    try {
      // AdMob supports only one banner instance. Always hide any currently-visible banner first
      // so banners never leak between screens.
      await this.hideBanner();

      // If this screen's banner is already visible, do nothing
      if (this.isBannerVisible(screen)) {
        return { success: true };
      }
      
      const { BannerAdPosition, BannerAdSize } = await import('@capacitor-community/admob');
      
      // Determine position and margin based on screen
      const position = BannerAdPosition.BOTTOM_CENTER;
      const margin = 80; // Keep above bottom navigation / safe area
      
      await this.AdMob.showBanner({
        adId: adUnitId,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: position,
        margin: margin,
        isTesting: false,
      });
      
      this.bannerVisibleMap.set(screen, true);
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Banner ad failed:', error);
      return { success: false, error: errorMessage };
    }
  }

  // Hide Banner Ad for a specific screen
  async hideBanner(screen?: 'scan' | 'scanResult' | 'history' | 'generator'): Promise<void> {
    if (!this.AdMob) return;

    // Hide the active banner (single instance); track map for visibility bookkeeping
    try {
      await this.AdMob.hideBanner();
      // Clear the map since we've hidden the banner
      if (screen) {
      this.bannerVisibleMap.delete(screen);
      } else {
        // If no specific screen, clear all
        this.bannerVisibleMap.clear();
      }
    } catch (error) {
      console.error(`Hide banner failed:`, error);
      // Still clear the map even if hide fails
      if (screen) {
        this.bannerVisibleMap.delete(screen);
      } else {
        this.bannerVisibleMap.clear();
      }
    }
  }

  // Check if a specific banner is visible
  isBannerVisible(screen: 'scan' | 'scanResult' | 'history' | 'generator'): boolean {
    return this.bannerVisibleMap.get(screen) || false;
  }

  // Check if premium/unlocked
  isPremium(): boolean {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEYS.PREMIUM_STATUS) === 'true';
  }

  // Set premium status
  setPremiumStatus(isPremium: boolean): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.PREMIUM_STATUS, String(isPremium));
  }

  // Check if custom QR is unlocked (either by reward or purchase)
  isCustomQrUnlocked(): boolean {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEYS.CUSTOM_QR_SINGLE_USE) === 'true';
  }

  getUnlockedStyleId(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.CUSTOM_QR_STYLE_ID);
  }

  // Feature unlock (QR types) - completely separate from theme unlock
  isFeatureUnlocked(): boolean {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEYS.FEATURE_SINGLE_USE) === 'true';
  }

  getUnlockedFeatureType(): FeatureQrType | null {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEYS.FEATURE_TYPE);
    if (raw === 'upi' || raw === 'wifi' || raw === 'contact' || raw === 'sms') return raw;
    return null;
  }

  // Consume custom QR unlock
  consumeCustomQrUnlock(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.CUSTOM_QR_SINGLE_USE);
    localStorage.removeItem(STORAGE_KEYS.CUSTOM_QR_STYLE_ID);
  }

  consumeFeatureUnlock(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.FEATURE_SINGLE_USE);
    localStorage.removeItem(STORAGE_KEYS.FEATURE_TYPE);
  }

  // Increment action count for interstitial frequency
  incrementActionCount(): number {
    if (typeof localStorage === 'undefined') return 0;
    
    const currentCount = parseInt(localStorage.getItem(STORAGE_KEYS.ACTION_COUNT) || '0', 10);
    const nextCount = currentCount + 1;
    localStorage.setItem(STORAGE_KEYS.ACTION_COUNT, nextCount.toString());
    return nextCount;
  }

  // Check if should show interstitial
  shouldShowInterstitial(): boolean {
    if (this.isPremium()) return false;
    if (typeof localStorage === 'undefined') return false;
    
    const currentCount = parseInt(localStorage.getItem(STORAGE_KEYS.ACTION_COUNT) || '0', 10);
    const lastShownRaw = parseInt(localStorage.getItem(STORAGE_KEYS.LAST_INTERSTITIAL) || '0', 10);
    const lastShown = Number.isNaN(lastShownRaw) ? 0 : Math.min(lastShownRaw, currentCount);
    
    // Show every INTERSTITIAL_FREQUENCY actions
    return (currentCount - lastShown) >= INTERSTITIAL_FREQUENCY;
  }

  // Show Interstitial Ad
  async showInterstitial(): Promise<AdLoadResult> {
    if (this.isPremium() || !this.initialized || !this.AdMob) {
      return { success: false, error: 'Ads disabled or not initialized' };
    }

    try {
      // Prepare interstitial if not already loaded
      if (!this.interstitialLoaded) {
        await this.AdMob.prepareInterstitial({
          adId: AD_UNIT_IDS.INTERSTITIAL,
          isTesting: false,
        });
        this.interstitialLoaded = true;
      }

      // Show the interstitial
      await this.AdMob.showInterstitial();
      
      // Update last shown action count
      if (typeof localStorage !== 'undefined') {
        const currentCount = parseInt(localStorage.getItem(STORAGE_KEYS.ACTION_COUNT) || '0', 10);
        localStorage.setItem(STORAGE_KEYS.LAST_INTERSTITIAL, currentCount.toString());
      }
      
      // Reset interstitial loaded state for next load
      this.interstitialLoaded = false;
      
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Interstitial ad failed:', error);
      this.interstitialLoaded = false; // Reset on error
      return { success: false, error: errorMessage };
    }
  }

  // Show Rewarded Ad for custom QR unlock
  async showRewardedForCustomQr(styleId?: string): Promise<RewardResult> {
    // Decoupled from premium; rewarded flow works independently
    if (!this.initialized || !this.AdMob) {
      // Fallback for web/testing: grant once if initialized but AdMob is not available
      if (!this.AdMob && this.initialized && typeof localStorage !== 'undefined') {
        console.warn('[Ads] Rewarded fallback: AdMob not available (web/test). Granting single-use unlock for all themes');
        localStorage.setItem(STORAGE_KEYS.CUSTOM_QR_SINGLE_USE, 'true');
        if (styleId) {
          localStorage.setItem(STORAGE_KEYS.CUSTOM_QR_STYLE_ID, styleId);
        }
        return { rewarded: true, type: 'fallback', amount: 1 };
      }
      return { rewarded: false };
    }

    try {
      // IMPORTANT: Reward is delivered via plugin event `onRewardedVideoAdReward`,
      // not via the return value of showRewardVideoAd().
      const { RewardAdPluginEvents } = await import('@capacitor-community/admob');

      let settled = false;
      const listenerHandles: Array<{ remove: () => Promise<void> | void }> = [];

      const cleanup = async () => {
        while (listenerHandles.length) {
          const h = listenerHandles.pop();
          try {
            // Capacitor listener handles have remove()
            await h?.remove?.();
          } catch {
            // ignore
          }
        }
      };

      const resultPromise = new Promise<RewardResult>((resolve) => {
        const safeResolve = (res: RewardResult) => {
          if (settled) return;
          settled = true;
          void cleanup();
          resolve(res);
        };

        // Reward earned
        void this.AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward: { type: string; amount: number }) => {
          console.log('[Ads] Rewarded: earned reward event', reward);
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.CUSTOM_QR_SINGLE_USE, 'true');
            // Keep styleId only for debugging/compat; unlock is global.
            if (styleId) localStorage.setItem(STORAGE_KEYS.CUSTOM_QR_STYLE_ID, styleId);
          }
          safeResolve({ rewarded: true, type: reward?.type, amount: reward?.amount });
        }).then((h: any) => listenerHandles.push(h));

        // Dismissed (may happen with or without reward)
        void this.AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
          console.log('[Ads] Rewarded: dismissed');
          safeResolve({ rewarded: false });
        }).then((h: any) => listenerHandles.push(h));

        // Failures
        void this.AdMob.addListener(RewardAdPluginEvents.FailedToShow, (error: any) => {
          console.warn('[Ads] Rewarded: failed to show', error);
          safeResolve({ rewarded: false });
        }).then((h: any) => listenerHandles.push(h));

        void this.AdMob.addListener(RewardAdPluginEvents.FailedToLoad, (error: any) => {
          console.warn('[Ads] Rewarded: failed to load', error);
          safeResolve({ rewarded: false });
        }).then((h: any) => listenerHandles.push(h));

        // Timeout safety (avoid hanging forever)
        setTimeout(() => {
          console.warn('[Ads] Rewarded: timeout waiting for reward');
          safeResolve({ rewarded: false });
        }, 90000);
      });

      console.log('[Ads] Rewarded: preparing ad');
      await this.AdMob.prepareRewardVideoAd({
        adId: AD_UNIT_IDS.REWARDED,
        isTesting: false,
      });
      console.log('[Ads] Rewarded: ad prepared (loaded)');

      console.log('[Ads] Rewarded: showing ad');
      // showRewardVideoAd resolves with reward item shape, but NOT a reliable "earned reward" indicator.
      await this.AdMob.showRewardVideoAd();

      const finalResult = await resultPromise;
      console.log('[Ads] Rewarded: final result', finalResult);
      return finalResult;
    } catch (error) {
      console.error('[Ads] Rewarded: failed', error);
      return { rewarded: false };
    }
  }

  // Rewarded Ad for Feature unlocks (QR types) - separate ad unit, separate keys
  async showRewardedForFeature(featureType: FeatureQrType): Promise<RewardResult> {
    if (!this.initialized || !this.AdMob) {
      // Web/testing fallback
      if (!this.AdMob && this.initialized && typeof localStorage !== 'undefined') {
        console.warn('[Ads][Feature] Rewarded fallback: AdMob not available. Granting single-use feature unlock', featureType);
        localStorage.setItem(STORAGE_KEYS.FEATURE_SINGLE_USE, 'true');
        localStorage.setItem(STORAGE_KEYS.FEATURE_TYPE, featureType);
        return { rewarded: true, type: 'fallback', amount: 1 };
      }
      return { rewarded: false };
    }

    try {
      const { RewardAdPluginEvents } = await import('@capacitor-community/admob');
      let settled = false;
      const listenerHandles: Array<{ remove: () => Promise<void> | void }> = [];

      const cleanup = async () => {
        while (listenerHandles.length) {
          const h = listenerHandles.pop();
          try {
            await h?.remove?.();
          } catch {
            // ignore
          }
        }
      };

      const resultPromise = new Promise<RewardResult>((resolve) => {
        const safeResolve = (res: RewardResult) => {
          if (settled) return;
          settled = true;
          void cleanup();
          resolve(res);
        };

        void this.AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward: { type: string; amount: number }) => {
          console.log('[Ads][Feature] Reward earned', reward, 'for', featureType);
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.FEATURE_SINGLE_USE, 'true');
            localStorage.setItem(STORAGE_KEYS.FEATURE_TYPE, featureType);
          }
          safeResolve({ rewarded: true, type: reward?.type, amount: reward?.amount });
        }).then((h: any) => listenerHandles.push(h));

        void this.AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
          console.log('[Ads][Feature] Ad dismissed');
          safeResolve({ rewarded: false });
        }).then((h: any) => listenerHandles.push(h));

        void this.AdMob.addListener(RewardAdPluginEvents.FailedToShow, (error: any) => {
          console.warn('[Ads][Feature] Failed to show', error);
          safeResolve({ rewarded: false });
        }).then((h: any) => listenerHandles.push(h));

        void this.AdMob.addListener(RewardAdPluginEvents.FailedToLoad, (error: any) => {
          console.warn('[Ads][Feature] Failed to load', error);
          safeResolve({ rewarded: false });
        }).then((h: any) => listenerHandles.push(h));

        setTimeout(() => {
          console.warn('[Ads][Feature] Timeout waiting for reward');
          safeResolve({ rewarded: false });
        }, 90000);
      });

      console.log('[Ads][Feature] Preparing rewarded ad for', featureType);
      await this.AdMob.prepareRewardVideoAd({
        adId: AD_UNIT_IDS.REWARDED_FEATURE,
        isTesting: false,
      });
      console.log('[Ads][Feature] Showing rewarded ad for', featureType);
      await this.AdMob.showRewardVideoAd();

      const finalResult = await resultPromise;
      console.log('[Ads][Feature] Final result', finalResult);
      return finalResult;
    } catch (error) {
      console.error('[Ads][Feature] Failed', error);
      return { rewarded: false };
    }
  }
}

// Export singleton instance
export const AdsService = new AdsServiceClass();