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
  materialPurchaseOrders: 5 * MINUTE,
  reports: {
    materialsInventorySummary: 5 * MINUTE,
    materialsCategoryStats: 5 * MINUTE,
  },
  locations: Infinity,
  departments: Infinity,
  roles: Infinity,
  categories: Infinity,
} as const;
