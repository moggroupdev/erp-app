import type { MaterialUnit } from "@/lib/constants/enums/material-units";

const CONVERSION_FACTOR_DISPLAY_SCALE = 6;

const MASS_TO_GRAM: Partial<Record<MaterialUnit, number>> = {
  gram: 1,
  kg: 1000,
  ton: 1_000_000,
};

const LENGTH_TO_CM: Partial<Record<MaterialUnit, number>> = {
  cm: 1,
  meter: 100,
};

const KNOWN_UNIT_GROUPS: Partial<Record<MaterialUnit, number>>[] = [MASS_TO_GRAM, LENGTH_TO_CM];

/** Exact "1 unit = X base" factor when both units share a known group; otherwise null. */
export function getKnownConversionFactorToBase(unit: MaterialUnit, baseUnit: MaterialUnit): number | null {
  for (const group of KNOWN_UNIT_GROUPS) {
    if (group[unit] !== undefined && group[baseUnit] !== undefined) {
      return group[unit]! / group[baseUnit]!;
    }
  }

  return null;
}

function formatFactorForDisplay(factor: number): string {
  return factor.toFixed(CONVERSION_FACTOR_DISPLAY_SCALE).replace(/\.?0+$/, "");
}

/** Convert a user-entered factor into stored "1 alternate = X base" form. */
export function toStoredConversionFactorToBase(entered: number, fromBase: boolean): number {
  return fromBase ? 1 / entered : entered;
}

/** Readable conversion: reverse when factor < 1 so the displayed number is >= 1. */
export function formatConversionLabel(
  conversionFactorToBase: number,
  alternateUnitLabel: string,
  baseUnitLabel: string,
): string {
  const factor = Number(conversionFactorToBase);

  if (factor > 0 && factor < 1) {
    return `1 ${baseUnitLabel} = ${formatFactorForDisplay(1 / factor)} ${alternateUnitLabel}`;
  }

  return `1 ${alternateUnitLabel} = ${formatFactorForDisplay(factor)} ${baseUnitLabel}`;
}

export function toDisplayQuantity(baseQuantity: number, factor: number): number {
  return factor === 0 ? Number(baseQuantity) : Number(baseQuantity) / factor;
}

export function toDisplayUnitPrice(baseUnitPrice: number, factor: number): number {
  return Number(baseUnitPrice) * factor;
}
