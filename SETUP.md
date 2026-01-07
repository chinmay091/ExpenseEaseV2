# ExpenseEase - Setup Guide

Complete setup instructions for running ExpenseEase locally, including iOS development build.

---

## Prerequisites

### Required Software
- **Node.js** v18+ ([download](https://nodejs.org))
- **Git** ([download](https://git-scm.com))
- **PostgreSQL** v14+ (for backend database)

### For iOS Build (Mac only)
- **Xcode** v15+ (from Mac App Store)
- **CocoaPods**: `sudo gem install cocoapods`
- Free Apple ID (for personal device testing)

### For Android Build
- **Android Studio** with SDK and emulator
- **Java JDK** 17+

---

## Quick Start

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd ExpenseEase-v2
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create `.env` file:
```env
PORT=5000
DATABASE_URL=postgres://user:password@localhost:5432/expenseease
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
GOOGLE_API_KEY=your_gemini_api_key
LLM_ENABLED=true
# Optional: HUGGINGFACE_API_KEY=your_hf_key
```

Start backend:
```bash
npm run dev
```

### 3. Mobile App Setup
```bash
cd mobile
npm install
```

Update API URL in `api/axios.ts` to point to your backend.

---

## iOS Build (Mac Required)

### Option A: Run on Connected iPhone

1. **Connect iPhone via USB** to Mac

2. **Generate iOS files:**
   ```bash
   cd mobile
   npx expo prebuild --platform ios
   ```

3. **Install CocoaPods dependencies:**
   ```bash
   cd ios
   pod install
   cd ..
   ```

4. **Build and run:**
   ```bash
   npx expo run:ios --device
   ```

5. **Trust Developer on iPhone:**
   - Go to Settings → General → VPN & Device Management
   - Tap the developer certificate and trust it

### Option B: Build IPA for Sharing

1. Open `mobile/ios/ExpenseEase.xcworkspace` in Xcode

2. Select your Apple ID:
   - Xcode → Settings → Accounts → Add Apple ID
   - Select team in project settings

3. Build Archive:
   - Product → Archive
   - Window → Organizer → Distribute App
   - Select "Development" → Export

4. Share the `.ipa` file

---

## Android Build

```bash
cd mobile
npx expo prebuild --platform android
npx expo run:android
```

---

## Environment Variables

### Backend (.env)
| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | Yes | Server port (default: 5000) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | JWT signing secret |
| `JWT_REFRESH_SECRET` | Yes | Refresh token secret |
| `GOOGLE_API_KEY` | Yes | Gemini API key for AI features |
| `LLM_ENABLED` | No | Enable AI features (true/false) |
| `HUGGINGFACE_API_KEY` | No | For OCR (optional, uses Gemini fallback) |

### Mobile (app.json)
For Gmail OAuth, update in `app.json`:
```json
"@react-native-google-signin/google-signin": {
  "iosUrlScheme": "com.googleusercontent.apps.YOUR_CLIENT_ID"
}
```

---

## Features

| Feature | iOS | Android | Notes |
|---------|-----|---------|-------|
| OCR Receipt Scanning | ✅ | ✅ | Camera + Gemini/HuggingFace |
| SMS Import | ❌ | ✅ | Android only (iOS restriction) |
| Gmail Import | ✅ | ✅ | Requires Google OAuth setup |
| AI Chat | ✅ | ✅ | Requires Gemini API key |

---

## Troubleshooting

### "No Team Associated" Error (iOS)
- Open Xcode → Project Settings → Signing & Capabilities
- Select a team (requires Apple ID)

### Pod Install Fails
```bash
cd ios
pod deintegrate
pod install
```

### Build Fails After Adding Dependencies
```bash
cd mobile
npx expo prebuild --clean
```
