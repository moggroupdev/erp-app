import { useI18n } from "@/lib/i18n/hooks";
import { PrintDetail, PrintSectionHeading, PrintTable } from "../components";
import { formatDate, formatDateAndTime } from "@/lib/helpers/date-formaters";
import { formatMoney } from "@/lib/helpers/format-money";
import type {
  AccountingSupplierInvoiceRow,
  AccountingSupplierInvoicesByOrderType,
  AccountingSupplierInvoicesByPeriod,
  AccountingSupplierInvoicesOverview,
} from "@/types/reports";
import { formatPeriodLabel } from "@/app/[locale]/(inner)/reports/accounting/supplier-invoices/components/period-label";
import { getOrderTypeLabel } from "@/app/[locale]/(inner)/reports/accounting/supplier-invoices/components/order-type-labels";

type GroupBy = "month" | "quarter" | "year";

export default function AccountingSupplierInvoicesPrintDocument({
  title,
  supplierName,
  startDate,
  endDate,
  groupBy = "month",
  overview,
  byOrderType,
  byPeriod,
  invoices,
  invoicesSortLabel,
}: {
  title: string;
  supplierName: string;
  startDate?: string | null;
  endDate?: string | null;
  groupBy?: GroupBy;
  overview: AccountingSupplierInvoicesOverview;
  byOrderType: AccountingSupplierInvoicesByOrderType[];
  byPeriod: AccountingSupplierInvoicesByPeriod[];
  invoices: AccountingSupplierInvoiceRow[];
  invoicesSortLabel: string;
}) {
  const { locale, translate, translation } = useI18n();
  const currency = translation.currency;
  const logoSrc = typeof window !== "undefined" ? `${window.location.origin}/images/logo.png` : "/images/logo.png";
  const printedAt = formatDateAndTime(new Date(), locale);

  function formatMoneyOrBlank(value: number | null) {
    if (value == null) return "";
    return formatMoney(value);
  }

  const invoiceTotals = invoices.reduce(
    (acc, row) => ({
      totalPurchases: acc.totalPurchases + (row.totalPurchases ?? 0),
      totalDiscount: acc.totalDiscount + (row.totalDiscount ?? 0),
      vatAmount: acc.vatAmount + (row.vatAmount ?? 0),
      withholdingTaxAmount: acc.withholdingTaxAmount + (row.withholdingTaxAmount ?? 0),
      totalAmount: acc.totalAmount + (row.totalAmount ?? 0),
    }),
    {
      totalPurchases: 0,
      totalDiscount: 0,
      vatAmount: 0,
      withholdingTaxAmount: 0,
      totalAmount: 0,
    },
  );

  return (
    <div className="flex flex-col gap-8 text-xs text-gray-900">
      <header className="flex items-start justify-between gap-4 border-b border-gray-300 pb-4">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-[10px] font-medium tracking-wide text-gray-500 uppercase">
            {translate("Accounting Report", "تقرير حسابات")}
          </p>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-[10px] text-gray-500">
            <span className="font-medium text-gray-600">{translate("Printing date", "تاريخ الطباعة")}:</span> {printedAt}
          </p>
        </div>
        <img src={logoSrc} alt="" width={60} height={60} className="h-[60px] w-[60px] shrink-0 rounded object-contain" />
      </header>

      <section className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs sm:grid-cols-3">
        <PrintDetail label={translate("Supplier", "المورد")} value={supplierName} />
        <PrintDetail
          label={translate("Start Date", "تاريخ البداية")}
          value={startDate ? formatDate(startDate, locale) : "-"}
        />
        <PrintDetail label={translate("End Date", "تاريخ النهاية")} value={endDate ? formatDate(endDate, locale) : "-"} />
        <PrintDetail label={translate("Invoice Count", "عدد الفواتير")} value={String(overview.invoiceCount)} />
        <PrintDetail
          label={translate("Total Purchases", "إجمالي المشتريات")}
          value={formatMoney(overview.totalPurchases, currency)}
        />
        <PrintDetail
          label={translate("Total Discount", "إجمالي الخصم")}
          value={formatMoney(overview.totalDiscount, currency)}
        />
        <PrintDetail
          label={translate("VAT Amount", "ضريبة القيمة المضافة")}
          value={formatMoney(overview.vatAmount, currency)}
        />
        <PrintDetail
          label={translate("Tax withholding deduction", "الخصم تحت حساب الضريبة")}
          value={formatMoney(overview.withholdingTaxAmount, currency)}
        />
        <PrintDetail
          label={translate("Invoice Total", "إجمالي الفاتورة")}
          value={formatMoney(overview.totalAmount, currency)}
        />
      </section>

      <hr className="border-gray-300" />

      <section className="flex flex-col gap-2.5">
        <PrintSectionHeading
          title={translate("By Order Type", "حسب نوع الأمر")}
          subtitle={translate(
            "Invoice counts and money totals split by the linked order type.",
            "عدد الفواتير وإجماليات المبالغ مقسمة حسب نوع الأمر المرتبط.",
          )}
        />
        <PrintTable
          headers={[
            translate("Order Type", "نوع الأمر"),
            translate("Invoices", "الفواتير"),
            translate(`Purchases (${currency})`, `المشتريات (${currency})`),
            translate(`Discount (${currency})`, `الخصم (${currency})`),
            translate(`VAT (${currency})`, `ضريبة القيمة المضافة (${currency})`),
            translate(`Tax withholding deduction (${currency})`, `الخصم تحت حساب الضريبة (${currency})`),
            translate(`Total (${currency})`, `الإجمالي (${currency})`),
          ]}
          emptyLabel={translate("No data available", "لا توجد بيانات")}
          rows={byOrderType.map((row) => [
            getOrderTypeLabel(row.orderType, translate),
            String(row.invoiceCount),
            formatMoney(row.totalPurchases),
            formatMoney(row.totalDiscount),
            formatMoney(row.vatAmount),
            formatMoney(row.withholdingTaxAmount),
            formatMoney(row.totalAmount),
          ])}
        />
      </section>

      <hr className="border-gray-300" />

      <section className="flex flex-col gap-2.5">
        <PrintSectionHeading
          title={translate("Invoice Total Trend", "اتجاه إجمالي الفاتورة")}
          subtitle={translate(
            "Invoice totals grouped by issue date period.",
            "إجماليات الفواتير مجمعة حسب فترة تاريخ الإصدار.",
          )}
        />
        <PrintTable
          headers={[
            translate("Period", "الفترة"),
            translate("Invoices", "الفواتير"),
            translate(`Total (${currency})`, `الإجمالي (${currency})`),
          ]}
          emptyLabel={translate("No data available", "لا توجد بيانات")}
          rows={byPeriod.map((row) => [
            formatPeriodLabel(row.period, locale, groupBy),
            String(row.invoiceCount),
            formatMoney(row.totalAmount),
          ])}
        />
      </section>

      <hr className="border-gray-300" />

      <section className="flex flex-col gap-2.5">
        <PrintSectionHeading
          title={translate("Invoices", "الفواتير")}
          subtitle={translate(
            "All supplier invoices for the selected supplier and date range.",
            "جميع فواتير المورد للمورد والنطاق الزمني المحددين.",
          )}
        />
        <PrintTable
          tableClassName="text-[9px]"
          headers={[
            "#",
            translate("Invoice Number", "رقم الفاتورة"),
            translate("Issue Date", "تاريخ الإصدار"),
            translate("Order Type", "نوع الأمر"),
            translate("Order Code", "كود الأمر"),
            translate(`Purchases (${currency})`, `المشتريات (${currency})`),
            translate(`Discount (${currency})`, `الخصم (${currency})`),
            translate(`VAT (${currency})`, `ضريبة القيمة المضافة (${currency})`),
            translate(`Tax withholding deduction (${currency})`, `الخصم تحت حساب الضريبة (${currency})`),
            translate(`Total (${currency})`, `الإجمالي (${currency})`),
          ]}
          monoColumnIndexes={[1, 4]}
          emptyLabel={translate("No data available", "لا توجد بيانات")}
          rows={invoices.map((row, index) => [
            String(index + 1),
            row.invoiceNumber,
            row.issuedAt ? formatDate(row.issuedAt, locale) : "",
            getOrderTypeLabel(row.order.type, translate),
            row.order.code,
            formatMoneyOrBlank(row.totalPurchases),
            formatMoneyOrBlank(row.totalDiscount),
            formatMoneyOrBlank(row.vatAmount),
            formatMoneyOrBlank(row.withholdingTaxAmount),
            formatMoneyOrBlank(row.totalAmount),
          ])}
          footerRow={[
            "",
            translate("Total", "الإجمالي"),
            "",
            "",
            "",
            formatMoney(invoiceTotals.totalPurchases),
            formatMoney(invoiceTotals.totalDiscount),
            formatMoney(invoiceTotals.vatAmount),
            formatMoney(invoiceTotals.withholdingTaxAmount),
            formatMoney(invoiceTotals.totalAmount),
          ]}
        />
      </section>
    </div>
  );
}
