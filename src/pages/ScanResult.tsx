import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { QrCode, Copy, Share2, ExternalLink, Phone, MessageSquare, Wifi, User, IndianRupee, MapPin, Calendar, Mail, Globe } from 'lucide-react';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { AppBar } from '@/components/ui/AppBar';
import { BannerAdPlaceholder } from '@/components/ads/BannerAdPlaceholder';
import { useAds } from '@/contexts/AdsContext';
import { addScanHistory } from '@/utils/storage';
import { toast } from 'sonner';
import { APP_CONSTANTS } from '@/utils/constants';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';

// Result screen showing scanned content with appropriate actions
export const ScanResult: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isPremium } = useAds();
  const [content, setContent] = useState('');
  const [type, setType] = useState<'qr' | 'barcode'>('qr');
  const [parsedData, setParsedData] = useState<any>(null);
  
  // Extract content from location state
  useEffect(() => {
    const state = location.state as { content?: string; type?: 'qr' | 'barcode' } | null;
    if (state?.content) {
      setContent(state.content);
      setType(state.type || 'qr');
      parseContent(state.content);
    } else {
      // Fallback if no state (shouldn't happen in normal flow)
      navigate('/scan');
    }
  }, [location.state, navigate]);
  
  // Parse content to determine type and extract relevant data
  const parseContent = (text: string) => {
    try {
      // Phone number
      if (text.match(/^tel:|^sms:|^mailto:|^geo:|^BEGIN:VCARD|^WIFI:/i)) {
        const parsed = parseSpecialFormat(text);
        setParsedData(parsed);
        return;
      }
      
      // URL
      if (text.match(/^https?:\/\//i)) {
        setParsedData({ type: 'url', url: text });
        return;
      }
      
      // Email
      if (text.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        setParsedData({ type: 'email', email: text });
        return;
      }
      
      // Phone number (various formats)
      if (text.match(/^[\+]?[1-9][\d]{0,15}$/) || text.match(/^(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/)) {
        setParsedData({ type: 'phone', phone: text });
        return;
      }
      
      // Plain text
      setParsedData({ type: 'text', text });
    } catch (error) {
      console.error('Error parsing content:', error);
      setParsedData({ type: 'text', text });
    }
  };
  
  // Parse special formats like vCard, WiFi, etc.
  const parseSpecialFormat = (text: string) => {
    if (text.startsWith('WIFI:')) {
      // Parse WiFi data
      const ssidMatch = text.match(/S:(.+?);/);
      const passwordMatch = text.match(/P:(.+?);/);
      const encryptionMatch = text.match(/T:(.+?);/);
      return {
        type: 'wifi',
        ssid: ssidMatch ? ssidMatch[1] : '',
        password: passwordMatch ? passwordMatch[1] : '',
        encryption: encryptionMatch ? encryptionMatch[1] : 'WPA'
      };
    }
    
    if (text.startsWith('BEGIN:VCARD')) {
      // Parse vCard data
      const nameMatch = text.match(/FN:(.+?)\n/);
      const phoneMatch = text.match(/TEL:(.+?)\n/);
      const emailMatch = text.match(/EMAIL:(.+?)\n/);
      const orgMatch = text.match(/ORG:(.+?)\n/);
      const addressMatch = text.match(/ADR:(.+?)\n/);
      return {
        type: 'contact',
        name: nameMatch ? nameMatch[1] : '',
        phone: phoneMatch ? phoneMatch[1] : '',
        email: emailMatch ? emailMatch[1] : '',
        organization: orgMatch ? orgMatch[1] : '',
        address: addressMatch ? addressMatch[1] : ''
      };
    }
    
    if (text.startsWith('tel:')) {
      return { type: 'phone', phone: text.substring(4) };
    }
    
    if (text.startsWith('sms:')) {
      const parts = text.substring(4).split('?');
      const phone = parts[0];
      const bodyMatch = text.match(/body=(.+)$/i);
      return { 
        type: 'sms', 
        phone, 
        message: bodyMatch ? decodeURIComponent(bodyMatch[1]) : '' 
      };
    }
    
    if (text.startsWith('mailto:')) {
      const parts = text.substring(7).split('?');
      const email = parts[0];
      const subjectMatch = text.match(/subject=(.+?)(&|$)/i);
      const bodyMatch = text.match(/body=(.+)$/i);
      return { 
        type: 'email', 
        email,
        subject: subjectMatch ? decodeURIComponent(subjectMatch[1]) : '',
        body: bodyMatch ? decodeURIComponent(bodyMatch[1]) : ''
      };
    }
    
    return { type: 'text', text };
  };
  
  // Handle copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard!');
  };
  
  // Handle share
  const handleShare = async () => {
    // Always prefer native share sheet in Capacitor builds
    if (Capacitor.isNativePlatform()) {
      try {
        await Share.share({
          title: 'QR Master',
          text: `${APP_CONSTANTS.SHARE_TEXT} ${APP_CONSTANTS.PLAY_STORE_URL}`,
        });
      } catch {
        // user cancelled
      }
      return;
    }

    // Web fallback
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'QR Master',
          text: `${APP_CONSTANTS.SHARE_TEXT} ${APP_CONSTANTS.PLAY_STORE_URL}`,
        });
        return;
      } catch {
        // ignore
      }
    }
    handleCopy();
  };
  
  // Handle open/action based on content type
  const handleOpen = () => {
    switch (parsedData?.type) {
      case 'url':
        window.open(parsedData.url, '_blank');
        break;
      case 'phone':
        window.open(`tel:${parsedData.phone}`, '_blank');
        break;
      case 'sms':
        window.open(`sms:${parsedData.phone}${parsedData.message ? `?body=${encodeURIComponent(parsedData.message)}` : ''}`, '_blank');
        break;
      case 'email':
        window.open(`mailto:${parsedData.email}${parsedData.subject || parsedData.body ? `?${parsedData.subject ? `subject=${encodeURIComponent(parsedData.subject)}` : ''}${parsedData.body ? `${parsedData.subject ? '&' : ''}body=${encodeURIComponent(parsedData.body)}` : ''}` : ''}`, '_blank');
        break;
      case 'wifi':
        toast.info('WiFi network information detected. Connect manually in your device settings.');
        break;
      case 'contact':
        toast.info('Contact information detected. Save to your contacts manually.');
        break;
      default:
        toast.info('No specific action available for this content type.');
    }
  };
  
  // Get action button text based on content type
  const getActionText = () => {
    switch (parsedData?.type) {
      case 'url': return 'Open Website';
      case 'phone': return 'Call Number';
      case 'sms': return 'Send Message';
      case 'email': return 'Send Email';
      case 'wifi': return 'Connect to WiFi';
      case 'contact': return 'Save Contact';
      default: return 'Open Content';
    }
  };
  
  // Render content preview based on type
  const renderContentPreview = () => {
    if (!parsedData) return null;
    
    switch (parsedData.type) {
      case 'url':
        try {
          const url = new URL(parsedData.url);
          return (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Globe className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{url.hostname}</p>
                  <p className="text-sm text-muted-foreground truncate">{url.pathname}</p>
                </div>
              </div>
              <div className="bg-muted/50 rounded-xl p-4">
                <p className="text-sm text-muted-foreground break-all">{parsedData.url}</p>
              </div>
            </div>
          );
        } catch {
          return (
            <div className="bg-muted/50 rounded-xl p-4">
              <p className="text-sm break-all">{parsedData.url}</p>
            </div>
          );
        }
        
      case 'phone':
        return (
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <Phone className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium">{parsedData.phone}</p>
              <p className="text-sm text-muted-foreground">Phone Number</p>
            </div>
          </div>
        );
        
      case 'sms':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{parsedData.phone}</p>
                <p className="text-sm text-muted-foreground">SMS</p>
              </div>
            </div>
            {parsedData.message && (
              <div className="bg-muted/50 rounded-xl p-4">
                <p className="text-sm break-all">{parsedData.message}</p>
              </div>
            )}
          </div>
        );
        
      case 'email':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{parsedData.email}</p>
                <p className="text-sm text-muted-foreground">Email Address</p>
              </div>
            </div>
            {(parsedData.subject || parsedData.body) && (
              <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                {parsedData.subject && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Subject</p>
                    <p className="break-all">{parsedData.subject}</p>
                  </div>
                )}
                {parsedData.body && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Body</p>
                    <p className="text-sm break-all">{parsedData.body}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
        
      case 'wifi':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <Wifi className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{parsedData.ssid}</p>
                <p className="text-sm text-muted-foreground">WiFi Network</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-xl p-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Security</p>
                <p className="font-medium">{parsedData.encryption}</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Password</p>
                <p className="font-medium">{parsedData.password ? '••••••••' : 'None'}</p>
              </div>
            </div>
          </div>
        );
        
      case 'contact':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{parsedData.name || 'Unknown Contact'}</p>
                <p className="text-sm text-muted-foreground">Contact Information</p>
              </div>
            </div>
            <div className="space-y-3">
              {parsedData.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{parsedData.phone}</span>
                </div>
              )}
              {parsedData.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{parsedData.email}</span>
                </div>
              )}
              {parsedData.organization && (
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{parsedData.organization}</span>
                </div>
              )}
              {parsedData.address && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{parsedData.address}</span>
                </div>
              )}
            </div>
          </div>
        );
        
      default:
        return (
          <div className="bg-muted/50 rounded-xl p-4">
            <p className="text-sm break-all whitespace-pre-wrap">{content}</p>
          </div>
        );
    }
  };
  
  if (!content) return null;
  
  return (
    <div className="min-h-screen pb-32">
      <AppBar title="Scan Result" showBack backTo="/scan" />
      
      <div className="px-4 pt-6">
        {/* Content preview card */}
        <AnimatedCard className="rounded-2xl">
          <div className="p-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl">
            <div className="bg-background rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium capitalize text-primary">{type}</span>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                  {content.length} characters
                </span>
              </div>
              
              {renderContentPreview()}
            </div>
          </div>
        </AnimatedCard>
        
        {/* Action button */}
        {parsedData && (
          <GradientButton 
            onClick={handleOpen}
            size="lg"
            className="w-full mt-6 flex items-center justify-center gap-2 rounded-2xl"
          >
            <ExternalLink className="w-5 h-5" />
            {getActionText()}
          </GradientButton>
        )}
        
        {/* Copy and Share */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleCopy}
            className="flex-1 glass rounded-xl py-4 flex items-center justify-center gap-2 hover:bg-muted transition-colors"
          >
            <Copy className="w-5 h-5 text-primary" />
            <span className="font-medium">Copy</span>
          </button>
          
          <button
            onClick={handleShare}
            className="flex-1 glass rounded-xl py-4 flex items-center justify-center gap-2 hover:bg-muted transition-colors"
          >
            <Share2 className="w-5 h-5 text-accent" />
            <span className="font-medium">Share</span>
          </button>
        </div>
      </div>
      
      {/* Scan again */}
      <div className="px-4 mt-6">
        <button
          onClick={() => navigate('/scan')}
          className="w-full py-4 text-primary font-medium"
        >
          Scan Another Code
        </button>
      </div>

      {/* Banner Ad at bottom */}
      {!isPremium && <BannerAdPlaceholder screen="scanResult" />}
    </div>
  );
};