# Card Valuer — Setup Guide

A Pokemon TCG card scanner that uses your camera and Google Cloud Vision OCR to identify cards and look up their market prices via the Pokemon TCG API.

---

## Demo Mode (No API Keys Required)

The app ships with a built-in demo mode. If no API keys are configured, every scan returns a mock **Charizard (Base Set #4/102)** result so you can test the full UI flow without spending any money.

---

## Step 1: Get Scrydex API Credentials

The Pokemon TCG API is now part of **Scrydex** (`api.scrydex.com`). Two values are required:

1. Visit [https://scrydex.com](https://scrydex.com) and create a free account
2. After logging in, open your **Dashboard**
3. Copy your **API Key** → paste as `POKEMON_TCG_API_KEY` in `config.ts`
4. Copy your **Team ID** → paste as `SCRYDEX_TEAM_ID` in `config.ts`

Both headers (`X-Api-Key` and `X-Team-ID`) are sent on every request. Pricing data (`include=prices`) is fetched automatically with each card lookup — no separate pricing API call needed.

---

## Step 2: Get a Google Cloud Vision API Key

1. Go to [https://console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or select an existing one)
3. In the left menu, go to **APIs & Services → Library**
4. Search for **Cloud Vision API** and click **Enable**
5. Go to **APIs & Services → Credentials**
6. Click **Create Credentials → API Key**
7. Copy the generated API key
8. (Recommended) Restrict the key to only the **Cloud Vision API** to prevent misuse

> Note: Google Cloud Vision charges per 1,000 requests after the free tier (1,000 free units/month). Typical scanning sessions use very few requests.

---

## Step 3: Add Your API Keys

Open the file:

```
src/constants/config.ts
```

Find these two lines and paste your keys:

```typescript
export const POKEMON_TCG_API_KEY = 'paste_your_pokemon_tcg_key_here';
export const GOOGLE_CLOUD_VISION_API_KEY = 'paste_your_google_vision_key_here';
```

Save the file. That's it — no environment variable setup required for local development.

---

## Step 4: Install Dependencies & Run

Make sure you have Node.js and the Expo CLI installed.

```bash
# Install dependencies (already done if you cloned the repo)
npm install

# Start the Expo development server
npm start
```

---

## Step 5: Run on Your Device

### Using Expo Go (Easiest)

1. Install **Expo Go** from the App Store (iOS) or Google Play (Android)
2. Run `npm start` in this directory
3. Scan the QR code shown in the terminal with your phone's camera (iOS) or the Expo Go app (Android)
4. The app will load on your device

### Using a Simulator

```bash
# iOS Simulator (requires Xcode on macOS)
npm run ios

# Android Emulator (requires Android Studio)
npm run android
```

---

## How to Use

1. **Scan Tab**: Point your camera at a Pokemon card and tap the red **Scan** button. The app will automatically capture frames, run OCR, and look up the card.
2. **Session Tab**: View all cards scanned in the current session. Adjust condition grades (NM/LP/MP/HP/DMG) per card. Export to CSV with the "CSV ↗" button.
3. **History Tab**: View previously saved sessions. Tap any session to expand and see its cards.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Demo Mode" always shows | Add your Google Cloud Vision API key to `config.ts` |
| Card not found | Ensure the card number and name are visible and in focus |
| Camera permission denied | Go to device Settings → Card Valuer → enable Camera |
| CSV export fails | Grant storage/media library permissions when prompted |

---

## Project Structure

```
src/
  types/          — TypeScript interfaces (PokemonCard, ScannedCard, etc.)
  constants/      — Config values and API keys
  services/       — OCR, Pokemon TCG API, and pricing logic
  utils/          — CSV export, local storage helpers, dedup buffer
  hooks/          — useScanner custom hook
  context/        — ScannerContext (shared state across tabs)
  components/     — ConditionPicker, CardListItem, ScannerOverlay
  screens/        — ScannerScreen, SessionScreen, HistoryScreen
```
