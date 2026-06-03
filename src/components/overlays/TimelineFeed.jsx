import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, User, Globe, Disc, Send } from 'lucide-react';
import { useGalleryStore } from '../../store/useGalleryStore';

function TimelineFeed() {
  const setFeedOpen = useGalleryStore((state) => state.setFeedOpen);
  const timelineRooms = useGalleryStore((state) => state.timelineRooms);
  const publishRoom = useGalleryStore((state) => state.publishRoom);
  const myAlbums = useGalleryStore((state) => state.myAlbums);
  const vaultName = useGalleryStore((state) => state.vaultName);
  const isViewingShared = useGalleryStore((state) => state.isViewingShared);
  const sharedOwnerName = useGalleryStore((state) => state.sharedOwnerName);
  const loadSharedRoom = useGalleryStore((state) => state.loadSharedRoom);

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
      className="absolute bottom-0 left-0 top-0 z-40 w-[min(90vw,380px)] border-r-2 border-zinc-950 bg-white shadow-[8px_0_24px_rgba(0,0,0,0.15)] p-5 md:p-6 overflow-y-auto pointer-events-auto flex flex-col justify-between"
    >
      <div>
        {/* Drawer Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-zinc-950">
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-zinc-900" />
            <h2 className="font-display text-lg uppercase tracking-wider text-zinc-900">
              Community Feed
            </h2>
          </div>
          <button
            onClick={() => setFeedOpen(false)}
            className="rounded-lg border-2 border-zinc-950 bg-white p-1 text-zinc-950 hover:bg-zinc-100 active:translate-y-0.5 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        <p className="text-xs font-body text-zinc-500 mb-5 leading-relaxed">
          Step into other audiophiles' virtual vinyl rooms. Dig through their custom shelves and explore their tracklists!
        </p>

        {/* Publish My Room Section */}
        {!isViewingShared && (
          <div className="mb-6 rounded-xl border-2 border-zinc-950 bg-zinc-50 p-4 shadow-[3px_3px_0px_#09090b]">
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
                  className="w-full text-xs rounded-lg border-2 border-zinc-950 bg-white p-2.5 outline-none placeholder:text-zinc-400 text-zinc-800 resize-none transition"
                />
                <button
                  type="submit"
                  disabled={!description.trim() || myAlbums.length === 0}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg border-2 border-zinc-950 bg-white hover:bg-zinc-100 text-zinc-950 py-2 px-4 text-xs font-display font-bold uppercase tracking-wider transition hover:-translate-y-0.5 active:translate-y-0.5 shadow-[2px_2px_0px_#09090b] active:shadow-none cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
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
            {timelineRooms.map((room) => {
              const isCurrent = isViewingShared && sharedOwnerName === room.ownerName;
              const isOwnRoom = !isViewingShared && room.ownerName === vaultName;

              return (
                <div
                  key={room.id}
                  className={`rounded-xl border-2 border-zinc-950 p-3.5 transition-all shadow-[3px_3px_0px_#09090b] hover:shadow-[4px_4px_0px_#09090b] hover:-translate-y-0.5 ${
                    isCurrent
                      ? 'bg-orange-400/10 border-orange-500 shadow-[3px_3px_0px_#ea580c]'
                      : 'bg-white'
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
                      <span className="text-[9px] font-display font-extrabold uppercase tracking-widest border-2 border-zinc-950 bg-orange-400 text-zinc-950 py-0.5 px-2 rounded-md">
                        Viewing
                      </span>
                    ) : isOwnRoom ? (
                      <span className="text-[9px] font-display font-extrabold uppercase tracking-widest border-2 border-zinc-950 bg-zinc-950 text-white py-0.5 px-2 rounded-md">
                        Yours
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          loadSharedRoom(room.ownerName, room.albums);
                          setFeedOpen(false);
                        }}
                        className="text-[9px] font-display font-extrabold uppercase tracking-widest border-2 border-zinc-950 bg-white hover:bg-zinc-100 text-zinc-950 py-1 px-2.5 rounded-lg transition hover:-translate-y-0.5 active:translate-y-0.5 shadow-[1px_1px_0px_#09090b] active:shadow-none cursor-pointer"
                      >
                        Visit
                      </button>
                    )}
                  </div>

                  <p className="text-xs font-body text-zinc-600 mb-3 leading-relaxed break-words">
                    {room.description}
                  </p>

                  <div className="flex items-center justify-between pt-2.5 border-t border-zinc-200/40 text-[9px] font-display font-bold uppercase tracking-wider text-zinc-400">
                    <span className="flex items-center gap-1 text-orange-600">
                      <Disc size={11} className={isCurrent ? 'animate-spin' : ''} /> {room.albums.length} Records
                    </span>
                    <span className="max-w-[160px] truncate text-right text-zinc-500 pl-2">
                      {room.genres}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="pt-4 border-t border-zinc-200/50 flex items-center justify-center text-[9px] font-display text-zinc-400 font-bold uppercase tracking-wider">
        <span>Waxroom Community © 2026</span>
      </div>
    </motion.aside>
  );
}

export default TimelineFeed;
