import type { Dictionary, PrivateRequest } from "@/types/api";
import type { PaginatedData } from "@/types/global";
import type { SupplierInvoiceDetailed, SupplierInvoiceWithLinks } from "@/types/material-purchase-order";

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

  async uploadPdf({
    privateRequest,
    id,
    file,
  }: {
    privateRequest: PrivateRequest;
    id: string;
    file: File;
  }) {
    const data = new FormData();
    data.append("pdf", file);

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
  }: {
    privateRequest: PrivateRequest;
    id: string;
    invoiceNumber: string;
  }) {
    return await privateRequest<null>({
      url: `supplier-invoices/${id}/pdf`,
      params: { _t: Date.now() },
      download: true,
      filename: `${invoiceNumber}.pdf`,
    });
  },
};

export default supplierInvoicesApi;
