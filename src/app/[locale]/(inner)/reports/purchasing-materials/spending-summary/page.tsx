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
import { BarChart3, Printer, RefreshCw } from "lucide-react";
import ErrorSection from "@/components/ui/sections/error";
import PrintDocument from "@/components/ui/print-document";
import ReportPageHeader from "@/components/ui/report-page-header";
import PurchasingMaterialsSpendingSummaryPrintDocument from "@/components/documents/purchasing-materials-spending-summary-print-document";
import { formatDate } from "@/lib/helpers/date-formaters";
import DateRangeFilter, { type GroupBy } from "../components/date-range-filter";
import OverviewStats from "../components/overview-stats";
import ReportSkeleton from "../components/report-skeleton";
import SpendingTrendChart from "../components/spending-trend-chart";
import TopSuppliersTable from "../components/top-suppliers-table";
import TopMaterialsTable from "../components/top-materials-table";
import TopOrdersTable from "../components/top-orders-table";
import SpendingByMainCategoryTable from "../components/spending-by-main-category-table";

const PAGE_TITLE = { en: "Purchasing Spending Summary", ar: "ملخص إنفاق المشتريات" };

const PAGE_SUBTITLE = {
  en: "Overview of material purchasing spend by period, supplier, material, and main category with order status breakdown.",
  ar: "نظرة شاملة على إنفاق شراء المواد حسب الفترة والمورد والمادة والفئة الرئيسية مع تفصيل حالات الطلبات.",
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

  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const groupBy = parseGroupBy(searchParams.get("groupBy"));

  function updateQuery(patch: { from?: string | null; to?: string | null; groupBy?: GroupBy }) {
    const params = new URLSearchParams(searchParams.toString());

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
    queryKey: queryKeys.reports.purchasingMaterials.spendingSummary(filters),
    queryFn: ({ signal }) => reportsApi.purchasingMaterials.getSpendingSummary({ privateRequest, ...filters, signal }),
    staleTime: staleTimes.reports.purchasingMaterialsSpendingSummary,
  });

  const errorMessage = error ? getErrorMessage(locale, error) : "";
  const reportTitle = translate(PAGE_TITLE.en, PAGE_TITLE.ar);
  const dateRangeParts = [from, to].filter(Boolean).map((value) => formatDate(value!, locale));
  const printDateSuffix =
    dateRangeParts.length > 0
      ? dateRangeParts.join(" – ")
      : new Date().toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", { dateStyle: "long" });
  const printTitle = `${translate("Report", "تقرير")} - ${reportTitle} - ${printDateSuffix}`;

  return (
    <div className="space-y-6">
      <ReportPageHeader
        breadcrumbs={[
          { label: { en: "Dashboard", ar: "الرئيسية" }, href: "/dashboard" },
          { label: { en: "Reports", ar: "التقارير" }, href: "/reports" },
          { label: { en: "Purchasing Materials", ar: "شراء المواد" }, href: "/reports/purchasing-materials" },
          { label: PAGE_TITLE },
        ]}
        icon={BarChart3}
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
                <PurchasingMaterialsSpendingSummaryPrintDocument
                  title={reportTitle}
                  startDate={from}
                  endDate={to}
                  groupBy={groupBy}
                  overview={data.overview}
                  byPeriod={data.byPeriod}
                  bySupplier={data.bySupplier}
                  byMaterial={data.byMaterial}
                  byMainCategory={data.byMainCategory}
                  topOrders={data.topOrders}
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
        groupBy={groupBy}
        onFromChange={(value) => updateQuery({ from: value })}
        onToChange={(value) => updateQuery({ to: value })}
        onGroupByChange={(value) => updateQuery({ groupBy: value })}
      />

      <main>
        {isFetching ? (
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
              <SpendingTrendChart data={data.byPeriod} groupBy={groupBy} />
              <TopOrdersTable data={data.topOrders} />
              <TopSuppliersTable data={data.bySupplier} />
              <TopMaterialsTable data={data.byMaterial} />
              <SpendingByMainCategoryTable data={data.byMainCategory} />
            </div>
          )
        )}
      </main>
    </div>
  );
}
