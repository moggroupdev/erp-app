"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import usePrivateRequest from "@/hooks/use-private-request";
import auditLogsApi from "@/lib/api/audit-logs";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import LayoutBox from "@/components/ui/layout-box";
import RefetchButton from "@/components/ui/refetch-button";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import AuditLogDetails from "./components/audit-log-details";
import SnapshotDiffTable from "./components/snapshot-diff-table";
import SnapshotJsonSection from "./components/snapshot-json-section";

const PAGE_TITLE = { en: "Audit Log Details", ar: "تفاصيل سجل التدقيق" };

export default function Page() {
  const { locale, translate } = useI18n();
  const { id } = useParams<{ id: string }>();
  const privateRequest = usePrivateRequest();

  const {
    data: log,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.auditLogs.detail(id),
    queryFn: ({ signal }) => auditLogsApi.get({ privateRequest, id, signal }),
    staleTime: staleTimes.auditLogs,
  });

  const errorMessage = error ? getErrorMessage(locale, error) : "";

  useDocumentTitle(`${translate(PAGE_TITLE.en, PAGE_TITLE.ar)} | ${translate("Audit Logs", "سجلات التدقيق")}`);

  return (
    <LayoutBox
      header={{
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        backLink: true,
        sideElements: <RefetchButton isFetching={isFetching} onRefetch={() => refetch()} />,
      }}
    >
      {isFetching ? (
        <LoadingSection message={translate("Loading audit log...", "جاري تحميل سجل التدقيق...")} />
      ) : errorMessage ? (
        <ErrorSection
          errorTitle={translate("Error loading audit log", "خطأ في تحميل سجل التدقيق")}
          errorMessage={errorMessage}
          button={{ text: translate("Try again", "حاول مرة أخرى"), onClick: () => refetch() }}
        />
      ) : (
        log && (
          <div className="flex flex-col gap-6">
            <AuditLogDetails log={log} />
            <SnapshotDiffTable log={log} />
            <div className="flex flex-col gap-4">
              <h4 className="text-lg font-semibold text-gray-900">{translate("Full snapshots", "اللقطات الكاملة")}</h4>
              <SnapshotJsonSection title={translate("Before Change", "قبل التغيير")} snapshot={log.oldRow} />
              <SnapshotJsonSection title={translate("After Change", "بعد التغيير")} snapshot={log.newRow} />
            </div>
          </div>
        )
      )}
    </LayoutBox>
  );
}
