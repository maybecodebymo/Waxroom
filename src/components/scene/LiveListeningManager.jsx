import { useEffect, useRef } from 'react';
import { useGalleryStore } from '../../store/useGalleryStore';
import { fetchLastFmNowPlaying } from '../../utils/lastFmService';

function LiveListeningManager() {
  const lastFmUsername = useGalleryStore((state) => state.lastFmUsername);
  const updateLivePlaybackState = useGalleryStore((state) => state.updateLivePlaybackState);
  const myAlbums = useGalleryStore((state) => state.myAlbums);
  const crateInbox = useGalleryStore((state) => state.crateInbox);
  
  const lastCheckedTrack = useRef({ artist: '', title: '' });

  useEffect(() => {
    if (!lastFmUsername) {
      updateLivePlaybackState(null);
      return;
    }

    const pollNowPlaying = async () => {
      // Only poll if tab is active to preserve resources & API limits
      if (!document.hasFocus()) return;

      try {
        const nowPlaying = await fetchLastFmNowPlaying(lastFmUsername);
        
        if (nowPlaying) {
          updateLivePlaybackState(nowPlaying);
          
          const titleMatch = lastCheckedTrack.current.title.toLowerCase() === nowPlaying.trackTitle.toLowerCase();
          const artistMatch = lastCheckedTrack.current.artist.toLowerCase() === nowPlaying.artistName.toLowerCase();
          
          if (titleMatch && artistMatch) {
            return; // Already processed this track's album checks
          }
          
          // New track detected! Update ref.
          lastCheckedTrack.current = {
            artist: nowPlaying.artistName,
            title: nowPlaying.trackTitle
          };

          // Append to listening history
          useGalleryStore.getState().addTrackToHistory(nowPlaying);

          // Check if the album is already collected or in the crate inbox
          const albumCleanName = (nowPlaying.albumTitle || '').toLowerCase().trim();
          const isCollected = myAlbums.some(
            (a) => (a.album_title || '').toLowerCase().trim() === albumCleanName
          );
          const inCrate = crateInbox.some(
            (a) => (a.album_title || '').toLowerCase().trim() === albumCleanName
          );

          if (!isCollected && !inCrate && albumCleanName && nowPlaying.albumArtUrl) {
            // Build a new auto-collected album object
            const newAlbum = {
              id: `auto-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
              artist: nowPlaying.artistName,
              album_title: nowPlaying.albumTitle,
              genre: nowPlaying.genre || 'Alt',
              rating: 8,
              description: `Captured while listening to "${nowPlaying.trackTitle}" on Last.fm!`,
              texture_url: nowPlaying.albumArtUrl,
              tracklist: nowPlaying.tracklist.length > 0 ? nowPlaying.tracklist : [
                { title: nowPlaying.trackTitle, category: 'hit' }
              ]
            };

            // Push to Crate Inbox (limit to 10 items) and backup
            useGalleryStore.setState((state) => ({
              crateInbox: [newAlbum, ...state.crateInbox].slice(0, 10)
            }));
            
            useGalleryStore.getState().backupRoomToCloud();
            
            console.log('Auto-collected track into Crate:', nowPlaying.trackTitle);
          }
        } else {
          // If no active track is scrobbling, clear state
          updateLivePlaybackState(null);
          lastCheckedTrack.current = { artist: '', title: '' };
        }
      } catch (err) {
        console.warn('Live listening polling failed:', err);
      }
    };

    // Run first check immediately
    pollNowPlaying();

    // Poll every 12 seconds
    const interval = setInterval(pollNowPlaying, 12000);
    return () => clearInterval(interval);
  }, [lastFmUsername, myAlbums, crateInbox, updateLivePlaybackState]);

  return null; // Silent background worker
}

export default LiveListeningManager;
