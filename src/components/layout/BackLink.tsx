import { Link } from 'react-router-dom';

export function BackLink({ to, label = 'Tilbake' }: { to: string; label?: string }) {
  return (
    <Link to={to} className="inline-flex items-center gap-1 px-4 pt-3 text-sm font-semibold text-ink/70 hover:text-ink">
      ← {label}
    </Link>
  );
}
