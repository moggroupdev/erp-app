import { useI18n } from "@/lib/i18n/hooks";
import type { Locale } from "@/lib/i18n/types";
import { PrintDetail, PrintTable } from "../components";
import { formatDate, formatDateAndTime } from "@/lib/helpers/date-formaters";
import { formatMoney } from "@/lib/helpers/format-money";
import { formatQuantity } from "@/lib/helpers/format-quantity";
import { getMaterialUnitLabel } from "@/lib/constants/enums/material-units";
import {
  INVENTORY_TRANSACTION_TYPES,
  type InventoryTransactionType,
} from "@/lib/constants/enums/inventory-transaction-types";
import { getProductionSubDepartmentLabel } from "@/lib/constants/enums/production-sub-departments";
import { VAT_PERCENT, VAT_RATE } from "@/lib/constants/global";
import type { InventoryTransactionDetailed } from "@/types/inventory-transaction";
import type { SupplierInvoiceWithLinks } from "@/types/material-purchase-order";

type InventoryTransactionPrintDocumentProps = {
  transaction: InventoryTransactionDetailed;
  getMainCategoryTitle: (subCategoryId: string | undefined) => string | null;
  invoices?: SupplierInvoiceWithLinks[];
};

export function getInventoryTransactionPermitTitle(
  transactionType: InventoryTransactionType,
  translate: (en: string, ar: string) => string,
) {
  if (transactionType === INVENTORY_TRANSACTION_TYPES.RECEIPT) {
    return translate("Inventory Transaction - Receipt Permit", "حركة مخزون - إذن إضافة");
  }
  if (transactionType === INVENTORY_TRANSACTION_TYPES.ISSUE) {
    return translate("Inventory Transaction - Issue Permit", "حركة مخزون - إذن صرف");
  }
  return translate("Inventory Transaction - Return Permit", "حركة مخزون - إذن إرتجاع");
}

function getSourceDetails(
  transaction: InventoryTransactionDetailed,
  translate: (en: string, ar: string) => string,
  locale: Locale,
): { label: string; value: string; mono?: boolean }[] {
  if (transaction.outsourcingReceipt) {
    const receipt = transaction.outsourcingReceipt;
    return [
      {
        label: translate("Outsourcing Order Number", "رقم أمر التصنيع الخارجي"),
        value: receipt.outsourcingOrder.code,
        mono: true,
      },
      {
        label: translate("Outsourcing Receipt Number", "رقم سند استلام التصنيع الخارجي"),
        value: receipt.code,
        mono: true,
      },
    ];
  }

  if (transaction.productionPlanItem) {
    const item = transaction.productionPlanItem;
    const { contract } = item.productUnit.contractItem;
    return [
      {
        label: translate("Customer", "العميل"),
        value: contract.customer.name,
      },
      {
        label: translate("Contract review number", "رقم مراجعة العقد"),
        value: contract.code,
        mono: true,
      },
      {
        label: translate("Product Unit Number", "رقم الوحدة"),
        value: item.productUnit.serialNumber,
        mono: true,
      },
      {
        label: translate("Production Department", "قسم الانتاج"),
        value: getProductionSubDepartmentLabel(item.productionStage, locale),
      },
    ];
  }

  if (transaction.maintenanceOrder) {
    return [
      {
        label: translate("Maintenance Order Number", "رقم أمر الصيانة"),
        value: transaction.maintenanceOrder.code,
        mono: true,
      },
    ];
  }

  if (transaction.outsourcingOrder) {
    return [
      {
        label: translate("Outsourcing Order Number", "رقم أمر التصنيع الخارجي"),
        value: transaction.outsourcingOrder.code,
        mono: true,
      },
    ];
  }

  return [];
}

