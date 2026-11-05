import type { PurchasingMaterialsSupplierComparisonMutualItem } from "@/types/reports";

export type SupplierComparisonPriceBasis = "last" | "avg";

const PRICE_EQUAL_EPSILON = 1e-9;

export function applyPriceBasis(
  items: PurchasingMaterialsSupplierComparisonMutualItem[],
  priceBasis: SupplierComparisonPriceBasis,
): PurchasingMaterialsSupplierComparisonMutualItem[] {
  return items.map((item) => {
    const priceA = priceBasis === "avg" ? item.a.avgUnitPrice : item.a.lastUnitPrice;
    const priceB = priceBasis === "avg" ? item.b.avgUnitPrice : item.b.lastUnitPrice;

    if (priceA == null || priceB == null) {
      return {
        ...item,
        cheaper: "equal",
        priceGapPercent: 0,
        priceDifference: 0,
        potentialSavingsA: 0,
        potentialSavingsB: 0,
        potentialSavings: 0,
      };
    }

    const equal = Math.abs(priceA - priceB) < PRICE_EQUAL_EPSILON;
    const cheaper: "a" | "b" | "equal" = equal ? "equal" : priceA < priceB ? "a" : "b";
    const lower = Math.min(priceA, priceB);
    const higher = Math.max(priceA, priceB);
    const priceGapPercent = equal || lower === 0 ? 0 : ((higher - lower) / lower) * 100;
    // Signed A − B so positive means A is higher and negative means B is higher.
    // When unit prices are equal, unit diff and both savings directions stay empty.
    const priceDifference = equal ? 0 : priceA - priceB;
    // Savings attributed to the cheaper supplier (qty of the other × price gap).
    const potentialSavingsA = cheaper === "a" ? item.b.quantity * (priceB - priceA) : 0;
    const potentialSavingsB = cheaper === "b" ? item.a.quantity * (priceA - priceB) : 0;
    const potentialSavings = potentialSavingsA + potentialSavingsB;

    return {
      ...item,
      cheaper,
      priceGapPercent,
      priceDifference,
      potentialSavingsA,
      potentialSavingsB,
      potentialSavings,
    };
  });
}
