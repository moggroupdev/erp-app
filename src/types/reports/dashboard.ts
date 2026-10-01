export type DashboardPeriod = "week" | "month" | "overall";

export type DashboardStatusCounts = {
  pending: number;
  approved: number;
  rejected: number;
};

export type DashboardOrderCounts = {
  open: number;
  completed: number;
  cancelled: number;
};

export type DashboardPeriodStats = {
  customersCreated: number;
  suppliersCreated: number;
  materialsCreated: number;
  productsCreated: number;
  requisitions: DashboardStatusCounts;
  purchaseOrders: DashboardOrderCounts;
  invoices: {
    count: number;
    totalAmount: number;
  };
  legacyIssuePermits: {
    active: number;
    cancelled: number;
  };
};

export type DashboardStock = {
  inventoryValue: number;
  outOfStock: number;
  lowStock: number;
  inStock: number;
};

export type DashboardRecentLegacyIssuePermit = {
  id: string;
  issuePermitNumber: string;
  date: string;
  productionSubDepartment: string | null;
  isCancelled: boolean;
  contractNumber: string | null;
};

export type DashboardQuickStats = {
  periods: Record<DashboardPeriod, DashboardPeriodStats>;
  stock: DashboardStock;
  recentLegacyIssuePermits: DashboardRecentLegacyIssuePermit[];
};
