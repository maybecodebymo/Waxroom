import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState, useEffect } from 'react';
import { Disc3, Pencil, Star, Trash2, X } from 'lucide-react';
import { useGalleryStore } from '../../store/useGalleryStore';

function AlbumDetailOverlay() {
  const albums = useGalleryStore((state) => state.albums);
  const selectedAlbumId = useGalleryStore((state) => state.selectedAlbumId);
  const canEditAlbums = useGalleryStore((state) => state.canEditAlbums);
  const selectAlbum = useGalleryStore((state) => state.selectAlbum);
  const openEditModal = useGalleryStore((state) => state.openEditModal);
  const deleteAlbum = useGalleryStore((state) => state.deleteAlbum);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const album = useMemo(() => albums.find((entry) => entry.id === selectedAlbumId), [albums, selectedAlbumId]);

  const containerVariants = useMemo(() => {
    if (isMobile) {
      return {
        hidden: { y: '100%', opacity: 1 },
        visible: {
          y: 0,
          opacity: 1,
          transition: {
            duration: 0.35,
            ease: [0.16, 1, 0.3, 1],
          },
        },
        exit: { y: '100%', opacity: 1, transition: { duration: 0.25 } },
      };
    } else {
      return {
        hidden: { x: '100%', y: '-50%', opacity: 0 },
        visible: {
          x: 0,
          y: '-50%',
          opacity: 1,
          transition: {
            duration: 0.4,
            ease: [0.16, 1, 0.3, 1],
          },
        },
        exit: { x: '100%', y: '-50%', opacity: 0, transition: { duration: 0.22 } },
      };
    }
  }, [isMobile]);

  return (
    <AnimatePresence>
      {album && (
        <>
          {/* Stark overlay backdrop (clean contrast) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            exit={{ opacity: 0 }}
            onClick={() => selectAlbum(null)}
            className="fixed inset-0 z-20 bg-black"
          />
          <motion.aside
            key={album.id}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`fixed z-30 overflow-y-auto p-6 bg-white border-2 border-zinc-950 text-zinc-950 ${
              isMobile
                ? 'bottom-0 left-0 right-0 max-h-[48vh] w-full rounded-t-[32px] border-x-0 border-b-0 shadow-[0_-8px_24px_rgba(0,0,0,0.15)]'
                : 'right-4 top-1/2 -translate-y-1/2 max-h-[85vh] w-[420px] rounded-2xl shadow-[6px_6px_0px_#09090b] md:right-8'
            }`}
          >
            <div className="mb-4 flex items-center justify-between gap-2 border-b-2 border-zinc-950 pb-3">
              <div className="flex items-center gap-2 text-zinc-800">
                <Disc3 size={18} />
                <p className="font-display text-xs uppercase tracking-wider">Now Playing</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-md border-2 border-zinc-950 bg-orange-400 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-zinc-950">
                  {album.genre}
                </span>
                <button
                  type="button"
                  onClick={() => selectAlbum(null)}
                  className="rounded-lg border-2 border-zinc-950 bg-white p-1 text-zinc-950 transition hover:bg-zinc-100 active:translate-y-0.5 cursor-pointer"
                  aria-label="Close details"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <h2 className="font-display text-xl uppercase leading-tight tracking-wide text-zinc-950 md:text-2xl">
              {album.artist}
            </h2>
            <p className="mt-1 font-body text-base text-zinc-700 italic">
              {album.album_title}
            </p>

            <div className="mt-4 inline-flex items-center gap-2 rounded-lg border-2 border-zinc-950 bg-zinc-50 px-3 py-1 font-display">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Rating</span>
              <span className="text-xs font-bold text-zinc-950">{album.rating}/10</span>
            </div>

            <p className="mt-4 text-xs font-body text-zinc-600 leading-relaxed">
              {album.description}
            </p>

            <section className="mt-5 rounded-xl border-2 border-zinc-950 bg-zinc-50 p-4 shadow-[2px_2px_0px_#09090b]">
              <h3 className="mb-3 font-display text-[10px] font-bold uppercase tracking-wider text-zinc-500">Tracklist</h3>
              <ul className="space-y-2.5 text-xs font-body text-zinc-700">
                {album.tracklist?.length > 0 ? (
                  album.tracklist.map((track, idx) => (
                    <li key={`${track.title}-${idx}`} className="flex items-start gap-2.5">
                      <span className="min-w-[1.25rem] text-right font-display text-zinc-400">{idx + 1}.</span>
                      <span className={`leading-tight ${track.category === 'hit' ? 'font-bold text-zinc-950' : ''}`}>
                        {track.title}
                      </span>
                      {track.category === 'hit' && (
                        <Star size={12} strokeWidth={2.5} className="mt-[2px] shrink-0 text-zinc-950" />
                      )}
                    </li>
                  ))
                ) : (
                  <li className="text-zinc-400 italic">No tracks listed.</li>
                )}
              </ul>
            </section>

            {canEditAlbums && (
              <div className="mt-5 flex items-center justify-end gap-2 border-t-2 border-zinc-950 pt-4">
                <button
                  type="button"
                  onClick={() => openEditModal(album.id)}
                  className="inline-flex items-center gap-2 rounded-lg border-2 border-zinc-950 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-zinc-950 shadow-[2px_2px_0px_#09090b] transition hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#09090b] active:translate-y-0.5 active:shadow-none cursor-pointer"
                >
                  <Pencil size={12} /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to remove "${album.album_title}" from your room?`)) {
                      deleteAlbum(album.id);
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border-2 border-zinc-950 bg-red-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-red-700 shadow-[2px_2px_0px_#09090b] transition hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#09090b] active:translate-y-0.5 active:shadow-none cursor-pointer"
                >
                  <Trash2 size={12} /> Remove
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export default AlbumDetailOverlay;
