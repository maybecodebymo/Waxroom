import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Disc, Filter, Sparkles, SlidersHorizontal, ArrowLeft, ArrowRight, Play } from 'lucide-react';
import { useGalleryStore } from '../../store/useGalleryStore';

const tourSteps = [
  {
    title: '1. The Music Sphere',
    icon: Disc,
    description: 'Explore your music library in full 3D! Drag anywhere on the screen to rotate the sphere. Scroll or pinch to zoom. Click on any record to zoom in, read its details, and explore its tracklist.',
    cardPosition: 'bottom-28 left-1/2 -translate-x-1/2 w-[min(90vw,420px)]',
    targetId: null,
  },
  {
    title: '2. Genre Filters',
    icon: Filter,
    description: 'Instantly filter your room by genre using the filter bar at the bottom. Tapping a genre narrows down the visible albums, collapsing the sphere to display only matching vinyls.',
    cardPosition: 'bottom-32 left-1/2 -translate-x-1/2 w-[min(90vw,420px)]',
    targetId: 'filter-bar-container',
  },
  {
    title: '3. Expand & Recommend',
    icon: Sparkles,
    description: "Time to drop some wax! Customize your space by adding your very first vinyl. Tap the '+' button below to search the iTunes database or enter a record manually. Once you have a few records, tap the 'Recommendations' button to discover fresh music!",
    cardPosition: 'bottom-32 left-1/2 -translate-x-1/2 w-[min(90vw,420px)]',
    targetId: 'bottom-actions', // Special case to highlight both buttons
  },
  {
    title: '4. Feed, Share & Tune',
    icon: SlidersHorizontal,
    description: 'Take control of your room! Use the top-right bar to view the community feed, share a link, or open the "Tune" panel to link your Selector Profile (Google/Apple sync across devices), connect Last.fm live streaming, and customize 3D physics.',
    cardPosition: 'top-24 right-4 md:right-8 w-[min(90vw,380px)]',
    targetId: 'top-right-controls',
  },
];

function TutorialTour() {
  const [stepIndex, setStepIndex] = useState(0);
  const setCompletedTour = useGalleryStore((state) => state.setCompletedTour);
  
  // Track bounding rectangles of UI elements for pixel-perfect outlines
  const [highlights, setHighlights] = useState([]);

  useEffect(() => {
    const updateHighlights = () => {
      const currentStep = tourSteps[stepIndex];
      if (!currentStep.targetId) {
        setHighlights([]);
        return;
      }

      if (currentStep.targetId === 'bottom-actions') {
        const addBtn = document.getElementById('add-album-btn');
        const luckyBtn = document.getElementById('get-lucky-btn');
        const nextHighlights = [];
        
        if (addBtn) {
          const r = addBtn.getBoundingClientRect();
          nextHighlights.push({
            id: 'add-btn-hl',
            left: r.left - 4,
            top: r.top - 4,
            width: r.width + 8,
            height: r.height + 8,
            borderRadius: '16px',
          });
        }
        if (luckyBtn) {
          const r = luckyBtn.getBoundingClientRect();
          nextHighlights.push({
            id: 'lucky-btn-hl',
            left: r.left - 4,
            top: r.top - 4,
            width: r.width + 8,
            height: r.height + 8,
            borderRadius: '16px',
          });
        }
        setHighlights(nextHighlights);
      } else {
        const el = document.getElementById(currentStep.targetId);
        if (el) {
          const r = el.getBoundingClientRect();
          setHighlights([
            {
              id: currentStep.targetId,
              left: r.left - 4,
              top: r.top - 4,
              width: r.width + 8,
              height: r.height + 8,
              borderRadius: (() => {
                const r = window.getComputedStyle(el).borderRadius;
                return r && r !== '0px' ? r : '24px';
              })(),
            },
          ]);
        } else {
          setHighlights([]);
        }
      }
    };

    updateHighlights();
    
    // Periodically poll for position shifts (e.g. during animations or image loads)
    const interval = setInterval(updateHighlights, 150);
    window.addEventListener('resize', updateHighlights);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updateHighlights);
    };
  }, [stepIndex]);

  const handleNext = () => {
    if (stepIndex < tourSteps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      setCompletedTour(true);
    }
  };

  const handleBack = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    }
  };

  const handleSkip = () => {
    setCompletedTour(true);
  };

  const currentStep = tourSteps[stepIndex];
  const StepIcon = currentStep.icon;

  return (
    <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden">
      {/* Light tinted overlay — NO blur, allows click-through to engage with the globe/menus! */}
      <div className="absolute inset-0 bg-zinc-950/10 pointer-events-none transition-all" />

      {/* Dynamic Highlight Outlines */}
      <AnimatePresence>
        {highlights.map((hl) => (
          <motion.div
            key={hl.id}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            className="absolute border-2 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5),_inset_0_0_8px_rgba(249,115,22,0.15)] pointer-events-none z-40"
            style={{
              left: `${hl.left}px`,
              top: `${hl.top}px`,
              width: `${hl.width}px`,
              height: `${hl.height}px`,
              borderRadius: hl.borderRadius,
            }}
          />
        ))}
      </AnimatePresence>

      {/* Dotted Orbit Highlight for the 3D Sphere */}
      <AnimatePresence>
        {stepIndex === 0 && (
          <motion.div
            key="center-orbit"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.85, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.4 }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center z-20"
          >
            <div className="h-72 w-72 md:h-96 md:w-96 rounded-full border-4 border-dashed border-orange-500/70 animate-[spin_40s_linear_infinite]" />
            <div className="absolute h-[270px] w-[270px] md:h-[360px] md:w-[360px] rounded-full border border-orange-400/20 animate-pulse pointer-events-none" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Tour Guide Card */}
      <div className={`absolute z-50 pointer-events-auto ${currentStep.cardPosition} transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]`}>
        <motion.div
          key={stepIndex}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="glass rounded-3xl p-5 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.22)] border border-white/80"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-600">
              <StepIcon size={14} className="animate-bounce" />
              {currentStep.title}
            </span>
            <button
              onClick={handleSkip}
              className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-700 transition"
            >
              Skip Tour
            </button>
          </div>

          <p className="text-xs text-zinc-700 leading-relaxed mb-5">
            {currentStep.description}
          </p>

          <div className="flex items-center justify-between">
            {/* Step Dots */}
            <div className="flex gap-1.5">
              {tourSteps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${
                    i === stepIndex ? 'w-4 bg-orange-500' : 'bg-zinc-300'
                  }`}
                />
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex gap-2">
              {stepIndex > 0 && (
                <button
                  onClick={handleBack}
                  className="inline-flex items-center justify-center p-2 rounded-xl border border-zinc-200 bg-white/70 hover:bg-white text-zinc-600 active:scale-95 transition"
                  title="Back"
                >
                  <ArrowLeft size={14} />
                </button>
              )}
              <button
                onClick={handleNext}
                className="inline-flex items-center justify-center gap-1 bg-zinc-900 text-zinc-100 hover:bg-zinc-800 text-xs font-semibold uppercase tracking-wider px-3.5 py-2 rounded-xl shadow-md active:scale-95 transition"
              >
                {stepIndex === tourSteps.length - 1 ? 'Finish' : 'Next'}
                {stepIndex < tourSteps.length - 1 && <ArrowRight size={12} />}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default TutorialTour;
