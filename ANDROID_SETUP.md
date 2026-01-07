# Android Development Setup Guide

Step-by-step instructions for setting up Android development on Windows.

---

## Step 1: Install Android Studio

1. Download from [developer.android.com/studio](https://developer.android.com/studio)
2. Run the installer
3. Select **Standard** installation type
4. Wait for the SDK download to complete (~2-3 GB)

---

## Step 2: Configure SDK (First Launch)

When Android Studio opens for the first time:

1. Click **More Actions** → **SDK Manager**
2. Note the **Android SDK Location** at the top (e.g., `C:\Users\Chinmay\AppData\Local\Android\Sdk`)
3. Go to **SDK Tools** tab
4. Ensure these are checked:
   - ✅ Android SDK Build-Tools
   - ✅ Android SDK Platform-Tools
   - ✅ Android Emulator (optional)
5. Click **Apply** → **OK**

---

## Step 3: Add SDK to System PATH

1. Press **Win + R** → type `sysdm.cpl` → Enter
2. Click **Advanced** tab → **Environment Variables**
3. Under **User variables**, click **New**:
   - Variable name: `ANDROID_HOME`
   - Variable value: `C:\Users\Chinmay\AppData\Local\Android\Sdk`
4. Find **Path** in User variables → Click **Edit** → **New**
5. Add these two entries:
   ```
   %ANDROID_HOME%\platform-tools
   %ANDROID_HOME%\emulator
   ```
6. Click **OK** on all dialogs

---

## Step 4: Enable USB Debugging on Phone

1. Go to **Settings → About Phone**
2. Tap **Build Number** 7 times (until you see "You are now a developer!")
3. Go back to **Settings → Developer Options**
4. Enable **USB Debugging**
5. (Optional) Enable **Install via USB**

---

## Step 5: Connect Phone & Verify

1. Connect phone to PC via USB cable
2. On phone, tap **Allow** when prompted for USB debugging
3. Check **"Always allow from this computer"**
4. **Restart your terminal/VS Code**
5. Open new terminal and run:
   ```bash
   adb devices
   ```
6. You should see:
   ```
   List of devices attached
   XXXXXXXX    device
   ```

---

## Step 6: Build & Install App

```bash
cd ExpenseEase-v2/mobile
npx expo run:android
```

This will:
- Compile the app (~2-5 minutes first time)
- Install it on your connected phone
- Launch the app automatically

---

## Troubleshooting

### "adb is not recognized"
- Restart your terminal after adding PATH variables
- Verify ANDROID_HOME is set correctly

### "No devices found"
- Check USB cable (use a data cable, not charge-only)
- Enable USB Debugging again
- Try different USB port

### Build fails
```bash
cd mobile
npx expo prebuild --clean
npx expo run:android
```

### "SDK location not found"
Create `local.properties` in `mobile/android/`:
```
sdk.dir=C:\\Users\\Chinmay\\AppData\\Local\\Android\\Sdk
```
