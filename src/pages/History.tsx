import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanLine, QrCode, ExternalLink, Clock, Download, Star, Trash2, Trash, Share2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { AppBar } from '@/components/ui/AppBar';
import { BannerAdPlaceholder } from '@/components/ads/BannerAdPlaceholder';
import { useAds } from '@/contexts/AdsContext';
import { 
  getScanHistory, 
  getGeneratedHistory, 
  ScanHistoryItem, 
  GeneratedHistoryItem,
  toggleFavorite,
  deleteHistoryItem,
  clearScanHistory,
  clearGeneratedHistory,
} from '@/utils/storage';
import { toast } from 'sonner';
import { APP_CONSTANTS } from '@/utils/constants';
import { sharePngWithText } from '@/utils/nativeShare';
import { getQrTypeIconDataUri } from '@/utils/qrTypeIcons';
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

// History screen with scan and generated tabs
export const History: React.FC = () => {
  const navigate = useNavigate();
  const { isPremium } = useAds();
  const [activeTab, setActiveTab] = useState<'scan' | 'generated'>('scan');
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [generatedHistory, setGeneratedHistory] = useState<GeneratedHistoryItem[]>([]);
  
  // Load history
  const loadHistory = useCallback(() => {
    setScanHistory(getScanHistory());
    setGeneratedHistory(getGeneratedHistory());
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);
  
  // Format timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Export history as JSON
  const handleExportHistory = () => {
    const data = {
      scanHistory,
      generatedHistory,
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `qr-history-${Date.now()}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('History exported!');
  };

  // Toggle favorite
  const handleToggleFavorite = (id: string, type: 'scan' | 'generated', e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(id, type);
    loadHistory();
  };

  // Delete single item
  const handleDeleteItem = (id: string, type: 'scan' | 'generated', e: React.MouseEvent) => {
    e.stopPropagation();
    deleteHistoryItem(id, type);
    loadHistory();
    toast.success('Item deleted');
  };

  const getGeneratedQrBlob = async (item: GeneratedHistoryItem): Promise<Blob> => {
    const svgMarkup = renderToStaticMarkup(
      <QRCodeSVG
        value={item.qrData}
        size={240}
        level="H"
        includeMargin={true}
        bgColor="#FFFFFF"
        fgColor={item.qrColor || '#000000'}
      />
    );

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 512;

    const img = new Image();
    const svgDataUri = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgMarkup)));

    return new Promise((resolve, reject) => {
      img.onload = () => {
        if (!ctx) return reject(new Error('No canvas context'));
        ctx.drawImage(img, 0, 0, 512, 512);

        // Draw center icon overlay (kept <=25% for scan reliability)
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
        ctx.strokeStyle = 'rgba(0,0,0,0.06)';
        ctx.lineWidth = Math.max(2, Math.round(iconBox * 0.06));
        ctx.stroke();
        ctx.restore();

        const iconImg = new Image();
        iconImg.onload = () => {
          ctx.drawImage(iconImg, cx - iconSize / 2, cy - iconSize / 2, iconSize, iconSize);
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to create PNG blob'));
          }, 'image/png');
        };
        iconImg.onerror = () => {
          // If icon fails, still export QR
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to create PNG blob'));
          }, 'image/png');
        };
        iconImg.src = getQrTypeIconDataUri(item.type, { color: item.qrColor || '#111827', size: 64 });
      };
      img.onerror = () => reject(new Error('Failed to render SVG'));
      img.src = svgDataUri;
    });
  };

  const handleShareGenerated = async (item: GeneratedHistoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const blob = await getGeneratedQrBlob(item);
      await sharePngWithText({
        blob,
        filename: `qr-${item.type}-${item.timestamp}.png`,
        title: 'QR Code',
        text: `${APP_CONSTANTS.SHARE_TEXT} ${APP_CONSTANTS.PLAY_STORE_URL}`,
      });
    } catch {
      toast.error('Unable to share. Please try again.');
    }
  };

  // Clear all history for current tab
  const handleClearAll = () => {
    if (activeTab === 'scan') {
      clearScanHistory();
    } else {
      clearGeneratedHistory();
    }
    loadHistory();
    toast.success(`${activeTab === 'scan' ? 'Scan' : 'Generated'} history cleared`);
  };

  const currentHistory = activeTab === 'scan' ? scanHistory : generatedHistory;
  
  return (
    <div className="min-h-screen pb-32">
      <AppBar 
        title="History" 
        subtitle="Your past QR activities"
        showBack
        backTo="/home"
        actions={
          <div className="flex items-center gap-2">
            {currentHistory.length > 0 && (
              <>
                <button
                  onClick={handleExportHistory}
                  className="p-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors"
                >
                  <Download className="w-5 h-5 text-primary" />
                </button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="p-2.5 rounded-xl bg-destructive/10 hover:bg-destructive/20 transition-colors">
                      <Trash className="w-5 h-5 text-destructive" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear {activeTab === 'scan' ? 'Scan' : 'Generated'} History?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. All {activeTab === 'scan' ? 'scanned' : 'generated'} items will be permanently deleted.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleClearAll} className="rounded-xl bg-destructive hover:bg-destructive/90">
                        Delete All
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        }
      />
      
      {/* Tab bar */}
      <div className="px-4">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('scan')}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl transition-all active:scale-95 ${
              activeTab === 'scan'
                ? 'gradient-primary text-primary-foreground shadow-lg'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            <ScanLine className="w-5 h-5" />
            <span className="font-medium">Scanned</span>
          </button>
          <button
            onClick={() => setActiveTab('generated')}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl transition-all active:scale-95 ${
              activeTab === 'generated'
                ? 'gradient-primary text-primary-foreground shadow-lg'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            <QrCode className="w-5 h-5" />
            <span className="font-medium">Generated</span>
          </button>
        </div>
        
        {/* History list */}
        <div className="space-y-3">
          {activeTab === 'scan' && (
            <>
              {scanHistory.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                    <ScanLine className="w-10 h-10 text-muted-foreground/50" />
                  </div>
                  <p className="text-muted-foreground font-medium">No scan history yet</p>
                  <button 
                    onClick={() => navigate('/scan')}
                    className="mt-4 text-primary font-semibold"
                  >
                    Scan your first QR code
                  </button>
                </div>
              ) : (
                scanHistory.map((item) => (
                  <AnimatedCard
                    key={item.id}
                    onClick={() => navigate('/result', { state: { content: item.content, type: item.type } })}
                    className="flex items-center gap-4 rounded-2xl"
                  >
                    <div className="p-3 rounded-xl bg-primary/10">
                      <ScanLine className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-foreground">{item.content}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(item.timestamp)}</span>
                        <span className="capitalize px-2 py-0.5 rounded-full bg-muted text-xs">{item.type}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={(e) => handleToggleFavorite(item.id, 'scan', e)}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <Star className={`w-4 h-4 ${item.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                      </button>
                      <button 
                        onClick={(e) => handleDeleteItem(item.id, 'scan', e)}
                        className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </AnimatedCard>
                ))
              )}
            </>
          )}
          
          {activeTab === 'generated' && (
            <>
              {generatedHistory.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                    <QrCode className="w-10 h-10 text-muted-foreground/50" />
                  </div>
                  <p className="text-muted-foreground font-medium">No generated QR codes yet</p>
                  <button 
                    onClick={() => navigate('/generate')}
                    className="mt-4 text-primary font-semibold"
                  >
                    Generate your first QR code
                  </button>
                </div>
              ) : (
                generatedHistory.map((item) => (
                  <AnimatedCard
                    key={item.id}
                    onClick={() => navigate('/preview', { state: { qrData: item.qrData, type: item.type, styleId: item.styleId, qrColor: item.qrColor } })}
                    className="flex items-center gap-4 rounded-2xl"
                  >
                    <div 
                      className="p-3 rounded-xl"
                      style={{ backgroundColor: item.qrColor ? `${item.qrColor}20` : 'hsl(var(--accent) / 0.1)' }}
                    >
                      <QrCode 
                        className="w-5 h-5" 
                        style={{ color: item.qrColor || 'hsl(var(--accent))' }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-foreground">{item.content}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(item.timestamp)}</span>
                        <span className="capitalize px-2 py-0.5 rounded-full bg-muted text-xs">{item.type}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleShareGenerated(item, e)}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                        aria-label="Share QR code"
                      >
                        <Share2 className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button 
                        onClick={(e) => handleToggleFavorite(item.id, 'generated', e)}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <Star className={`w-4 h-4 ${item.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                      </button>
                      <button 
                        onClick={(e) => handleDeleteItem(item.id, 'generated', e)}
                        className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </AnimatedCard>
                ))
              )}
            </>
          )}
        </div>
      </div>

      {/* Banner Ad at bottom */}
      {!isPremium && <BannerAdPlaceholder screen="history" />}
    </div>
  );
};