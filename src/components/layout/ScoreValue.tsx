export function ScoreValue({ value }: { value: number }) {
  const color = value > 0 ? 'text-positive' : value < 0 ? 'text-negative' : 'text-ink';
  return <span className={`tabular-nums font-semibold ${color}`}>{value}</span>;
}
