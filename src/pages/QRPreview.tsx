import React, { useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Share2, Save, Check, FileImage, FileCode } from 'lucide-react';
import { GradientButton } from '@/components/ui/GradientButton';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { AppBar } from '@/components/ui/AppBar';
import { RewardedAdButton } from '@/components/ads/RewardedAdButton';
import { QrCenterIcon } from '@/components/QrCenterIcon';
import { useAds } from '@/contexts/AdsContext';
import { addGeneratedHistory } from '@/utils/storage';
import { getStyleById } from '@/utils/qrStyles';
import { APP_CONSTANTS } from '@/utils/constants';
import { sharePngWithText } from '@/utils/nativeShare';
import { getQrTypeIconDataUri } from '@/utils/qrTypeIcons';
import { toast } from 'sonner';

// QR Preview screen with download/share options
export const QRPreview: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { qrData, type, styleId, qrColor } = location.state || { qrData: '', type: 'text', styleId: 'classic', qrColor: '#000000' };
  const qrRef = useRef<HTMLDivElement>(null);
  const { isCustomQrUnlocked, unlockedStyleId, watchRewardedAdForCustomQr, refreshUnlockStatus } = useAds();


  const fallbackStyle = { fgColor: qrColor || '#000000', bgColor: '#FFFFFF', premium: false as const };
  const style = getStyleById(styleId) || fallbackStyle;
  const styleLocked = style.premium && !(isCustomQrUnlocked && unlockedStyleId === style.id);
  
  // For gradient styles, use the first color since QRCodeSVG doesn't support gradients
  const qrFgColor = 'gradient' in style && style.gradient ? style.gradient.colors[0] : (style.fgColor || '#000000');
  const qrBgColor = style.bgColor || '#FFFFFF';

  const QR_CONTAINER_SIZE = 256;
  const QR_CODE_SIZE = 240;
  
  // Convert SVG to canvas and get blob (with center icon overlay)
  const getQRBlob = (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const svg = qrRef.current?.querySelector('svg');
      if (!svg) return reject('No SVG found');
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const svgData = new XMLSerializer().serializeToString(svg);
      const img = new Image();
      
      canvas.width = 512;
      canvas.height = 512;
      
      img.onload = () => {
        if (!ctx) return reject('No canvas context');
        ctx.drawImage(img, 0, 0, 512, 512);

        // Draw white circular background + type icon on top (20–25% max)
        const iconBox = Math.round(canvas.width * 0.18);
        const iconSize = Math.round(iconBox * 0.6);
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const bgRadius = iconBox / 2;

        ctx.save();
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(cx, cy, bgRadius, 0, Math.PI * 2);
        ctx.fill();
        // subtle border for contrast
        ctx.strokeStyle = 'rgba(0,0,0,0.06)';
        ctx.lineWidth = Math.max(2, Math.round(iconBox * 0.06));
        ctx.stroke();
        ctx.restore();

        const iconImg = new Image();
        iconImg.onload = () => {
          ctx.drawImage(iconImg, cx - iconSize / 2, cy - iconSize / 2, iconSize, iconSize);
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject('Failed to create blob');
          }, 'image/png');
        };
        iconImg.onerror = () => {
          // If icon fails, still export the QR (scan-safe)
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject('Failed to create blob');
          }, 'image/png');
        };
        iconImg.src = getQrTypeIconDataUri(type, { color: qrFgColor || '#111827', size: 64 });
      };
      
      img.onerror = reject;
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    });
  };

  // Download QR as PNG
  const handleDownloadPNG = async () => {
    try {
      const blob = await getQRBlob();
      const link = document.createElement('a');
      link.download = `qr-${type}-${Date.now()}.png`;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success('PNG downloaded!');
    } catch (err) {
      toast.error('Failed to download');
    }
  };

  // Download QR as SVG
  const handleDownloadSVG = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.download = `qr-${type}-${Date.now()}.svg`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success('SVG downloaded!');
  };
  
  // Share QR
  const handleShare = async () => {
    try {
      const blob = await getQRBlob();
      await sharePngWithText({
        blob,
        filename: `qr-${type}-${Date.now()}.png`,
        title: 'QR Code',
        text: `${APP_CONSTANTS.SHARE_TEXT} ${APP_CONSTANTS.PLAY_STORE_URL}`,
      });
    } catch (err) {
      // If native share fails, fallback to download
      console.warn('[Share] Native share failed; falling back to download', err);
      await handleDownloadPNG();
    }
  };
  
  // Save to history - available to all users
  const handleSaveToHistory = () => {
    addGeneratedHistory(qrData, type, qrData, styleId, style.fgColor);
    toast.success('Saved to history!');
  };

  const handleUnlockHere = async () => {
    if (!style.premium) return;
    const success = await watchRewardedAdForCustomQr(style.id);
    if (success) {
      await refreshUnlockStatus();
      toast.success('Style unlocked for one QR generation!');
    }
  };
  
  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="gradient-primary px-4 pt-12 pb-8 rounded-b-[2.5rem]">
        <AppBar title="Your QR Code" showBack backTo="/generate" gradient />
      </div>
      
      {/* QR Code display */}
      <div className="px-4 -mt-6">
        <AnimatedCard className="bg-card flex flex-col items-center py-8 rounded-3xl shadow-xl" hoverable={false}>
          <div 
            ref={qrRef}
            className="relative flex items-center justify-center bg-card shadow-lg"
            style={{ width: QR_CONTAINER_SIZE, height: QR_CONTAINER_SIZE }}
          >
            <QRCodeSVG
              value={qrData}
              size={QR_CODE_SIZE}
              level="H"
              includeMargin={true} // keep quiet zone for scanners to detect corner squares
              bgColor={qrBgColor}
              fgColor={qrFgColor}
              style={{ width: QR_CODE_SIZE, height: QR_CODE_SIZE }}
            />
            <QrCenterIcon type={type} qrSizePx={QR_CODE_SIZE} color={qrFgColor} />
          </div>
          
          {/* Watch Ad inline for locked premium style (keeps existing layout) */}
          {styleLocked && (
            <div className="mt-4">
              <RewardedAdButton
                onUnlock={handleUnlockHere}
                targetStyleId={style.id}
                className="text-xs px-3 py-1.5 rounded-lg bg-accent/10 hover:bg-accent/20 transition-colors flex items-center gap-1"
              >
                Watch Ad
              </RewardedAdButton>
            </div>
          )}
          
          {/* Success badge */}
          <div className="mt-6 flex items-center gap-2 text-primary">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <Check className="w-4 h-4" />
            </div>
            <span className="font-semibold">QR Code Generated</span>
          </div>
          
          {/* Content preview */}
          <p className="mt-3 text-sm text-muted-foreground text-center px-6 max-w-full">
            <span className="capitalize font-medium text-foreground">{type}:</span>{' '}
            <span className="break-all">{qrData.substring(0, 50)}{qrData.length > 50 ? '...' : ''}</span>
          </p>
        </AnimatedCard>
      </div>
      
      {/* Export Options */}
      <div className="px-4 mt-6">
        <p className="text-sm font-medium text-muted-foreground mb-3">Export As</p>
        <div className="flex gap-3">
          <button
            onClick={handleDownloadPNG}
            className="flex-1 glass rounded-2xl py-4 flex flex-col items-center gap-2 hover:bg-muted transition-all active:scale-95"
          >
            <FileImage className="w-6 h-6 text-primary" />
            <span className="text-sm font-medium">PNG</span>
          </button>
          <button
            onClick={handleDownloadSVG}
            className="flex-1 glass rounded-2xl py-4 flex flex-col items-center gap-2 hover:bg-muted transition-all active:scale-95"
          >
            <FileCode className="w-6 h-6 text-accent" />
            <span className="text-sm font-medium">SVG</span>
          </button>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="px-4 mt-4 space-y-3">
        {/* Share button */}
        <GradientButton 
          onClick={handleShare}
          size="lg"
          className="w-full flex items-center justify-center gap-2 rounded-2xl"
        >
          <Share2 className="w-5 h-5" />
          Share QR Code
        </GradientButton>
        
        {/* Save button */}
        <button
          onClick={handleSaveToHistory}
          className="w-full glass rounded-2xl py-4 flex items-center justify-center gap-2 hover:bg-muted transition-all active:scale-95"
        >
          <Save className="w-5 h-5 text-accent" />
          <span className="font-medium">Save to History</span>
        </button>
      </div>
      
      {/* Generate another */}
      <div className="px-4 mt-6">
        <button
          onClick={() => navigate('/generate')}
          className="w-full py-4 text-primary font-semibold rounded-2xl hover:bg-primary/5 transition-colors"
        >
          Generate Another Code
        </button>
      </div>
    </div>
  );
};
