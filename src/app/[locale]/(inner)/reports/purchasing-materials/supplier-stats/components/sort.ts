import type {
  PurchasingMaterialsByMainCategory,
  PurchasingMaterialsByMaterial,
  PurchasingMaterialsSupplierBySubCategory,
  PurchasingMaterialsSupplierOrder,
} from "@/types/reports";

export type SupplierCategoriesSort =
  | "spend-desc"
  | "spend-asc"
  | "qty-desc"
  | "qty-asc"
  | "materials-desc"
  | "materials-asc"
  | "name-asc"
  | "name-desc";

export type SupplierSubCategoriesSort =
  | "spend-desc"
  | "spend-asc"
  | "qty-desc"
  | "qty-asc"
  | "materials-desc"
  | "materials-asc"
  | "name-asc"
  | "name-desc"
  | "main-asc"
  | "main-desc";

export type SupplierOrdersSort =
  | "invoice-date-desc"
  | "invoice-date-asc"
  | "amount-desc"
  | "amount-asc"
  | "invoice-number-asc"
  | "invoice-number-desc"
  | "code-asc"
  | "code-desc";

export type SupplierMaterialsSort =
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

const CATEGORIES_SORT_LABELS: Record<SupplierCategoriesSort, { en: string; ar: string }> = {
  "spend-desc": { en: "Value (high to low)", ar: "القيمة (من الأعلى للأقل)" },
  "spend-asc": { en: "Value (low to high)", ar: "القيمة (من الأقل للأعلى)" },
  "qty-desc": { en: "Quantity (high to low)", ar: "الكمية (من الأعلى للأقل)" },
  "qty-asc": { en: "Quantity (low to high)", ar: "الكمية (من الأقل للأعلى)" },
  "materials-desc": { en: "Materials (high to low)", ar: "المواد (من الأعلى للأقل)" },
  "materials-asc": { en: "Materials (low to high)", ar: "المواد (من الأقل للأعلى)" },
  "name-asc": { en: "Name (A-Z)", ar: "الاسم (أ-ي)" },
  "name-desc": { en: "Name (Z-A)", ar: "الاسم (ي-أ)" },
};

const SUB_CATEGORIES_SORT_LABELS: Record<SupplierSubCategoriesSort, { en: string; ar: string }> = {
  "spend-desc": { en: "Value (high to low)", ar: "القيمة (من الأعلى للأقل)" },
  "spend-asc": { en: "Value (low to high)", ar: "القيمة (من الأقل للأعلى)" },
  "qty-desc": { en: "Quantity (high to low)", ar: "الكمية (من الأعلى للأقل)" },
  "qty-asc": { en: "Quantity (low to high)", ar: "الكمية (من الأقل للأعلى)" },
  "materials-desc": { en: "Materials (high to low)", ar: "المواد (من الأعلى للأقل)" },
  "materials-asc": { en: "Materials (low to high)", ar: "المواد (من الأقل للأعلى)" },
  "name-asc": { en: "Name (A-Z)", ar: "الاسم (أ-ي)" },
  "name-desc": { en: "Name (Z-A)", ar: "الاسم (ي-أ)" },
  "main-asc": { en: "Main category (A-Z)", ar: "الفئة الرئيسية (أ-ي)" },
  "main-desc": { en: "Main category (Z-A)", ar: "الفئة الرئيسية (ي-أ)" },
};

const ORDERS_SORT_LABELS: Record<SupplierOrdersSort, { en: string; ar: string }> = {
  "invoice-date-desc": { en: "Invoice date (newest)", ar: "تاريخ الفاتورة (الأحدث)" },
  "invoice-date-asc": { en: "Invoice date (oldest)", ar: "تاريخ الفاتورة (الأقدم)" },
  "amount-desc": { en: "Amount (high to low)", ar: "المبلغ (من الأعلى للأقل)" },
  "amount-asc": { en: "Amount (low to high)", ar: "المبلغ (من الأقل للأعلى)" },
  "invoice-number-asc": { en: "Invoice number (A-Z)", ar: "رقم الفاتورة (أ-ي)" },
  "invoice-number-desc": { en: "Invoice number (Z-A)", ar: "رقم الفاتورة (ي-أ)" },
  "code-asc": { en: "Code (A-Z)", ar: "الكود (أ-ي)" },
  "code-desc": { en: "Code (Z-A)", ar: "الكود (ي-أ)" },
};

