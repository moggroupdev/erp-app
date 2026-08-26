import Link from "next/link";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import { formatDate, formatDateAndTime } from "@/lib/helpers/date-formaters";
import { formatMoney } from "@/lib/helpers/format-money";
import { type MaterialPurchaseOrderDetailed } from "@/types/material-purchase-order";
import { FileText } from "lucide-react";
import EntityDetails, { CreatorLink, EmptyValue, type DetailRow } from "@/components/ui/entity-details";

function getOrderStatusLabel(
  order: Pick<MaterialPurchaseOrderDetailed, "cancelledAt" | "completedAt">,
  translate: (en: string, ar: string) => string,
) {
  if (order.cancelledAt) return { label: translate("Cancelled", "ملغي"), className: "text-red-600 font-bold" };
  if (order.completedAt) return { label: translate("Completed", "مكتمل"), className: "text-teal-600 font-bold" };
  return { label: translate("Open", "مفتوح"), className: "text-orange-600 font-bold" };
}

export default function OrderDetails({ order }: { order: MaterialPurchaseOrderDetailed }) {
  const { locale, translate, translation } = useI18n();
  const getLocalizedHref = useLocaleHref();
  const status = getOrderStatusLabel(order, translate);

  const rows: DetailRow[] = [
    { key: translate("Purchase Order Code", "كود أمر التوريد"), value: order.code, mono: true, copyText: order.code },
    {
      key: translate("Supplier", "المورد"),
      value: (
        <Link href={getLocalizedHref(`/procurement/suppliers/${order.supplier.id}`)} className="hover:underline">
          {order.supplier.name}
        </Link>
      ),
    },
    {
      key: translate("Invoice Number", "رقم الفاتورة"),
      value: order.legacyInvoiceNumber ? <span className="font-mono">{order.legacyInvoiceNumber}</span> : <EmptyValue />,
      copyText: order.legacyInvoiceNumber || undefined,
    },
    {
      key: translate("Invoice Issue Date", "تاريخ اصدار الفاتورة"),
      value: order.legacyInvoiceIssuedAt ? formatDate(order.legacyInvoiceIssuedAt, locale) : <EmptyValue />,
    },

    {
      key: translate(`Invoice Total (${translation.currency})`, `إجمالي الفاتورة (${translation.currency})`),
      value: order.legacyInvoiceTotalPurchases != null ? formatMoney(order.legacyInvoiceTotalPurchases) : <EmptyValue />,
    },
    {
      key: translate(`Calculated Total (${translation.currency})`, `الإجمالي المحسوب (${translation.currency})`),
      value: (
        <span
          className={
            order.legacyInvoiceTotalPurchases != null &&
            Math.abs(order.totalAmount - order.legacyInvoiceTotalPurchases) >=
              Math.max(Math.abs(order.totalAmount), Math.abs(order.legacyInvoiceTotalPurchases)) * 0.01
              ? "font-semibold text-orange-600"
              : undefined
          }
        >
          {formatMoney(order.totalAmount)}
        </span>
      ),
    },
    {
      key: translate("Status", "الحالة"),
      value: <span className={status.className}>{status.label}</span>,
    },
    ...(order.completedAt
      ? [
          {
            key: translate("Completed At", "تاريخ الإكمال"),
            value: formatDateAndTime(order.completedAt, locale),
          },
        ]
      : []),
    ...(order.cancelledAt
      ? [
          {
            key: translate("Cancelled At", "تاريخ الإلغاء"),
            value: formatDateAndTime(order.cancelledAt, locale),
          },
        ]
      : []),
    {
      key: translate("PO Date", "تاريخ أمر التوريد"),
      value: formatDateAndTime(order.createdAt, locale),
    },
    {
      key: translate("Created By", "أنشئ بواسطة"),
      value: <CreatorLink creator={order.createdBy} />,
    },
    {
      key: translate("Notes", "الملاحظات"),
      value: order.notes ? <span className="font-normal whitespace-pre-wrap">{order.notes}</span> : <EmptyValue />,
    },
  ];

  return <EntityDetails title={order.code} icon={FileText} rows={rows} />;
}
