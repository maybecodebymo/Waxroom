import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  onConfirm,
  onCancel,
}) {
  const isDanger = tone === 'danger';

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-zinc-950/55 p-4 backdrop-blur-md pointer-events-auto"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[360px] rounded-2xl border border-white/60 bg-[#f5f5f3] p-5 text-zinc-950 shadow-[0_24px_70px_rgba(0,0,0,0.22)]"
      >
        <div className="mb-4 flex items-start justify-between gap-3 border-b border-zinc-200 pb-3">
          <div className="flex items-center gap-2">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
              isDanger ? 'bg-red-50 text-red-600' : 'bg-orange-100 text-orange-600'
            }`}>
              <AlertTriangle size={16} />
            </span>
            <h2 className="font-display text-xs font-extrabold uppercase tracking-wider text-zinc-950">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full glass-btn p-1.5 text-zinc-800 cursor-pointer flex items-center justify-center"
            aria-label="Close confirmation"
          >
            <X size={13} />
          </button>
        </div>

        <p className="mb-5 text-xs font-body leading-relaxed text-zinc-650">
          {message}
        </p>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {cancelLabel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl glass-btn px-4 py-2.5 text-[10px] font-display font-bold uppercase tracking-wider text-zinc-800 transition-all cursor-pointer active:scale-[0.98]"
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2.5 text-[10px] font-display font-bold uppercase tracking-wider text-white shadow-sm transition-all cursor-pointer active:scale-[0.98] ${
              isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-500 hover:bg-orange-600'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default ConfirmDialog;