const MATERIALS_SORT_LABELS: Record<SupplierMaterialsSort, { en: string; ar: string }> = {
  "spend-desc": { en: "Value (high to low)", ar: "القيمة (من الأعلى للأقل)" },
  "spend-asc": { en: "Value (low to high)", ar: "القيمة (من الأقل للأعلى)" },
  "qty-desc": { en: "Quantity (high to low)", ar: "الكمية (من الأعلى للأقل)" },
  "qty-asc": { en: "Quantity (low to high)", ar: "الكمية (من الأقل للأعلى)" },
  "avg-desc": { en: "Avg unit price (high to low)", ar: "متوسط سعر الوحدة (من الأعلى للأقل)" },
  "avg-asc": { en: "Avg unit price (low to high)", ar: "متوسط سعر الوحدة (من الأقل للأعلى)" },
  "name-asc": { en: "Name (A-Z)", ar: "الاسم (أ-ي)" },
  "name-desc": { en: "Name (Z-A)", ar: "الاسم (ي-أ)" },
  "code-asc": { en: "Code (A-Z)", ar: "الكود (أ-ي)" },
  "code-desc": { en: "Code (Z-A)", ar: "الكود (ي-أ)" },
};

export function getSupplierCategoriesSortLabel(sort: SupplierCategoriesSort, translate: Translate) {
  const label = CATEGORIES_SORT_LABELS[sort];
  return translate(label.en, label.ar);
}

export function getSupplierSubCategoriesSortLabel(sort: SupplierSubCategoriesSort, translate: Translate) {
  const label = SUB_CATEGORIES_SORT_LABELS[sort];
  return translate(label.en, label.ar);
}

export function getSupplierOrdersSortLabel(sort: SupplierOrdersSort, translate: Translate) {
  const label = ORDERS_SORT_LABELS[sort];
  return translate(label.en, label.ar);
}

export function getSupplierMaterialsSortLabel(sort: SupplierMaterialsSort, translate: Translate) {
  const label = MATERIALS_SORT_LABELS[sort];
  return translate(label.en, label.ar);
}

function invoiceDateValue(row: PurchasingMaterialsSupplierOrder) {
  return row.legacyInvoiceIssuedAt ?? row.createdAt;
}

export function sortSupplierCategories(data: PurchasingMaterialsByMainCategory[], sort: SupplierCategoriesSort) {
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
      case "materials-desc":
        return b.materialCount - a.materialCount;
      case "materials-asc":
        return a.materialCount - b.materialCount;
      case "name-asc":
        return a.mainCategoryTitle.localeCompare(b.mainCategoryTitle);
      case "name-desc":
        return b.mainCategoryTitle.localeCompare(a.mainCategoryTitle);
      default:
        return 0;
    }
  });
  return rows;
}

export function sortSupplierSubCategories(
  data: PurchasingMaterialsSupplierBySubCategory[],
  sort: SupplierSubCategoriesSort,
) {
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
      case "materials-desc":
        return b.materialCount - a.materialCount;
      case "materials-asc":
        return a.materialCount - b.materialCount;
      case "name-asc":
        return a.subCategoryTitle.localeCompare(b.subCategoryTitle);
      case "name-desc":
        return b.subCategoryTitle.localeCompare(a.subCategoryTitle);
      case "main-asc":
        return a.mainCategoryTitle.localeCompare(b.mainCategoryTitle);
      case "main-desc":
        return b.mainCategoryTitle.localeCompare(a.mainCategoryTitle);
      default:
        return 0;
    }
  });
  return rows;
}

export function sortSupplierOrders(data: PurchasingMaterialsSupplierOrder[], sort: SupplierOrdersSort) {
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

export function sortSupplierMaterials(data: PurchasingMaterialsByMaterial[], sort: SupplierMaterialsSort) {
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
