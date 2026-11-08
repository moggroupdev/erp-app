"use client";

import ProtectedLink from "@/components/ui/protected-link";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import useDebouncedState from "@/hooks/use-debounced-state";
import useHandlePreviousFilters from "@/hooks/use-handle-previous-filters";
import usePrivateRequest from "@/hooks/use-private-request";
import useHasPermission from "@/hooks/use-has-permission";
import legacyIssuePermitsApi from "@/lib/api/legacy-issue-permits";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import removeEmptyParams from "@/lib/helpers/remove-empty-params";
import { formatDate, formatDateAndTime } from "@/lib/helpers/date-formaters";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import {
  getLegacyIssuePermitTypeLabel,
  LEGACY_ISSUE_PERMIT_TYPES,
} from "@/lib/constants/enums/legacy-issue-permit-types";
import { type LegacyIssuePermit } from "@/types/legacy-issue-permit";
import { Badge, Menu, Select, Table, TextInput } from "@mantine/core";
import { Plus, Search, X } from "lucide-react";
import LayoutBox from "@/components/ui/layout-box";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import EmptySection from "@/components/ui/sections/empty";
import PaginationHandler from "@/components/ui/pagination-handler";
import NoResultsSection from "@/components/ui/sections/no-results";
import CopyButton from "@/components/ui/copy-button";
import RefetchButton from "@/components/ui/refetch-button";
import ActionsMenu from "@/components/ui/actions-menu";

const PAGE_TITLE = { en: "Legacy Issue Permits", ar: "أذونات الصرف المرحلية" };

const TRANSACTIONS_PER_PAGE = 25;

const DEFAULT_SORT = "-issuePermitNumber";

const SORT_OPTIONS = [
  { value: "-issuePermitNumber", en: "Issue permit number (Z-A)", ar: "رقم إذن الصرف (ي-أ)" },
  { value: "issuePermitNumber", en: "Issue permit number (A-Z)", ar: "رقم إذن الصرف (أ-ي)" },
  { value: "-date", en: "Issue permit date (newest first)", ar: "تاريخ إذن الصرف (الأحدث أولاً)" },
  { value: "date", en: "Issue permit date (oldest first)", ar: "تاريخ إذن الصرف (الأقدم أولاً)" },
  { value: "-issueOrderNumber", en: "Issue order number (Z-A)", ar: "رقم طلب الصرف (ي-أ)" },
  { value: "issueOrderNumber", en: "Issue order number (A-Z)", ar: "رقم طلب الصرف (أ-ي)" },
  { value: "-issueOrderDate", en: "Issue order date (newest first)", ar: "تاريخ طلب الصرف (الأحدث أولاً)" },
  { value: "issueOrderDate", en: "Issue order date (oldest first)", ar: "تاريخ طلب الصرف (الأقدم أولاً)" },
  { value: "-createdAt", en: "Entry date (newest first)", ar: "تاريخ الإدخال (الأحدث أولاً)" },
  { value: "createdAt", en: "Entry date (oldest first)", ar: "تاريخ الإدخال (الأقدم أولاً)" },
] as const;

type LegacyIssuePermitSort = (typeof SORT_OPTIONS)[number]["value"];

function isLegacyIssuePermitSort(value: string | null): value is LegacyIssuePermitSort {
  return SORT_OPTIONS.some((option) => option.value === value);
}

