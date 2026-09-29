import type { MaterialUnit } from "@/lib/constants/enums/material-units";
import { getEnteredQuantityInBaseUnit, resolveDisplayUnit, toDisplayQuantity } from "@/lib/helpers/unit-conversion";

const QUANTITY_MAX_FRACTION_DIGITS = 5;

function trimTrailingZeros(fixed: string): string {
  const trimmed = fixed.replace(/\.?0+$/, "");
  return trimmed === "-0" ? "0" : trimmed;
}

/** Format a quantity for display: cap at 6 decimal places only when the value has more. */
export function formatQuantity(value: number | string): string {
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value);

  const normalized = trimTrailingZeros(num.toFixed(10));
  const decimalPart = normalized.split(".")[1];

  if ((decimalPart?.length ?? 0) > QUANTITY_MAX_FRACTION_DIGITS) {
    return trimTrailingZeros(num.toFixed(QUANTITY_MAX_FRACTION_DIGITS));
  }

  return normalized;
}

/** Format a base-unit quantity after converting it to the target display unit. */
export function formatBaseQuantityForDisplay(baseQuantity: number, factor: number): string {
  return formatQuantity(toDisplayQuantity(baseQuantity, factor));
}

/** @deprecated Use `formatBaseQuantityForDisplay` — input quantity must be in the material's base unit. */
export function formatDisplayQuantity(baseQuantity: number, factor: number): string {
  return formatBaseQuantityForDisplay(baseQuantity, factor);
}

type UnitConvertibleMaterial = {
  unitOfMeasurement: MaterialUnit;
  unitConversions: { unit: MaterialUnit; conversionFactorToBase: number }[];
};

/** Format an entered-unit quantity for display in another unit. */
export function formatEnteredQuantityForDisplay(
  enteredQuantity: number,
  enteredUnit: MaterialUnit,
  displayUnit: MaterialUnit,
  material: UnitConvertibleMaterial,
): string {
  if (enteredUnit === displayUnit) return formatQuantity(enteredQuantity);

  const baseQuantity = getEnteredQuantityInBaseUnit(enteredQuantity, enteredUnit, material);
  const { factor } = resolveDisplayUnit(displayUnit, material.unitOfMeasurement, material.unitConversions);

  return formatQuantity(toDisplayQuantity(baseQuantity, factor));
}

/** @deprecated Use `formatEnteredQuantityForDisplay`. */
export const formatQuantityInUnit = formatEnteredQuantityForDisplay;
