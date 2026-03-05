# Vinodex - Wine Encyclopedia

A retro-styled wine encyclopedia Progressive Web App (PWA) built with React, TypeScript, and Tailwind CSS v4.

![Vinodex](public/icon.svg)

## Features

- 🍇 **Grape Varieties** - Explore 35+ grape varieties with detailed tasting profiles
- 🗺️ **Wine Regions** - Discover 36+ wine regions worldwide with interactive map
- 🍷 **Wine Styles** - Learn about different wine styles (sparkling, fortified, natural, etc.)
- 🔍 **Master Search** - Search across all entries in the database
- 📱 **PWA Support** - Install as a native app on any device
- 🎮 **Retro Design** - Nostalgic Pokédex-inspired interface

## Tech Stack

- **React 19** - UI Framework
- **TypeScript** - Type Safety
- **Vite** - Build Tool
- **Tailwind CSS v4** - Styling
- **Lucide React** - Icons
- **Vite PWA Plugin** - Progressive Web App support

## Getting Started

### Prerequisites

- Node.js 20+ (repo includes a portable Node 20.18.0 under `node-v20.18.0-darwin-x64/`; `.nvmrc` pins 20.18.0)
- npm

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd vinodex

# (Option A) Use your system Node 20+
npm install
npm run dev

# (Option B) Use the bundled portable Node 20.18.0
PATH="./node-v20.18.0-darwin-x64/bin:$PATH" ./node-v20.18.0-darwin-x64/bin/npm install
PATH="./node-v20.18.0-darwin-x64/bin:$PATH" ./node-v20.18.0-darwin-x64/bin/npm run dev
```

The app will be available at `http://localhost:3000`

### Build for Production

```bash
# System Node 20+
npm run build

# or using the bundled Node
PATH="./node-v20.18.0-darwin-x64/bin:$PATH" ./node-v20.18.0-darwin-x64/bin/npm run build
```

The production build will be in the `dist` folder.

### Preview Production Build

```bash
npm run preview
```

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Netlify

1. Connect your repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`

### Static Hosting

The `dist` folder can be deployed to any static hosting service:

- GitHub Pages
- AWS S3 + CloudFront
- Firebase Hosting
- Cloudflare Pages

## Project Structure

```
vinodex/
├── components/          # React components
│   ├── DeviceLayout.tsx    # Main device frame
│   ├── MainMenu.tsx        # Home screen menu
│   ├── FoodPairingsScreen.tsx  # List view
│   ├── PairingDetail.tsx   # Detail view
│   ├── PairingTile.tsx     # List item component
│   └── RegionMapScreen.tsx # Interactive map
├── public/              # Static assets
│   └── icon.svg           # App icon
├── App.tsx             # Main app component
├── constants.ts        # Wine data
├── types.ts           # TypeScript types
├── index.tsx          # Entry point
├── index.css          # Tailwind styles
├── vite.config.ts     # Vite configuration
├── postcss.config.js  # PostCSS configuration
└── package.json       # Dependencies
```

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
