const MINUTE = 60 * 1000;

/** Per-resource stale times. Data is not refetched while still fresh. */
export const staleTimes = {
  vendors: 10 * MINUTE,
  customers: 5 * MINUTE,
  locations: Infinity,
  departments: Infinity,
  roles: Infinity,
} as const;
