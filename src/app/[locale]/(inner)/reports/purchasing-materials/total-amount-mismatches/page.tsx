"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import usePrivateRequest from "@/hooks/use-private-request";
import reportsApi from "@/lib/api/reports";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import { FileDiff, Printer, RefreshCw } from "lucide-react";
import ErrorSection from "@/components/ui/sections/error";
import PrintDocument from "@/components/ui/print-document";
import ReportPageHeader from "@/components/ui/report-page-header";
import PurchasingMaterialsTotalAmountMismatchesPrintDocument from "@/components/documents/purchasing-materials-total-amount-mismatches-print-document";
import { formatDate } from "@/lib/helpers/date-formaters";
import ReportSkeleton from "../components/report-skeleton";
import DateRangeFilter from "../components/date-range-filter";
import MismatchesOverview from "./components/mismatches-overview";
import MismatchesTable from "./components/mismatches-table";

const PAGE_TITLE = {
  en: "Total Amount Mismatches",
  ar: "فروقات الإجمالي",
};

const PAGE_SUBTITLE = {
  en: "Orders where the calculated total amount differs from the legacy invoice total purchases by at least 1%.",
  ar: "أوامر التوريد التي يختلف فيها الإجمالي المحسوب عن إجمالي مشتريات الفاتورة القديمة بنسبة 1% على الأقل.",
};

export default function Page() {
  const { locale, translate } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const privateRequest = usePrivateRequest();

  useDocumentTitle(translate(PAGE_TITLE.en, PAGE_TITLE.ar), "dashboard");

  const from = searchParams.get("from");
  const to = searchParams.get("to");

  function updateQuery(patch: { from?: string | null; to?: string | null }) {
    const params = new URLSearchParams(searchParams.toString());

    if ("from" in patch) {
      if (patch.from) params.set("from", patch.from);
      else params.delete("from");
    }
    if ("to" in patch) {
      if (patch.to) params.set("to", patch.to);
      else params.delete("to");
    }

    const query = params.toString();
    router.replace(query ? `?${query}` : "?", { scroll: false });
  }

  const filters = {
    from: from || undefined,
    to: to || undefined,
  };

  const { data, isFetching, error, refetch } = useQuery({
    queryKey: queryKeys.reports.purchasingMaterials.totalAmountMismatches(filters),
    queryFn: ({ signal }) =>
      reportsApi.purchasingMaterials.getTotalAmountMismatches({ privateRequest, ...filters, signal }),
    staleTime: staleTimes.reports.purchasingMaterialsTotalAmountMismatches,
  });

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
  const printTitle = `${translate("Report", "تقرير")} - ${reportTitle} - ${printDateSuffix}`;

  return (
    <div className="space-y-6">
      <ReportPageHeader
        breadcrumbs={[
          { label: { en: "Dashboard", ar: "الرئيسية" }, href: "/dashboard" },
          { label: { en: "Reports", ar: "التقارير" }, href: "/reports" },
          { label: { en: "Purchases", ar: "المشتريات" }, href: "/reports/purchasing-materials" },
          { label: PAGE_TITLE },
        ]}
        icon={FileDiff}
        title={reportTitle}
        subtitle={translate(PAGE_SUBTITLE.en, PAGE_SUBTITLE.ar)}
        sideElement={
          <div className="flex items-center gap-4">
            {data && !isFetching && !errorMessage && (
              <PrintDocument
                title={printTitle}
                buttonType="icon"
                paperWidth={210}
                paperHeight={297}
                icon={<Printer size={14} />}
              >
                <PurchasingMaterialsTotalAmountMismatchesPrintDocument
                  title={reportTitle}
                  startDate={from}
                  endDate={to}
                  overview={data.overview}
                  orders={data.orders}
                />
              </PrintDocument>
            )}
            <button
              disabled={isFetching}
              onClick={() => refetch()}
              className="rounded-md text-xs text-gray-800 hover:text-gray-800/75 disabled:opacity-50"
            >
              <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
            </button>
          </div>
        }
      />

      <DateRangeFilter
        from={from}
        to={to}
        onFromChange={(value) => updateQuery({ from: value })}
        onToChange={(value) => updateQuery({ to: value })}
      />

      {isFetching && !data ? (
        <ReportSkeleton />
      ) : errorMessage ? (
        <ErrorSection
          errorTitle={translate("Error loading report", "خطأ في تحميل التقرير")}
          errorMessage={errorMessage}
          button={{ text: translate("Try again", "حاول مرة أخرى"), onClick: () => refetch() }}
        />
      ) : data ? (
        <div className="space-y-6">
          <MismatchesOverview overview={data.overview} />
          <MismatchesTable data={data.orders} />
        </div>
      ) : null}
    </div>
  );
}
