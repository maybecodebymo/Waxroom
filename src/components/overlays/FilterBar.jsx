import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Sparkles, HelpCircle } from 'lucide-react';
import { useGalleryStore } from '../../store/useGalleryStore';

function FilterBar() {
  const genres = useGalleryStore((state) => state.genres);
  const activeGenre = useGalleryStore((state) => state.activeGenre);
  const canEditAlbums = useGalleryStore((state) => state.canEditAlbums);
  const setGenre = useGalleryStore((state) => state.setGenre);
  const setAddModalOpen = useGalleryStore((state) => state.setAddModalOpen);
  const selectedAlbumId = useGalleryStore((state) => state.selectedAlbumId);
  const isRecommendationsOpen = useGalleryStore((state) => state.isRecommendationsOpen);
  const setRecommendationsOpen = useGalleryStore((state) => state.setRecommendationsOpen);
  
  const hasCompletedTour = useGalleryStore((state) => state.hasCompletedTour);
  const setCompletedTour = useGalleryStore((state) => state.setCompletedTour);
  const isViewingShared = useGalleryStore((state) => state.isViewingShared);

  return (
    <AnimatePresence>
      {!selectedAlbumId && (
        <motion.div
          id="filter-bar-container"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.55, delay: 0.2 }}
          className="absolute bottom-5 left-1/2 z-30 w-[min(94vw,860px)] -translate-x-1/2 rounded-2xl p-2.5 glass md:bottom-8 pointer-events-auto"
        >
          <div className="flex items-center gap-2.5 justify-between w-full">
            {canEditAlbums && (
              <button
                onClick={() => setAddModalOpen(true)}
                id="add-album-btn"
                className="group shrink-0 rounded-xl border-2 border-zinc-950 bg-white p-2.5 text-zinc-950 transition hover:-translate-y-0.5 active:translate-y-0.5 shadow-[2px_2px_0px_#09090b] hover:shadow-[3px_3px_0px_#09090b] active:shadow-none cursor-pointer"
                aria-label="Add album"
              >
                <Plus size={18} className="transition group-hover:rotate-90" />
              </button>
            )}

            <div className="flex items-center gap-2 overflow-x-auto flex-1 px-1 py-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {genres.map((genre) => {
                const isActive = activeGenre === genre;
                return (
                  <button
                    key={genre}
                    onClick={() => setGenre(genre)}
                    className={`shrink-0 rounded-xl px-4 py-1.5 text-xs font-display font-bold uppercase tracking-wider border-2 border-zinc-950 transition cursor-pointer ${
                      isActive
                        ? 'bg-orange-400 text-zinc-950 shadow-none translate-x-[2px] translate-y-[2px]'
                        : 'bg-white text-zinc-800 hover:bg-zinc-50 hover:-translate-y-0.5 active:translate-y-0.5 shadow-[2px_2px_0px_#09090b] hover:shadow-[3px_3px_0px_#09090b] active:shadow-none'
                    }`}
                  >
                    {genre}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setRecommendationsOpen(!isRecommendationsOpen)}
              id="get-lucky-btn"
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-display font-bold uppercase tracking-wider border-2 border-zinc-950 transition cursor-pointer ${
                isRecommendationsOpen
                  ? 'bg-orange-400 text-zinc-950 shadow-none translate-x-[2px] translate-y-[2px]'
                  : 'bg-white text-zinc-800 hover:bg-zinc-50 hover:-translate-y-0.5 active:translate-y-0.5 shadow-[2px_2px_0px_#09090b] hover:shadow-[3px_3px_0px_#09090b] active:shadow-none'
              }`}
            >
              <Sparkles size={13} />
              <span className="hidden sm:inline">Recommendations</span>
              <span className="inline sm:hidden">Recs</span>
            </button>

            {/* Help/Tutorial Trigger inside bottom action bar */}
            {hasCompletedTour && !isViewingShared && (
              <button
                onClick={() => setCompletedTour(false)}
                className="shrink-0 flex items-center justify-center p-2.5 rounded-xl border-2 border-zinc-950 bg-white text-zinc-950 hover:bg-zinc-100 active:translate-y-0.5 active:shadow-none transition-all shadow-[2px_2px_0px_#09090b] cursor-pointer"
                title="Start Tutorial Guide"
              >
                <HelpCircle size={16} />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default FilterBar;
