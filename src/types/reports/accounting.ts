export type AccountingSupplierInvoiceOrderType = "material" | "product" | "outsourcing";

export type AccountingSupplierInvoicesOverview = {
  invoiceCount: number;
  totalPurchases: number;
  totalDiscount: number;
  vatAmount: number;
  withholdingTaxAmount: number;
  totalAmount: number;
  avgTotalAmount: number;
  missingTotalCount: number;
  withPdfCount: number;
};

export type AccountingSupplierInvoicesByOrderType = {
  orderType: AccountingSupplierInvoiceOrderType;
  invoiceCount: number;
  totalPurchases: number;
  totalDiscount: number;
  vatAmount: number;
  withholdingTaxAmount: number;
  totalAmount: number;
};

export type AccountingSupplierInvoicesByPeriod = {
  period: string;
  invoiceCount: number;
  totalAmount: number;
};

export type AccountingSupplierInvoiceLinkedOrder = {
  type: AccountingSupplierInvoiceOrderType;
  id: string;
  code: string;
};

export type AccountingSupplierInvoiceRow = {
  id: string;
  invoiceNumber: string;
  issuedAt: string | null;
  totalPurchases: number | null;
  totalDiscount: number | null;
  vatAmount: number | null;
  withholdingTaxAmount: number | null;
  totalAmount: number | null;
  materialPurchaseOrderId: string | null;
  productPurchaseOrderId: string | null;
  outsourcingOrderId: string | null;
  supplierId: string;
  pdfFilename: string | null;
  hasPdf: boolean;
  createdAt: string;
  createdBy: { id: string; name: string };
  order: AccountingSupplierInvoiceLinkedOrder;
};

export type AccountingSupplierInvoicesReport = {
  supplier: { id: string; code: string; name: string };
  overview: AccountingSupplierInvoicesOverview;
  byOrderType: AccountingSupplierInvoicesByOrderType[];
  byPeriod: AccountingSupplierInvoicesByPeriod[];
  invoices: AccountingSupplierInvoiceRow[];
};
