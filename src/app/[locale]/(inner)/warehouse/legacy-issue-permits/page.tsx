"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import useDebouncedState from "@/hooks/use-debounced-state";
import useHandlePreviousFilters from "@/hooks/use-handle-previous-filters";
import usePrivateRequest from "@/hooks/use-private-request";
import legacyIssuePermitsApi from "@/lib/api/legacy-issue-permits";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import removeEmptyParams from "@/lib/helpers/remove-empty-params";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { getLegacyIssuePermitWorkOrderTypeLabel } from "@/lib/constants/enums/legacy-issue-permit-work-order-types";
import { type LegacyIssuePermit } from "@/types/legacy-issue-permit";
import { Badge, Button, Table, TextInput } from "@mantine/core";
import { Plus, Search, X } from "lucide-react";
import PermissionGuard from "@/components/guards/permission";
import LayoutBox from "@/components/ui/layout-box";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import EmptySection from "@/components/ui/sections/empty";
import PaginationHandler from "@/components/ui/pagination-handler";
import NoResultsSection from "@/components/ui/sections/no-results";
import CopyButton from "@/components/ui/copy-button";
import RefetchButton from "@/components/ui/refetch-button";
import SelectLegacyIssuePermitWorkOrderType from "@/components/global/selections/enum-based/select-legacy-issue-permit-work-order-type";

const PAGE_TITLE = { en: "Legacy Issue Permits", ar: "أذونات الصرف المرحلية" };

const TRANSACTIONS_PER_PAGE = 25;

