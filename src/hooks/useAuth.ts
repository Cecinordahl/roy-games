import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { auth, ensureSignedIn } from '../data/firebase';

/** Anonymous auth gives this device a stable UID; no sign-up, no accounts. */
export function useAuth(): { uid: string | null } {
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);

  useEffect(() => {
    ensureSignedIn();
    return onAuthStateChanged(auth, (user) => setUid(user?.uid ?? null));
  }, []);

  return { uid };
}
