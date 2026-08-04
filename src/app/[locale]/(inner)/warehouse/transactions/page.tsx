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
import inventoryTransactionsApi from "@/lib/api/inventory-transactions";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import removeEmptyParams from "@/lib/helpers/remove-empty-params";
import { getInventoryTransactionTypeLabel } from "@/lib/constants/enums/inventory-transaction-types";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { type InventoryTransaction } from "@/types/inventory-transaction";
import { Table, TextInput } from "@mantine/core";
import { Search, X } from "lucide-react";
import LayoutBox from "@/components/ui/layout-box";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import EmptySection from "@/components/ui/sections/empty";
import PaginationHandler from "@/components/ui/pagination-handler";
import NoResultsSection from "@/components/ui/sections/no-results";
import CopyButton from "@/components/ui/copy-button";
import RefetchButton from "@/components/ui/refetch-button";
import SelectInventoryTransactionType from "@/components/global/selections/enum-based/select-inventory-transaction-type";

const PAGE_TITLE = { en: "Inventory Transactions", ar: "حركات المخزون" };

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
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<string | null>(
    urlSearchParams.get("transactionType") || null,
  );

  const urlParams = {
    page: activePage.toString(),
    keyword: debouncedKeyword,
    transactionType: transactionTypeFilter,
  };

  const params = { limit: TRANSACTIONS_PER_PAGE, ...removeEmptyParams(urlParams) };

  const resetAllFilters = () => {
    setActivePage(1);
    setImmediateKeyword("");
    setTransactionTypeFilter(null);
  };

  const { filtersChanged, updatePreviousFilters } = useHandlePreviousFilters({
    debouncedKeyword,
    transactionTypeFilter,
  });

  const {
    data: paginatedTransactions,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.inventoryTransactions.list(params),
    queryFn: ({ signal }) => inventoryTransactionsApi.list({ privateRequest, params, signal }),
    staleTime: staleTimes.inventoryTransactions,
    placeholderData: keepPreviousData,
  });

  const errorMessage = error ? getErrorMessage(locale, error) : "";

  useEffect(() => {
    router.replace(`?` + new URLSearchParams(removeEmptyParams(urlParams)), { scroll: false });

    const newFilters = { debouncedKeyword, transactionTypeFilter };
    if (filtersChanged(newFilters)) {
      updatePreviousFilters(newFilters);
      if (activePage !== 1) {
        setActivePage(1);
        return;
      }
    }

    window.scrollTo({ top: 0, behavior: "instant" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage, debouncedKeyword, transactionTypeFilter]);

  return (
    <LayoutBox
      header={{
        backLink: getLocalizedHref("/warehouse"),
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        sideElements: <RefetchButton isFetching={isFetching} onRefetch={() => refetch()} />,
      }}
    >
      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-4">
        <div className="col-span-1 md:col-span-3">
          <TextInput
            value={keyword}
            onChange={(e) => setPendingKeyword(e.currentTarget.value)}
            placeholder={translate(
              "Search by code, legacy number, or notes...",
              "ابحث بالكود أو الرقم القديم أو الملاحظات...",
            )}
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

        <SelectInventoryTransactionType
          value={transactionTypeFilter}
          setValue={setTransactionTypeFilter}
          placeholder={translate("Select type...", "اختر النوع...")}
          clearable
          radius="md"
        />
      </div>

      {isFetching ? (
        <LoadingSection message={translate("Loading inventory transactions...", "جاري تحميل حركات المخزون...")} />
      ) : errorMessage ? (
        <ErrorSection
          errorTitle={translate("Error loading inventory transactions", "خطأ في تحميل حركات المخزون")}
          errorMessage={errorMessage}
          button={{ text: translate("Try again", "حاول مرة أخرى"), onClick: () => refetch() }}
        />
      ) : (
        paginatedTransactions &&
        (paginatedTransactions.data.length === 0 ? (
          debouncedKeyword || transactionTypeFilter ? (
            <NoResultsSection
              keyword={debouncedKeyword || translate("selected filters", "الفلاتر المحددة")}
              button={{ text: translate("View All", "عرض الكل"), onClick: resetAllFilters }}
            />
          ) : (
            <EmptySection useDefaultImg message={translate("No inventory transactions found", "لا توجد حركات مخزون")} />
          )
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table className="text-nowrap" verticalSpacing="xs" highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{translate("Code", "الكود")}</Table.Th>
                    <Table.Th>{translate("Legacy Number", "الرقم القديم")}</Table.Th>
                    <Table.Th>{translate("Type", "النوع")}</Table.Th>
                    <Table.Th>{translate("Notes", "الملاحظات")}</Table.Th>
                    <Table.Th>{translate("Date", "التاريخ")}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedTransactions.data.map((transaction) => (
                    <Table.Tr key={transaction.id} className="text-gray-600">
                      <Table.Td className="font-semibold text-gray-800">
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={getLocalizedHref(`/warehouse/transations/${transaction.id}`)}
                            className="font-mono hover:underline"
                          >
                            {transaction.code}
                          </Link>
                          <CopyButton text={transaction.code} />
                        </div>
                      </Table.Td>
                      <Table.Td>
                        {transaction.legacyNumber ? (
                          <span className="font-mono">{transaction.legacyNumber}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </Table.Td>
                      <Table.Td>{getInventoryTransactionTypeLabel(transaction.transactionType, locale)}</Table.Td>
                      <Table.Td className="max-w-xs truncate">
                        {transaction.notes || <span className="text-gray-400">-</span>}
                      </Table.Td>
                      <Table.Td>{formatDateAndTime(transaction.createdAt, locale)}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>

            <PaginationHandler<InventoryTransaction>
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
