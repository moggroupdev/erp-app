"use client";

import Link from "next/link";
import { Badge } from "@mantine/core";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import useDepartments from "@/hooks/reference/use-departments";
import useRoles from "@/hooks/reference/use-roles";
import useHasPermission from "@/hooks/use-has-permission";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { buildAuditLogListQuery, truncateUuid } from "@/lib/helpers/audit-log-filters";
import { formatUserAgent } from "@/lib/helpers/parse-user-agent";
import { getAuditedTableLabel } from "@/lib/constants/audit-tables";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import type { AuditLogDetailed } from "@/types/audit-log";
import { DetailsTable, EmptyValue, type DetailRow } from "@/components/ui/entity-details";
import CopyButton from "@/components/ui/copy-button";
import AuditActionLabel from "../../components/audit-action-label";
import AuditLogHeader from "./audit-log-header";

type AuditLogDetailsProps = {
  log: AuditLogDetailed;
};

function FilterLink({
  href,
  children,
  mono,
  copyText,
}: {
  href: string;
  children: React.ReactNode;
  mono?: boolean;
  copyText?: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Link href={href} className={`${mono ? "font-mono" : ""} hover:underline`}>
        {children}
      </Link>
      {copyText && <CopyButton text={copyText} />}
    </div>
  );
}

function UserAgentValue({ userAgent }: { userAgent: string }) {
  const { locale } = useI18n();

  return <span title={userAgent}>{formatUserAgent(userAgent, locale)}</span>;
}

export default function AuditLogDetails({ log }: AuditLogDetailsProps) {
  const { locale, translate } = useI18n();
  const getLocalizedHref = useLocaleHref();
  const { helpers: departmentHelpers } = useDepartments();
  const { helpers: roleHelpers } = useRoles();
  const canReadUsers = useHasPermission(PERMISSIONS.READ_USERS);

  const listBase = getLocalizedHref("/organization/audit-logs");

  const entityFilterHref = `${listBase}?${buildAuditLogListQuery({ tableName: log.tableName, recordId: log.recordId })}`;

  const actorFilterHref = log.actorUserId ? `${listBase}?${buildAuditLogListQuery({ actorUserId: log.actorUserId })}` : null;

  const operationFilterHref = log.operationId
    ? `${listBase}?${buildAuditLogListQuery({ operationId: log.operationId })}`
    : null;

  const parentFilterHref =
    log.parentTableName && log.parentRecordId
      ? `${listBase}?${buildAuditLogListQuery({
          parentTableName: log.parentTableName,
          parentRecordId: log.parentRecordId,
        })}`
      : null;

  const rootFilterHref =
    log.rootTableName && log.rootRecordId
      ? `${listBase}?${buildAuditLogListQuery({
          rootTableName: log.rootTableName,
          rootRecordId: log.rootRecordId,
        })}`
      : null;

  const actorUserHref = canReadUsers && log.actorUserId ? getLocalizedHref(`/organization/users/${log.actorUserId}`) : null;

  const department = log.actorDepartmentId ? departmentHelpers.getDepartmentById(log.actorDepartmentId) : null;
  const role = log.actorRoleId ? roleHelpers.getRoleById(log.actorRoleId) : null;

  const actorName = log.actorName ? (
    actorUserHref ? (
      <Link href={actorUserHref} className="hover:underline">
        {log.actorName}
      </Link>
    ) : actorFilterHref ? (
      <FilterLink href={actorFilterHref}>{log.actorName}</FilterLink>
    ) : (
      log.actorName
    )
  ) : (
    <EmptyValue />
  );

  const rows: DetailRow[] = [
    {
      key: translate("Action", "الإجراء"),
      value: <AuditActionLabel action={log.action} />,
    },
    {
      key: translate("Table", "الجدول"),
      value: <FilterLink href={entityFilterHref}>{getAuditedTableLabel(log.tableName, locale)}</FilterLink>,
    },
    {
      key: translate("Record ID", "معرف السجل"),
      value: (
        <FilterLink href={entityFilterHref} mono copyText={log.recordId}>
          <span className="font-mono">{log.recordId}</span>
        </FilterLink>
      ),
    },
    ...(log.parentTableName &&
    log.parentRecordId &&
    parentFilterHref &&
    (log.parentTableName !== log.tableName || log.parentRecordId !== log.recordId)
      ? [
          {
            key: translate("Parent Document", "السجل الأب"),
            value: (
              <FilterLink href={parentFilterHref} copyText={log.parentRecordId}>
                {getAuditedTableLabel(log.parentTableName, locale)} / <span className="font-mono">{log.parentRecordId}</span>
              </FilterLink>
            ),
          } satisfies DetailRow,
        ]
      : []),
    ...(log.rootTableName &&
    log.rootRecordId &&
    rootFilterHref &&
    (log.rootTableName !== log.tableName || log.rootRecordId !== log.recordId)
      ? [
          {
            key: translate("Root document", "السجل الجذري"),
            value: (
              <FilterLink href={rootFilterHref} copyText={log.rootRecordId}>
                {getAuditedTableLabel(log.rootTableName, locale)} / <span className="font-mono">{log.rootRecordId}</span>
              </FilterLink>
            ),
          } satisfies DetailRow,
        ]
      : []),
    {
      key: translate("Operation ID", "معرف العملية"),
      value: log.operationId ? (
        operationFilterHref ? (
          <FilterLink href={operationFilterHref} mono copyText={log.operationId}>
            <span className="font-mono">{truncateUuid(log.operationId, 36)}</span>
          </FilterLink>
        ) : (
          <span className="font-mono">{log.operationId}</span>
        )
      ) : (
        <EmptyValue />
      ),
    },
    {
      key: translate("Actor", "المستخدم"),
      value: (
        <div className="flex flex-wrap items-center gap-2">
          {actorName}
          {log.actorIsAdmin && (
            <Badge size="sm" variant="light" color="dark">
              {translate("Admin", "مسؤول")}
            </Badge>
          )}
        </div>
      ),
    },
    ...(role || log.actorRoleId
      ? [
          {
            key: translate("Actor role", "دور المستخدم"),
            value: role ? role.name : <span className="font-mono">{log.actorRoleId}</span>,
          } satisfies DetailRow,
        ]
      : []),
    {
      key: translate("Actor department", "قسم المستخدم"),
      value: department ? (
        translate(department.nameEn, department.nameAr)
      ) : log.actorDepartmentId ? (
        <span className="font-mono">{log.actorDepartmentId}</span>
      ) : (
        <EmptyValue />
      ),
    },

    {
      key: translate("IP address", "عنوان الـ IP"),
      value: log.ipAddress ? <span className="font-mono">{log.ipAddress}</span> : <EmptyValue />,
      copyText: log.ipAddress || undefined,
    },
    {
      key: translate("User agent", "وكيل المتصفح"),
      value: log.userAgent ? <UserAgentValue userAgent={log.userAgent} /> : <EmptyValue />,
    },

    {
      key: translate("Created at", "وقت التسجيل"),
      value: formatDateAndTime(log.createdAt, locale),
    },
  ];

  return (
    <section className="flex flex-col gap-4">
      <AuditLogHeader log={log} />
      <DetailsTable rows={rows} />
    </section>
  );
}
