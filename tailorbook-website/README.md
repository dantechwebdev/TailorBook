# TailorBook Website

Official website for TailorBook — *The Operating System for Modern Tailoring Businesses.*

## Getting Started

```bash
# Install dependencies
npm install

# Start development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `VITE_APK_DOWNLOAD_URL` | URL to the Android APK download |
| `VITE_FOUNDING_MEMBER_URL` | URL to the Founding Member sign-up form |
| `VITE_CONTACT_EMAIL` | Contact email shown in the footer |

## Deployment

This project builds to a standard static site (`dist/` folder) and can be deployed on:

- **Vercel**: `vercel deploy`
- **Netlify**: drag & drop `dist/` or connect GitHub
- **Cloudflare Pages**: connect GitHub repo, build command `npm run build`, output `dist`
- **GitHub Pages**: push `dist/` to `gh-pages` branch
- **Firebase**: `firebase deploy`
- **Any static host**: upload the contents of `dist/`

## Project Structure

```
tailorbook-website/
├── public/              # Static assets (favicon, manifest, robots)
├── src/
│   ├── assets/          # Images, illustrations, logos
│   ├── components/
│   │   ├── layout/      # Navbar, Footer
│   │   ├── mockups/     # Phone/UI mockup components
│   │   ├── sections/    # Page sections (Hero, Features, etc.)
│   │   └── ui/          # Reusable UI components
│   ├── hooks/           # Custom React hooks
│   ├── styles/          # Global CSS & design tokens
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Tech Stack

- **React 18** — UI framework
- **TypeScript** — Type safety
- **Vite** — Build tool & dev server
- **Lucide React** — Icons

## License

© 2025 TailorBook. All rights reserved.
