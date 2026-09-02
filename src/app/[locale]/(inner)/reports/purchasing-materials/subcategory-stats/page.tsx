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
import { Layers, Printer, RefreshCw } from "lucide-react";
import ErrorSection from "@/components/ui/sections/error";
import PrintDocument from "@/components/ui/print-document";
import ReportPageHeader from "@/components/ui/report-page-header";
import type { MaterialUnit } from "@/lib/constants/enums/material-units";
import { formatDate } from "@/lib/helpers/date-formaters";
import DateRangeFilter from "../components/date-range-filter";
import OverviewStats from "../components/overview-stats";
import ReportSkeleton from "../components/report-skeleton";
import SubCategoryStatsEmpty from "./components/subcategory-stats-empty";
import SubCategoryPicker from "./components/subcategory-picker";
import SubCategorySuppliersTable from "./components/suppliers-table";
import SubCategoryOrdersTable from "./components/orders-table";
import SubCategoryMaterialsTable from "./components/materials-table";
import {
  getSubCategoryMaterialsSortLabel,
  getSubCategoryOrdersSortLabel,
  getSubCategorySuppliersSortLabel,
  sortSubCategoryMaterials,
  sortSubCategoryOrders,
  sortSubCategorySuppliers,
  type SubCategoryMaterialsSort,
  type SubCategoryOrdersSort,
  type SubCategorySuppliersSort,
} from "./components/sort";
import PurchasingMaterialsSubCategoryStatsPrintDocument from "@/components/documents/purchasing-materials-subcategory-stats-print-document";

const PAGE_TITLE = { en: "Purchasing by Subcategory", ar: "المشتريات حسب الفئة الفرعية" };

const PAGE_SUBTITLE = {
  en: "Purchase stats scoped to one material subcategory: suppliers, purchase orders, and materials.",
  ar: "إحصائيات المشتريات ضمن فئة مواد فرعية واحدة: الموردون وأوامر التوريد والمواد.",
};

export default function Page() {
  const { locale, translate } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const privateRequest = usePrivateRequest();

  useDocumentTitle(translate(PAGE_TITLE.en, PAGE_TITLE.ar), "dashboard");

  const subCategoryId = searchParams.get("subCategoryId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const [suppliersSort, setSuppliersSort] = useState<SubCategorySuppliersSort>("spend-desc");
  const [ordersSort, setOrdersSort] = useState<SubCategoryOrdersSort>("invoice-date-desc");
  const [materialsSort, setMaterialsSort] = useState<SubCategoryMaterialsSort>("spend-desc");
  const [materialsDisplayUnit, setMaterialsDisplayUnit] = useState<MaterialUnit | null>(null);

  function updateQuery(patch: { subCategoryId?: string | null; from?: string | null; to?: string | null }) {
    const params = new URLSearchParams(searchParams.toString());

    if ("subCategoryId" in patch) {
      if (patch.subCategoryId) params.set("subCategoryId", patch.subCategoryId);
      else params.delete("subCategoryId");
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
    queryKey: queryKeys.reports.purchasingMaterials.subCategoryStats(subCategoryId ?? "", filters),
    queryFn: ({ signal }) =>
      reportsApi.purchasingMaterials.getSubCategoryStats({
        privateRequest,
        subCategoryId: subCategoryId!,
        ...filters,
        signal,
      }),
    staleTime: staleTimes.reports.purchasingMaterialsSubCategoryStats,
    enabled: Boolean(subCategoryId),
  });

  const sortedSuppliers = useMemo(
    () => (data ? sortSubCategorySuppliers(data.suppliers, suppliersSort) : []),
    [data, suppliersSort],
  );
  const sortedOrders = useMemo(() => (data ? sortSubCategoryOrders(data.orders, ordersSort) : []), [data, ordersSort]);
  const sortedMaterials = useMemo(
    () => (data ? sortSubCategoryMaterials(data.materials, materialsSort) : []),
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
  const printTitle = data?.subCategory.title
    ? `${translate("Report", "تقرير")} - ${reportTitle} - ${data.subCategory.title} - ${printDateSuffix}`
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
        icon={Layers}
        title={reportTitle}
        subtitle={translate(PAGE_SUBTITLE.en, PAGE_SUBTITLE.ar)}
        sideElement={
          subCategoryId ? (
            <div className="flex items-center gap-4">
              {data && !isFetching && !errorMessage && (
                <PrintDocument
                  title={printTitle}
                  buttonType="icon"
                  paperWidth={210}
                  paperHeight={297}
                  icon={<Printer size={14} />}
                >
                  <PurchasingMaterialsSubCategoryStatsPrintDocument
                    title={reportTitle}
                    subCategoryTitle={data.subCategory.title}
                    mainCategoryTitle={data.subCategory.mainCategoryTitle}
                    startDate={from}
                    endDate={to}
                    overview={data.overview}
                    suppliers={sortedSuppliers}
                    orders={sortedOrders}
                    materials={sortedMaterials}
                    materialsDisplayUnit={materialsDisplayUnit}
                    suppliersSortLabel={getSubCategorySuppliersSortLabel(suppliersSort, translate)}
                    ordersSortLabel={getSubCategoryOrdersSortLabel(ordersSort, translate)}
                    materialsSortLabel={getSubCategoryMaterialsSortLabel(materialsSort, translate)}
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

      <SubCategoryPicker value={subCategoryId} onChange={(next) => updateQuery({ subCategoryId: next })} />

      {subCategoryId && (
        <DateRangeFilter
          from={from}
          to={to}
          onFromChange={(value) => updateQuery({ from: value })}
          onToChange={(value) => updateQuery({ to: value })}
        />
      )}

      <main>
        {!subCategoryId ? (
          <SubCategoryStatsEmpty />
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
              <SubCategorySuppliersTable data={sortedSuppliers} sort={suppliersSort} onSortChange={setSuppliersSort} />
              <SubCategoryOrdersTable data={sortedOrders} sort={ordersSort} onSortChange={setOrdersSort} />
              <SubCategoryMaterialsTable
                data={sortedMaterials}
                sort={materialsSort}
                onSortChange={setMaterialsSort}
                displayUnit={materialsDisplayUnit}
                onDisplayUnitChange={setMaterialsDisplayUnit}
              />
            </div>
          )
        )}
      </main>
    </div>
  );
}
