---
name: Web notifications module resolution
description: How webpack resolves the notifications module on web and where to add web stubs
---

Webpack resolves `from './src/utils/notifications'` (as imported in App.tsx) to the flat file `src/utils/notifications.web.ts` — NOT `src/utils/notifications/index.web.ts`. This is because `.web.ts` extension is checked against the path as a file before treating it as a directory.

**Why:** Webpack's `resolve.extensions` tries each extension against the import path directly before falling back to directory/index resolution. Since `notifications.web.ts` exists at the flat level, it wins.

**How to apply:** When adding new exports that App.tsx (or any root-level file) imports from `./src/utils/notifications`, add them to `src/utils/notifications.web.ts` (not just `index.web.ts`). The subdirectory `index.web.ts` is only reached by imports that already include the directory path explicitly (e.g. from within `src/`).
