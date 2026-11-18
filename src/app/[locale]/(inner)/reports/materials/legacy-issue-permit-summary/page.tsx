"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import usePrivateRequest from "@/hooks/use-private-request";
import reportsApi from "@/lib/api/reports";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import { formatDate } from "@/lib/helpers/date-formaters";
import type { MaterialUnit } from "@/lib/constants/enums/material-units";
import ErrorSection from "@/components/ui/sections/error";
import RefetchButton from "@/components/ui/refetch-button";
import PrintDocument from "@/components/ui/print-document";
import ReportPageHeader from "@/components/ui/report-page-header";
import DateRangeFilter from "../../purchasing-materials/components/date-range-filter";
import LegacyIssuePermitSummaryPrintDocument from "@/components/documents/warehouse/legacy-issue-permit-summary-print-document";
import OverviewStats from "./components/overview-stats";
import ReportSkeleton from "./components/report-skeleton";
import MonthlyChart from "./components/monthly-chart";
import {
  ByMaintenanceOrderTypeTable,
  ByPermitTypeTable,
  ByProductionSubDepartmentTable,
} from "./components/breakdown-tables";
import { TopCreatorsTable, TopCustomersTable, TopMaterialsTable } from "./components/top-tables";
import DataQualityNotes from "./components/data-quality-notes";
import { HeaderNotesTable, LineNotesTable } from "./components/notes-tables";

const PAGE_TITLE = {
  en: "Legacy Issue Permit Summary",
  ar: "ملخص أذونات الصرف المرحلية",
};

const PAGE_SUBTITLE = {
  en: "Permit-wide volume, breakdowns, data-quality gaps, and recent notes across legacy issue permits.",
  ar: "حجم أذونات الصرف المرحلية وتفصيلاتها وفجوات جودة البيانات وأحدث الملاحظات.",
};

export default function Page() {
  const { locale, translate } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const privateRequest = usePrivateRequest();

  useDocumentTitle(translate(PAGE_TITLE.en, PAGE_TITLE.ar), "dashboard");

  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const [displayUnit, setDisplayUnit] = useState<MaterialUnit | null>(null);

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
    queryKey: queryKeys.reports.materials.legacyIssuePermitSummary(filters),
    queryFn: ({ signal }) =>
      reportsApi.materials.getLegacyIssuePermitSummary({ privateRequest, ...filters, signal }),
    staleTime: staleTimes.reports.materialsLegacyIssuePermitSummary,
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

  return (
    <div className="space-y-6">
      <ReportPageHeader
        breadcrumbs={[
          { label: { en: "Dashboard", ar: "الرئيسية" }, href: "/dashboard" },
          { label: { en: "Reports", ar: "التقارير" }, href: "/reports" },
          { label: { en: "Inventory Reports", ar: "تقارير المخزون" }, href: "/reports/materials" },
          { label: PAGE_TITLE },
        ]}
        icon={History}
        title={reportTitle}
        subtitle={translate(PAGE_SUBTITLE.en, PAGE_SUBTITLE.ar)}
        sideElement={
          <div className="flex items-center gap-3 sm:gap-4">
            <RefetchButton isFetching={isFetching} onRefetch={() => refetch()} />
            {data && !isFetching && !errorMessage && (
              <PrintDocument title={printTitle} buttonType="icon" paperWidth={210} paperHeight={297}>
                <LegacyIssuePermitSummaryPrintDocument title={reportTitle} data={data} />
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

      <main>
        {isFetching ? (
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
              <OverviewStats overview={data.overview} />
              <MonthlyChart data={data.byMonth} />
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                <ByPermitTypeTable data={data.byPermitType} />
                <ByMaintenanceOrderTypeTable data={data.byMaintenanceOrderType} />
              </div>
              <ByProductionSubDepartmentTable data={data.byProductionSubDepartment} />
              <TopMaterialsTable
                data={data.topMaterials}
                displayUnit={displayUnit}
                onDisplayUnitChange={setDisplayUnit}
              />
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                <TopCustomersTable data={data.topCustomers} />
                <TopCreatorsTable data={data.topCreators} />
              </div>
              <DataQualityNotes data={data.dataQuality} />
              <HeaderNotesTable data={data.headerNotes} />
              <LineNotesTable data={data.lineNotes} />
            </div>
          )
        )}
      </main>
    </div>
  );
}
