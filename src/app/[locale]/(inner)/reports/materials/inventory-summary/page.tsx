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
import ErrorSection from "@/components/ui/sections/error";
import ReportPageHeader from "@/components/ui/report-page-header";
import OverviewStats from "../components/overview-stats";
import ReportSkeleton from "../components/report-skeleton";
import MaterialTypeChart from "../components/material-type-chart";
import StockStatusChart from "../components/stock-status-chart";
import CategoryValueTable from "../components/category-value-table";
import TopMaterialsTable from "../components/top-materials-table";
import LowStockMaterialsTable from "../components/low-stock-materials-table";

const PAGE_TITLE = { en: "Materials Inventory Summary", ar: "ملخص مخزون المواد" };

const PAGE_SUBTITLE = {
  en: "Executive view of the full materials inventory, including capital in stock, distribution across types and categories, and items requiring reorder.",
  ar: "نظرة تنفيذية على مخزون المواد بالكامل، تشمل رأس المال المخزّن والتوزيع بين الأنواع والفئات والمواد التي تحتاج إعادة طلب.",
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
            className="rounded-md text-xs text-gray-800 hover:text-gray-800/75 disabled:opacity-50"
          >
            <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
          </button>
        }
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

              <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                <MaterialTypeChart data={data.byMaterialType} />
                <StockStatusChart data={data.stockStatus} />
              </div>

              <CategoryValueTable level="main" data={data.byMainCategory} />
              <TopMaterialsTable data={data.topMaterialsByValue} />
              <LowStockMaterialsTable data={data.lowStockMaterials} />
            </div>
          )
        )}
      </main>
    </div>
  );
}
