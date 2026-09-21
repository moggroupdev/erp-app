"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useI18n } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import usePrivateRequest from "@/hooks/use-private-request";
import reportsApi from "@/lib/api/reports";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import {
  getProductionSubDepartmentLabel,
  isValidProductionSubDepartment,
} from "@/lib/constants/enums/production-sub-departments";
import { formatDate } from "@/lib/helpers/date-formaters";
import { ClipboardList, Printer, RefreshCw } from "lucide-react";
import ErrorSection from "@/components/ui/sections/error";
import PrintDocument from "@/components/ui/print-document";
import ReportPageHeader from "@/components/ui/report-page-header";
import PurchasingMaterialsRequisitionFollowUpPrintDocument from "@/components/documents/purchasing-materials/purchasing-materials-requisition-follow-up-print-document";
import ReportSkeleton from "../components/report-skeleton";
import DateRangeFilter from "../components/date-range-filter";
import DepartmentPicker from "./components/department-picker";
import RequisitionFollowUpEmpty from "./components/requisition-follow-up-empty";
import RequisitionFollowUpTable from "./components/requisition-follow-up-table";

const PAGE_TITLE = {
  en: "Purchase Requisition Follow-up",
  ar: "متابعة طلبات الشراء",
};

const PAGE_SUBTITLE = {
  en: "Track approved purchase requisition lines by production department: requested, ordered on POs, and received quantities with values.",
  ar: "متابعة بنود طلبات الشراء المعتمدة حسب قسم الإنتاج: الكميات المطلوبة والمطلوبة في أوامر التوريد والمستلمة مع القيم.",
};

function getCurrentMonthDateRange() {
  return {
    from: dayjs().startOf("month").format("YYYY-MM-DD"),
    to: dayjs().endOf("month").format("YYYY-MM-DD"),
  };
}

export default function Page() {
  const { locale, translate } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const privateRequest = usePrivateRequest();

  useDocumentTitle(translate(PAGE_TITLE.en, PAGE_TITLE.ar), "dashboard");

  const rawDepartment = searchParams.get("productionSubDepartment");
  const productionSubDepartment =
    rawDepartment && isValidProductionSubDepartment(rawDepartment) ? rawDepartment : null;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  function updateQuery(patch: {
    productionSubDepartment?: string | null;
    from?: string | null;
    to?: string | null;
  }) {
    const params = new URLSearchParams(searchParams.toString());

    if ("productionSubDepartment" in patch) {
      if (patch.productionSubDepartment) params.set("productionSubDepartment", patch.productionSubDepartment);
      else params.delete("productionSubDepartment");
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

  // Default to the current calendar month when a department is selected and no dates are in the URL.
  useEffect(() => {
    if (!productionSubDepartment) return;
    if (searchParams.has("from") || searchParams.has("to")) return;

    const range = getCurrentMonthDateRange();
    const params = new URLSearchParams(searchParams.toString());
    params.set("from", range.from);
    params.set("to", range.to);
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [productionSubDepartment, searchParams, router]);

  const filters = {
    from: from || undefined,
    to: to || undefined,
  };

  const { data, isFetching, error, refetch } = useQuery({
    queryKey: queryKeys.reports.purchasingMaterials.requisitionFollowUp(productionSubDepartment ?? "", filters),
    queryFn: ({ signal }) =>
      reportsApi.purchasingMaterials.getRequisitionFollowUp({
        privateRequest,
        productionSubDepartment: productionSubDepartment!,
        ...filters,
        signal,
      }),
    staleTime: staleTimes.reports.purchasingMaterialsRequisitionFollowUp,
    enabled: Boolean(productionSubDepartment),
  });

  const errorMessage = error ? getErrorMessage(locale, error) : "";
  const reportTitle = translate(PAGE_TITLE.en, PAGE_TITLE.ar);
  const printDate = new Date().toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", { dateStyle: "long" });
  const departmentLabel = productionSubDepartment
    ? getProductionSubDepartmentLabel(productionSubDepartment, locale)
    : null;
  const printDateSuffix =
    from && to
      ? translate(
          `from ${formatDate(from, locale)} to ${formatDate(to, locale)}`,
          `من ${formatDate(from, locale)} إلى ${formatDate(to, locale)}`,
        )
      : printDate;
  const printTitle = departmentLabel
    ? `${translate("Report", "تقرير")} - ${reportTitle} - ${departmentLabel} - ${printDateSuffix}`
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
          productionSubDepartment ? (
            <div className="flex items-center gap-4">
              {data && !isFetching && !errorMessage && (
                <PrintDocument
                  title={printTitle}
                  buttonType="icon"
                  paperWidth={297}
                  paperHeight={210}
                  icon={<Printer size={14} />}
                >
                  <PurchasingMaterialsRequisitionFollowUpPrintDocument
                    title={reportTitle}
                    productionSubDepartmentLabel={departmentLabel!}
                    startDate={from}
                    endDate={to}
                    items={data.items}
                    totals={data.totals}
                    missingPriceCount={data.missingPriceCount}
                  />
                </PrintDocument>
              )}
              <button
                disabled={isFetching}
                onClick={() => refetch()}
                className="rounded-md text-xs text-gray-800 hover:text-gray-800/75 disabled:opacity-50"
              >
                <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
              </button>
            </div>
          ) : undefined
        }
      />

      <DepartmentPicker
        value={productionSubDepartment}
        onChange={(value) => {
          if (!value) {
            updateQuery({ productionSubDepartment: null });
            return;
          }

          const range = getCurrentMonthDateRange();
          updateQuery({
            productionSubDepartment: value,
            ...(!searchParams.has("from") && !searchParams.has("to")
              ? { from: range.from, to: range.to }
              : {}),
          });
        }}
      />

      {productionSubDepartment ? (
        <DateRangeFilter
          from={from}
          to={to}
          onFromChange={(value) => updateQuery({ from: value })}
          onToChange={(value) => updateQuery({ to: value })}
        />
      ) : null}

      {!productionSubDepartment ? (
        <RequisitionFollowUpEmpty />
      ) : isFetching && !data ? (
        <ReportSkeleton />
      ) : errorMessage ? (
        <ErrorSection
          errorTitle={translate("Error loading report", "خطأ في تحميل التقرير")}
          errorMessage={errorMessage}
          button={{ text: translate("Try again", "حاول مرة أخرى"), onClick: () => refetch() }}
        />
      ) : data ? (
        <RequisitionFollowUpTable
          items={data.items}
          totals={data.totals}
          missingPriceCount={data.missingPriceCount}
        />
      ) : null}
    </div>
  );
}
