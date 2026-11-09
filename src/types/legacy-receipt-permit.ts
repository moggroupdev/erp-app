export type LegacyReceiptPermitCreateItem = {
  materialCode: string;
  unitOfMeasurementSelected: string;
  quantity: number;
  unitPrice: number;
};

export type LegacyReceiptPermitCreateBlock = {
  legacyNumber: string;
  receivedAt: string;
  items: LegacyReceiptPermitCreateItem[];
};

export type LegacyReceiptPermitCreateInvoice = {
  invoiceNumber: string;
  issuedAt: string;
  totalPurchases: number | null;
  totalDiscount: number | null;
  vatAmount: number | null;
  withholdingTaxAmount: number | null;
  totalAmount: number | null;
};

export type LegacyReceiptPermitCreatePayload = {
  supplierId: string;
  invoice: LegacyReceiptPermitCreateInvoice;
  permits: LegacyReceiptPermitCreateBlock[];
};

export type LegacyReceiptPermitCreateResult = {
  materialPurchaseOrder: { id: string; code: string };
  supplierInvoice: { id: string; invoiceNumber: string };
  permits: Array<{
    legacyNumber: string;
    receipt: { id: string; code: string };
    inventoryTransaction: { id: string; code: string };
  }>;
};
