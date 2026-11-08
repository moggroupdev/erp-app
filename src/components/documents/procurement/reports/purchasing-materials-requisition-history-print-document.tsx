import { useI18n } from "@/lib/i18n/hooks";
import { PrintDetail, PrintSectionHeading, PrintTable } from "../../components";
import { formatDate, formatDateAndTime } from "@/lib/helpers/date-formaters";
import { formatQuantity } from "@/lib/helpers/format-quantity";
import { getMaterialUnitLabel, type MaterialUnit } from "@/lib/constants/enums/material-units";
import {
  getProductionSubDepartmentLabel,
  isValidProductionSubDepartment,
} from "@/lib/constants/enums/production-sub-departments";
import { getRequisitionStatusLabel } from "@/app/[locale]/(inner)/procurement/material-requisitions/helpers";
import type {
  PurchasingMaterialsRequisitionHistoryEntry,
  PurchasingMaterialsRequisitionHistorySummary,
} from "@/types/reports";

type PrintEntry = PurchasingMaterialsRequisitionHistoryEntry & {
  displayQuantity: number | null;
  displayUnit: MaterialUnit;
};

export default function PurchasingMaterialsRequisitionHistoryPrintDocument({
  title,
  startDate,
  endDate,
  materialTitle,
  materialCode,
  displayUnit,
  summary,
  entries,
}: {
  title: string;
  startDate?: string | null;
  endDate?: string | null;
  materialTitle: string;
  materialCode: string;
  displayUnit: MaterialUnit;
  summary: PurchasingMaterialsRequisitionHistorySummary;
  entries: PrintEntry[];
}) {
  const { locale, translate } = useI18n();
  const logoSrc = typeof window !== "undefined" ? `${window.location.origin}/images/logo.png` : "/images/logo.png";
  const printedAt = formatDateAndTime(new Date(), locale);
  const unitLabel = getMaterialUnitLabel(displayUnit, locale);

  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="flex flex-col gap-8 text-xs text-gray-900">
      <header className="flex items-start justify-between gap-4 border-b border-gray-300 pb-4">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-[10px] font-medium tracking-wide text-gray-500 uppercase">
            {translate("Purchases Report", "تقرير المشتريات")} - {title}
          </p>
          <h1 className="text-2xl font-semibold">{materialTitle}</h1>
          <p className="text-[10px] text-gray-500">
            <span className="font-medium text-gray-600">{translate("Printing date", "تاريخ الطباعة")}:</span> {printedAt}
          </p>
        </div>
        <img src={logoSrc} alt="" width={60} height={60} className="h-[60px] w-[60px] shrink-0 rounded object-contain" />
      </header>

      <section className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs sm:grid-cols-4">
        <PrintDetail label={translate("Material Code", "كود الصنف")} value={materialCode} mono />
        <PrintDetail label={translate("Unit of Measurement", "وحدة القياس")} value={unitLabel} />
        <PrintDetail
          label={translate("Start Date", "تاريخ البداية")}
          value={startDate ? formatDate(startDate, locale) : "-"}
        />
        <PrintDetail label={translate("End Date", "تاريخ النهاية")} value={endDate ? formatDate(endDate, locale) : "-"} />
      </section>

      <hr className="border-gray-300" />

      <section className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs sm:grid-cols-4">
        <PrintDetail label={translate("Requisitions", "الطلبات")} value={String(summary.requisitionCount)} />
        <PrintDetail
          label={translate(`Total Qty (${unitLabel})`, `إجمالي الكمية (${unitLabel})`)}
          value={formatQuantity(summary.totalQuantity)}
        />
        <PrintDetail
          label={translate(`Approved Qty (${unitLabel})`, `الكمية المعتمدة (${unitLabel})`)}
          value={formatQuantity(summary.approvedQuantity)}
        />
        <PrintDetail
          label={translate(`Pending Qty (${unitLabel})`, `الكمية قيد الانتظار (${unitLabel})`)}
          value={formatQuantity(summary.pendingQuantity)}
        />
      </section>

      <hr className="border-gray-300" />

      <section className="flex flex-col gap-2.5">
        <PrintSectionHeading
          title={translate("Requisition History", "سجل طلبات الشراء")}
          subtitle={translate(
            "Individual purchase requisition lines for this material (newest first).",
            "بنود طلبات الشراء الفردية لهذه المادة (الأحدث أولاً).",
          )}
        />
        <PrintTable
          headers={[
            "#",
            translate("MPReq Number", "رقم طلب الشراء"),
            translate("Date", "التاريخ"),
            translate("Sub-department", "القسم الفرعي"),
            translate("Editor", "المحرر"),
            translate("Unit of Measurement", "وحدة القياس"),
            translate("Qty", "الكمية"),
            translate("Status", "الحالة"),
            translate("Notes", "ملاحظات"),
          ]}
          rows={sortedEntries.map((row, index) => {
            const status = getRequisitionStatusLabel(row.status, translate);
            const departmentLabel = isValidProductionSubDepartment(row.productionSubDepartment)
              ? getProductionSubDepartmentLabel(row.productionSubDepartment, locale)
              : row.productionSubDepartment;
            const quantity = row.displayQuantity != null ? row.displayQuantity : row.quantityRequested;
            const rowUnitLabel = getMaterialUnitLabel(row.displayUnit, locale);

            return [
              String(index + 1),
              row.requisitionCode,
              formatDate(row.createdAt, locale),
              departmentLabel,
              row.createdByName,
              rowUnitLabel,
              formatQuantity(quantity),
              status.label,
              row.notes?.trim() || "-",
            ];
          })}
          monoColumnIndexes={[1]}
          emptyLabel={translate("No data available", "لا توجد بيانات")}
        />
      </section>
    </div>
  );
}
