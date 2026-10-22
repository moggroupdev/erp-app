import type { Locale } from "@/lib/i18n/types";

export const DEFAULT_SENSITIVITY = 2;
export const MIN_SENSITIVITY = 1.05;
export const SENSITIVITY_DECIMALS = 2;

export function parseSensitivity(raw: string | null): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < MIN_SENSITIVITY) return DEFAULT_SENSITIVITY;
  return roundSensitivity(n);
}

export function formatSensitivityLabel(value: number, locale: Locale) {
  const formatted = String(roundSensitivity(value));
  return locale === "ar" ? `${formatted}×` : `${formatted}x`;
}

export function roundSensitivity(value: number) {
  const factor = 10 ** SENSITIVITY_DECIMALS;
  return Math.round(value * factor) / factor;
}

export function toCommittedSensitivity(value: number | string) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < MIN_SENSITIVITY) return null;
  return roundSensitivity(n);
}
