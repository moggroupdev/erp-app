"use client";

import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import usePrivateRequest from "@/hooks/use-private-request";
import dashboardApi from "@/lib/api/dashboard";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import LayoutBox from "@/components/ui/layout-box";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import RefetchButton from "@/components/ui/refetch-button";
import QuickStats from "./components/quick-stats";

const PAGE_TITLE = { en: "Dashboard", ar: "لوحة التحكم" };

const PAGE_SUBTITLE = {
  en: "A snapshot of customers, stock, and material purchasing.",
  ar: "لمحة عن العملاء والمخزون ومشتريات الخامات.",
};

export default function Page() {
  const { locale, translate } = useI18n();
  const privateRequest = usePrivateRequest();

  useDocumentTitle(translate(PAGE_TITLE.en, PAGE_TITLE.ar), "dashboard");

  const { data, isFetching, error, refetch } = useQuery({
    queryKey: queryKeys.dashboard.quickStats(),
    queryFn: ({ signal }) => dashboardApi.getQuickStats({ privateRequest, signal }),
    staleTime: staleTimes.dashboard.quickStats,
  });

  const errorMessage = error ? getErrorMessage(locale, error) : "";

  return (
    <LayoutBox
      header={{
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        subTitle: translate(PAGE_SUBTITLE.en, PAGE_SUBTITLE.ar),
        sideElements: <RefetchButton isFetching={isFetching} onRefetch={() => refetch()} />,
      }}
    >
      {isFetching ? (
        <LoadingSection />
      ) : errorMessage ? (
        <ErrorSection
          errorTitle={translate("Error loading dashboard", "خطأ في تحميل لوحة التحكم")}
          errorMessage={errorMessage}
          button={{ text: translate("Try again", "حاول مرة أخرى"), onClick: () => refetch() }}
        />
      ) : (
        data && <QuickStats stats={data} />
      )}
    </LayoutBox>
  );
}
