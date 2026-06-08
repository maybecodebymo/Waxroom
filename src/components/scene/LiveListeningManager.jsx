import { useEffect, useRef } from 'react';
import { useGalleryStore } from '../../store/useGalleryStore';
import { fetchLastFmNowPlaying } from '../../utils/lastFmService';

const fetchSpotifyCurrentlyPlaying = async (token) => {
  try {
    const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 204) {
      return null;
    }

    if (response.status === 401) {
      // Token expired, clear token in store
      useGalleryStore.setState({ spotifyAccessToken: '', spotifyTokenExpiry: 0 });
      return null;
    }

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (!data || !data.item) return null;

    return {
      trackTitle: data.item.name,
      artistName: data.item.artists?.map(a => a.name).join(', ') || 'Unknown Artist',
      albumTitle: data.item.album?.name || 'Unknown Album',
      albumArtUrl: data.item.album?.images?.[0]?.url || '/placeholder-album.png',
      isPlaying: data.is_playing
    };
  } catch (err) {
    console.warn('Failed to fetch Spotify player status:', err);
    return null;
  }
};

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
  const spotifyAccessToken = useGalleryStore((state) => state.spotifyAccessToken);
  const spotifyTokenExpiry = useGalleryStore((state) => state.spotifyTokenExpiry);
  const appleMusicSimulatedActive = useGalleryStore((state) => state.appleMusicSimulatedActive);
  const appleMusicTrackTitle = useGalleryStore((state) => state.appleMusicTrackTitle);
  const appleMusicArtistName = useGalleryStore((state) => state.appleMusicArtistName);
  const appleMusicAlbumTitle = useGalleryStore((state) => state.appleMusicAlbumTitle);
  const appleMusicAlbumArtUrl = useGalleryStore((state) => state.appleMusicAlbumArtUrl);

  const updateLivePlaybackState = useGalleryStore((state) => state.updateLivePlaybackState);
  const myAlbums = useGalleryStore((state) => state.myAlbums);
  const crateInbox = useGalleryStore((state) => state.crateInbox);
  
  const lastCheckedTrack = useRef({ artist: '', title: '' });
  const lastHydratedTrack = useRef(null);

  useEffect(() => {
    const pollNowPlaying = async () => {
      if (!document.hasFocus()) return;

      try {
        let activeTrackData = null;
        let source = '';

        // 1. Check Spotify first if access token is configured
        if (spotifyAccessToken && spotifyTokenExpiry > Date.now()) {
          const spotifyPlaying = await fetchSpotifyCurrentlyPlaying(spotifyAccessToken);
          if (spotifyPlaying && spotifyPlaying.isPlaying) {
            activeTrackData = spotifyPlaying;
            source = 'spotify';
          }
        }

        // 2. Check Apple Music simulation second if active
        if (!activeTrackData && appleMusicSimulatedActive && appleMusicTrackTitle) {
          activeTrackData = {
            trackTitle: appleMusicTrackTitle,
            artistName: appleMusicArtistName,
            albumTitle: appleMusicAlbumTitle,
            albumArtUrl: appleMusicAlbumArtUrl || '/placeholder-album.png',
            isPlaying: true
          };
          source = 'applemusic';
        }

        // 3. Check Last.fm third as a fallback
        if (!activeTrackData && lastFmUsername) {
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
            source = 'lastfm';
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

            // Add to history
            useGalleryStore.getState().addTrackToHistory(nowPlaying);

            // Crate Inbox Auto-collection check
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
                description: `Captured while listening on ${
                  source === 'spotify'
                    ? 'Spotify'
                    : source === 'applemusic'
                    ? 'Apple Music'
                    : 'Last.fm'
                }!`,
                texture_url: nowPlaying.albumArtUrl,
                tracklist: nowPlaying.tracklist.length > 0 ? nowPlaying.tracklist : [
                  { title: nowPlaying.trackTitle, category: 'hit' }
                ]
              };

              useGalleryStore.setState((state) => ({
                crateInbox: [newAlbum, ...state.crateInbox].slice(0, 10)
              }));
              
              useGalleryStore.getState().backupRoomToCloud();
              console.log('Auto-collected track into Crate:', nowPlaying.trackTitle);
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

    // Poll every 12 seconds
    const interval = setInterval(pollNowPlaying, 12000);
    return () => clearInterval(interval);
  }, [
    lastFmUsername,
    spotifyAccessToken,
    spotifyTokenExpiry,
    appleMusicSimulatedActive,
    appleMusicTrackTitle,
    appleMusicArtistName,
    appleMusicAlbumTitle,
    appleMusicAlbumArtUrl,
    myAlbums,
    crateInbox,
    updateLivePlaybackState
  ]);

  return null;
}

export default LiveListeningManager;
