import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BrowserMultiFormatReader, 
  BrowserQRCodeReader,
  BrowserMultiFormatOneDReader,
  BarcodeFormat
} from '@zxing/browser';
import { DecodeHintType, Result } from '@zxing/library';
import { ArrowLeft, Flashlight, Image, Camera, X, QrCode, Barcode, AlertCircle } from 'lucide-react';
import { ScannerOverlay } from '@/components/Scanner/ScannerOverlay';
import { GradientButton } from '@/components/ui/GradientButton';
import { BannerAdPlaceholder } from '@/components/ads/BannerAdPlaceholder';
import { useAds } from '@/contexts/AdsContext';
import { useInterstitialAd } from '@/hooks/useInterstitialAd';
import { addScanHistory } from '@/utils/storage';
import { toast } from 'sonner';

type ScanMode = 'all' | 'qr' | 'barcode';

// QR & Barcode Scanner screen with camera and gallery support
export const Scanner: React.FC = () => {
  const navigate = useNavigate();
  const { isPremium, hideBanner } = useAds();
  const { onActionComplete } = useInterstitialAd();
  const [scanning, setScanning] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [scanMode, setScanMode] = useState<ScanMode>('all');
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | BrowserQRCodeReader | BrowserMultiFormatOneDReader | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasNavigatedRef = useRef(false); // Prevent duplicate navigations
  const lastScannedCodeRef = useRef<string | null>(null); // Prevent duplicate history entries
  const scanCooldownRef = useRef(false); // Cooldown between scans
  
  // Create reader based on scan mode
  const createReader = (mode: ScanMode) => {
    const hints = new Map();
    
    if (mode === 'qr') {
      // QR-only mode: fastest for QR codes
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
      hints.set(DecodeHintType.TRY_HARDER, false); // Fast mode for QR
      const options = {
        delayBetweenScanAttempts: 100,
        delayBetweenScanSuccess: 1000
      };
      return new BrowserQRCodeReader(hints, options);
    } else if (mode === 'barcode') {
      // Barcode-only mode: THOROUGH scanning for 1D barcodes
      // Barcodes need more processing than QR codes
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13,      // Most common product barcode
        BarcodeFormat.EAN_8,       // Short product barcode
        BarcodeFormat.UPC_A,       // US/Canada product barcode
        BarcodeFormat.UPC_E,       // Short US/Canada barcode
        BarcodeFormat.CODE_128,    // Versatile alphanumeric
        BarcodeFormat.CODE_39,     // Common in logistics
        BarcodeFormat.CODE_93,     // Compact alphanumeric
        BarcodeFormat.ITF,         // Interleaved 2 of 5
        BarcodeFormat.CODABAR,     // Libraries, blood banks
        BarcodeFormat.RSS_14,      // GS1 DataBar
      ]);
      // TRY_HARDER: true for barcodes - they need multiple detection passes
      hints.set(DecodeHintType.TRY_HARDER, true);
      const options = {
        delayBetweenScanAttempts: 50,  // Very fast attempts for barcodes
        delayBetweenScanSuccess: 1000
      };
      return new BrowserMultiFormatReader(hints, options);
    } else {
      // All formats mode: balanced for both QR and barcodes
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.QR_CODE,     // QR codes (highest priority)
        BarcodeFormat.EAN_13,      // Most common product barcode
        BarcodeFormat.EAN_8,       
        BarcodeFormat.UPC_A,       
        BarcodeFormat.UPC_E,       
        BarcodeFormat.CODE_128,    
        BarcodeFormat.CODE_39,     
        BarcodeFormat.CODE_93,     
        BarcodeFormat.ITF,         
        BarcodeFormat.CODABAR,
        BarcodeFormat.DATA_MATRIX, // 2D matrix barcode
        BarcodeFormat.PDF_417,     // 2D stacked barcode
        BarcodeFormat.AZTEC,       // 2D matrix code
      ]);
      // Moderate TRY_HARDER for mixed mode
      hints.set(DecodeHintType.TRY_HARDER, true);
      const options = {
        delayBetweenScanAttempts: 75,  // Balanced speed
        delayBetweenScanSuccess: 1000
      };
      return new BrowserMultiFormatReader(hints, options);
    }
  };
  
  // Handle successful scan
  const onScanSuccess = async (result: Result) => {
    const decodedText = result.getText();
    
    // Prevent duplicate scans of the same code
    if (scanCooldownRef.current || lastScannedCodeRef.current === decodedText) {
      return;
    }
    
    // Prevent duplicate navigation if already processing a scan
    if (hasNavigatedRef.current) {
      console.log('[Scanner] Already navigated, ignoring duplicate scan');
      return;
    }
    
    try {
      // Set flags immediately to prevent duplicates
      hasNavigatedRef.current = true;
      lastScannedCodeRef.current = decodedText;
      scanCooldownRef.current = true;
      
      console.log('[Scanner] Decoded:', decodedText);
      
      // Best-effort cleanup; never block navigation on failures.
      try { await stopScanner(); } catch {}
      try { await hideBanner(); } catch {}

      // Determine content type (qr vs barcode)
      let type: 'qr' | 'barcode' = 'qr';
      if (scanMode === 'barcode' || (scanMode === 'all' && decodedText.match(/^[0-9]+$/))) {
        type = 'barcode';
      }

      // Add to history only once
      addScanHistory(decodedText);

      // Navigate immediately (ads should never block scan result UX).
      navigate('/result', { state: { content: decodedText, type } });

      // Trigger interstitial bookkeeping in background
      void onActionComplete();
    } catch (e) {
      console.error('[Scanner] onScanSuccess failed', e);
      hasNavigatedRef.current = false; // Reset on error
      lastScannedCodeRef.current = null;
      scanCooldownRef.current = false;
      toast.error('Scanned, but failed to open result. Please try again.');
    }
  };
  
  // Start camera scanner
  const startScanner = async () => {
    try {
      console.log('[ZXing] Starting scanner...');
      setError(null);
      setPermissionDenied(false);
      hasNavigatedRef.current = false; // Reset navigation flag when starting scanner
      lastScannedCodeRef.current = null; // Reset last scanned code
      scanCooldownRef.current = false; // Reset cooldown
      
      if (!videoRef.current) {
        setError('Video element not ready');
        return;
      }
      
      // Create reader for current mode
      const reader = createReader(scanMode);
      readerRef.current = reader;
      
      // Get available video devices
      const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
      console.log('[ZXing] Available cameras:', videoInputDevices.map(d => d.label || d.deviceId));
      
      // Select the best back camera (avoid ultra-wide / 0.5x)
      let selectedDevice = videoInputDevices[0];
      
      if (videoInputDevices.length > 1) {
        const score = (label: string) => {
          const l = label.toLowerCase();
          let s = 0;
          // Prefer back cameras
          if (l.includes('back') || l.includes('rear') || l.includes('environment')) s += 20;
          if (l.includes('front')) s -= 50;
          // Prefer main/standard camera
          if (l.includes('main') || l.includes('primary') || l.includes('standard') || l.includes('1x') || l.includes('1.0')) s += 30;
          // Penalize ultra-wide / 0.5x lenses
          if (l.includes('ultra') || l.includes('wide') || l.includes('0.5') || l.includes('0,5')) s -= 60;
          // Tele/macro lenses are not ideal
          if (l.includes('tele') || l.includes('2x') || l.includes('zoom') || l.includes('macro')) s -= 15;
          return s;
        };
        
        const ranked = videoInputDevices
          .map(d => ({ d, s: score(d.label || '') }))
          .sort((a, b) => b.s - a.s);
        
        selectedDevice = ranked[0].d;
        console.log('[ZXing] Selected camera:', selectedDevice.label || selectedDevice.deviceId);
      }
      
      // Start decoding from video device
      // ZXing will continuously decode and call this callback on success
      await reader.decodeFromVideoDevice(
        selectedDevice.deviceId,
        videoRef.current,
        (result, error) => {
          if (result) {
            // Instant detection! Process immediately
            void onScanSuccess(result);
          }
          // Errors are normal (no QR in frame), just ignore them
        }
      );
      
      // Store the video stream for flashlight control
      if (videoRef.current.srcObject) {
        videoStreamRef.current = videoRef.current.srcObject as MediaStream;
      }
      
      // Try to force 1x zoom if supported
      try {
        const stream = videoStreamRef.current;
        if (stream) {
          const videoTrack = stream.getVideoTracks()[0];
          const capabilities = videoTrack.getCapabilities() as any;
          
          if (capabilities.zoom) {
            await videoTrack.applyConstraints({
              advanced: [{ zoom: 1 } as any]
            });
            console.log('[ZXing] Applied zoom=1');
          }
        }
      } catch (e) {
        console.log('[ZXing] Zoom control not available:', e);
      }
      
      setScanning(true);
      console.log('[ZXing] Scanner started successfully');
    } catch (err: any) {
      console.error('[ZXing] Scanner error:', err);
      const name = err?.name || '';
      const message = String(err?.message || err || '');

      // Only show "Open Settings" when it's actually a permission denial.
      const isPermissionError =
        name === 'NotAllowedError' ||
        name === 'PermissionDeniedError' ||
        message.toLowerCase().includes('permission') ||
        message.toLowerCase().includes('not allowed') ||
        message.toLowerCase().includes('denied');

      setPermissionDenied(Boolean(isPermissionError));
      setError(
        isPermissionError
          ? 'Camera access denied. Please allow camera permissions.'
          : 'Failed to start camera. Please try again.'
      );
    }
  };
  
  // Stop camera scanner
  const stopScanner = async () => {
    if (readerRef.current) {
      try {
        console.log('[ZXing] Stopping scanner...');
        // Stop the reader's internal scanning loop
        const anyReader: any = readerRef.current;
        if (typeof anyReader.stopAsyncDecode === 'function') {
          anyReader.stopAsyncDecode();
        } else if (typeof anyReader.stopContinuousDecode === 'function') {
          anyReader.stopContinuousDecode();
        }
        readerRef.current = null;
        
        // Stop video stream
        if (videoStreamRef.current) {
          videoStreamRef.current.getTracks().forEach(track => track.stop());
          videoStreamRef.current = null;
        }
        
        // Clear video element
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        
        setScanning(false);
        setFlashOn(false);
        console.log('[ZXing] Scanner stopped successfully');
      } catch (err) {
        console.error('[ZXing] Error stopping scanner:', err);
      }
    }
  };
  
  // Toggle flashlight
  const toggleFlash = async () => {
    if (!scanning || !videoStreamRef.current) {
      toast.error('Camera not active');
      return;
    }
    
    try {
      const desired = !flashOn;
      const tracks = videoStreamRef.current.getVideoTracks();
      
      if (tracks.length === 0) {
        toast.error('No video track available');
        return;
      }
      
      const videoTrack = tracks[0];
      const capabilities = videoTrack.getCapabilities() as any;
      
      console.log('[ZXing] Camera capabilities:', capabilities);
      
      // Check if torch is supported
      if (!capabilities || !capabilities.torch) {
        toast.error('Flashlight not supported on this device');
        return;
      }
      
      // Apply torch constraint
      await videoTrack.applyConstraints({
        advanced: [{ torch: desired } as any]
      });
      
      setFlashOn(desired);
      console.log('[ZXing] Flashlight toggled:', desired);
    } catch (err: any) {
      console.error('[ZXing] Unable to toggle flashlight:', err);
      const message = err?.message || 'Unable to toggle flashlight';
      toast.error(message.includes('constraint') 
        ? 'Flashlight not supported on this device' 
        : 'Unable to toggle flashlight');
    }
  };
  
  // Scan from gallery image
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      console.log('[ZXing] Scanning from gallery...');
      const reader = createReader('all'); // Use all formats for gallery
      
      // Create object URL from file
      const imageUrl = URL.createObjectURL(file);
      
      // Decode from image URL
      const result = await reader.decodeFromImageUrl(imageUrl);
      
      // Clean up object URL
      URL.revokeObjectURL(imageUrl);
      
      // Hide scan banner before leaving the screen
      await hideBanner();

      const decodedText = result.getText();
      console.log('[ZXing] Gallery scan result:', decodedText);
      
      // Determine content type for UI display
      let type: 'qr' | 'barcode' = 'qr';
      if (scanMode === 'barcode' || (scanMode === 'all' && decodedText.match(/^[0-9]+$/))) {
        type = 'barcode';
      }

      addScanHistory(decodedText);
      navigate('/result', { state: { content: decodedText, type } });
      void onActionComplete();
    } catch (err) {
      console.error('[ZXing] Gallery scan error:', err);
      toast.error('No QR code or barcode found in the image');
    }
  };
  
  // Handle mode change
  const handleModeChange = async (newMode: ScanMode) => {
    if (scanning) {
      await stopScanner();
    }
    hasNavigatedRef.current = false; // Reset navigation flag when mode changes
    lastScannedCodeRef.current = null; // Reset last scanned code
    scanCooldownRef.current = false; // Reset cooldown
    setScanMode(newMode);
  };
  
  // Open app settings
  const openAppSettings = () => {
    toast.info('Please enable camera permission in your device settings for this app.');
  };
  
  // Handle back navigation
  const handleBack = async () => {
    await stopScanner();
    // Ensure the native banner is actually hidden before leaving this screen
    await hideBanner();
    navigate('/home');
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // best-effort cleanup; no await in effect cleanup
      void stopScanner();
      void hideBanner();
    };
  }, [hideBanner]);
  
  return (
    // Add bottom padding so the fixed BottomNav doesn't cover the last controls / inline banner.
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="flex items-center justify-between p-4">
          <button 
            onClick={handleBack}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <h1 className="text-xl font-bold">Scan QR Code</h1>
          
          <div className="w-10" /> {/* Spacer for alignment */}
        </div>
      </div>
      
      {/* Content area with padding for header */}
      <div className="pt-16">
        {/* Mode selector with top padding */}
        <div className="flex justify-center gap-2 px-4 mt-6 mb-6">
          <button
            onClick={() => handleModeChange('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              scanMode === 'all' ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            Auto Detect
          </button>
          <button
            onClick={() => handleModeChange('qr')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              scanMode === 'qr' ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            <QrCode className="w-4 h-4" />
            QR
          </button>
          <button
            onClick={() => handleModeChange('barcode')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              scanMode === 'barcode' ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            <Barcode className="w-4 h-4" />
            Barcode
          </button>
        </div>
        
        {/* Camera preview area */}
        <div className={`relative mx-4 bg-muted rounded-3xl overflow-hidden ${scanMode === 'barcode' ? 'h-72' : 'h-96'}`}>
          {/* Video element for camera preview */}
          <video 
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />
          
          {/* Scanner overlay with neon effect */}
          {scanning && <ScannerOverlay />}
          
          {/* Error message */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/90">
              <div className="text-center p-6 max-w-xs">
                <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
                <p className="text-destructive font-medium mb-4">{error}</p>
                {permissionDenied && (
                  <button
                    onClick={openAppSettings}
                    className="w-full gradient-primary py-2 rounded-lg font-medium"
                  >
                    Open Settings
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* Placeholder when not scanning */}
          {!scanning && !error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Camera className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Tap to start scanning</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Control buttons and ad in column layout */}
        <div className="px-4 mt-8 space-y-4">
          {/* Start/Stop Scanner */}
          <GradientButton
            onClick={scanning ? stopScanner : startScanner}
            size="lg"
            className="w-full flex items-center justify-center gap-2 rounded-xl"
          >
            <Camera className="w-5 h-5" />
            {scanning ? 'Stop Scanning' : 'Start Camera'}
          </GradientButton>
          
          {/* Flashlight toggle */}
          {scanning && (
            <button
              onClick={toggleFlash}
              className={`w-full py-4 rounded-xl transition-all ${
                flashOn 
                  ? 'bg-yellow-400 text-yellow-900 shadow-lg shadow-yellow-400/30' 
                  : 'glass'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Flashlight className="w-5 h-5" />
                <span className="font-medium">Flashlight</span>
              </div>
            </button>
          )}
          
          {/* Gallery option */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full glass rounded-xl py-4 flex items-center justify-center gap-3 hover:bg-muted transition-colors"
          >
            <Image className="w-5 h-5 text-primary" />
            <span className="font-medium">Scan from Gallery</span>
          </button>
          
          {/* Instructions */}
          <p className="text-center text-muted-foreground text-sm px-4">
            {scanMode === 'barcode' 
              ? 'Position the barcode within the frame to scan automatically'
              : scanMode === 'qr'
              ? 'Position the QR code within the frame to scan automatically'
              : 'Position QR code or barcode within the frame to scan automatically'}
          </p>
          
          {/* Banner Ad - inline below buttons */}
          {!isPremium && <BannerAdPlaceholder screen="scan" placement="inline" />}
        </div>
      </div>
    </div>
  );
};
