import { useI18n } from "@/lib/i18n/hooks";
import { PrintDetail, PrintSectionHeading, PrintTable } from "./components";
import { formatDate, formatDateAndTime } from "@/lib/helpers/date-formaters";
import { formatMoney } from "@/lib/helpers/format-money";
import type {
  PurchasingMaterialsTotalAmountMismatchOrder,
  PurchasingMaterialsTotalAmountMismatchOverview,
} from "@/types/reports";

export default function PurchasingMaterialsTotalAmountMismatchesPrintDocument({
  title,
  startDate,
  endDate,
  overview,
  orders,
}: {
  title: string;
  startDate?: string | null;
  endDate?: string | null;
  overview: PurchasingMaterialsTotalAmountMismatchOverview;
  orders: PurchasingMaterialsTotalAmountMismatchOrder[];
}) {
  const { locale, translate, translation } = useI18n();
  const currency = translation.currency;
  const logoSrc = typeof window !== "undefined" ? `${window.location.origin}/images/logo.png` : "/images/logo.png";
  const printedAt = formatDateAndTime(new Date(), locale);

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

      <section className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs sm:grid-cols-3">
        <PrintDetail label={translate("Mismatch Count", "عدد الفروقات")} value={String(overview.mismatchCount)} />
        <PrintDetail
          label={translate(`Calculated Total (${currency})`, `الإجمالي المحسوب (${currency})`)}
          value={formatMoney(overview.totalCalculatedAmount, currency)}
        />
        <PrintDetail
          label={translate(`Invoice Total Purchases (${currency})`, `إجمالي مشتريات الفاتورة (${currency})`)}
          value={formatMoney(overview.totalLegacyInvoicePurchases, currency)}
        />
        <PrintDetail
          label={translate(`Difference (${currency})`, `الفرق (${currency})`)}
          value={formatMoney(overview.totalDifference, currency)}
        />
        <PrintDetail
          label={translate("Start Date", "تاريخ البداية")}
          value={startDate ? formatDate(startDate, locale) : "-"}
        />
        <PrintDetail label={translate("End Date", "تاريخ النهاية")} value={endDate ? formatDate(endDate, locale) : "-"} />
      </section>

      <hr className="border-gray-300" />

      <section className="flex flex-col gap-2.5">
        <PrintSectionHeading
          title={translate("Mismatched Orders", "أوامر ذات فروقات")}
          subtitle={translate(
            "Relative difference of at least 1%.",
            "فرق نسبي بنسبة 1% على الأقل.",
          )}
        />
        <PrintTable
          headers={[
            "#",
            translate("Code", "الكود"),
            translate("Invoice Number", "رقم الفاتورة"),
            translate("Supplier", "المورد"),
            translate("Date", "التاريخ"),
            translate("Status", "الحالة"),
            translate(`Calculated (${currency})`, `المحسوب (${currency})`),
            translate(`Invoice Purchases (${currency})`, `مشتريات الفاتورة (${currency})`),
            translate(`Difference (${currency})`, `الفرق (${currency})`),
          ]}
          rows={orders.map((row, index) => [
            String(index + 1),
            row.orderCode,
            row.legacyInvoiceNumber ?? "-",
            row.supplierName,
            formatDate(row.createdAt, locale),
            row.completedAt ? translate("Completed", "مكتمل") : translate("Open", "مفتوح"),
            formatMoney(row.calculatedTotalAmount),
            formatMoney(row.legacyInvoiceTotalPurchases),
            formatMoney(row.difference),
          ])}
          footerRow={[
            "",
            translate("Total", "الإجمالي"),
            "",
            "",
            "",
            "",
            formatMoney(overview.totalCalculatedAmount),
            formatMoney(overview.totalLegacyInvoicePurchases),
            formatMoney(overview.totalDifference),
          ]}
          monoColumnIndexes={[1, 2]}
          emptyLabel={translate("No mismatches found for this period.", "لا توجد فروقات في هذه الفترة.")}
        />
      </section>
    </div>
  );
}
