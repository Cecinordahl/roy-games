interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
}

export function ScreenHeader({ title, subtitle }: ScreenHeaderProps) {
  return (
    <header className="border-b-2 border-ink bg-surface px-4 py-4">
      <h1 className="font-pixel text-sm leading-relaxed text-ink">{title}</h1>
      {subtitle && <p className="mt-2 text-sm text-ink/70">{subtitle}</p>}
    </header>
  );
}
