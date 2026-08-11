export function toDisplayQuantity(baseQuantity: number, factor: number): number {
  return factor === 0 ? Number(baseQuantity) : Number(baseQuantity) / factor;
}

export function toDisplayUnitPrice(baseUnitPrice: number, factor: number): number {
  return Number(baseUnitPrice) * factor;
}
