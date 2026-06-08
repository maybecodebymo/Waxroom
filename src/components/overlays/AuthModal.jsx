import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, ArrowRight, LockKeyhole } from 'lucide-react';
import { auth, isFirebaseConfigured } from '../../utils/firebase';
import { 
  GoogleAuthProvider, 
  OAuthProvider,
  signInWithPopup, 
  linkWithPopup 
} from 'firebase/auth';
import { useGalleryStore } from '../../store/useGalleryStore';

function AuthModal({ onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const backupRoomToCloud = useGalleryStore((state) => state.backupRoomToCloud);

  const handleGoogleAuth = async () => {
    if (!isFirebaseConfigured || !auth) return;
    setLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();

    try {
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.isAnonymous) {
        try {
          // Link anonymous session with Google atomically
          await linkWithPopup(currentUser, provider);
          await backupRoomToCloud();
        } catch (linkErr) {
          if (linkErr.code === 'auth/credential-already-in-use') {
            // If Google credential already exists, sign in directly to that account
            await signInWithPopup(auth, provider);
          } else {
            throw linkErr;
          }
        }
      } else {
        await signInWithPopup(auth, provider);
      }
      onClose();
    } catch (err) {
      console.error('Google authentication failed:', err);
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleAuth = async () => {
    if (!isFirebaseConfigured || !auth) return;
    setLoading(true);
    setError('');
    const provider = new OAuthProvider('apple.com');

    try {
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.isAnonymous) {
        try {
          // Link anonymous session with Apple atomically
          await linkWithPopup(currentUser, provider);
          await backupRoomToCloud();
        } catch (linkErr) {
          if (linkErr.code === 'auth/credential-already-in-use') {
            await signInWithPopup(auth, provider);
          } else {
            throw linkErr;
          }
        }
      } else {
        await signInWithPopup(auth, provider);
      }
      onClose();
    } catch (err) {
      console.error('Apple authentication failed:', err);
      setError(err.message || 'Apple sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-md p-4 pointer-events-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[380px] overflow-hidden rounded-[28px] border border-zinc-200 bg-[#f5f5f3] p-6 text-zinc-950 shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
      >
        <div className="flex items-center justify-between mb-5 border-b border-zinc-200 pb-3">
          <h2 className="font-display text-sm uppercase tracking-wider text-zinc-900 font-extrabold">
            Selector Profile Sync
          </h2>
          <button
            onClick={onClose}
            className="rounded-full glass-btn p-1.5 text-zinc-800 cursor-pointer flex items-center justify-center"
          >
            <X size={14} />
          </button>
        </div>

        {error && (
          <p className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-[10px] text-red-700 font-bold tracking-wide leading-relaxed uppercase">
            {error}
          </p>
        )}

        <div className="text-center mb-6 space-y-2">
          <div className="mx-auto h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mb-3 animate-pulse">
            <LockKeyhole size={20} />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-800">
            Secure Device Link
          </p>
          <p className="text-[10px] font-body text-zinc-500 leading-relaxed max-w-[280px] mx-auto">
            We don't collect, store or handle passwords. Authenticate securely using your existing credentials to sync your vinyl room across mobile and desktop.
          </p>
        </div>

        <div className="space-y-3">
          {/* Google Sync Button */}
          <button
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2.5 rounded-xl border border-zinc-250 bg-white hover:bg-zinc-50 py-3.5 px-6 text-xs font-display font-bold uppercase tracking-wider text-zinc-800 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] shadow-sm"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5.04c1.78 0 3.3.61 4.56 1.81l3.41-3.41C17.9 1.48 15.15 0 12 0 7.31 0 3.28 2.69 1.34 6.61l4.02 3.12C6.31 6.84 8.94 5.04 12 5.04z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.47h6.46c-.28 1.47-1.11 2.72-2.36 3.56l3.65 2.83c2.14-1.97 3.74-4.88 3.74-8.5z"
              />
              <path
                fill="#FBBC05"
                d="M5.36 14.77c-.24-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27L1.34 7.11C.49 8.8.01 10.7.01 12.5s.48 3.7 1.33 5.39l4.02-3.12z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.65-2.83c-1.01.68-2.3 1.08-4.31 1.08-3.06 0-5.69-1.8-6.62-4.69L1.36 17.78C3.3 21.69 7.33 24 12 24z"
              />
            </svg>
            Sync with Google
          </button>

          {/* Apple Sync Button */}
          <button
            onClick={handleAppleAuth}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2.5 rounded-xl border border-zinc-250 bg-black hover:bg-zinc-900 py-3.5 px-6 text-xs font-display font-bold uppercase tracking-wider text-white transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] shadow-sm"
          >
            <svg className="h-4 w-4 shrink-0 fill-current" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.7-1.13 1.84-.99 2.94.12.02.24.03.36.03.95 0 2.06-.56 2.46-1.36z" />
            </svg>
            Sync with Apple
          </button>
        </div>

        <div className="mt-5 text-center">
          <p className="text-[9px] font-display font-bold uppercase tracking-widest text-zinc-400">
            Secure connection powered by Firebase Auth
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default AuthModal;
