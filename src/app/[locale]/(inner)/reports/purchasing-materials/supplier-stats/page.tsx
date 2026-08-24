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
import { Printer, RefreshCw, Truck } from "lucide-react";
import ErrorSection from "@/components/ui/sections/error";
import PrintDocument from "@/components/ui/print-document";
import ReportPageHeader from "@/components/ui/report-page-header";
import { formatDate } from "@/lib/helpers/date-formaters";
import DateRangeFilter, { type GroupBy } from "../components/date-range-filter";
import OverviewStats from "../components/overview-stats";
import ReportSkeleton from "../components/report-skeleton";
import SpendingTrendChart from "../components/spending-trend-chart";
import SupplierStatsEmpty from "./components/supplier-stats-empty";
import SupplierPicker from "./components/supplier-picker";
import SupplierCategoriesTable from "./components/categories-table";
import SupplierOrdersTable from "./components/orders-table";
import SupplierMaterialsTable from "./components/materials-table";
import {
  getSupplierCategoriesSortLabel,
  getSupplierMaterialsSortLabel,
  getSupplierOrdersSortLabel,
  sortSupplierCategories,
  sortSupplierMaterials,
  sortSupplierOrders,
  type SupplierCategoriesSort,
  type SupplierMaterialsSort,
  type SupplierOrdersSort,
} from "./components/sort";
import PurchasingMaterialsSupplierStatsPrintDocument from "@/components/documents/purchasing-materials-supplier-stats-print-document";

const PAGE_TITLE = { en: "Purchasing by Supplier", ar: "المشتريات حسب المورد" };

const PAGE_SUBTITLE = {
  en: "Purchase stats scoped to one supplier: spending trend, categories, purchase orders, and materials.",
  ar: "إحصائيات المشتريات ضمن مورد واحد: اتجاه القيمة والفئات وأوامر الشراء والمواد.",
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

  const [categoriesSort, setCategoriesSort] = useState<SupplierCategoriesSort>("spend-desc");
  const [ordersSort, setOrdersSort] = useState<SupplierOrdersSort>("invoice-date-desc");
  const [materialsSort, setMaterialsSort] = useState<SupplierMaterialsSort>("spend-desc");

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
    queryKey: queryKeys.reports.purchasingMaterials.supplierStats(supplierId ?? "", filters),
    queryFn: ({ signal }) =>
      reportsApi.purchasingMaterials.getSupplierStats({
        privateRequest,
        supplierId: supplierId!,
        ...filters,
        signal,
      }),
    staleTime: staleTimes.reports.purchasingMaterialsSupplierStats,
    enabled: Boolean(supplierId),
  });

  const sortedCategories = useMemo(
    () => (data ? sortSupplierCategories(data.categories, categoriesSort) : []),
    [data, categoriesSort],
  );
  const sortedOrders = useMemo(() => (data ? sortSupplierOrders(data.orders, ordersSort) : []), [data, ordersSort]);
  const sortedMaterials = useMemo(
    () => (data ? sortSupplierMaterials(data.materials, materialsSort) : []),
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
  const printTitle = data?.supplier.name
    ? `${translate("Report", "تقرير")} - ${reportTitle} - ${data.supplier.name} - ${printDateSuffix}`
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
        icon={Truck}
        title={reportTitle}
        subtitle={translate(PAGE_SUBTITLE.en, PAGE_SUBTITLE.ar)}
        sideElement={
          supplierId ? (
            <div className="flex items-center gap-4">
              {data && !isFetching && !errorMessage && (
                <PrintDocument
                  title={printTitle}
                  buttonType="icon"
                  paperWidth={210}
                  paperHeight={297}
                  icon={<Printer size={14} />}
                >
                  <PurchasingMaterialsSupplierStatsPrintDocument
                    title={reportTitle}
                    supplierName={data.supplier.name}
                    startDate={from}
                    endDate={to}
                    groupBy={groupBy}
                    overview={data.overview}
                    byPeriod={data.byPeriod}
                    categories={sortedCategories}
                    orders={sortedOrders}
                    materials={sortedMaterials}
                    categoriesSortLabel={getSupplierCategoriesSortLabel(categoriesSort, translate)}
                    ordersSortLabel={getSupplierOrdersSortLabel(ordersSort, translate)}
                    materialsSortLabel={getSupplierMaterialsSortLabel(materialsSort, translate)}
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
          <SupplierStatsEmpty />
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
              <SpendingTrendChart data={data.byPeriod} groupBy={groupBy} />
              <SupplierCategoriesTable data={sortedCategories} sort={categoriesSort} onSortChange={setCategoriesSort} />
              <SupplierOrdersTable data={sortedOrders} sort={ordersSort} onSortChange={setOrdersSort} />
              <SupplierMaterialsTable data={sortedMaterials} sort={materialsSort} onSortChange={setMaterialsSort} />
            </div>
          )
        )}
      </main>
    </div>
  );
}
