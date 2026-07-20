"use client";

import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import usePrivateRequest from "@/hooks/use-private-request";
import reportsApi from "@/lib/api/reports";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import { BarChart3, RefreshCw } from "lucide-react";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import ReportPageHeader from "@/components/ui/report-page-header";
import OverviewStats from "./components/overview-stats";
import MaterialTypeChart from "./components/material-type-chart";
import StockStatusChart from "./components/stock-status-chart";
import MainCategoryTable from "./components/main-category-table";
import TopMaterialsTable from "./components/top-materials-table";
import LowStockMaterialsTable from "./components/low-stock-materials-table";

const PAGE_TITLE = { en: "Materials Inventory Summary", ar: "ملخص مخزون المواد" };

const PAGE_SUBTITLE = {
  en: "A snapshot of warehouse materials: total value, composition by type and category, stock health, and items that need attention.",
  ar: "لمحة عن مواد المخزن: القيمة الإجمالية، التكوين حسب النوع والفئة، صحة المخزون، والمواد التي تحتاج متابعة.",
};

export default function Page() {
  const { locale, translate } = useI18n();
  const privateRequest = usePrivateRequest();

  useDocumentTitle(translate(PAGE_TITLE.en, PAGE_TITLE.ar), "dashboard");

  const { data, isFetching, error, refetch } = useQuery({
    queryKey: queryKeys.reports.materials.inventorySummary(),
    queryFn: ({ signal }) => reportsApi.materials.getInventorySummary({ privateRequest, signal }),
    staleTime: staleTimes.reports.materialsInventorySummary,
  });

  const errorMessage = error ? getErrorMessage(locale, error) : "";

  return (
    <div className="space-y-6">
      <ReportPageHeader
        breadcrumbs={[
          { label: { en: "Dashboard", ar: "الرئيسية" }, href: "/dashboard" },
          { label: { en: "Reports", ar: "التقارير" }, href: "/reports" },
          { label: { en: "Materials Reports", ar: "تقارير المواد" }, href: "/reports/materials" },
          { label: PAGE_TITLE },
        ]}
        icon={BarChart3}
        title={translate(PAGE_TITLE.en, PAGE_TITLE.ar)}
        subtitle={translate(PAGE_SUBTITLE.en, PAGE_SUBTITLE.ar)}
        sideElement={
          <button
            disabled={isFetching}
            onClick={() => refetch()}
            className="rounded-md text-xs text-white hover:text-white/75 disabled:opacity-50"
          >
            <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
          </button>
        }
      />
      <main className="mx-auto max-w-7xl px-6 sm:px-8">
        {isFetching ? (
          <LoadingSection
            message={translate("Loading report...", "جاري تحميل التقرير...")}
            className="rounded-2xl border border-stone-200 bg-white"
          />
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

              <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                <MaterialTypeChart data={data.byMaterialType} />
                <StockStatusChart data={data.stockStatus} />
              </div>

              <MainCategoryTable data={data.byMainCategory} />
              <TopMaterialsTable data={data.topMaterialsByValue} />
              <LowStockMaterialsTable data={data.lowStockMaterials} />
            </div>
          )
        )}
      </main>
    </div>
  );
}
