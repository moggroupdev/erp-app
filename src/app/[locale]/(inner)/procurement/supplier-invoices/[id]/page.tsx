"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import usePrivateRequest from "@/hooks/use-private-request";
import supplierInvoicesApi from "@/lib/api/supplier-invoices";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import LayoutBox from "@/components/ui/layout-box";
import RefetchButton from "@/components/ui/refetch-button";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import InvoiceDetails from "./components/invoice-details";

const PAGE_TITLE = { en: "Supplier Invoice", ar: "فاتورة مورد" };

export default function Page() {
  const { locale, translate } = useI18n();
  const { id } = useParams<{ id: string }>();
  const privateRequest = usePrivateRequest();
  const getLocalizedHref = useLocaleHref();

  const {
    data: invoice,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.supplierInvoices.detail(id),
    queryFn: ({ signal }) => supplierInvoicesApi.get({ privateRequest, id, signal }),
    staleTime: staleTimes.supplierInvoices,
  });

  useDocumentTitle(
    `${invoice?.invoiceNumber || translate(PAGE_TITLE.en, PAGE_TITLE.ar)} | ${translate("Supplier Invoices", "فواتير الموردين")}`,
  );

  return (
    <LayoutBox
      header={{
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        backLink: getLocalizedHref("/procurement/supplier-invoices"),
        sideElements: <RefetchButton isFetching={isFetching} onRefetch={() => refetch()} />,
      }}
    >
      {isFetching ? (
        <LoadingSection message={translate("Loading supplier invoice...", "جاري تحميل فاتورة المورد...")} />
      ) : error ? (
        <ErrorSection
          errorTitle={translate("Error loading supplier invoice", "خطأ في تحميل فاتورة المورد")}
          errorMessage={getErrorMessage(locale, error)}
          button={{ text: translate("Retry", "إعادة المحاولة"), onClick: () => refetch() }}
        />
      ) : (
        invoice && <InvoiceDetails invoice={invoice} />
      )}
    </LayoutBox>
  );
}
