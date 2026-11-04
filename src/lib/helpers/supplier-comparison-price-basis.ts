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
        totalDifference: 0,
        potentialSavings: 0,
      };
    }

    const equal = Math.abs(priceA - priceB) < PRICE_EQUAL_EPSILON;
    const cheaper: "a" | "b" | "equal" = equal ? "equal" : priceA < priceB ? "a" : "b";
    const lower = Math.min(priceA, priceB);
    const higher = Math.max(priceA, priceB);
    const priceGapPercent = equal || lower === 0 ? 0 : ((higher - lower) / lower) * 100;
    // Signed A − B so positive means A is higher and negative means B is higher.
    // When unit prices are equal, both unit and total diffs stay empty (volume gaps are ignored).
    const priceDifference = equal ? 0 : priceA - priceB;
    const totalDifference = equal ? 0 : item.a.quantity * priceA - item.b.quantity * priceB;
    const potentialSavings = equal
      ? 0
      : cheaper === "a"
        ? item.b.quantity * (priceB - priceA)
        : item.a.quantity * (priceA - priceB);

    return {
      ...item,
      cheaper,
      priceGapPercent,
      priceDifference,
      totalDifference,
      potentialSavings,
    };
  });
}
