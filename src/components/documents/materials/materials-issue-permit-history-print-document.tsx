import { useI18n } from "@/lib/i18n/hooks";
import { PrintDetail, PrintSectionHeading, PrintTable } from "../components";
import { formatDate, formatDateAndTime } from "@/lib/helpers/date-formaters";
import { formatQuantity } from "@/lib/helpers/format-quantity";
import { getMaterialUnitLabel, type MaterialUnit } from "@/lib/constants/enums/material-units";
import {
  getProductionSubDepartmentLabel,
  isValidProductionSubDepartment,
} from "@/lib/constants/enums/production-sub-departments";
import { LEGACY_ISSUE_PERMIT_WORK_ORDER_TYPES } from "@/lib/constants/enums/legacy-issue-permit-work-order-types";
import type {
  MaterialsIssuePermitHistoryEntry,
  MaterialsIssuePermitHistorySummary,
} from "@/types/reports";

type PrintEntry = MaterialsIssuePermitHistoryEntry & {
  displayQuantity: number | null;
  displayUnit: MaterialUnit;
};

export default function MaterialsIssuePermitHistoryPrintDocument({
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
  summary: MaterialsIssuePermitHistorySummary;
  entries: PrintEntry[];
}) {
  const { locale, translate } = useI18n();
  const logoSrc = typeof window !== "undefined" ? `${window.location.origin}/images/logo.png` : "/images/logo.png";
  const printedAt = formatDateAndTime(new Date(), locale);
  const unitLabel = getMaterialUnitLabel(displayUnit, locale);

  const sortedEntries = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="flex flex-col gap-8 text-xs text-gray-900">
      <header className="flex items-start justify-between gap-4 border-b border-gray-300 pb-4">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-[10px] font-medium tracking-wide text-gray-500 uppercase">
            {translate("Inventory Report", "تقرير المخزون")} - {title}
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
        <PrintDetail label={translate("Lines", "البنود")} value={String(summary.lineCount)} />
        <PrintDetail label={translate("Permits", "الأذونات")} value={String(summary.permitCount)} />
        <PrintDetail
          label={translate(`Issued Qty (${unitLabel})`, `الكمية المصروفة (${unitLabel})`)}
          value={formatQuantity(summary.issuedQuantity)}
        />
        <PrintDetail
          label={translate(`Cancelled Qty (${unitLabel})`, `الكمية الملغاة (${unitLabel})`)}
          value={formatQuantity(summary.cancelledQuantity)}
        />
      </section>

      <hr className="border-gray-300" />

      <section className="flex flex-col gap-2.5">
        <PrintSectionHeading
          title={translate("Issue Permit History", "سجل أذونات الصرف")}
          subtitle={translate(
            "Individual issue permit lines for this material (newest first).",
            "بنود أذونات الصرف الفردية لهذه المادة (الأحدث أولاً).",
          )}
        />
        <PrintTable
          headers={[
            "#",
            translate("Permit Number", "رقم الإذن"),
            translate("Date", "التاريخ"),
            translate("Sub-department", "القسم الفرعي"),
            translate("Editor", "المحرر"),
            translate("Reference", "المرجع"),
            translate("Unit of Measurement", "وحدة القياس"),
            translate("Qty", "الكمية"),
            translate("Notes", "ملاحظات"),
          ]}
          rows={sortedEntries.map((row, index) => {
            const departmentLabel =
              row.productionSubDepartment && isValidProductionSubDepartment(row.productionSubDepartment)
                ? getProductionSubDepartmentLabel(row.productionSubDepartment, locale)
                : row.productionSubDepartment || translate("Unassigned", "غير محدد");
            const quantity = row.displayQuantity != null ? row.displayQuantity : row.quantity;
            const rowUnitLabel = getMaterialUnitLabel(row.displayUnit, locale);
            const reference =
              row.workOrderNumberType === LEGACY_ISSUE_PERMIT_WORK_ORDER_TYPES.BASE_CONTRACT
                ? row.contractNumber
                : row.workOrderNumber;
            const permitNumber = row.isCancelled
              ? `${row.issuePermitNumber} (${translate("Cancelled", "ملغي")})`
              : row.issuePermitNumber;

            return [
              String(index + 1),
              permitNumber,
              formatDate(row.date, locale),
              departmentLabel,
              row.creatorName,
              reference || "-",
              rowUnitLabel,
              quantity != null ? formatQuantity(quantity) : "-",
              row.notes?.trim() || "-",
            ];
          })}
          monoColumnIndexes={[1, 5]}
          emptyLabel={translate("No data available", "لا توجد بيانات")}
        />
      </section>
    </div>
  );
}
