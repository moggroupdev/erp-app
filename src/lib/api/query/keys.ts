export type ListFilters = Record<string, string | number | boolean | null | undefined>;

export const queryKeys = {
  locations: {
    all: ["locations"] as const,
  },
  departments: {
    all: ["departments"] as const,
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
