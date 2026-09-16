"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Button, Table, TextInput } from "@mantine/core";
import { RotateCcw } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import useHandlePreviousFilters from "@/hooks/use-handle-previous-filters";
import usePrivateRequest from "@/hooks/use-private-request";
import useHasPermission from "@/hooks/use-has-permission";
import auditLogsApi from "@/lib/api/audit-logs";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import removeEmptyParams from "@/lib/helpers/remove-empty-params";
import { dateToEndOfDayIso, dateToStartOfDayIso } from "@/lib/helpers/audit-date-filters";
import { buildAuditLogListQuery } from "@/lib/helpers/audit-log-filters";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { type AuditLog } from "@/types/audit-log";
import LayoutBox from "@/components/ui/layout-box";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import EmptySection from "@/components/ui/sections/empty";
import PaginationHandler from "@/components/ui/pagination-handler";
import NoResultsSection from "@/components/ui/sections/no-results";
import RefetchButton from "@/components/ui/refetch-button";
import DatePickerInput from "@/components/ui/date-picker-input";
import SelectAuditAction from "@/components/global/selections/enum-based/select-audit-action";
import SelectUser from "@/components/global/selections/remote-based/select-user";
import SelectAuditedTable from "./components/select-audited-table";
import AuditLogRow from "./components/audit-log-row";

const PAGE_TITLE = { en: "Audit Logs", ar: "سجلات التدقيق" };

const LOGS_PER_PAGE = 25;

function hasActiveFilters(filters: Record<string, string | null>) {
  return Object.entries(filters).some(([key, value]) => key !== "page" && !!value);
}

