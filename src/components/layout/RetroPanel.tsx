import type { HTMLAttributes } from 'react';

export function RetroPanel({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`border-2 border-ink bg-surface p-4 ${className}`} {...props} />;
}