export default function InventoryTransactionPrintDocument({
  transaction,
  getMainCategoryTitle,
  invoices = [],
}: InventoryTransactionPrintDocumentProps) {
  const { locale, translate, translation } = useI18n();
  const currency = translation.currency;
  const logoSrc = typeof window !== "undefined" ? `${window.location.origin}/images/logo.png` : "/images/logo.png";
  const printedAt = formatDateAndTime(new Date(), locale);
  const permitTitle = getInventoryTransactionPermitTitle(transaction.transactionType, translate);
  const sourceDetails = getSourceDetails(transaction, translate, locale);
  const purchaseOrderCode = transaction.materialPurchaseReceipt?.materialPurchaseOrder.code ?? null;
  const supplierName = invoices[0]?.supplier.name ?? null;

  const subtotal = transaction.items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitPrice), 0);
  const vat = subtotal * VAT_RATE;
  const grandTotal = subtotal + vat;

  const itemHeaders = [
    translate("Material", "المادة"),
    translate("Code", "الكود"),
    translate("Category", "الفئة"),
    translate("Unit", "الوحدة"),
    translate("Quantity", "الكمية"),
    translate(`Unit Price (${currency})`, `سعر الوحدة (${currency})`),
    translate(`Subtotal (${currency})`, `المجموع الفرعي (${currency})`),
  ];

  const itemRows = transaction.items.map((item) => {
    const lineSubtotal = Number(item.quantity) * Number(item.unitPrice);
    return [
      item.material.title,
      item.material.code,
      getMainCategoryTitle(item.material.subCategoryId) || "",
      getMaterialUnitLabel(item.material.unitOfMeasurement, locale),
      formatQuantity(item.quantity),
      formatMoney(item.unitPrice),
      formatMoney(lineSubtotal),
    ];
  });

  const itemFooterRows = [
    [translate(`Total (${currency})`, `الإجمالي (${currency})`), "", "", "", "", "", formatMoney(subtotal)],
    [translate(`VAT (${VAT_PERCENT}%)`, `ضريبة القيمة المضافة (${VAT_PERCENT}%)`), "", "", "", "", "", formatMoney(vat)],
    [translate(`Grand Total (${currency})`, `الإجمالي الكلي (${currency})`), "", "", "", "", "", formatMoney(grandTotal)],
  ];

  return (
    <table className="w-full border-collapse text-xs text-gray-900">
      <thead className="table-header-group break-inside-avoid">
        <tr>
          <td className="pb-5">
            <header className="flex items-center justify-between gap-4 border-b border-gray-300 bg-white pb-2" dir="ltr">
              <img src={logoSrc} alt="" width={100} height={100} className="h-24 w-24 shrink-0 rounded object-contain" />
              <div className="flex flex-col items-end gap-1 text-end">
                <p className="text-[10px] font-medium tracking-wide text-gray-500">{permitTitle}</p>
                <h1 className="font-mono text-2xl font-semibold">{transaction.legacyNumber || "-"}</h1>
              </div>
            </header>
          </td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="align-top">
            <div className="flex flex-col gap-5">
              <section className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs sm:grid-cols-4">
                <PrintDetail label={translate("Printing Date", "تاريخ الطباعة")} value={printedAt} />
                <PrintDetail
                  label={translate("Permit Date", "تاريخ الإذن")}
                  value={formatDateAndTime(transaction.createdAt, locale)}
                />
                <PrintDetail
                  label={translate("Inventory Transaction Number", "رقم حركة المخزون")}
                  value={transaction.code}
                  mono
                />
                <PrintDetail label={translate("Editor", "المحرر")} value={transaction.createdBy.name} />
                {sourceDetails.map((detail) => (
                  <PrintDetail key={detail.label} label={detail.label} value={detail.value} mono={detail.mono} />
                ))}
              </section>

              <hr className="border-gray-300" />

              <section className="flex flex-col gap-2.5">
                <PrintTable
                  headers={itemHeaders}
                  rows={itemRows}
                  footerRows={itemFooterRows}
                  monoColumnIndexes={[1]}
                  noWrapIndexes={[1, 3, 4, 5, 6]}
                  tableClassName="text-[8px] [&_td]:align-top [&_th]:text-[8px]"
                  emptyLabel={translate("No items in this transaction", "لا توجد بنود في هذه الحركة")}
                />
              </section>

              {purchaseOrderCode || supplierName || invoices.length > 0 ? (
                <section className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs sm:grid-cols-4">
                  {purchaseOrderCode ? (
                    <PrintDetail
                      label={translate("Purchase Order Number", "رقم أمر التوريد")}
                      value={purchaseOrderCode}
                      mono
                    />
                  ) : null}
                  {supplierName ? <PrintDetail label={translate("Supplier", "المورد")} value={supplierName} /> : null}
                  {invoices.map((invoice) => (
                    <PrintDetail
                      key={invoice.id}
                      label={translate("Invoice", "الفاتورة")}
                      value={
                        <>
                          <span className="font-mono">{invoice.invoiceNumber}</span>
                          {invoice.issuedAt ? ` (${formatDate(invoice.issuedAt, locale)})` : ""}
                        </>
                      }
                    />
                  ))}
                </section>
              ) : null}
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );
}
