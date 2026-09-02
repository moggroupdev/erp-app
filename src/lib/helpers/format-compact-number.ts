/** Format large numbers for compact display (e.g. chart axes): 125000 → "125k", 3400000 → "3.4M". */
export function formatCompactNumber(value: number): string {
  if (!Number.isFinite(value)) return String(value);

  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    const millions = value / 1_000_000;
    return `${Number(millions.toFixed(1))}M`;
  }
  if (abs >= 1_000) {
    const thousands = value / 1_000;
    return `${Number(thousands.toFixed(1))}k`;
  }
  return String(value);
}
