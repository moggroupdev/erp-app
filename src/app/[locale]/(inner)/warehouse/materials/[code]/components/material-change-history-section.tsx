"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Badge, Timeline } from "@mantine/core";
import { ArrowRight, Circle, ExternalLink, History, Minus, Plus, UserRound } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import useMaterialCategories from "@/hooks/reference/use-material-categories";
import auditLogsApi from "@/lib/api/audit-logs";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import {
  formatMaterialChangeValue,
  getMaterialChangeEventTitle,
  getMaterialChangeFieldLabel,
  getMaterialChangeSourceLabel,
  hasMaterialChangeValue,
} from "@/lib/helpers/material-change-history";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import { getSemanticStatusColors, type SemanticStatus } from "@/lib/constants/status-colors";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { getAuditActionLabel, type AuditAction } from "@/lib/constants/enums/audit-actions";
import { getMaterialUnitLabel, isValidMaterialUnit } from "@/lib/constants/enums/material-units";
import type { Locale } from "@/lib/i18n/types";
import type { MaterialChangeHistoryChange, MaterialChangeHistoryEvent } from "@/types/audit-log";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import EmptySection from "@/components/ui/sections/empty";
import PaginationHandler from "@/components/ui/pagination-handler";
import ProtectedLink from "@/components/ui/protected-link";

const PAGE_SIZE = 20;

const ACTION_STATUS: Record<AuditAction, SemanticStatus> = {
  insert: "success",
  update: "info",
  delete: "danger",
};

const ACTION_ICON = {
  insert: Plus,
  update: Circle,
  delete: Minus,
} as const;

