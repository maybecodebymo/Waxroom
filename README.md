# Waxroom 🎵

An interactive 3D music collection explorer. Browse albums as vinyl records orbiting in a three-dimensional globe, curate your personal collection, discover new music, explore the community feed, and share your room with friends — all in the browser.

## ✨ Features

- **3D Vinyl Globe** — Albums float as vinyl discs in a golden-angle spiral, powered by React Three Fiber
- **Drag & Explore** — Swipe to rotate the globe, click any disc to focus and spin
- **Full CRUD** — Add, edit, rate, and remove albums with track-by-track listings
- **Genre Filtering** — Dynamic filter bar with animated repositioning
- **Last.fm Sync** — Import your listening history with one click
- **Recommendations 🎲** — Smart discovery recommendations based on your collection's DNA
- **Community Feed** — Publish your room or browse/visit other rooms in the timeline
- **Zero Accounts** — Everything persists locally, no sign-up required

## 🛠 Tech Stack

| Layer | Tech |
|-------|------|
| 3D Engine | Three.js + React Three Fiber + Drei |
| UI | React 18 + Framer Motion + Tailwind CSS 4 |
| State | Zustand with localStorage persistence |
| Gestures | @use-gesture/react |
| APIs | iTunes Search API, Last.fm API |
| Build | Vite 6 |
| Deploy | GitHub Pages via GitHub Actions |

## 🚀 Getting Started

```bash
# Clone
git clone <your-repo-url>
cd waxroom

# Install
npm install

# Add your Last.fm API key
echo "VITE_LASTFM_API_KEY=your_key_here" > .env

# Dev server
npm run dev

# Production build
npm run build
npm run preview
```

## 🌐 Deployment

This project auto-deploys to GitHub Pages via the included GitHub Actions workflow.

**Setup:**
1. Go to your repo → Settings → Pages → Source → **GitHub Actions**
2. Go to Settings → Secrets → Actions → add `VITE_LASTFM_API_KEY`
3. Push to `main` — the workflow builds and deploys automatically

## 📁 Project Structure

```
src/
├── App.jsx                          # Root layout + URL sharing logic
├── main.jsx                         # React entry point
├── index.css                        # Global styles + Tailwind + glass utility
├── data/mockAlbums.js               # Default album collection
├── store/useGalleryStore.js         # Zustand state management
├── utils/lastFmService.js           # Last.fm API integration
└── components/
    ├── scene/
    │   ├── GalleryCanvas.jsx        # R3F Canvas + globe layout engine
    │   └── AlbumDisc.jsx            # Individual vinyl disc with GPU shader
    └── overlays/
        ├── AlbumDetailOverlay.jsx   # Album info + tracklist panel
        ├── AddAlbumModal.jsx        # CRUD modal for albums
        ├── FilterBar.jsx            # Genre filter bar
        ├── SceneControlsOverlay.jsx # Scene tuning + Last.fm + sharing
        └── RecommendationsOverlay.jsx # Discovery engine
```
