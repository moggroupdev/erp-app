"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import usePrivateRequest from "@/hooks/use-private-request";
import reportsApi from "@/lib/api/reports";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import { getMaterialUnitLabel, getMaterialUnitSelectOptions, type MaterialUnit } from "@/lib/constants/enums/material-units";
import { resolveDisplayUnit, toDisplayQuantity } from "@/lib/helpers/unit-conversion";
import { formatDate } from "@/lib/helpers/date-formaters";
import { ClipboardList } from "lucide-react";
import ErrorSection from "@/components/ui/sections/error";
import RefetchButton from "@/components/ui/refetch-button";
import PrintDocument from "@/components/ui/print-document";
import ReportPageHeader from "@/components/ui/report-page-header";
import PurchasingMaterialsRequisitionHistoryPrintDocument from "@/components/documents/procurement/reports/purchasing-materials-requisition-history-print-document";
import ReportSkeleton from "../components/report-skeleton";
import DateRangeFilter from "../components/date-range-filter";
import ReportMaterialIdentity from "../components/report-material-identity";
import MaterialPicker from "./components/material-picker";
import RequisitionHistoryEmpty from "./components/requisition-history-empty";
import RequisitionChart from "./components/requisition-chart";
import RequisitionEntriesTable from "./components/requisition-entries-table";
import RequisitionSummary from "./components/requisition-summary";

const PAGE_TITLE = { en: "Material Requisition History", ar: "تاريخ طلبات شراء المادة" };

const PAGE_SUBTITLE = {
  en: "Track purchase requisitions for a specific material over time across production departments.",
  ar: "تتبع طلبات شراء مادة محددة عبر أقسام الإنتاج بمرور الوقت.",
};

