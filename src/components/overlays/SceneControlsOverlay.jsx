import { AnimatePresence, motion } from 'framer-motion';
import { Database, Link, SlidersHorizontal, Globe, Settings, X, UploadCloud, DownloadCloud, Cloud } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { compressToEncodedURIComponent } from 'lz-string';
import { useGalleryStore } from '../../store/useGalleryStore';
import { fetchLastFmRoom } from '../../utils/lastFmService';
import { isFirebaseConfigured } from '../../utils/firebase';

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

  const hasCompletedTour = useGalleryStore((state) => state.hasCompletedTour);
  const isViewingShared = useGalleryStore((state) => state.isViewingShared);

  const backupRoomToCloud = useGalleryStore((state) => state.backupRoomToCloud);
  const restoreRoomFromCloud = useGalleryStore((state) => state.restoreRoomFromCloud);
  const isPublished = useGalleryStore((state) => state.isPublished);
  const unpublishRoom = useGalleryStore((state) => state.unpublishRoom);

  const [isMobile, setIsMobile] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lfmUser, setLfmUser] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const [cloudStatus, setCloudStatus] = useState('');
  const [cloudError, setCloudError] = useState('');
  const [isCloudLoading, setIsCloudLoading] = useState(false);
  const [restoreName, setRestoreName] = useState('');

  const isAddModalOpen = useGalleryStore((state) => state.isAddModalOpen);
  const isRecommendationsOpen = useGalleryStore((state) => state.isRecommendationsOpen);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isViewingShared || isAddModalOpen || isRecommendationsOpen || !vaultName || selectedAlbumId || isFeedOpen) {
      setIsOpen(false);
      setIsExpanded(false);
    }
  }, [isViewingShared, isAddModalOpen, isRecommendationsOpen, vaultName, selectedAlbumId, isFeedOpen]);

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

  const showExpanded = !isMobile || isExpanded || (!hasCompletedTour && !isViewingShared);

  return (
    <AnimatePresence>
      {!selectedAlbumId && !isViewingShared && !isAddModalOpen && !isRecommendationsOpen && !isFeedOpen && vaultName && (
        <motion.aside
          id="top-right-controls"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.45, delay: 0.15 }}
          className={`absolute right-4 top-4 z-30 md:right-8 md:top-8 ${
            showExpanded ? 'w-[280px] md:w-[330px] rounded-2xl glass' : 'w-auto'
          }`}
        >
          {!showExpanded ? (
            <button
              onClick={() => setIsExpanded(true)}
              className="flex h-10 px-3.5 items-center justify-center gap-1.5 rounded-full glass cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-white/60 text-zinc-800 hover:text-zinc-950 transition-all active:scale-95 font-display text-[10px] font-bold uppercase tracking-wider"
              title="Open Menu"
            >
              <Globe size={13} className="text-orange-500 animate-pulse" />
              <span>Feed & Menu</span>
            </button>
          ) : (
            <>
              <div className="flex w-full items-center gap-1.5 p-2 border-b border-white/20">
                {/* Feed Button */}
                <button
                  onClick={() => setFeedOpen(!isFeedOpen)}
                  className={`flex-1 py-1.5 rounded-xl text-[10px] font-display font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 glass-btn ${
                    isFeedOpen ? 'glass-btn-active font-extrabold' : 'text-zinc-800'
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
                  className="flex-1 py-1.5 rounded-xl text-[10px] font-display font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 glass-btn text-zinc-800"
                  title="Share room link"
                >
                  <Link size={11} /> {shareCopied ? 'Copied!' : 'Share'}
                </button>

                {/* Tune Button */}
                <button
                  type="button"
                  onClick={() => setIsOpen((prev) => !prev)}
                  className={`flex-1 py-1.5 rounded-xl text-[10px] font-display font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 glass-btn ${
                    isOpen ? 'glass-btn-active font-extrabold' : 'text-zinc-800'
                  }`}
                  title="Tune Globe & Settings"
                >
                  <SlidersHorizontal size={11} /> Tune
                </button>

                {/* Close Button on mobile */}
                {isMobile && (
                  <button
                    onClick={() => {
                      setIsExpanded(false);
                      setIsOpen(false);
                    }}
                    className="p-1.5 rounded-lg glass-btn text-zinc-500 hover:text-zinc-800 cursor-pointer flex items-center justify-center"
                    title="Collapse Menu"
                  >
                    <X size={12} />
                  </button>
                )}
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
                        className={`flex w-full items-center justify-between rounded-xl p-2.5 transition-all cursor-pointer glass-btn ${
                          canEditAlbums
                            ? 'bg-orange-500/10 text-orange-855 border-orange-300'
                            : 'text-zinc-650 border-white/40'
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

                      <div className="flex flex-col gap-1.5 rounded-xl border border-white/40 bg-white/40 p-3 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
                        <span className="text-[10px] font-display font-bold uppercase tracking-wider text-zinc-700">
                          Room Name
                        </span>
                        <div className="relative flex items-center">
                          <input 
                            type="text" 
                            value={vaultName}
                            onChange={(e) => setVaultName(e.target.value)}
                            placeholder="Name your vault" 
                            className="w-full rounded-lg border border-white/50 bg-white/80 py-1.5 px-3 text-base md:text-[11px] font-semibold outline-none focus:border-orange-500 focus:bg-white transition-all"
                          />
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
                        className="flex flex-col gap-2 rounded-xl border border-white/40 bg-white/40 p-3 shadow-[0_4px_12px_rgba(0,0,0,0.02)]"
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
                             className="min-w-0 flex-1 rounded-lg border border-white/50 bg-white/80 py-1.5 px-3 text-base md:text-[11px] outline-none focus:border-orange-500 focus:bg-white transition-all"
                           />
                           <button 
                             type="submit" 
                             disabled={isSyncing || !lfmUser.trim()}
                             className="shrink-0 rounded-lg text-zinc-955 px-3 py-1.5 text-[10px] font-display font-bold uppercase tracking-widest transition-all glass-btn cursor-pointer"
                           >
                             {isSyncing ? 'Syncing...' : 'Sync'}
                           </button>
                        </div>
                      </form>

                      {/* Cloud Sync Backup & Restore */}
                      {isFirebaseConfigured ? (
                        <div className="flex flex-col gap-2 rounded-xl border border-white/40 bg-white/40 p-3 shadow-[0_4px_12px_rgba(0,0,0,0.02)] text-zinc-900">
                          <span className="flex items-center gap-1.5 text-[10px] font-display font-bold uppercase tracking-wider text-zinc-700">
                            <Cloud size={12} className="text-orange-500" />
                            Cloud Sync & Backup
                          </span>
                          
                          <div className="flex flex-col gap-2">
                            <button
                              type="button"
                              disabled={isCloudLoading || !vaultName.trim()}
                              onClick={async () => {
                                setIsCloudLoading(true);
                                setCloudStatus('');
                                setCloudError('');
                                const res = await backupRoomToCloud();
                                setIsCloudLoading(false);
                                if (res.success) {
                                  setCloudStatus('Backed up successfully!');
                                  setTimeout(() => setCloudStatus(''), 3000);
                                } else {
                                  setCloudError(res.error || 'Backup failed');
                                }
                              }}
                              className="w-full flex items-center justify-center gap-1.5 rounded-lg py-2 px-3 text-[10px] font-display font-bold uppercase tracking-wider transition-all glass-btn text-zinc-850 cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                            >
                              <UploadCloud size={12} />
                              {isCloudLoading ? 'Backing up...' : 'Backup Current Room'}
                            </button>
                            
                            <div className="h-px bg-white/20 my-1" />
                            
                            <span className="text-[8.5px] font-display font-bold uppercase tracking-widest text-zinc-400">
                              Restore / Sync Another Device
                            </span>
                            
                            <div className="flex gap-2">
                               <input 
                                type="text" 
                                value={restoreName}
                                onChange={(e) => setRestoreName(e.target.value)}
                                placeholder="Enter Room Name to Load" 
                                className="min-w-0 flex-1 rounded-lg border border-white/50 bg-white/80 py-1.5 px-3 text-base md:text-[11px] outline-none focus:border-orange-500 focus:bg-white transition-all"
                              />
                              <button 
                                type="button" 
                                disabled={isCloudLoading || !restoreName.trim()}
                                onClick={async () => {
                                  setIsCloudLoading(true);
                                  setCloudStatus('');
                                  setCloudError('');
                                  const res = await restoreRoomFromCloud(restoreName);
                                  setIsCloudLoading(false);
                                  if (res.success) {
                                    setCloudStatus('Room restored successfully!');
                                    setRestoreName('');
                                    setTimeout(() => setCloudStatus(''), 3000);
                                  } else {
                                    setCloudError(res.error || 'Restore failed');
                                  }
                                }}
                                className="shrink-0 rounded-lg text-zinc-955 px-3 py-1.5 text-[10px] font-display font-bold uppercase tracking-widest transition-all glass-btn cursor-pointer disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1"
                              >
                                <DownloadCloud size={11} /> Load
                              </button>
                            </div>
                          </div>

                          {cloudStatus && (
                            <p className="text-[9px] font-display font-bold uppercase text-emerald-600 mt-1">{cloudStatus}</p>
                          )}
                          {cloudError && (
                            <p className="text-[9px] font-display font-bold uppercase text-red-600 mt-1">{cloudError}</p>
                          )}
                        </div>
                      ) : null}

                      {isPublished && (
                        <div className="flex flex-col gap-2 rounded-xl border border-white/40 bg-white/40 p-3 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-[10px] font-display font-bold uppercase tracking-wider text-zinc-700">
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                              </span>
                              Room is Public
                            </span>
                            <button
                              type="button"
                              onClick={() => unpublishRoom()}
                              className="text-[9px] font-display font-extrabold uppercase tracking-widest text-red-500 hover:text-red-700 transition cursor-pointer"
                            >
                              Go Offline
                            </button>
                          </div>
                        </div>
                      )}

                      {isFirebaseConfigured && <div className="h-px bg-white/40" />}

                      {controlRows.map((row) => (
                        <label key={row.key} className="grid gap-1.5 pt-1.5 pb-2 border-b border-white/20">
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
            </>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

export default SceneControlsOverlay;
