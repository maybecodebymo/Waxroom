import { AnimatePresence, motion } from 'framer-motion';
import { Link, SlidersHorizontal, Globe, X, Cloud, Send, LogIn, LogOut, UserCheck, Disc, Plus, Trash2, Music } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { compressToEncodedURIComponent } from 'lz-string';
import { useGalleryStore } from '../../store/useGalleryStore';
import { fetchLastFmRoom } from '../../utils/lastFmService';
import { isFirebaseConfigured, auth } from '../../utils/firebase';
import { signOut } from 'firebase/auth';
import AuthModal from './AuthModal';

// PKCE authorization helper functions
const generateRandomString = (length) => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], '');
};

const sha256 = async (plain) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
};

const base64urlencode = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

const generateCodeChallenge = async (codeVerifier) => {
  const hashed = await sha256(codeVerifier);
  return base64urlencode(hashed);
};

function SceneControlsOverlay() {
  const canEditAlbums = useGalleryStore((state) => state.canEditAlbums);
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
  const tourStepIndex = useGalleryStore((state) => state.tourStepIndex || 0);

  const backupRoomToCloud = useGalleryStore((state) => state.backupRoomToCloud);
  const isPublished = useGalleryStore((state) => state.isPublished);
  const publishedDescription = useGalleryStore((state) => state.publishedDescription);
  const lastPublishedVaultName = useGalleryStore((state) => state.lastPublishedVaultName);
  const unpublishRoom = useGalleryStore((state) => state.unpublishRoom);
  const publishRoom = useGalleryStore((state) => state.publishRoom);
  const myAlbums = useGalleryStore((state) => state.myAlbums);

  const user = useGalleryStore((state) => state.user);
  const crateInbox = useGalleryStore((state) => state.crateInbox);
  const hasUnseenCrateItems = useGalleryStore((state) => state.hasUnseenCrateItems);
  const lastFmUsername = useGalleryStore((state) => state.lastFmUsername);
  const setLastFmUsername = useGalleryStore((state) => state.setLastFmUsername);

  // Multi-room store hooks
  const rooms = useGalleryStore((state) => state.rooms);
  const activeRoomId = useGalleryStore((state) => state.activeRoomId);
  const createNewRoom = useGalleryStore((state) => state.createNewRoom);
  const switchRoom = useGalleryStore((state) => state.switchRoom);
  const deleteRoom = useGalleryStore((state) => state.deleteRoom);

  // Spotify store hooks
  const spotifyAccessToken = useGalleryStore((state) => state.spotifyAccessToken);
  const populateRoomFromSpotify = useGalleryStore((state) => state.populateRoomFromSpotify);

  // History state hooks
  const isHistoryOpen = useGalleryStore((state) => state.isHistoryOpen);
  const setHistoryOpen = useGalleryStore((state) => state.setHistoryOpen);

  const [isMobile, setIsMobile] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lfmUser, setLfmUser] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const [cloudStatus, setCloudStatus] = useState('');
  const [cloudError, setCloudError] = useState('');
  const [isCloudLoading, setIsCloudLoading] = useState(false);
  const [description, setDescription] = useState('');

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const isAddModalOpen = useGalleryStore((state) => state.isAddModalOpen);
  const isRecommendationsOpen = useGalleryStore((state) => state.isRecommendationsOpen);

  // Local inputs
  const [newRoomName, setNewRoomName] = useState('');
  const [isSpotifyImporting, setIsSpotifyImporting] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

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

  const showExpanded = !isMobile || isExpanded || (!hasCompletedTour && !isViewingShared && tourStepIndex >= 3);
  const activeRoom = timelineRooms.find(r => 
    r.ownerName?.toLowerCase().trim() === vaultName?.toLowerCase().trim() ||
    r.ownerName?.toLowerCase().trim() === lastPublishedVaultName?.toLowerCase().trim()
  );
  const isCurrentlyPublished = isPublished || !!activeRoom;
  const displayDescription = publishedDescription || activeRoom?.description || '';

  useEffect(() => {
    setDescription(displayDescription);
  }, [displayDescription]);

  const getActiveMenuLabel = () => {
    if (isFeedOpen) return 'Feed';
    if (isHistoryOpen) return 'Crate';
    if (isOpen) return 'Tune';
    if (shareCopied) return 'Copied!';
    return 'Select Option';
  };

  return (
    <AnimatePresence>
      {!selectedAlbumId && !isViewingShared && !isAddModalOpen && !isRecommendationsOpen && !isFeedOpen && !isHistoryOpen && vaultName && (
        <motion.aside
          id="top-right-controls"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.45, delay: 0.15 }}
          className={`absolute right-4 top-[72px] md:top-8 z-30 md:right-8 ${
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
              {isMobile ? (
                /* Mobile Menu View */
                <div className="w-full p-3 flex flex-col gap-2 relative">
                  {/* Menu Title and Close button */}
                  <div className="flex items-center justify-between pb-1.5 border-b border-white/20">
                    <span className="text-[10px] font-display font-extrabold uppercase tracking-widest text-zinc-400">
                      Menu Controls
                    </span>
                    <button
                      onClick={() => {
                        setIsExpanded(false);
                        setIsOpen(false);
                        setFeedOpen(false);
                        setHistoryOpen(false);
                      }}
                      className="p-1 rounded-lg glass-btn text-zinc-500 hover:text-zinc-850 cursor-pointer flex items-center justify-center"
                      title="Close Menu"
                    >
                      <X size={12} />
                    </button>
                  </div>

                  {/* Vertical stack of actions */}
                  <div className="flex flex-col gap-1.5">
                    {/* Feed Button */}
                    <button
                      id="feed-nav-btn"
                      onClick={() => {
                        setFeedOpen(!isFeedOpen);
                        setHistoryOpen(false);
                        setIsOpen(false);
                      }}
                      className={`w-full py-2.5 px-4 rounded-xl text-[10px] font-display font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 hover:bg-white/40 ${
                        isFeedOpen ? 'glass-btn-active font-bold' : 'glass-btn text-zinc-800'
                      }`}
                    >
                      <Globe size={11} className={isFeedOpen ? 'animate-pulse' : ''} /> Feed
                    </button>

                    {/* Crate Button */}
                    {canEditAlbums && (
                      <button
                        id="crate-nav-btn"
                        onClick={() => {
                          setHistoryOpen(!isHistoryOpen);
                          setFeedOpen(false);
                          setIsOpen(false);
                        }}
                        className={`w-full py-2.5 px-4 rounded-xl text-[10px] font-display font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 hover:bg-white/40 ${
                          isHistoryOpen
                            ? 'glass-btn-active font-bold'
                            : `glass-btn text-zinc-800 ${
                                hasUnseenCrateItems && crateInbox?.length > 0
                                  ? '!border-orange-500/30 !shadow-[0_0_6px_rgba(249,115,22,0.15)]'
                                  : ''
                              }`
                        }`}
                      >
                        <Disc size={11} className={crateInbox?.length > 0 ? 'animate-pulse text-orange-500' : ''} /> Crate
                      </button>
                    )}

                    {/* Share Button */}
                    <button
                      onClick={async () => {
                        let shareUrl = '';
                        if (isFirebaseConfigured) {
                          if (isCurrentlyPublished) {
                            const uid = user ? user.uid : 'anonymous';
                            shareUrl = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(uid + "_" + activeRoomId)}`;
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
                          setTimeout(() => setShareCopied(false), 3500);
                        }).catch((err) => {
                          console.error('Clipboard write failed:', err);
                        });
                      }}
                      className="w-full py-2.5 px-4 rounded-xl text-[10px] font-display font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 glass-btn text-zinc-800"
                    >
                      <Link size={11} /> {shareCopied ? 'Copied Link!' : 'Share Room'}
                    </button>

                    {/* Tune Button */}
                    <button
                      id="tune-nav-btn"
                      type="button"
                      onClick={() => {
                        setIsOpen(!isOpen);
                        setFeedOpen(false);
                        setHistoryOpen(false);
                      }}
                      className={`w-full py-2.5 px-4 rounded-xl text-[10px] font-display font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 hover:bg-white/40 ${
                        isOpen ? 'glass-btn-active font-bold' : 'glass-btn text-zinc-800'
                      }`}
                    >
                      <SlidersHorizontal size={11} /> Tune
                    </button>
                  </div>
                </div>
              ) : (
                /* Desktop View: Horizontal Row */
                <div className="flex w-full items-center gap-1.5 p-2 border-b border-white/20">
                  {/* Feed Button */}
                  <button
                    id="feed-nav-btn"
                    onClick={() => setFeedOpen(!isFeedOpen)}
                    className={`flex-1 py-1.5 rounded-xl text-[10px] font-display font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 glass-btn ${
                      isFeedOpen ? 'glass-btn-active font-bold' : 'text-zinc-800'
                    }`}
                    title="Explore Community Rooms"
                  >
                    <Globe size={11} /> Feed
                  </button>

                  {/* Crate Button */}
                  {canEditAlbums && (
                    <button
                      id="crate-nav-btn"
                      onClick={() => setHistoryOpen(!isHistoryOpen)}
                      className={`flex-1 py-1.5 rounded-xl text-[10px] font-display font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 glass-btn ${
                        isHistoryOpen ? 'glass-btn-active font-bold' : 'text-zinc-800'
                      } ${
                        hasUnseenCrateItems && crateInbox?.length > 0 && !isHistoryOpen
                          ? '!border-orange-500/30 !shadow-[0_0_6px_rgba(249,115,22,0.15)]'
                          : ''
                      }`}
                      title="Inbox & History"
                    >
                      <Disc size={11} className={crateInbox?.length > 0 ? "animate-pulse text-orange-500" : ""} /> Crate
                    </button>
                  )}

                  {/* Share Button */}
                  <button
                    onClick={async () => {
                      let shareUrl = '';
                      
                      if (isFirebaseConfigured) {
                        if (isCurrentlyPublished) {
                          const uid = user ? user.uid : 'anonymous';
                          shareUrl = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(uid + "_" + activeRoomId)}`;
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
                        setTimeout(() => setShareCopied(false), 3500);
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
                    id="tune-nav-btn"
                    type="button"
                    onClick={() => setIsOpen((prev) => !prev)}
                    className={`flex-1 py-1.5 rounded-xl text-[10px] font-display font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 glass-btn ${
                      isOpen ? 'glass-btn-active font-bold' : 'text-zinc-800'
                    }`}
                    title="Tune Globe & Settings"
                  >
                    <SlidersHorizontal size={11} /> Tune
                  </button>
                </div>
              )}

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
                      {/* Cloud Sync / Profile Dashboard (Moved to Top) */}
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

                      {/* Multi-Room Manager */}
                      <div className="flex flex-col gap-2 rounded-xl border border-white/40 bg-white/40 p-3 shadow-[0_4px_12px_rgba(0,0,0,0.02)] text-zinc-900">
                        <span className="flex items-center gap-1.5 text-[10px] font-display font-bold uppercase tracking-wider text-zinc-700">
                          <SlidersHorizontal size={12} className="text-orange-500" />
                          Multi-Room Selector
                        </span>
                        
                        <div className="flex gap-2 items-center">
                          <select
                            value={activeRoomId}
                            onChange={(e) => switchRoom(e.target.value)}
                            className="min-w-0 flex-1 rounded-lg border border-white/50 bg-white/80 py-1.5 px-2.5 text-[11px] font-semibold outline-none focus:border-orange-500 focus:bg-white transition-all text-zinc-900"
                          >
                            {rooms.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name || 'Unnamed Room'}
                              </option>
                            ))}
                          </select>
                          {rooms.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete this room?`)) {
                                  deleteRoom(activeRoomId);
                                }
                              }}
                              className="shrink-0 p-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 cursor-pointer transition active:scale-95 flex items-center justify-center"
                              title="Delete current room"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>

                        {/* Create Room Form */}
                        <div className="flex gap-1.5 mt-1">
                          <input
                            type="text"
                            value={newRoomName}
                            onChange={(e) => setNewRoomName(e.target.value)}
                            placeholder="New room name..."
                            className="min-w-0 flex-1 rounded-lg border border-white/50 bg-white/80 py-1 px-2.5 text-[10px] outline-none focus:border-orange-500 focus:bg-white transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const name = newRoomName.trim();
                              if (!name) return;
                              createNewRoom(name);
                              setNewRoomName('');
                            }}
                            className="shrink-0 rounded-lg text-zinc-955 px-2.5 py-1 text-[10px] font-display font-bold uppercase tracking-widest transition-all glass-btn cursor-pointer"
                          >
                            Add
                          </button>
                        </div>
                      </div>

                      {/* Streaming Connectors Section */}
                      <div className="flex flex-col gap-2 rounded-xl border border-white/40 bg-white/40 p-3 shadow-[0_4px_12px_rgba(0,0,0,0.02)] text-zinc-900">
                        <span className="flex items-center gap-1.5 text-[10px] font-display font-bold uppercase tracking-wider text-zinc-700">
                          <Music size={12} className="text-orange-500" />
                          Streaming Services
                        </span>

                        {/* Spotify Auth section */}
                        <div className="space-y-2 border-b border-white/20 pb-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[9.5px] font-display font-bold uppercase tracking-wide text-zinc-800">
                              Spotify Link
                            </span>
                            {spotifyAccessToken ? (
                              <span className="text-[8.5px] font-display font-bold uppercase tracking-widest text-emerald-600">
                                Connected
                              </span>
                            ) : (
                              <span className="text-[8.5px] font-display font-bold uppercase tracking-widest text-zinc-400">
                                Disconnected
                              </span>
                            )}
                          </div>

                          {spotifyAccessToken ? (
                            <div className="space-y-1.5">
                              <p className="text-[9px] text-zinc-500 font-body leading-tight">
                                Stream active listening scrobbles directly. You can also import:
                              </p>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  disabled={isSpotifyImporting}
                                  onClick={async () => {
                                    setIsSpotifyImporting(true);
                                    const res = await populateRoomFromSpotify('tracks');
                                    setIsSpotifyImporting(false);
                                    if (res.success) {
                                      alert(`Imported ${res.count} top tracks into your room shelf!`);
                                    } else {
                                      alert(`Import failed: ${res.error}`);
                                    }
                                  }}
                                  className="flex-1 rounded-lg text-zinc-800 py-1 px-2 text-[8.5px] font-display font-bold uppercase tracking-wider transition-all glass-btn cursor-pointer text-center"
                                >
                                  Top Tracks
                                </button>
                                <button
                                  type="button"
                                  disabled={isSpotifyImporting}
                                  onClick={async () => {
                                    setIsSpotifyImporting(true);
                                    const res = await populateRoomFromSpotify('albums');
                                    setIsSpotifyImporting(false);
                                    if (res.success) {
                                      alert(`Imported ${res.count} saved albums into your room shelf!`);
                                    } else {
                                      alert(`Import failed: ${res.error}`);
                                    }
                                  }}
                                  className="flex-1 rounded-lg text-zinc-800 py-1 px-2 text-[8.5px] font-display font-bold uppercase tracking-wider transition-all glass-btn cursor-pointer text-center"
                                >
                                  Saved Albums
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  useGalleryStore.setState({ spotifyAccessToken: '', spotifyTokenExpiry: 0 });
                                }}
                                className="w-full text-center text-[8px] font-display font-bold uppercase tracking-wider text-red-500 hover:text-red-700 cursor-pointer pt-0.5"
                              >
                                Disconnect Spotify
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const clientId = 'da12502621fc4df59451be213b1f51ee';
                                    const redirectUri = window.location.origin + window.location.pathname;
                                    const scopes = 'user-read-currently-playing user-top-read user-library-read';
                                    
                                    const verifier = generateRandomString(64);
                                    localStorage.setItem('spotify_code_verifier', verifier);
                                    
                                    const challenge = await generateCodeChallenge(verifier);
                                    
                                    const authUrl = new URL("https://accounts.spotify.com/authorize");
                                    authUrl.search = new URLSearchParams({
                                      response_type: 'code',
                                      client_id: clientId,
                                      scope: scopes,
                                      redirect_uri: redirectUri,
                                      code_challenge_method: 'S256',
                                      code_challenge: challenge,
                                      show_dialog: 'true'
                                    }).toString();
                                    
                                    window.location.href = authUrl.toString();
                                  } catch (err) {
                                    console.error('Failed to initiate Spotify login:', err);
                                    alert('Failed to connect to Spotify: ' + err.message);
                                  }
                                }}
                                className="w-full flex items-center justify-center gap-1.5 rounded-lg py-1.5 px-3 text-[10px] font-display font-bold uppercase tracking-wider transition-all glass-btn text-zinc-850 cursor-pointer"
                              >
                                Connect Spotify
                              </button>
                            </div>
                          )}
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
                                  className="flex-1 rounded-lg text-red-600 py-1.5 px-3 text-[10px] font-display font-bold uppercase tracking-wider transition-all glass-btn cursor-pointer text-center"
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
