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

    // Strip trailing "'s Room", "'s room", " Room", " room" if they typed it
    const lower = name.toLowerCase();
    if (lower.endsWith("'s room")) {
      name = name.substring(0, name.length - 8).trim();
    } else if (lower.endsWith('s room')) {
      name = name.substring(0, name.length - 7).trim();
    } else if (lower.endsWith(' room')) {
      name = name.substring(0, name.length - 5).trim();
    } else if (lower.endsWith("'s")) {
      name = name.substring(0, name.length - 2).trim();
    } else if (lower === 'room') {
      name = '';
    }

    setVaultName(name);
  };

  const getCleanPreview = () => {
    let clean = inputValue.trim();
    if (!clean) return "...'s Room";
    
    const lower = clean.toLowerCase();
    if (lower.endsWith("'s room")) return clean;
    if (lower.endsWith(' room')) {
      const base = clean.substring(0, clean.length - 5).trim();
      return base.endsWith("'s") ? `${base} Room` : `${base}'s Room`;
    }
    if (clean.endsWith("'s")) return `${clean} Room`;
    if (clean.endsWith("'")) return `${clean}s Room`;
    return `${clean}'s Room`;
  };

  const previewName = getCleanPreview();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-zinc-950/15 p-4 pointer-events-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px] overflow-hidden rounded-[28px] p-6 md:p-8 text-center glass border border-white/60 shadow-[0_24px_50px_rgba(0,0,0,0.15)] bg-white/60 backdrop-blur-xl"
      >
        {/* Animated Vinyl Icon decoration */}
        <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
            className="absolute inset-0 rounded-full border border-zinc-950/80 shadow-[0_6px_16px_rgba(0,0,0,0.3)] flex items-center justify-center overflow-hidden"
            style={{
              background: `
                conic-gradient(
                  from 0deg, 
                  rgba(255, 255, 255, 0) 0deg, 
                  rgba(255, 255, 255, 0.08) 25deg, 
                  rgba(255, 255, 255, 0) 50deg, 
                  rgba(255, 255, 255, 0) 180deg, 
                  rgba(255, 255, 255, 0.08) 205deg, 
                  rgba(255, 255, 255, 0) 230deg, 
                  rgba(255, 255, 255, 0) 360deg
                ),
                radial-gradient(
                  circle at center,
                  transparent 0%,
                  transparent 36%,
                  #16161a 36.5%,
                  #0d0d10 39%,
                  #16161a 41%,
                  transparent 41.5%,
                  transparent 96%,
                  #0d0d10 96.5%,
                  #16161a 100%
                ),
                repeating-radial-gradient(
                  circle at center, 
                  #121216 0px, 
                  #121216 1.5px, 
                  #22222a 2.5px, 
                  #121216 3px
                )
              `
            }}
          >
            {/* Center paper label */}
            <div className="absolute rounded-full flex flex-col items-center justify-center shadow-inner"
                 style={{
                   width: '34px',
                   height: '34px',
                   background: '#ea580c',
                   border: '1px solid #0d0d10',
                   boxShadow: 'inset 0 0 5px rgba(0,0,0,0.4)',
                 }}>
              {/* Spindle hole */}
              <div className="h-2 w-2 rounded-full bg-[#fafaf9] border border-zinc-950/40" />
            </div>
          </motion.div>
        </div>

        <h2 className="font-display text-2xl uppercase tracking-wider text-zinc-950 mb-3">
          Claim Your Vinyl Space
        </h2>
        <p className="text-xs font-body text-zinc-650 mb-6 leading-relaxed">
          Every selector needs an identity. Drop your name or pseudonym to personalize your custom 3D vinyl vault.
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
              placeholder=""
              className="w-full rounded-xl border border-white/50 bg-white/85 px-4 py-3.5 text-center text-lg font-bold tracking-wide text-zinc-900 outline-none transition-all shadow-sm focus:bg-white focus:border-orange-500"
            />
          </div>

          {/* Live Preview Display */}
          <div className="rounded-xl bg-white/40 border border-white/40 p-4 text-center shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
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
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 py-3.5 px-6 text-sm font-display font-bold uppercase tracking-wider text-white shadow-[0_4px_12px_rgba(234,88,12,0.2)] transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none cursor-pointer active:scale-[0.98]"
          >
            {inputValue.trim() ? `Drop the needle on ${previewName}` : "Drop a name to spin the wax"} <ArrowRight size={16} />
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default OnboardingModal;
