import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, User, Globe, Disc, Send } from 'lucide-react';
import { useGalleryStore } from '../../store/useGalleryStore';
import { isFirebaseConfigured } from '../../utils/firebase';

function TimelineFeed() {
  const setFeedOpen = useGalleryStore((state) => state.setFeedOpen);
  const timelineRooms = useGalleryStore((state) => state.timelineRooms);
  const publishRoom = useGalleryStore((state) => state.publishRoom);
  const subscribeToTimelineRooms = useGalleryStore((state) => state.subscribeToTimelineRooms);
  const myAlbums = useGalleryStore((state) => state.myAlbums);
  const vaultName = useGalleryStore((state) => state.vaultName);
  const isViewingShared = useGalleryStore((state) => state.isViewingShared);
  const sharedOwnerName = useGalleryStore((state) => state.sharedOwnerName);
  const loadSharedRoom = useGalleryStore((state) => state.loadSharedRoom);
  const timelineError = useGalleryStore((state) => state.timelineError);
  const isPublished = useGalleryStore((state) => state.isPublished);
  const publishedDescription = useGalleryStore((state) => state.publishedDescription);
  const unpublishRoom = useGalleryStore((state) => state.unpublishRoom);
  const user = useGalleryStore((state) => state.user);

  useEffect(() => {
    const unsubscribe = subscribeToTimelineRooms();
    return () => unsubscribe();
  }, [subscribeToTimelineRooms]);

  const [description, setDescription] = useState('');

  const isCurrentlyPublished = isPublished;
  const displayDescription = publishedDescription;

  useEffect(() => {
    setDescription(displayDescription);
  }, [displayDescription]);

  const handlePublish = (e) => {
    e.preventDefault();
    publishRoom(description.trim());
  };

  return (
    <motion.aside
      initial={{ x: '-100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '-100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute bottom-0 left-0 top-0 z-40 w-[min(90vw,380px)] bg-[#f5f5f3] border-r border-zinc-250 border-y-0 border-l-0 rounded-r-3xl rounded-l-none shadow-[8px_0_40px_rgba(0,0,0,0.12)] p-5 md:p-6 overflow-hidden pointer-events-auto flex flex-col justify-between"
    >
      <div className="flex flex-col flex-1 min-h-0">
        {/* Drawer Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-200 shrink-0">
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-zinc-800 animate-pulse" />
            <div className="flex flex-col">
              <h2 className="font-display text-sm uppercase tracking-wider text-zinc-900 leading-none">
                Community Feed
              </h2>
            </div>
          </div>
          <button
            onClick={() => setFeedOpen(false)}
            className="rounded-full glass-btn p-1.5 text-zinc-800 cursor-pointer flex items-center justify-center"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-5">
          <p className="text-xs font-body text-zinc-600 mb-5 leading-relaxed">
          Step into other audiophiles' virtual vinyl rooms. Dig through their custom shelves and explore their tracklists!
        </p>

        {timelineError && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-800 font-body leading-relaxed break-all">
            <strong>Database Error:</strong> {timelineError}
          </div>
        )}

        {/* Publish My Room Section */}
        {!isViewingShared && (
          <div className="mb-6 rounded-xl border border-white/40 bg-white/40 p-4 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-display font-bold uppercase tracking-wider text-zinc-800 flex items-center gap-1.5">
                <Sparkles size={13} className="text-orange-500" /> Share My Room
              </h3>
              
              <button
                type="button"
                onClick={async () => {
                  if (isCurrentlyPublished) {
                    await unpublishRoom();
                  } else {
                    await publishRoom(description.trim());
                  }
                }}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                  isCurrentlyPublished ? 'bg-orange-500' : 'bg-zinc-300'
                }`}
                aria-label="Toggle Live Status"
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isCurrentlyPublished ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            
            {isCurrentlyPublished ? (
              <div className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-display font-extrabold uppercase tracking-wider text-emerald-600">
                    Live
                  </span>
                </div>
                
                <form onSubmit={handlePublish} className="space-y-2">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell the community about your wax shelf... (e.g. Vintage jazz & late night ambient)"
                    rows={2}
                    maxLength={100}
                    className="w-full text-base md:text-xs rounded-lg border border-white/50 bg-white/80 p-2.5 outline-none placeholder:text-zinc-400 text-zinc-800 resize-none focus:bg-white focus:border-orange-500 transition-all shadow-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={description.trim() === displayDescription || myAlbums.length === 0}
                      className="flex-1 rounded-xl text-zinc-800 py-2 px-3 text-xs font-display font-bold uppercase tracking-wider transition-all glass-btn cursor-pointer disabled:opacity-40 disabled:pointer-events-none text-center"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => unpublishRoom()}
                      className="flex-1 rounded-xl text-red-600 py-2 px-3 text-xs font-display font-bold uppercase tracking-wider transition-all glass-btn cursor-pointer text-center"
                    >
                      Go Offline
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-400"></span>
                  </span>
                  <span className="text-[10px] font-display font-extrabold uppercase tracking-wider text-zinc-500">
                    Not Live
                  </span>
                </div>

                <form onSubmit={handlePublish} className="space-y-2">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell the community about your wax shelf... (e.g. Vintage jazz & late night ambient)"
                    rows={2}
                    maxLength={100}
                    className="w-full text-base md:text-xs rounded-lg border border-white/50 bg-white/80 p-2.5 outline-none placeholder:text-zinc-400 text-zinc-800 resize-none focus:bg-white focus:border-orange-500 transition-all shadow-sm"
                  />
                  <button
                    type="submit"
                    disabled={myAlbums.length === 0}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl text-zinc-800 py-2 px-4 text-xs font-display font-bold uppercase tracking-wider transition-all glass-btn cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <Send size={12} /> Go Live
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Community List */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-display font-bold uppercase tracking-wider text-zinc-400">
            Active Waxrooms ({timelineRooms.length})
          </h3>
          <div className="space-y-3.5 max-h-[52vh] overflow-y-auto pr-1">
            {timelineRooms.length === 0 ? (
              <div className="py-8 text-center text-xs font-display font-bold uppercase tracking-wider text-zinc-400 border border-dashed border-zinc-300 rounded-xl p-4 bg-white/20 leading-relaxed">
                No rooms published yet.<br />Be the first to share yours!
              </div>
            ) : (
              timelineRooms.map((room) => {
                const isCurrent = isViewingShared && sharedOwnerName === room.ownerName;
                const isOwnRoom = !isViewingShared && user && (room.id === user.uid || room.ownerUid === user.uid);

                return (
                  <div
                    key={room.id}
                    className={`rounded-xl border p-3.5 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:-translate-y-0.5 ${
                      isCurrent
                        ? 'bg-orange-500/10 border-orange-400 shadow-[0_6px_20px_rgba(234,88,12,0.08)]'
                        : 'bg-white/45 border-white/40 hover:bg-white/60'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <div>
                        <h4 className="font-display text-sm uppercase tracking-wide text-zinc-950 leading-tight">
                          {room.roomName}
                        </h4>
                        <span className="text-[10px] text-zinc-500 font-display font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                          <User size={10} /> {room.ownerName}
                        </span>
                      </div>

                      {isCurrent ? (
                        <span className="text-[9px] font-display font-extrabold uppercase tracking-widest bg-orange-500 text-white py-0.5 px-2.5 rounded-md shadow-sm">
                          Viewing
                        </span>
                      ) : isOwnRoom ? (
                        <div className="flex flex-col items-end gap-1.5">
                          <span className="text-[9px] font-display font-extrabold uppercase tracking-widest bg-zinc-700 text-white py-0.5 px-2.5 rounded-md shadow-sm">
                            Yours
                          </span>
                          <button
                            onClick={() => unpublishRoom(room.id)}
                            className="text-[9px] font-display font-extrabold uppercase tracking-widest py-1 px-2.5 rounded-xl transition-all glass-btn text-zinc-800 cursor-pointer"
                            title="Unpublish room from feed"
                          >
                            Unpublish
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            loadSharedRoom(room.ownerName, room.albums);
                            setFeedOpen(false);
                          }}
                          className="text-[9px] font-display font-extrabold uppercase tracking-widest py-1 px-2.5 rounded-xl transition-all glass-btn text-zinc-800 cursor-pointer"
                        >
                          Visit
                        </button>
                      )}
                    </div>

                    <p className="text-xs font-body text-zinc-600 mb-3 leading-relaxed break-words">
                      {room.description}
                    </p>

                    {room.activePlayback && room.activePlayback.isPlaying && (
                      <div className="mb-3.5 flex items-center gap-2.5 bg-zinc-900 text-white rounded-xl p-2 border border-zinc-850 shadow-sm relative overflow-hidden group">
                        <div className="relative h-9 w-9 shrink-0 flex items-center justify-center">
                          <img
                            src={room.activePlayback.albumArtUrl || '/placeholder-album.png'}
                            alt={room.activePlayback.albumTitle || 'Now Playing'}
                            className="h-9 w-9 rounded object-cover shadow-sm bg-zinc-800"
                          />
                          <div className="absolute inset-0 bg-black/40 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Disc size={14} className="text-white animate-spin" style={{ animationDuration: '3s' }} />
                          </div>
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <span className="relative flex h-1 w-1">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1 w-1 bg-emerald-500"></span>
                            </span>
                            <span className="text-[7.5px] font-display font-extrabold uppercase tracking-widest text-emerald-400">
                              Now Playing
                            </span>
                          </div>
                          <p className="text-[9.5px] font-display font-bold uppercase tracking-wider truncate leading-tight mt-0.5">
                            {room.activePlayback.trackTitle}
                          </p>
                          <p className="text-[8px] font-display font-bold uppercase tracking-widest text-zinc-400 truncate leading-none mt-0.5">
                            {room.activePlayback.artistName}
                          </p>
                        </div>
                        
                        {room.activePlayback.previewUrl && (
                          <PreviewPlayerButton previewUrl={room.activePlayback.previewUrl} />
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2.5 border-t border-white/20 text-[9px] font-display font-bold uppercase tracking-wider text-zinc-400">
                      <span className="flex items-center gap-1 text-orange-655 text-orange-600">
                        <Disc size={11} className={isCurrent ? 'animate-spin' : ''} style={{ animationDuration: '4s' }} /> {room.albums.length} Records
                      </span>
                      <span className="max-w-[160px] truncate text-right text-zinc-550 pl-2">
                        {room.genres}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="pt-4 mt-4 border-t border-white/25 flex items-center justify-center text-[9px] font-display text-zinc-400 font-bold uppercase tracking-wider shrink-0">
        <span>Waxroom Community © 2026</span>
      </div>
    </motion.aside>
  );
}

export default TimelineFeed;

function PreviewPlayerButton({ previewUrl }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(previewUrl);
      audioRef.current.volume = 0.35;
      audioRef.current.addEventListener('ended', () => setPlaying(false));
    }

    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().catch((err) => console.warn('Preview play failed:', err));
      setPlaying(true);
    }
  };

  return (
    <button
      onClick={togglePlay}
      className={`shrink-0 h-7 w-7 rounded-full flex items-center justify-center transition-all cursor-pointer border ${
        playing
          ? 'bg-orange-500 border-orange-500 text-white'
          : 'bg-zinc-800 border-zinc-750 text-zinc-400 hover:text-white hover:border-zinc-500'
      }`}
      title={playing ? 'Pause Preview' : 'Play Preview'}
    >
      {playing ? (
        <span className="flex items-center gap-0.5">
          <span className="w-0.5 h-3 bg-white animate-pulse" style={{ animationDelay: '0.1s' }} />
          <span className="w-0.5 h-3 bg-white animate-pulse" style={{ animationDelay: '0.2s' }} />
          <span className="w-0.5 h-3 bg-white animate-pulse" style={{ animationDelay: '0.3s' }} />
        </span>
      ) : (
        <svg className="h-3.5 w-3.5 fill-current ml-0.5" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      )}
    </button>
  );
}
