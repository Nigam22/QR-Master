import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Type, Link, Phone, MessageSquare, Wifi, User, IndianRupee } from 'lucide-react';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { AppBar } from '@/components/ui/AppBar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QRStyleSelector } from '@/components/QRStyleSelector';
import { BannerAdPlaceholder } from '@/components/ads/BannerAdPlaceholder';
import { useAds } from '@/contexts/AdsContext';
import { useInterstitialAd } from '@/hooks/useInterstitialAd';
import { QR_STYLES, QRStyleConfig } from '@/utils/qrStyles';
import { generateWiFiString, generateVCardString, generateUPIString, generateSMSString, generatePhoneString } from '@/utils/qrGenerators';
import { toast } from 'sonner';

// Tab configuration
const tabs = [
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'link', icon: Link, label: 'Link' },
  { id: 'phone', icon: Phone, label: 'Phone' },
  { id: 'sms', icon: MessageSquare, label: 'SMS' },
  { id: 'wifi', icon: Wifi, label: 'WiFi' },
  { id: 'contact', icon: User, label: 'Contact' },
  { id: 'upi', icon: IndianRupee, label: 'UPI' },
];

const LOCKED_FEATURE_TABS = new Set(['upi', 'wifi', 'contact', 'sms']);

// QR Generator screen with multiple tabs
export const Generator: React.FC = () => {
  const navigate = useNavigate();
  const { 
    isCustomQrUnlocked, 
    unlockedStyleId,
    consumeCustomQrUnlock,
    isFeatureUnlocked,
    unlockedFeatureType,
    watchRewardedAdForFeature,
    consumeFeatureUnlock,
  } = useAds();
  const { onActionComplete } = useInterstitialAd();
  const [activeTab, setActiveTab] = useState('text');
  const [selectedStyle, setSelectedStyle] = useState<QRStyleConfig>(QR_STYLES[0]);
  const [pendingUnlockStyleId, setPendingUnlockStyleId] = useState<string | null>(null);
  
  // Form states
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [smsPhone, setSmsPhone] = useState('');
  const [smsMessage, setSmsMessage] = useState('');
  const [wifiSSID, setWifiSSID] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [wifiEncryption, setWifiEncryption] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');
  const [contactFirst, setContactFirst] = useState('');
  const [contactLast, setContactLast] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactOrg, setContactOrg] = useState('');
  const [upiId, setUpiId] = useState('');
  const [upiName, setUpiName] = useState('');
  const [upiAmount, setUpiAmount] = useState('');
  const [upiNote, setUpiNote] = useState('');

  // On mobile: pressing Enter should close the keyboard (blur) instead of inserting new lines.
  const blurOnEnter = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };
  
  // Refresh unlock status on mount and log changes
  useEffect(() => {
    console.log('[Generator] Unlock status changed:', {
      isCustomQrUnlocked,
      unlockedStyleId,
      selectedStyleId: selectedStyle.id,
      canUseSelectedStyle: canUseStyle(selectedStyle)
    });
  }, [isCustomQrUnlocked, unlockedStyleId, selectedStyle]);
  
  // Generate QR data based on active tab
  const generateQRData = (): string | null => {
    switch (activeTab) {
      case 'text':
        if (!text.trim()) { toast.error('Please enter some text'); return null; }
        return text;
      case 'link':
        if (!url.trim()) { toast.error('Please enter a URL'); return null; }
        return url.startsWith('http') ? url : `https://${url}`;
      case 'phone':
        if (!phone.trim()) { toast.error('Please enter a phone number'); return null; }
        return generatePhoneString(phone);
      case 'sms':
        if (!smsPhone.trim()) { toast.error('Please enter a phone number'); return null; }
        return generateSMSString(smsPhone, smsMessage);
      case 'wifi':
        if (!wifiSSID.trim()) { toast.error('Please enter WiFi name'); return null; }
        return generateWiFiString({ ssid: wifiSSID, password: wifiPassword, encryption: wifiEncryption, hidden: false });
      case 'contact':
        if (!contactFirst.trim() && !contactLast.trim()) { toast.error('Please enter a name'); return null; }
        return generateVCardString({ firstName: contactFirst, lastName: contactLast, phone: contactPhone, email: contactEmail, organization: contactOrg });
      case 'upi':
        if (!upiId.trim()) { toast.error('Please enter UPI ID'); return null; }
        return generateUPIString({ upiId, name: upiName, amount: upiAmount, note: upiNote });
      default:
        return null;
    }
  };
  
  const canUseStyle = (style: QRStyleConfig) => {
    if (!style.premium) return true;
    // After watching ad, ALL premium themes are temporarily unlocked
    return isCustomQrUnlocked;
  };

  const isFeatureTabLocked = (tabId: string) => LOCKED_FEATURE_TABS.has(tabId);
  const canUseFeatureTab = (tabId: string) => {
    if (!isFeatureTabLocked(tabId)) return true;
    return isFeatureUnlocked && unlockedFeatureType === tabId;
  };

  const handleUnlockFeature = async () => {
    if (!isFeatureTabLocked(activeTab)) return;
    const featureType = activeTab as any;
    console.log('[Generator][Feature] Showing feature rewarded ad for', featureType);
    const success = await watchRewardedAdForFeature(featureType);
    if (success) {
      toast.success('Feature unlocked for one QR!');
      console.log('[Generator][Feature] Unlocked feature for one use', featureType);
    } else {
      toast.error('Please watch the full ad to unlock this feature.');
    }
  };

  // Handle generate button click
  const handleGenerate = async () => {
    if (isFeatureTabLocked(activeTab) && !canUseFeatureTab(activeTab)) {
      toast.error('This feature is locked. Watch an ad to unlock for one use.');
      return;
    }
    const qrData = generateQRData();
    if (qrData) {
      if (selectedStyle.premium) {
        if (!isCustomQrUnlocked) {
          toast.error('This premium style is locked. Watch an ad to unlock all themes for one use.');
          return;
        }
        console.log('[Generator] Consuming one-time unlock after using premium style', selectedStyle.id);
        consumeCustomQrUnlock();
      }
      if (isFeatureTabLocked(activeTab) && canUseFeatureTab(activeTab)) {
        console.log('[Generator][Feature] Consuming one-time feature unlock for', activeTab);
        consumeFeatureUnlock();
      }
      console.log('[Generator] Generating QR with style', selectedStyle.id);
      await onActionComplete();
      navigate('/preview', { 
        state: { 
          qrData, 
          type: activeTab, 
          styleId: selectedStyle.id,
          qrColor: selectedStyle.fgColor,
        } 
      });
    }
  };

  // Handle style unlock
  const handleStyleUnlock = () => {
    toast.success('Style unlocked! Choose a premium style for your QR.');
  };
  
  return (
    // Extra bottom padding so the fixed banner (bottom-20, h-14) never covers the Generate button.
    <div className="min-h-screen pb-44">
      <AppBar title="Generate QR Code" subtitle="Choose a type and enter details" showBack backTo="/home" />
      
      {/* Tab bar - horizontally scrollable */}
      <div className="px-4 pb-2">
        {/* Feature unlock button (separate from theme unlock) */}
        {isFeatureTabLocked(activeTab) && !canUseFeatureTab(activeTab) && (
          <button
            onClick={handleUnlockFeature}
            className="w-full mb-3 py-3 rounded-2xl bg-accent/10 hover:bg-accent/20 transition-colors font-semibold"
          >
            Watch Ad to Unlock Feature
          </button>
        )}

        <div className="overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {tabs.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all active:scale-95 ${
                  activeTab === id
                    ? 'gradient-primary text-primary-foreground shadow-lg'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Form content based on active tab */}
      <div className="px-4">
        <AnimatedCard key={activeTab} className="mt-4" hoverable={false}>
          {activeTab === 'text' && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Enter Text</label>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={blurOnEnter}
                placeholder="Type any text here..."
                rows={4}
                className="resize-none rounded-xl"
              />
            </div>
          )}
          
          {activeTab === 'link' && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Website URL</label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={blurOnEnter}
                placeholder="https://example.com"
                type="url"
                className="rounded-xl"
              />
            </div>
          )}
          
          {activeTab === 'phone' && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Phone Number</label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={blurOnEnter}
                placeholder="+1 234 567 8900"
                type="tel"
                className="rounded-xl"
              />
            </div>
          )}
          
          {activeTab === 'sms' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Phone Number</label>
                <Input
                  value={smsPhone}
                  onChange={(e) => setSmsPhone(e.target.value)}
                  onKeyDown={blurOnEnter}
                  placeholder="+1 234 567 8900"
                  type="tel"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Message (optional)</label>
                <Textarea
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  onKeyDown={blurOnEnter}
                  placeholder="Your message..."
                  rows={3}
                  className="resize-none rounded-xl"
                />
              </div>
            </div>
          )}
          
          {activeTab === 'wifi' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Network Name (SSID)</label>
                <Input
                  value={wifiSSID}
                  onChange={(e) => setWifiSSID(e.target.value)}
                  onKeyDown={blurOnEnter}
                  placeholder="My WiFi Network"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Password</label>
                <Input
                  value={wifiPassword}
                  onChange={(e) => setWifiPassword(e.target.value)}
                  onKeyDown={blurOnEnter}
                  placeholder="Password"
                  type="password"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Security Type</label>
                <Select value={wifiEncryption} onValueChange={(v) => setWifiEncryption(v as "WPA" | "WEP" | "nopass")}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WPA">WPA/WPA2</SelectItem>
                    <SelectItem value="WEP">WEP</SelectItem>
                    <SelectItem value="nopass">None (Open)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          {activeTab === 'contact' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">First Name</label>
                  <Input
                    value={contactFirst}
                    onChange={(e) => setContactFirst(e.target.value)}
                    onKeyDown={blurOnEnter}
                    placeholder="John"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Last Name</label>
                  <Input
                    value={contactLast}
                    onChange={(e) => setContactLast(e.target.value)}
                    onKeyDown={blurOnEnter}
                    placeholder="Doe"
                    className="rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Phone</label>
                <Input
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  onKeyDown={blurOnEnter}
                  placeholder="+1 234 567 8900"
                  type="tel"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email</label>
                <Input
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  onKeyDown={blurOnEnter}
                  placeholder="john@example.com"
                  type="email"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Organization</label>
                <Input
                  value={contactOrg}
                  onChange={(e) => setContactOrg(e.target.value)}
                  onKeyDown={blurOnEnter}
                  placeholder="Company Name"
                  className="rounded-xl"
                />
              </div>
            </div>
          )}
          
          {activeTab === 'upi' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">UPI ID</label>
                <Input
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  onKeyDown={blurOnEnter}
                  placeholder="yourname@upi"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Payee Name</label>
                <Input
                  value={upiName}
                  onChange={(e) => setUpiName(e.target.value)}
                  onKeyDown={blurOnEnter}
                  placeholder="Your Name"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Amount (optional)</label>
                <Input
                  value={upiAmount}
                  onChange={(e) => setUpiAmount(e.target.value)}
                  onKeyDown={blurOnEnter}
                  placeholder="100"
                  type="number"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Note (optional)</label>
                <Input
                  value={upiNote}
                  onChange={(e) => setUpiNote(e.target.value)}
                  onKeyDown={blurOnEnter}
                  placeholder="Payment for..."
                  className="rounded-xl"
                />
              </div>
            </div>
          )}
        </AnimatedCard>

        {/* QR Style Selector */}
        <AnimatedCard className="mt-4" hoverable={false}>
          <QRStyleSelector
            selectedStyleId={selectedStyle.id}
            onSelectStyle={(style) => {
              // Never trigger rewarded ads on theme tap; selection only.
              setSelectedStyle(style);
            }}
          />
        </AnimatedCard>
        
        {/* Generate button */}
        <div className="mt-6">
          <GradientButton 
            onClick={handleGenerate}
            size="lg"
            className="w-full rounded-2xl shadow-lg"
          >
            Generate QR Code
          </GradientButton>
        </div>
      </div>
      
      {/* Banner Ad at bottom */}
      <BannerAdPlaceholder screen="generator" />
    </div>
  );
};