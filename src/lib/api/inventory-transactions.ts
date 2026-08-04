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
};

export default inventoryTransactionsApi;
