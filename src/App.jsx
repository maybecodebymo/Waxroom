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
import { useGalleryStore } from './store/useGalleryStore';

const fadeIn = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.2, 0.85, 0.25, 1] } },
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

  useEffect(() => {
    if (!canEditAlbums && isAddModalOpen) {
      setAddModalOpen(false);
    }
  }, [canEditAlbums, isAddModalOpen, setAddModalOpen]);

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
    }
  }, [loadSharedRoom]);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#fafaf9] text-zinc-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(0,0,0,0.02),transparent_42%),radial-gradient(circle_at_86%_78%,rgba(0,0,0,0.02),transparent_48%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(rgba(20,20,20,0.05)_0.9px,transparent_0.9px)] [background-size:22px_22px]" />

      <GalleryCanvas />

      <motion.header
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="pointer-events-none absolute left-4 top-4 z-20 md:left-10 md:top-10"
      >
        <p className="font-display text-xs sm:text-sm md:text-2xl tracking-wide text-zinc-950 uppercase">
          {isViewingShared
            ? (sharedOwnerName.endsWith('Room') ? sharedOwnerName : `${sharedOwnerName}'s Room`)
            : (vaultName ? `${vaultName} Room` : "Mo's Room")}
        </p>
        {isViewingShared && (
          <button
            onClick={closeSharedRoom}
            className="pointer-events-auto mt-1 text-[10px] md:text-xs font-display font-bold uppercase tracking-wider text-zinc-500 underline decoration-2 decoration-zinc-950 underline-offset-4 hover:text-zinc-950 transition cursor-pointer"
          >
            Back to My Room
          </button>
        )}
      </motion.header>

      <AlbumDetailOverlay />
      <SceneControlsOverlay />
      <RecommendationsOverlay />
      <FilterBar />


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
