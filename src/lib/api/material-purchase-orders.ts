import type { Dictionary, PrivateRequest } from "@/types/api";
import type { PaginatedData } from "@/types/global";
import type {
  MaterialPurchaseOrderDetailed,
  MaterialPurchaseOrderWithVendor,
  MaterialPurchaseReceipt,
  MaterialPurchaseReceiptDetailed,
} from "@/types/material-purchase-order";

const materialPurchaseOrdersApi = {
  async listOrders({
    privateRequest,
    params,
    signal,
  }: {
    privateRequest: PrivateRequest;
    params: Dictionary;
    signal: AbortSignal;
  }) {
    return await privateRequest<PaginatedData<MaterialPurchaseOrderWithVendor>>({
      url: "material-purchase-orders",
      params,
      signal,
    });
  },

  async getOrder({ privateRequest, id, signal }: { privateRequest: PrivateRequest; id: string; signal?: AbortSignal }) {
    return await privateRequest<MaterialPurchaseOrderDetailed>({
      url: `material-purchase-orders/${id}`,
      signal,
    });
  },

  async listReceipts({
    privateRequest,
    params,
    signal,
  }: {
    privateRequest: PrivateRequest;
    params: Dictionary;
    signal: AbortSignal;
  }) {
    return await privateRequest<PaginatedData<MaterialPurchaseReceipt>>({
      url: "material-purchase-receipts",
      params,
      signal,
    });
  },

  async getReceipt({ privateRequest, id, signal }: { privateRequest: PrivateRequest; id: string; signal?: AbortSignal }) {
    return await privateRequest<MaterialPurchaseReceiptDetailed>({
      url: `material-purchase-receipts/${id}`,
      signal,
    });
  },
};

export default materialPurchaseOrdersApi;
