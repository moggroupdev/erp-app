import type { MaterialUnit } from "@/lib/constants/enums/material-units";

// ================ Spending Summary ================

export type PurchasingMaterialsOverview = {
  totalSpend: number;
  totalOrders: number;
  avgOrderValue: number;
  completedCount: number;
  completedAmount: number;
  openCount: number;
  openAmount: number;
  cancelledCount: number;
  cancelledAmount: number;
};

export type PurchasingMaterialsByPeriod = {
  period: string;
  totalSpend: number;
  orderCount: number;
  avgOrderValue: number;
};

export type PurchasingMaterialsBySupplier = {
  supplierId: string;
  supplierCode: string;
  supplierName: string;
  totalSpend: number;
  orderCount: number;
  avgOrderValue: number;
};

export type PurchasingMaterialsByMaterial = {
  materialCode: string;
  materialTitle: string;
  unitOfMeasurement: MaterialUnit;
  totalSpend: number;
  totalQuantity: number;
  avgUnitPrice: number;
};

export type PurchasingMaterialsTopOrder = {
  orderId: string;
  orderCode: string;
  supplierName: string;
  totalAmount: number;
  createdAt: string;
  completedAt: string | null;
};

export type PurchasingMaterialsSpendingSummary = {
  overview: PurchasingMaterialsOverview;
  byPeriod: PurchasingMaterialsByPeriod[];
  bySupplier: PurchasingMaterialsBySupplier[];
  byMaterial: PurchasingMaterialsByMaterial[];
  topOrders: PurchasingMaterialsTopOrder[];
};

// ================ Price History ================

export type PurchasingMaterialsPriceHistoryEntry = {
  orderCode: string;
  orderDate: string;
  supplierName: string;
  unitPrice: number;
  quantityOrdered: number;
};

export type PurchasingMaterialsPriceHistorySummary = {
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  changePercentage: number;
};

export type PurchasingMaterialsPriceHistory = {
  material: {
    code: string;
    title: string;
    unitOfMeasurement: MaterialUnit;
  };
  entries: PurchasingMaterialsPriceHistoryEntry[];
  summary: PurchasingMaterialsPriceHistorySummary;
};
