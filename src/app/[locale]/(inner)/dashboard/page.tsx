"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import usePrivateRequest from "@/hooks/use-private-request";
import dashboardApi from "@/lib/api/dashboard";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import type { DashboardPeriod } from "@/types/reports";
import ErrorSection from "@/components/ui/sections/error";
import RefetchButton from "@/components/ui/refetch-button";
import ReportPageHeader from "@/components/ui/report-page-header";
import PeriodSwitch from "./components/period-switch";
import QuickStats from "./components/quick-stats";
import DashboardSkeleton from "./components/dashboard-skeleton";

const PAGE_TITLE = { en: "Dashboard", ar: "لوحة التحكم" };

const PAGE_SUBTITLE = {
  en: "Activity for the last week, the last month, and overall.",
  ar: "النشاط خلال الأسبوع الماضي والشهر الماضي والإجمالي.",
};

export default function Page() {
  const { locale, translate } = useI18n();
  const privateRequest = usePrivateRequest();
  const [period, setPeriod] = useState<DashboardPeriod>("month");

  useDocumentTitle(translate(PAGE_TITLE.en, PAGE_TITLE.ar), "dashboard");

  const { data, isFetching, error, refetch } = useQuery({
    queryKey: queryKeys.dashboard.quickStats(),
    queryFn: ({ signal }) => dashboardApi.getQuickStats({ privateRequest, signal }),
    staleTime: staleTimes.dashboard.quickStats,
  });

  const errorMessage = error ? getErrorMessage(locale, error) : "";

  return (
    <div className="space-y-6">
      <ReportPageHeader
        breadcrumbs={[{ label: PAGE_TITLE }]}
        icon={LayoutDashboard}
        title={translate(PAGE_TITLE.en, PAGE_TITLE.ar)}
        subtitle={translate(PAGE_SUBTITLE.en, PAGE_SUBTITLE.ar)}
        sideElement={
          <div className="flex flex-wrap items-center gap-3">
            <PeriodSwitch period={period} onChange={setPeriod} />
            <RefetchButton variant="light" isFetching={isFetching} onRefetch={() => refetch()} />
          </div>
        }
      />

      {!data ? (
        errorMessage ? (
          <ErrorSection
            errorTitle={translate("Error loading dashboard", "خطأ في تحميل لوحة التحكم")}
            errorMessage={errorMessage}
            button={{ text: translate("Try again", "حاول مرة أخرى"), onClick: () => refetch() }}
          />
        ) : (
          <DashboardSkeleton />
        )
      ) : (
        <div className={isFetching ? "opacity-70" : undefined}>
          <QuickStats stats={data} period={period} />
        </div>
      )}
    </div>
  );
}
