# AAB Bundle Generation Plan

## Project Analysis
- **Project Type**: Capacitor + React + Vite
- **App ID**: com.nrplaystudio.qrmaster
- **Keystore**: qr-master-release.keystore (already configured)
- **Target**: Signed AAB bundle for Google Play Store

## Prerequisites Confirmed ✅
- ✅ Keystore file exists: `android/app/qr-master-release.keystore`
- ✅ Signing configuration in build.gradle
- ✅ Release build type configured
- ✅ Capacitor Android platform setup
- ✅ Gradle wrapper available

## Build Steps

### Step 1: Build Web Assets
```bash
npm run build
```
**Purpose**: Create optimized production build of React app

### Step 2: Sync to Android Platform
```bash
npx cap sync android
```
**Purpose**: Copy web assets to Android platform and update dependencies

### Step 3: Generate Signed AAB Bundle
```bash
cd android
./gradlew bundleRelease
```
**Purpose**: Generate signed AAB bundle for Play Store distribution

## Expected Output
- **Location**: `android/app/build/outputs/bundle/release/app-release.aab`
- **File Size**: Typically 15-30MB depending on dependencies
- **Signature**: Already signed with provided keystore

## Troubleshooting Notes
- If build fails, check Java version (requires Java 11+)
- Ensure all npm dependencies are installed
- Verify keystore password and alias in build.gradle
- Clean build if needed: `./gradlew clean`

## Verification Steps
1. Check AAB file is generated
2. Verify signature using: `jarsigner -verify -verbose android/app/build/outputs/bundle/release/app-release.aab`
3. Test bundle integrity
