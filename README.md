# QR Code Scanner – Barcode Reader

A powerful, fast, and feature-rich QR code and barcode scanner app for Android, built with React, TypeScript, and Capacitor.

## 📱 Features

### Scanning
- **Instant QR Code Scanning** - Lightning-fast QR code detection powered by ZXing
- **Barcode Support** - Scan all major barcode formats (EAN-13, UPC-A, Code 128, etc.)
- **Scan from Gallery** - Import and decode QR codes from your photo library
- **Flashlight Toggle** - Built-in torch support for scanning in low light
- **Auto-detect** - Automatically recognizes QR code type and takes appropriate action

### Generation
Generate QR codes for multiple data types with custom styling:
- 📱 **Phone Numbers** - Direct calling QR codes
- ✉️ **SMS Messages** - Pre-filled text messages
- 🌐 **URLs** - Website links
- 💳 **UPI Payment** - Indian UPI payment QR codes
- 📡 **WiFi Credentials** - Share WiFi access easily
- 👤 **Contact Cards** - vCard contact information
- 📝 **Plain Text** - Any text content

### Customization
- 🎨 **Theme Support** - Multiple color themes (unlock with rewards)
- 🔐 **Premium Features** - WiFi, UPI, and Contact QR generation (unlock with ads)
- 🎯 **Custom Icons** - Type-specific center icons on generated QR codes
- 🌈 **Color Picker** - Customize QR code colors
- 🖼️ **High Error Correction** - Level H error correction for reliability

### History & Management
- 📚 **Scan History** - Keep track of all scanned codes
- 💾 **Generation History** - Access previously generated QR codes
- ⭐ **Favorites** - Bookmark important codes
- 🗑️ **Bulk Delete** - Clear history with one tap
- 📤 **Share & Export** - Share QR codes as PNG images

## 🛠️ Tech Stack

- **Frontend:** React 18 + TypeScript
- **Mobile Framework:** Capacitor 6
- **Scanning Library:** @zxing/browser (ZXing for JavaScript)
- **QR Generation:** qrcode.react
- **Styling:** Tailwind CSS + shadcn/ui
- **Ads:** AdMob (Capacitor Community)
- **Build Tool:** Vite

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Android Studio (for Android builds)
- Java JDK 17

## 🚀 Getting Started

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/qr-master-pro.git
cd qr-master-pro
```

2. Install dependencies:
```bash
npm install
```

3. Build the web assets:
```bash
npm run build
```

4. Sync with Capacitor:
```bash
npx cap sync android
```

### Development

Run the development server:
```bash
npm run dev
```

### Building for Android

#### Debug APK
```bash
cd android
./gradlew assembleDebug
```
Output: `android/app/build/outputs/apk/debug/app-debug.apk`

#### Release AAB (for Play Store)
```bash
cd android
./gradlew bundleRelease
```
Output: `android/app/build/outputs/bundle/release/app-release.aab`

## 📦 Project Structure

```
qr-master-pro/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ads/          # Ad components (Banner, Interstitial, Rewarded)
│   │   ├── ui/           # shadcn/ui components
│   │   └── QrCenterIcon.tsx
│   ├── pages/            # Main app screens
│   │   ├── Scanner.tsx   # QR/Barcode scanning screen
│   │   ├── Generator.tsx # QR code generation screen
│   │   ├── History.tsx   # Scan/Generation history
│   │   ├── Settings.tsx  # App settings
│   │   └── QRPreview.tsx # Generated QR preview & export
│   ├── services/         # Business logic
│   │   └── AdsService.ts # AdMob integration
│   ├── utils/            # Helper functions
│   │   ├── storage.ts    # LocalStorage management
│   │   ├── constants.ts  # App constants
│   │   └── qrTypeIcons.tsx
│   └── App.tsx           # Main app component
├── android/              # Android native project
├── public/               # Static assets
└── PRIVACY_POLICY.md     # Privacy policy for Play Store
```

## 🔧 Configuration

### App Configuration
Edit `capacitor.config.ts`:
```typescript
appId: 'com.nrplaystudio.qrmaster'
appName: 'QR Code Scanner – Barcode Reader'
```

### AdMob Setup
Update Ad Unit IDs in `src/services/AdsService.ts`:
```typescript
const AD_UNIT_IDS = {
  BANNER: 'ca-app-pub-XXXXX',
  INTERSTITIAL: 'ca-app-pub-XXXXX',
  REWARDED: 'ca-app-pub-XXXXX',
  REWARDED_FEATURE: 'ca-app-pub-XXXXX'
};
```

### Android Configuration
- **Package ID:** `android/app/build.gradle`
- **AdMob App ID:** `android/app/src/main/AndroidManifest.xml`
- **App Name:** `android/app/src/main/res/values/strings.xml`

## 📸 Screenshots

_Add your app screenshots here_

## 🎯 Roadmap

- [ ] iOS support
- [ ] Batch QR code generation
- [ ] QR code editing
- [ ] Custom QR code shapes
- [ ] Cloud backup for history

## 📄 License

This project is licensed under the MIT License.

## 📧 Support

For support, email: nigamrathore123456@gmail.com

## 🙏 Acknowledgments

- [ZXing](https://github.com/zxing-js/library) - Barcode scanning library
- [qrcode.react](https://github.com/zpao/qrcode.react) - QR code generation
- [Capacitor](https://capacitorjs.com/) - Cross-platform native runtime
- [shadcn/ui](https://ui.shadcn.com/) - UI component library
- [Lucide Icons](https://lucide.dev/) - Icon library

---

Made with ❤️ by NR Play Studio
