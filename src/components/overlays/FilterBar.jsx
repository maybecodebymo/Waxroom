import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Sparkles, HelpCircle, ChevronDown, Filter } from 'lucide-react';
import { useState, useEffect } from 'react';
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

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showExpanded = !isCollapsed || (!hasCompletedTour && !isViewingShared);

  return (
    <AnimatePresence>
      {!selectedAlbumId && (
        <div className="absolute bottom-5 left-1/2 z-30 -translate-x-1/2 pointer-events-none w-[min(94vw,860px)] md:bottom-8">
          <AnimatePresence mode="wait">
            {!showExpanded ? (
              <motion.div
                key="collapsed-trigger"
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                transition={{ duration: 0.28 }}
                className="flex justify-center pointer-events-auto"
              >
                <button
                  onClick={() => setIsCollapsed(false)}
                  className="flex items-center gap-2 rounded-full glass px-4 py-2.5 shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-white/60 text-zinc-800 hover:text-zinc-950 transition-all active:scale-95 cursor-pointer font-display text-[10px] font-bold uppercase tracking-wider"
                >
                  <Filter size={13} className="text-orange-500" />
                  <span>Show Menu</span>
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="expanded-bar"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 24 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="w-full rounded-2xl p-2.5 glass pointer-events-auto shadow-[0_12px_40px_rgba(0,0,0,0.08)]"
                id="filter-bar-container"
              >
                <div className="flex items-center gap-2 justify-between w-full">
                  {canEditAlbums && (
                    <button
                      onClick={() => setAddModalOpen(true)}
                      id="add-album-btn"
                      className="group shrink-0 rounded-xl glass-btn p-2.5 text-zinc-900 cursor-pointer flex items-center justify-center"
                      aria-label="Add album"
                    >
                      <Plus size={18} className="transition group-hover:rotate-90" />
                    </button>
                  )}

                  <div className="flex items-center gap-1.5 overflow-x-auto flex-1 px-1 py-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {genres.map((genre) => {
                      const isActive = activeGenre === genre;
                      return (
                        <button
                          key={genre}
                          onClick={() => setGenre(genre)}
                          className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-display font-bold uppercase tracking-wider transition-all cursor-pointer glass-btn ${
                            isActive
                              ? 'glass-btn-active font-extrabold'
                              : 'text-zinc-800'
                          }`}
                        >
                          {genre}
                        </button>
                      );
                    })}
                  </div>

                  <div id="bottom-actions" className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setRecommendationsOpen(!isRecommendationsOpen)}
                      id="get-lucky-btn"
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-display font-bold uppercase tracking-wider transition-all cursor-pointer glass-btn ${
                        isRecommendationsOpen
                          ? 'glass-btn-active font-extrabold'
                          : 'text-zinc-800'
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
                        className="flex items-center justify-center p-2.5 rounded-xl glass-btn text-zinc-800 cursor-pointer"
                        title="Start Tutorial Guide"
                      >
                        <HelpCircle size={16} />
                      </button>
                    )}

                    {/* Collapse trigger for mobile */}
                    {isMobile && (
                      <button
                        onClick={() => setIsCollapsed(true)}
                        className="flex items-center justify-center p-2.5 rounded-xl glass-btn text-zinc-500 hover:text-zinc-800 cursor-pointer"
                        title="Collapse Menu"
                      >
                        <ChevronDown size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
}

export default FilterBar;