export default function Page() {
  const { locale, translate } = useI18n();
  const router = useRouter();
  const urlSearchParams = useSearchParams();
  const privateRequest = usePrivateRequest();
  const canReadUsers = useHasPermission(PERMISSIONS.READ_USERS);
  const canLookupUsers = useHasPermission(PERMISSIONS.LOOKUP_USERS);

  useDocumentTitle(translate(PAGE_TITLE.en, PAGE_TITLE.ar), "dashboard");

  const [activePage, setActivePage] = useState(parseInt(urlSearchParams.get("page") || "1"));
  const [actionFilter, setActionFilter] = useState<string | null>(urlSearchParams.get("action") || null);
  const [tableNameFilter, setTableNameFilter] = useState<string | null>(urlSearchParams.get("tableName") || null);
  const [recordIdFilter, setRecordIdFilter] = useState(urlSearchParams.get("recordId") || "");
  const [actorUserIdFilter, setActorUserIdFilter] = useState<string | null>(urlSearchParams.get("actorUserId") || null);
  const [operationIdFilter, setOperationIdFilter] = useState(urlSearchParams.get("operationId") || "");
  const [parentTableNameFilter, setParentTableNameFilter] = useState<string | null>(
    urlSearchParams.get("parentTableName") || null,
  );
  const [parentRecordIdFilter, setParentRecordIdFilter] = useState(urlSearchParams.get("parentRecordId") || "");
  const [rootTableNameFilter, setRootTableNameFilter] = useState<string | null>(
    urlSearchParams.get("rootTableName") || null,
  );
  const [rootRecordIdFilter, setRootRecordIdFilter] = useState(urlSearchParams.get("rootRecordId") || "");
  const [createdFromFilter, setCreatedFromFilter] = useState<string | null>(urlSearchParams.get("createdFrom") || null);
  const [createdToFilter, setCreatedToFilter] = useState<string | null>(urlSearchParams.get("createdTo") || null);

  const urlFilters = {
    page: activePage.toString(),
    action: actionFilter,
    tableName: tableNameFilter,
    recordId: recordIdFilter.trim() || null,
    actorUserId: actorUserIdFilter,
    operationId: operationIdFilter.trim() || null,
    parentTableName: parentTableNameFilter,
    parentRecordId: parentRecordIdFilter.trim() || null,
    rootTableName: rootTableNameFilter,
    rootRecordId: rootRecordIdFilter.trim() || null,
    createdFrom: createdFromFilter,
    createdTo: createdToFilter,
  };

  const apiParams = removeEmptyParams({
    page: activePage.toString(),
    limit: LOGS_PER_PAGE.toString(),
    sortBy: "-createdAt",
    action: actionFilter,
    tableName: tableNameFilter,
    recordId: recordIdFilter.trim() || null,
    actorUserId: actorUserIdFilter,
    operationId: operationIdFilter.trim() || null,
    parentTableName: parentTableNameFilter,
    parentRecordId: parentRecordIdFilter.trim() || null,
    rootTableName: rootTableNameFilter,
    rootRecordId: rootRecordIdFilter.trim() || null,
    "createdAt[gte]": dateToStartOfDayIso(createdFromFilter),
    "createdAt[lte]": dateToEndOfDayIso(createdToFilter),
  });

  const resetAllFilters = () => {
    setActivePage(1);
    setActionFilter(null);
    setTableNameFilter(null);
    setRecordIdFilter("");
    setActorUserIdFilter(null);
    setOperationIdFilter("");
    setParentTableNameFilter(null);
    setParentRecordIdFilter("");
    setRootTableNameFilter(null);
    setRootRecordIdFilter("");
    setCreatedFromFilter(null);
    setCreatedToFilter(null);
  };

  const { filtersChanged, updatePreviousFilters } = useHandlePreviousFilters({
    actionFilter,
    tableNameFilter,
    recordIdFilter,
    actorUserIdFilter,
    operationIdFilter,
    parentTableNameFilter,
    parentRecordIdFilter,
    rootTableNameFilter,
    rootRecordIdFilter,
    createdFromFilter,
    createdToFilter,
  });

  const {
    data: paginatedLogs,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.auditLogs.list(apiParams),
    queryFn: ({ signal }) => auditLogsApi.list({ privateRequest, params: apiParams, signal }),
    staleTime: staleTimes.auditLogs,
    placeholderData: keepPreviousData,
  });

  const errorMessage = error ? getErrorMessage(locale, error) : "";

  useEffect(() => {
    router.replace(`?${buildAuditLogListQuery(urlFilters)}`, { scroll: false });

    const newFilters = {
      actionFilter,
      tableNameFilter,
      recordIdFilter,
      actorUserIdFilter,
      operationIdFilter,
      parentTableNameFilter,
      parentRecordIdFilter,
      rootTableNameFilter,
      rootRecordIdFilter,
      createdFromFilter,
      createdToFilter,
    };

    if (filtersChanged(newFilters)) {
      updatePreviousFilters(newFilters);
      if (activePage !== 1) {
        setActivePage(1);
        return;
      }
    }

    window.scrollTo({ top: 0, behavior: "instant" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activePage,
    actionFilter,
    tableNameFilter,
    recordIdFilter,
    actorUserIdFilter,
    operationIdFilter,
    parentTableNameFilter,
    parentRecordIdFilter,
    rootTableNameFilter,
    rootRecordIdFilter,
    createdFromFilter,
    createdToFilter,
  ]);

  const filtersActive = hasActiveFilters(urlFilters);

  return (
    <LayoutBox
      header={{
        backLink: true,
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        sideElements: <RefetchButton isFetching={isFetching} onRefetch={() => refetch()} />,
      }}
    >
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-4">
          <SelectAuditAction
            value={actionFilter}
            setValue={setActionFilter}
            placeholder={translate("Action", "الإجراء")}
            clearable
          />
          <SelectAuditedTable
            value={tableNameFilter}
            setValue={setTableNameFilter}
            placeholder={translate("Table", "الجدول")}
          />
          <TextInput
            value={recordIdFilter}
            onChange={(e) => setRecordIdFilter(e.currentTarget.value)}
            placeholder={translate("Record ID", "معرف السجل")}
            radius="md"
          />
          <div />
        </div>

        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-4">
          <SelectAuditedTable
            value={parentTableNameFilter}
            setValue={setParentTableNameFilter}
            placeholder={translate("Parent table", "جدول الأب")}
          />
          <TextInput
            value={parentRecordIdFilter}
            onChange={(e) => setParentRecordIdFilter(e.currentTarget.value)}
            placeholder={translate("Parent record ID", "معرف سجل الأب")}
            radius="md"
          />
          <SelectAuditedTable
            value={rootTableNameFilter}
            setValue={setRootTableNameFilter}
            placeholder={translate("Root table", "جدول الجذر")}
          />
          <TextInput
            value={rootRecordIdFilter}
            onChange={(e) => setRootRecordIdFilter(e.currentTarget.value)}
            placeholder={translate("Root record ID", "معرف سجل الجذر")}
            radius="md"
          />
        </div>

        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-4">
          {canReadUsers || canLookupUsers ? (
            <SelectUser
              value={actorUserIdFilter}
              setValue={setActorUserIdFilter}
              lookup={!canReadUsers && canLookupUsers}
              placeholder={translate("Actor", "المستخدم")}
            />
          ) : (
            <TextInput
              value={actorUserIdFilter || ""}
              onChange={(e) => setActorUserIdFilter(e.currentTarget.value.trim() || null)}
              placeholder={translate("Actor user ID", "معرف المستخدم")}
              radius="md"
            />
          )}
          <TextInput
            value={operationIdFilter}
            onChange={(e) => setOperationIdFilter(e.currentTarget.value)}
            placeholder={translate("Operation ID", "معرف العملية")}
            radius="md"
          />
          <DatePickerInput
            value={createdFromFilter}
            onChange={setCreatedFromFilter}
            placeholder={translate("Start date", "تاريخ البداية")}
            clearable
            maxDate={createdToFilter ?? undefined}
          />
          <DatePickerInput
            value={createdToFilter}
            onChange={setCreatedToFilter}
            placeholder={translate("End date", "تاريخ النهاية")}
            clearable
            minDate={createdFromFilter ?? undefined}
          />
        </div>

        {filtersActive && (
          <div>
            <Button variant="light" color="gray" size="xs" leftSection={<RotateCcw size={14} />} onClick={resetAllFilters}>
              {translate("Reset filters", "إعادة تعيين الفلاتر")}
            </Button>
          </div>
        )}
      </div>

      {isFetching ? (
        <LoadingSection message={translate("Loading audit logs...", "جاري تحميل سجلات التدقيق...")} />
      ) : errorMessage ? (
        <ErrorSection
          errorTitle={translate("Error loading audit logs", "خطأ في تحميل سجلات التدقيق")}
          errorMessage={errorMessage}
          button={{ text: translate("Try again", "حاول مرة أخرى"), onClick: () => refetch() }}
        />
      ) : (
        paginatedLogs &&
        (paginatedLogs.data.length === 0 ? (
          filtersActive ? (
            <NoResultsSection
              keyword={translate("selected filters", "الفلاتر المحددة")}
              button={{ text: translate("View All", "عرض الكل"), onClick: resetAllFilters }}
            />
          ) : (
            <EmptySection useDefaultImg message={translate("No audit logs found", "لا توجد سجلات تدقيق")} />
          )
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table className="text-nowrap" verticalSpacing="xs" highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{translate("Time", "الوقت")}</Table.Th>
                    <Table.Th>{translate("Actor", "المستخدم")}</Table.Th>
                    <Table.Th>{translate("Action", "الإجراء")}</Table.Th>
                    <Table.Th>{translate("Table", "الجدول")}</Table.Th>
                    <Table.Th>{translate("Record", "السجل")}</Table.Th>
                    <Table.Th>{translate("Operation", "العملية")}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedLogs.data.map((log) => (
                    <AuditLogRow key={log.id} log={log} canLinkActor={canReadUsers} />
                  ))}
                </Table.Tbody>
              </Table>
            </div>

            <PaginationHandler<AuditLog>
              paginatedData={paginatedLogs}
              activePage={activePage}
              setActivePage={setActivePage}
            />
          </>
        ))
      )}
    </LayoutBox>
  );
}
