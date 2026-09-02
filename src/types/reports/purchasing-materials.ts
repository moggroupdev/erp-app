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
  invoiceNumber: string | null;
  supplierId: string;
  supplierName: string;
  invoiceTotalPurchases: number;
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
  invoiceNumber: string | null;
  invoiceIssuedAt: string | null;
  supplierId: string;
  supplierName: string;
  invoiceTotalPurchases: number;
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

// ================ Subcategory Stats ================

export type PurchasingMaterialsSubCategoryStats = {
  subCategory: {
    id: string;
    title: string;
    mainCategoryId: string;
    mainCategoryTitle: string;
  };
  overview: PurchasingMaterialsCategoryStatsOverview;
  suppliers: PurchasingMaterialsBySupplier[];
  orders: PurchasingMaterialsCategoryOrder[];
  materials: PurchasingMaterialsByMaterial[];
};

// ================ Supplier Stats ================

export type PurchasingMaterialsSupplierOrder = {
  orderId: string;
  orderCode: string;
  invoiceNumber: string | null;
  invoiceIssuedAt: string | null;
  invoiceTotalPurchases: number;
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

// ================ Total Amount Mismatches ================

export type PurchasingMaterialsTotalAmountMismatchOverview = {
  mismatchCount: number;
  totalCalculatedAmount: number;
  totalInvoicePurchases: number;
  totalDifference: number;
  missingInvoiceTotalCount: number;
  missingInvoiceTotalCalculatedAmount: number;
};

export type PurchasingMaterialsTotalAmountMismatchOrder = {
  orderId: string;
  orderCode: string;
  invoiceNumber: string | null;
  supplierId: string;
  supplierName: string;
  calculatedTotalAmount: number;
  invoiceTotalPurchases: number;
  difference: number;
  createdAt: string;
  completedAt: string | null;
};

export type PurchasingMaterialsCompletedWithoutInvoiceTotalOrder = {
  orderId: string;
  orderCode: string;
  invoiceNumber: string | null;
  supplierId: string;
  supplierName: string;
  calculatedTotalAmount: number;
  createdAt: string;
  completedAt: string;
};

export type PurchasingMaterialsTotalAmountMismatches = {
  overview: PurchasingMaterialsTotalAmountMismatchOverview;
  orders: PurchasingMaterialsTotalAmountMismatchOrder[];
  completedWithoutInvoiceTotal: PurchasingMaterialsCompletedWithoutInvoiceTotalOrder[];
};
