import type { MaterialUnit } from "@/lib/constants/enums/material-units";
import {
  getEnteredQuantityInBaseUnit,
  resolveDisplayUnit,
  toDisplayQuantity,
} from "@/lib/helpers/unit-conversion";

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