export function TrashIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 26"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 6C8 3 9.8 2 12 2s4 1 4 4" />
      <line x1="4" y1="7" x2="20" y2="7" />
      <path d="M5.5 9l1.7 13.3A2 2 0 0 0 9.2 24h5.6a2 2 0 0 0 2-1.7L18.5 9" />
      <line x1="9.5" y1="12" x2="9.5" y2="20" />
      <line x1="12" y1="12" x2="12" y2="20" />
      <line x1="14.5" y1="12" x2="14.5" y2="20" />
    </svg>
  );
}
