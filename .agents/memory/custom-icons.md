---
name: Custom clothing icons
description: Where the custom SVG clothing icons live and how they are imported/used across the app.
---

# Custom Clothing Icons

## Rule
Import custom clothing icons as named exports from `assets/icons/custom` (resolves to `assets/icons/custom/index.tsx`).

```ts
import { KaftanIcon, SenatorIcon } from '../../../../assets/icons/custom';
```

Adjust `../` depth based on file location:
- `src/screens/<screen>/` → `../../../assets/icons/custom`
- `src/screens/<folder>/<screen>/` → `../../../../assets/icons/custom`

**Why:** Icons are React Native SVG components (react-native-svg), not plain SVGs, so they must live in a `.tsx` file. Originally the zip provided `index.ts` (wrong extension) which caused a webpack JSX parse error — renamed to `index.tsx` to fix.

## Available icons
Senator, Suit, Gown, Kaftan, Shirt, Trouser, Blouse, Skirt

## No custom icon (fallback)
Agbada → emoji `🥻` / Ionicons `shirt-outline`
Other → emoji `✂️` / Ionicons `cut-outline`

## How to apply
When adding a new screen that shows garment type icons, use the `Icon` union pattern:
```ts
type Item = { type: OutfitType } & (
  | { Icon: React.FC<IconProps> }
  | { ionicon: string }
);
```
Render with `'Icon' in item ? <item.Icon ... /> : <Ionicons name={item.ionicon} ... />`.

## Where used
- `src/screens/jobs/NewOrderFlow/StepGarment.tsx` — garment selection grid
- `src/screens/onboarding/OnboardingFlow.tsx` — apparel chip grid (step 2)
- `src/screens/home/HomeScreen.tsx` — RecentJobCard fallback when no photo
