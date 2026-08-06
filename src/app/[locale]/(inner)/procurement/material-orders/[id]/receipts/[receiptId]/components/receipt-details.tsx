import Link from "next/link";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { type MaterialPurchaseReceiptDetailed } from "@/types/material-purchase-order";
import { ClipboardCheck } from "lucide-react";
import EntityDetails, { CreatorLink, EmptyValue, type DetailRow } from "@/components/ui/entity-details";

export default function ReceiptDetails({ receipt }: { receipt: MaterialPurchaseReceiptDetailed }) {
  const { locale, translate } = useI18n();
  const getLocalizedHref = useLocaleHref();

  const rows: DetailRow[] = [
    { key: translate("Code", "الكود"), value: receipt.code, mono: true, copyText: receipt.code },
    {
      key: translate("Purchase Order", "أمر الشراء"),
      value: (
        <Link
          href={getLocalizedHref(`/procurement/material-orders/${receipt.materialPurchaseOrder.id}`)}
          className="font-mono hover:underline"
        >
          {receipt.materialPurchaseOrder.code}
        </Link>
      ),
      copyText: receipt.materialPurchaseOrder.code,
    },
    {
      key: translate("Invoice Number", "رقم الفاتورة"),
      value: receipt.materialPurchaseOrder.legacyInvoiceNumber ? (
        <span className="font-mono">{receipt.materialPurchaseOrder.legacyInvoiceNumber}</span>
      ) : (
        <EmptyValue />
      ),
      copyText: receipt.materialPurchaseOrder.legacyInvoiceNumber || undefined,
    },
    {
      key: translate("Received At", "تاريخ الاستلام"),
      value: receipt.receivedAt ? formatDateAndTime(receipt.receivedAt, locale) : <EmptyValue />,
    },
    {
      key: translate("Received By", "تم الاستلام بواسطة"),
      value: <CreatorLink creator={receipt.receivedBy} />,
    },
    {
      key: translate("Notes", "الملاحظات"),
      value: receipt.notes ? <span className="font-normal whitespace-pre-wrap">{receipt.notes}</span> : <EmptyValue />,
    },
    {
      key: translate("Created By", "أنشئ بواسطة"),
      value: <CreatorLink creator={receipt.createdBy} />,
    },
    {
      key: translate("Creation Date", "تاريخ إنشاء الإذن"),
      value: formatDateAndTime(receipt.createdAt, locale),
    },
  ];

  return <EntityDetails title={receipt.code} icon={ClipboardCheck} rows={rows} />;
}
