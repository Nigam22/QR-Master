import { Capacitor } from '@capacitor/core';

// Product IDs - Replace with your actual product IDs from App Store Connect / Google Play Console
export const PRODUCT_IDS = {
  PREMIUM_MONTHLY: 'qrmaster_premium_monthly',
  PREMIUM_YEARLY: 'qrmaster_premium_yearly',
  PREMIUM_LIFETIME: 'qrmaster_premium_lifetime',
};

export interface Product {
  id: string;
  title: string;
  description: string;
  price: string;
  priceAmount: number;
  currency: string;
  type: 'subscription' | 'lifetime';
  period?: string;
}

export interface PurchaseResult {
  success: boolean;
  productId?: string;
  error?: string;
}

class PurchaseServiceClass {
  private initialized = false;
  private products: Product[] = [];
  private Purchases: any = null;

  async initialize(): Promise<boolean> {
    if (this.initialized) return true;
    
    // Only initialize on native platforms
    if (!Capacitor.isNativePlatform()) {
      console.log('PurchaseService: Running in web mode, using mock products');
      this.products = this.getMockProducts();
      this.initialized = true;
      return true;
    }

    try {
      const module = await import('@capgo/capacitor-purchases');
      this.Purchases = module.CapacitorPurchases;
      
      // Configure with your RevenueCat API key (replace with your actual key)
      await this.Purchases.configure({
        apiKey: Capacitor.getPlatform() === 'ios' 
          ? 'your_ios_revenuecat_api_key' 
          : 'your_android_revenuecat_api_key',
      });
      
      this.initialized = true;
      await this.loadProducts();
      return true;
    } catch (error) {
      console.error('Failed to initialize purchases:', error);
      this.products = this.getMockProducts();
      this.initialized = true;
      return false;
    }
  }

  private getMockProducts(): Product[] {
    return [
      {
        id: PRODUCT_IDS.PREMIUM_MONTHLY,
        title: 'Premium Monthly',
        description: 'All features, billed monthly',
        price: '$2.99/month',
        priceAmount: 2.99,
        currency: 'USD',
        type: 'subscription',
        period: 'month',
      },
      {
        id: PRODUCT_IDS.PREMIUM_YEARLY,
        title: 'Premium Yearly',
        description: 'All features, billed yearly (Save 50%)',
        price: '$17.99/year',
        priceAmount: 17.99,
        currency: 'USD',
        type: 'subscription',
        period: 'year',
      },
      {
        id: PRODUCT_IDS.PREMIUM_LIFETIME,
        title: 'Premium Lifetime',
        description: 'One-time purchase, lifetime access',
        price: '$29.99',
        priceAmount: 29.99,
        currency: 'USD',
        type: 'lifetime',
      },
    ];
  }

  private async loadProducts(): Promise<void> {
    if (!this.Purchases || !Capacitor.isNativePlatform()) {
      return;
    }

    try {
      const offerings = await this.Purchases.getOfferings();
      if (offerings.current) {
        this.products = offerings.current.availablePackages.map((pkg: any) => ({
          id: pkg.product.identifier,
          title: pkg.product.title,
          description: pkg.product.description,
          price: pkg.product.priceString,
          priceAmount: pkg.product.price,
          currency: pkg.product.currencyCode,
          type: pkg.packageType === 'LIFETIME' ? 'lifetime' : 'subscription',
          period: pkg.product.subscriptionPeriod,
        }));
      }
    } catch (error) {
      console.error('Failed to load products:', error);
      this.products = this.getMockProducts();
    }
  }

  getProducts(): Product[] {
    return this.products;
  }

  async purchaseProduct(productId: string): Promise<PurchaseResult> {
    if (!Capacitor.isNativePlatform()) {
      // Mock purchase for web testing
      console.log('Mock purchase:', productId);
      return { success: true, productId };
    }

    if (!this.Purchases) {
      return { success: false, error: 'Purchase service not initialized' };
    }

    try {
      const offerings = await this.Purchases.getOfferings();
      const pkg = offerings.current?.availablePackages.find(
        (p: unknown) => (p as any).product.identifier === productId
      );
      
      if (!pkg) {
        return { success: false, error: 'Product not found' };
      }

      const { customerInfo } = await this.Purchases.purchasePackage({ aPackage: pkg });
      
      // Check if entitlement is active
      const isPremium = customerInfo.entitlements.active['premium'] !== undefined;
      
      return { success: isPremium, productId };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if ((error as any).code === 'PURCHASE_CANCELLED') {
        return { success: false, error: 'Purchase cancelled' };
      }
      console.error('Purchase error:', error);
      return { success: false, error: errorMessage || 'Purchase failed' };
    }
  }

  async restorePurchases(): Promise<PurchaseResult> {
    if (!Capacitor.isNativePlatform()) {
      console.log('Mock restore purchases');
      return { success: false, error: 'No purchases to restore' };
    }

    if (!this.Purchases) {
      return { success: false, error: 'Purchase service not initialized' };
    }

    try {
      const { customerInfo } = await this.Purchases.restorePurchases();
      const isPremium = customerInfo.entitlements.active['premium'] !== undefined;
      
      return { success: isPremium };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Restore error:', error);
      return { success: false, error: errorMessage || 'Restore failed' };
    }
  }

  async checkPremiumStatus(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    if (!this.Purchases) {
      return false;
    }

    try {
      const { customerInfo } = await this.Purchases.getCustomerInfo();
      return customerInfo.entitlements.active['premium'] !== undefined;
    } catch (error) {
      console.error('Check premium status error:', error);
      return false;
    }
  }
}

export const PurchaseService = new PurchaseServiceClass();
