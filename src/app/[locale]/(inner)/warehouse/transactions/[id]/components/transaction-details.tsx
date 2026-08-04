import Link from "next/link";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { getInventoryTransactionTypeLabel } from "@/lib/constants/enums/inventory-transaction-types";
import { type InventoryTransactionDetailed } from "@/types/inventory-transaction";
import { ReceiptText } from "lucide-react";
import EntityDetails, { CreatorLink, EmptyValue, type DetailRow } from "@/components/ui/entity-details";

export default function TransactionDetails({ transaction }: { transaction: InventoryTransactionDetailed }) {
  const { locale, translate } = useI18n();

  const rows: DetailRow[] = [
    { key: translate("Code", "الكود"), value: transaction.code, mono: true, copyText: transaction.code },
    {
      key: translate("Legacy Number", "الرقم القديم"),
      value: transaction.legacyNumber ? (
        <span className="font-mono">{transaction.legacyNumber}</span>
      ) : (
        <EmptyValue />
      ),
      copyText: transaction.legacyNumber || undefined,
    },
    {
      key: translate("Type", "النوع"),
      value: getInventoryTransactionTypeLabel(transaction.transactionType, locale),
    },
    {
      key: translate("Notes", "الملاحظات"),
      value: transaction.notes ? (
        <span className="font-normal whitespace-pre-wrap">{transaction.notes}</span>
      ) : (
        <EmptyValue />
      ),
    },
    {
      key: translate("Created By", "أنشئ بواسطة"),
      value: <CreatorLink creator={transaction.createdBy} />,
    },
    {
      key: translate("Date", "التاريخ"),
      value: formatDateAndTime(transaction.createdAt, locale),
    },
  ];

  return <EntityDetails title={transaction.code} icon={ReceiptText} rows={rows} />;
}

export function getItemSourceLabel(
  item: InventoryTransactionDetailed["items"][number],
  translate: (en: string, ar: string) => string,
) {
  if (item.materialPurchaseReceiptItemId) return translate("Purchase receipt", "إيصال شراء");
  if (item.productionPlanItemId) return translate("Production plan", "خطة إنتاج");
  if (item.maintenanceOrderSparePartId) return translate("Maintenance order", "أمر صيانة");
  if (item.outsourcingOrderItemId) return translate("Outsourcing order", "أمر تصنيع خارجي");
  if (item.outsourcingReceiptItemId) return translate("Outsourcing receipt", "إيصال تصنيع خارجي");
  return translate("Manual", "يدوي");
}

export function MaterialTitleLink({
  code,
  title,
}: {
  code: string;
  title: string;
}) {
  const getLocalizedHref = useLocaleHref();

  return (
    <Link href={getLocalizedHref(`/warehouse/materials/${code}`)} className="hover:underline">
      {title}
    </Link>
  );
}
