import type { AccountingSupplierInvoiceRow } from "@/types/reports";

export type SupplierInvoicesSort =
  | "issue-date-desc"
  | "issue-date-asc"
  | "total-desc"
  | "total-asc"
  | "invoice-number-asc"
  | "invoice-number-desc"
  | "created-at-desc"
  | "created-at-asc";

export function getSupplierInvoicesSortLabel(
  sort: SupplierInvoicesSort,
  translate: (en: string, ar: string) => string,
) {
  switch (sort) {
    case "issue-date-asc":
      return translate("Issue date (oldest)", "تاريخ الإصدار (الأقدم)");
    case "total-desc":
      return translate("Total (high to low)", "الإجمالي (من الأعلى للأقل)");
    case "total-asc":
      return translate("Total (low to high)", "الإجمالي (من الأقل للأعلى)");
    case "invoice-number-asc":
      return translate("Invoice number (A-Z)", "رقم الفاتورة (أ-ي)");
    case "invoice-number-desc":
      return translate("Invoice number (Z-A)", "رقم الفاتورة (ي-أ)");
    case "created-at-desc":
      return translate("Created (newest)", "تاريخ الإنشاء (الأحدث)");
    case "created-at-asc":
      return translate("Created (oldest)", "تاريخ الإنشاء (الأقدم)");
    case "issue-date-desc":
    default:
      return translate("Issue date (newest)", "تاريخ الإصدار (الأحدث)");
  }
}

function compareNullableDates(a: string | null, b: string | null, direction: "asc" | "desc") {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  const diff = new Date(a).getTime() - new Date(b).getTime();
  return direction === "asc" ? diff : -diff;
}

function compareNullableNumbers(a: number | null, b: number | null, direction: "asc" | "desc") {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return direction === "asc" ? a - b : b - a;
}

export function sortSupplierInvoices(rows: AccountingSupplierInvoiceRow[], sort: SupplierInvoicesSort) {
  const sorted = [...rows];

  sorted.sort((a, b) => {
    switch (sort) {
      case "issue-date-asc":
        return compareNullableDates(a.issuedAt, b.issuedAt, "asc");
      case "total-desc":
        return compareNullableNumbers(a.totalAmount, b.totalAmount, "desc");
      case "total-asc":
        return compareNullableNumbers(a.totalAmount, b.totalAmount, "asc");
      case "invoice-number-asc":
        return a.invoiceNumber.localeCompare(b.invoiceNumber);
      case "invoice-number-desc":
        return b.invoiceNumber.localeCompare(a.invoiceNumber);
      case "created-at-desc":
        return compareNullableDates(a.createdAt, b.createdAt, "desc");
      case "created-at-asc":
        return compareNullableDates(a.createdAt, b.createdAt, "asc");
      case "issue-date-desc":
      default:
        return compareNullableDates(a.issuedAt, b.issuedAt, "desc");
    }
  });

  return sorted;
}
