import { NavLink } from 'react-router-dom';

const items = [
  { to: '/', label: 'Hjem', icon: '🏠' },
  { to: '/players', label: 'Spillere', icon: '🧑‍🤝‍🧑' },
  { to: '/history', label: 'Historikk', icon: '📜' },
];

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t-2 border-ink bg-surface">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) => `flex flex-1 flex-col items-center gap-1 py-2 ${isActive ? 'bg-sage' : ''}`}
        >
          <span className="text-xl">{item.icon}</span>
          <span className="font-pixel text-[9px] text-ink">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