export default function Page() {
  const { locale, translate } = useI18n();
  const canCreatePermit = useHasPermission(PERMISSIONS.ADD_LEGACY_ISSUE_PERMIT);

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
  const initialSort = urlSearchParams.get("sortBy");
  const [sortBy, setSortBy] = useState<LegacyIssuePermitSort>(
    isLegacyIssuePermitSort(initialSort) ? initialSort : DEFAULT_SORT,
  );

  const urlParams = {
    page: activePage.toString(),
    keyword: debouncedKeyword,
    sortBy,
  };

  const params = { limit: TRANSACTIONS_PER_PAGE, ...removeEmptyParams(urlParams) };

  const resetAllFilters = () => {
    setActivePage(1);
    setImmediateKeyword("");
  };

  const { filtersChanged, updatePreviousFilters } = useHandlePreviousFilters({
    debouncedKeyword,
    sortBy,
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

    const newFilters = { debouncedKeyword, sortBy };
    if (filtersChanged(newFilters)) {
      updatePreviousFilters(newFilters);
      if (activePage !== 1) {
        setActivePage(1);
        return;
      }
    }

    window.scrollTo({ top: 0, behavior: "instant" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage, debouncedKeyword, sortBy]);

  return (
    <LayoutBox
      header={{
        backLink: true,
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        sideElements: (
          <div className="flex gap-3">
            <RefetchButton isFetching={isFetching} onRefetch={() => refetch()} />
            <ActionsMenu>
              {canCreatePermit && (
                <Menu.Item
                  component={Link}
                  href={getLocalizedHref("/warehouse/legacy-issue-permits/create")}
                  leftSection={<Plus size={14} />}
                >
                  {translate("Create issue permit", "إنشاء إذن صرف")}
                </Menu.Item>
              )}
            </ActionsMenu>
          </div>
        ),
      }}
    >
      <div className="flex flex-wrap items-end gap-3">
        <TextInput
          value={keyword}
          onChange={(e) => setPendingKeyword(e.currentTarget.value)}
          placeholder={translate("Search...", "ابحث...")}
          leftSection={<Search size={15} />}
          radius="md"
          className="min-w-64 flex-1"
          rightSection={
            keyword ? (
              <button type="button" onClick={() => setImmediateKeyword("")}>
                <X size={15} />
              </button>
            ) : undefined
          }
        />
        <Select
          value={sortBy}
          onChange={(value) => {
            if (isLegacyIssuePermitSort(value)) setSortBy(value);
          }}
          label={translate("Sort by", "ترتيب حسب")}
          data={SORT_OPTIONS.map((option) => ({
            value: option.value,
            label: translate(option.en, option.ar),
          }))}
          allowDeselect={false}
          radius="md"
          className="min-w-64 sm:w-72"
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
          debouncedKeyword ? (
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
                    <Table.Th>{translate("Issue Permit Date", "تاريخ إذن الصرف")}</Table.Th>
                    <Table.Th>{translate("Issue Order Number", "رقم طلب الصرف")}</Table.Th>
                    <Table.Th>{translate("Issue Order Date", "تاريخ طلب الصرف")}</Table.Th>
                    <Table.Th>{translate("Permit Type / Reference", "نوع الإذن / المرجع")}</Table.Th>
                    <Table.Th>{translate("Entry Date", "تاريخ الإدخال")}</Table.Th>
                    <Table.Th>{translate("Notes", "الملاحظات")}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedTransactions.data.map((transaction) => (
                    <Table.Tr key={transaction.id} className="text-gray-600">
                      <Table.Td className="font-semibold text-gray-800">
                        <div className="flex items-center gap-1.5">
                          <ProtectedLink
                            permission={PERMISSIONS.READ_LEGACY_ISSUE_PERMITS}
                            href={`/warehouse/legacy-issue-permits/${transaction.id}?${new URLSearchParams(
                              removeEmptyParams({ sortBy, keyword: debouncedKeyword }),
                            )}`}
                            className="font-mono hover:underline"
                          >
                            {transaction.issuePermitNumber}
                          </ProtectedLink>
                          <CopyButton text={transaction.issuePermitNumber} />

                          {transaction.isCancelled && (
                            <Badge size="sm" variant="light" color="clay" radius="md">
                              {translate("Cancelled", "ملغي")}
                            </Badge>
                          )}
                        </div>
                      </Table.Td>
                      <Table.Td>{formatDate(transaction.date, locale)}</Table.Td>
                      <Table.Td>
                        <span className="font-mono">{transaction.issueOrderNumber || "-"}</span>
                      </Table.Td>
                      <Table.Td>
                        {transaction.issueOrderDate ? formatDate(transaction.issueOrderDate, locale) : "-"}
                      </Table.Td>
                      <Table.Td>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-500">
                            {getLegacyIssuePermitTypeLabel(transaction.permitType, locale)}
                          </span>
                          {(transaction.permitType === LEGACY_ISSUE_PERMIT_TYPES.CONTRACT_REVIEW ||
                            transaction.permitType === LEGACY_ISSUE_PERMIT_TYPES.MAINTENANCE_ORDER) && (
                            <>
                              -
                              <span className="font-mono">
                                {transaction.hasMultipleCustomers
                                  ? translate("Multiple customers", "عملاء متعددون")
                                  : (transaction.permitType === LEGACY_ISSUE_PERMIT_TYPES.CONTRACT_REVIEW
                                      ? transaction.contractNumber
                                      : transaction.maintenanceOrderNumber) || (
                                      <span className="text-gray-400">-</span>
                                    )}
                              </span>
                            </>
                          )}
                        </div>
                      </Table.Td>
                      <Table.Td>{formatDateAndTime(transaction.createdAt, locale)}</Table.Td>
                      <Table.Td className="max-w-xs truncate">
                        {transaction.notes || <span className="text-gray-400"></span>}
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
