const CONVERSION_FACTOR_DISPLAY_SCALE = 6;

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
