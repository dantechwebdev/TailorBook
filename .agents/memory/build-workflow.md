---
name: Build workflow
description: How to build and deploy the TailorBook web app after code changes
---

After any source code change, must run two commands:
1. `npx expo export:web` — compiles React Native → web-build/
2. Restart "Start application" workflow — serves the new build on port 5000

**Why:** The workflow serves static files from web-build/. Without re-exporting, old JS bundles are served.

**How to apply:** Any time you edit a .tsx/.ts file, always rebuild before verifying in the preview.

The build produces warnings about `Animated.Code` from react-navigation internals — these are non-fatal and expected.
`.npmrc` has `legacy-peer-deps=true` which is required for the build.
