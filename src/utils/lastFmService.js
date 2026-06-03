export const fetchLastFmRoom = async (username, apiKey) => {
  // 1. Fetch Top Albums from Last.fm
  const lastFmUrl = `https://ws.audioscrobbler.com/2.0/?method=user.gettopalbums&user=${encodeURIComponent(username)}&api_key=${apiKey}&format=json&limit=15`;
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
        
        const tracklist = trackData.results
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
