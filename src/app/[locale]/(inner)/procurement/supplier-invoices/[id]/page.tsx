"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ReceiptText } from "lucide-react";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import usePrivateRequest from "@/hooks/use-private-request";
import supplierInvoicesApi from "@/lib/api/supplier-invoices";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import { formatDate, formatDateAndTime } from "@/lib/helpers/date-formaters";
import { formatMoney } from "@/lib/helpers/format-money";
import { type SupplierInvoiceDetailed } from "@/types/material-purchase-order";
import LayoutBox from "@/components/ui/layout-box";
import RefetchButton from "@/components/ui/refetch-button";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import EntityDetails, { CreatorLink, EmptyValue, type DetailRow } from "@/components/ui/entity-details";

const PAGE_TITLE = { en: "Supplier Invoice", ar: "فاتورة مورد" };

function InvoiceDetails({ invoice }: { invoice: SupplierInvoiceDetailed }) {
  const { locale, translate, translation } = useI18n();
  const getLocalizedHref = useLocaleHref();

  const orderValue = (() => {
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
    if (invoice.outsourcingOrder) {
      return <span className="font-mono">{invoice.outsourcingOrder.code}</span>;
    }
    return <EmptyValue />;
  })();

  const rows: DetailRow[] = [
    {
      key: translate("Invoice Number", "رقم الفاتورة"),
      value: invoice.invoiceNumber,
      mono: true,
      copyText: invoice.invoiceNumber,
    },
    {
      key: translate("Supplier", "المورد"),
      value: (
        <Link href={getLocalizedHref(`/procurement/suppliers/${invoice.supplier.id}`)} className="hover:underline">
          {invoice.supplier.name}
        </Link>
      ),
    },
    {
      key: translate("Order", "الأمر"),
      value: orderValue,
    },
    {
      key: translate("Issue Date", "تاريخ الإصدار"),
      value: invoice.issuedAt ? formatDate(invoice.issuedAt, locale) : <EmptyValue />,
    },
    {
      key: translate(`Total Purchases (${translation.currency})`, `إجمالي المشتريات (${translation.currency})`),
      value: invoice.totalPurchases != null ? formatMoney(invoice.totalPurchases) : <EmptyValue />,
    },
    {
      key: translate(`Discount (${translation.currency})`, `الخصم (${translation.currency})`),
      value: invoice.totalDiscount != null ? formatMoney(invoice.totalDiscount) : <EmptyValue />,
    },
    {
      key: translate(`VAT (${translation.currency})`, `ضريبة القيمة المضافة (${translation.currency})`),
      value: invoice.vatAmount != null ? formatMoney(invoice.vatAmount) : <EmptyValue />,
    },
    {
      key: translate(`Withholding Tax (${translation.currency})`, `ضريبة الخصم (${translation.currency})`),
      value: invoice.withholdingTaxAmount != null ? formatMoney(invoice.withholdingTaxAmount) : <EmptyValue />,
    },
    {
      key: translate(`Total Amount (${translation.currency})`, `الإجمالي (${translation.currency})`),
      value: invoice.totalAmount != null ? formatMoney(invoice.totalAmount) : <EmptyValue />,
    },
    {
      key: translate("Created At", "تاريخ الإنشاء"),
      value: formatDateAndTime(invoice.createdAt, locale),
    },
    {
      key: translate("Created By", "أنشئ بواسطة"),
      value: <CreatorLink creator={invoice.createdBy} />,
    },
  ];

  return <EntityDetails title={invoice.invoiceNumber} icon={ReceiptText} rows={rows} />;
}

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
