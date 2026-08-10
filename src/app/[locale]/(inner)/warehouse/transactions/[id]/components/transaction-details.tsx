import Link from "next/link";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import type { Locale } from "@/lib/i18n/config";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { getProductionSubDepartmentLabel } from "@/lib/constants/enums/production-sub-departments";
import { type InventoryTransactionDetailed } from "@/types/inventory-transaction";
import { ReceiptText } from "lucide-react";
import EntityDetails, { CreatorLink, EmptyValue, type DetailRow } from "@/components/ui/entity-details";
import InventoryTransactionTypeLabel from "@/components/ui/inventory-transaction-type-label";

function getSourceRows(
  transaction: InventoryTransactionDetailed,
  translate: (en: string, ar: string) => string,
  getLocalizedHref: (path: string) => string,
  locale: Locale,
): DetailRow[] {
  if (transaction.materialPurchaseReceipt) {
    const receipt = transaction.materialPurchaseReceipt;
    const order = receipt.materialPurchaseOrder;
    return [
      {
        key: translate("Invoice Number", "رقم الفاتورة"),
        value: order.legacyInvoiceNumber ? (
          <Link href={getLocalizedHref(`/procurement/material-orders/${order.id}`)} className="font-mono hover:underline">
            {order.legacyInvoiceNumber}
          </Link>
        ) : (
          <EmptyValue />
        ),
        copyText: order.legacyInvoiceNumber || undefined,
      },
      {
        key: translate("Materials Receipt Number", "رقم سند استلام الخامات"),
        value: (
          <Link
            href={getLocalizedHref(`/procurement/material-orders/${order.id}/receipts/${receipt.id}`)}
            className="font-mono hover:underline"
          >
            {receipt.code}
          </Link>
        ),
        copyText: receipt.code,
      },
    ];
  }

  if (transaction.outsourcingReceipt) {
    const receipt = transaction.outsourcingReceipt;
    return [
      {
        key: translate("Outsourcing Order Number", "رقم أمر التصنيع الخارجي"),
        value: <span className="font-mono">{receipt.outsourcingOrder.code}</span>,
        copyText: receipt.outsourcingOrder.code,
      },
      {
        key: translate("Outsourcing Receipt Number", "رقم سند استلام التصنيع الخارجي"),
        value: <span className="font-mono">{receipt.code}</span>,
        copyText: receipt.code,
      },
    ];
  }

  if (transaction.productionPlanItem) {
    const item = transaction.productionPlanItem;
    const { contract } = item.productUnit.contractItem;
    return [
      {
        key: translate("Customer", "العميل"),
        value: (
          <Link href={getLocalizedHref(`/sales/customers/${contract.customer.id}`)} className="hover:underline">
            {contract.customer.name}
          </Link>
        ),
      },
      {
        key: translate("Contract Number", "رقم العقد"),
        value: <span className="font-mono">{contract.code}</span>,
        copyText: contract.code,
      },
      {
        key: translate("Product Unit Number", "رقم الوحدة"),
        value: <span className="font-mono">{item.productUnit.serialNumber}</span>,
        copyText: item.productUnit.serialNumber,
      },
      {
        key: translate("Production Department", "قسم الإنتاج"),
        value: getProductionSubDepartmentLabel(item.productionStage, locale),
      },
    ];
  }

  if (transaction.maintenanceOrder) {
    return [
      {
        key: translate("Maintenance Order Number", "رقم أمر الصيانة"),
        value: <span className="font-mono">{transaction.maintenanceOrder.code}</span>,
        copyText: transaction.maintenanceOrder.code,
      },
    ];
  }

  if (transaction.outsourcingOrder) {
    return [
      {
        key: translate("Outsourcing Order Number", "رقم أمر التصنيع الخارجي"),
        value: <span className="font-mono">{transaction.outsourcingOrder.code}</span>,
        copyText: transaction.outsourcingOrder.code,
      },
    ];
  }

  return [];
}

// =============================================================

export default function TransactionDetails({ transaction }: { transaction: InventoryTransactionDetailed }) {
  const { locale, translate } = useI18n();
  const getLocalizedHref = useLocaleHref();

  const rows: DetailRow[] = [
    { key: translate("Code", "الكود"), value: transaction.code, mono: true, copyText: transaction.code },
    {
      key: translate("Transaction Number", "رقم الإذن"),
      value: transaction.legacyNumber ? <span className="font-mono">{transaction.legacyNumber}</span> : <EmptyValue />,
      copyText: transaction.legacyNumber || undefined,
    },
    {
      key: translate("Transaction Type", "نوع الإذن"),
      value: <InventoryTransactionTypeLabel type={transaction.transactionType} />,
    },
    ...getSourceRows(transaction, translate, getLocalizedHref, locale),
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
