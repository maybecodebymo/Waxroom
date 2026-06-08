import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { decompressFromEncodedURIComponent } from 'lz-string';
import GalleryCanvas from './components/scene/GalleryCanvas';
import AlbumDetailOverlay from './components/overlays/AlbumDetailOverlay';
import FilterBar from './components/overlays/FilterBar';
import AddAlbumModal from './components/overlays/AddAlbumModal';
import SceneControlsOverlay from './components/overlays/SceneControlsOverlay';
import RecommendationsOverlay from './components/overlays/RecommendationsOverlay';
import OnboardingModal from './components/overlays/OnboardingModal';
import TutorialTour from './components/overlays/TutorialTour';
import TimelineFeed from './components/overlays/TimelineFeed';
import LiveListeningManager from './components/scene/LiveListeningManager';
import NowPlayingPanel from './components/overlays/NowPlayingPanel';
import { useGalleryStore } from './store/useGalleryStore';

const fadeIn = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.2, 0.85, 0.25, 1] } },
};

const formatRoomName = (name) => {
  if (!name) return "";
  const lower = name.toLowerCase();
  if (lower.endsWith("'s room")) return name;
  if (lower.endsWith(' room')) {
    const base = name.substring(0, name.length - 5).trim();
    return base.endsWith("'s") ? `${base} Room` : `${base}'s Room`;
  }
  if (name.endsWith("'s")) return `${name} Room`;
  if (name.endsWith("'")) return `${name}s Room`;
  return `${name}'s Room`;
};