export default function Page() {
  const { locale, translate } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const privateRequest = usePrivateRequest();

  useDocumentTitle(translate(PAGE_TITLE.en, PAGE_TITLE.ar), "dashboard");

  const materialCode = searchParams.get("materialCode");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const [displayUnit, setDisplayUnit] = useState<MaterialUnit | null>(null);

  useEffect(() => {
    setDisplayUnit(null);
  }, [materialCode]);

  function updateQuery(patch: { materialCode?: string | null; from?: string | null; to?: string | null }) {
    const params = new URLSearchParams(searchParams.toString());

    if ("materialCode" in patch) {
      if (patch.materialCode) params.set("materialCode", patch.materialCode);
      else params.delete("materialCode");
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

  const dateFilters = {
    from: from || undefined,
    to: to || undefined,
  };

  const { data, isFetching, error, refetch } = useQuery({
    queryKey: queryKeys.reports.purchasingMaterials.requisitionHistory(materialCode ?? "", dateFilters),
    queryFn: ({ signal }) =>
      reportsApi.purchasingMaterials.getRequisitionHistory({
        privateRequest,
        materialCode: materialCode!,
        ...dateFilters,
        signal,
      }),
    staleTime: staleTimes.reports.purchasingMaterialsRequisitionHistory,
    enabled: Boolean(materialCode),
  });

  const errorMessage = error ? getErrorMessage(locale, error) : "";

  const displayData = useMemo(() => {
    if (!data) return null;

    const { unit, factor } = resolveDisplayUnit(displayUnit, data.material.unitOfMeasurement, data.material.unitConversions);

    const entries = data.entries.map((entry) => {
      const convertible = entry.quantityRequestedInBase != null;
      return {
        ...entry,
        displayQuantity: convertible ? toDisplayQuantity(entry.quantityRequestedInBase!, factor) : null,
        displayUnit: convertible ? unit : entry.unitOfMeasurementSelected,
      };
    });

    return {
      unit,
      entries,
      summary: {
        requisitionCount: data.summary.requisitionCount,
        totalQuantity: toDisplayQuantity(data.summary.totalQuantity, factor),
        approvedQuantity: toDisplayQuantity(data.summary.approvedQuantity, factor),
        pendingQuantity: toDisplayQuantity(data.summary.pendingQuantity, factor),
        rejectedQuantity: toDisplayQuantity(data.summary.rejectedQuantity, factor),
        missingConversionCount: data.summary.missingConversionCount,
      },
      material: data.material,
    };
  }, [data, displayUnit]);

  const unitOptions = data
    ? getMaterialUnitSelectOptions(data.material.unitOfMeasurement, data.material.unitConversions, locale)
    : [];

  const reportTitle = translate(PAGE_TITLE.en, PAGE_TITLE.ar);
  const printDate = new Date().toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", { dateStyle: "long" });
  const printDateSuffix =
    from && to
      ? translate(
          `from ${formatDate(from, locale)} to ${formatDate(to, locale)}`,
          `من ${formatDate(from, locale)} إلى ${formatDate(to, locale)}`,
        )
      : printDate;
  const printTitle = displayData
    ? `${translate("Report", "تقرير")} - ${reportTitle} - ${displayData.material.title} - ${printDateSuffix}`
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
        icon={ClipboardList}
        title={reportTitle}
        subtitle={translate(PAGE_SUBTITLE.en, PAGE_SUBTITLE.ar)}
        sideElement={
          materialCode ? (
            <div className="flex items-center gap-3 sm:gap-4">
              <RefetchButton isFetching={isFetching} onRefetch={() => refetch()} />
              {displayData && !isFetching && !errorMessage && (
                <PrintDocument title={printTitle} buttonType="icon" paperWidth={210} paperHeight={297}>
                  <PurchasingMaterialsRequisitionHistoryPrintDocument
                    title={reportTitle}
                    startDate={from}
                    endDate={to}
                    materialTitle={displayData.material.title}
                    materialCode={displayData.material.code}
                    displayUnit={displayData.unit}
                    summary={displayData.summary}
                    entries={displayData.entries}
                  />
                </PrintDocument>
              )}
            </div>
          ) : undefined
        }
      />

      <MaterialPicker value={materialCode} onChange={(next) => updateQuery({ materialCode: next })} />

      <DateRangeFilter
        from={from}
        to={to}
        onFromChange={(value) => updateQuery({ from: value })}
        onToChange={(value) => updateQuery({ to: value })}
      />

      <main>
        {!materialCode ? (
          <RequisitionHistoryEmpty />
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
          displayData && (
            <div className="flex flex-col gap-6">
              <section className="rounded-3xl bg-white px-5 py-5 sm:px-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
                  <ReportMaterialIdentity
                    title={displayData.material.title}
                    code={displayData.material.code}
                    hint={translate(
                      `Base unit: ${getMaterialUnitLabel(displayData.material.unitOfMeasurement, locale)}. Quantities use the selected display unit when a conversion exists.`,
                      `الوحدة الأساسية: ${getMaterialUnitLabel(displayData.material.unitOfMeasurement, locale)}. الكميات حسب وحدة العرض المحددة عند وجود تحويل.`,
                    )}
                  />

                  <div className="w-full sm:max-w-xs">
                    <Select
                      value={displayData.unit}
                      onChange={(value) => {
                        if (!value) return;
                        const next = value as MaterialUnit;
                        setDisplayUnit(next === displayData.material.unitOfMeasurement ? null : next);
                      }}
                      label={translate("Display unit", "وحدة العرض")}
                      data={unitOptions.map((option) => ({
                        value: option.value,
                        label:
                          option.value === displayData.material.unitOfMeasurement
                            ? translate(`${option.label} (base)`, `${option.label} (أساسية)`)
                            : option.label,
                      }))}
                      allowDeselect={false}
                      radius="md"
                    />
                  </div>
                </div>
              </section>

              <RequisitionSummary summary={displayData.summary} unitOfMeasurement={displayData.unit} />
              <RequisitionChart
                data={displayData.entries}
                unitOfMeasurement={displayData.unit}
                materialTitle={displayData.material.title}
                materialCode={displayData.material.code}
              />
              <RequisitionEntriesTable data={displayData.entries} />
            </div>
          )
        )}
      </main>
    </div>
  );
}
