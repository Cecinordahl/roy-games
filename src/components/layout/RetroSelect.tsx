import type { SelectHTMLAttributes } from 'react';

export function RetroSelect({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`inline-block border-2 border-ink bg-white px-3 py-2 font-semibold text-ink shadow-chunky-sm focus:outline-none focus:ring-2 focus:ring-sage-dark ${className}`}
      {...props}
    />
  );
}
