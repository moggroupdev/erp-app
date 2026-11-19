"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import usePrivateRequest from "@/hooks/use-private-request";
import reportsApi from "@/lib/api/reports";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import { Landmark } from "lucide-react";
import ErrorSection from "@/components/ui/sections/error";
import RefetchButton from "@/components/ui/refetch-button";
import PrintDocument from "@/components/ui/print-document";
import ReportPageHeader from "@/components/ui/report-page-header";
import { formatDate } from "@/lib/helpers/date-formaters";
import DateRangeFilter, { type GroupBy } from "../../purchasing-materials/components/date-range-filter";
import ReportSkeleton from "../components/report-skeleton";
import OverviewStats from "./components/overview-stats";
import OrderTypeBreakdown from "./components/order-type-breakdown";
import AmountTrendChart from "./components/amount-trend-chart";
import InvoicesTable from "./components/invoices-table";
import SupplierInvoicesEmpty from "./components/supplier-invoices-empty";
import SupplierPicker from "./components/supplier-picker";
import {
  getSupplierInvoicesSortLabel,
  sortSupplierInvoices,
  type SupplierInvoicesSort,
} from "./components/sort";
import AccountingSupplierInvoicesPrintDocument from "@/components/documents/accounting/accounting-supplier-invoices-print-document";

const PAGE_TITLE = { en: "Supplier Invoices", ar: "فواتير المورد" };

const PAGE_SUBTITLE = {
  en: "All invoices for one supplier: money totals, order-type breakdown, and issue-date trend.",
  ar: "جميع فواتير مورد واحد: إجماليات المبالغ وتفصيل نوع الأمر واتجاه تاريخ الإصدار.",
};

function parseGroupBy(value: string | null): GroupBy {
  if (value === "quarter" || value === "year") return value;
  return "month";
}

export default function Page() {
  const { locale, translate } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const privateRequest = usePrivateRequest();

  useDocumentTitle(translate(PAGE_TITLE.en, PAGE_TITLE.ar), "dashboard");

  const supplierId = searchParams.get("supplierId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const groupBy = parseGroupBy(searchParams.get("groupBy"));

  const [invoicesSort, setInvoicesSort] = useState<SupplierInvoicesSort>("issue-date-desc");

  function updateQuery(patch: { supplierId?: string | null; from?: string | null; to?: string | null; groupBy?: GroupBy }) {
    const params = new URLSearchParams(searchParams.toString());

    if ("supplierId" in patch) {
      if (patch.supplierId) params.set("supplierId", patch.supplierId);
      else params.delete("supplierId");
    }
    if ("from" in patch) {
      if (patch.from) params.set("from", patch.from);
      else params.delete("from");
    }
    if ("to" in patch) {
      if (patch.to) params.set("to", patch.to);
      else params.delete("to");
    }
    if ("groupBy" in patch && patch.groupBy) {
      if (patch.groupBy === "month") params.delete("groupBy");
      else params.set("groupBy", patch.groupBy);
    }

    const query = params.toString();
    router.replace(query ? `?${query}` : "?", { scroll: false });
  }

  const filters = {
    from: from || undefined,
    to: to || undefined,
    groupBy,
  };

  const { data, isFetching, error, refetch } = useQuery({
    queryKey: queryKeys.reports.accounting.supplierInvoices(supplierId ?? "", filters),
    queryFn: ({ signal }) =>
      reportsApi.accounting.getSupplierInvoices({
        privateRequest,
        supplierId: supplierId!,
        ...filters,
        signal,
      }),
    staleTime: staleTimes.reports.accountingSupplierInvoices,
    enabled: Boolean(supplierId),
  });

  const sortedInvoices = useMemo(
    () => (data ? sortSupplierInvoices(data.invoices, invoicesSort) : []),
    [data, invoicesSort],
  );

  const errorMessage = error ? getErrorMessage(locale, error) : "";
  const reportTitle = translate(PAGE_TITLE.en, PAGE_TITLE.ar);
  const printDate = new Date().toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", { dateStyle: "long" });
  const printDateSuffix =
    from && to
      ? translate(
          `from ${formatDate(from, locale)} to ${formatDate(to, locale)}`,
          `من ${formatDate(from, locale)} إلى ${formatDate(to, locale)}`,
        )
      : printDate;
  const printTitle = data?.supplier.name
    ? `${translate("Report", "تقرير")} - ${reportTitle} - ${data.supplier.name} - ${printDateSuffix}`
    : `${translate("Report", "تقرير")} - ${reportTitle} - ${printDateSuffix}`;

  return (
    <div className="space-y-6">
      <ReportPageHeader
        breadcrumbs={[
          { label: { en: "Dashboard", ar: "الرئيسية" }, href: "/dashboard" },
          { label: { en: "Reports", ar: "التقارير" }, href: "/reports" },
          { label: { en: "Accounting", ar: "الحسابات" }, href: "/reports/accounting" },
          { label: PAGE_TITLE },
        ]}
        icon={Landmark}
        title={reportTitle}
        subtitle={translate(PAGE_SUBTITLE.en, PAGE_SUBTITLE.ar)}
        sideElement={
          supplierId ? (
            <div className="flex items-center gap-3 sm:gap-4">
              <RefetchButton isFetching={isFetching} onRefetch={() => refetch()} />
              {data && !isFetching && !errorMessage && (
                <PrintDocument title={printTitle} buttonType="icon" paperWidth={210} paperHeight={297}>
                  <AccountingSupplierInvoicesPrintDocument
                    title={reportTitle}
                    supplierName={data.supplier.name}
                    startDate={from}
                    endDate={to}
                    groupBy={groupBy}
                    overview={data.overview}
                    byOrderType={data.byOrderType}
                    byPeriod={data.byPeriod}
                    invoices={sortedInvoices}
                    invoicesSortLabel={getSupplierInvoicesSortLabel(invoicesSort, translate)}
                  />
                </PrintDocument>
              )}
            </div>
          ) : undefined
        }
      />

      <SupplierPicker value={supplierId} onChange={(next) => updateQuery({ supplierId: next })} />

      {supplierId && (
        <DateRangeFilter
          from={from}
          to={to}
          groupBy={groupBy}
          onFromChange={(value) => updateQuery({ from: value })}
          onToChange={(value) => updateQuery({ to: value })}
          onGroupByChange={(value) => updateQuery({ groupBy: value })}
        />
      )}

      <main>
        {!supplierId ? (
          <SupplierInvoicesEmpty />
        ) : isFetching ? (
          <ReportSkeleton />
        ) : errorMessage ? (
          <ErrorSection
            errorTitle={translate("Error loading report", "خطأ في تحميل التقرير")}
            errorMessage={errorMessage}
            button={{ text: translate("Try again", "حاول مرة أخرى"), onClick: () => refetch() }}
            className="bg-white"
          />
        ) : (
          data && (
            <div className="flex flex-col gap-6">
              <OverviewStats overview={data.overview} />
              <OrderTypeBreakdown data={data.byOrderType} />
              <AmountTrendChart data={data.byPeriod} groupBy={groupBy} />
              <InvoicesTable data={sortedInvoices} sort={invoicesSort} onSortChange={setInvoicesSort} />
            </div>
          )
        )}
      </main>
    </div>
  );
}
