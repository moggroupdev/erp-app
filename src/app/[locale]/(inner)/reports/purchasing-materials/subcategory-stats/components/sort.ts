import type {
  PurchasingMaterialsByMaterial,
  PurchasingMaterialsBySupplier,
  PurchasingMaterialsCategoryOrder,
} from "@/types/reports";

export type SubCategorySuppliersSort =
  | "spend-desc"
  | "spend-asc"
  | "orders-desc"
  | "orders-asc"
  | "avg-desc"
  | "avg-asc"
  | "name-asc"
  | "name-desc";

export type SubCategoryOrdersSort =
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

export type SubCategoryMaterialsSort =
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

type Translate = (en: string, ar: string) => string;

const SUPPLIERS_SORT_LABELS: Record<SubCategorySuppliersSort, { en: string; ar: string }> = {
  "spend-desc": { en: "Value (high to low)", ar: "القيمة (من الأعلى للأقل)" },
  "spend-asc": { en: "Value (low to high)", ar: "القيمة (من الأقل للأعلى)" },
  "orders-desc": { en: "Invoices (high to low)", ar: "الفواتير (من الأعلى للأقل)" },
  "orders-asc": { en: "Invoices (low to high)", ar: "الفواتير (من الأقل للأعلى)" },
  "avg-desc": { en: "Avg order (high to low)", ar: "متوسط الطلب (من الأعلى للأقل)" },
  "avg-asc": { en: "Avg order (low to high)", ar: "متوسط الطلب (من الأقل للأعلى)" },
  "name-asc": { en: "Name (A–Z)", ar: "الاسم (أ–ي)" },
  "name-desc": { en: "Name (Z–A)", ar: "الاسم (ي–أ)" },
};

const ORDERS_SORT_LABELS: Record<SubCategoryOrdersSort, { en: string; ar: string }> = {
  "invoice-date-desc": { en: "Invoice date (newest)", ar: "تاريخ الفاتورة (الأحدث)" },
  "invoice-date-asc": { en: "Invoice date (oldest)", ar: "تاريخ الفاتورة (الأقدم)" },
  "amount-desc": { en: "Amount (high to low)", ar: "المبلغ (من الأعلى للأقل)" },
  "amount-asc": { en: "Amount (low to high)", ar: "المبلغ (من الأقل للأعلى)" },
  "invoice-number-asc": { en: "Invoice number (A–Z)", ar: "رقم الفاتورة (أ–ي)" },
  "invoice-number-desc": { en: "Invoice number (Z–A)", ar: "رقم الفاتورة (ي–أ)" },
  "supplier-asc": { en: "Supplier (A–Z)", ar: "المورد (أ–ي)" },
  "supplier-desc": { en: "Supplier (Z–A)", ar: "المورد (ي–أ)" },
  "code-asc": { en: "Code (A–Z)", ar: "الكود (أ–ي)" },
  "code-desc": { en: "Code (Z–A)", ar: "الكود (ي–أ)" },
};

const MATERIALS_SORT_LABELS: Record<SubCategoryMaterialsSort, { en: string; ar: string }> = {
  "spend-desc": { en: "Value (high to low)", ar: "القيمة (من الأعلى للأقل)" },
  "spend-asc": { en: "Value (low to high)", ar: "القيمة (من الأقل للأعلى)" },
  "qty-desc": { en: "Quantity (high to low)", ar: "الكمية (من الأعلى للأقل)" },
  "qty-asc": { en: "Quantity (low to high)", ar: "الكمية (من الأقل للأعلى)" },
  "avg-desc": { en: "Avg unit price (high to low)", ar: "متوسط سعر الوحدة (من الأعلى للأقل)" },
  "avg-asc": { en: "Avg unit price (low to high)", ar: "متوسط سعر الوحدة (من الأقل للأعلى)" },
  "name-asc": { en: "Name (A–Z)", ar: "الاسم (أ–ي)" },
  "name-desc": { en: "Name (Z–A)", ar: "الاسم (ي–أ)" },
  "code-asc": { en: "Code (A–Z)", ar: "الكود (أ–ي)" },
  "code-desc": { en: "Code (Z–A)", ar: "الكود (ي–أ)" },
};

export function getSubCategorySuppliersSortLabel(sort: SubCategorySuppliersSort, translate: Translate) {
  const label = SUPPLIERS_SORT_LABELS[sort];
  return translate(label.en, label.ar);
}

export function getSubCategoryOrdersSortLabel(sort: SubCategoryOrdersSort, translate: Translate) {
  const label = ORDERS_SORT_LABELS[sort];
  return translate(label.en, label.ar);
}

export function getSubCategoryMaterialsSortLabel(sort: SubCategoryMaterialsSort, translate: Translate) {
  const label = MATERIALS_SORT_LABELS[sort];
  return translate(label.en, label.ar);
}

function invoiceDateValue(row: PurchasingMaterialsCategoryOrder) {
  return row.legacyInvoiceIssuedAt ?? row.createdAt;
}

export function sortSubCategorySuppliers(data: PurchasingMaterialsBySupplier[], sort: SubCategorySuppliersSort) {
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

export function sortSubCategoryOrders(data: PurchasingMaterialsCategoryOrder[], sort: SubCategoryOrdersSort) {
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

export function sortSubCategoryMaterials(data: PurchasingMaterialsByMaterial[], sort: SubCategoryMaterialsSort) {
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
