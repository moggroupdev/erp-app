import type { Dictionary, PrivateRequest } from "@/types/api";
import type { PaginatedData } from "@/types/global";
import type { AuditLog, AuditLogDetailed } from "@/types/audit-log";

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
};

export default auditLogsApi;
