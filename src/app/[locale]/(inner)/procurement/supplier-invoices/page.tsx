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
import supplierInvoicesApi from "@/lib/api/supplier-invoices";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import removeEmptyParams from "@/lib/helpers/remove-empty-params";
import { formatDate, formatDateAndTime } from "@/lib/helpers/date-formaters";
import { formatMoney } from "@/lib/helpers/format-money";
import { type SupplierInvoiceWithLinks } from "@/types/material-purchase-order";
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

const PAGE_TITLE = { en: "Supplier Invoices", ar: "فواتير الموردين" };

const INVOICES_PER_PAGE = 25;

function OrderCell({ invoice }: { invoice: SupplierInvoiceWithLinks }) {
  const getLocalizedHref = useLocaleHref();

  if (invoice.materialPurchaseOrder) {
    return (
      <Link
        href={getLocalizedHref(`/procurement/material-orders/${invoice.materialPurchaseOrder.id}`)}
        className="font-mono hover:underline"
      >
        {invoice.materialPurchaseOrder.code}
      </Link>
    );
  }

  if (invoice.productPurchaseOrder) {
    return <span className="font-mono">{invoice.productPurchaseOrder.code}</span>;
  }

  if (invoice.outsourcingOrder) {
    return <span className="font-mono">{invoice.outsourcingOrder.code}</span>;
  }

  return <span className="text-gray-400">-</span>;
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

  const params = { limit: INVOICES_PER_PAGE, sortBy: "-issuedAt", ...removeEmptyParams(urlParams) };

  const resetAllFilters = () => {
    setActivePage(1);
    setImmediateKeyword("");
  };

  const { filtersChanged, updatePreviousFilters } = useHandlePreviousFilters({ debouncedKeyword });

  const {
    data: paginatedInvoices,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.supplierInvoices.list(params),
    queryFn: ({ signal }) => supplierInvoicesApi.list({ privateRequest, params, signal }),
    staleTime: staleTimes.supplierInvoices,
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
        placeholder={translate("Search by invoice number...", "ابحث برقم الفاتورة...")}
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
        <LoadingSection message={translate("Loading supplier invoices...", "جاري تحميل فواتير الموردين...")} />
      ) : errorMessage ? (
        <ErrorSection
          errorTitle={translate("Error loading supplier invoices", "خطأ في تحميل فواتير الموردين")}
          errorMessage={errorMessage}
          button={{ text: translate("Try again", "حاول مرة أخرى"), onClick: () => refetch() }}
        />
      ) : (
        paginatedInvoices &&
        (paginatedInvoices.data.length === 0 ? (
          debouncedKeyword ? (
            <NoResultsSection
              keyword={debouncedKeyword}
              button={{ text: translate("View All", "عرض الكل"), onClick: resetAllFilters }}
            />
          ) : (
            <EmptySection useDefaultImg message={translate("No supplier invoices found", "لا توجد فواتير موردين")} />
          )
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table className="text-nowrap" verticalSpacing="xs" highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{translate("Invoice Number", "رقم الفاتورة")}</Table.Th>
                    <Table.Th>{translate("Supplier", "المورد")}</Table.Th>
                    <Table.Th>{translate("Order", "الأمر")}</Table.Th>
                    <Table.Th>{translate("Issue Date", "تاريخ الإصدار")}</Table.Th>
                    <Table.Th>
                      {translate(`Total Purchases (${translation.currency})`, `إجمالي المشتريات (${translation.currency})`)}
                    </Table.Th>
                    <Table.Th>
                      {translate(`Total Amount (${translation.currency})`, `الإجمالي (${translation.currency})`)}
                    </Table.Th>
                    <Table.Th>{translate("Created At", "تاريخ الإنشاء")}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedInvoices.data.map((invoice) => (
                    <Table.Tr key={invoice.id} className="text-gray-600">
                      <Table.Td className="font-semibold text-gray-800">
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={getLocalizedHref(`/procurement/supplier-invoices/${invoice.id}`)}
                            className="font-mono hover:underline"
                          >
                            {invoice.invoiceNumber}
                          </Link>
                          <CopyButton text={invoice.invoiceNumber} />
                        </div>
                      </Table.Td>
                      <Table.Td>
                        <Link
                          href={getLocalizedHref(`/procurement/suppliers/${invoice.supplier.id}`)}
                          className="hover:underline"
                        >
                          {invoice.supplier.name}
                        </Link>
                      </Table.Td>
                      <Table.Td>
                        <OrderCell invoice={invoice} />
                      </Table.Td>
                      <Table.Td>
                        {invoice.issuedAt ? formatDate(invoice.issuedAt, locale) : <span className="text-gray-400">-</span>}
                      </Table.Td>
                      <Table.Td>
                        {invoice.totalPurchases != null ? (
                          formatMoney(invoice.totalPurchases)
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </Table.Td>
                      <Table.Td>
                        {invoice.totalAmount != null ? (
                          formatMoney(invoice.totalAmount)
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </Table.Td>
                      <Table.Td>{formatDateAndTime(invoice.createdAt, locale)}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>

            <PaginationHandler<SupplierInvoiceWithLinks>
              paginatedData={paginatedInvoices}
              activePage={activePage}
              setActivePage={setActivePage}
            />
          </>
        ))
      )}
    </LayoutBox>
  );
}
