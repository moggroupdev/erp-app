"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import usePrivateRequest from "@/hooks/use-private-request";
import reportsApi from "@/lib/api/reports";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import { BarChart3, RefreshCw } from "lucide-react";
import ErrorSection from "@/components/ui/sections/error";
import ReportPageHeader from "@/components/ui/report-page-header";
import DateRangeFilter from "../components/date-range-filter";
import OverviewStats from "../components/overview-stats";
import ReportSkeleton from "../components/report-skeleton";
import SpendingTrendChart from "../components/spending-trend-chart";
import TopSuppliersTable from "../components/top-suppliers-table";
import TopMaterialsTable from "../components/top-materials-table";
import TopOrdersTable from "../components/top-orders-table";

const PAGE_TITLE = { en: "Purchasing Spending Summary", ar: "ملخص إنفاق المشتريات" };

const PAGE_SUBTITLE = {
  en: "Overview of material purchasing spend by period, supplier, and material with order status breakdown.",
  ar: "نظرة شاملة على إنفاق شراء المواد حسب الفترة والمورد والمادة مع تفصيل حالات الطلبات.",
};

type GroupBy = "month" | "quarter" | "year";

export default function Page() {
  const { locale, translate } = useI18n();
  const privateRequest = usePrivateRequest();

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [groupBy, setGroupBy] = useState<GroupBy>("month");

  useDocumentTitle(translate(PAGE_TITLE.en, PAGE_TITLE.ar), "dashboard");

  const filters = {
    from: from || undefined,
    to: to || undefined,
    groupBy,
  };

  const { data, isFetching, error, refetch } = useQuery({
    queryKey: queryKeys.reports.purchasingMaterials.spendingSummary(filters),
    queryFn: ({ signal }) =>
      reportsApi.purchasingMaterials.getSpendingSummary({ privateRequest, ...filters, signal }),
    staleTime: staleTimes.reports.purchasingMaterialsSpendingSummary,
  });

  const errorMessage = error ? getErrorMessage(locale, error) : "";

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
        title={translate(PAGE_TITLE.en, PAGE_TITLE.ar)}
        subtitle={translate(PAGE_SUBTITLE.en, PAGE_SUBTITLE.ar)}
        sideElement={
          <button
            disabled={isFetching}
            onClick={() => refetch()}
            className="rounded-md text-xs text-gray-800 hover:text-gray-800/75 disabled:opacity-50"
          >
            <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
          </button>
        }
      />

      <DateRangeFilter
        from={from}
        to={to}
        groupBy={groupBy}
        onFromChange={setFrom}
        onToChange={setTo}
        onGroupByChange={setGroupBy}
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
              <SpendingTrendChart data={data.byPeriod} />
              <TopOrdersTable data={data.topOrders} />
              <TopSuppliersTable data={data.bySupplier} />
              <TopMaterialsTable data={data.byMaterial} />
            </div>
          )
        )}
      </main>
    </div>
  );
}
