import type { Dictionary, PrivateRequest } from "@/types/api";
import type { PaginatedData } from "@/types/global";
import type { AuditLog, AuditLogDetailed, MaterialChangeHistoryEvent } from "@/types/audit-log";

const auditLogsApi = {
  async list({
    privateRequest,
    params,
    signal,
  }: {
    privateRequest: PrivateRequest;
    params: Dictionary;
    signal: AbortSignal;
  }) {
    return await privateRequest<PaginatedData<AuditLog>>({
      url: "audit-logs",
      params,
      signal,
    });
  },

  async get({ privateRequest, id, signal }: { privateRequest: PrivateRequest; id: string; signal?: AbortSignal }) {
    return await privateRequest<AuditLogDetailed>({
      url: `audit-logs/${id}`,
      signal,
    });
  },

  async materialTimeline({
    privateRequest,
    code,
    params,
    signal,
  }: {
    privateRequest: PrivateRequest;
    code: string;
    params?: { page?: number; limit?: number };
    signal?: AbortSignal;
  }) {
    return await privateRequest<PaginatedData<MaterialChangeHistoryEvent>>({
      url: `audit-logs/materials/${encodeURIComponent(code)}/timeline`,
      params,
      signal,
    });
  },
};

export default auditLogsApi;
