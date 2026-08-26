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
import { FileDiff, RefreshCw } from "lucide-react";
import ErrorSection from "@/components/ui/sections/error";
import ReportPageHeader from "@/components/ui/report-page-header";
import ReportSkeleton from "../components/report-skeleton";
import DateRangeFilter from "../components/date-range-filter";
import MismatchesOverview from "./components/mismatches-overview";
import MismatchesTable from "./components/mismatches-table";

const PAGE_TITLE = {
  en: "Total Amount Mismatches",
  ar: "فروقات الإجمالي",
};

const PAGE_SUBTITLE = {
  en: "Orders where the calculated total amount differs from the legacy invoice total purchases by at least 1%.",
  ar: "أوامر التوريد التي يختلف فيها الإجمالي المحسوب عن إجمالي مشتريات الفاتورة القديمة بنسبة 1% على الأقل.",
};

export default function Page() {
  const { locale, translate } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const privateRequest = usePrivateRequest();

  useDocumentTitle(translate(PAGE_TITLE.en, PAGE_TITLE.ar), "dashboard");

  const from = searchParams.get("from");
  const to = searchParams.get("to");

  function updateQuery(patch: { from?: string | null; to?: string | null }) {
    const params = new URLSearchParams(searchParams.toString());

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
    queryKey: queryKeys.reports.purchasingMaterials.totalAmountMismatches(filters),
    queryFn: ({ signal }) =>
      reportsApi.purchasingMaterials.getTotalAmountMismatches({ privateRequest, ...filters, signal }),
    staleTime: staleTimes.reports.purchasingMaterialsTotalAmountMismatches,
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
        icon={FileDiff}
        title={reportTitle}
        subtitle={translate(PAGE_SUBTITLE.en, PAGE_SUBTITLE.ar)}
        sideElement={
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-stone-600 transition hover:bg-stone-50 disabled:opacity-50"
            title={translate("Refresh", "تحديث")}
          >
            <RefreshCw size={14} className={isFetching ? "animate-spin" : undefined} />
          </button>
        }
      />

      <DateRangeFilter
        from={from}
        to={to}
        onFromChange={(value) => updateQuery({ from: value })}
        onToChange={(value) => updateQuery({ to: value })}
      />

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
          <MismatchesOverview overview={data.overview} />
          <MismatchesTable data={data.orders} />
        </div>
      ) : null}
    </div>
  );
}
