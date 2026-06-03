import { AnimatePresence, motion } from 'framer-motion';
import { Database, Link, SlidersHorizontal, Globe } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { compressToEncodedURIComponent } from 'lz-string';
import { useGalleryStore } from '../../store/useGalleryStore';
import { fetchLastFmRoom } from '../../utils/lastFmService';

const controlRows = [
  { key: 'globeRadius', label: 'Radius', min: 5.2, max: 10.5, step: 0.1 },
  { key: 'globeHeight', label: 'Vertical Spread', min: 2.4, max: 8, step: 0.1 },
  { key: 'dragSpeed', label: 'Drag Speed', min: 0.0015, max: 0.012, step: 0.0001 },
  { key: 'dragDamp', label: 'Flow Damp', min: 0.05, max: 0.35, step: 0.01 },
  { key: 'tiltFactor', label: 'Tilt', min: 0, max: 0.45, step: 0.01 },
  { key: 'focusScale', label: 'Focus Scale', min: 1, max: 2.2, step: 0.01 },
  { key: 'dimScale', label: 'Dim Scale', min: 0.2, max: 1, step: 0.01 },
  { key: 'dimOpacity', label: 'Dim Opacity', min: 0.05, max: 0.9, step: 0.01 },
  { key: 'zoomIn', label: 'Zoom In', min: 2.4, max: 7, step: 0.1 },
  { key: 'zoomOut', label: 'Zoom Out Offset', min: -8, max: 8, step: 0.1 },
  { key: 'camDamp', label: 'Camera Damp', min: 0.03, max: 0.2, step: 0.01 },
];

