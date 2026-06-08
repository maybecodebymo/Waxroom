import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState, useEffect, useRef } from 'react';
import { Disc3, Pencil, Star, Trash2, X, Play, Pause, Music } from 'lucide-react';
import { useGalleryStore } from '../../store/useGalleryStore';
import { extractAverageColor } from '../../utils/colorUtils';

function AlbumDetailOverlay() {
  const albums = useGalleryStore((state) => state.albums);
  const selectedAlbumId = useGalleryStore((state) => state.selectedAlbumId);
  const canEditAlbums = useGalleryStore((state) => state.canEditAlbums);
  const isViewingShared = useGalleryStore((state) => state.isViewingShared);
  const selectAlbum = useGalleryStore((state) => state.selectAlbum);
  const openEditModal = useGalleryStore((state) => state.openEditModal);
  const deleteAlbum = useGalleryStore((state) => state.deleteAlbum);
  const crateInbox = useGalleryStore((state) => state.crateInbox);
  const addToShelfFromCrate = useGalleryStore((state) => state.addToShelfFromCrate);

  const activeTrack = useGalleryStore((state) => state.activeTrack);
  const isPlaying = useGalleryStore((state) => state.isPlaying);
  const setActiveTrack = useGalleryStore((state) => state.setActiveTrack);
  const setPlaying = useGalleryStore((state) => state.setPlaying);
  const setActiveBgColor = useGalleryStore((state) => state.setActiveBgColor);

  const [isMobile, setIsMobile] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const album = useMemo(() => {
    return albums.find((entry) => entry.id === selectedAlbumId) ||
           crateInbox.find((entry) => entry.id === selectedAlbumId);
  }, [albums, crateInbox, selectedAlbumId]);

  const isFromCrate = useMemo(() => {
    return crateInbox.some((entry) => entry.id === selectedAlbumId);
  }, [crateInbox, selectedAlbumId]);

  // Color blending hook
  useEffect(() => {
    if (album) {
      extractAverageColor(album.texture_url, album.genre).then((color) => {
        setActiveBgColor(color);
      });
    } else {
      setActiveBgColor('#f5f5f4');
    }
  }, [album, setActiveBgColor]);

  // Audio synchronization hook
  useEffect(() => {
    if (!audioRef.current) return;
    if (activeTrack && activeTrack.previewUrl) {
      audioRef.current.src = activeTrack.previewUrl;
      if (isPlaying) {
        audioRef.current.play().catch((err) => console.log('Audio playback block or failure:', err));
      } else {
        audioRef.current.pause();
      }
    } else {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
  }, [activeTrack]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      if (audioRef.current.src) {
        audioRef.current.play().catch((err) => console.log('Audio playback block or failure:', err));
      }
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  const handleAudioEnded = () => {
    setPlaying(false);
  };

  const containerVariants = useMemo(() => {
    if (isMobile) {
      return {
        hidden: { y: '120%', opacity: 1 },
        visible: {
          y: 0,
          opacity: 1,
          transition: {
            duration: 0.35,
            ease: [0.16, 1, 0.3, 1],
          },
        },
        exit: { y: '120%', opacity: 1, transition: { duration: 0.25 } },
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
          {/* Background HTML5 audio player */}
          <audio ref={audioRef} onEnded={handleAudioEnded} className="hidden" />

          {/* Overlay backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.08 }}
            exit={{ opacity: 0 }}
            onClick={() => selectAlbum(null)}
            className="fixed inset-0 z-20 bg-black pointer-events-auto"
          />
          <motion.aside
            key={album.id}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`fixed z-30 overflow-hidden p-6 glass text-zinc-900 pointer-events-auto flex flex-col ${
              isMobile
                ? 'bottom-4 left-4 right-4 max-h-[44vh] w-[calc(100%-32px)] rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-white/50'
                : 'right-4 top-1/2 max-h-[85vh] w-[420px] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white/60 md:right-8'
            }`}
          >
            {/* Header section (pinned) */}
            <div className="mb-4 flex items-center justify-between gap-2 border-b border-white/30 pb-3 shrink-0">
              <div className="flex items-center gap-2 text-zinc-700">
                <Disc3 size={18} className="text-orange-500 animate-spin" style={{ animationDuration: '6s', animationPlayState: isPlaying && activeTrack && activeTrack.artist === album.artist ? 'running' : 'paused' }} />
                <p className="font-display text-xs uppercase tracking-wider">Now Playing</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-orange-500 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm">
                  {album.genre}
                </span>
                <button
                  type="button"
                  onClick={() => selectAlbum(null)}
                  className="rounded-full glass-btn p-1.5 text-zinc-800 cursor-pointer flex items-center justify-center"
                  aria-label="Close details"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Scrollable body section */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 min-h-0">
              <h2 className="font-display text-xl uppercase leading-tight tracking-wide text-zinc-950 md:text-2xl">
                {album.artist}
              </h2>
              <p className="mt-1 font-body text-base text-zinc-700 italic">
                {album.album_title}
              </p>

              <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/40 bg-white/40 px-3 py-1 font-display shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Rating</span>
                <span className="text-xs font-bold text-zinc-950">{album.rating}/10</span>
              </div>

              <p className="mt-4 text-xs font-body text-zinc-650 leading-relaxed">
                {album.description}
              </p>

              <section className="mt-5 rounded-xl border border-white/40 bg-white/40 p-4 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
                <h3 className="mb-3 font-display text-[10px] font-bold uppercase tracking-wider text-zinc-500">Tracklist</h3>
                <ul className="space-y-1 text-xs font-body text-zinc-700">
                  {album.tracklist?.length > 0 ? (
                    album.tracklist.map((track, idx) => {
                      const isCurrentTrack = activeTrack && activeTrack.previewUrl === track.previewUrl && activeTrack.title === track.title;
                      const isTrackPlaying = isCurrentTrack && isPlaying;
                      const hasPreview = !!track.previewUrl;

                      return (
                        <li key={`${track.title}-${idx}`} className="flex items-center justify-between gap-2.5 py-1 hover:bg-white/20 rounded-lg px-2 transition-colors">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span className="min-w-[1.25rem] text-right font-display text-zinc-400">{idx + 1}.</span>
                            <span className={`leading-tight truncate ${track.category === 'hit' ? 'font-bold text-zinc-950' : ''} ${isCurrentTrack ? 'text-orange-500 font-bold' : ''}`}>
                              {track.title}
                            </span>
                            {track.category === 'hit' && (
                              <Star size={12} strokeWidth={2.5} className="shrink-0 text-orange-500" />
                            )}
                          </div>
                          {hasPreview && (
                            <button
                              type="button"
                              onClick={() => {
                                if (isCurrentTrack) {
                                  setPlaying(!isPlaying);
                                } else {
                                  setActiveTrack({
                                    title: track.title,
                                    artist: album.artist,
                                    previewUrl: track.previewUrl,
                                  });
                                }
                              }}
                              className={`rounded-full p-1 cursor-pointer flex items-center justify-center transition-all ${
                                isCurrentTrack ? 'bg-orange-500 text-white shadow-sm' : 'glass-btn text-zinc-700 hover:text-zinc-900'
                              }`}
                              aria-label={isTrackPlaying ? 'Pause preview' : 'Play preview'}
                            >
                              {isTrackPlaying ? <Pause size={10} /> : <Play size={10} />}
                            </button>
                          )}
                        </li>
                      );
                    })
                  ) : (
                    <li className="text-zinc-400 italic px-2">No tracks listed.</li>
                  )}
                </ul>
              </section>

              {/* Frosted glass audio player */}
              {activeTrack && (
                <div className="mt-5 flex items-center gap-3 rounded-xl border border-white/60 bg-white/50 backdrop-blur-md p-3 shadow-md">
                  <div className="rounded-full bg-orange-500 p-2 text-white animate-spin" style={{ animationDuration: '4s', animationPlayState: isPlaying ? 'running' : 'paused' }}>
                    <Music size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-display font-bold uppercase tracking-wider text-zinc-400">Track Preview</p>
                    <p className="text-xs font-bold text-zinc-900 truncate">{activeTrack.title}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPlaying(!isPlaying)}
                    className="rounded-full bg-zinc-950 p-2 text-white shadow hover:bg-zinc-800 transition cursor-pointer flex items-center justify-center"
                  >
                    {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTrack(null)}
                    className="rounded-full glass-btn p-1.5 text-zinc-500 hover:text-zinc-850 cursor-pointer flex items-center justify-center"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>

            {/* Footer action buttons (pinned) */}
            {canEditAlbums && !isViewingShared && (
              <div className="mt-5 flex items-center justify-end gap-2 border-t border-white/20 pt-4 shrink-0">
                {isFromCrate ? (
                  <button
                    type="button"
                    onClick={() => {
                      addToShelfFromCrate(album.id);
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-[0_4px_12px_rgba(234,88,12,0.2)] transition-all cursor-pointer active:scale-97"
                  >
                    Add to Room
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => openEditModal(album.id)}
                      className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider text-zinc-800 glass-btn cursor-pointer"
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
                      className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-600 bg-red-50/50 border border-red-200/50 backdrop-blur-md hover:bg-red-50 hover:text-red-700 transition-all cursor-pointer active:scale-97"
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  </>
                )}
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export default AlbumDetailOverlay;
