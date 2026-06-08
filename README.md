# Waxroom 🎵

An interactive 3D music collection explorer. Browse albums as vinyl records orbiting in a three-dimensional globe, curate your personal collection, discover new music, explore the community feed, and share your room with friends — all in the browser.

## ✨ Features

- **3D Vinyl Globe** — Browse your albums as rotating vinyl discs in a golden-angle spiral, powered by React Three Fiber.
- **Drag & Explore** — Drag to rotate the globe in 3D space, zoom in/out with your wheel/trackpad, or click any disc to focus, spin, and read its details.
- **Full CRUD** — Build your room by adding records manually or searching the iTunes database, edit details, set ratings, and manage custom tracklists.
- **Onboarding Journey** — A sleek, interactive welcome experience helping you customize your custom room identity and drop your first record.
- **Genre Filtering** — Instantly filter your room by genre using the filter bar, causing the sphere to collapse and animate only matching vinyls.
- **Last.fm Sync** — Sychronize your top albums directly from your Last.fm profile with a single click.
- **Recommendations 🎲** — Smart discovery recommendation engine recommending music tailored specifically to your vault's genres and artists.
- **Community Feed** — Publish your custom room to the community timeline, or browse, visit, and explore other users' 3D rooms.
- **Zero Accounts** — Everything persists locally in your browser, no sign-up or accounts required.

## 🛠 Tech Stack

| Layer | Tech |
|-------|------|
| **3D Engine** | Three.js + React Three Fiber + Drei |
| **UI** | React 18 + Framer Motion + Tailwind CSS 4 |
| **State** | Zustand with localStorage persistence |
| **Gestures** | @use-gesture/react |
| **APIs** | iTunes Search API, Last.fm API |
| **Build** | Vite 6 |
| **Deploy** | GitHub Pages via GitHub Actions |

## 🚀 Getting Started

```bash
# Clone
git clone https://github.com/maybecodebymo/Waxroom.git
cd Waxroom

# Install
npm install

# Add your Last.fm API key
echo "VITE_LASTFM_API_KEY=your_key_here" > .env

# Add your Spotify client ID
echo "VITE_SPOTIFY_CLIENT_ID=282d90dc2bce49789047a2afe3411004" >> .env

# Dev server
npm run dev

# Production build
npm run build
npm run preview
```

## 🌐 Deployment

This project auto-deploys to GitHub Pages via the included GitHub Actions workflow.

**Setup:**
1. Go to your repo → **Settings** → **Pages** → **Build and deployment** → Set Source to **GitHub Actions**.
2. Go to **Settings** → **Secrets and variables** → **Actions** → add `VITE_LASTFM_API_KEY` and `VITE_SPOTIFY_CLIENT_ID` under repository secrets.
3. Push your commits to `master` (or `main`) — the workflow builds and deploys the app automatically.

## 📁 Project Structure

```
src/
├── App.jsx                          # Root layout + URL sharing logic
├── main.jsx                         # React entry point
├── index.css                        # Global styles + Tailwind config
├── store/useGalleryStore.js         # Zustand state management & persistence
├── utils/lastFmService.js           # Last.fm API integration
└── components/
    ├── scene/
    │   ├── GalleryCanvas.jsx        # R3F Canvas + globe layout engine
    │   ├── AlbumDisc.jsx            # Individual vinyl disc with custom shaders
    │   └── PlayArm.jsx              # 3D turntable play-arm
    └── overlays/
        ├── AlbumDetailOverlay.jsx   # Album info + tracklist panel
        ├── AddAlbumModal.jsx        # CRUD modal for adding/editing albums
        ├── FilterBar.jsx            # Genre filter bar
        ├── SceneControlsOverlay.jsx # Scene tuning + Last.fm + sharing
        ├── RecommendationsOverlay.jsx # Discovery engine
        ├── TimelineFeed.jsx         # Community timeline feed drawer
        ├── OnboardingModal.jsx      # Room naming welcome popup
        └── TutorialTour.jsx         # Step-by-step interactive tutorial
```
