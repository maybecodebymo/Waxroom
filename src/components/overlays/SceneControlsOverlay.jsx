import { AnimatePresence, motion } from 'framer-motion';
import { Database, Link, SlidersHorizontal, Globe, Settings, X, UploadCloud, DownloadCloud, Cloud, Send, LogIn, LogOut, UserCheck, Disc } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { compressToEncodedURIComponent } from 'lz-string';
import { useGalleryStore } from '../../store/useGalleryStore';
import { fetchLastFmRoom } from '../../utils/lastFmService';
import { isFirebaseConfigured, auth } from '../../utils/firebase';
import { signOut } from 'firebase/auth';
import AuthModal from './AuthModal';

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
  const timelineRooms = useGalleryStore((state) => state.timelineRooms);
  const [isOpen, setIsOpen] = useState(false);
  const selectedAlbumId = useGalleryStore((state) => state.selectedAlbumId);
  const replaceRoom = useGalleryStore((state) => state.replaceRoom);
  const containerRef = useRef(null);

  const hasCompletedTour = useGalleryStore((state) => state.hasCompletedTour);
  const isViewingShared = useGalleryStore((state) => state.isViewingShared);

  const backupRoomToCloud = useGalleryStore((state) => state.backupRoomToCloud);
  const restoreRoomFromCloud = useGalleryStore((state) => state.restoreRoomFromCloud);
  const isPublished = useGalleryStore((state) => state.isPublished);
  const publishedDescription = useGalleryStore((state) => state.publishedDescription);
  const lastPublishedVaultName = useGalleryStore((state) => state.lastPublishedVaultName);
  const unpublishRoom = useGalleryStore((state) => state.unpublishRoom);
  const publishRoom = useGalleryStore((state) => state.publishRoom);
  const myAlbums = useGalleryStore((state) => state.myAlbums);

  const user = useGalleryStore((state) => state.user);
  const crateInbox = useGalleryStore((state) => state.crateInbox);
  const addToShelfFromCrate = useGalleryStore((state) => state.addToShelfFromCrate);
  const removeFromCrate = useGalleryStore((state) => state.removeFromCrate);
  const clearCrate = useGalleryStore((state) => state.clearCrate);
  const lastFmUsername = useGalleryStore((state) => state.lastFmUsername);
  const setLastFmUsername = useGalleryStore((state) => state.setLastFmUsername);

  const [isMobile, setIsMobile] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lfmUser, setLfmUser] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const [cloudStatus, setCloudStatus] = useState('');
  const [cloudError, setCloudError] = useState('');
  const [isCloudLoading, setIsCloudLoading] = useState(false);
  const [restoreName, setRestoreName] = useState('');
  const [description, setDescription] = useState('');

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const isAddModalOpen = useGalleryStore((state) => state.isAddModalOpen);
  const isRecommendationsOpen = useGalleryStore((state) => state.isRecommendationsOpen);

  useEffect(() => {
    if (lastFmUsername) {
      setLfmUser(lastFmUsername);
    }
  }, [lastFmUsername]);

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
  const activeRoom = timelineRooms.find(r => 
    r.ownerName?.toLowerCase().trim() === vaultName?.toLowerCase().trim() ||
    r.ownerName?.toLowerCase().trim() === lastPublishedVaultName?.toLowerCase().trim()
  );
  const isCurrentlyPublished = isPublished || !!activeRoom;
  const displayDescription = publishedDescription || activeRoom?.description || '';

  useEffect(() => {
    setDescription(displayDescription);
  }, [displayDescription]);

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
                    isFeedOpen ? 'glass-btn-active font-bold' : 'text-zinc-800'
                  }`}
                  title="Explore Community Rooms"
                >
                  <Globe size={11} /> Feed
                </button>

                {/* Share Button */}
                <button
                  onClick={async () => {
                    let shareUrl = '';
                    
                    if (isFirebaseConfigured) {
                      if (isCurrentlyPublished) {
                        const roomKey = (lastPublishedVaultName || vaultName || '').toLowerCase().trim();
                        if (roomKey) {
                          shareUrl = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(roomKey)}`;
                        }
                      }
                      
                      if (!shareUrl) {
                        const res = await useGalleryStore.getState().shareRoomToCloud();
                        if (res.success && res.id) {
                          shareUrl = `${window.location.origin}${window.location.pathname}?s=${res.id}`;
                        }
                      }
                    }
                    
                    if (!shareUrl) {
                      const albums = useGalleryStore.getState().albums;
                      const lightweight = albums.map(a => ({
                        ...a,
                        texture_url: a.texture_url?.startsWith('data:') ? '' : a.texture_url,
                      }));
                      const compressed = compressToEncodedURIComponent(JSON.stringify(lightweight));
                      const displayName = vaultName || 'Anonymous';
                      const byParam = `&by=${encodeURIComponent(displayName)}`;
                      shareUrl = `${window.location.origin}${window.location.pathname}?v=${compressed}${byParam}`;
                    }

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
                    isOpen ? 'glass-btn-active font-bold' : 'text-zinc-800'
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
                            setLastFmUsername(lfmUser.trim());
                            const newRoom = await fetchLastFmRoom(lfmUser.trim(), import.meta.env.VITE_LASTFM_API_KEY);
                            if (newRoom.length > 0) {
                              replaceRoom(newRoom);
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

                      {/* Cloud Sync / Profile Dashboard */}
                      {isFirebaseConfigured ? (
                        <div className="flex flex-col gap-2 rounded-xl border border-white/40 bg-white/40 p-3 shadow-[0_4px_12px_rgba(0,0,0,0.02)] text-zinc-900">
                          <span className="flex items-center gap-1.5 text-[10px] font-display font-bold uppercase tracking-wider text-zinc-700">
                            <UserCheck size={12} className="text-orange-500" />
                            Selector Profile
                          </span>
                          
                          {user ? (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-2 bg-white/50 rounded-lg p-2 border border-white/30">
                                <div className="min-w-0 flex-1">
                                  <p className="text-[10px] font-display font-bold uppercase tracking-wider text-zinc-900 truncate">
                                    {user.displayName}
                                  </p>
                                  <p className="text-[8.5px] font-display font-bold uppercase tracking-widest text-zinc-400 truncate mt-0.5">
                                    {user.isAnonymous ? 'Guest Collector' : user.email}
                                  </p>
                                </div>
                                {user.isAnonymous ? (
                                  <button
                                    type="button"
                                    onClick={() => setIsAuthModalOpen(true)}
                                    className="shrink-0 flex items-center justify-center gap-1 rounded-md bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 text-[8.5px] font-display font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                                  >
                                    Link Profile
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      try {
                                        await signOut(auth);
                                      } catch (err) {
                                        console.error('Sign out failed:', err);
                                      }
                                    }}
                                    className="shrink-0 flex items-center justify-center gap-1 rounded-md bg-zinc-700 hover:bg-zinc-800 text-white px-2 py-1 text-[8.5px] font-display font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                                  >
                                    Log Out
                                  </button>
                                )}
                              </div>
                              
                              {user.isAnonymous && (
                                <p className="text-[8.5px] text-zinc-500 leading-relaxed font-body">
                                  Your room is stored locally. Link your profile to restore it across other devices.
                                </p>
                              )}
                              
                              <button
                                type="button"
                                disabled={isCloudLoading}
                                onClick={async () => {
                                  setIsCloudLoading(true);
                                  setCloudStatus('');
                                  setCloudError('');
                                  const res = await backupRoomToCloud();
                                  setIsCloudLoading(false);
                                  if (res.success) {
                                    setCloudStatus('Sync completed!');
                                    setTimeout(() => setCloudStatus(''), 3000);
                                  } else {
                                    setCloudError(res.error || 'Backup failed');
                                  }
                                }}
                                className="w-full flex items-center justify-center gap-1.5 rounded-lg py-2 px-3 text-[10px] font-display font-bold uppercase tracking-wider transition-all glass-btn text-zinc-850 cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                              >
                                <Cloud size={12} className="text-orange-500 animate-pulse" />
                                {isCloudLoading ? 'Syncing...' : 'Sync Room to Cloud'}
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setIsAuthModalOpen(true)}
                              className="w-full flex items-center justify-center gap-1.5 rounded-lg py-2 px-3 text-[10px] font-display font-bold uppercase tracking-wider transition-all glass-btn text-zinc-850 cursor-pointer"
                            >
                              <LogIn size={12} className="text-orange-500" /> Sign In / Create Profile
                            </button>
                          )}

                          {cloudStatus && (
                            <p className="text-[9px] font-display font-bold uppercase text-emerald-600 mt-1">{cloudStatus}</p>
                          )}
                          {cloudError && (
                            <p className="text-[9px] font-display font-bold uppercase text-red-600 mt-1">{cloudError}</p>
                          )}
                        </div>
                      ) : null}

                      {/* Crate Inbox (Airbuds-style Auto-Collected Shelf) */}
                      {canEditAlbums && crateInbox && crateInbox.length > 0 ? (
                        <div className="flex flex-col gap-2 rounded-xl border border-white/40 bg-white/40 p-3 shadow-[0_4px_12px_rgba(0,0,0,0.02)] text-zinc-900">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-[10px] font-display font-bold uppercase tracking-wider text-zinc-700">
                              <Disc size={12} className="text-orange-500 animate-spin" style={{ animationDuration: '4s' }} />
                              Crate Inbox ({crateInbox.length})
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm('Clear all items from your Crate?')) {
                                  clearCrate();
                                }
                              }}
                              className="text-[8.5px] font-display font-bold uppercase tracking-widest text-red-500 hover:text-red-700 transition cursor-pointer"
                            >
                              Clear
                            </button>
                          </div>
                          
                          <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                            {crateInbox.map((album) => (
                              <div key={album.id} className="flex items-center gap-2 bg-white/50 border border-white/40 rounded-lg p-2">
                                <img
                                  src={album.texture_url || '/placeholder-album.png'}
                                  alt={album.album_title}
                                  className="h-9 w-9 rounded object-cover shadow-sm bg-zinc-200 shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="text-[9.5px] font-display font-bold uppercase tracking-wide text-zinc-900 truncate leading-snug">
                                    {album.album_title}
                                  </p>
                                  <p className="text-[8.5px] font-display font-medium text-zinc-500 truncate leading-none mt-0.5">
                                    {album.artist}
                                  </p>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => addToShelfFromCrate(album.id)}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white rounded px-2 py-1 text-[8.5px] font-display font-bold uppercase tracking-wider cursor-pointer active:scale-95 transition-all"
                                    title="Add to Shelf"
                                  >
                                    Keep
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeFromCrate(album.id)}
                                    className="bg-zinc-200 hover:bg-zinc-300 text-zinc-700 rounded px-2 py-1 text-[8.5px] font-display font-bold uppercase tracking-wider cursor-pointer active:scale-95 transition-all"
                                    title="Discard"
                                  >
                                    X
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                          <p className="text-[8px] font-display font-bold uppercase tracking-widest text-zinc-400 text-center leading-normal mt-0.5">
                            Recent scrobbles are auto-collected here.
                          </p>
                        </div>
                      ) : null}

                      {vaultName && (
                        <div className="flex flex-col gap-2 rounded-xl border border-white/40 bg-white/40 p-3 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
                          <div className="flex items-center justify-between font-display text-[10px] font-bold uppercase tracking-wider text-zinc-750">
                            <span className="flex items-center gap-1.5">
                              <span className="relative flex h-1.5 w-1.5">
                                {isCurrentlyPublished ? (
                                  <>
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                  </>
                                ) : (
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-zinc-400"></span>
                                )}
                              </span>
                              {isCurrentlyPublished ? 'Live' : 'Not Live'}
                            </span>
                            
                            {/* Toggle Switch */}
                            <button
                              type="button"
                              onClick={() => {
                                if (isCurrentlyPublished) {
                                  unpublishRoom(activeRoom?.id);
                                } else {
                                  publishRoom(description.trim());
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

                          <form
                            onSubmit={async (e) => {
                              e.preventDefault();
                              try {
                                await publishRoom(description.trim());
                              } catch (err) {
                                console.error('Publish failed:', err);
                              }
                            }}
                            className="mt-2 space-y-2 text-zinc-900"
                          >
                            <textarea
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              placeholder="Tell the community about your wax shelf... (e.g. Vintage jazz & late night ambient)"
                              rows={2}
                              maxLength={100}
                              className="w-full text-base md:text-[11px] rounded-lg border border-white/50 bg-white/80 p-2 outline-none placeholder:text-zinc-400 text-zinc-800 resize-none focus:bg-white focus:border-orange-500 transition-all shadow-sm"
                            />
                            {isCurrentlyPublished ? (
                              <div className="flex gap-2">
                                <button
                                  type="submit"
                                  disabled={description.trim() === displayDescription || myAlbums.length === 0}
                                  className="flex-1 rounded-lg text-zinc-800 py-1.5 px-3 text-[10px] font-display font-bold uppercase tracking-wider transition-all glass-btn cursor-pointer disabled:opacity-40 disabled:pointer-events-none text-center"
                                >
                                  Save Changes
                                </button>
                                <button
                                  type="button"
                                  onClick={() => unpublishRoom(activeRoom?.id)}
                                  className="flex-1 rounded-lg text-red-655 text-red-600 py-1.5 px-3 text-[10px] font-display font-bold uppercase tracking-wider transition-all glass-btn cursor-pointer text-center"
                                >
                                  Go Offline
                                </button>
                              </div>
                            ) : (
                              <button
                                type="submit"
                                disabled={myAlbums.length === 0}
                                className="w-full flex items-center justify-center gap-1.5 rounded-lg text-zinc-800 py-1.5 px-3 text-[10px] font-display font-bold uppercase tracking-wider transition-all glass-btn cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                              >
                                <Send size={10} /> Go Live
                              </button>
                            )}
                          </form>
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
      <AnimatePresence>
        {isAuthModalOpen && (
          <AuthModal onClose={() => setIsAuthModalOpen(false)} />
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}

export default SceneControlsOverlay;
