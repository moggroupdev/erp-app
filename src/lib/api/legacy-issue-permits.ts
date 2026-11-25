import type { Dictionary, PrivateRequest } from "@/types/api";
import type { PaginatedData } from "@/types/global";
import removeEmptyParams from "@/lib/helpers/remove-empty-params";
import type {
  CreateLegacyIssuePermitDto,
  CreateLegacyIssuePermitItemDto,
  LegacyIssuePermit,
  LegacyIssuePermitDetailed,
  LegacyIssuePermitItem,
  LegacyIssuePermitNeighbors,
  LegacyIssuePermitNotedItem,
  LegacyIssuePermitNotedItemsFilters,
  ReorderLegacyIssuePermitItemsDto,
  UpdateLegacyIssuePermitDto,
  UpdateLegacyIssuePermitItemDto,
} from "@/types/legacy-issue-permit";

const legacyIssuePermitsApi = {
  async create({ privateRequest, dto }: { privateRequest: PrivateRequest; dto: CreateLegacyIssuePermitDto }) {
    return await privateRequest<LegacyIssuePermit & { items: LegacyIssuePermitItem[] }>({
      method: "POST",
      url: "legacy-issue-permits",
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
    return await privateRequest<PaginatedData<LegacyIssuePermit>>({
      url: "legacy-issue-permits",
      params,
      signal,
    });
  },

  async listNotedItems({
    privateRequest,
    filters = {},
    signal,
  }: {
    privateRequest: PrivateRequest;
    filters?: LegacyIssuePermitNotedItemsFilters;
    signal?: AbortSignal;
  }) {
    return await privateRequest<LegacyIssuePermitNotedItem[]>({
      url: "legacy-issue-permits/items-with-notes",
      params: removeEmptyParams({
        from: filters.from,
        to: filters.to,
        permitType: filters.permitType,
        productionSubDepartment: filters.productionSubDepartment,
        isSst: filters.isSst,
        isCancelled: filters.isCancelled,
        customerId: filters.customerId,
        creatorId: filters.creatorId,
      }),
      signal,
    });
  },

  async get({ privateRequest, id, signal }: { privateRequest: PrivateRequest; id: string; signal?: AbortSignal }) {
    return await privateRequest<LegacyIssuePermitDetailed>({
      url: `legacy-issue-permits/${id}`,
      signal,
    });
  },

  async getNeighbors({
    privateRequest,
    id,
    params,
    signal,
  }: {
    privateRequest: PrivateRequest;
    id: string;
    params: Dictionary;
    signal?: AbortSignal;
  }) {
    return await privateRequest<LegacyIssuePermitNeighbors>({
      url: `legacy-issue-permits/${id}/neighbors`,
      params,
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
    dto: UpdateLegacyIssuePermitDto;
  }) {
    return await privateRequest<LegacyIssuePermit>({
      method: "PATCH",
      url: `legacy-issue-permits/${id}`,
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
    dto: CreateLegacyIssuePermitItemDto;
  }) {
    return await privateRequest<LegacyIssuePermitItem>({
      method: "POST",
      url: `legacy-issue-permits/${id}/items`,
      data: dto,
    });
  },

  async reorderItems({
    privateRequest,
    id,
    dto,
  }: {
    privateRequest: PrivateRequest;
    id: string;
    dto: ReorderLegacyIssuePermitItemsDto;
  }) {
    return await privateRequest<LegacyIssuePermitItem[]>({
      method: "PATCH",
      url: `legacy-issue-permits/${id}/items-order`,
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
    dto: UpdateLegacyIssuePermitItemDto;
  }) {
    return await privateRequest<LegacyIssuePermitItem>({
      method: "PATCH",
      url: `legacy-issue-permits/${id}/items/${itemId}`,
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
    return await privateRequest<LegacyIssuePermitItem>({
      method: "DELETE",
      url: `legacy-issue-permits/${id}/items/${itemId}`,
    });
  },
};

export default legacyIssuePermitsApi;
