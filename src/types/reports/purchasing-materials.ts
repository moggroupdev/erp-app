import type { MaterialUnit } from "@/lib/constants/enums/material-units";
import type { MaterialUnitConversionSummary } from "@/types/material";

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
  unitConversions?: MaterialUnitConversionSummary[];
  totalSpend: number;
  totalQuantity: number;
  avgUnitPrice: number;
};

export type PurchasingMaterialsByMainCategory = {
  mainCategoryId: string;
  mainCategoryTitle: string;
  materialCount: number;
  totalQuantity: number;
  totalSpend: number;
};

export type PurchasingMaterialsBySubCategory = {
  subCategoryId: string;
  subCategoryTitle: string;
  materialCount: number;
  totalQuantity: number;
  totalSpend: number;
};

export type PurchasingMaterialsSupplierBySubCategory = PurchasingMaterialsBySubCategory & {
  mainCategoryId: string;
  mainCategoryTitle: string;
};

export type PurchasingMaterialsTopOrder = {
  orderId: string;
  orderCode: string;
  legacyInvoiceNumber: string | null;
  supplierId: string;
  supplierName: string;
  legacyInvoiceTotalPurchases: number;
  createdAt: string;
  completedAt: string | null;
};

export type PurchasingMaterialsSpendingSummary = {
  overview: PurchasingMaterialsOverview;
  byPeriod: PurchasingMaterialsByPeriod[];
  bySupplier: PurchasingMaterialsBySupplier[];
  byMaterial: PurchasingMaterialsByMaterial[];
  byMainCategory: PurchasingMaterialsByMainCategory[];
  topOrders: PurchasingMaterialsTopOrder[];
};

// ================ Price History ================

export type PurchasingMaterialsPriceHistoryEntry = {
  orderId: string;
  orderCode: string;
  orderDate: string;
  supplierId: string;
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

// ================ Category Stats ================

export type PurchasingMaterialsCategoryStatsOverview = Pick<
  PurchasingMaterialsOverview,
  "totalSpend" | "totalOrders" | "avgOrderValue"
>;

export type PurchasingMaterialsCategoryOrder = {
  orderId: string;
  orderCode: string;
  legacyInvoiceNumber: string | null;
  legacyInvoiceIssuedAt: string | null;
  supplierId: string;
  supplierName: string;
  legacyInvoiceTotalPurchases: number;
  createdAt: string;
  completedAt: string | null;
  inventoryTransactionLegacyNumbers: string[];
};

export type PurchasingMaterialsCategoryStats = {
  category: {
    id: string;
    title: string;
  };
  overview: PurchasingMaterialsCategoryStatsOverview;
  subCategories: PurchasingMaterialsBySubCategory[];
  suppliers: PurchasingMaterialsBySupplier[];
  orders: PurchasingMaterialsCategoryOrder[];
  materials: PurchasingMaterialsByMaterial[];
};

// ================ Supplier Stats ================

export type PurchasingMaterialsSupplierOrder = {
  orderId: string;
  orderCode: string;
  legacyInvoiceNumber: string | null;
  legacyInvoiceIssuedAt: string | null;
  legacyInvoiceTotalPurchases: number;
  createdAt: string;
  completedAt: string | null;
  inventoryTransactionLegacyNumbers: string[];
};

export type PurchasingMaterialsSupplierStats = {
  supplier: {
    id: string;
    code: string;
    name: string;
  };
  overview: PurchasingMaterialsCategoryStatsOverview;
  byPeriod: PurchasingMaterialsByPeriod[];
  categories: PurchasingMaterialsByMainCategory[];
  subCategories: PurchasingMaterialsSupplierBySubCategory[];
  orders: PurchasingMaterialsSupplierOrder[];
  materials: PurchasingMaterialsByMaterial[];
};
