import Link from "next/link";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { type MaterialPurchaseReceiptDetailed } from "@/types/material-purchase-order";
import { ClipboardCheck } from "lucide-react";
import EntityDetails, { CreatorLink, EmptyValue, type DetailRow } from "@/components/ui/entity-details";

export default function ReceiptDetails({ receipt }: { receipt: MaterialPurchaseReceiptDetailed }) {
  const { locale, translate } = useI18n();
  const getLocalizedHref = useLocaleHref();
  const { inventoryTransactions } = receipt;

  const rows: DetailRow[] = [
    {
      key: translate("Materials Receipt Code", "كود سند الاستلام"),
      value: receipt.code,
      mono: true,
      copyText: receipt.code,
    },
    {
      key: translate("Invoice Number", "رقم الفاتورة"),
      value: receipt.materialPurchaseOrder.invoiceNumber ? (
        <Link
          href={getLocalizedHref(`/procurement/material-orders/${receipt.materialPurchaseOrder.id}`)}
          className="font-mono hover:underline"
        >
          {receipt.materialPurchaseOrder.invoiceNumber}
        </Link>
      ) : (
        <EmptyValue />
      ),
      copyText: receipt.materialPurchaseOrder.invoiceNumber || undefined,
    },
  ];

  if (inventoryTransactions.length === 0) {
    rows.push({
      key: translate("Transaction Number", "رقم الإذن"),
      value: (
        <span className="font-semibold text-red-600">
          {translate("Inventory transaction was not created yet", "لم يُنشأ إذن المخزون بعد")}
        </span>
      ),
    });
  } else if (inventoryTransactions.length === 1) {
    const transaction = inventoryTransactions[0];
    const transactionLabel = transaction.legacyNumber || transaction.id;
    rows.push({
      key: translate("Transaction Number", "رقم إذن الإضافة"),
      value: (
        <Link href={getLocalizedHref(`/warehouse/transactions/${transaction.id}`)} className="font-mono hover:underline">
          {transactionLabel}
        </Link>
      ),
      copyText: transactionLabel,
    });
  } else {
    rows.push({
      key: translate("Transaction Numbers", "أرقام أذون الإضافة"),
      value: (
        <div className="flex flex-col gap-1">
          {inventoryTransactions.map((transaction) => (
            <Link
              key={transaction.id}
              href={getLocalizedHref(`/warehouse/transactions/${transaction.id}`)}
              className="font-mono hover:underline"
            >
              {transaction.legacyNumber || transaction.id}
            </Link>
          ))}
        </div>
      ),
    });
  }

  rows.push(
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
      key: translate("Creation Date", "تاريخ إنشاء سند الاستلام"),
      value: formatDateAndTime(receipt.createdAt, locale),
    },
  );

  return <EntityDetails title={receipt.code} icon={ClipboardCheck} rows={rows} />;
}
