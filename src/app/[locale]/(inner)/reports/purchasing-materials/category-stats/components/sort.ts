import type {
  PurchasingMaterialsByMaterial,
  PurchasingMaterialsBySupplier,
  PurchasingMaterialsCategoryOrder,
} from "@/types/reports";

export type CategorySuppliersSort =
  | "spend-desc"
  | "spend-asc"
  | "orders-desc"
  | "orders-asc"
  | "avg-desc"
  | "avg-asc"
  | "name-asc"
  | "name-desc";

export type CategoryOrdersSort =
  | "invoice-date-desc"
  | "invoice-date-asc"
  | "amount-desc"
  | "amount-asc"
  | "invoice-number-asc"
  | "invoice-number-desc"
  | "supplier-asc"
  | "supplier-desc"
  | "code-asc"
  | "code-desc";

export type CategoryMaterialsSort =
  | "spend-desc"
  | "spend-asc"
  | "qty-desc"
  | "qty-asc"
  | "avg-desc"
  | "avg-asc"
  | "name-asc"
  | "name-desc"
  | "code-asc"
  | "code-desc";

function invoiceDateValue(row: PurchasingMaterialsCategoryOrder) {
  return row.legacyInvoiceIssuedAt ?? row.createdAt;
}

export function sortCategorySuppliers(data: PurchasingMaterialsBySupplier[], sort: CategorySuppliersSort) {
  const rows = [...data];
  rows.sort((a, b) => {
    switch (sort) {
      case "spend-desc":
        return b.totalSpend - a.totalSpend;
      case "spend-asc":
        return a.totalSpend - b.totalSpend;
      case "orders-desc":
        return b.orderCount - a.orderCount;
      case "orders-asc":
        return a.orderCount - b.orderCount;
      case "avg-desc":
        return b.avgOrderValue - a.avgOrderValue;
      case "avg-asc":
        return a.avgOrderValue - b.avgOrderValue;
      case "name-asc":
        return a.supplierName.localeCompare(b.supplierName);
      case "name-desc":
        return b.supplierName.localeCompare(a.supplierName);
      default:
        return 0;
    }
  });
  return rows;
}

export function sortCategoryOrders(data: PurchasingMaterialsCategoryOrder[], sort: CategoryOrdersSort) {
  const rows = [...data];
  rows.sort((a, b) => {
    switch (sort) {
      case "invoice-date-desc":
        return new Date(invoiceDateValue(b)).getTime() - new Date(invoiceDateValue(a)).getTime();
      case "invoice-date-asc":
        return new Date(invoiceDateValue(a)).getTime() - new Date(invoiceDateValue(b)).getTime();
      case "amount-desc":
        return b.legacyInvoiceTotalPurchases - a.legacyInvoiceTotalPurchases;
      case "amount-asc":
        return a.legacyInvoiceTotalPurchases - b.legacyInvoiceTotalPurchases;
      case "invoice-number-asc":
        return (a.legacyInvoiceNumber ?? "").localeCompare(b.legacyInvoiceNumber ?? "");
      case "invoice-number-desc":
        return (b.legacyInvoiceNumber ?? "").localeCompare(a.legacyInvoiceNumber ?? "");
      case "supplier-asc":
        return a.supplierName.localeCompare(b.supplierName);
      case "supplier-desc":
        return b.supplierName.localeCompare(a.supplierName);
      case "code-asc":
        return a.orderCode.localeCompare(b.orderCode);
      case "code-desc":
        return b.orderCode.localeCompare(a.orderCode);
      default:
        return 0;
    }
  });
  return rows;
}

export function sortCategoryMaterials(data: PurchasingMaterialsByMaterial[], sort: CategoryMaterialsSort) {
  const rows = [...data];
  rows.sort((a, b) => {
    switch (sort) {
      case "spend-desc":
        return b.totalSpend - a.totalSpend;
      case "spend-asc":
        return a.totalSpend - b.totalSpend;
      case "qty-desc":
        return b.totalQuantity - a.totalQuantity;
      case "qty-asc":
        return a.totalQuantity - b.totalQuantity;
      case "avg-desc":
        return b.avgUnitPrice - a.avgUnitPrice;
      case "avg-asc":
        return a.avgUnitPrice - b.avgUnitPrice;
      case "name-asc":
        return a.materialTitle.localeCompare(b.materialTitle);
      case "name-desc":
        return b.materialTitle.localeCompare(a.materialTitle);
      case "code-asc":
        return a.materialCode.localeCompare(b.materialCode);
      case "code-desc":
        return b.materialCode.localeCompare(a.materialCode);
      default:
        return 0;
    }
  });
  return rows;
}
