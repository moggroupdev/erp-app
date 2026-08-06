import Link from "next/link";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
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
    { key: translate("Code", "الكود"), value: order.code, mono: true, copyText: order.code },
    {
      key: translate("Invoice Number", "رقم الفاتورة"),
      value: order.legacyInvoiceNumber ? <span className="font-mono">{order.legacyInvoiceNumber}</span> : <EmptyValue />,
      copyText: order.legacyInvoiceNumber || undefined,
    },
    {
      key: translate("Vendor", "المورد"),
      value: (
        <Link href={getLocalizedHref(`/procurement/vendors/${order.vendor.id}`)} className="hover:underline">
          {order.vendor.name}
        </Link>
      ),
    },
    {
      key: translate(`Total (${translation.currency})`, `الإجمالي (${translation.currency})`),
      value: formatMoney(order.totalAmount),
    },
    {
      key: translate("Status", "الحالة"),
      value: <span className={status.className}>{status.label}</span>,
    },
    {
      key: translate("Completed At", "تاريخ الإكمال"),
      value: order.completedAt ? formatDateAndTime(order.completedAt, locale) : <EmptyValue />,
    },
    {
      key: translate("Cancelled At", "تاريخ الإلغاء"),
      value: order.cancelledAt ? formatDateAndTime(order.cancelledAt, locale) : <EmptyValue />,
    },
    {
      key: translate("Notes", "الملاحظات"),
      value: order.notes ? <span className="font-normal whitespace-pre-wrap">{order.notes}</span> : <EmptyValue />,
    },
    {
      key: translate("Created By", "أنشئ بواسطة"),
      value: <CreatorLink creator={order.createdBy} />,
    },
    {
      key: translate("Date", "التاريخ"),
      value: formatDateAndTime(order.createdAt, locale),
    },
  ];

  return <EntityDetails title={order.code} icon={FileText} rows={rows} />;
}
