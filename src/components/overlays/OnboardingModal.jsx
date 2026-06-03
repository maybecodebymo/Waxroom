import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useGalleryStore } from '../../store/useGalleryStore';

function OnboardingModal() {
  const [inputValue, setInputValue] = useState('');
  const setVaultName = useGalleryStore((state) => state.setVaultName);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    let name = inputValue.trim();
    if (!name) return;

    if (name.toLowerCase().endsWith(' room')) {
      name = name.substring(0, name.length - 5).trim();
    } else if (name.toLowerCase() === 'room') {
      name = '';
    }

    setVaultName(name);
  };

  const getCleanPreview = () => {
    let clean = inputValue.trim();
    if (clean.toLowerCase().endsWith(' room')) {
      clean = clean.substring(0, clean.length - 5).trim();
    } else if (clean.toLowerCase() === 'room') {
      clean = '';
    }
    return clean ? `${clean} Room` : '... Room';
  };

  const previewName = getCleanPreview();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-zinc-950/20 p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white w-full max-w-[460px] overflow-hidden rounded-2xl p-6 md:p-8 text-center border-2 border-zinc-950 shadow-[6px_6px_0px_#09090b]"
      >
        {/* Animated Vinyl Icon decoration */}
        <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
            className="absolute inset-0 rounded-full border-2 border-zinc-950 bg-zinc-900 shadow-[2px_2px_0px_#09090b] flex items-center justify-center"
            style={{
              background: 'radial-gradient(circle, #f4f4f2 4%, #18181b 5%, #ea580c 6%, #ea580c 24%, #18181b 25%, #27272a 34%, #18181b 40%, #27272a 48%, #18181b 54%, #27272a 62%, #18181b 70%, #27272a 78%, #18181b 86%, #27272a 94%, #18181b 100%)'
            }}
          >
            {/* Gloss reflection overlay */}
            <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_45deg,transparent_0deg,rgba(255,255,255,0.12)_30deg,transparent_60deg,transparent_180deg,rgba(255,255,255,0.12)_210deg,transparent_240deg,transparent_360deg)] pointer-events-none" />
            
            {/* Center hole */}
            <div className="h-2 w-2 rounded-full bg-zinc-100 shadow-inner" />
          </motion.div>
        </div>

        <h2 className="font-display text-2xl uppercase tracking-wider text-zinc-950 mb-3">
          Welcome to Waxroom
        </h2>
        <p className="text-xs font-body text-zinc-600 mb-6 leading-relaxed">
          What should we call your custom 3D music space? Let's give it a name.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              required
              maxLength={24}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="e.g. Mo's, Chill Beats, Retro"
              className="w-full rounded-xl border-2 border-zinc-950 bg-white px-4 py-3.5 pr-16 text-center text-lg font-bold tracking-wide text-zinc-900 outline-none transition-all"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-display font-bold uppercase tracking-widest text-zinc-400 pointer-events-none">
              Room
            </div>
          </div>

          {/* Live Preview Display */}
          <div className="rounded-xl bg-zinc-50 border-2 border-zinc-950 p-4 text-center shadow-[2px_2px_0px_#09090b]">
            <span className="text-[10px] font-display font-bold uppercase tracking-widest text-zinc-400 block mb-1">
              Your Room Title
            </span>
            <span className="font-display text-base tracking-wider text-zinc-950 uppercase break-all">
              {previewName}
            </span>
          </div>

          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 border-zinc-950 bg-orange-400 py-3.5 px-6 text-sm font-display font-bold uppercase tracking-wider text-zinc-950 shadow-[2px_2px_0px_#09090b] hover:shadow-[4px_4px_0px_#09090b] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            Enter Room <ArrowRight size={16} />
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default OnboardingModal;
