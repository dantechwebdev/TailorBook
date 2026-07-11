# TailorBook

A digital customer record book and job tracking assistant for tailors and fashion designers. Offline-first, designed for Nigerian/African tailors to manage customers, measurements, garment jobs, and delivery dates.

## Stack

- **Framework**: React Native + Expo SDK 51 (runs as a web app on Replit via `expo export:web`)
- **Language**: TypeScript
- **State**: Zustand
- **Database**: expo-sqlite (SQLite, offline-first)
- **Navigation**: React Navigation (Drawer + Stack)
- **Notifications**: expo-notifications (local push)

## How to run

The workflow `Start application` builds and serves the web app:
1. `npm run build:web` — compiles with `expo export:web` → outputs to `web-build/`
2. `npm run serve:web` — serves `web-build/` on port 5000 with `serve`

After any code change, **rebuild**: run `npm run build:web` and restart the workflow.

## Project structure

```
App.tsx                  # Root entry + splash/onboarding gate
src/
  components/common/     # DrawerContent, Icons, UI primitives
  constants/theme.ts     # Colors, typography, spacing tokens
  context/store.ts       # Zustand global store + SQLite DB layer
  navigation/            # AppNavigator (Drawer + Stack)
  screens/               # home, customers, jobs, measurements, notifications, settings, orders
assets/icons/custom/     # Custom SVG clothing icons (Kaftan, Senator, etc.)
```

## User preferences

_None recorded yet._
