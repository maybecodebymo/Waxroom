import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Disc, Volume2, VolumeX } from 'lucide-react';
import { useGalleryStore } from '../../store/useGalleryStore';

function NowPlayingPanel() {
  const isViewingShared = useGalleryStore((state) => state.isViewingShared);
  const sharedOwnerName = useGalleryStore((state) => state.sharedOwnerName);
  const vaultName = useGalleryStore((state) => state.vaultName);
  const activeTrack = useGalleryStore((state) => state.activeTrack);
  const isPlayingStore = useGalleryStore((state) => state.isPlaying);
  const livePlayback = useGalleryStore((state) => state.livePlayback);
  const activeRoomPlayback = useGalleryStore((state) => state.activeRoomPlayback);

  // Preview player local state
  const [localPlaying, setLocalPlaying] = useState(false);
  const audioRef = useRef(null);

  // Decide what to display based on playback precedence
  let current = null;
  let isPlaying = false;
  let isLive = false;

  if (activeTrack) {
    current = {
      title: activeTrack.title,
      artist: activeTrack.artist || activeTrack.artistName || 'Unknown Artist',
      album: activeTrack.album || activeTrack.albumTitle || 'Unknown Album',
      albumArtUrl: activeTrack.albumArtUrl || activeTrack.texture_url || '/placeholder-album.png',
      previewUrl: activeTrack.previewUrl || null,
    };
    isPlaying = isPlayingStore;
  } else {
    const playback = isViewingShared ? activeRoomPlayback : livePlayback;
    if (playback) {
      current = {
        title: playback.trackTitle,
        artist: playback.artistName,
        album: playback.albumTitle,
        albumArtUrl: playback.albumArtUrl || '/placeholder-album.png',
        previewUrl: playback.audioPreviewUrl || null,
      };
      isPlaying = true; // Live scrobbles are considered actively spinning
      isLive = true;
    }
  }

  // Handle local audio preview player
  useEffect(() => {
    // If current track or preview url changes, stop previous audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setLocalPlaying(false);
    }
  }, [current?.previewUrl, current?.title]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const togglePreview = (e) => {
    e.stopPropagation();
    if (!current?.previewUrl) return;

    if (localPlaying) {
      audioRef.current?.pause();
      setLocalPlaying(false);
    } else {
      if (!audioRef.current) {
        audioRef.current = new Audio(current.previewUrl);
        audioRef.current.loop = true;
        audioRef.current.addEventListener('ended', () => setLocalPlaying(false));
      }
      audioRef.current.play()
        .then(() => setLocalPlaying(true))
        .catch((err) => console.error('Audio preview playback failed:', err));
    }
  };

  if (!current) return null;

  const ownerDisplayName = isViewingShared ? (sharedOwnerName || 'Selector') : (vaultName || 'Selector');

  return (
    <>
      {/* Desktop View: Styled Right Sidebar Panel */}
      <div className="hidden md:block absolute right-4 top-36 md:right-8 md:top-44 z-20 w-[240px]">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.4 }}
          className="glass rounded-2xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.08)] border border-white/60 text-zinc-950 text-center space-y-4"
        >
          <div className="space-y-1">
            <span className="flex items-center justify-center gap-1.5 text-[9px] font-display font-extrabold uppercase tracking-widest text-zinc-500">
              {isLive ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Live scrobbling
                </>
              ) : (
                'Playing'
              )}
            </span>
            <p className="text-[10px] font-display font-bold uppercase tracking-wider text-zinc-700 truncate">
              {ownerDisplayName} is listening to:
            </p>
          </div>

          {/* Vinyl Spinning Disc Graphic */}
          <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
            {/* Outer vinyl disc container */}
            <div
              className={`relative w-36 h-36 rounded-full bg-zinc-950 shadow-[0_8px_32px_rgba(0,0,0,0.25)] flex items-center justify-center overflow-hidden transition-all duration-300 ${
                isPlaying ? 'animate-[spin_10s_linear_infinite]' : ''
              }`}
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(40,40,40,1) 0%, rgba(10,10,10,1) 100%)',
              }}
            >
              {/* Vinyl Groove details */}
              <div className="absolute inset-2 rounded-full border border-zinc-900/50 pointer-events-none" />
              <div className="absolute inset-4 rounded-full border border-zinc-900/60 pointer-events-none" />
              <div className="absolute inset-7 rounded-full border border-zinc-800/40 pointer-events-none" />
              <div className="absolute inset-10 rounded-full border border-zinc-800/40 pointer-events-none" />
              
              {/* Shiny reflection effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none opacity-40" />

              {/* Center Label (Album Art Cover) */}
              <div className="absolute w-[52px] h-[52px] rounded-full overflow-hidden border border-zinc-900 bg-zinc-850 flex items-center justify-center">
                <img
                  src={current.albumArtUrl}
                  alt={current.album}
                  className="w-full h-full object-cover select-none pointer-events-none"
                  draggable="false"
                />
              </div>

              {/* Center Spindle Hole */}
              <div className="absolute w-3.5 h-3.5 rounded-full bg-[#f5f5f3] border-2 border-zinc-900 z-10 shadow-inner" />
            </div>
          </div>

          {/* Metadata information */}
          <div className="space-y-1 px-1">
            <h4 className="text-xs font-display font-extrabold uppercase tracking-wide text-zinc-900 truncate leading-snug" title={current.title}>
              {current.title}
            </h4>
            <p className="text-[10px] font-display font-semibold text-zinc-500 truncate" title={current.artist}>
              {current.artist}
            </p>
          </div>

          {/* Audio Preview controls */}
          {current.previewUrl && (
            <div className="pt-1">
              <button
                onClick={togglePreview}
                className={`w-full flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-[10px] font-display font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm ${
                  localPlaying
                    ? 'bg-zinc-950 text-[#f5f5f3] hover:bg-zinc-900'
                    : 'glass-btn text-zinc-800'
                }`}
              >
                {localPlaying ? (
                  <>
                    <Volume2 size={12} className="animate-bounce" />
                    Mute Preview
                  </>
                ) : (
                  <>
                    <VolumeX size={12} />
                    Play Preview
                  </>
                )}
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Mobile View: Floating Bottom Center Pill */}
      <div className="block md:hidden absolute bottom-24 left-1/2 -translate-x-1/2 z-30 w-[min(92vw,380px)] pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 15 }}
          transition={{ duration: 0.35 }}
          className="glass rounded-xl p-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-white/60 pointer-events-auto flex items-center justify-between gap-3 text-zinc-950"
        >
          <div className="flex items-center gap-2 min-w-0">
            {/* Spinning disc avatar */}
            <div
              className={`h-9 w-9 rounded-full bg-zinc-950 flex items-center justify-center shrink-0 shadow-sm relative overflow-hidden ${
                isPlaying ? 'animate-spin' : ''
              }`}
              style={{ animationDuration: '6s' }}
            >
              <img
                src={current.albumArtUrl}
                alt={current.album}
                className="h-4.5 w-4.5 rounded-full object-cover"
              />
              <div className="absolute w-1.5 h-1.5 rounded-full bg-[#f5f5f3] border border-zinc-950 z-10" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <span className="text-[7.5px] font-display font-extrabold uppercase tracking-widest text-zinc-400 leading-none">
                  Live Listening
                </span>
              </div>
              <p className="text-[10px] font-display font-extrabold uppercase tracking-wide text-zinc-900 truncate leading-snug mt-0.5">
                {current.title} - {current.artist}
              </p>
            </div>
          </div>

          {current.previewUrl && (
            <button
              onClick={togglePreview}
              className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-sm ${
                localPlaying ? 'bg-zinc-950 text-[#f5f5f3]' : 'glass-btn text-zinc-800'
              }`}
            >
              {localPlaying ? <Pause size={12} /> : <Play size={12} className="ml-0.5" />}
            </button>
          )}
        </motion.div>
      </div>
    </>
  );
}

export default NowPlayingPanel;
