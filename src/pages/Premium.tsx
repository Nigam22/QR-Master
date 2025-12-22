import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Check, Sparkles, Zap, Palette, Shield, RotateCcw, Loader2 } from 'lucide-react';
import { AppBar } from '@/components/ui/AppBar';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { useAds } from '@/contexts/AdsContext';
// import { PurchaseService, Product } from '@/services/PurchaseService';
import { toast } from 'sonner';

// Mock Product type since we're not using the actual service yet
type Product = {
  id: string;
  title: string;
  description: string;
  price: string;
  period: 'month' | 'year';
};

const FEATURES = [
  { icon: Palette, text: 'All QR Color Themes Unlocked' },
  { icon: Zap, text: 'Unlimited QR Generation' },
  { icon: Shield, text: 'Ad-Free Experience' },
  { icon: Sparkles, text: 'Priority Support' },
];

export const Premium: React.FC = () => {
  const navigate = useNavigate();
  const { isPremium, setPremium } = useAds();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    const init = async () => {
      // await PurchaseService.initialize();
      // setProducts(PurchaseService.getProducts());
      // Mock products for display
      const mockProducts: Product[] = [
        {
          id: 'monthly',
          title: 'Monthly Premium',
          description: 'Billed monthly',
          price: '$4.99',
          period: 'month'
        },
        {
          id: 'yearly',
          title: 'Yearly Premium',
          description: 'Billed annually - Best Value!',
          price: '$29.99',
          period: 'year'
        }
      ];
      setProducts(mockProducts);
      setLoading(false);
      
      // Pre-select yearly as best value
      setSelectedProduct('yearly');
    };
    init();
  }, []);

  const handlePurchase = async () => {
    if (!selectedProduct) {
      toast.error('Please select a plan');
      return;
    }

    // Show "coming soon" message instead of processing purchase
    const product = products.find(p => p.id === selectedProduct);
    const productName = product?.title || 'Premium';
    toast.info(`Purchase coming soon! ${productName} will be available in the next update.`, {
      duration: 4000,
    });
  };

  const handleRestore = async () => {
    setRestoring(true);
    // const result = await PurchaseService.restorePurchases();
    setRestoring(false);

    // Show "coming soon" message instead of processing restore
    toast.info('Restore purchases feature coming soon!', {
      duration: 3000,
    });
  };

  if (isPremium) {
    return (
      <div className="min-h-screen pb-24">
        <AppBar title="Premium" showBack backTo="/home" />
        
        <div className="px-4 py-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">You're Premium!</h2>
          <p className="text-muted-foreground">Enjoy all premium features</p>
          
          <div className="mt-8 space-y-3">
            {FEATURES.map((feature, index) => (
              <div key={index} className="flex items-center gap-3 text-left bg-card rounded-xl p-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-foreground">{feature.text}</span>
                <Check className="w-5 h-5 text-green-500 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <AppBar title="Go Premium" showBack backTo="/home" />
      
      {/* Hero Section */}
      <div className="px-4 py-6 text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg shadow-yellow-500/30">
          <Crown className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Unlock Premium</h2>
        <p className="text-muted-foreground">Get the most out of QR Master</p>
      </div>

      {/* Features List */}
      <div className="px-4 mb-6">
        <AnimatedCard hoverable={false} className="p-4 rounded-2xl">
          <div className="space-y-3">
            {FEATURES.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-foreground">{feature.text}</span>
              </div>
            ))}
          </div>
        </AnimatedCard>
      </div>

      {/* Pricing Options */}
      <div className="px-4 mb-6">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Choose Your Plan</p>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((product) => {
              const isSelected = selectedProduct === product.id;
              const isYearly = product.period === 'year';
              
              return (
                <button
                  key={product.id}
                  onClick={() => setSelectedProduct(product.id)}
                  className={`w-full p-4 rounded-2xl border-2 transition-all text-left relative ${
                    isSelected 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border bg-card hover:border-primary/50'
                  }`}
                >
                  {isYearly && (
                    <span className="absolute -top-2 right-4 px-2 py-0.5 text-xs font-semibold bg-green-500 text-white rounded-full">
                      BEST VALUE
                    </span>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{product.title}</p>
                      <p className="text-sm text-muted-foreground">{product.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-foreground">{product.price}</p>
                    </div>
                  </div>
                  
                  {/* Selection indicator */}
                  <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                  <div className="ml-8" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Purchase Button */}
      <div className="px-4 space-y-3">
        <button
          onClick={handlePurchase}
          disabled={!selectedProduct || purchasing}
          className="w-full py-4 rounded-2xl gradient-primary text-primary-foreground font-semibold text-lg shadow-lg shadow-primary/30 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {purchasing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Crown className="w-5 h-5" />
              Continue
            </>
          )}
        </button>

        <button
          onClick={handleRestore}
          disabled={restoring}
          className="w-full py-3 rounded-xl text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2"
        >
          {restoring ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RotateCcw className="w-4 h-4" />
          )}
          Restore Purchases
        </button>
      </div>

      {/* Terms */}
      <p className="text-center text-xs text-muted-foreground px-8 mt-6">
        Payment will be charged to your account. Subscriptions auto-renew unless cancelled 24 hours before the end of the current period.
      </p>
    </div>
  );
};
