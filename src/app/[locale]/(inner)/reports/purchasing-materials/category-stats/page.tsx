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
import { FolderKanban, Printer, RefreshCw } from "lucide-react";
import ErrorSection from "@/components/ui/sections/error";
import PrintDocument from "@/components/ui/print-document";
import ReportPageHeader from "@/components/ui/report-page-header";
import { formatDate } from "@/lib/helpers/date-formaters";
import DateRangeFilter from "../components/date-range-filter";
import OverviewStats from "../components/overview-stats";
import ReportSkeleton from "../components/report-skeleton";
import CategoryStatsEmpty from "./components/category-stats-empty";
import CategoryPicker from "./components/category-picker";
import CategorySubCategoriesTable from "./components/subcategories-table";
import CategorySuppliersTable from "./components/suppliers-table";
import CategoryOrdersTable from "./components/orders-table";
import CategoryMaterialsTable from "./components/materials-table";
import {
  getCategoryMaterialsSortLabel,
  getCategoryOrdersSortLabel,
  getCategorySubCategoriesSortLabel,
  getCategorySuppliersSortLabel,
  sortCategoryMaterials,
  sortCategoryOrders,
  sortCategorySubCategories,
  sortCategorySuppliers,
  type CategoryMaterialsSort,
  type CategoryOrdersSort,
  type CategorySubCategoriesSort,
  type CategorySuppliersSort,
} from "./components/sort";
import PurchasingMaterialsCategoryStatsPrintDocument from "@/components/documents/purchasing-materials-category-stats-print-document";

const PAGE_TITLE = { en: "Purchasing by Category", ar: "المشتريات حسب الفئة" };

const PAGE_SUBTITLE = {
  en: "Purchase stats scoped to one main material category: subcategories, suppliers, purchase orders, and materials.",
  ar: "إحصائيات المشتريات ضمن فئة مواد رئيسية واحدة: الفئات الفرعية والموردون وأوامر الشراء والمواد.",
};

export default function Page() {
  const { locale, translate } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const privateRequest = usePrivateRequest();

  useDocumentTitle(translate(PAGE_TITLE.en, PAGE_TITLE.ar), "dashboard");

  const mainCategoryId = searchParams.get("mainCategoryId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const [subCategoriesSort, setSubCategoriesSort] = useState<CategorySubCategoriesSort>("spend-desc");
  const [suppliersSort, setSuppliersSort] = useState<CategorySuppliersSort>("spend-desc");
  const [ordersSort, setOrdersSort] = useState<CategoryOrdersSort>("invoice-date-desc");
  const [materialsSort, setMaterialsSort] = useState<CategoryMaterialsSort>("spend-desc");

  function updateQuery(patch: { mainCategoryId?: string | null; from?: string | null; to?: string | null }) {
    const params = new URLSearchParams(searchParams.toString());

    if ("mainCategoryId" in patch) {
      if (patch.mainCategoryId) params.set("mainCategoryId", patch.mainCategoryId);
      else params.delete("mainCategoryId");
    }
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
    queryKey: queryKeys.reports.purchasingMaterials.categoryStats(mainCategoryId ?? "", filters),
    queryFn: ({ signal }) =>
      reportsApi.purchasingMaterials.getCategoryStats({
        privateRequest,
        mainCategoryId: mainCategoryId!,
        ...filters,
        signal,
      }),
    staleTime: staleTimes.reports.purchasingMaterialsCategoryStats,
    enabled: Boolean(mainCategoryId),
  });

  const sortedSubCategories = useMemo(
    () => (data ? sortCategorySubCategories(data.subCategories, subCategoriesSort) : []),
    [data, subCategoriesSort],
  );
  const sortedSuppliers = useMemo(
    () => (data ? sortCategorySuppliers(data.suppliers, suppliersSort) : []),
    [data, suppliersSort],
  );
  const sortedOrders = useMemo(
    () => (data ? sortCategoryOrders(data.orders, ordersSort) : []),
    [data, ordersSort],
  );
  const sortedMaterials = useMemo(
    () => (data ? sortCategoryMaterials(data.materials, materialsSort) : []),
    [data, materialsSort],
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
  const printTitle = data?.category.title
    ? `${translate("Report", "تقرير")} - ${reportTitle} - ${data.category.title} - ${printDateSuffix}`
    : `${translate("Report", "تقرير")} - ${reportTitle} - ${printDateSuffix}`;

  return (
    <div className="space-y-6">
      <ReportPageHeader
        breadcrumbs={[
          { label: { en: "Dashboard", ar: "الرئيسية" }, href: "/dashboard" },
          { label: { en: "Reports", ar: "التقارير" }, href: "/reports" },
          { label: { en: "Purchases", ar: "المشتريات" }, href: "/reports/purchasing-materials" },
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
                  <PurchasingMaterialsCategoryStatsPrintDocument
                    title={reportTitle}
                    categoryTitle={data.category.title}
                    startDate={from}
                    endDate={to}
                    overview={data.overview}
                    subCategories={sortedSubCategories}
                    suppliers={sortedSuppliers}
                    orders={sortedOrders}
                    materials={sortedMaterials}
                    subCategoriesSortLabel={getCategorySubCategoriesSortLabel(subCategoriesSort, translate)}
                    suppliersSortLabel={getCategorySuppliersSortLabel(suppliersSort, translate)}
                    ordersSortLabel={getCategoryOrdersSortLabel(ordersSort, translate)}
                    materialsSortLabel={getCategoryMaterialsSortLabel(materialsSort, translate)}
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

      <CategoryPicker value={mainCategoryId} onChange={(next) => updateQuery({ mainCategoryId: next })} />

      {mainCategoryId && (
        <DateRangeFilter
          from={from}
          to={to}
          onFromChange={(value) => updateQuery({ from: value })}
          onToChange={(value) => updateQuery({ to: value })}
        />
      )}

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
              <CategorySubCategoriesTable
                data={sortedSubCategories}
                sort={subCategoriesSort}
                onSortChange={setSubCategoriesSort}
              />
              <CategorySuppliersTable
                data={sortedSuppliers}
                sort={suppliersSort}
                onSortChange={setSuppliersSort}
              />
              <CategoryOrdersTable data={sortedOrders} sort={ordersSort} onSortChange={setOrdersSort} />
              <CategoryMaterialsTable
                data={sortedMaterials}
                sort={materialsSort}
                onSortChange={setMaterialsSort}
              />
            </div>
          )
        )}
      </main>
    </div>
  );
}
