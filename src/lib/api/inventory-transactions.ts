import type { Dictionary, PrivateRequest } from "@/types/api";
import type { PaginatedData } from "@/types/global";
import type { InventoryTransaction, InventoryTransactionDetailed } from "@/types/inventory-transaction";

const inventoryTransactionsApi = {
  async list({
    privateRequest,
    params,
    signal,
  }: {
    privateRequest: PrivateRequest;
    params: Dictionary;
    signal: AbortSignal;
  }) {
    return await privateRequest<PaginatedData<InventoryTransaction>>({
      url: "inventory-transactions",
      params,
      signal,
    });
  },

  async get({ privateRequest, id, signal }: { privateRequest: PrivateRequest; id: string; signal?: AbortSignal }) {
    return await privateRequest<InventoryTransactionDetailed>({
      url: `inventory-transactions/${id}`,
      signal,
    });
  },

  async createFromMaterialPurchaseReceipt({
    privateRequest,
    receiptId,
    legacyNumber,
  }: {
    privateRequest: PrivateRequest;
    receiptId: string;
    legacyNumber: string;
  }) {
    return await privateRequest<{ id: string; code: string }>({
      method: "POST",
      url: `inventory-transactions/from-material-purchase-receipt/${receiptId}`,
      data: { legacyNumber },
    });
  },
};

export default inventoryTransactionsApi;
