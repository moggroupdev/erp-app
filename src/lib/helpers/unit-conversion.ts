import type { MaterialUnit } from "@/lib/constants/enums/material-units";

const CONVERSION_FACTOR_DISPLAY_SCALE = 3;

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

function getGroupRatio(unitA: MaterialUnit, unitB: MaterialUnit): number | null {
  for (const group of KNOWN_UNIT_GROUPS)
    if (group[unitA] !== undefined && group[unitB] !== undefined) return group[unitA]! / group[unitB]!;

  return null;
}

/** Exact "1 unit = X base" factor when both units share a known group, or via an existing alternate; otherwise null. */
export function getKnownConversionFactorToBase(
  unit: MaterialUnit,
  baseUnit: MaterialUnit,
  existingConversions: { unit: MaterialUnit; conversionFactorToBase: number }[] = [],
): number | null {
  const directFactor = getGroupRatio(unit, baseUnit);
  if (directFactor != null) return directFactor;

  for (const existing of existingConversions) {
    const ratioToExisting = getGroupRatio(unit, existing.unit);
    if (ratioToExisting != null) return ratioToExisting * Number(existing.conversionFactorToBase);
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

  if (factor > 0 && factor < 1) return `1 ${baseUnitLabel} = ${formatFactorForDisplay(1 / factor)} ${alternateUnitLabel}`;

  return `1 ${alternateUnitLabel} = ${formatFactorForDisplay(factor)} ${baseUnitLabel}`;
}

export function toBaseQuantity(enteredQuantity: number, factor: number): number {
  return Number(enteredQuantity) * factor;
}

export function toDisplayQuantity(baseQuantity: number, factor: number): number {
  return factor === 0 ? Number(baseQuantity) : Number(baseQuantity) / factor;
}

export function toDisplayUnitPrice(baseUnitPrice: number, factor: number): number {
  return Number(baseUnitPrice) * factor;
}

/**
 * Resolve which unit/factor to show for a material given a preferred table-level unit.
 * Falls back to the material's base unit when the preferred unit cannot be converted.
 */
export function resolveDisplayUnit(
  preferredUnit: MaterialUnit | null | undefined,
  baseUnit: MaterialUnit,
  unitConversions: { unit: MaterialUnit; conversionFactorToBase: number }[] = [],
): { unit: MaterialUnit; factor: number } {
  if (!preferredUnit || preferredUnit === baseUnit) {
    return { unit: baseUnit, factor: 1 };
  }

  const stored = unitConversions.find((row) => row.unit === preferredUnit);
  if (stored) {
    return { unit: preferredUnit, factor: Number(stored.conversionFactorToBase) };
  }

  const knownFactor = getKnownConversionFactorToBase(preferredUnit, baseUnit, unitConversions);
  if (knownFactor != null) {
    return { unit: preferredUnit, factor: knownFactor };
  }

  return { unit: baseUnit, factor: 1 };
}

type UnitConvertibleMaterial = {
  unitOfMeasurement: MaterialUnit;
  unitConversions: { unit: MaterialUnit; conversionFactorToBase: number }[];
};

export function getEnteredQuantityInBaseUnit(
  quantity: number,
  unitOfMeasurementSelected: MaterialUnit | null | undefined,
  material: UnitConvertibleMaterial,
): number {
  const { factor } = resolveDisplayUnit(unitOfMeasurementSelected, material.unitOfMeasurement, material.unitConversions);

  return toBaseQuantity(quantity, factor);
}

export type BaseQuantityMaterialRow = {
  unitOfMeasurement: MaterialUnit;
  unitConversions?: { unit: MaterialUnit; conversionFactorToBase: number }[];
  totalQuantity: number;
  avgUnitPrice: number;
};

export function mapBaseQuantityMaterialRowForDisplay<T extends BaseQuantityMaterialRow>(
  row: T,
  preferredUnit: MaterialUnit | null | undefined,
) {
  const { unit, factor } = resolveDisplayUnit(preferredUnit, row.unitOfMeasurement, row.unitConversions ?? []);

  return {
    row,
    unit,
    factor,
    displayQuantity: toDisplayQuantity(row.totalQuantity, factor),
    displayAvgUnitPrice: toDisplayUnitPrice(row.avgUnitPrice, factor),
  };
}

export function mapBaseQuantityMaterialRowsForDisplay<T extends BaseQuantityMaterialRow>(
  rows: T[],
  preferredUnit: MaterialUnit | null | undefined,
) {
  return rows.map((row) => mapBaseQuantityMaterialRowForDisplay(row, preferredUnit));
}

export function sumDisplayQuantitiesWhenUnitsMatch<T extends { unit: MaterialUnit; displayQuantity: number }>(
  displayRows: T[],
): number | null {
  if (displayRows.length === 0) return null;
  if (!displayRows.every((item) => item.unit === displayRows[0].unit)) return null;

  return displayRows.reduce((sum, item) => sum + item.displayQuantity, 0);
}
