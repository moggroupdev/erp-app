"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Table } from "@mantine/core";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { getAuditedTableLabel } from "@/lib/constants/audit-tables";
import type { AuditLog } from "@/types/audit-log";
import CopyButton from "@/components/ui/copy-button";
import AuditActionLabel from "./audit-action-label";

type AuditLogRowProps = {
  log: AuditLog;
  canLinkActor: boolean;
};

export default function AuditLogRow({ log, canLinkActor }: AuditLogRowProps) {
  const { locale } = useI18n();
  const router = useRouter();
  const getLocalizedHref = useLocaleHref();

  const detailHref = getLocalizedHref(`/organization/audit-logs/${log.id}`);
  const actorHref = canLinkActor && log.actorUserId ? getLocalizedHref(`/organization/users/${log.actorUserId}`) : null;

  return (
    <Table.Tr
      className="cursor-pointer text-gray-600"
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("a, button")) return;
        router.push(detailHref);
      }}
    >
      <Table.Td>{formatDateAndTime(log.createdAt, locale)}</Table.Td>
      <Table.Td>
        {log.actorName ? (
          actorHref ? (
            <Link href={actorHref} className="hover:underline">
              {log.actorName}
            </Link>
          ) : (
            log.actorName
          )
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </Table.Td>
      <Table.Td>
        <AuditActionLabel action={log.action} />
      </Table.Td>
      <Table.Td>{getAuditedTableLabel(log.tableName, locale)}</Table.Td>
      <Table.Td className="font-semibold text-gray-800">
        <div className="flex items-center gap-1.5">
          <span className="font-mono">{log.recordId}</span>
          <CopyButton text={log.recordId} />
        </div>
      </Table.Td>
      <Table.Td>
        {log.operationId ? (
          <div className="flex items-center gap-1.5">
            <span className="font-mono" title={log.operationId}>
              {log.operationId}
            </span>
            <CopyButton text={log.operationId} />
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </Table.Td>
    </Table.Tr>
  );
}
