export type ListFilters = Record<string, string | number | boolean | null | undefined>;

/**
 * Central React Query cache keys for the app.
 *
 * Keys form a hierarchy so you can invalidate a broad group or one exact query:
 *
 * - `all`       - prefix for everything under a resource (e.g. all vendor caches)
 * - `lists()`   - prefix for every list query of that resource
 * - `list(f)`   - one list for a specific filter set (page, search, …)
 * - `details()` - prefix for every single-item (detail) query
 * - `detail(id)`- one item by id
 *
 * Example: invalidating `queryKeys.vendors.all` refreshes lists, details, and addresses.
 * Invalidating `queryKeys.vendors.detail(id)` refreshes only that vendor (and nested keys that start with it).
 */
export const queryKeys = {
  locations: {
    all: ["locations"] as const,
  },
  departments: {
    all: ["departments"] as const,
  },
  roles: {
    all: ["roles"] as const,
    lists: () => [...queryKeys.roles.all, "list"] as const,
    list: (filters: ListFilters) => [...queryKeys.roles.lists(), filters] as const,
    details: () => [...queryKeys.roles.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.roles.details(), id] as const,
  },
  users: {
    all: ["users"] as const,
    lists: () => [...queryKeys.users.all, "list"] as const,
    list: (filters: ListFilters) => [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },
  vendors: {
    all: ["vendors"] as const,
    lists: () => [...queryKeys.vendors.all, "list"] as const,
    list: (filters: ListFilters) => [...queryKeys.vendors.lists(), filters] as const,
    details: () => [...queryKeys.vendors.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.vendors.details(), id] as const,
    addresses: (id: string) => [...queryKeys.vendors.detail(id), "addresses"] as const,
  },
  customers: {
    all: ["customers"] as const,
    lists: () => [...queryKeys.customers.all, "list"] as const,
    list: (filters: ListFilters) => [...queryKeys.customers.lists(), filters] as const,
    details: () => [...queryKeys.customers.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.customers.details(), id] as const,
    addresses: (id: string) => [...queryKeys.customers.detail(id), "addresses"] as const,
  },
  products: {
    all: ["products"] as const,
    lists: () => [...queryKeys.products.all, "list"] as const,
    list: (filters: ListFilters) => [...queryKeys.products.lists(), filters] as const,
  },
  profile: {
    all: ["profile"] as const,
  },
};
