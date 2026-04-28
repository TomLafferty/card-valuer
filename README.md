# Card Valuer

A React Native / Expo iOS app for scanning and pricing Pokemon TCG cards and graded slabs in real time. Built for dealers, collectors, and anyone sorting bulk cards at shows or at home.

## Current Status

| Item | Status |
|------|--------|
| App code | Production-ready |
| PokeTrace API | Live — key configured |
| Apple Developer (LLC) | Enrollment processing |
| TestFlight | Ready to build once enrollment approves |
| App Store | Submission ready |

---

## Features

- **Continuous card scanning** — point camera at a card, OCR runs on-device via Apple Vision (no internet required for OCR)
- **Live pricing** — raw card prices by condition (NM/LP/MP/HP/DMG) via PokeTrace API (TCGPlayer + eBay data)
- **7-day price trends** — see whether a card is up or down vs the weekly average
- **Graded slab scanning** — scan PSA, CGC, BGS, SGC barcode → instant grade + market value
- **eBay sold comps** — recent eBay sold listings per card
- **Session management** — save, name, and revisit scan sessions
- **Collection tracker** — aggregate value across all sessions with set breakdown
- **CSV export** — share session data as a spreadsheet

---

## Requirements

- Node 20+
- Xcode 15+ (iOS builds)
- Expo CLI / EAS CLI
- Apple Developer Program membership (for device/TestFlight builds)

---

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd card-valuer
npm install
```

### 2. Create your config file

`src/constants/config.ts` is gitignored. Copy the example template and fill in your keys:

```bash
cp src/constants/config.example.ts src/constants/config.ts
```

Then edit `src/constants/config.ts` — see [Configuration](#configuration) below.

### 3. Check for type errors

```bash
npx tsc --noEmit
```

### 4. Deploy to TestFlight

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform ios --profile production
eas submit --platform ios --latest
```

Then App Store Connect → TestFlight → add yourself as internal tester → install via TestFlight app on your iPhone.

---

## Configuration

`src/constants/config.ts` is **gitignored**. Never commit real API keys.

Use `src/constants/config.example.ts` as the template (already committed).

```ts
// src/constants/config.ts

// PokeTrace API — https://poketrace.com/developers
// Sign up → subscribe to Pro plan ($19.99/mo) → Dashboard → copy API key
export const POKETRACE_API_BASE = 'https://api.poketrace.com/v1';
export const POKETRACE_API_KEY = 'YOUR_POKETRACE_API_KEY';

export const SCAN_INTERVAL_MS = 600;
export const DEDUP_WINDOW_MS = 8000;
export const MAX_SESSION_HISTORY = 20;

export const CONDITION_MULTIPLIERS: Record<string, number> = {
  NM: 1.0,
  LP: 0.8,
  MP: 0.64,
  HP: 0.4,
  DMG: 0.25,
};

export const CONDITIONS = ['NM', 'LP', 'MP', 'HP', 'DMG'] as const;

// eBay Browse API (optional) — demo mode used when empty
export const EBAY_APP_ID = '';
export const EBAY_API_BASE = 'https://api.ebay.com/buy/browse/v1';
export const EBAY_DEMO_MODE = true;
```

### API Keys Reference

