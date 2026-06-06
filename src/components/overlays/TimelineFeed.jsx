import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, User, Globe, Disc, Send } from 'lucide-react';
import { useGalleryStore } from '../../store/useGalleryStore';
import { isFirebaseConfigured } from '../../utils/firebase';

function TimelineFeed() {
  const setFeedOpen = useGalleryStore((state) => state.setFeedOpen);
  const timelineRooms = useGalleryStore((state) => state.timelineRooms);
  const publishRoom = useGalleryStore((state) => state.publishRoom);
  const fetchTimelineRooms = useGalleryStore((state) => state.fetchTimelineRooms);
  const myAlbums = useGalleryStore((state) => state.myAlbums);
  const vaultName = useGalleryStore((state) => state.vaultName);
  const isViewingShared = useGalleryStore((state) => state.isViewingShared);
  const sharedOwnerName = useGalleryStore((state) => state.sharedOwnerName);
  const loadSharedRoom = useGalleryStore((state) => state.loadSharedRoom);

  useEffect(() => {
    if (isFirebaseConfigured && fetchTimelineRooms) {
      fetchTimelineRooms();
    }
  }, [fetchTimelineRooms]);

  const [description, setDescription] = useState('');
  const [justPublished, setJustPublished] = useState(false);

  const handlePublish = (e) => {
    e.preventDefault();
    publishRoom(description.trim());
    setDescription('');
    setJustPublished(true);
    setTimeout(() => setJustPublished(false), 3000);
  };

  return (
    <motion.aside
      initial={{ x: '-100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '-100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute bottom-0 left-0 top-0 z-40 w-[min(90vw,380px)] bg-[#f5f5f3] border-r border-zinc-250 border-y-0 border-l-0 rounded-r-3xl rounded-l-none shadow-[8px_0_40px_rgba(0,0,0,0.12)] p-5 md:p-6 overflow-y-auto pointer-events-auto flex flex-col justify-between"
    >
      <div>
        {/* Drawer Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-200">
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-zinc-800 animate-pulse" />
            <div className="flex flex-col">
              <h2 className="font-display text-sm uppercase tracking-wider text-zinc-900 leading-none">
                Community Feed
              </h2>
              <span className={`text-[8.5px] font-display font-bold uppercase tracking-wider mt-1 ${
                isFirebaseConfigured ? 'text-emerald-600' : 'text-orange-500'
              }`}>
                {isFirebaseConfigured ? '✓ Cloud Synced' : '⚠️ Local Mode (Demo)'}
              </span>
            </div>
          </div>
          <button
            onClick={() => setFeedOpen(false)}
            className="rounded-full glass-btn p-1.5 text-zinc-800 cursor-pointer flex items-center justify-center"
          >
            <X size={14} />
          </button>
        </div>

        {!isFirebaseConfigured && (
          <div className="mb-5 rounded-xl bg-orange-50/50 border border-orange-100 p-3 text-[10px] text-orange-800 font-body leading-relaxed">
            <strong>Demo Mode:</strong> Configure Firebase keys in your <code>.env</code> file to share records and sync across devices in real-time.
          </div>
        )}

        <p className="text-xs font-body text-zinc-600 mb-5 leading-relaxed">
          Step into other audiophiles' virtual vinyl rooms. Dig through their custom shelves and explore their tracklists!
        </p>

        {/* Publish My Room Section */}
        {!isViewingShared && (
          <div className="mb-6 rounded-xl border border-white/40 bg-white/40 p-4 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
            <h3 className="text-xs font-display font-bold uppercase tracking-wider text-zinc-800 flex items-center gap-1.5 mb-2">
              <Sparkles size={13} className="text-orange-500" /> Share My Room
            </h3>
            
            {justPublished ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-6 text-center text-xs font-display font-bold text-emerald-600 uppercase tracking-wider"
              >
                Room Published! 🎉
              </motion.div>
            ) : (
              <form onSubmit={handlePublish} className="space-y-2">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell the community about your wax shelf... (e.g. Vintage jazz & late night ambient)"
                  rows={2}
                  maxLength={100}
                  className="w-full text-xs rounded-lg border border-white/50 bg-white/80 p-2.5 outline-none placeholder:text-zinc-400 text-zinc-800 resize-none focus:bg-white focus:border-orange-500 transition-all shadow-sm"
                />
                <button
                  type="submit"
                  disabled={!description.trim() || myAlbums.length === 0}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl text-zinc-800 py-2 px-4 text-xs font-display font-bold uppercase tracking-wider transition-all glass-btn cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                >
                  <Send size={12} /> Publish Room
                </button>
              </form>
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
                const isOwnRoom = !isViewingShared && room.ownerName === vaultName;

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
                        <span className="text-[9px] font-display font-extrabold uppercase tracking-widest bg-zinc-700 text-white py-0.5 px-2.5 rounded-md shadow-sm">
                          Yours
                        </span>
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

      {/* Footer Branding */}
      <div className="pt-4 border-t border-white/25 flex items-center justify-center text-[9px] font-display text-zinc-400 font-bold uppercase tracking-wider">
        <span>Waxroom Community © 2026</span>
      </div>
    </motion.aside>
  );
}

export default TimelineFeed;
