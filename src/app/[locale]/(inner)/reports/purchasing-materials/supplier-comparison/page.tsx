"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import usePrivateRequest from "@/hooks/use-private-request";
import reportsApi from "@/lib/api/reports";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import { GitCompareArrows } from "lucide-react";
import ErrorSection from "@/components/ui/sections/error";
import RefetchButton from "@/components/ui/refetch-button";
import ReportPageHeader from "@/components/ui/report-page-header";
import type { MaterialUnit } from "@/lib/constants/enums/material-units";
import DateRangeFilter from "../components/date-range-filter";
import ReportSkeleton from "../components/report-skeleton";
import ComparisonEmpty from "./components/comparison-empty";
import ComparisonOverview from "./components/comparison-overview";
import MutualItemsTable, { type MutualItemsSort } from "./components/mutual-items-table";
import SupplierPickers from "./components/supplier-pickers";

const PAGE_TITLE = { en: "Supplier Comparison", ar: "مقارنة الموردين" };

const PAGE_SUBTITLE = {
  en: "Compare two suppliers on mutual materials: prices, volume, and potential savings.",
  ar: "قارن بين موردين على المواد المشتركة: الأسعار والكميات والتوفير المحتمل.",
};

export default function Page() {
  const { locale, translate } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const privateRequest = usePrivateRequest();

  useDocumentTitle(translate(PAGE_TITLE.en, PAGE_TITLE.ar), "dashboard");

  const supplierAId = searchParams.get("supplierAId");
  const supplierBId = searchParams.get("supplierBId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const [sort, setSort] = useState<MutualItemsSort>("gap-desc");
  const [displayUnit, setDisplayUnit] = useState<MaterialUnit | null>(null);

  function updateQuery(patch: {
    supplierAId?: string | null;
    supplierBId?: string | null;
    from?: string | null;
    to?: string | null;
  }) {
    const params = new URLSearchParams(searchParams.toString());

    if ("supplierAId" in patch) {
      if (patch.supplierAId) params.set("supplierAId", patch.supplierAId);
      else params.delete("supplierAId");
    }
    if ("supplierBId" in patch) {
      if (patch.supplierBId) params.set("supplierBId", patch.supplierBId);
      else params.delete("supplierBId");
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

  const bothSelected = Boolean(supplierAId && supplierBId);
  const differentSuppliers = bothSelected && supplierAId !== supplierBId;
  const filters = {
    from: from || undefined,
    to: to || undefined,
  };

  const { data, isFetching, error, refetch } = useQuery({
    queryKey: queryKeys.reports.purchasingMaterials.supplierComparison(supplierAId ?? "", supplierBId ?? "", filters),
    queryFn: ({ signal }) =>
      reportsApi.purchasingMaterials.getSupplierComparison({
        privateRequest,
        supplierAId: supplierAId!,
        supplierBId: supplierBId!,
        ...filters,
        signal,
      }),
    staleTime: staleTimes.reports.purchasingMaterialsSupplierComparison,
    enabled: differentSuppliers,
  });

  const errorMessage = error ? getErrorMessage(locale, error) : "";
  const reportTitle = translate(PAGE_TITLE.en, PAGE_TITLE.ar);

  return (
    <div className="space-y-6">
      <ReportPageHeader
        breadcrumbs={[
          { label: { en: "Dashboard", ar: "الرئيسية" }, href: "/dashboard" },
          { label: { en: "Reports", ar: "التقارير" }, href: "/reports" },
          { label: { en: "Purchases", ar: "المشتريات" }, href: "/reports/purchasing-materials" },
          { label: PAGE_TITLE },
        ]}
        icon={GitCompareArrows}
        title={reportTitle}
        subtitle={translate(PAGE_SUBTITLE.en, PAGE_SUBTITLE.ar)}
        sideElement={differentSuppliers ? <RefetchButton isFetching={isFetching} onRefetch={() => refetch()} /> : undefined}
      />

      <SupplierPickers
        supplierAId={supplierAId}
        supplierBId={supplierBId}
        onSupplierAChange={(next) => updateQuery({ supplierAId: next })}
        onSupplierBChange={(next) => updateQuery({ supplierBId: next })}
      />

      {differentSuppliers && (
        <DateRangeFilter
          from={from}
          to={to}
          onFromChange={(value) => updateQuery({ from: value })}
          onToChange={(value) => updateQuery({ to: value })}
        />
      )}

      <main>
        {!differentSuppliers ? (
          <ComparisonEmpty />
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
              <ComparisonOverview data={data} />
              <MutualItemsTable
                items={data.mutualItems}
                supplierAName={data.suppliers.a.name}
                supplierBName={data.suppliers.b.name}
                sort={sort}
                onSortChange={setSort}
                displayUnit={displayUnit}
                onDisplayUnitChange={setDisplayUnit}
              />
            </div>
          )
        )}
      </main>
    </div>
  );
}
