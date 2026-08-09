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
import materialPurchaseOrdersApi from "@/lib/api/material-purchase-orders";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import removeEmptyParams from "@/lib/helpers/remove-empty-params";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { formatMoney } from "@/lib/helpers/format-money";
import { type MaterialPurchaseOrderWithSupplier } from "@/types/material-purchase-order";
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

const PAGE_TITLE = { en: "Material Purchase Orders", ar: "أوامر شراء الخامات" };

const ORDERS_PER_PAGE = 25;

function getOrderStatusLabel(
  order: Pick<MaterialPurchaseOrderWithSupplier, "cancelledAt" | "completedAt">,
  translate: (en: string, ar: string) => string,
) {
  if (order.cancelledAt) return { label: translate("Cancelled", "ملغي"), className: "text-red-600 font-bold" };
  if (order.completedAt) return { label: translate("Completed", "مكتمل"), className: "text-teal-600 font-bold" };
  return { label: translate("Open", "مفتوح"), className: "text-orange-600 font-bold" };
}

export default function Page() {
  const { locale, translate, translation } = useI18n();

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

  const urlParams = {
    page: activePage.toString(),
    keyword: debouncedKeyword,
  };

  const params = { limit: ORDERS_PER_PAGE, ...removeEmptyParams(urlParams) };

  const resetAllFilters = () => {
    setActivePage(1);
    setImmediateKeyword("");
  };

  const { filtersChanged, updatePreviousFilters } = useHandlePreviousFilters({ debouncedKeyword });

  const {
    data: paginatedOrders,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.materialPurchaseOrders.list(params),
    queryFn: ({ signal }) => materialPurchaseOrdersApi.listOrders({ privateRequest, params, signal }),
    staleTime: staleTimes.materialPurchaseOrders,
    placeholderData: keepPreviousData,
  });

  const errorMessage = error ? getErrorMessage(locale, error) : "";

  useEffect(() => {
    router.replace(`?` + new URLSearchParams(removeEmptyParams(urlParams)), { scroll: false });

    const newFilters = { debouncedKeyword };
    if (filtersChanged(newFilters)) {
      updatePreviousFilters(newFilters);
      if (activePage !== 1) {
        setActivePage(1);
        return;
      }
    }

    window.scrollTo({ top: 0, behavior: "instant" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage, debouncedKeyword]);

  return (
    <LayoutBox
      header={{
        backLink: getLocalizedHref("/procurement"),
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        sideElements: <RefetchButton isFetching={isFetching} onRefetch={() => refetch()} />,
      }}
    >
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

      {isFetching ? (
        <LoadingSection message={translate("Loading material purchase orders...", "جاري تحميل أوامر شراء الخامات...")} />
      ) : errorMessage ? (
        <ErrorSection
          errorTitle={translate("Error loading material purchase orders", "خطأ في تحميل أوامر شراء الخامات")}
          errorMessage={errorMessage}
          button={{ text: translate("Try again", "حاول مرة أخرى"), onClick: () => refetch() }}
        />
      ) : (
        paginatedOrders &&
        (paginatedOrders.data.length === 0 ? (
          debouncedKeyword ? (
            <NoResultsSection
              keyword={debouncedKeyword}
              button={{ text: translate("View All", "عرض الكل"), onClick: resetAllFilters }}
            />
          ) : (
            <EmptySection
              useDefaultImg
              message={translate("No material purchase orders found", "لا توجد أوامر شراء خامات")}
            />
          )
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table className="text-nowrap" verticalSpacing="xs" highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{translate("Code", "الكود")}</Table.Th>
                    <Table.Th>{translate("Invoice Number", "رقم الفاتورة")}</Table.Th>
                    <Table.Th>{translate("Supplier", "المورد")}</Table.Th>
                    <Table.Th>{translate(`Total (${translation.currency})`, `الإجمالي (${translation.currency})`)}</Table.Th>
                    <Table.Th>{translate("Status", "الحالة")}</Table.Th>
                    <Table.Th>{translate("Date", "التاريخ")}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedOrders.data.map((order) => {
                    const status = getOrderStatusLabel(order, translate);
                    return (
                      <Table.Tr key={order.id} className="text-gray-600">
                        <Table.Td className="font-semibold text-gray-800">
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={getLocalizedHref(`/procurement/material-orders/${order.id}`)}
                              className="font-mono hover:underline"
                            >
                              {order.code}
                            </Link>
                            <CopyButton text={order.code} />
                          </div>
                        </Table.Td>
                        <Table.Td>
                          {order.legacyInvoiceNumber ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono">{order.legacyInvoiceNumber}</span>
                              <CopyButton text={order.legacyInvoiceNumber} />
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </Table.Td>
                        <Table.Td>
                          <Link
                            href={getLocalizedHref(`/procurement/suppliers/${order.supplier.id}`)}
                            className="hover:underline"
                          >
                            {order.supplier.name}
                          </Link>
                        </Table.Td>
                        <Table.Td>{formatMoney(order.totalAmount)}</Table.Td>
                        <Table.Td>
                          <span className={status.className}>{status.label}</span>
                        </Table.Td>
                        <Table.Td>{formatDateAndTime(order.createdAt, locale)}</Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </div>

            <PaginationHandler<MaterialPurchaseOrderWithSupplier>
              paginatedData={paginatedOrders}
              activePage={activePage}
              setActivePage={setActivePage}
            />
          </>
        ))
      )}
    </LayoutBox>
  );
}
