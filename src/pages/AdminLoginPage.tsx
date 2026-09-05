import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { useState, type FormEvent } from 'react';
import { BackLink } from '../components/layout/BackLink';
import { RetroButton } from '../components/layout/RetroButton';
import { RetroPanel } from '../components/layout/RetroPanel';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { auth, ensureSignedIn } from '../data/firebase';
import { useAuth } from '../hooks/useAuth';
import { useIsAdmin } from '../hooks/useIsAdmin';

export function AdminLoginPage() {
  const { uid } = useAuth();
  const isAdmin = useIsAdmin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      setError('Feil e-post eller passord.');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await signOut(auth);
    await ensureSignedIn();
  }

  return (
    <div>
      <BackLink to="/" label="Hjem" />
      <ScreenHeader title="Administrator" />
      <div className="space-y-4 p-4">
        {isAdmin ? (
          <RetroPanel className="bg-sage/30">
            <p className="text-sm">Du er logget inn som administrator på denne enheten.</p>
            <RetroButton type="button" variant="secondary" className="mt-3 w-full" onClick={handleLogout}>
              Logg ut
            </RetroButton>
          </RetroPanel>
        ) : (
          <RetroPanel>
            <p className="mb-3 text-sm text-ink/70">
              Kun for administrator-kontoen. Andre familiemedlemmer trenger ikke logge inn — de bruker appen som vanlig.
            </p>
            <form onSubmit={handleLogin} className="space-y-2">
              <label className="block text-sm font-semibold" htmlFor="email">
                E-post
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                className="w-full border-2 border-ink bg-white px-2 py-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <label className="block text-sm font-semibold" htmlFor="password">
                Passord
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className="w-full border-2 border-ink bg-white px-2 py-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {error && <p className="text-sm text-negative">{error}</p>}
              <RetroButton type="submit" className="w-full" disabled={loading || !email || !password}>
                Logg inn
              </RetroButton>
            </form>
          </RetroPanel>
        )}
        {uid && !isAdmin && <p className="text-xs text-ink/40">Enhets-id: {uid}</p>}
      </div>
    </div>
  );
}
