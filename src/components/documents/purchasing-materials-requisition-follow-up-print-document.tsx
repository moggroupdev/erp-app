import { useI18n } from "@/lib/i18n/hooks";
import { PrintDetail, PrintSectionHeading, PrintTable } from "./components";
import { formatDate, formatDateAndTime } from "@/lib/helpers/date-formaters";
import { formatMoney } from "@/lib/helpers/format-money";
import { formatQuantity } from "@/lib/helpers/format-quantity";
import { getMaterialUnitLabel } from "@/lib/constants/enums/material-units";
import { REQUISITION_VAT_RATE } from "@/app/[locale]/(inner)/procurement/material-requisitions/helpers";
import type {
  PurchasingMaterialsRequisitionFollowUpItem,
  PurchasingMaterialsRequisitionFollowUpTotals,
} from "@/types/reports";

function formatNullableMoney(value: number | null, currency: string) {
  if (value == null) return "—";
  return formatMoney(value, currency);
}

export default function PurchasingMaterialsRequisitionFollowUpPrintDocument({
  title,
  productionSubDepartmentLabel,
  startDate,
  endDate,
  items,
  totals,
  missingPriceCount,
}: {
  title: string;
  productionSubDepartmentLabel: string;
  startDate?: string | null;
  endDate?: string | null;
  items: PurchasingMaterialsRequisitionFollowUpItem[];
  totals: PurchasingMaterialsRequisitionFollowUpTotals;
  missingPriceCount: number;
}) {
  const { locale, translate, translation } = useI18n();
  const currency = translation.currency;
  const logoSrc = typeof window !== "undefined" ? `${window.location.origin}/images/logo.png` : "/images/logo.png";
  const printedAt = formatDateAndTime(new Date(), locale);

  const vatAmount = totals.requestedValue * REQUISITION_VAT_RATE;
  const totalWithVat = totals.requestedValue + vatAmount;

  return (
    <div className="flex flex-col gap-8 text-xs text-gray-900">
      <header className="flex items-start justify-between gap-4 border-b border-gray-300 pb-4">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-[10px] font-medium tracking-wide text-gray-500 uppercase">
            {translate("Purchases Report", "تقرير المشتريات")}
          </p>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-[10px] text-gray-500">
            <span className="font-medium text-gray-600">{translate("Printing date", "تاريخ الطباعة")}:</span> {printedAt}
          </p>
        </div>
        <img src={logoSrc} alt="" width={60} height={60} className="h-[60px] w-[60px] shrink-0 rounded object-contain" />
      </header>

      <section className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs sm:grid-cols-4">
        <PrintDetail label={translate("Requesting Party", "جهة الطلب")} value={productionSubDepartmentLabel} />
        <PrintDetail
          label={translate("Start Date", "تاريخ البداية")}
          value={startDate ? formatDate(startDate, locale) : "-"}
        />
        <PrintDetail label={translate("End Date", "تاريخ النهاية")} value={endDate ? formatDate(endDate, locale) : "-"} />
      </section>

      <hr className="border-gray-300" />

      <section className="flex flex-col gap-2.5">
        <PrintSectionHeading
          title={translate("Requisition lines", "بنود طلبات الشراء")}
          subtitle={translate(
            "Approved purchase requisition lines for the selected production department.",
            "بنود طلبات الشراء المعتمدة لقسم الإنتاج المحدد.",
          )}
        />
        <PrintTable
          headers={[
            "#",
            translate("Material", "الصنف"),
            translate("Unit", "الوحدة"),
            translate("Requested", "المطلوب"),
            translate("Ordered", "تم الطلب"),
            translate("Received", "تم الاستلام"),
            translate(`Last price (${currency})`, `اخر سعر (${currency})`),
            translate(`Requested value (${currency})`, `قيمة المطلوب (${currency})`),
            translate("Requisition no.", "رقم الطلب"),
            translate("Notes", "ملاحظات"),
          ]}
          emptyLabel={translate("No data available", "لا توجد بيانات")}
          rows={items.map((row, index) => [
            String(index + 1),
            row.materialTitle,
            getMaterialUnitLabel(row.unitOfMeasurementSelected, locale),
            formatQuantity(row.quantityRequested),
            formatQuantity(row.quantityOrdered),
            formatQuantity(row.quantityReceived),
            formatNullableMoney(row.lastPurchasePrice, currency),
            <span className="font-semibold">{formatNullableMoney(row.requestedValue, currency)}</span>,
            <span className="font-mono text-[10px]">{row.requisitionCode}</span>,
            row.notes || "—",
          ])}
          footerRows={[
            [
              "",
              translate("Subtotal", "الإجمالي"),
              "",
              "",
              "",
              "",
              "",
              formatMoney(totals.requestedValue, currency),
              "",
              "",
            ],
            [
              "",
              translate("VAT (14%)", "ضريبة القيمة المضافة (14%)"),
              "",
              "",
              "",
              "",
              "",
              formatMoney(vatAmount, currency),
              "",
              "",
            ],
            [
              "",
              <span className="font-semibold">{translate("Total incl. VAT", "الإجمالي شامل الضريبة")}</span>,
              "",
              "",
              "",
              "",
              "",
              <span className="font-semibold">{formatMoney(totalWithVat, currency)}</span>,
              "",
              "",
            ],
          ]}
        />
        {missingPriceCount > 0 ? (
          <p className="text-[10px] leading-relaxed text-amber-700">
            {translate(
              `${missingPriceCount} item(s) without a last purchase price were excluded from this estimate.`,
              `تم استبعاد ${missingPriceCount} بند/بنود بدون آخر سعر شراء من هذا التقدير.`,
            )}
          </p>
        ) : null}
      </section>
    </div>
  );
}
