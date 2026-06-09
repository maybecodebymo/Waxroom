const getLastFmApiKey = (apiKey) => apiKey || import.meta.env.VITE_LASTFM_API_KEY || 'b84b768d1cac8272877739d0b4dba63a';

const normalizeArray = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const lastFmRequest = async (method, username, apiKey, params = {}) => {
  const searchParams = new URLSearchParams({
    method,
    api_key: getLastFmApiKey(apiKey),
    format: 'json',
    ...(username ? { user: username } : {}),
    ...params,
  });
  const res = await fetch(`https://ws.audioscrobbler.com/2.0/?${searchParams.toString()}`);
  if (!res.ok) throw new Error('Last.fm user not found or private profile');
  const data = await res.json();
  if (data.error) {
    throw new Error(data.message || 'Last.fm user not found or private profile');
  }
  return data;
};

const albumImage = (images) => {
  const lastImage = normalizeArray(images).at(-1);
  return lastImage?.['#text'] || '';
};

const encodeSvg = (svg) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

const fallbackAlbumArt = (artistName, albumName) => {
  const initials = (albumName || artistName || 'WX')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
  const hue = Array.from(`${artistName}-${albumName}`).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;

  return encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
      <defs>
        <radialGradient id="wax" cx="50%" cy="42%" r="68%">
          <stop offset="0%" stop-color="hsl(${hue}, 74%, 64%)"/>
          <stop offset="58%" stop-color="hsl(${(hue + 32) % 360}, 58%, 34%)"/>
          <stop offset="100%" stop-color="#171717"/>
        </radialGradient>
      </defs>
      <rect width="600" height="600" fill="url(#wax)"/>
      <circle cx="300" cy="300" r="230" fill="none" stroke="rgba(255,255,255,.16)" stroke-width="2"/>
      <circle cx="300" cy="300" r="154" fill="rgba(245,245,243,.88)"/>
      <circle cx="300" cy="300" r="42" fill="#18181b"/>
      <text x="300" y="286" text-anchor="middle" font-family="Arial, sans-serif" font-size="86" font-weight="800" fill="#18181b">${initials || 'WX'}</text>
      <text x="300" y="352" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#52525b">LAST.FM IMPORT</text>
    </svg>
  `);
};

const fetchJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
};

const fetchLastFmAlbumInfoArt = async (artistName, albumName, apiKey) => {
  try {
    const data = await lastFmRequest('album.getinfo', null, apiKey, {
      artist: artistName,
      album: albumName,
      autocorrect: '1',
    });
    return albumImage(data.album?.image);
  } catch (err) {
    return '';
  }
};

const findAppleRelease = async (artistName, albumName) => {
  const albumUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(`${artistName} ${albumName}`)}&entity=album&attribute=albumTerm&limit=5`;
  const albumData = await fetchJson(albumUrl);
  if (albumData?.results?.length > 0) {
    return albumData.results.find((album) =>
      (album.collectionName || '').toLowerCase().trim() === albumName.toLowerCase().trim()
    ) || albumData.results[0];
  }

  const songUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(`${artistName} ${albumName}`)}&entity=song&limit=5`;
  const songData = await fetchJson(songUrl);
  const matchingTrack = songData?.results?.find((track) =>
    (track.collectionName || '').toLowerCase().trim() === albumName.toLowerCase().trim()
  ) || songData?.results?.[0];

  return matchingTrack || null;
};

const hydrateAlbumFromItunes = async ({ albumName, artistName, playcount, imageUrl, description }, apiKey) => {
  const appleData = await findAppleRelease(artistName, albumName);
  const lastFmAlbumArt = imageUrl || await fetchLastFmAlbumInfoArt(artistName, albumName, apiKey);

  const finalAlbum = {
    id: `lfm-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    artist: artistName,
    album_title: albumName,
    genre: 'Last.fm',
    rating: 9,
    description: description || `Imported from Last.fm${playcount ? ` with ${playcount} scrobbles` : ''}.`,
    texture_url: lastFmAlbumArt || fallbackAlbumArt(artistName, albumName),
    tracklist: []
  };

  if (appleData) {
    finalAlbum.album_title = appleData.collectionName || finalAlbum.album_title;
    finalAlbum.genre = appleData.primaryGenreName || 'Alt';
    finalAlbum.texture_url = appleData.artworkUrl100?.replace('100x100bb', '600x600bb') || finalAlbum.texture_url;

    if (appleData.collectionId) {
      const trackData = await fetchJson(`https://itunes.apple.com/lookup?id=${appleData.collectionId}&entity=song`);
      const tracklist = (trackData?.results || [])
        .filter(t => t.wrapperType === 'track')
        .map(t => ({
          title: t.trackName,
          category: 'meh',
          previewUrl: t.previewUrl || undefined
        }));

      if (tracklist.length > 0) finalAlbum.tracklist = tracklist;
    }
  }

  if (finalAlbum.tracklist.length === 0) {
    finalAlbum.tracklist = [{ title: 'Imported from Last.fm', category: 'meh' }];
  }

  return finalAlbum;
};

const dedupeAlbumSeeds = (items) => {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.artistName || ''}::${item.albumName || ''}`.toLowerCase().trim();
    if (!item.artistName || !item.albumName || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const fetchLastFmRoom = async (username, apiKey) => {
  const topAlbumData = await lastFmRequest('user.gettopalbums', username, apiKey, { limit: '20' });
  const topAlbums = normalizeArray(topAlbumData.topalbums?.album)
    .filter((item) => item.name && item.artist?.name && item.name !== '(null)')
    .map((item) => ({
      albumName: item.name,
      artistName: item.artist.name,
      playcount: parseInt(item.playcount || '0', 10),
      imageUrl: albumImage(item.image),
      description: `Imported from Last.fm with ${item.playcount || 0} scrobbles.`,
    }));

  let albumSeeds = topAlbums;

  if (albumSeeds.length === 0) {
    const recentData = await lastFmRequest('user.getrecenttracks', username, apiKey, { limit: '80', extended: '0' });
    const recentTracks = normalizeArray(recentData.recenttracks?.track);
    albumSeeds = recentTracks
      .filter((track) => track.album?.['#text'] && track.artist?.['#text'])
      .map((track) => ({
        albumName: track.album['#text'],
        artistName: track.artist['#text'],
        playcount: 0,
        imageUrl: albumImage(track.image),
        description: 'Imported from recent Last.fm listening.',
      }));
  }

  albumSeeds = dedupeAlbumSeeds(albumSeeds).slice(0, 15);

  if (albumSeeds.length === 0) {
    throw new Error('No album scrobbles found for this Last.fm user yet.');
  }

  const promises = albumSeeds.map(async (item) => {
    try {
      return await hydrateAlbumFromItunes(item, apiKey);
    } catch (e) {
      console.warn('Failed to cross-reference album:', item.albumName, e);
      return null;
    }
  });

  const hydratedAlbums = await Promise.all(promises);
  
  return hydratedAlbums.filter(Boolean);
};

export const fetchLastFmNowPlaying = async (username, apiKey) => {
  const data = await lastFmRequest('user.getrecenttracks', username, apiKey, { limit: '1' });
  const tracks = normalizeArray(data.recenttracks?.track);
  
  if (tracks.length === 0) {
    return null;
  }
  
  const track = tracks[0];
  const isNowPlaying = track['@attr'] && track['@attr'].nowplaying === 'true';
  
  if (!isNowPlaying) {
    return null;
  }
  
  const trackTitle = track.name;
  const artistName = track.artist['#text'];
  const albumTitle = track.album['#text'];
  let albumArtUrl = albumImage(track.image);
  
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