function App() {
  const isAddModalOpen = useGalleryStore((state) => state.isAddModalOpen);
  const canEditAlbums = useGalleryStore((state) => state.canEditAlbums);
  const setAddModalOpen = useGalleryStore((state) => state.setAddModalOpen);
  const vaultName = useGalleryStore((state) => state.vaultName);
  const hasCompletedTour = useGalleryStore((state) => state.hasCompletedTour);
  const setCompletedTour = useGalleryStore((state) => state.setCompletedTour);
  const selectedAlbumId = useGalleryStore((state) => state.selectedAlbumId);
  
  const sharedOwnerName = useGalleryStore((state) => state.sharedOwnerName);
  const isViewingShared = useGalleryStore((state) => state.isViewingShared);
  const loadSharedRoom = useGalleryStore((state) => state.loadSharedRoom);
  const closeSharedRoom = useGalleryStore((state) => state.closeSharedRoom);
  const isFeedOpen = useGalleryStore((state) => state.isFeedOpen);
  const setFeedOpen = useGalleryStore((state) => state.setFeedOpen);
  const isRecommendationsOpen = useGalleryStore((state) => state.isRecommendationsOpen);
  const setRecommendationsOpen = useGalleryStore((state) => state.setRecommendationsOpen);
  const fetchRoomFromDb = useGalleryStore((state) => state.fetchRoomFromDb);
  const initializeAuth = useGalleryStore((state) => state.initializeAuth);
  const subscribeToActiveRoomPlayback = useGalleryStore((state) => state.subscribeToActiveRoomPlayback);

  // Auto-close Feed & Recommendations when active modals/views open
  useEffect(() => {
    const hasActiveModal = isViewingShared || isAddModalOpen || selectedAlbumId || !vaultName;
    if (hasActiveModal) {
      if (isFeedOpen) setFeedOpen(false);
      if (isRecommendationsOpen) setRecommendationsOpen(false);
    }
  }, [isViewingShared, isAddModalOpen, selectedAlbumId, vaultName, isFeedOpen, isRecommendationsOpen, setFeedOpen, setRecommendationsOpen]);

  // Handle mutual exclusion between Feed drawer and Recommendations overlay
  useEffect(() => {
    if (isFeedOpen && isRecommendationsOpen) {
      setRecommendationsOpen(false);
    }
  }, [isFeedOpen, isRecommendationsOpen, setRecommendationsOpen]);

  // Initialize user authentication on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Catch Spotify OAuth hash redirect token
  useEffect(() => {
    if (window.location.hash) {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const expiresIn = params.get('expires_in');
      if (accessToken) {
        const expiresMs = expiresIn ? parseInt(expiresIn) * 1000 : 3600 * 1000;
        useGalleryStore.getState().setSpotifyToken(accessToken, expiresMs);
        // Clean URL hash without reloading
        window.history.replaceState(null, null, window.location.pathname + window.location.search);
      }
    }
  }, []);

  // Subscribe to live room playback if visiting another user's live room
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get('room');
    if (roomId && isViewingShared) {
      const unsubscribe = subscribeToActiveRoomPlayback(roomId);
      return () => unsubscribe();
    }
  }, [isViewingShared, subscribeToActiveRoomPlayback]);

  useEffect(() => {
    if (!canEditAlbums && isAddModalOpen) {
      setAddModalOpen(false);
    }
  }, [canEditAlbums, isAddModalOpen, setAddModalOpen]);

  // Dynamic SEO and Title Updates
  useEffect(() => {
    let title = "waxroom";
    let description = "Build, explore, and share your music collection in an interactive 3D vinyl globe. Sync from Last.fm, discover new albums, and share your room with friends.";
    
    if (isViewingShared && sharedOwnerName) {
      title = formatRoomName(sharedOwnerName);
      description = `Explore ${title}'s curated 3D vinyl record vault on Waxroom. Sync, play, and discover music.`;
    } else if (vaultName) {
      title = formatRoomName(vaultName);
      description = `Explore ${title}'s curated 3D vinyl record vault on Waxroom. Sync, play, and discover music.`;
    }

    document.title = title;
    
    // Update Meta Description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) metaDescription.setAttribute('content', description);
    
    // Update OG Meta Tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', title);
    
    // Update OG Description
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) ogDescription.setAttribute('content', description);
    
    // Update Twitter Meta Tags
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) twitterTitle.setAttribute('content', title);
    
    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (twitterDescription) twitterDescription.setAttribute('content', description);
  }, [isViewingShared, sharedOwnerName, vaultName]);

  // Dismiss the HTML loading screen once React is mounted
  useEffect(() => {
    const loader = document.getElementById('loader');
    if (loader) {
      // Small delay lets the Canvas initialize before we remove the loader
      const timer = setTimeout(() => {
        loader.classList.add('fade-out');
        setTimeout(() => loader.remove(), 600);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  // Detect shared room URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const compressed = params.get('v');
    const owner = params.get('by');
    const roomId = params.get('room');
    const shareId = params.get('s');

    if (compressed) {
      try {
        const json = decompressFromEncodedURIComponent(compressed);
        const albums = JSON.parse(json);
        if (Array.isArray(albums) && albums.length > 0) {
          const name = owner ? decodeURIComponent(owner) : 'Anonymous';
          loadSharedRoom(name, albums);
        }
      } catch (err) {
        console.error('Failed to load shared room:', err);
      }
      // Clean the URL bar without reloading
      window.history.replaceState({}, '', window.location.pathname);
    } else if (roomId) {
      fetchRoomFromDb('live', roomId).then(() => {
        window.history.replaceState({}, '', window.location.pathname);
      });
    } else if (shareId) {
      fetchRoomFromDb('shared', shareId).then(() => {
        window.history.replaceState({}, '', window.location.pathname);
      });
    }
  }, [loadSharedRoom, fetchRoomFromDb]);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#f5f5f3] text-zinc-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(0,0,0,0.02),transparent_42%),radial-gradient(circle_at_86%_78%,rgba(0,0,0,0.02),transparent_48%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(rgba(20,20,20,0.05)_0.9px,transparent_0.9px)] [background-size:22px_22px]" />

      <GalleryCanvas />

      {/* Top Middle Brand Logo */}
      <div className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 z-20 md:top-8 hidden md:flex justify-center">
        <img
          src="/Waxroom main logo.svg"
          className="h-18 md:h-24 w-auto opacity-70 select-none"
          alt="Waxroom"
          draggable="false"
        />
      </div>

      <motion.header
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="pointer-events-none absolute left-4 top-4 z-20 md:left-10 md:top-10 flex items-center gap-2"
      >
        <img
          src="/Waxroom main logo.svg"
          className="h-8 w-auto md:hidden opacity-90 select-none pointer-events-none shrink-0"
          alt="Waxroom"
          draggable="false"
        />
        <div className="flex flex-col">
          <p className="font-display text-sm sm:text-base md:text-3xl tracking-wider text-zinc-950 uppercase font-extrabold leading-none">
            {isViewingShared
              ? formatRoomName(sharedOwnerName)
              : formatRoomName(vaultName)}
          </p>
          {isViewingShared && (
            <button
              onClick={closeSharedRoom}
              className="pointer-events-auto mt-1 text-[10px] md:text-xs font-display font-bold uppercase tracking-wider text-zinc-500 underline decoration-2 decoration-zinc-950 underline-offset-4 hover:text-zinc-950 transition cursor-pointer text-left"
            >
              Back to My Room
            </button>
          )}
        </div>
      </motion.header>

      <LiveListeningManager />
      <AlbumDetailOverlay />
      <SceneControlsOverlay />
      <RecommendationsOverlay />
      <FilterBar />
      <NowPlayingPanel />


      <AnimatePresence>
        {canEditAlbums && isAddModalOpen && <AddAlbumModal />}
      </AnimatePresence>
      <AnimatePresence>
        {!vaultName && !isViewingShared && <OnboardingModal />}
      </AnimatePresence>
      <AnimatePresence>
        {vaultName && !hasCompletedTour && !isViewingShared && <TutorialTour />}
      </AnimatePresence>
      <AnimatePresence>
        {isFeedOpen && <TimelineFeed />}
      </AnimatePresence>
    </main>
  );
}

export default App;
