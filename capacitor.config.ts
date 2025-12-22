import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nrplaystudio.qrmaster',
  appName: 'QR Code Scanner – Barcode Reader',
  webDir: 'dist',

  plugins: {
    Camera: {
      permissions: ['camera']
    },

    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: false,
      backgroundColor: '#000000',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
      androidUseDialog: false,
      androidEnableTranslucentSplashScreen: false
    }
  },
  android: {
    backgroundColor: '#000000',
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false
  }
};

export default config;