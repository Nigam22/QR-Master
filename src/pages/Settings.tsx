import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Star, Share2, Shield, Info, ChevronRight, Crown, Moon, Sun, Mail } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { AppBar } from '@/components/ui/AppBar';
import { Switch } from '@/components/ui/switch';
import { useAds } from '@/contexts/AdsContext';
import { useTheme } from '@/contexts/ThemeContext';
import { clearAllHistory } from '@/utils/storage';
import { APP_CONSTANTS } from '@/utils/constants';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// Settings menu item component
const SettingsItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  description?: string;
  onClick?: () => void;
  destructive?: boolean;
  rightElement?: React.ReactNode;
}> = ({ icon, label, description, onClick, destructive, rightElement }) => {
  const content = (
    <>
      <div className={`p-2.5 rounded-xl ${destructive ? 'bg-destructive/10' : 'bg-primary/10'}`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className={`font-medium ${destructive ? 'text-destructive' : 'text-foreground'}`}>{label}</p>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {rightElement || (onClick && <ChevronRight className="w-5 h-5 text-muted-foreground" />)}
    </>
  );

  // Use div instead of button when rightElement is provided (to avoid nested buttons)
  if (rightElement) {
    return (
      <div className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-muted/50 transition-colors text-left">
        {content}
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-muted/50 transition-colors text-left disabled:hover:bg-transparent"
    >
      {content}
    </button>
  );
};

// Theme toggle component
const ThemeToggle: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  const toggleTheme = () => {
    if (theme === 'system') {
      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    } else {
      setTheme(theme === 'dark' ? 'light' : 'dark');
    }
  };
  
  return (
    <div className="flex items-center gap-2">
      <Sun className="w-4 h-4 text-muted-foreground" />
      <Switch 
        checked={resolvedTheme === 'dark'} 
        onCheckedChange={toggleTheme}
      />
      <Moon className="w-4 h-4 text-muted-foreground" />
    </div>
  );
};

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { isPremium } = useAds();

  const handleClearHistory = () => {
    clearAllHistory();
    toast.success('History cleared!');
  };
  
  const handleShareApp = async () => {
    const title = APP_CONSTANTS.APP_NAME;
    const text = `${APP_CONSTANTS.SHARE_TEXT} ${APP_CONSTANTS.PLAY_STORE_URL}`;

    try {
      // On Android/iOS this opens the native share bottom sheet (WhatsApp, etc.)
      if (Capacitor.isNativePlatform()) {
        await Share.share({ title, text, url: APP_CONSTANTS.PLAY_STORE_URL });
        return;
      }

      // Web fallback
      if (navigator.share) {
        await navigator.share({ title, text, url: APP_CONSTANTS.PLAY_STORE_URL });
        return;
      }

      await navigator.clipboard.writeText(text);
      toast.success('Link copied to clipboard!');
    } catch {
      // User cancelled or share failed
    }
  };
  
  const handleContactSupport = () => {
    window.open(`mailto:${APP_CONSTANTS.SUPPORT_EMAIL}?subject=${APP_CONSTANTS.APP_NAME} Support`, '_blank');
    toast.info('Opening email client...');
  };
  
  const handlePrivacyPolicy = () => {
    window.open(APP_CONSTANTS.PRIVACY_POLICY_URL, '_blank');
  };
  
  const handleAboutUs = () => {
    toast.info(`${APP_CONSTANTS.APP_NAME} v${APP_CONSTANTS.APP_VERSION} - Built with ❤️`);
  };
  
  return (
    <div className="min-h-screen pb-24">
      <AppBar title="Settings" subtitle="Customize your experience" showBack backTo="/home" />
      
      <div className="px-4 space-y-4">
        {/* Premium section */}
        <AnimatedCard hoverable={false} className="p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-yellow-500/10">
                <Crown className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  {isPremium ? 'Premium Active' : 'Premium Mode'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isPremium ? 'All features unlocked' : 'Remove all ads & unlock features'}
                </p>
              </div>
            </div>
            {isPremium && (
              <div className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-sm font-medium">
                Active
              </div>
            )}
          </div>
          {!isPremium && (
            <button 
              onClick={() => navigate('/premium')}
              className="w-full mt-4 py-3 rounded-xl gradient-primary text-primary-foreground font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
            >
              Upgrade to Premium
            </button>
          )}
        </AnimatedCard>

        {/* Appearance */}
        <AnimatedCard hoverable={false} className="rounded-2xl overflow-hidden">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 pt-4 pb-2">Appearance</p>
          <SettingsItem
            icon={<Moon className="w-5 h-5 text-primary" />}
            label="Dark Mode"
            description="Switch between light and dark theme"
            rightElement={<ThemeToggle />}
          />
        </AnimatedCard>

        {/* Data */}
        <AnimatedCard hoverable={false} className="rounded-2xl overflow-hidden">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 pt-4 pb-2">Data</p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <div>
                <SettingsItem
                  icon={<Trash2 className="w-5 h-5 text-destructive" />}
                  label="Clear History"
                  description="Delete all scan and generated history"
                  onClick={() => {}}
                  destructive
                />
              </div>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Clear All History?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all your scan and generated QR code history. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearHistory} className="rounded-xl bg-destructive hover:bg-destructive/90">
                  Clear All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </AnimatedCard>
        
        {/* Support */}
        <AnimatedCard hoverable={false} className="rounded-2xl overflow-hidden">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 pt-4 pb-2">Support</p>
          <SettingsItem 
            icon={<Share2 className="w-5 h-5 text-primary" />} 
            label="Share App" 
            description="Share with friends and family" 
            onClick={handleShareApp} 
          />
          <SettingsItem 
            icon={<Mail className="w-5 h-5 text-primary" />} 
            label="Contact Support" 
            description="Get help with any issues" 
            onClick={handleContactSupport} 
          />
        </AnimatedCard>
        
        {/* Legal */}
        <AnimatedCard hoverable={false} className="rounded-2xl overflow-hidden">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 pt-4 pb-2">Legal</p>
          <SettingsItem 
            icon={<Shield className="w-5 h-5 text-primary" />} 
            label="Privacy Policy" 
            description="How we handle your data" 
            onClick={handlePrivacyPolicy} 
          />
          <SettingsItem 
            icon={<Info className="w-5 h-5 text-primary" />} 
            label="About Us" 
            description="Learn more about QR Master" 
            onClick={handleAboutUs} 
          />
        </AnimatedCard>
      </div>
      
      <p className="text-center text-muted-foreground text-sm mt-8">QR Master v1.0.0</p>
    </div>
  );
};
