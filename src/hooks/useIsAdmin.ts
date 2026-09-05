import { useAuth } from './useAuth';

const ADMIN_UID = import.meta.env.VITE_ADMIN_UID;

/**
 * True only when this device is signed in as the one admin account (see
 * `firestore.rules` `isAdmin()` and README "Admin access"). Everyone else,
 * including every organizer/note-taker on their own anonymous session, is false.
 */
export function useIsAdmin(): boolean {
  const { uid } = useAuth();
  return !!uid && !!ADMIN_UID && uid === ADMIN_UID;
}
