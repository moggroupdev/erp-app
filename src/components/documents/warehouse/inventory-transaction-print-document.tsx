import { useI18n } from "@/lib/i18n/hooks";
import type { Locale } from "@/lib/i18n/types";
import { PrintDetail, PrintTable } from "../components";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { formatMoney } from "@/lib/helpers/format-money";
import { formatQuantity } from "@/lib/helpers/format-quantity";
import { getMaterialUnitLabel } from "@/lib/constants/enums/material-units";
import { getInventoryTransactionTypeLabel } from "@/lib/constants/enums/inventory-transaction-types";
import { getProductionSubDepartmentLabel } from "@/lib/constants/enums/production-sub-departments";
import type { InventoryTransactionDetailed } from "@/types/inventory-transaction";

type InventoryTransactionPrintDocumentProps = {
  transaction: InventoryTransactionDetailed;
  getMainCategoryTitle: (subCategoryId: string | undefined) => string | null;
};

function PrintOrgHeader() {
  return (
    <div className="flex flex-col gap-0.5 font-semibold">
      <p className="text-xs text-gray-800">موج العاشر من رمضـــــان</p>
      <p className="text-xs text-gray-800">إدارة المشتريات والمخـازن</p>
      <p className="text-xs text-gray-800">المخــــــــزن الرئيســـــــــــــــي</p>
    </div>
  );
}

function getSourceDetails(
  transaction: InventoryTransactionDetailed,
  translate: (en: string, ar: string) => string,
  locale: Locale,
): { label: string; value: string; mono?: boolean }[] {
  if (transaction.materialPurchaseReceipt) {
    const receipt = transaction.materialPurchaseReceipt;
    const order = receipt.materialPurchaseOrder;
    return [
      {
        label: translate("Materials Receipt Number", "رقم سند استلام الخامات"),
        value: receipt.code,
        mono: true,
      },
      {
        label: translate("Purchase Order Number", "رقم أمر التوريد"),
        value: order.code,
        mono: true,
      },
    ];
  }

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
}: InventoryTransactionPrintDocumentProps) {
  const { locale, translate, translation } = useI18n();
  const currency = translation.currency;
  const logoSrc = typeof window !== "undefined" ? `${window.location.origin}/images/logo.png` : "/images/logo.png";
  const printedAt = formatDateAndTime(new Date(), locale);
  const typeLabel = getInventoryTransactionTypeLabel(transaction.transactionType, locale);
  const sourceDetails = getSourceDetails(transaction, translate, locale);

  const total = transaction.items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitPrice), 0);

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
    const subtotal = Number(item.quantity) * Number(item.unitPrice);
    return [
      item.material.title,
      item.material.code,
      getMainCategoryTitle(item.material.subCategoryId) || "",
      getMaterialUnitLabel(item.material.unitOfMeasurement, locale),
      formatQuantity(item.quantity),
      formatMoney(item.unitPrice),
      formatMoney(subtotal),
    ];
  });

  const itemFooterRows = [[translate(`Total (${currency})`, `الإجمالي (${currency})`), "", "", "", "", "", formatMoney(total)]];

  return (
    <table className="w-full border-collapse text-xs text-gray-900">
      <thead className="table-header-group break-inside-avoid">
        <tr>
          <td className="pb-5">
            <header className="grid grid-cols-3 items-center gap-4 border-b border-gray-300 bg-white pb-2">
              <PrintOrgHeader />
              <div className="flex flex-col items-center gap-1 text-center">
                <p className="text-[10px] font-medium tracking-wide text-gray-500 uppercase">{typeLabel}</p>
                <h1 className="font-mono text-2xl font-semibold">{transaction.code}</h1>
              </div>
              <div className="flex justify-end">
                <img src={logoSrc} alt="" width={100} height={100} className="h-24 w-24 shrink-0 rounded object-contain" />
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
                  label={translate("Date", "التاريخ")}
                  value={formatDateAndTime(transaction.createdAt, locale)}
                />
                <PrintDetail label={translate("Transaction Type", "نوع الإذن")} value={typeLabel} />
                {transaction.legacyNumber ? (
                  <PrintDetail
                    label={translate("Transaction Number", "رقم الإذن")}
                    value={transaction.legacyNumber}
                    mono
                  />
                ) : null}
                <PrintDetail label={translate("Created By", "أنشئ بواسطة")} value={transaction.createdBy.name} />
                {transaction.notes ? <PrintDetail label={translate("Notes", "الملاحظات")} value={transaction.notes} /> : null}
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
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );
}