| Key | Where to get it | Required |
|-----|----------------|----------|
| `POKETRACE_API_KEY` | [poketrace.com/developers](https://poketrace.com/developers) → Pro plan → Dashboard | Yes (live prices) |
| `EBAY_APP_ID` | [developer.ebay.com](https://developer.ebay.com) → My Apps → Production key | No (demo mode works without it) |

---

## Project Structure

```
card-valuer/
├── App.tsx                        # Root — intro animation + tab navigator
├── app.json                       # Expo config (bundle ID, permissions, plugins)
├── babel.config.js                # Metro / Reanimated / Worklets config
├── src/
│   ├── components/
│   │   ├── CardListItem.tsx       # Scanned card row (image, name, condition, price)
│   │   ├── ConditionPicker.tsx    # NM/LP/MP/HP/DMG selector chips
│   │   ├── GradedPricesPanel.tsx  # PSA/CGC/BGS grade price table
│   │   ├── IntroAnimation.tsx     # Retro diamond block intro
│   │   ├── PixelBorder.tsx        # Reusable Pokemon-palette pixel divider
│   │   ├── PriceTrendBadge.tsx    # 7-day price trend indicator
│   │   ├── ScannerOverlay.tsx     # Card scan zone UI overlay
│   │   └── SlabScannerOverlay.tsx # Slab barcode scan zone overlay
│   ├── constants/
│   │   ├── config.example.ts      # Committed key template
│   │   └── config.ts              # GITIGNORED — your live keys go here
│   ├── context/
│   │   └── ScannerContext.tsx     # Scanner state shared across tabs
│   ├── hooks/
│   │   └── useScanner.ts          # Camera snapshot → OCR → API → dedup logic
│   ├── screens/
│   │   ├── CollectionScreen.tsx   # Aggregate collection stats + set breakdown
│   │   ├── HistoryScreen.tsx      # Past scan sessions with expand/collapse
│   │   ├── ScannerScreen.tsx      # Camera + cards/slabs mode toggle
│   │   └── SessionScreen.tsx      # Current session card list + CSV export
│   ├── services/
│   │   ├── ebayService.ts         # eBay sold comps (demo or live)
│   │   ├── ocrService.ts          # ML Kit on-device text recognition
│   │   ├── pokemonTcgService.ts   # PokeTrace card search + lookup
│   │   ├── pricingService.ts      # Condition pricing + trend + graded helpers
│   │   └── slabService.ts         # Barcode parsing + graded slab lookup
│   ├── types/
│   │   └── index.ts               # All TypeScript interfaces
│   └── utils/
│       ├── csvExport.ts           # Session → CSV string
│       ├── dedupBuffer.ts         # Prevents duplicate scan entries
│       └── storage.ts             # AsyncStorage session persistence
```

---

## Scan Modes

### Cards
Points camera at a raw Pokemon card. On-device OCR extracts the card name and set number, then looks up live pricing from PokeTrace. Cards appear in the session list with per-condition prices and 7-day trend indicators.

### Slabs
Switches to barcode mode. Points camera at a PSA/CGC/BGS/SGC slab barcode. Grader and cert number are parsed, and graded market prices are fetched from PokeTrace.

---

## Roadmap

- **Scrydex API** — deeper graded price history and population reports (access request pending)
- **Live eBay comps** — real-time sold listings (OAuth flow built, credentials pending)
- **Binder scanning** — bulk grid scan mode for large collections
- **Price alerts** — push notification when a card crosses a threshold
- **Collection sharing** — export/share collection value summary
- **App Store public release** — targeting May 2026

---

## Gitignored Files

| Path | Reason |
|------|--------|
| `src/constants/config.ts` | Contains live API keys |
| `/ios/` | Generated by `npx expo prebuild` |
| `/android/` | Generated by `npx expo prebuild` |
| `*.p8`, `*.p12`, `*.mobileprovision` | Apple signing certificates |
| `GoogleService-Info.plist` | Firebase config (if added later) |
| `*.env`, `.env.*` | Environment variable files |

To regenerate native folders after cloning:
```bash
npx expo prebuild --platform ios --clean
```

---

## Tech Stack

| Library | Purpose |
|---------|---------|
| Expo SDK 54 | Build toolchain, managed workflow |
| React Native 0.81 | Core framework |
| react-native-vision-camera v4 | High-performance camera + barcode scanning |
| @react-native-ml-kit/text-recognition | On-device OCR (Apple Vision on iOS) |
| @react-navigation/bottom-tabs | Tab navigation |
| expo-image | Optimised card image rendering |
| react-native-reanimated | Intro animation + scan line |
| @react-native-async-storage/async-storage | Session persistence |
| expo-sharing + expo-file-system | CSV export + sharing |
