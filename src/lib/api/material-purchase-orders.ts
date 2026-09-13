import type { Dictionary, PrivateRequest } from "@/types/api";
import type { PaginatedData } from "@/types/global";
import type {
  CreateMaterialPurchaseOrderDto,
  CreateMaterialPurchaseReceiptDto,
  CreatedMaterialPurchaseReceipt,
  MaterialPurchaseOrder,
  MaterialPurchaseOrderDetailed,
  MaterialPurchaseOrderItem,
  MaterialPurchaseOrderWithSupplier,
  MaterialPurchaseReceipt,
  MaterialPurchaseReceiptDetailed,
} from "@/types/material-purchase-order";

const materialPurchaseOrdersApi = {
  async create({
    privateRequest,
    dto,
  }: {
    privateRequest: PrivateRequest;
    dto: CreateMaterialPurchaseOrderDto;
  }) {
    return await privateRequest<MaterialPurchaseOrder & { items: MaterialPurchaseOrderItem[] }>({
      method: "POST",
      url: "material-purchase-orders",
      data: dto,
    });
  },

  async listOrders({
    privateRequest,
    params,
    signal,
  }: {
    privateRequest: PrivateRequest;
    params: Dictionary;
    signal: AbortSignal;
  }) {
    return await privateRequest<PaginatedData<MaterialPurchaseOrderWithSupplier>>({
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

  async createReceipt({
    privateRequest,
    dto,
  }: {
    privateRequest: PrivateRequest;
    dto: CreateMaterialPurchaseReceiptDto;
  }) {
    return await privateRequest<CreatedMaterialPurchaseReceipt>({
      method: "POST",
      url: "material-purchase-receipts",
      data: dto,
    });
  },
};

export default materialPurchaseOrdersApi;
