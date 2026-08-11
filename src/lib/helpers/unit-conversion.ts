const CONVERSION_FACTOR_SCALE = 5;

export function roundConversionFactor(factor: number): number {
  return Number(factor.toFixed(CONVERSION_FACTOR_SCALE));
}

/** Convert a user-entered factor into stored "1 alternate = X base" form. */
export function toStoredConversionFactorToBase(entered: number, fromBase: boolean): number {
  return roundConversionFactor(fromBase ? 1 / entered : entered);
}

/** Readable conversion: reverse when factor < 1 so the displayed number is >= 1. */
export function formatConversionLabel(
  conversionFactorToBase: number,
  alternateUnitLabel: string,
  baseUnitLabel: string,
): string {
  const factor = Number(conversionFactorToBase);

  if (factor > 0 && factor < 1) {
    return `1 ${baseUnitLabel} = ${roundConversionFactor(1 / factor)} ${alternateUnitLabel}`;
  }

  return `1 ${alternateUnitLabel} = ${roundConversionFactor(factor)} ${baseUnitLabel}`;
}

export function toDisplayQuantity(baseQuantity: number, factor: number): number {
  return factor === 0 ? Number(baseQuantity) : Number(baseQuantity) / factor;
}

export function toDisplayUnitPrice(baseUnitPrice: number, factor: number): number {
  return Number(baseUnitPrice) * factor;
}