export default function MaterialChangeHistorySection({ materialCode }: { materialCode: string }) {
  const { locale, translate, translation } = useI18n();
  const privateRequest = usePrivateRequest();
  const { helpers: categoryHelpers } = useMaterialCategories();
  const [page, setPage] = useState(1);

  const historyQuery = useQuery({
    queryKey: queryKeys.materials.changeHistory(materialCode, page),
    queryFn: ({ signal }) =>
      auditLogsApi.materialTimeline({
        privateRequest,
        code: materialCode,
        params: { page, limit: PAGE_SIZE },
        signal,
      }),
    staleTime: staleTimes.auditLogs,
    placeholderData: keepPreviousData,
  });

  const loading = historyQuery.isFetching;
  const errorMessage = historyQuery.error ? getErrorMessage(locale, historyQuery.error) : "";
  const data = historyQuery.data;
  const events = data?.data ?? [];
  const totalRecords = data?.pagination.totalRecords ?? 0;

  function resolveSubCategoryTitle(id: string) {
    return categoryHelpers.getMaterialCategorySubById(id)?.title;
  }

  function formatUnit(unit: string) {
    return isValidMaterialUnit(unit) ? getMaterialUnitLabel(unit, locale) : unit;
  }

  return (
    <section className="mt-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="bg-haze-50 text-haze-600 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
            <History size={16} />
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-lg font-semibold text-gray-900">{translate("Change History", "سجل التغييرات")}</h4>
              {totalRecords > 0 && (
                <Badge size="sm" variant="light" color="gray" radius="md">
                  {totalRecords}
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-500">
              {translate(
                "Profile, alternate units, and manufactured BOM. Stock quantity and cached unit price are omitted.",
                "الملف والوحدات البديلة وقائمة مواد التصنيع. تُستبعد كمية المخزون وسعر الوحدة المخزّن.",
              )}
            </p>
          </div>
        </div>
      </div>

      {loading && !data ? (
        <LoadingSection message={translate("Loading change history", "جاري تحميل سجل التغييرات")} />
      ) : errorMessage ? (
        <ErrorSection
          errorTitle={translate("An error occurred while loading change history", "حدث خطأ أثناء تحميل سجل التغييرات")}
          errorMessage={errorMessage}
          button={{ text: translate("Retry", "إعادة المحاولة"), onClick: () => historyQuery.refetch() }}
        />
      ) : events.length === 0 ? (
        <EmptySection
          className="p-6"
          message={translate("No recorded changes for this material", "لا توجد تغييرات مسجّلة لهذه المادة")}
        />
      ) : (
        <>
          <div className={`rounded-xl border border-gray-200 bg-white px-3 py-3 sm:px-4 ${loading ? "opacity-70" : ""}`}>
            <Timeline active={events.length} bulletSize={28} lineWidth={2} color="gray">
              {events.map((event) => {
                const status = getSemanticStatusColors(ACTION_STATUS[event.action]);
                const BulletIcon = ACTION_ICON[event.action];

                return (
                  <Timeline.Item
                    key={event.id}
                    bullet={
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full border ${status.borderClass} ${status.surfaceClass} ${status.textClass}`}
                      >
                        <BulletIcon
                          size={event.action === "update" ? 8 : 13}
                          strokeWidth={2.5}
                          fill={event.action === "update" ? "currentColor" : "none"}
                        />
                      </span>
                    }
                    title={<EventHeader event={event} locale={locale} translate={translate} formatUnit={formatUnit} />}
                  >
                    <EventBody
                      event={event}
                      locale={locale}
                      currency={translation.currency}
                      translate={translate}
                      resolveSubCategoryTitle={resolveSubCategoryTitle}
                    />
                  </Timeline.Item>
                );
              })}
            </Timeline>
          </div>

          {data && <PaginationHandler paginatedData={data} activePage={page} setActivePage={setPage} />}
        </>
      )}
    </section>
  );
}

function EventHeader({
  event,
  locale,
  translate,
  formatUnit,
}: {
  event: MaterialChangeHistoryEvent;
  locale: Locale;
  translate: (en: string, ar: string) => string;
  formatUnit: (unit: string) => string;
}) {
  const status = getSemanticStatusColors(ACTION_STATUS[event.action]);
  const isCodeSubject = event.source === "manufactured_bom" && !!event.subject;

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 pe-1">
      <Badge size="sm" variant="light" color={status.mantineColor} radius="md">
        {getAuditActionLabel(event.action, locale)}
      </Badge>

      {event.source !== "material" && (
        <Badge size="sm" variant="light" color="plum" radius="md">
          {getMaterialChangeSourceLabel(event.source, translate)}
        </Badge>
      )}

      <span className={`text-sm font-semibold text-gray-900 ${isCodeSubject ? "font-mono" : ""}`}>
        {getMaterialChangeEventTitle({
          source: event.source,
          action: event.action,
          subject: event.subject,
          translate,
          formatUnit,
        })}
      </span>
    </div>
  );
}

function EventBody({
  event,
  locale,
  currency,
  translate,
  resolveSubCategoryTitle,
}: {
  event: MaterialChangeHistoryEvent;
  locale: Locale;
  currency: string;
  translate: (en: string, ar: string) => string;
  resolveSubCategoryTitle: (id: string) => string | null | undefined;
}) {
  return (
    <div className="mt-1.5 mb-3 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
        <time dateTime={String(event.createdAt)}>{formatDateAndTime(event.createdAt, locale)}</time>
        <span className="inline-flex items-center gap-1">
          <UserRound size={12} className="shrink-0 text-gray-400" aria-hidden />
          {event.actorName ? (
            event.actorUserId ? (
              <ProtectedLink
                permission={PERMISSIONS.READ_USERS}
                href={`/organization/users/${event.actorUserId}`}
                className="hover:text-haze-700 text-gray-600 hover:underline"
              >
                {event.actorName}
              </ProtectedLink>
            ) : (
              <span className="text-gray-600">{event.actorName}</span>
            )
          ) : (
            <span className="text-gray-400">{translate("System", "النظام")}</span>
          )}
        </span>
      </div>

      {event.changes.length > 0 && (
        <ul className="flex list-none flex-col gap-1.5 rounded-xl bg-gray-50/80 p-3.5">
          {event.changes.map((change, index) => (
            <li key={`${event.id}-${change.field}-${index}`}>
              <ChangeRow
                change={change}
                locale={locale}
                currency={currency}
                translate={translate}
                resolveSubCategoryTitle={resolveSubCategoryTitle}
              />
            </li>
          ))}
        </ul>
      )}

      <ProtectedLink
        permission={PERMISSIONS.READ_AUDIT_LOGS}
        href={`/organization/audit-logs/${event.id}`}
        className="hover:text-haze-700 inline-flex w-fit items-center gap-1 text-xs text-gray-500 transition-colors"
      >
        <ExternalLink size={12} aria-hidden />
        {translate("View audit record", "عرض سجل التدقيق")}
      </ProtectedLink>
    </div>
  );
}

function ChangeRow({
  change,
  locale,
  currency,
  translate,
  resolveSubCategoryTitle,
}: {
  change: MaterialChangeHistoryChange;
  locale: Locale;
  currency: string;
  translate: (en: string, ar: string) => string;
  resolveSubCategoryTitle: (id: string) => string | null | undefined;
}) {
  const label = getMaterialChangeFieldLabel(change.field, locale);
  const hasOld = hasMaterialChangeValue(change.oldValue);
  const hasNew = hasMaterialChangeValue(change.newValue);

  if (change.field === "deletedAt") {
    if (hasNew && !hasOld) {
      return <ArchiveLine text={translate("Material archived", "تم أرشفة المادة")} tone="danger" />;
    }
    if (hasOld && !hasNew) {
      return <ArchiveLine text={translate("Material restored", "تم استعادة المادة")} tone="success" />;
    }
  }

  const format = (value: unknown) =>
    formatMaterialChangeValue({
      field: change.field,
      value,
      locale,
      currency,
      resolveSubCategoryTitle,
    });

  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3">
      <span className="shrink-0 text-xs font-medium text-gray-500 sm:w-36 sm:pt-0.5">{label}</span>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 text-sm text-gray-800">
        {hasOld && hasNew ? (
          <>
            <ChangeValue field={change.field} value={change.oldValue} formatted={format(change.oldValue)} muted />
            <ArrowRight size={14} className="shrink-0 text-gray-400 rtl:rotate-180" aria-hidden />
            <ChangeValue field={change.field} value={change.newValue} formatted={format(change.newValue)} />
          </>
        ) : hasNew ? (
          <ChangeValue field={change.field} value={change.newValue} formatted={format(change.newValue)} />
        ) : hasOld ? (
          <span className="inline-flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-gray-500">{translate("cleared", "أُزيل")}</span>
            <ChangeValue field={change.field} value={change.oldValue} formatted={format(change.oldValue)} muted />
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </div>
    </div>
  );
}

function ArchiveLine({ text, tone }: { text: string; tone: SemanticStatus }) {
  const colors = getSemanticStatusColors(tone);
  return (
    <span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${colors.surfaceClass} ${colors.textClass}`}>
      {text}
    </span>
  );
}

function ChangeValue({
  field,
  value,
  formatted,
  muted,
}: {
  field: string;
  value: unknown;
  formatted: string;
  muted?: boolean;
}) {
  const isCode = field === "materialCode" || field === "legacyCode";
  const code = typeof value === "string" ? value : null;
  const className = `max-w-full wrap-break-word rounded-md px-1.5 py-0.5 ${
    muted ? "bg-white text-gray-500 line-through decoration-gray-300" : "bg-white text-gray-900"
  } ${isCode ? "font-mono text-xs" : "text-sm"}`;

  if (isCode && code) {
    return (
      <ProtectedLink
        permission={PERMISSIONS.READ_MATERIALS}
        href={`/warehouse/materials/${code}`}
        className={`${className} hover:text-haze-700 hover:underline`}
      >
        {formatted}
      </ProtectedLink>
    );
  }

  return <span className={className}>{formatted}</span>;
}
