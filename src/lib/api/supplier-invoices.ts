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
};

export default supplierInvoicesApi;
