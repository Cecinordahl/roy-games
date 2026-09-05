const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Formats an ISO date string ("2026-07-15", from an <input type="date">) as Norwegian "15.07.2026". */
export function formatNorwegianDate(iso: string): string {
  const match = iso.match(ISO_DATE_PATTERN);
  if (!match) return iso;
  const [, year, month, day] = match;
  return `${day}.${month}.${year}`;
}
