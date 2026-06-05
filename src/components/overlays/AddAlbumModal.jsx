import { useEffect, useMemo, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Plus, Trash2, X, Search, Star } from 'lucide-react';
import { useGalleryStore } from '../../store/useGalleryStore';

const safeTrackId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `track-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const blankTrack = () => ({
  id: safeTrackId(),
  title: '',
  category: 'meh',
});

function AddAlbumModal() {
  const allGenres = useGalleryStore((state) => state.genres);
  const albums = useGalleryStore((state) => state.albums);
  const addAlbum = useGalleryStore((state) => state.addAlbum);
  const updateAlbum = useGalleryStore((state) => state.updateAlbum);
  const editingAlbumId = useGalleryStore((state) => state.editingAlbumId);
  const closeAlbumModal = useGalleryStore((state) => state.closeAlbumModal);
  const selectAlbum = useGalleryStore((state) => state.selectAlbum);
  const containerRef = useRef(null);

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
  }, []);

  const genres = useMemo(() => allGenres.filter((genre) => genre !== 'All'), [allGenres]);
  const editingAlbum = useMemo(
    () => albums.find((album) => album.id === editingAlbumId) ?? null,
    [albums, editingAlbumId]
  );

  const [artist, setArtist] = useState('');
  const [albumTitle, setAlbumTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState(genres[0] ?? 'Alt');
  const [rating, setRating] = useState(7);
  const [textureUrl, setTextureUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [tracks, setTracks] = useState([blankTrack()]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!editingAlbum) {
      setArtist('');
      setAlbumTitle('');
      setDescription('');
      setGenre(genres[0] ?? 'Alt');
      setRating(7);
      setTextureUrl('');
      setTracks([blankTrack()]);
      return;
    }

    setArtist(editingAlbum.artist ?? '');
    setAlbumTitle(editingAlbum.album_title ?? '');
    setDescription(editingAlbum.description ?? '');
    setGenre(editingAlbum.genre ?? genres[0] ?? 'Alt');
    setRating(Number(editingAlbum.rating ?? 7));
    setTextureUrl(editingAlbum.texture_url ?? '');
    setTracks(
      Array.isArray(editingAlbum.tracklist) && editingAlbum.tracklist.length
        ? editingAlbum.tracklist.map((track) => ({
            id: safeTrackId(),
            title: track.title ?? '',
            category: ['hit', 'bop', 'meh'].includes(track.category) ? track.category : 'meh',
            previewUrl: track.previewUrl ?? null,
          }))
        : [blankTrack()]
    );
  }, [editingAlbum, genres]);

  const canSubmit = useMemo(
    () => artist.trim() && albumTitle.trim() && genre.trim() && textureUrl && tracks.some((track) => track.title.trim()),
    [artist, albumTitle, genre, textureUrl, tracks]
  );

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const size = Math.min(img.width, img.height);
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.beginPath();
          ctx.arc(300, 300, 300, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(
            img,
            (img.width - size) / 2,
            (img.height - size) / 2,
            size,
            size,
            0,
            0,
            600,
            600
          );
        }

        setTextureUrl(canvas.toDataURL('image/jpeg', 0.8));
        setIsProcessing(false);
      };
      img.src = e.target?.result;
    };
    reader.readAsDataURL(file);
  };

  const addTrackRow = () => {
    setTracks((prev) => [...prev, blankTrack()]);
  };

  const removeTrackRow = (id) => {
    if (tracks.length === 1) return;
    setTracks((prev) => prev.filter((item) => item.id !== id));
  };

  const updateTrack = (id, key, value) => {
    setTracks((prev) =>
      prev.map((track) => (track.id === id ? { ...track, [key]: value } : track))
    );
  };

  const moveTrack = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= tracks.length) return;

    setTracks((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `https://itunes.apple.com/search?term=${encodeURIComponent(
            searchQuery
          )}&entity=album&limit=5`
        );
        const data = await res.json();
        setSearchResults(data.results || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const selectAlbumSuggestion = async (appleAlbum) => {
    setArtist(appleAlbum.artistName || '');
    setAlbumTitle(appleAlbum.collectionName || '');
    setGenre(appleAlbum.primaryGenreName || genres[0] || 'Alt');
    setTextureUrl(appleAlbum.artworkUrl100 ? appleAlbum.artworkUrl100.replace('100x100bb', '600x600bb') : '');

    try {
      setIsProcessing(true);
      const res = await fetch(
        `https://itunes.apple.com/lookup?id=${appleAlbum.collectionId}&entity=song`
      );
      const data = await res.json();
      const songs = data.results
        .filter((track) => track.wrapperType === 'track')
        .map((track) => ({
          id: safeTrackId(),
          title: track.trackName,
          category: 'meh',
          previewUrl: track.previewUrl || null,
        }));

      if (songs.length > 0) {
        setTracks(songs);
      }
    } catch (err) {
      console.error('Failed to load tracklist:', err);
    } finally {
      setIsProcessing(false);
      setSearchResults([]);
      setSearchQuery('');
    }
  };

  const onSubmit = () => {
    if (!canSubmit) return;

    const tracklist = tracks
      .map((track) => ({ title: track.title.trim(), category: track.category, previewUrl: track.previewUrl || null }))
      .filter((track) => track.title.length > 0);

    const payload = {
      artist: artist.trim(),
      album_title: albumTitle.trim(),
      genre: genre.trim(),
      rating: Number(rating),
      description: description.trim() || 'Fresh pressing added through the in-app crate tool.',
      texture_url: textureUrl,
      tracklist,
    };

    if (editingAlbumId) {
      updateAlbum(editingAlbumId, payload);
      selectAlbum(null);
    } else {
      addAlbum({
        id: `a-${Date.now()}`,
        ...payload,
      });
    }

    closeAlbumModal();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeAlbumModal();
        }
      }}
      className="absolute inset-0 z-40 flex items-center justify-center bg-zinc-950/20 p-4"
    >
      <motion.form
        ref={containerRef}
        initial={{ opacity: 0, scale: 0.96, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 12 }}
        transition={{ duration: 0.28 }}
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="glass max-h-[92vh] w-[min(95vw,820px)] overflow-y-auto rounded-2xl p-5 md:p-7 text-zinc-950"
      >
          <div className="mb-5 flex items-center justify-between border-b border-white/20 pb-3">
            <h2 className="font-display text-xl uppercase tracking-wider text-zinc-900">
              {editingAlbumId ? 'Edit Record' : 'Add New Record'}
            </h2>
            <button
              type="button"
              onClick={closeAlbumModal}
              className="rounded-full glass-btn p-1.5 text-zinc-800 cursor-pointer flex items-center justify-center"
            >
              <X size={16} />
            </button>
          </div>

          <div className="relative mb-6">
            <div className="flex gap-2.5 rounded-xl border border-white/40 bg-white/40 p-3 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search iTunes to auto-fill..."
                  className="w-full rounded-lg border border-white/50 bg-white/80 py-2 pl-9 pr-3 text-sm outline-none shadow-sm focus:bg-white focus:border-orange-500 transition-all"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin rounded-full border border-orange-500 border-t-transparent" />
                )}
              </div>
            </div>

            {searchResults.length > 0 && (
              <ul className="absolute z-10 mt-1.5 max-h-[250px] w-full overflow-y-auto rounded-xl border border-white/60 bg-white/95 backdrop-blur-md shadow-[0_12px_30px_rgba(0,0,0,0.15)]">
                {searchResults.map((album) => (
                  <li
                    key={album.collectionId}
                    onClick={() => selectAlbumSuggestion(album)}
                    className="flex cursor-pointer items-center gap-3 border-b border-zinc-200/50 p-3 px-4 transition-colors last:border-0 hover:bg-orange-500/10 text-zinc-950"
                  >
                    <img src={album.artworkUrl60} alt={album.collectionName} className="h-10 w-10 shrink-0 rounded-lg border border-white/50 object-cover shadow-sm" />
                    <div className="flex flex-col overflow-hidden">
                      <span className="truncate text-sm font-bold text-zinc-950">{album.collectionName}</span>
                      <span className="truncate text-xs text-zinc-500">{album.artistName}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-1.5">
              <span className="text-[10px] font-display font-bold uppercase tracking-wider text-zinc-650">Artist</span>
              <input
                required
                value={artist}
                onChange={(event) => setArtist(event.target.value)}
                className="w-full rounded-lg border border-white/50 bg-white/80 px-3 py-2 outline-none shadow-sm focus:bg-white focus:border-orange-500 transition-all"
              />
            </label>

            <label className="grid gap-1.5">
              <span className="text-[10px] font-display font-bold uppercase tracking-wider text-zinc-650">Album Title</span>
              <input
                required
                value={albumTitle}
                onChange={(event) => setAlbumTitle(event.target.value)}
                className="w-full rounded-lg border border-white/50 bg-white/80 px-3 py-2 outline-none shadow-sm focus:bg-white focus:border-orange-500 transition-all"
              />
            </label>

            <label className="grid gap-1.5">
              <span className="text-[10px] font-display font-bold uppercase tracking-wider text-zinc-650">Genre (creatable)</span>
              <input
                list="genre-list"
                required
                value={genre}
                onChange={(event) => setGenre(event.target.value)}
                className="w-full rounded-lg border border-white/50 bg-white/80 px-3 py-2 outline-none shadow-sm focus:bg-white focus:border-orange-500 transition-all"
              />
              <datalist id="genre-list">
                {genres.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </label>

            <label className="grid gap-1.5">
              <span className="text-[10px] font-display font-bold uppercase tracking-wider text-zinc-650">Rating: {Number(rating).toFixed(1)}</span>
              <div className="py-2.5">
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={0.1}
                  value={rating}
                  onChange={(event) => setRating(event.target.value)}
                  onWheel={(event) => {
                    const dir = event.deltaY < 0 ? 1 : -1;
                    const nextLevel = Math.max(1, Math.min(10, Number(rating) + dir * 0.1));
                    setRating(Number(nextLevel.toFixed(1)));
                  }}
                  className="w-full cursor-pointer"
                />
              </div>
            </label>
          </div>

          <label className="mt-4 grid gap-1.5">
            <span className="text-[10px] font-display font-bold uppercase tracking-wider text-zinc-650">Description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className="w-full rounded-lg border border-white/50 bg-white/80 px-3 py-2 outline-none shadow-sm focus:bg-white focus:border-orange-500 transition-all"
            />
          </label>

          <div className="mt-4 grid gap-2">
            <span className="text-[10px] font-display font-bold uppercase tracking-wider text-zinc-650">Album Cover Upload</span>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload} 
              className="rounded-lg border border-white/50 bg-white/80 p-2 text-xs font-display font-bold cursor-pointer hover:bg-white transition-all" 
            />
            <p className="text-[10px] font-display font-bold text-zinc-500 uppercase">
              {isProcessing ? 'Generating circular CD texture...' : textureUrl ? 'Texture generated and ready.' : 'Upload an image to generate CD texture.'}
            </p>
          </div>

          <div className="mt-5 rounded-xl border border-white/40 bg-white/40 p-3.5 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] font-display font-bold uppercase tracking-wider text-zinc-650">Tracklist Builder</p>
              <button
                type="button"
                onClick={addTrackRow}
                className="inline-flex items-center gap-1 rounded-xl px-3.5 py-1.5 text-xs font-display font-bold transition-all glass-btn cursor-pointer"
              >
                <Plus size={12} /> Add Track
              </button>
            </div>

            <div className="grid gap-2.5 max-h-[35vh] overflow-y-auto pr-1">
              {tracks.map((track, index) => (
                <div key={track.id} className="grid gap-2 rounded-xl border border-white/40 bg-white/40 p-2.5 md:grid-cols-[auto_1fr_auto_auto] shadow-[0_4px_12px_rgba(0,0,0,0.01)]">
                  <div className="flex flex-row items-center gap-1 md:flex-col">
                    <button
                      type="button"
                      onClick={() => moveTrack(index, -1)}
                      disabled={index === 0}
                      className="rounded-lg glass-btn p-1 text-zinc-800 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center justify-center"
                      aria-label="Move track up"
                    >
                      <ChevronUp size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveTrack(index, 1)}
                      disabled={index === tracks.length - 1}
                      className="rounded-lg glass-btn p-1 text-zinc-800 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center justify-center"
                      aria-label="Move track down"
                    >
                      <ChevronDown size={12} />
                    </button>
                  </div>

                  <input
                    value={track.title}
                    onChange={(event) => updateTrack(track.id, 'title', event.target.value)}
                    placeholder={`Track ${index + 1} title`}
                    className="w-full rounded-lg border border-white/50 bg-white/80 px-2.5 py-1.5 text-sm outline-none focus:bg-white focus:border-orange-500 transition-all"
                  />

                  <div className="flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => updateTrack(track.id, 'category', track.category === 'hit' ? 'meh' : 'hit')}
                      className={`group flex items-center justify-center rounded-xl p-1.5 transition-all cursor-pointer ${
                        track.category === 'hit'
                          ? 'bg-orange-500 text-white shadow-inner border border-orange-500'
                          : 'glass-btn text-zinc-500 hover:text-zinc-850'
                      }`}
                      title={track.category === 'hit' ? 'Remove from Favorites' : 'Mark as Favorite'}
                    >
                      <Star size={16} strokeWidth={2.5} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeTrackRow(track.id)}
                    disabled={tracks.length === 1}
                    className="rounded-xl glass-btn px-2.5 py-1.5 text-red-500 hover:text-red-750 hover:bg-red-50/50 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center justify-center"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-xl bg-orange-500 hover:bg-orange-600 px-5 py-2 text-xs font-display font-bold uppercase tracking-wider text-white shadow-[0_4px_12px_rgba(234,88,12,0.2)] transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none active:scale-95"
            >
              {editingAlbumId ? 'Save Changes' : 'Add Album'}
            </button>
          </div>
      </motion.form>
    </motion.div>
  );
}

export default AddAlbumModal;
