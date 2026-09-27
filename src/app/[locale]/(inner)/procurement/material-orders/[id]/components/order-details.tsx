import { useI18n } from "@/lib/i18n/hooks";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { type MaterialPurchaseOrderDetailed } from "@/types/material-purchase-order";
import { FileText } from "lucide-react";
import EntityDetails, { CreatorLink, EmptyValue, type DetailRow } from "@/components/ui/entity-details";
import ProtectedLink from "@/components/ui/protected-link";

function getOrderStatusLabel(
  order: Pick<MaterialPurchaseOrderDetailed, "cancelledAt" | "completedAt">,
  translate: (en: string, ar: string) => string,
) {
  if (order.cancelledAt) return { label: translate("Cancelled", "ملغي"), className: "text-red-600 font-bold" };
  if (order.completedAt) return { label: translate("Completed", "مكتمل"), className: "text-teal-600 font-bold" };
  return { label: translate("Open", "مفتوح"), className: "text-orange-600 font-bold" };
}

export default function OrderDetails({ order }: { order: MaterialPurchaseOrderDetailed }) {
  const { locale, translate } = useI18n();
  const status = getOrderStatusLabel(order, translate);

  const rows: DetailRow[] = [
    { key: translate("Purchase Order Code", "كود أمر التوريد"), value: order.code, mono: true, copyText: order.code },
    {
      key: translate("Supplier", "المورد"),
      value: (
        <ProtectedLink
          permission={PERMISSIONS.READ_SUPPLIERS}
          href={`/procurement/suppliers/${order.supplier.id}`}
          className="hover:underline"
        >
          {order.supplier.name}
        </ProtectedLink>
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
