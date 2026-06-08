import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, LockKeyhole, Mail } from 'lucide-react';
import { auth, isFirebaseConfigured } from '../../utils/firebase';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  linkWithPopup,
  sendSignInLinkToEmail
} from 'firebase/auth';
import { useGalleryStore } from '../../store/useGalleryStore';

function AuthModal({ onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
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
          onClose();
        } catch (linkErr) {
          if (linkErr.code === 'auth/credential-already-in-use') {
            const confirmMerge = window.confirm(
              "This Google account is already linked to another Waxroom. Signing in will switch to that room and discard your current local changes. Do you want to continue?"
            );
            if (confirmMerge) {
              await signInWithPopup(auth, provider);
              onClose();
            }
          } else {
            throw linkErr;
          }
        }
      } else {
        await signInWithPopup(auth, provider);
        onClose();
      }
    } catch (err) {
      console.error('Google authentication failed:', err);
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!isFirebaseConfigured || !auth) return;
    setLoading(true);
    setError('');
    setEmailSent(false);

    try {
      const actionCodeSettings = {
        // Return URL. Must be in the authorized domains list in Firebase console.
        url: window.location.origin + window.location.pathname + (window.location.search ? window.location.search : ''),
        handleCodeInApp: true,
      };

      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      
      // Save email locally to complete sign-in on redirect
      window.localStorage.setItem('emailForSignIn', email);
      setEmailSent(true);
    } catch (err) {
      console.error('Email verification link send failed:', err);
      setError(err.message || 'Failed to send verification link');
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
            We don't collect, store or handle passwords. Authenticate securely using your email or Google credentials to sync your vinyl room.
          </p>
        </div>

        {/* Email Passwordless Sync Form */}
        <form onSubmit={handleEmailAuth} className="space-y-3 border-b border-zinc-200 pb-5 mb-5">
          <p className="text-[10px] font-display font-bold uppercase tracking-wider text-zinc-500 text-left">
            Sync via Email Link
          </p>
          <div className="flex flex-col gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="w-full rounded-xl border border-zinc-250 bg-white/70 px-4 py-2.5 text-xs font-medium text-zinc-800 placeholder-zinc-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
            />
            <button
              type="submit"
              disabled={loading || emailSent}
              className={`w-full inline-flex items-center justify-center gap-2 rounded-xl py-3 px-6 text-xs font-display font-bold uppercase tracking-wider text-white transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] shadow-sm ${
                emailSent ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-orange-500 hover:bg-orange-600'
              }`}
            >
              {emailSent ? (
                <>✓ Verification Link Sent!</>
              ) : (
                <>
                  <Mail size={12} /> Send Verification Link
                </>
              )}
            </button>
          </div>
        </form>

        <div className="space-y-3">
          <p className="text-[10px] font-display font-bold uppercase tracking-wider text-zinc-400 text-center mb-1">
            — OR —
          </p>
          
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
