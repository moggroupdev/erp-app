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
  getAveragePriceGapCauseLabel,
  isValidAveragePriceGapCause,
  AVERAGE_PRICE_GAP_CAUSE_VALUES,
  type AveragePriceGapCause,
} from "@/lib/constants/enums/derived/average-price-gap-causes";
import { Scale } from "lucide-react";
import ErrorSection from "@/components/ui/sections/error";
import RefetchButton from "@/components/ui/refetch-button";
import PrintDocument from "@/components/ui/print-document";
import ReportPageHeader from "@/components/ui/report-page-header";
import PurchasingMaterialsAveragePriceGapsPrintDocument from "@/components/documents/procurement/reports/purchasing-materials-average-price-gaps-print-document";
import { formatDate } from "@/lib/helpers/date-formaters";
import ReportSkeleton from "../components/report-skeleton";
import DateRangeFilter from "../components/date-range-filter";
import AveragePriceGapsOverview from "./components/average-price-gaps-overview";
import AveragePriceGapsTable from "./components/average-price-gaps-table";

const PAGE_TITLE = {
  en: "Average Price Gaps",
  ar: "فروقات السعر المتوسط",
};

const PAGE_SUBTITLE = {
  en: "Find materials whose stored average price differs sharply from their quantity-weighted purchase price.",
  ar: "اكتشاف المواد التي يختلف سعرها المتوسط المخزن بشكل حاد عن متوسط أسعار الشراء المرجح بالكمية.",
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
  const cause = rawCause && isValidAveragePriceGapCause(rawCause) ? rawCause : null;

  function updateQuery(patch: {
    from?: string | null;
    to?: string | null;
    threshold?: number | null;
    cause?: AveragePriceGapCause | null;
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
    queryKey: queryKeys.reports.purchasingMaterials.averagePriceGaps(filters),
    queryFn: ({ signal }) => reportsApi.purchasingMaterials.getAveragePriceGaps({ privateRequest, ...filters, signal }),
    staleTime: staleTimes.reports.purchasingMaterialsAveragePriceGaps,
  });

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
  const printTitle = `${translate("Report", "تقرير")} - ${reportTitle} - ${printDateSuffix}`;

  const visibleRows = useMemo(() => {
    if (!data) return [];
    if (!cause) return data.rows;
    return data.rows.filter((row) => row.cause === cause);
  }, [data, cause]);

  const emptyMessage = cause
    ? translate("No gaps match the selected cause.", "لا توجد فروقات تطابق السبب المحدد.")
    : translate("No average price gaps found for this period.", "لا توجد فروقات في السعر المتوسط في هذه الفترة.");

  return (
    <div className="space-y-6">
      <ReportPageHeader
        breadcrumbs={[
          { label: { en: "Dashboard", ar: "الرئيسية" }, href: "/dashboard" },
          { label: { en: "Reports", ar: "التقارير" }, href: "/reports" },
          { label: { en: "Purchases", ar: "المشتريات" }, href: "/reports/purchasing-materials" },
          { label: PAGE_TITLE },
        ]}
        icon={Scale}
        title={reportTitle}
        subtitle={translate(PAGE_SUBTITLE.en, PAGE_SUBTITLE.ar)}
        sideElement={
          <div className="flex items-center gap-3 sm:gap-4">
            <RefetchButton isFetching={isFetching} onRefetch={() => refetch()} />
            {data && !isFetching && !errorMessage && (
              <PrintDocument title={printTitle} buttonType="icon" paperWidth={297} paperHeight={210}>
                <PurchasingMaterialsAveragePriceGapsPrintDocument
                  title={reportTitle}
                  startDate={from}
                  endDate={to}
                  threshold={threshold}
                  cause={cause}
                  summary={data.summary}
                  rows={visibleRows}
                />
              </PrintDocument>
            )}
          </div>
        }
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
                "Flag a material when its stored average price is at least this many times the weighted purchase price (or the inverse).",
                "علم المادة عندما يكون سعرها المتوسط المخزن على الأقل هذا المضاعف لمتوسط أسعار الشراء المرجح (أو عكسه).",
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
              onChange={(value) => updateQuery({ cause: value && isValidAveragePriceGapCause(value) ? value : null })}
              label={translate("Likely cause", "السبب")}
              data={[
                { value: "all", label: translate("All causes", "كل الأسباب") },
                ...AVERAGE_PRICE_GAP_CAUSE_VALUES.map((value) => ({
                  value,
                  label: getAveragePriceGapCauseLabel(value, locale),
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
          <AveragePriceGapsOverview summary={data.summary} />
          <AveragePriceGapsTable data={visibleRows} emptyMessage={emptyMessage} />
        </div>
      ) : null}
    </div>
  );
}
