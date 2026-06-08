import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Mail, Lock, User, ArrowRight, LockKeyhole } from 'lucide-react';
import { auth, isFirebaseConfigured } from '../../utils/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup, 
  linkWithCredential, 
  EmailAuthProvider,
  updateProfile
} from 'firebase/auth';
import { useGalleryStore } from '../../store/useGalleryStore';

function AuthModal({ onClose }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const backupRoomToCloud = useGalleryStore((state) => state.backupRoomToCloud);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!isFirebaseConfigured || !auth) return;
    setLoading(true);
    setError('');

    try {
      const currentUser = auth.currentUser;
      
      if (isSignUp) {
        // Sign up and link if anonymous
        if (currentUser && currentUser.isAnonymous) {
          const credential = EmailAuthProvider.credential(email, password);
          try {
            await linkWithCredential(currentUser, credential);
            if (displayName.trim()) {
              await updateProfile(currentUser, { displayName: displayName.trim() });
            }
            // Trigger auto-backup of their current albums to their newly created account
            await backupRoomToCloud();
          } catch (linkErr) {
            // If the email already exists, standard sign in
            if (linkErr.code === 'auth/email-already-in-use') {
              const cred = await signInWithEmailAndPassword(auth, email, password);
              // Store automatically updates onAuthStateChanged
            } else {
              throw linkErr;
            }
          }
        } else {
          const userCred = await createUserWithEmailAndPassword(auth, email, password);
          if (displayName.trim() && userCred.user) {
            await updateProfile(userCred.user, { displayName: displayName.trim() });
          }
        }
      } else {
        // Sign In
        await signInWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err) {
      console.error('Email authentication failed:', err);
      let msg = err.message;
      if (err.code === 'auth/invalid-credential') msg = 'Invalid email or password.';
      else if (err.code === 'auth/email-already-in-use') msg = 'This email is already in use.';
      else if (err.code === 'auth/weak-password') msg = 'Password should be at least 6 characters.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (!isFirebaseConfigured || !auth) return;
    setLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();

    try {
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.isAnonymous) {
        try {
          await linkWithCredential(currentUser, GoogleAuthProvider.credentialFromResult());
          await backupRoomToCloud();
        } catch (linkErr) {
          if (linkErr.code === 'auth/credential-already-in-use') {
            // Already exists, just sign in directly
            await signInWithPopup(auth, provider);
          } else {
            // Fallback sign in
            await signInWithPopup(auth, provider);
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
        className="w-full max-w-[400px] overflow-hidden rounded-[28px] border border-zinc-200 bg-[#f5f5f3] p-6 text-zinc-950 shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
      >
        <div className="flex items-center justify-between mb-4 border-b border-zinc-200 pb-3">
          <h2 className="font-display text-lg uppercase tracking-wider text-zinc-900">
            {isSignUp ? 'Create Selector Profile' : 'Sign In'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full glass-btn p-1.5 text-zinc-800 cursor-pointer flex items-center justify-center"
          >
            <X size={14} />
          </button>
        </div>

        {error && (
          <p className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-bold tracking-wide leading-relaxed">
            {error}
          </p>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4">
          {isSignUp && (
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="DISPLAY NAME"
                className="w-full rounded-xl border border-zinc-200 bg-white py-3 !pl-11 pr-4 text-xs font-bold tracking-wider text-zinc-900 outline-none transition-all shadow-sm focus:border-orange-500"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="EMAIL ADDRESS"
              className="w-full rounded-xl border border-zinc-200 bg-white py-3 !pl-11 pr-4 text-xs font-bold tracking-wider text-zinc-900 outline-none transition-all shadow-sm focus:border-orange-500"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="PASSWORD"
              className="w-full rounded-xl border border-zinc-200 bg-white py-3 !pl-11 pr-4 text-xs font-bold tracking-wider text-zinc-900 outline-none transition-all shadow-sm focus:border-orange-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 py-3.5 px-6 text-xs font-display font-bold uppercase tracking-wider text-white shadow-[0_4px_12px_rgba(234,88,12,0.2)] transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none cursor-pointer active:scale-[0.98]"
          >
            {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'} <ArrowRight size={14} />
          </button>
        </form>

        <div className="relative my-5 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-200"></div>
          </div>
          <span className="relative bg-[#f5f5f3] px-3 text-[9px] font-display font-bold tracking-widest text-zinc-400 uppercase">
            Or Sync With
          </span>
        </div>

        <button
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 py-3 px-6 text-xs font-display font-bold uppercase tracking-wider text-zinc-800 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] shadow-sm mb-4"
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
          Google Sync
        </button>

        <div className="text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[10px] font-display font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-950 transition cursor-pointer"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default AuthModal;
