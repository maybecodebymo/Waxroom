import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, X, Plus, Loader2 } from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';
import { useGalleryStore } from '../../store/useGalleryStore';

const shuffle = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

function RecommendationsOverlay() {
  const albums = useGalleryStore((state) => state.albums);
  const addAlbum = useGalleryStore((state) => state.addAlbum);
  const canEditAlbums = useGalleryStore((state) => state.canEditAlbums);
  const selectedAlbumId = useGalleryStore((state) => state.selectedAlbumId);
  const isRecommendationsOpen = useGalleryStore((state) => state.isRecommendationsOpen);
  const setRecommendationsOpen = useGalleryStore((state) => state.setRecommendationsOpen);

  const [recs, setRecs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addedIds, setAddedIds] = useState(new Set());

  const fetchRecommendations = useCallback(async () => {
    setIsLoading(true);
    setRecs([]);
    setAddedIds(new Set());

    try {
      // ── Build exclusion sets ──────────────────────────────────
      const roomArtists = new Set(
        albums.map((a) => (a.artist || '').toLowerCase().trim())
      );
      const roomTitles = new Set(
        albums.map((a) => (a.album_title || '').toLowerCase().trim())
      );
      const roomCollectionIds = new Set(
        albums.filter((a) => a.collectionId).map((a) => a.collectionId)
      );

      const COMPILATION_RE =
        /\b(greatest hits|best of|compilation|complete collection|anthology|essentials|\bthe hits\b)\b/i;

      // ── Analyze the vault ─────────────────────────────────────
      const genreCounts = {};
      const artistRatings = {};

      for (const album of albums) {
        const g = album.genre;
        genreCounts[g] = (genreCounts[g] || 0) + 1;

        const r = Number(album.rating) || 0;
        if (!artistRatings[album.artist] || r > artistRatings[album.artist]) {
          artistRatings[album.artist] = r;
        }
      }

      // Top‑rated unique artists (rating ≥ 8)
      const topArtists = [...new Set(
        Object.entries(artistRatings)
          .filter(([, r]) => r >= 8)
          .sort((a, b) => b[1] - a[1])
          .map(([name]) => name)
      )].slice(0, 4);

      // Top genres by frequency
      const topGenres = Object.entries(genreCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([g]) => g);

      // ── Build multi-pronged search terms ──────────────────────
      const searchTerms = [];

      if (albums.length === 0) {
        // Fallback for new/empty rooms
        const defaults = [
          'indie rising',
          'classic hip hop',
          'ambient electronic',
          'essential jazz',
          'synthwave gems',
          'classic rock masterpieces',
          'neo soul',
          'post punk'
        ];
        searchTerms.push(...shuffle(defaults).slice(0, 5));
      } else {
        // 1) Genre exploration – fresh / adjacent music
        const genreSuffixes = [
          'new album 2025',
          'rising',
          'essential album',
          'classics',
          'underground gems',
          'masterpiece'
        ];
        const shuffledSuffixes = shuffle(genreSuffixes);
        for (let i = 0; i < topGenres.length; i++) {
          const genre = topGenres[i];
          const suffix = shuffledSuffixes[i % shuffledSuffixes.length];
          searchTerms.push(`${genre} ${suffix}`);
        }

        // 2) Related artist discovery
        const artistTemplates = [
          (artist) => `${artist} similar to`,
          (artist) => `if you like ${artist}`,
          (artist) => `${artist} style`,
          (artist) => `${artist} influence`
        ];
        for (const artist of topArtists.slice(0, 3)) {
          const template = artistTemplates[Math.floor(Math.random() * artistTemplates.length)];
          searchTerms.push(template(artist));
        }

        // 3) Cross-pollination – fuse distinct genres
        if (topGenres.length >= 2) {
          const crossoverTemplates = [
            (g1, g2) => `${g1} ${g2} crossover`,
            (g1, g2) => `${g1} ${g2} fusion`,
            (g1, g2) => `mix of ${g1} and ${g2}`
          ];
          const template = crossoverTemplates[Math.floor(Math.random() * crossoverTemplates.length)];
          searchTerms.push(template(topGenres[0], topGenres[1]));
        }
      }

      // Cap at 8 search terms to keep runtime reasonable
      const terms = searchTerms.slice(0, 8);

      // ── Rate-limited iTunes fetch helper ──────────────────────
      const delay = (ms) => new Promise((r) => setTimeout(r, ms));
      const seenIds = new Set();
      const allResults = [];

      for (let i = 0; i < terms.length; i++) {
        if (i > 0) await delay(200); // 200ms rate limit

        try {
          const res = await fetch(
            `https://itunes.apple.com/search?term=${encodeURIComponent(
              terms[i]
            )}&entity=album&limit=15`
          );
          const data = await res.json();
          if (!data.results) continue;

          for (const item of data.results) {
            // Deduplicate by collectionId
            if (seenIds.has(item.collectionId)) continue;

            // Exclude artists already in room
            if (item.artistName && roomArtists.has(item.artistName.toLowerCase().trim())) continue;

            // Exclude albums already in room (by title or collectionId)
            if (item.collectionName && roomTitles.has(item.collectionName.toLowerCase().trim())) continue;
            if (roomCollectionIds.has(item.collectionId)) continue;

            // Exclude compilations / greatest hits
            if (COMPILATION_RE.test(item.collectionName)) continue;

            seenIds.add(item.collectionId);
            allResults.push(item);
          }
        } catch (err) {
          console.warn('Discovery search failed for:', terms[i], err);
        }
      }

      // Shuffle results for maximum variety
      const shuffledResults = shuffle(allResults);
      setRecs(shuffledResults.slice(0, 10));
    } catch (err) {
      console.error('Recommendations failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [albums]);

  useEffect(() => {
    if (isRecommendationsOpen && recs.length === 0) {
      fetchRecommendations();
    }
  }, [isRecommendationsOpen, recs.length, fetchRecommendations]);

  const handleAdd = async (rec) => {
    // Fetch tracklist from iTunes
    let tracklist = [];
    try {
      const res = await fetch(
        `https://itunes.apple.com/lookup?id=${rec.collectionId}&entity=song`
      );
      const data = await res.json();
      tracklist = data.results
        .filter((t) => t.wrapperType === 'track')
        .map((t) => ({ title: t.trackName, category: 'meh', previewUrl: t.previewUrl || null }));
    } catch (err) {
      console.warn('Tracklist fetch failed:', err);
    }

    const newAlbum = {
      id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      artist: rec.artistName,
      album_title: rec.collectionName,
      genre: rec.primaryGenreName || 'Alt',
      rating: 7,
      description: 'Discovered through the Waxroom recommendation engine.',
      texture_url: rec.artworkUrl100 ? rec.artworkUrl100.replace('100x100bb', '600x600bb') : '',
      tracklist: tracklist.length > 0 ? tracklist : [{ title: 'Track 1', category: 'meh' }],
    };

    addAlbum(newAlbum);
    setAddedIds((prev) => new Set(prev).add(rec.collectionId));
  };

  return (
    <AnimatePresence>
      {!selectedAlbumId && isRecommendationsOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.28 }}
          className="absolute bottom-20 right-4 z-30 w-[min(92vw,380px)] rounded-2xl glass p-4 md:right-10 md:bottom-24 pointer-events-auto"
        >
          <div className="mb-3 flex items-center justify-between">
             <h3 className="flex items-center gap-2 text-xs font-display font-bold uppercase tracking-wider text-zinc-800">
              <Sparkles size={14} className="text-orange-500" /> You Might Like
            </h3>
            <div className="flex items-center gap-2">
               <button
                onClick={fetchRecommendations}
                disabled={isLoading}
                className="text-[9px] font-display font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-800 transition disabled:opacity-40 cursor-pointer"
              >
                Refresh
              </button>
              <button
                onClick={() => setRecommendationsOpen(false)}
                className="rounded-full glass-btn p-1.5 text-zinc-800 cursor-pointer flex items-center justify-center"
              >
                <X size={12} />
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="animate-spin text-orange-500" />
               <span className="ml-2 text-xs font-display font-bold uppercase tracking-wider text-zinc-500">Analyzing room...</span>
            </div>
          ) : recs.length === 0 ? (
             <p className="py-6 text-center text-xs font-display font-bold uppercase tracking-wider text-zinc-400">
              No recommendations available. Add more albums or try again!
            </p>
          ) : (
            <div className="max-h-[50vh] space-y-2.5 overflow-y-auto pr-1">
              {recs.map((rec) => {
                const isAdded = addedIds.has(rec.collectionId);
                return (
                  <div
                    key={rec.collectionId}
                    className="flex items-center gap-3 rounded-xl border border-white/40 bg-white/40 p-2.5 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:bg-white/60 hover:-translate-y-0.5"
                  >
                    <img
                      src={rec.artworkUrl100}
                      alt={rec.collectionName}
                      className="h-12 w-12 shrink-0 rounded-lg border border-white/50 object-cover shadow-sm"
                    />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-bold text-zinc-950">
                        {rec.collectionName}
                      </span>
                      <span className="truncate text-[11px] font-medium text-zinc-700">
                        {rec.artistName}
                      </span>
                      <span className="text-[9px] font-display font-bold uppercase tracking-wider text-zinc-400">
                        {rec.primaryGenreName}
                        {rec.releaseDate && (
                          <> · {new Date(rec.releaseDate).getFullYear()}</>
                        )}
                      </span>
                    </div>
                    {canEditAlbums && (
                      <button
                        onClick={() => handleAdd(rec)}
                        disabled={isAdded}
                        className={`shrink-0 rounded-xl p-1.5 transition-all cursor-pointer flex items-center justify-center ${
                          isAdded
                            ? 'bg-emerald-500 text-white shadow-inner border border-emerald-500'
                            : 'glass-btn text-zinc-800'
                        }`}
                        title={isAdded ? 'Added!' : 'Add to Room'}
                      >
                        {isAdded ? '✓' : <Plus size={14} />}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default RecommendationsOverlay;
