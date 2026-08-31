import { useMemo } from "react";
import { useI18n } from "@/lib/i18n/hooks";
import type { Locale } from "@/lib/i18n/types";
import { PrintDetail, PrintSectionHeading, PrintTable } from "./components";
import { formatDate, formatDateAndTime } from "@/lib/helpers/date-formaters";
import { formatMoney } from "@/lib/helpers/format-money";
import { formatQuantity } from "@/lib/helpers/format-quantity";
import { getMaterialUnitLabel } from "@/lib/constants/enums/material-units";
import { getProductionSubDepartmentLabel } from "@/lib/constants/enums/production-sub-departments";
import { APPROVAL_DECISIONS, type ApprovalDecision } from "@/lib/constants/enums/approval-decisions";
import { resolveDisplayUnit, toDisplayUnitPrice } from "@/lib/helpers/unit-conversion";
import type { MaterialPurchaseRequisitionDetailed } from "@/types/material-purchase-requisition";
import {
  computeRequisitionLastPurchaseTotals,
  getRequisitionItemLineTotal,
} from "@/app/[locale]/(inner)/procurement/material-requisitions/helpers";

type MaterialPurchaseRequisitionPrintDocumentProps = {
  requisition: MaterialPurchaseRequisitionDetailed;
  getMainCategoryTitle: (subCategoryId: string | undefined) => string | null;
};

function getDecisionLabel(decision: ApprovalDecision, translate: (en: string, ar: string) => string) {
  if (decision === APPROVAL_DECISIONS.APPROVED) return translate("Approved", "معتمد");
  if (decision === APPROVAL_DECISIONS.REJECTED) return translate("Rejected", "مرفوض");
  return translate("Pending", "قيد الانتظار");
}

function ApprovalGateBlock({
  title,
  decision,
  decidedBy,
  decidedAt,
  reason,
  locale,
  translate,
}: {
  title: string;
  decision: ApprovalDecision;
  decidedBy: string | null;
  decidedAt: Date | null;
  reason: string | null;
  locale: Locale;
  translate: (en: string, ar: string) => string;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <p className="text-[10px] font-semibold text-gray-800">{title}</p>
      <p className="text-xs text-gray-800">{getDecisionLabel(decision, translate)}</p>
      {decidedBy ? (
        <p className="text-[10px] text-gray-600">
          {translate("Decided by", "بواسطة")}: {decidedBy}
        </p>
      ) : null}
      {decidedAt ? <p className="text-[10px] text-gray-600">{formatDateAndTime(decidedAt, locale)}</p> : null}
      {reason ? (
        <p className="text-[10px] text-gray-600">
          {translate("Reason", "السبب")}: {reason}
        </p>
      ) : null}
    </div>
  );
}

