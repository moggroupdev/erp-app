export type DashboardPartyCounts = {
  total: number;
  blacklisted: number;
};

export type DashboardQuickStats = {
  directory: {
    customers: DashboardPartyCounts;
    suppliers: DashboardPartyCounts;
  };
  catalog: {
    materials: {
      total: number;
      inventoryValue: number;
      lowStock: number;
      outOfStock: number;
    };
    products: {
      total: number;
    };
  };
  procurement: {
    requisitions: {
      pending: number;
      approved: number;
      rejected: number;
    };
    purchaseOrders: {
      open: number;
      completed: number;
      cancelled: number;
    };
    invoices: {
      count: number;
      totalAmount: number;
    };
  };
};
