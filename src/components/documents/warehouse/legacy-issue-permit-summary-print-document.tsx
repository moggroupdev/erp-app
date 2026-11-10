import { useI18n } from "@/lib/i18n/hooks";
import { PrintDetail, PrintSectionHeading, PrintTable } from "../components";
import { formatDate, formatDateAndTime } from "@/lib/helpers/date-formaters";
import { formatBaseQuantityForDisplay } from "@/lib/helpers/format-quantity";
import { getLegacyIssuePermitTypeLabel } from "@/lib/constants/enums/legacy-issue-permit-types";
import { getLegacyIssuePermitMaintenanceOrderTypeLabel } from "@/lib/constants/enums/legacy-issue-permit-maintenance-order-types";
import { getMaterialUnitLabel } from "@/lib/constants/enums/material-units";
import { getProductionSubDepartmentLabel } from "@/lib/constants/enums/production-sub-departments";
import type { LegacyIssuePermitSummary } from "@/types/reports";

export default function LegacyIssuePermitSummaryPrintDocument({
  title,
  data,
}: {
  title: string;
  data: LegacyIssuePermitSummary;
}) {
  const { locale, translate } = useI18n();
  const logoSrc = typeof window !== "undefined" ? `${window.location.origin}/images/logo.png` : "/images/logo.png";
  const printedAt = formatDateAndTime(new Date(), locale);
  const { overview } = data;

  const dateSpan =
    overview.minDate && overview.maxDate
      ? `${formatDate(overview.minDate, locale)} - ${formatDate(overview.maxDate, locale)}`
      : translate("No permits", "لا توجد أذونات");

  return (
    <div className="flex flex-col gap-5 text-xs text-gray-900">
      <header className="flex items-start justify-between gap-4 border-b border-gray-300 pb-4">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-[10px] font-medium tracking-wide text-gray-500 uppercase">
            {translate("Warehouse Report", "تقرير المخازن")}
          </p>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-[10px] text-gray-500">{printedAt}</p>
        </div>
        <img src={logoSrc} alt="" width={60} height={60} className="h-[60px] w-[60px] shrink-0 rounded object-contain" />
      </header>

      <section className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs sm:grid-cols-3">
        <PrintDetail label={translate("Total Permits", "إجمالي الأذونات")} value={overview.permitCount} />
        <PrintDetail label={translate("Active", "نشطة")} value={overview.activePermitCount} />
        <PrintDetail label={translate("Cancelled", "ملغاة")} value={overview.cancelledPermitCount} />
        <PrintDetail label={translate("Line Items", "بنود الأذونات")} value={overview.itemCount} />
        <PrintDetail label={translate("Material Lines", "بنود المواد")} value={overview.materialLineCount} />
        <PrintDetail label={translate("Note-only Lines", "بنود ملاحظات فقط")} value={overview.noteOnlyLineCount} />
        <PrintDetail label={translate("Empty Permits", "أذونات فارغة")} value={overview.emptyPermitCount} />
        <PrintDetail label={translate("With Issue Order", "بأمر صرف")} value={overview.permitsWithIssueOrder} />
        <PrintDetail
          label={translate("Multiple Customers", "عدة عملاء")}
          value={overview.multipleCustomerPermitCount}
        />
        <PrintDetail label={translate("Distinct Materials", "مواد مميزة")} value={overview.distinctMaterialCount} />
        <PrintDetail label={translate("Distinct Customers", "عملاء مميزون")} value={overview.distinctCustomerCount} />
        <PrintDetail label={translate("Distinct Creators", "منشئون مميزون")} value={overview.distinctCreatorCount} />
        <PrintDetail label={translate("Header Notes", "ملاحظات الرأس")} value={overview.headerNoteCount} />
        <PrintDetail label={translate("Line Notes", "ملاحظات البنود")} value={overview.lineNoteCount} />
        <PrintDetail label={translate("Date Span", "نطاق التواريخ")} value={dateSpan} />
      </section>

      <section>
        <PrintSectionHeading title={translate("By Permit Type", "حسب نوع الإذن")} />
        <PrintTable
          emptyLabel={translate("No data available", "لا توجد بيانات")}
          headers={[
            translate("Type", "النوع"),
            translate("Permits", "الأذونات"),
            translate("Cancelled", "ملغاة"),
            translate("Items", "البنود"),
            translate("Header Notes", "ملاحظات الرأس"),
          ]}
          rows={data.byPermitType
            .filter((row) => row.permitCount > 0)
            .map((row) => [
              getLegacyIssuePermitTypeLabel(row.permitType, locale),
              row.permitCount,
              row.cancelledCount,
              row.itemCount,
              row.headerNoteCount,
            ])}
        />
      </section>

      <section>
        <PrintSectionHeading title={translate("By Production Sub-Department", "حسب قسم الإنتاج الفرعي")} />
        <PrintTable
          emptyLabel={translate("No data available", "لا توجد بيانات")}
          headers={[
            translate("Department", "القسم"),
            translate("Permits", "الأذونات"),
            translate("Cancelled", "ملغاة"),
            translate("Items", "البنود"),
          ]}
          rows={data.byProductionSubDepartment
            .filter((row) => row.permitCount > 0)
            .map((row) => [
              row.productionSubDepartment
                ? getProductionSubDepartmentLabel(row.productionSubDepartment, locale)
                : translate("No department", "بدون قسم"),
              row.permitCount,
              row.cancelledCount,
              row.itemCount,
            ])}
        />
      </section>

      <section>
        <PrintSectionHeading title={translate("By Maintenance Order Type", "حسب نوع أمر الصيانة")} />
        <PrintTable
          emptyLabel={translate("No data available", "لا توجد بيانات")}
          headers={[
            translate("Type", "النوع"),
            translate("Permits", "الأذونات"),
            translate("Cancelled", "ملغاة"),
            translate("Items", "البنود"),
          ]}
          rows={data.byMaintenanceOrderType
            .filter((row) => row.permitCount > 0)
            .map((row) => [
              row.maintenanceOrderType
                ? getLegacyIssuePermitMaintenanceOrderTypeLabel(row.maintenanceOrderType, locale)
                : translate("Missing type", "نوع مفقود"),
              row.permitCount,
              row.cancelledCount,
              row.itemCount,
            ])}
        />
      </section>

      <section>
        <PrintSectionHeading title={translate("Top Materials", "أعلى المواد")} />
        <PrintTable
          emptyLabel={translate("No data available", "لا توجد بيانات")}
          headers={[
            translate("Material", "المادة"),
            translate("Code", "الكود"),
            translate("Unit", "الوحدة"),
            translate("Lines", "البنود"),
            translate("Issued Qty", "الكمية المصروفة"),
            translate("Cancelled Qty", "الكمية الملغاة"),
          ]}
          rows={data.topMaterials.map((row) => [
            row.materialTitle,
            row.materialCode,
            getMaterialUnitLabel(row.unitOfMeasurement, locale),
            row.lineCount,
            formatBaseQuantityForDisplay(row.issuedQuantityInBase, 1),
            formatBaseQuantityForDisplay(row.cancelledQuantityInBase, 1),
          ])}
        />
      </section>

      <section>
        <PrintSectionHeading title={translate("Top Customers", "أعلى العملاء")} />
        <PrintTable
          emptyLabel={translate("No data available", "لا توجد بيانات")}
          headers={[translate("Customer", "العميل"), translate("Permits", "الأذونات")]}
          rows={data.topCustomers.map((row) => [row.customerName, row.permitCount])}
        />
      </section>

      <section>
        <PrintSectionHeading title={translate("Top Creators", "أعلى المنشئين")} />
        <PrintTable
          emptyLabel={translate("No data available", "لا توجد بيانات")}
          headers={[translate("Creator", "المنشئ"), translate("Permits", "الأذونات")]}
          rows={data.topCreators.map((row) => [row.creatorName, row.permitCount])}
        />
      </section>

      <section>
        <PrintSectionHeading title={translate("Data Quality Notes", "ملاحظات جودة البيانات")} />
        <PrintTable
          emptyLabel={translate("No data available", "لا توجد بيانات")}
          headers={[translate("Note", "الملاحظة"), translate("Count", "العدد")]}
          rows={data.dataQuality.map((row) => [
            locale === "ar" ? row.caption.ar : row.caption.en,
            row.count,
          ])}
        />
      </section>

      <section>
        <PrintSectionHeading title={translate("Recent Header Notes", "أحدث ملاحظات الرأس")} />
        <PrintTable
          emptyLabel={translate("No notes available", "لا توجد ملاحظات")}
          headers={[
            translate("Permit", "الإذن"),
            translate("Date", "التاريخ"),
            translate("Type", "النوع"),
            translate("Notes", "الملاحظات"),
          ]}
          rows={data.headerNotes.map((row) => [
            row.issuePermitNumber,
            formatDate(row.date, locale),
            getLegacyIssuePermitTypeLabel(row.permitType, locale),
            row.notes,
          ])}
        />
      </section>

      <section>
        <PrintSectionHeading title={translate("Recent Line Notes", "أحدث ملاحظات البنود")} />
        <PrintTable
          emptyLabel={translate("No notes available", "لا توجد ملاحظات")}
          headers={[
            translate("Permit", "الإذن"),
            translate("Date", "التاريخ"),
            translate("Material", "المادة"),
            translate("Notes", "الملاحظات"),
          ]}
          rows={data.lineNotes.map((row) => [
            row.issuePermitNumber,
            formatDate(row.date, locale),
            row.materialCode ?? translate("Note only", "ملاحظة فقط"),
            row.notes,
          ])}
        />
      </section>
    </div>
  );
}
