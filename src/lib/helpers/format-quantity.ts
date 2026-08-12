import { toDisplayQuantity } from "@/lib/helpers/unit-conversion";

const QUANTITY_MAX_FRACTION_DIGITS = 2;

/** Format a quantity for display: cap at 2 decimal places only when the value has more. */
export function formatQuantity(value: number | string): string {
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value);

  const normalized = num.toFixed(10).replace(/\.?0+$/, "");
  const decimalPart = normalized.split(".")[1];

  if ((decimalPart?.length ?? 0) > QUANTITY_MAX_FRACTION_DIGITS) {
    return num.toFixed(QUANTITY_MAX_FRACTION_DIGITS);
  }

  return normalized;
}

/** Convert base quantity to display unit, then apply quantity display formatting. */
export function formatDisplayQuantity(baseQuantity: number, factor: number): string {
  return formatQuantity(toDisplayQuantity(baseQuantity, factor));
}