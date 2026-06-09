import { useEffect, useRef } from 'react';
import { useGalleryStore } from '../../store/useGalleryStore';
import { fetchLastFmNowPlaying } from '../../utils/lastFmService';

const hydrateTrackFromItunes = async (artistName, trackTitle, albumTitle, fallbackArt) => {
  let albumArtUrl = fallbackArt || '/placeholder-album.png';
  let previewUrl = '';
  let itunesGenre = 'Alt';
  let itunesCollectionId = null;
  let itunesTracklist = [];

  try {
    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(artistName + ' ' + trackTitle)}&entity=song&limit=1`;
    const itRes = await fetch(itunesUrl);
    if (itRes.ok) {
      const itData = await itRes.json();
      if (itData.results && itData.results.length > 0) {
        const appleTrack = itData.results[0];
        previewUrl = appleTrack.previewUrl || '';
        itunesGenre = appleTrack.primaryGenreName || 'Alt';
        itunesCollectionId = appleTrack.collectionId || null;
        if (appleTrack.artworkUrl100) {
          albumArtUrl = appleTrack.artworkUrl100.replace('100x100bb', '600x600bb');
        }

        if (itunesCollectionId) {
          const trackRes = await fetch(`https://itunes.apple.com/lookup?id=${itunesCollectionId}&entity=song`);
          if (trackRes.ok) {
            const trackData = await trackRes.json();
            itunesTracklist = (trackData.results || [])
              .filter(t => t.wrapperType === 'track')
              .map(t => ({
                title: t.trackName,
                category: t.trackId === appleTrack.trackId ? 'hit' : 'meh'
              }));
          }
        }
      }
    }
  } catch (err) {
    console.warn('iTunes cross-reference failed for active player:', err);
  }

  return {
    isPlaying: true,
    trackTitle,
    artistName,
    albumTitle,
    albumArtUrl,
    previewUrl,
    genre: itunesGenre,
    collectionId: itunesCollectionId,
    tracklist: itunesTracklist,
    timestamp: Date.now()
  };
};

function LiveListeningManager() {
  const lastFmUsername = useGalleryStore((state) => state.lastFmUsername);
  const updateLivePlaybackState = useGalleryStore((state) => state.updateLivePlaybackState);
  const myAlbums = useGalleryStore((state) => state.myAlbums);
  const crateInbox = useGalleryStore((state) => state.crateInbox);
  
  const lastCheckedTrack = useRef({ artist: '', title: '' });
  const lastHydratedTrack = useRef(null);

  useEffect(() => {
    const pollNowPlaying = async () => {
      try {
        let activeTrackData = null;

        if (lastFmUsername) {
          const lfmPlaying = await fetchLastFmNowPlaying(lastFmUsername);
          if (lfmPlaying) {
            activeTrackData = {
              trackTitle: lfmPlaying.trackTitle,
              artistName: lfmPlaying.artistName,
              albumTitle: lfmPlaying.albumTitle,
              albumArtUrl: lfmPlaying.albumArtUrl,
              isPlaying: true,
              hydrated: lfmPlaying
            };
          }
        }

        if (activeTrackData) {
          const isSameTrack =
            lastCheckedTrack.current.title.toLowerCase() === activeTrackData.trackTitle.toLowerCase() &&
            lastCheckedTrack.current.artist.toLowerCase() === activeTrackData.artistName.toLowerCase();

          let nowPlaying = null;

          if (isSameTrack && lastHydratedTrack.current) {
            nowPlaying = lastHydratedTrack.current;
          } else {
            if (activeTrackData.hydrated) {
              nowPlaying = activeTrackData.hydrated;
            } else {
              nowPlaying = await hydrateTrackFromItunes(
                activeTrackData.artistName,
                activeTrackData.trackTitle,
                activeTrackData.albumTitle,
                activeTrackData.albumArtUrl
              );
            }

            lastCheckedTrack.current = {
              artist: activeTrackData.artistName,
              title: activeTrackData.trackTitle
            };
            lastHydratedTrack.current = nowPlaying;

            useGalleryStore.getState().addTrackToHistory(nowPlaying);

            const albumCleanName = (nowPlaying.albumTitle || '').toLowerCase().trim();
            const isCollected = myAlbums.some(
              (a) => (a.album_title || '').toLowerCase().trim() === albumCleanName
            );
            const inCrate = crateInbox.some(
              (a) => (a.album_title || '').toLowerCase().trim() === albumCleanName
            );

            if (!isCollected && !inCrate && albumCleanName && nowPlaying.albumArtUrl) {
              const newAlbum = {
                id: `auto-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
                artist: nowPlaying.artistName,
                album_title: nowPlaying.albumTitle,
                genre: nowPlaying.genre || 'Alt',
                rating: 8,
                description: 'Captured while listening on Last.fm!',
                texture_url: nowPlaying.albumArtUrl,
                tracklist: nowPlaying.tracklist.length > 0 ? nowPlaying.tracklist : [
                  { title: nowPlaying.trackTitle, category: 'hit' }
                ]
              };

              useGalleryStore.setState((state) => ({
                crateInbox: [newAlbum, ...state.crateInbox].slice(0, 10),
                hasUnseenCrateItems: true
              }));
              
              useGalleryStore.getState().backupRoomToCloud();
            }
          }

          updateLivePlaybackState(nowPlaying);
        } else {
          updateLivePlaybackState(null);
          lastCheckedTrack.current = { artist: '', title: '' };
          lastHydratedTrack.current = null;
        }
      } catch (err) {
        console.warn('Live listening polling failed:', err);
      }
    };

    pollNowPlaying();

    const interval = setInterval(pollNowPlaying, 4000);
    return () => clearInterval(interval);
  }, [
    lastFmUsername,
    myAlbums,
    crateInbox,
    updateLivePlaybackState
  ]);

  return null;
}

export default LiveListeningManager;
