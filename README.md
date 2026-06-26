# TailorBook 🪡

> A digital customer record book and job tracking assistant for tailors and fashion designers.

---

## What is TailorBook?

TailorBook solves a real problem for independent tailors across Nigeria and Africa: managing customer records, measurements, and job delivery dates from a physical notebook. The app works like a **second brain** — offline-first, fast to use, and designed for working tailors who need to track dozens of active jobs at once.

---

## Screenshots

The UI is modeled after the design reference image, featuring:
- Home screen with due-today jobs, pending/overdue counts, and recent jobs
- Dark drawer navigation (deep indigo-purple)
- Warm, practical card-based layouts
- Status pipeline (Pending → Cutting → Sewing → Finishing → Ready → Delivered)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native (Expo SDK 51) |
| Language | TypeScript |
| State | Zustand |
| Database | expo-sqlite (SQLite, offline-first) |
| Notifications | expo-notifications (local push) |
| Navigation | React Navigation (Drawer + Stack) |
| Images | expo-image-picker |
| Date Utils | date-fns |

---

## Project Structure

```
TailorBook/
├── App.tsx                        # Root entry + splash screen
├── app.json                       # Expo config
├── src/
│   ├── components/
│   │   └── common/
│   │       ├── DrawerContent.tsx  # Sidebar navigation
│   │       ├── Icons.tsx          # SVG icon library
│   │       └── UI.tsx             # Reusable components
│   ├── constants/
│   │   └── theme.ts               # Colors, typography, spacing tokens
│   ├── context/
│   │   └── store.ts               # Zustand global store
│   ├── navigation/
│   │   └── AppNavigator.tsx       # Drawer + Stack setup
│   ├── screens/
│   │   ├── home/
│   │   │   └── HomeScreen.tsx     # Main dashboard
│   │   ├── customers/
│   │   │   ├── CustomerListScreen.tsx
│   │   │   ├── CustomerDetailScreen.tsx
│   │   │   └── CustomerCreateScreen.tsx
│   │   ├── jobs/
│   │   │   ├── JobListScreen.tsx
│   │   │   ├── JobDetailScreen.tsx
│   │   │   └── JobCreateScreen.tsx
│   │   ├── measurements/
│   │   │   └── MeasurementFormScreen.tsx
│   │   ├── notifications/
│   │   │   └── NotificationsScreen.tsx
│   │   └── settings/
│   │       └── AccountScreen.tsx
│   ├── types/
│   │   └── index.ts               # TypeScript interfaces
│   └── utils/
│       ├── database.ts            # SQLite operations
│       ├── helpers.ts             # Formatting, IDs, validation
│       └── notifications.ts      # Expo Notifications service
└── README.md
```

---

## Setup Instructions

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo Go app on your Android device (or Android emulator)

### 1. Install Dependencies

```bash
cd TailorBook
npm install
```

### 2. Install Expo CLI (if needed)

```bash
npm install -g expo-cli
```

### 3. Start the Development Server

```bash
npx expo start
```

### 4. Run on Device

- **Android physical device:** Scan the QR code with Expo Go
- **Android emulator:** Press `a` in the terminal
- **iOS simulator:** Press `i` in the terminal

---

## Building for Production

### Android APK (for direct install)

```bash
npx expo build:android --type apk
```

### Using EAS Build (recommended)

```bash
npm install -g eas-cli
eas build --platform android --profile preview
```

---

## Features

### ✅ Home Dashboard
- Greeting with time of day
- Quick action cards: Register Customer / Create Job
- Due Today list with customer avatars and job status
- Pending Jobs count
- Overdue Jobs alert (red)
- Recent Jobs horizontal scroll with photo/emoji thumbnails

### ✅ Customer Management
- Register with name + phone (minimal typing)
- Optional notes field
- Initials avatar with consistent color mapping
- Customer profile: job history, measurements, stats
- One-tap call to customer
- Search by name or phone number

### ✅ Job Tracking
- Quick outfit type chips (Agbada, Senator, Suit, Shirt, Trouser, Gown, etc.)
- Delivery date presets (Tomorrow, 3 Days, 1 Week, 2 Weeks)
- Status pipeline: Pending → Cutting → Sewing → Finishing → Ready → Delivered
- One-tap status advancement
- Financial tracking (price, deposit, balance auto-calculated)
- Sample photo via camera or gallery
- Search and filter by status

### ✅ Measurements
- Templates: Men's Senator, Agbada, Suit, Women's Gown, Shirt, Trouser
- Reusable — copy from previous measurements with one tap
- Linked to jobs

### ✅ Notifications
- Local push notifications (no internet required)
- Schedules at 7 days, 3 days, 1 day before delivery date
- Due today reminder at 8:00 AM
- In-app notification center with tabs (All / Jobs / System)
- Unread badge on notification bell

### ✅ Design
- Offline-first (SQLite)
- Dark sidebar (deep indigo-purple)
- Light main screens (warm off-white)
- Status colors: Red = Overdue, Yellow = Due Soon, Green = Ready, Gray = Delivered
- Large touch targets throughout
- Works on low-end Android devices

---

## Roadmap (Post-MVP)

- [ ] Cloud sync (Supabase or Firebase)
- [ ] WhatsApp reminders for customers
- [ ] Invoice generation (PDF)
- [ ] Multi-user (shop staff)
- [ ] Revenue reports
- [ ] Customer birthday tracking
- [ ] SMS OTP login

---

## Design Philosophy

> "Customer Book + Reminder System" — not "Business Intelligence Platform"

The home screen is **action-oriented**: open the app, see what's due, tap to work. No charts on launch. No KPI widgets. No friction.

The UI uses:
- Card-based layouts
- Rounded corners throughout
- Avatar initials with deterministic color mapping
- Status badges as visual indicators, not just text
- Modal bottom sheets for selections (no deep navigation)

---

## License

MIT — build freely, modify freely, give credit.

---

Made with ❤️ for African tailors.
