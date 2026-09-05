import type { ButtonHTMLAttributes } from 'react';

export type RetroButtonVariant = 'primary' | 'secondary' | 'danger';

const variantClasses: Record<RetroButtonVariant, string> = {
  primary: 'bg-sage',
  secondary: 'bg-surface',
  danger: 'bg-pink',
};

/** Shared classes so non-<button> elements (e.g. <Link>) can look like a RetroButton. */
export function retroButtonClasses(variant: RetroButtonVariant = 'primary', className = ''): string {
  return `inline-block border-2 border-ink px-4 py-3 text-center font-semibold text-ink shadow-chunky transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`;
}

interface RetroButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: RetroButtonVariant;
}

export function RetroButton({ variant = 'primary', className = '', ...props }: RetroButtonProps) {
  return <button className={retroButtonClasses(variant, className)} {...props} />;
}