export default function Page() {
  const { locale, translate } = useI18n();

  useDocumentTitle(translate(PAGE_TITLE.en, PAGE_TITLE.ar), "dashboard");

  const router = useRouter();
  const urlSearchParams = useSearchParams();
  const getLocalizedHref = useLocaleHref();
  const privateRequest = usePrivateRequest();

  const [activePage, setActivePage] = useState(parseInt(urlSearchParams.get("page") || "1"));
  const {
    value: keyword,
    debouncedValue: debouncedKeyword,
    setPendingValue: setPendingKeyword,
    setImmediateValue: setImmediateKeyword,
  } = useDebouncedState(urlSearchParams.get("keyword") || "");
  const [workOrderTypeFilter, setWorkOrderTypeFilter] = useState<string | null>(
    urlSearchParams.get("workOrderNumberType") || null,
  );

  const urlParams = {
    page: activePage.toString(),
    keyword: debouncedKeyword,
    workOrderNumberType: workOrderTypeFilter,
  };

  const params = { limit: TRANSACTIONS_PER_PAGE, ...removeEmptyParams(urlParams) };

  const resetAllFilters = () => {
    setActivePage(1);
    setImmediateKeyword("");
    setWorkOrderTypeFilter(null);
  };

  const { filtersChanged, updatePreviousFilters } = useHandlePreviousFilters({
    debouncedKeyword,
    workOrderTypeFilter,
  });

  const {
    data: paginatedTransactions,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.legacyIssuePermits.list(params),
    queryFn: ({ signal }) => legacyIssuePermitsApi.list({ privateRequest, params, signal }),
    staleTime: staleTimes.legacyIssuePermits,
    placeholderData: keepPreviousData,
  });

  const errorMessage = error ? getErrorMessage(locale, error) : "";

  useEffect(() => {
    router.replace(`?` + new URLSearchParams(removeEmptyParams(urlParams)), { scroll: false });

    const newFilters = { debouncedKeyword, workOrderTypeFilter };
    if (filtersChanged(newFilters)) {
      updatePreviousFilters(newFilters);
      if (activePage !== 1) {
        setActivePage(1);
        return;
      }
    }

    window.scrollTo({ top: 0, behavior: "instant" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage, debouncedKeyword, workOrderTypeFilter]);

  return (
    <LayoutBox
      header={{
        backLink: getLocalizedHref("/warehouse"),
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        sideElements: (
          <div className="flex gap-2">
            <RefetchButton isFetching={isFetching} onRefetch={() => refetch()} />
            <PermissionGuard permission={PERMISSIONS.ADD_LEGACY_ISSUE_PERMIT}>
              <Button
                component={Link}
                href={getLocalizedHref("/warehouse/legacy-issue-permits/create")}
                radius="md"
                leftSection={<Plus size={15} />}
              >
                {translate("Create", "إنشاء")}
              </Button>
            </PermissionGuard>
          </div>
        ),
      }}
    >
      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-4">
        <div className="col-span-1 md:col-span-3">
          <TextInput
            value={keyword}
            onChange={(e) => setPendingKeyword(e.currentTarget.value)}
            placeholder={translate("Search...", "ابحث...")}
            leftSection={<Search size={15} />}
            radius="md"
            rightSection={
              keyword ? (
                <button type="button" onClick={() => setImmediateKeyword("")}>
                  <X size={15} />
                </button>
              ) : undefined
            }
          />
        </div>

        <SelectLegacyIssuePermitWorkOrderType
          value={workOrderTypeFilter}
          setValue={setWorkOrderTypeFilter}
          placeholder={translate("Select work order type...", "اختر نوع أمر الشغل...")}
          clearable
          radius="md"
        />
      </div>

      {isFetching ? (
        <LoadingSection message={translate("Loading legacy issue permits...", "جاري تحميل أذونات الصرف المرحلية...")} />
      ) : errorMessage ? (
        <ErrorSection
          errorTitle={translate("Error loading legacy issue permits", "خطأ في تحميل أذونات الصرف المرحلية")}
          errorMessage={errorMessage}
          button={{ text: translate("Try again", "حاول مرة أخرى"), onClick: () => refetch() }}
        />
      ) : (
        paginatedTransactions &&
        (paginatedTransactions.data.length === 0 ? (
          debouncedKeyword || workOrderTypeFilter ? (
            <NoResultsSection
              keyword={debouncedKeyword || translate("selected filters", "الفلاتر المحددة")}
              button={{ text: translate("View All", "عرض الكل"), onClick: resetAllFilters }}
            />
          ) : (
            <EmptySection useDefaultImg message={translate("No legacy issue permits found", "لا توجد أذونات صرف مرحلية")} />
          )
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table className="text-nowrap" verticalSpacing="xs" highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{translate("Issue Permit Number", "رقم إذن الصرف")}</Table.Th>
                    <Table.Th>{translate("Issue Order Number", "رقم طلب الصرف")}</Table.Th>
                    <Table.Th>{translate("Issue Order Date", "تاريخ طلب الصرف")}</Table.Th>
                    <Table.Th>{translate("Date", "التاريخ")}</Table.Th>
                    <Table.Th>{translate("Work Order Type", "نوع أمر الشغل")}</Table.Th>
                    <Table.Th>{translate("Status", "الحالة")}</Table.Th>
                    <Table.Th>{translate("Notes", "الملاحظات")}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedTransactions.data.map((transaction) => (
                    <Table.Tr key={transaction.id} className="text-gray-600">
                      <Table.Td className="font-semibold text-gray-800">
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={getLocalizedHref(`/warehouse/legacy-issue-permits/${transaction.id}`)}
                            className="font-mono hover:underline"
                          >
                            {transaction.issuePermitNumber}
                          </Link>
                          <CopyButton text={transaction.issuePermitNumber} />
                        </div>
                      </Table.Td>
                      <Table.Td>
                        <span className="font-mono">{transaction.issueOrderNumber}</span>
                      </Table.Td>
                      <Table.Td>{formatDateAndTime(transaction.issueOrderDate, locale)}</Table.Td>
                      <Table.Td>{formatDateAndTime(transaction.date, locale)}</Table.Td>
                      <Table.Td>{getLegacyIssuePermitWorkOrderTypeLabel(transaction.workOrderNumberType, locale)}</Table.Td>
                      <Table.Td>
                        {transaction.isCancelled ? (
                          <Badge size="sm" variant="light" color="red" radius="md">
                            {translate("Cancelled", "ملغي")}
                          </Badge>
                        ) : (
                          <Badge size="sm" variant="light" color="teal" radius="md">
                            {translate("Active", "نشط")}
                          </Badge>
                        )}
                      </Table.Td>
                      <Table.Td className="max-w-xs truncate">
                        {transaction.notes || <span className="text-gray-400">-</span>}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>

            <PaginationHandler<LegacyIssuePermit>
              paginatedData={paginatedTransactions}
              activePage={activePage}
              setActivePage={setActivePage}
            />
          </>
        ))
      )}
    </LayoutBox>
  );
}
