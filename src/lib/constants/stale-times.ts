const MINUTE = 60 * 1000;

/** Per-resource stale times. Data is not refetched while still fresh. */
export const staleTimes = {
  suppliers: 10 * MINUTE,
  customers: 5 * MINUTE,
  users: 30 * MINUTE,
  materials: 10 * MINUTE,
  mmBoms: 10 * MINUTE,
  products: 30 * MINUTE,
  boms: 10 * MINUTE,
  inventoryTransactions: 5 * MINUTE,
  legacyIssuePermits: 5 * MINUTE,
  materialPurchaseOrders: 5 * MINUTE,
  reports: {
    materialsInventorySummary: 5 * MINUTE,
    materialsCategoryStats: 5 * MINUTE,
    purchasingMaterialsSpendingSummary: 5 * MINUTE,
    purchasingMaterialsPriceHistory: 5 * MINUTE,
    purchasingMaterialsCategoryStats: 5 * MINUTE,
    purchasingMaterialsSubCategoryStats: 5 * MINUTE,
    purchasingMaterialsSupplierStats: 5 * MINUTE,
    purchasingMaterialsTotalAmountMismatches: 5 * MINUTE,
  },
  locations: Infinity,
  departments: Infinity,
  roles: Infinity,
  categories: Infinity,
} as const;
