import type { Dictionary, PrivateRequest } from "@/types/api";
import type { PaginatedData } from "@/types/global";
import type { SupplierInvoiceDetailed, SupplierInvoiceWithLinks } from "@/types/material-purchase-order";

type CreateSupplierInvoiceFields = {
  invoiceNumber: string;
  issuedAt: string | null;
  totalPurchases: number | null;
  totalDiscount: number | null;
  vatAmount: number | null;
  withholdingTaxAmount: number | null;
  totalAmount: number | null;
};

const supplierInvoicesApi = {
  async list({
    privateRequest,
    params,
    signal,
  }: {
    privateRequest: PrivateRequest;
    params: Dictionary;
    signal: AbortSignal;
  }) {
    return await privateRequest<PaginatedData<SupplierInvoiceWithLinks>>({
      url: "supplier-invoices",
      params,
      signal,
    });
  },

  async get({ privateRequest, id, signal }: { privateRequest: PrivateRequest; id: string; signal?: AbortSignal }) {
    return await privateRequest<SupplierInvoiceDetailed>({
      url: `supplier-invoices/${id}`,
      signal,
    });
  },

  async createFromPdf({
    privateRequest,
    materialPurchaseOrderId,
    file,
    fields,
  }: {
    privateRequest: PrivateRequest;
    materialPurchaseOrderId: string;
    file: File;
    fields: CreateSupplierInvoiceFields;
  }) {
    const data = new FormData();
    data.append("pdf", file);
    data.append("materialPurchaseOrderId", materialPurchaseOrderId);
    data.append("invoiceNumber", fields.invoiceNumber);
    if (fields.issuedAt) data.append("issuedAt", fields.issuedAt);
    if (fields.totalPurchases != null) data.append("totalPurchases", String(fields.totalPurchases));
    if (fields.totalDiscount != null) data.append("totalDiscount", String(fields.totalDiscount));
    if (fields.vatAmount != null) data.append("vatAmount", String(fields.vatAmount));
    if (fields.withholdingTaxAmount != null) data.append("withholdingTaxAmount", String(fields.withholdingTaxAmount));
    if (fields.totalAmount != null) data.append("totalAmount", String(fields.totalAmount));

    return await privateRequest<SupplierInvoiceDetailed>({
      url: "supplier-invoices",
      method: "POST",
      data,
    });
  },

  async uploadPdf({
    privateRequest,
    id,
    file,
    fields,
  }: {
    privateRequest: PrivateRequest;
    id: string;
    file: File;
    fields: CreateSupplierInvoiceFields;
  }) {
    const data = new FormData();
    data.append("pdf", file);
    data.append("invoiceNumber", fields.invoiceNumber);
    if (fields.issuedAt) data.append("issuedAt", fields.issuedAt);
    if (fields.totalPurchases != null) data.append("totalPurchases", String(fields.totalPurchases));
    if (fields.totalDiscount != null) data.append("totalDiscount", String(fields.totalDiscount));
    if (fields.vatAmount != null) data.append("vatAmount", String(fields.vatAmount));
    if (fields.withholdingTaxAmount != null) data.append("withholdingTaxAmount", String(fields.withholdingTaxAmount));
    if (fields.totalAmount != null) data.append("totalAmount", String(fields.totalAmount));

    return await privateRequest<SupplierInvoiceDetailed>({
      url: `supplier-invoices/${id}/pdf`,
      method: "PATCH",
      data,
    });
  },

  async downloadPdf({
    privateRequest,
    id,
    invoiceNumber,
    supplierName,
  }: {
    privateRequest: PrivateRequest;
    id: string;
    invoiceNumber: string;
    supplierName: string;
  }) {
    return await privateRequest<null>({
      url: `supplier-invoices/${id}/pdf`,
      params: { _t: Date.now() },
      download: true,
      filename: buildDownloadFilename(invoiceNumber, supplierName),
    });
  },

  async getPdfBlob({
    privateRequest,
    id,
    signal,
  }: {
    privateRequest: PrivateRequest;
    id: string;
    signal?: AbortSignal;
  }) {
    return await privateRequest<Blob>({
      url: `supplier-invoices/${id}/pdf`,
      params: { _t: Date.now() },
      blob: true,
      signal,
    });
  },
};

function buildDownloadFilename(invoiceNumber: string, supplierName: string): string {
  const numberPart = sanitizeDownloadPart(invoiceNumber) || "invoice";
  const supplierPart = sanitizeDownloadPart(supplierName) || "supplier";
  return `فاتورة - ${numberPart} - ${supplierPart}.pdf`;
}

function sanitizeDownloadPart(value: string): string {
  return value
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/\s+/g, " ")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export default supplierInvoicesApi;
