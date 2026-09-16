import type { AuditAction } from "@/lib/constants/enums/audit-actions";

export type AuditLogSnapshot = Record<string, unknown>;

export type AuditLog = {
  id: string;
  tableName: string;
  recordId: string;
  action: AuditAction;
  changedColumns: string[] | null;
  actorUserId: string | null;
  actorName: string | null;
  actorIsAdmin: boolean | null;
  actorRoleId: string | null;
  actorDepartmentId: string | null;
  operationId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  parentTableName: string | null;
  parentRecordId: string | null;
  rootTableName: string | null;
  rootRecordId: string | null;
  createdAt: Date;
};

export type AuditLogDetailed = AuditLog & {
  oldRow: AuditLogSnapshot | null;
  newRow: AuditLogSnapshot | null;
  actorUser: { id: string; name: string } | null;
};
