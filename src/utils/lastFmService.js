export const fetchLastFmRoom = async (username, apiKey) => {
  const activeKey = apiKey || import.meta.env.VITE_LASTFM_API_KEY || 'b84b768d1cac8272877739d0b4dba63a';
  // 1. Fetch Top Albums from Last.fm
  const lastFmUrl = `https://ws.audioscrobbler.com/2.0/?method=user.gettopalbums&user=${encodeURIComponent(username)}&api_key=${activeKey}&format=json&limit=15`;
  const res = await fetch(lastFmUrl);
  if (!res.ok) throw new Error('Last.fm user not found or private profile');
  const data = await res.json();
  
  if (!data.topalbums || !data.topalbums.album) {
    throw new Error('No albums found for this user');
  }

  const albums = data.topalbums.album;
  
  // 2. Map through iTunes concurrently to assemble full mockAlbum schema objects
  const promises = albums.map(async (item) => {
    try {
      const albumName = item.name;
      const artistName = item.artist.name;
      const playcount = parseInt(item.playcount, 10);
      
      const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(artistName + ' ' + albumName)}&entity=album&limit=1`;
      const itRes = await fetch(itunesUrl);
      const itData = await itRes.json();
      
      let finalAlbum = {
        id: `lfm-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        artist: artistName,
        album_title: albumName,
        genre: 'Last.fm Top', // Default fallback
        rating: 9,
        description: `Imported from Last.fm with ${playcount} scrobbles!`,
        texture_url: item.image && item.image.length > 0 ? item.image[item.image.length - 1]['#text'] : '', 
        tracklist: []
      };

      if (itData.results && itData.results.length > 0) {
        const appleData = itData.results[0];
        finalAlbum.genre = appleData.primaryGenreName || 'Alt';
        finalAlbum.texture_url = appleData.artworkUrl100.replace('100x100bb', '600x600bb');
        
        // Fetch tracklist
        const trackRes = await fetch(`https://itunes.apple.com/lookup?id=${appleData.collectionId}&entity=song`);
        const trackData = await trackRes.json();
        
        const tracklist = (trackData.results || [])
          .filter(t => t.wrapperType === 'track')
          .map(t => ({
            title: t.trackName,
            category: 'hit' // Assume tops are hits
          }));
          
        if (tracklist.length > 0) finalAlbum.tracklist = tracklist;
      } else {
        // Fallback for missing tracks if iTunes failed
        finalAlbum.tracklist = [ { title: 'Unknown Track 1', category: 'meh' } ];
      }
      
      return finalAlbum;
    } catch (e) {
      console.warn("Failed to cross-reference album: ", item.name);
      return null;
    }
  });

  const hydratedAlbums = await Promise.all(promises);
  
  return hydratedAlbums.filter(a => a && !!a.texture_url);
};

export const fetchLastFmNowPlaying = async (username, apiKey) => {
  const activeKey = apiKey || import.meta.env.VITE_LASTFM_API_KEY || 'b84b768d1cac8272877739d0b4dba63a';
  const url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${encodeURIComponent(username)}&api_key=${activeKey}&format=json&limit=1`;
  
  const res = await fetch(url);
  if (!res.ok) throw new Error('Last.fm user not found or private profile');
  const data = await res.json();
  
  if (!data.recenttracks || !data.recenttracks.track || data.recenttracks.track.length === 0) {
    return null;
  }
  
  const track = data.recenttracks.track[0];
  const isNowPlaying = track['@attr'] && track['@attr'].nowplaying === 'true';
  
  if (!isNowPlaying) {
    return null;
  }
  
  const trackTitle = track.name;
  const artistName = track.artist['#text'];
  const albumTitle = track.album['#text'];
  let albumArtUrl = track.image && track.image.length > 0 ? track.image[track.image.length - 1]['#text'] : '';
  
  let previewUrl = '';
  let itunesGenre = 'Unknown';
  let itunesCollectionId = null;
  let itunesTracklist = [];

  // Try to cross-reference iTunes to find a preview URL and complete metadata
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

        // Also retrieve complete album tracklist if we got collectionId
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
    console.warn('iTunes cross-reference failed for now-playing:', err);
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
