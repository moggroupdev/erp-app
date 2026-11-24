"use client";

import { useRouter } from "next/navigation";
import { Table } from "@mantine/core";
import { Filter } from "lucide-react";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { getAuditedTableLabel } from "@/lib/constants/audit-tables";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import type { AuditLog } from "@/types/audit-log";
import CopyButton from "@/components/ui/copy-button";
import ProtectedLink from "@/components/ui/protected-link";
import AuditActionLabel from "./audit-action-label";

export type AuditLogRowGroup = {
  /** How many consecutive rows share this operation ID (1 = no merge). */
  rowSpan: number;
  /** True when this row should render the Operation cell (first of a run). */
  showOperationCell: boolean;
  /** Alternating stripe band index for this operation group (0 = white, 1 = gray). */
  stripeIndex: 0 | 1;
};

type AuditLogRowProps = {
  log: AuditLog;
  group: AuditLogRowGroup;
  onFilterByOperationId?: (operationId: string) => void;
};

export default function AuditLogRow({ log, group, onFilterByOperationId }: AuditLogRowProps) {
  const { locale, translate } = useI18n();
  const router = useRouter();
  const getLocalizedHref = useLocaleHref();

  const detailHref = getLocalizedHref(`/organization/audit-logs/${log.id}`);
  const stripeClass = group.stripeIndex === 1 ? "bg-gray-50" : "bg-white";

  return (
    <Table.Tr
      className="cursor-pointer text-gray-600"
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("a, button")) return;
        router.push(detailHref);
      }}
    >
      <Table.Td className={stripeClass}>{formatDateAndTime(log.createdAt, locale)}</Table.Td>
      <Table.Td className={stripeClass}>
        {log.actorName ? (
          log.actorUserId ? (
            <ProtectedLink
              permission={PERMISSIONS.READ_USERS}
              href={`/organization/users/${log.actorUserId}`}
              className="hover:underline"
            >
              {log.actorName}
            </ProtectedLink>
          ) : (
            log.actorName
          )
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </Table.Td>
      <Table.Td className={stripeClass}>
        <AuditActionLabel action={log.action} />
      </Table.Td>
      <Table.Td className={stripeClass}>{getAuditedTableLabel(log.tableName, locale)}</Table.Td>
      <Table.Td className={`font-semibold text-gray-800 ${stripeClass}`}>
        <div className="flex items-center gap-1.5">
          <span className="font-mono">{log.recordId}</span>
          <CopyButton text={log.recordId} />
        </div>
      </Table.Td>
      {group.showOperationCell && (
        <Table.Td
          rowSpan={group.rowSpan > 1 ? group.rowSpan : undefined}
          className={`align-top ${stripeClass}`}
        >
          {log.operationId ? (
            <div className="flex items-center gap-1.5">
              <span className="font-mono" title={log.operationId}>
                {log.operationId}
              </span>
              {onFilterByOperationId && (
                <button
                  type="button"
                  title={translate("Filter by Operation ID", "تصفية حسب معرف العملية")}
                  onClick={() => onFilterByOperationId(log.operationId!)}
                  className="rounded-md bg-haze-50 p-1 text-haze-600 transition-colors hover:text-haze-600"
                >
                  <Filter size={12.5} />
                </button>
              )}
            </div>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </Table.Td>
      )}
    </Table.Tr>
  );
}
