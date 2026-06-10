# Waxroom 🎵

An interactive 3D music collection explorer. Browse albums as vinyl records orbiting in a three-dimensional globe, curate your personal collection, auto-collect your listening activity, explore the community feed, and sync across devices — all in your browser.

## ✨ Features

- **3D Vinyl Globe** — Browse your albums as rotating vinyl discs in a golden-angle spiral, powered by React Three Fiber.
- **Drag, Warp & Explore** — Drag to rotate, pinch or vertical-scroll to warp the sphere's depth, spread, and size. Click any disc to focus, spin, and read its details.
- **Warp Control** — Fine-tune the sphere's radius, depth, and scale with a single slider in the Tune panel.
- **Full CRUD** — Build your room by adding records manually or searching the iTunes database, edit details, set ratings, and manage custom tracklists.
- **Genre Filtering** — Instantly filter your room by genre using the filter bar, causing the sphere to collapse and animate only matching vinyls.
- **Last.fm Sync** — Connect your Last.fm profile to auto-populate your room with your top albums, or sync your currently playing track.
- **Live Listening** — Real-time polling of your Last.fm scrobbles. New tracks are added to your Crate Inbox automatically.
- **Crate Inbox** — Albums captured while listening land in your crate. Review, add to your room, or discard — all without leaving the globe.
- **Listening History** — A rolling log of your last 10 played tracks. Tap any entry to navigate to the album.
- **Now Playing** — A floating panel showing the current track with spinning vinyl art, preview playback, and one-tap add-to-room.
- **Multi-Room Support** — Create, name, and switch between multiple rooms. Each room keeps its own collection and publish state.
- **Community Feed** — Publish your room to the community timeline, or browse, visit, and explore other users' 3D rooms with live playback sync.
- **Google & Email Auth** — Sign in with Google or a passwordless email link to sync your rooms and crate across devices via cloud backup.
- **Anonymous Guest Mode** — Start collecting immediately with no sign-up. Link a profile later to preserve your collection.
- **PWA** — Installable on any device. Works offline with a cached service worker and a standalone app manifest.
- **Interactive Tutorial** — A step-by-step onboarding tour that introduces the globe, filters, crater, feed, and tune settings.

## 🛠 Tech Stack

| Layer | Tech |
|-------|------|
| **3D Engine** | Three.js + React Three Fiber + Drei |
| **UI** | React 18 + Framer Motion + Tailwind CSS 4 |
| **State** | Zustand with localStorage persistence |
| **Gestures** | @use-gesture/react |
| **Backend** | Firebase Auth + Firestore + Storage |
| **APIs** | iTunes Search API, Last.fm API |
| **PWA** | vite-plugin-pwa (Workbox) |
| **Build** | Vite 6 |

## 🚀 Getting Started

```bash
# Clone
git clone https://github.com/maybecodebymo/Waxroom.git
cd Waxroom

# Install
npm install

# Create your .env file with the required keys:
echo "VITE_LASTFM_API_KEY=your_key_here" >> .env

# Firebase (optional — skip for local-only usage without sync):
echo "VITE_FIREBASE_API_KEY=..." >> .env
echo "VITE_FIREBASE_AUTH_DOMAIN=..." >> .env
echo "VITE_FIREBASE_PROJECT_ID=..." >> .env
echo "VITE_FIREBASE_STORAGE_BUCKET=..." >> .env
echo "VITE_FIREBASE_MESSAGING_SENDER_ID=..." >> .env
echo "VITE_FIREBASE_APP_ID=..." >> .env

# Dev server
npm run dev

# Production build
npm run build
npm run preview
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_LASTFM_API_KEY` | Yes | Last.fm API key for scrobbling sync and top-album import |
| `VITE_FIREBASE_API_KEY` | No* | Firebase API key (needed for auth & cloud sync) |
| `VITE_FIREBASE_AUTH_DOMAIN` | No* | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | No* | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | No* | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | No* | Firebase sender ID |
| `VITE_FIREBASE_APP_ID` | No* | Firebase app ID |

*\*Firebase env vars are optional. Without them the app runs fully locally (no cloud sync, no auth).*

## 🌐 Deployment

This project auto-deploys to GitHub Pages via the included GitHub Actions workflow.

**Setup:**
1. Go to your repo → **Settings** → **Pages** → **Build and deployment** → Set Source to **GitHub Actions**.
2. Go to **Settings** → **Secrets and variables** → **Actions** → add all required env vars as repository secrets.
3. Push to `master` — the workflow builds the app and deploys `dist/` to Pages.

## 📁 Project Structure

```
src/
├── App.jsx                          # Root layout + URL sharing + dialog listener
├── main.jsx                         # React entry point + PWA registration
├── index.css                        # Global styles + Tailwind
├── store/useGalleryStore.js         # Zustand state management & localStorage persistence
├── utils/
│   ├── firebase.js                  # Firebase init (conditional)
│   ├── lastFmService.js             # Last.fm API integration
│   ├── dialogService.js             # Custom event-driven dialogs
│   └── colorUtils.js                # Color extraction helpers
└── components/
    ├── scene/
    │   ├── GalleryCanvas.jsx        # R3F Canvas + globe layout engine + gestures
    │   ├── AlbumDisc.jsx            # Individual vinyl disc with masked shader
    │   ├── PlayArm.jsx              # 3D turntable play-arm
    │   └── LiveListeningManager.jsx # Polls Last.fm, populates crate + history
    └── overlays/
        ├── AlbumDetailOverlay.jsx   # Album info + tracklist panel
        ├── AddAlbumModal.jsx        # CRUD modal for adding/editing albums
        ├── FilterBar.jsx            # Genre filter bar + search
        ├── SceneControlsOverlay.jsx # Tune menu: warp, profile, rooms, Last.fm, live toggle
        ├── CrateHistoryPanel.jsx    # Crate inbox + listening history drawer
        ├── NowPlayingPanel.jsx      # Current track display + preview + add-to-room
        ├── RecommendationsOverlay.jsx # Discovery engine
        ├── TimelineFeed.jsx         # Community timeline feed drawer
        ├── OnboardingModal.jsx      # Room naming welcome popup
        ├── TutorialTour.jsx         # Step-by-step interactive tutorial
        ├── AuthModal.jsx            # Google & email sign-in
        ├── ConfirmDialog.jsx        # Reusable confirmation dialog
        └── PromptDialog.jsx         # Reusable prompt dialog
```
