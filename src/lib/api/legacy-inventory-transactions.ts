import type { Dictionary, PrivateRequest } from "@/types/api";
import type { PaginatedData } from "@/types/global";
import type {
  CreateLegacyInventoryTransactionDto,
  LegacyInventoryTransaction,
  LegacyInventoryTransactionDetailed,
  LegacyInventoryTransactionItem,
  UpdateLegacyInventoryTransactionDto,
  UpdateLegacyInventoryTransactionItemDto,
} from "@/types/legacy-inventory-transaction";

const legacyInventoryTransactionsApi = {
  async create({ privateRequest, dto }: { privateRequest: PrivateRequest; dto: CreateLegacyInventoryTransactionDto }) {
    return await privateRequest<LegacyInventoryTransaction & { items: LegacyInventoryTransactionItem[] }>({
      method: "POST",
      url: "legacy-inventory-transactions",
      data: dto,
    });
  },

  async list({
    privateRequest,
    params,
    signal,
  }: {
    privateRequest: PrivateRequest;
    params: Dictionary;
    signal: AbortSignal;
  }) {
    return await privateRequest<PaginatedData<LegacyInventoryTransaction>>({
      url: "legacy-inventory-transactions",
      params,
      signal,
    });
  },

  async get({ privateRequest, id, signal }: { privateRequest: PrivateRequest; id: string; signal?: AbortSignal }) {
    return await privateRequest<LegacyInventoryTransactionDetailed>({
      url: `legacy-inventory-transactions/${id}`,
      signal,
    });
  },

  async updateHeader({
    privateRequest,
    id,
    dto,
  }: {
    privateRequest: PrivateRequest;
    id: string;
    dto: UpdateLegacyInventoryTransactionDto;
  }) {
    return await privateRequest<LegacyInventoryTransaction>({
      method: "PATCH",
      url: `legacy-inventory-transactions/${id}`,
      data: dto,
    });
  },

  async updateItem({
    privateRequest,
    id,
    itemId,
    dto,
  }: {
    privateRequest: PrivateRequest;
    id: string;
    itemId: string;
    dto: UpdateLegacyInventoryTransactionItemDto;
  }) {
    return await privateRequest<LegacyInventoryTransactionItem>({
      method: "PATCH",
      url: `legacy-inventory-transactions/${id}/items/${itemId}`,
      data: dto,
    });
  },
};

export default legacyInventoryTransactionsApi;
