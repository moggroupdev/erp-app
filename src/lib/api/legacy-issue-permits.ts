import type { Dictionary, PrivateRequest } from "@/types/api";
import type { PaginatedData } from "@/types/global";
import type {
  CreateLegacyIssuePermitDto,
  CreateLegacyIssuePermitItemDto,
  LegacyIssuePermit,
  LegacyIssuePermitDetailed,
  LegacyIssuePermitItem,
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

  async get({ privateRequest, id, signal }: { privateRequest: PrivateRequest; id: string; signal?: AbortSignal }) {
    return await privateRequest<LegacyIssuePermitDetailed>({
      url: `legacy-issue-permits/${id}`,
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
};

export default legacyIssuePermitsApi;
