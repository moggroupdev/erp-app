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
import { History, RefreshCw } from "lucide-react";
import ErrorSection from "@/components/ui/sections/error";
import ReportPageHeader from "@/components/ui/report-page-header";
import ReportSkeleton from "../components/report-skeleton";
import MaterialPicker from "./components/material-picker";
import PriceHistoryEmpty from "./components/price-history-empty";
import PriceChart from "./components/price-chart";
import PriceEntriesTable from "./components/price-entries-table";
import PriceSummary from "./components/price-summary";

const PAGE_TITLE = { en: "Material Price History", ar: "تاريخ أسعار المادة" };

const PAGE_SUBTITLE = {
  en: "Track unit price changes for a specific material over time across purchase orders.",
  ar: "تتبع تغيرات سعر الوحدة لمادة محددة عبر أوامر الشراء بمرور الوقت.",
};

export default function Page() {
  const { locale, translate } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const privateRequest = usePrivateRequest();

  useDocumentTitle(translate(PAGE_TITLE.en, PAGE_TITLE.ar), "dashboard");

  const materialCode = searchParams.get("materialCode");

  function setMaterialCode(next: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set("materialCode", next);
    else params.delete("materialCode");
    const query = params.toString();
    router.replace(query ? `?${query}` : "?", { scroll: false });
  }

  const { data, isFetching, error, refetch } = useQuery({
    queryKey: queryKeys.reports.purchasingMaterials.priceHistory(materialCode ?? ""),
    queryFn: ({ signal }) =>
      reportsApi.purchasingMaterials.getPriceHistory({
        privateRequest,
        materialCode: materialCode!,
        signal,
      }),
    staleTime: staleTimes.reports.purchasingMaterialsPriceHistory,
    enabled: Boolean(materialCode),
  });

  const errorMessage = error ? getErrorMessage(locale, error) : "";

  return (
    <div className="space-y-6">
      <ReportPageHeader
        breadcrumbs={[
          { label: { en: "Dashboard", ar: "الرئيسية" }, href: "/dashboard" },
          { label: { en: "Reports", ar: "التقارير" }, href: "/reports" },
          { label: { en: "Purchasing Materials", ar: "شراء المواد" }, href: "/reports/purchasing-materials" },
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

      <MaterialPicker value={materialCode} onChange={setMaterialCode} />

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
          data && (
            <div className="flex flex-col gap-6">
              <PriceSummary summary={data.summary} />
              <PriceChart data={data.entries} />
              <PriceEntriesTable data={data.entries} />
            </div>
          )
        )}
      </main>
    </div>
  );
}
