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
import { resolveDisplayUnit, toDisplayQuantity, toDisplayUnitPrice } from "@/lib/helpers/unit-conversion";
import { History, RefreshCw } from "lucide-react";
import ErrorSection from "@/components/ui/sections/error";
import ReportPageHeader from "@/components/ui/report-page-header";
import ReportSkeleton from "../components/report-skeleton";
import DateRangeFilter from "../components/date-range-filter";
import MaterialPicker from "./components/material-picker";
import PriceHistoryEmpty from "./components/price-history-empty";
import PriceChart from "./components/price-chart";
import PriceEntriesTable from "./components/price-entries-table";
import PriceSummary from "./components/price-summary";

const PAGE_TITLE = { en: "Material Price History", ar: "تاريخ أسعار المادة" };

const PAGE_SUBTITLE = {
  en: "Track unit price changes for a specific material over time across purchase orders.",
  ar: "تتبع تغيرات سعر الوحدة لمادة محددة عبر أوامر التوريد بمرور الوقت.",
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
    queryKey: queryKeys.reports.purchasingMaterials.priceHistory(materialCode ?? "", dateFilters),
    queryFn: ({ signal }) =>
      reportsApi.purchasingMaterials.getPriceHistory({
        privateRequest,
        materialCode: materialCode!,
        ...dateFilters,
        signal,
      }),
    staleTime: staleTimes.reports.purchasingMaterialsPriceHistory,
    enabled: Boolean(materialCode),
  });

  const errorMessage = error ? getErrorMessage(locale, error) : "";

  const displayData = useMemo(() => {
    if (!data) return null;

    const { unit, factor } = resolveDisplayUnit(displayUnit, data.material.unitOfMeasurement, data.material.unitConversions);

    const entries = data.entries.map((entry) => ({
      ...entry,
      unitPrice: toDisplayUnitPrice(entry.unitPrice, factor),
      quantityOrdered: toDisplayQuantity(entry.quantityOrdered, factor),
    }));

    return {
      unit,
      entries,
      summary: {
        minPrice: toDisplayUnitPrice(data.summary.minPrice, factor),
        maxPrice: toDisplayUnitPrice(data.summary.maxPrice, factor),
        avgPrice: toDisplayUnitPrice(data.summary.avgPrice, factor),
        changePercentage: data.summary.changePercentage,
      },
      material: data.material,
    };
  }, [data, displayUnit]);

  const unitOptions = data
    ? getMaterialUnitSelectOptions(data.material.unitOfMeasurement, data.material.unitConversions, locale)
    : [];

  return (
    <div className="space-y-6">
      <ReportPageHeader
        breadcrumbs={[
          { label: { en: "Dashboard", ar: "الرئيسية" }, href: "/dashboard" },
          { label: { en: "Reports", ar: "التقارير" }, href: "/reports" },
          { label: { en: "Purchases", ar: "المشتريات" }, href: "/reports/purchasing-materials" },
          { label: PAGE_TITLE },
        ]}
        icon={History}
        title={translate(PAGE_TITLE.en, PAGE_TITLE.ar)}
        subtitle={translate(PAGE_SUBTITLE.en, PAGE_SUBTITLE.ar)}
        sideElement={
          materialCode ? (
            <button
              disabled={isFetching}
              onClick={() => refetch()}
              className="rounded-md text-xs text-gray-800 hover:text-gray-800/75 disabled:opacity-50"
            >
              <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
            </button>
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
          <PriceHistoryEmpty />
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
              <section className="rounded-3xl bg-white px-5 py-4 sm:px-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-stone-800">
                      {displayData.material.title}
                      <span className="ms-2 font-mono text-xs font-normal text-stone-500">{displayData.material.code}</span>
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-stone-500">
                      {translate(
                        `Base unit: ${getMaterialUnitLabel(displayData.material.unitOfMeasurement, locale)}. Prices and quantities use the selected display unit.`,
                        `الوحدة الأساسية: ${getMaterialUnitLabel(displayData.material.unitOfMeasurement, locale)}. الأسعار والكميات حسب وحدة العرض المحددة.`,
                      )}
                    </p>
                  </div>

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

              <PriceSummary
                summary={displayData.summary}
                unitOfMeasurement={displayData.unit}
                purchaseCount={displayData.entries.length}
              />
              <PriceChart
                data={displayData.entries}
                unitOfMeasurement={displayData.unit}
                materialTitle={displayData.material.title}
                materialCode={displayData.material.code}
              />
              <PriceEntriesTable data={displayData.entries} unitOfMeasurement={displayData.unit} />
            </div>
          )
        )}
      </main>
    </div>
  );
}
