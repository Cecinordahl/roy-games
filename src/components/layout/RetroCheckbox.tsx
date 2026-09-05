import type { InputHTMLAttributes } from 'react';

interface RetroCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

/** A hard-edged, pixel-style checkbox — a native input underneath for accessibility. */
export function RetroCheckbox({ label, className = '', checked, ...props }: RetroCheckboxProps) {
  return (
    <label className={`inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-ink ${className}`}>
      <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center border-2 border-ink bg-white">
        <input
          type="checkbox"
          checked={checked}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          {...props}
        />
        {checked && <span className="pointer-events-none h-2.5 w-2.5 bg-sage-dark" />}
      </span>
      {label}
    </label>
  );
}
