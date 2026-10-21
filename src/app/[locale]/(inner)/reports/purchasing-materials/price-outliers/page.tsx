"use client";

import { useMemo } from "react";
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
import {
  getPriceOutlierCauseLabel,
  isValidPriceOutlierCause,
  PRICE_OUTLIER_CAUSE_VALUES,
  type PriceOutlierCause,
} from "@/lib/constants/enums/derived/price-outlier-causes";
import { AlertTriangle } from "lucide-react";
import ErrorSection from "@/components/ui/sections/error";
import RefetchButton from "@/components/ui/refetch-button";
import ReportPageHeader from "@/components/ui/report-page-header";
import ReportSkeleton from "../components/report-skeleton";
import DateRangeFilter from "../components/date-range-filter";
import PriceOutliersOverview from "./components/price-outliers-overview";
import PriceOutliersTable from "./components/price-outliers-table";

const PAGE_TITLE = {
  en: "Price Outliers",
  ar: "انحراف أسعار الشراء",
};

const PAGE_SUBTITLE = {
  en: "Find purchase order lines whose unit price diverges sharply from nearby purchases of the same material.",
  ar: "اكتشاف بنود أوامر التوريد التي يختلف سعر وحدتها بشكل حاد عن المشتريات المجاورة لنفس المادة.",
};

const THRESHOLD_OPTIONS = [2, 3, 5] as const;
const DEFAULT_THRESHOLD = 2;

function parseThreshold(raw: string | null): number {
  const n = Number(raw);
  return THRESHOLD_OPTIONS.includes(n as (typeof THRESHOLD_OPTIONS)[number]) ? n : DEFAULT_THRESHOLD;
}

export default function Page() {
  const { locale, translate } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const privateRequest = usePrivateRequest();

  useDocumentTitle(translate(PAGE_TITLE.en, PAGE_TITLE.ar), "dashboard");

  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const threshold = parseThreshold(searchParams.get("threshold"));
  const rawCause = searchParams.get("cause");
  const cause = rawCause && isValidPriceOutlierCause(rawCause) ? rawCause : null;

  function updateQuery(patch: {
    from?: string | null;
    to?: string | null;
    threshold?: number | null;
    cause?: PriceOutlierCause | null;
  }) {
    const params = new URLSearchParams(searchParams.toString());

    if ("from" in patch) {
      if (patch.from) params.set("from", patch.from);
      else params.delete("from");
    }
    if ("to" in patch) {
      if (patch.to) params.set("to", patch.to);
      else params.delete("to");
    }
    if ("threshold" in patch) {
      if (patch.threshold && patch.threshold !== DEFAULT_THRESHOLD) params.set("threshold", String(patch.threshold));
      else params.delete("threshold");
    }
    if ("cause" in patch) {
      if (patch.cause) params.set("cause", patch.cause);
      else params.delete("cause");
    }

    const query = params.toString();
    router.replace(query ? `?${query}` : "?", { scroll: false });
  }

  const filters = {
    from: from || undefined,
    to: to || undefined,
    threshold,
  };

  const { data, isFetching, error, refetch } = useQuery({
    queryKey: queryKeys.reports.purchasingMaterials.priceOutliers(filters),
    queryFn: ({ signal }) => reportsApi.purchasingMaterials.getPriceOutliers({ privateRequest, ...filters, signal }),
    staleTime: staleTimes.reports.purchasingMaterialsPriceOutliers,
  });

  const errorMessage = error ? getErrorMessage(locale, error) : "";
  const reportTitle = translate(PAGE_TITLE.en, PAGE_TITLE.ar);

  const visibleRows = useMemo(() => {
    if (!data) return [];
    if (!cause) return data.rows;
    return data.rows.filter((row) => row.cause === cause);
  }, [data, cause]);

  const emptyMessage = cause
    ? translate("No outliers match the selected cause.", "لا توجد انحرافات تطابق السبب المحدد.")
    : translate("No price outliers found for this period.", "لا يوجد انحراف في أسعار الشراء في هذه الفترة.");

  return (
    <div className="space-y-6">
      <ReportPageHeader
        breadcrumbs={[
          { label: { en: "Dashboard", ar: "الرئيسية" }, href: "/dashboard" },
          { label: { en: "Reports", ar: "التقارير" }, href: "/reports" },
          { label: { en: "Purchases", ar: "المشتريات" }, href: "/reports/purchasing-materials" },
          { label: PAGE_TITLE },
        ]}
        icon={AlertTriangle}
        title={reportTitle}
        subtitle={translate(PAGE_SUBTITLE.en, PAGE_SUBTITLE.ar)}
        sideElement={<RefetchButton isFetching={isFetching} onRefetch={() => refetch()} />}
      />

      <DateRangeFilter
        from={from}
        to={to}
        onFromChange={(value) => updateQuery({ from: value })}
        onToChange={(value) => updateQuery({ to: value })}
      />

      <section className="rounded-3xl bg-white px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
          <div className="flex-1">
            <Select
              value={String(threshold)}
              onChange={(value) => updateQuery({ threshold: value ? Number(value) : DEFAULT_THRESHOLD })}
              label={translate("Sensitivity", "الحساسية")}
              description={translate(
                "Flag a line when its price is at least this many times the neighbour median (or the inverse).",
                "علم البند عندما يكون سعره على الأقل هذا المضاعف لوسيط الجوار (أو عكسه).",
              )}
              data={THRESHOLD_OPTIONS.map((option) => ({
                value: String(option),
                label: translate(`${option}x`, `${option}×`),
              }))}
              allowDeselect={false}
              radius="md"
            />
          </div>
          <div className="flex-1">
            <Select
              value={cause ?? "all"}
              onChange={(value) =>
                updateQuery({ cause: value && isValidPriceOutlierCause(value) ? value : null })
              }
              label={translate("Likely cause", "السبب المحتمل")}
              data={[
                { value: "all", label: translate("All causes", "كل الأسباب") },
                ...PRICE_OUTLIER_CAUSE_VALUES.map((value) => ({
                  value,
                  label: getPriceOutlierCauseLabel(value, locale),
                })),
              ]}
              allowDeselect={false}
              radius="md"
            />
          </div>
        </div>
      </section>

      {isFetching && !data ? (
        <ReportSkeleton />
      ) : errorMessage ? (
        <ErrorSection
          errorTitle={translate("Error loading report", "خطأ في تحميل التقرير")}
          errorMessage={errorMessage}
          button={{ text: translate("Try again", "حاول مرة أخرى"), onClick: () => refetch() }}
        />
      ) : data ? (
        <div className="space-y-6">
          <PriceOutliersOverview summary={data.summary} />
          <PriceOutliersTable data={visibleRows} emptyMessage={emptyMessage} />
        </div>
      ) : null}
    </div>
  );
}
