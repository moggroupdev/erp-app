import { useI18n } from "@/lib/i18n/hooks";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { getMpoDeliveryLocationLabel } from "@/lib/constants/enums/mpo-delivery-locations";
import { getMpoDeliveryTimingLabel, MPO_DELIVERY_TIMINGS } from "@/lib/constants/enums/mpo-delivery-timings";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { formatPaymentTermLine } from "@/lib/helpers/format-mpo-terms";
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
  const paymentTerms = order.paymentTerms ?? [];

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
      key: translate("Delivery location", "مكان التسليم"),
      value: order.deliveryLocation ? getMpoDeliveryLocationLabel(order.deliveryLocation, locale) : <EmptyValue />,
    },
    {
      key: translate("Delivery period", "مدة التوريد"),
      value: order.deliveryTiming ? (
        order.deliveryTiming === MPO_DELIVERY_TIMINGS.WITHIN_DAYS
          ? translate(`${order.deliveryPeriodDays} days`, `${order.deliveryPeriodDays} يوم`)
          : getMpoDeliveryTimingLabel(order.deliveryTiming, locale)
      ) : (
        <EmptyValue />
      ),
    },
    {
      key: translate("Payment terms", "شروط السداد"),
      value:
        paymentTerms.length > 0 ? (
          <ol className="m-0 flex list-none flex-col gap-1 p-0 font-normal">
            {paymentTerms.map((term) => (
              <li key={term.id}>{formatPaymentTermLine(term, translate)}</li>
            ))}
          </ol>
        ) : (
          <EmptyValue />
        ),
    },
    {
      key: translate("Notes", "الملاحظات"),
      value: order.notes ? <span className="font-normal whitespace-pre-wrap">{order.notes}</span> : <EmptyValue />,
    },
  ];

  return <EntityDetails title={order.code} icon={FileText} rows={rows} />;
}
