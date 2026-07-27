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
import { FolderKanban, Printer, RefreshCw } from "lucide-react";
import ErrorSection from "@/components/ui/sections/error";
import PrintDocument from "@/components/ui/print-document";
import ReportPageHeader from "@/components/ui/report-page-header";
import OverviewStats from "../components/overview-stats";
import ReportSkeleton from "../components/report-skeleton";
import MaterialTypeChart from "../components/material-type-chart";
import StockStatusChart from "../components/stock-status-chart";
import CategoryValueTable from "../components/category-value-table";
import TopMaterialsTable from "../components/top-materials-table";
import LowStockMaterialsTable from "../components/low-stock-materials-table";
import MaterialsReportPrintDocument from "@/components/documents/materials-report-print-document";
import CategoryPicker from "./components/category-picker";
import CategoryStatsEmpty from "./components/category-stats-empty";

const PAGE_TITLE = { en: "Materials Category Stats", ar: "إحصائيات فئة المواد" };

const PAGE_SUBTITLE = {
  en: "Analysis scoped to one product family, with subcategory comparison, stock health, and high-value or understocked items within the selected main category.",
  ar: "تحليل ضمن عائلة منتجات واحدة، يشمل مقارنة الفئات الفرعية وصحة المخزون والمواد عالية القيمة أو التي تعاني من نقص ضمن الفئة الرئيسية المختارة.",
};

export default function Page() {
  const { locale, translate } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const privateRequest = usePrivateRequest();

  useDocumentTitle(translate(PAGE_TITLE.en, PAGE_TITLE.ar), "dashboard");

  const mainCategoryId = searchParams.get("mainCategoryId");

  function setMainCategoryId(next: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set("mainCategoryId", next);
    else params.delete("mainCategoryId");
    const query = params.toString();
    router.replace(query ? `?${query}` : "?", { scroll: false });
  }

  const { data, isFetching, error, refetch } = useQuery({
    queryKey: queryKeys.reports.materials.categoryStats(mainCategoryId ?? ""),
    queryFn: ({ signal }) =>
      reportsApi.materials.getCategoryStats({
        privateRequest,
        mainCategoryId: mainCategoryId!,
        signal,
      }),
    staleTime: staleTimes.reports.materialsCategoryStats,
    enabled: Boolean(mainCategoryId),
  });

  const errorMessage = error ? getErrorMessage(locale, error) : "";
  const reportTitle = translate(PAGE_TITLE.en, PAGE_TITLE.ar);
  const shortDate = new Date().toLocaleDateString(locale === "ar" ? "ar-EG" : "en-GB");
  const printTitle = data?.category.title
    ? `${translate("Report", "تقرير")} - ${reportTitle} - ${data.category.title} (${shortDate})`
    : `${translate("Report", "تقرير")} - ${reportTitle} (${shortDate})`;

  return (
    <div className="space-y-6">
      <ReportPageHeader
        breadcrumbs={[
          { label: { en: "Dashboard", ar: "الرئيسية" }, href: "/dashboard" },
          { label: { en: "Reports", ar: "التقارير" }, href: "/reports" },
          { label: { en: "Materials Reports", ar: "تقارير المواد" }, href: "/reports/materials" },
          { label: PAGE_TITLE },
        ]}
        icon={FolderKanban}
        title={reportTitle}
        subtitle={translate(PAGE_SUBTITLE.en, PAGE_SUBTITLE.ar)}
        sideElement={
          mainCategoryId ? (
            <div className="flex items-center gap-4">
              {data && !isFetching && !errorMessage && (
                <PrintDocument
                  title={printTitle}
                  buttonType="icon"
                  paperWidth={210}
                  paperHeight={297}
                  icon={<Printer size={14} />}
                >
                  <MaterialsReportPrintDocument
                    title={reportTitle}
                    scopeLabel={data.category.title}
                    overview={data.overview}
                    byMaterialType={data.byMaterialType}
                    stockStatus={data.stockStatus}
                    categoryRows={data.bySubCategory.map((category) => ({
                      id: category.subCategoryId,
                      title: category.subCategoryTitle,
                      count: category.count,
                      totalValue: category.totalValue,
                    }))}
                    categoryLevel="sub"
                    topMaterialsByValue={data.topMaterialsByValue}
                    lowStockMaterials={data.lowStockMaterials}
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
          ) : undefined
        }
      />

      <CategoryPicker value={mainCategoryId} onChange={setMainCategoryId} />

      <main>
        {!mainCategoryId ? (
          <CategoryStatsEmpty />
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

              <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                <MaterialTypeChart data={data.byMaterialType} />
                <StockStatusChart data={data.stockStatus} />
              </div>

              <CategoryValueTable level="sub" data={data.bySubCategory} />
              <TopMaterialsTable data={data.topMaterialsByValue} />
              <LowStockMaterialsTable data={data.lowStockMaterials} />
            </div>
          )
        )}
      </main>
    </div>
  );
}
