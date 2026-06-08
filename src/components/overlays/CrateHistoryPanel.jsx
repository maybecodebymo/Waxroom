import { motion } from 'framer-motion';
import { X, Disc, Trash2, Inbox, History, Sparkles } from 'lucide-react';
import { useGalleryStore } from '../../store/useGalleryStore';

function CrateHistoryPanel() {
  const setHistoryOpen = useGalleryStore((state) => state.setHistoryOpen);
  const crateInbox = useGalleryStore((state) => state.crateInbox);
  const addToShelfFromCrate = useGalleryStore((state) => state.addToShelfFromCrate);
  const removeFromCrate = useGalleryStore((state) => state.removeFromCrate);
  const clearCrate = useGalleryStore((state) => state.clearCrate);
  const listeningHistory = useGalleryStore((state) => state.listeningHistory);
  const canEditAlbums = useGalleryStore((state) => state.canEditAlbums);

  return (
    <motion.aside
      initial={{ x: '-100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '-100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute bottom-0 left-0 top-0 z-40 w-[min(90vw,380px)] bg-[#f5f5f3] border-r border-zinc-250 border-y-0 border-l-0 rounded-r-3xl rounded-l-none shadow-[8px_0_40px_rgba(0,0,0,0.12)] p-5 md:p-6 overflow-y-auto pointer-events-auto flex flex-col justify-between"
    >
      <div className="flex-1 flex flex-col min-h-0">
        {/* Drawer Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-200 shrink-0">
          <div className="flex items-center gap-2">
            <Inbox size={18} className="text-zinc-800" />
            <div className="flex flex-col">
              <h2 className="font-display text-sm uppercase tracking-wider text-zinc-900 leading-none">
                Crate & History
              </h2>
            </div>
          </div>
          <button
            onClick={() => setHistoryOpen(false)}
            className="rounded-full glass-btn p-1.5 text-zinc-800 cursor-pointer flex items-center justify-center"
            title="Close Panel"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-6">
          {/* Crate Inbox Section */}
          {canEditAlbums && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-display font-bold uppercase tracking-wider text-zinc-800 flex items-center gap-1.5">
                  <Disc size={13} className="text-orange-500 animate-spin" style={{ animationDuration: '6s' }} />
                  Crate Inbox ({crateInbox?.length || 0})
                </h3>
                {crateInbox && crateInbox.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Clear all items from your Crate?')) {
                        clearCrate();
                      }
                    }}
                    className="text-[9px] font-display font-bold uppercase tracking-widest text-red-500 hover:text-red-700 transition cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 size={11} /> Clear All
                  </button>
                )}
              </div>

              {crateInbox && crateInbox.length > 0 ? (
                <div className="space-y-2">
                  {crateInbox.map((album) => (
                    <div key={album.id} className="flex items-center gap-2 bg-white/50 border border-white/40 rounded-xl p-2.5 shadow-sm">
                      <img
                        src={album.texture_url || '/placeholder-album.png'}
                        alt={album.album_title}
                        className="h-10 w-10 rounded-lg object-cover shadow-sm bg-zinc-200 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-display font-extrabold uppercase tracking-wide text-zinc-900 truncate leading-snug">
                          {album.album_title}
                        </p>
                        <p className="text-[9px] font-display font-semibold text-zinc-500 truncate leading-none mt-0.5">
                          {album.artist}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => addToShelfFromCrate(album.id)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-2.5 py-1 text-[9px] font-display font-bold uppercase tracking-wider cursor-pointer active:scale-95 transition-all shadow-sm"
                          title="Add to Room Shelf"
                        >
                          Keep
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFromCrate(album.id)}
                          className="bg-zinc-200 hover:bg-zinc-300 text-zinc-700 rounded-lg px-2.5 py-1 text-[9px] font-display font-bold uppercase tracking-wider cursor-pointer active:scale-95 transition-all"
                          title="Discard from Crate"
                        >
                          X
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-zinc-400">
                  <Inbox size={24} className="mx-auto mb-2 opacity-40" />
                  <p className="text-[10px] font-display font-bold uppercase tracking-wider">Crate is empty</p>
                  <p className="text-[9px] font-body text-zinc-500 mt-1 normal-case leading-relaxed">
                    Start playing music on Spotify or configure Last.fm to auto-collect scrobbles here.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Listened To History Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-display font-bold uppercase tracking-wider text-zinc-800 flex items-center gap-1.5">
              <History size={13} className="text-zinc-600" />
              Listening History
            </h3>

            {listeningHistory && listeningHistory.length > 0 ? (
              <div className="space-y-2">
                {listeningHistory.map((track, index) => (
                  <div key={index} className="flex items-center gap-2.5 bg-white/40 border border-white/20 rounded-xl p-2.5 shadow-sm text-zinc-850">
                    <img
                      src={track.albumArtUrl || '/placeholder-album.png'}
                      alt={track.albumTitle || 'Track Art'}
                      className="h-8 w-8 rounded-lg object-cover shadow-sm bg-zinc-200 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[9.5px] font-display font-extrabold uppercase tracking-wide text-zinc-900 truncate leading-snug">
                        {track.trackTitle}
                      </p>
                      <p className="text-[8.5px] font-display font-semibold text-zinc-500 truncate leading-none mt-0.5">
                        {track.artistName} • {track.albumTitle || 'Single'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-zinc-400">
                <History size={24} className="mx-auto mb-2 opacity-40" />
                <p className="text-[10px] font-display font-bold uppercase tracking-wider">No history recorded yet</p>
                <p className="text-[9px] font-body text-zinc-500 mt-1 normal-case leading-relaxed">
                  Connect your streaming profile to keep track of recently played tunes.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.aside>
  );
}

export default CrateHistoryPanel;