export default function MaterialPurchaseRequisitionPrintDocument({
  requisition,
  getMainCategoryTitle,
}: MaterialPurchaseRequisitionPrintDocumentProps) {
  const { locale, translate, translation } = useI18n();
  const currency = translation.currency;
  const logoSrc = typeof window !== "undefined" ? `${window.location.origin}/images/logo.png` : "/images/logo.png";
  const printedAt = formatDateAndTime(new Date(), locale);

  const { subtotal, vat, grandTotal, missingPriceCount } = useMemo(
    () => computeRequisitionLastPurchaseTotals(requisition.items),
    [requisition.items],
  );

  const itemHeaders = [
    translate("Material", "المادة"),
    translate("Code", "الكود"),
    translate("Category", "الفئة"),
    translate("Unit", "الوحدة"),
    translate("Qty Requested", "الكمية المطلوبة"),
    translate(`Last Purchase Price (${currency})`, `آخر سعر شراء (${currency})`),
    translate(`Total (${currency})`, `الإجمالي (${currency})`),
    translate("Last Purchase Date", "تاريخ آخر شراء"),
    translate("Last Purchase Vendor", "آخر مورد"),
    translate("Notes", "الملاحظات"),
  ];

  const itemRows = requisition.items.map((item) => {
    const { factor } = resolveDisplayUnit(
      item.unitOfMeasurementSelected,
      item.material.unitOfMeasurement,
      item.material.unitConversions,
    );
    const displayLastPurchasePrice =
      item.lastPurchasePrice != null ? toDisplayUnitPrice(item.lastPurchasePrice, factor) : null;
    const lineTotal = getRequisitionItemLineTotal(item);

    return [
      item.material.title,
      item.materialCode,
      getMainCategoryTitle(item.material.subCategoryId) || "",
      getMaterialUnitLabel(item.unitOfMeasurementSelected, locale),
      formatQuantity(item.quantityRequested),
      displayLastPurchasePrice != null ? formatMoney(displayLastPurchasePrice) : "",
      lineTotal != null ? formatMoney(lineTotal) : "",
      item.lastPurchaseDate ? formatDate(item.lastPurchaseDate, locale) : "",
      item.lastPurchaseVendor || "",
      item.notes || "",
    ];
  });

  const itemFooterRows = [
    [translate(`Total (${currency})`, `الإجمالي (${currency})`), "", "", "", "", "", formatMoney(subtotal), "", "", ""],
    [translate("VAT (14%)", "ضريبة القيمة المضافة (14%)"), "", "", "", "", "", formatMoney(vat), "", "", ""],
    [
      translate(`Grand Total (${currency})`, `الإجمالي الكلي (${currency})`),
      "",
      "",
      "",
      "",
      "",
      formatMoney(grandTotal),
      "",
      "",
      "",
    ],
  ];

  const approvalGates = [
    {
      title: translate("Planning Approval", "اعتماد التخطيط"),
      decision: requisition.planningDecision,
      decidedBy: requisition.planningDecidedBy?.name ?? null,
      decidedAt: requisition.planningDecidedAt,
      reason: requisition.planningDecisionReason,
    },
    {
      title: translate("Purchasing Manager Approval", "اعتماد مدير المشتريات"),
      decision: requisition.purchasingManagerDecision,
      decidedBy: requisition.purchasingManagerDecidedBy?.name ?? null,
      decidedAt: requisition.purchasingManagerDecidedAt,
      reason: requisition.purchasingManagerDecisionReason,
    },
    {
      title: translate("Manager Approval", "اعتماد المدير"),
      decision: requisition.managerDecision,
      decidedBy: requisition.managerDecidedBy?.name ?? null,
      decidedAt: requisition.managerDecidedAt,
      reason: requisition.managerDecisionReason,
    },
  ];

  return (
    <div className="flex flex-col gap-5 text-xs text-gray-900">
      <header className="flex items-start justify-between gap-4 border-b border-gray-300 pb-4">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-[10px] font-medium tracking-wide text-gray-500 uppercase">
            {translate("Material Purchase Requisition", "طلب شراء خامات")}
          </p>
          <h1 className="font-mono text-2xl font-semibold">{requisition.code}</h1>
          <p className="text-[10px] text-gray-500">
            <span className="font-medium text-gray-600">{translate("Printing date", "تاريخ الطباعة")}:</span> {printedAt}
          </p>
        </div>
        <img src={logoSrc} alt="" width={60} height={60} className="h-[60px] w-[60px] shrink-0 rounded object-contain" />
      </header>

      <section className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs sm:grid-cols-4">
        <PrintDetail
          label={translate("Production Sub-Department", "قسم الانتاج")}
          value={getProductionSubDepartmentLabel(requisition.productionSubDepartment, locale)}
        />
        <PrintDetail
          label={translate("Department Manager", "مدير القسم")}
          value={requisition.productionSubDepartmentManager?.name ?? "-"}
        />
        <PrintDetail
          label={translate("MPQ Created At", "تاريخ إنشاء طلب الشراء")}
          value={formatDateAndTime(requisition.createdAt, locale)}
        />
        <PrintDetail label={translate("Created By", "أنشئ بواسطة")} value={requisition.createdBy.name} />
        {requisition.notes ? <PrintDetail label={translate("Notes", "الملاحظات")} value={requisition.notes} /> : null}
      </section>

      <hr className="border-gray-300" />

      <section className="flex flex-col gap-2.5">
        <PrintSectionHeading title={translate("Items", "البنود")} />
        <PrintTable
          headers={itemHeaders}
          rows={itemRows}
          footerRows={itemFooterRows}
          monoColumnIndexes={[1]}
          noWrapIndexes={[1, 4, 5, 6, 7]}
          tableClassName="text-[8px] [&_td]:align-top"
          columnWidths={["16%", "8%", "10%", "7%", "8%", "10%", "9%", "9%", "11%", "12%"]}
          emptyLabel={translate("No items in this requisition", "لا توجد بنود في هذا الطلب")}
        />
        {missingPriceCount > 0 ? (
          <p className="text-[9px] leading-relaxed text-amber-700">
            {translate(
              `${missingPriceCount} item(s) without a last purchase price were excluded from this estimate.`,
              `تم استبعاد ${missingPriceCount} بند/بنود بدون آخر سعر شراء من هذا التقدير.`,
            )}
          </p>
        ) : null}
      </section>

      <section>
        <div className="flex break-inside-avoid gap-8">
          {approvalGates.map((gate) => (
            <ApprovalGateBlock key={gate.title} locale={locale} translate={translate} {...gate} />
          ))}
        </div>
      </section>
    </div>
  );
}
