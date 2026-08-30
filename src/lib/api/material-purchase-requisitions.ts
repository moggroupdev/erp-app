import type { Dictionary, PrivateRequest } from "@/types/api";
import type { PaginatedData } from "@/types/global";
import type {
  CreateMaterialPurchaseRequisitionDto,
  CreateMaterialPurchaseRequisitionItemDto,
  MaterialPurchaseRequisition,
  MaterialPurchaseRequisitionDetailed,
  MaterialPurchaseRequisitionItem,
  MaterialPurchaseRequisitionListItem,
  RejectMaterialPurchaseRequisitionDto,
  UpdateMaterialPurchaseRequisitionDto,
  UpdateMaterialPurchaseRequisitionItemDto,
} from "@/types/material-purchase-requisition";

const materialPurchaseRequisitionsApi = {
  async create({
    privateRequest,
    dto,
  }: {
    privateRequest: PrivateRequest;
    dto: CreateMaterialPurchaseRequisitionDto;
  }) {
    return await privateRequest<MaterialPurchaseRequisition & { items: MaterialPurchaseRequisitionItem[] }>({
      method: "POST",
      url: "material-purchase-requisitions",
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
    return await privateRequest<PaginatedData<MaterialPurchaseRequisitionListItem>>({
      url: "material-purchase-requisitions",
      params,
      signal,
    });
  },

  async get({ privateRequest, id, signal }: { privateRequest: PrivateRequest; id: string; signal?: AbortSignal }) {
    return await privateRequest<MaterialPurchaseRequisitionDetailed>({
      url: `material-purchase-requisitions/${id}`,
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
    dto: UpdateMaterialPurchaseRequisitionDto;
  }) {
    return await privateRequest<MaterialPurchaseRequisition>({
      method: "PATCH",
      url: `material-purchase-requisitions/${id}`,
      data: dto,
    });
  },

  async addItem({
    privateRequest,
    id,
    dto,
  }: {
    privateRequest: PrivateRequest;
    id: string;
    dto: CreateMaterialPurchaseRequisitionItemDto;
  }) {
    return await privateRequest<MaterialPurchaseRequisitionItem>({
      method: "POST",
      url: `material-purchase-requisitions/${id}/items`,
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
    dto: UpdateMaterialPurchaseRequisitionItemDto;
  }) {
    return await privateRequest<MaterialPurchaseRequisitionItem>({
      method: "PATCH",
      url: `material-purchase-requisitions/${id}/items/${itemId}`,
      data: dto,
    });
  },

  async deleteItem({
    privateRequest,
    id,
    itemId,
  }: {
    privateRequest: PrivateRequest;
    id: string;
    itemId: string;
  }) {
    return await privateRequest<MaterialPurchaseRequisitionItem>({
      method: "DELETE",
      url: `material-purchase-requisitions/${id}/items/${itemId}`,
    });
  },

  async approvePlanning({ privateRequest, id }: { privateRequest: PrivateRequest; id: string }) {
    return await privateRequest<MaterialPurchaseRequisition>({
      method: "POST",
      url: `material-purchase-requisitions/${id}/planning/approve`,
    });
  },

  async rejectPlanning({
    privateRequest,
    id,
    dto,
  }: {
    privateRequest: PrivateRequest;
    id: string;
    dto: RejectMaterialPurchaseRequisitionDto;
  }) {
    return await privateRequest<MaterialPurchaseRequisition>({
      method: "POST",
      url: `material-purchase-requisitions/${id}/planning/reject`,
      data: dto,
    });
  },

  async approvePurchasingManager({ privateRequest, id }: { privateRequest: PrivateRequest; id: string }) {
    return await privateRequest<MaterialPurchaseRequisition>({
      method: "POST",
      url: `material-purchase-requisitions/${id}/purchasing-manager/approve`,
    });
  },

  async rejectPurchasingManager({
    privateRequest,
    id,
    dto,
  }: {
    privateRequest: PrivateRequest;
    id: string;
    dto: RejectMaterialPurchaseRequisitionDto;
  }) {
    return await privateRequest<MaterialPurchaseRequisition>({
      method: "POST",
      url: `material-purchase-requisitions/${id}/purchasing-manager/reject`,
      data: dto,
    });
  },

  async approveManager({ privateRequest, id }: { privateRequest: PrivateRequest; id: string }) {
    return await privateRequest<MaterialPurchaseRequisition>({
      method: "POST",
      url: `material-purchase-requisitions/${id}/manager/approve`,
    });
  },

  async rejectManager({
    privateRequest,
    id,
    dto,
  }: {
    privateRequest: PrivateRequest;
    id: string;
    dto: RejectMaterialPurchaseRequisitionDto;
  }) {
    return await privateRequest<MaterialPurchaseRequisition>({
      method: "POST",
      url: `material-purchase-requisitions/${id}/manager/reject`,
      data: dto,
    });
  },
};

export default materialPurchaseRequisitionsApi;
