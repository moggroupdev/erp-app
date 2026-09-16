import removeEmptyParams from "@/lib/helpers/remove-empty-params";

export type AuditLogListFilters = {
  page?: string;
  action?: string | null;
  tableName?: string | null;
  recordId?: string | null;
  actorUserId?: string | null;
  operationId?: string | null;
  parentTableName?: string | null;
  parentRecordId?: string | null;
  rootTableName?: string | null;
  rootRecordId?: string | null;
  createdFrom?: string | null;
  createdTo?: string | null;
};

export function buildAuditLogListQuery(filters: AuditLogListFilters) {
  return new URLSearchParams(
    removeEmptyParams({
      page: filters.page,
      action: filters.action,
      tableName: filters.tableName,
      recordId: filters.recordId,
      actorUserId: filters.actorUserId,
      operationId: filters.operationId,
      parentTableName: filters.parentTableName,
      parentRecordId: filters.parentRecordId,
      rootTableName: filters.rootTableName,
      rootRecordId: filters.rootRecordId,
      createdFrom: filters.createdFrom,
      createdTo: filters.createdTo,
    }),
  ).toString();
}

export function truncateUuid(id: string, length = 8) {
  if (id.length <= length) return id;
  return `${id.slice(0, length)}...`;
}