function SceneControlsOverlay() {
  const controls = useGalleryStore((state) => state.sceneControls);
  const setSceneControl = useGalleryStore((state) => state.setSceneControl);
  const canEditAlbums = useGalleryStore((state) => state.canEditAlbums);
  const toggleEditMode = useGalleryStore((state) => state.toggleEditMode);
  const vaultName = useGalleryStore((state) => state.vaultName);
  const setVaultName = useGalleryStore((state) => state.setVaultName);
  const isFeedOpen = useGalleryStore((state) => state.isFeedOpen);
  const setFeedOpen = useGalleryStore((state) => state.setFeedOpen);
  const [isOpen, setIsOpen] = useState(false);
  const selectedAlbumId = useGalleryStore((state) => state.selectedAlbumId);
  const replaceRoom = useGalleryStore((state) => state.replaceRoom);
  const containerRef = useRef(null);
  
  const [lfmUser, setLfmUser] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e) => {
      if (e.target.type === 'range') {
        e.preventDefault();
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {!selectedAlbumId && (
        <motion.aside
          id="top-right-controls"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.45, delay: 0.15 }}
          className="absolute right-4 top-4 z-30 w-[min(92vw,330px)] rounded-2xl glass md:right-8 md:top-8"
        >
          <div className="flex w-full items-center gap-2 p-2 border-b-2 border-zinc-950">
            {/* Feed Button */}
            <button
              onClick={() => setFeedOpen(!isFeedOpen)}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-display font-bold uppercase tracking-wider border-2 border-zinc-950 transition cursor-pointer hover:-translate-y-0.5 active:translate-y-0.5 shadow-[2px_2px_0px_#09090b] hover:shadow-[3px_3px_0px_#09090b] active:shadow-none flex items-center justify-center gap-1 ${
                isFeedOpen 
                  ? 'bg-orange-400 text-zinc-950 shadow-none translate-x-[2px] translate-y-[2px]' 
                  : 'bg-white text-zinc-800'
              }`}
              title="Explore Community Rooms"
            >
              <Globe size={11} /> Feed
            </button>

            {/* Share Button */}
            <button
              onClick={() => {
                const albums = useGalleryStore.getState().albums;
                const lightweight = albums.map(a => ({
                  ...a,
                  texture_url: a.texture_url?.startsWith('data:') ? '' : a.texture_url,
                }));
                const compressed = compressToEncodedURIComponent(JSON.stringify(lightweight));
                const displayName = vaultName || 'Anonymous';
                const byParam = `&by=${encodeURIComponent(displayName)}`;
                const shareUrl = `${window.location.origin}${window.location.pathname}?v=${compressed}${byParam}`;
                navigator.clipboard.writeText(shareUrl).then(() => {
                  setShareCopied(true);
                  setTimeout(() => setShareCopied(false), 3000);
                }).catch((err) => {
                  console.error('Clipboard write failed:', err);
                });
              }}
              className="flex-1 py-1.5 rounded-lg bg-white border-2 border-zinc-950 text-[10px] font-display font-bold uppercase tracking-wider text-zinc-950 transition cursor-pointer hover:-translate-y-0.5 active:translate-y-0.5 shadow-[2px_2px_0px_#09090b] hover:shadow-[3px_3px_0px_#09090b] active:shadow-none flex items-center justify-center gap-1"
              title="Share room link"
            >
              <Link size={11} /> {shareCopied ? 'Copied!' : 'Share'}
            </button>

            {/* Tune Button */}
            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-display font-bold uppercase tracking-wider border-2 border-zinc-950 transition cursor-pointer hover:-translate-y-0.5 active:translate-y-0.5 shadow-[2px_2px_0px_#09090b] hover:shadow-[3px_3px_0px_#09090b] active:shadow-none flex items-center justify-center gap-1 ${
                isOpen 
                  ? 'bg-orange-400 text-zinc-950 shadow-none translate-x-[2px] translate-y-[2px]' 
                  : 'bg-white text-zinc-800'
              }`}
              title="Tune Globe & Settings"
            >
              <SlidersHorizontal size={11} /> Tune
            </button>
          </div>

          <AnimatePresence initial={false}>
            {isOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.19, 1, 0.22, 1] }}
                className="overflow-hidden"
              >
                <div ref={containerRef} className="max-h-[58vh] space-y-4 overflow-y-auto px-4 pb-4 mt-3">
                  <button
                    onClick={toggleEditMode}
                    className={`flex w-full items-center justify-between rounded-xl border-2 border-zinc-950 p-2.5 transition cursor-pointer shadow-[2px_2px_0px_#09090b] hover:shadow-[3px_3px_0px_#09090b] active:shadow-none hover:-translate-y-0.5 active:translate-y-0.5 ${
                      canEditAlbums
                        ? 'bg-orange-400/20 text-zinc-900'
                        : 'bg-white text-zinc-600'
                    }`}
                  >
                    <div className="flex flex-col items-start font-display">
                      <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                        <Database size={13} /> Personalize Room
                      </span>
                      <span className="mt-0.5 text-[8.5px] font-bold text-zinc-500 uppercase tracking-widest pl-[21px]">Saved Locally</span>
                    </div>
                    <span className="text-[10px] font-display uppercase font-bold">{canEditAlbums ? 'On' : 'Off'}</span>
                  </button>

                  <div className="flex flex-col gap-1.5 rounded-xl border-2 border-zinc-950 bg-zinc-50 p-3 shadow-[2px_2px_0px_#09090b]">
                    <span className="text-[10px] font-display font-bold uppercase tracking-wider text-zinc-700">
                      Room Name
                    </span>
                    <div className="relative flex items-center">
                      <input 
                        type="text" 
                        value={vaultName}
                        onChange={(e) => setVaultName(e.target.value)}
                        placeholder="e.g. Mo's, Chill Beats" 
                        className="w-full rounded-lg border-2 border-zinc-950 bg-white py-1.5 pl-3 pr-14 text-[11px] font-semibold outline-none"
                      />
                      <span className="absolute right-3 text-[10px] font-display font-bold uppercase tracking-widest text-zinc-400 pointer-events-none">
                        Room
                      </span>
                    </div>
                  </div>

                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!lfmUser.trim()) return;
                      setIsSyncing(true);
                      try {
                        const newRoom = await fetchLastFmRoom(lfmUser.trim(), import.meta.env.VITE_LASTFM_API_KEY);
                        if (newRoom.length > 0) {
                          replaceRoom(newRoom);
                          setLfmUser('');
                        } else {
                          alert("No albums found for this Last.fm user.");
                        }
                      } catch (err) {
                        alert(err.message || 'Failed to sync with Last.fm');
                      } finally {
                        setIsSyncing(false);
                      }
                    }}
                    className="flex flex-col gap-2 rounded-xl border-2 border-zinc-950 bg-zinc-50 p-3 shadow-[2px_2px_0px_#09090b]"
                  >
                    <span className="flex items-center gap-2 text-[10px] font-display font-bold uppercase tracking-wider text-zinc-700">
                      Last.fm Auto-Sync
                    </span>
                    <div className="flex gap-2">
                       <input 
                         type="text" 
                         value={lfmUser}
                         disabled={isSyncing}
                         onChange={(e) => setLfmUser(e.target.value)}
                         placeholder="Username" 
                         className="min-w-0 flex-1 rounded-lg border-2 border-zinc-950 bg-white py-1.5 px-3 text-[11px] outline-none"
                       />
                       <button 
                         type="submit" 
                         disabled={isSyncing || !lfmUser.trim()}
                         className="shrink-0 rounded-lg border-2 border-zinc-950 bg-white hover:bg-zinc-100 text-zinc-950 px-3 py-1.5 text-[10px] font-display font-bold uppercase tracking-widest transition hover:-translate-y-0.5 active:translate-y-0.5 shadow-[2px_2px_0px_#09090b] active:shadow-none disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                       >
                         {isSyncing ? 'Syncing...' : 'Sync'}
                       </button>
                    </div>
                  </form>

                  <div className="h-0.5 bg-zinc-950" />

                  {controlRows.map((row) => (
                    <label key={row.key} className="grid gap-1.5 pt-1.5 pb-2 border-b border-zinc-200/50">
                      <div className="flex items-center justify-between text-[10px] font-display font-bold uppercase tracking-wider text-zinc-600">
                        <span>{row.label}</span>
                        <span>{Number(controls[row.key]).toFixed(row.step < 0.1 ? 2 : 1)}</span>
                      </div>
                      <input
                        type="range"
                        min={row.min}
                        max={row.max}
                        step={row.step}
                        value={controls[row.key]}
                        onChange={(event) => setSceneControl(row.key, Number(event.target.value))}
                        onWheel={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          const dir = event.deltaY < 0 ? 1 : -1;
                          const next = Math.max(row.min, Math.min(row.max, Number(controls[row.key]) + dir * row.step));
                          setSceneControl(row.key, Number(next.toFixed(4)));
                        }}
                        className="cursor-pointer"
                      />
                    </label>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

export default SceneControlsOverlay;
