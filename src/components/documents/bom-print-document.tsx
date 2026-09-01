import type { Bom } from "@/types/bom";
import { getMaterialUnitLabel } from "@/lib/constants/enums/material-units";
import { getCostingMethodLabel, type CostingMethod } from "@/lib/constants/enums/derived/costing-methods";
import { getProductionSubDepartmentLabel } from "@/lib/constants/enums/production-sub-departments";
import {
  getFlattenedRowLineCost,
  getMaterialCostPrice,
  type FlattenedBomRow,
  type ManufacturingCostRow,
} from "@/lib/helpers/bom-display";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { formatDimensionLabel } from "@/lib/helpers/format-dimension-label";
import { formatMoney } from "@/lib/helpers/format-money";
import { formatQuantity } from "@/lib/helpers/format-quantity";
import { resolveDisplayUnit, toDisplayUnitPrice } from "@/lib/helpers/unit-conversion";
import { useI18n } from "@/lib/i18n/hooks";
import { PrintDetail } from "./components";

export type BomPrintDepartmentGroup = {
  departmentId: string;
  title: string;
  itemCount: number;
  totalCost: number;
  sharePercent: number;
  items: FlattenedBomRow[];
};

type BomPrintDocumentProps = {
  bom: Bom;
  departmentBreakdown: BomPrintDepartmentGroup[];
  manufacturingRows: ManufacturingCostRow[];
  totals: {
    totalMaterialCost: number;
    totalManufacturingCost: number;
    grandTotalCost: number;
    estimatedUnitPrice: number;
    itemCount: number;
    manufacturingItemCount: number;
  };
  mainCategoryTitle: string | null;
  getMaterialMainCategoryTitle: (subCategoryId: string) => string;
  costingMethod: CostingMethod;
};

export default function BomPrintDocument({
  bom,
  departmentBreakdown,
  manufacturingRows,
  totals,
  mainCategoryTitle,
  getMaterialMainCategoryTitle,
  costingMethod,
}: BomPrintDocumentProps) {
  const { locale, translate, translation } = useI18n();

  const dimensionLabel = formatDimensionLabel(bom, translation.productDimensionUnit);
  const logoSrc = typeof window !== "undefined" ? `${window.location.origin}/images/logo.png` : "/images/logo.png";
  const printedAt = formatDateAndTime(new Date(), locale);

  return (
    <div className="flex flex-col gap-5 text-xs text-gray-900">
      <header className="flex items-start justify-between gap-4 border-b border-gray-300 pb-4">
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-medium tracking-wide text-gray-500 uppercase">
            <span>{translate("Bill of Materials", "قائمة المواد")}</span>
            <span> - </span>
            <span className="font-mono text-xs">{bom.product.code}</span>
          </p>
          <h1 className="text-2xl font-semibold">{bom.product.title}</h1>
          <p className="text-[10px] text-gray-500">{printedAt}</p>
        </div>

        <img src={logoSrc} alt="" width={60} height={60} className="h-[60px] w-[60px] shrink-0 rounded object-contain" />
      </header>

      <section className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs sm:grid-cols-4">
        <PrintDetail label={translate("Dimension", "المقاس")} value={dimensionLabel} />
        <PrintDetail
          label={translate("Product Category", "فئة المنتج")}
          value={mainCategoryTitle || translate("Uncategorized", "غير مصنف")}
        />
        <PrintDetail
          label={translate("Grand Total Cost", "إجمالي التكلفة الكلية")}
          value={formatMoney(totals.grandTotalCost, translation.currency)}
        />
        <PrintDetail
          label={translate("Costing Basis", "أساس التكلفة")}
          value={getCostingMethodLabel(costingMethod, locale)}
        />
      </section>

      <hr className="border-gray-300" />

      <section className="flex flex-col gap-8">
        {departmentBreakdown.map((group) => (
          <div key={group.departmentId} className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">{group.title}</h3>

            <table className="w-full table-fixed border-collapse text-[7.5px] [&_td]:px-1.5 [&_td]:py-1.5 [&_th]:px-1.5 [&_th]:py-1.5">
              <thead>
                <tr className="border-b border-gray-300 bg-gray-50 text-[7px] font-medium tracking-wide text-gray-500 uppercase">
                  <th className="w-[10%] text-start whitespace-nowrap">{translate("Material Code", "كود")}</th>
                  <th className="w-[26%] text-start whitespace-nowrap">{translate("Material Name", "الصنف")}</th>
                  <th className="w-[14%] text-start whitespace-nowrap">{translate("Category", "الفئة")}</th>
                  <th className="w-[7%] text-start whitespace-nowrap">{translate("Unit", "الوحدة")}</th>
                  <th className="w-[7%] text-start whitespace-nowrap">{translate("Quantity", "الكمية")}</th>
                  <th className="w-[9%] text-start whitespace-nowrap">
                    {translate(`Unit Price (${translation.currency})`, `سعر الوحدة (${translation.currency})`)}
                  </th>
                  <th className="w-[9%] text-start whitespace-nowrap">
                    {translate(`Total (${translation.currency})`, `الإجمالي (${translation.currency})`)}
                  </th>
                  <th className="w-[18%] text-start whitespace-nowrap">{translate("Notes", "الملاحظات")}</th>
                </tr>
              </thead>
              <tbody>
                {group.items.map((item) => {
                  const unitCost = getMaterialCostPrice(item.material, costingMethod);
                  const lineCost = getFlattenedRowLineCost(item, costingMethod);
                  const enteredUnit = item.unitOfMeasurementSelected ?? item.material.unitOfMeasurement;
                  const { factor } = resolveDisplayUnit(
                    enteredUnit,
                    item.material.unitOfMeasurement,
                    item.material.unitConversions,
                  );

                  return (
                    <tr key={item.id} className="border-b border-gray-200">
                      <td className="font-mono text-gray-600">{item.material.code}</td>
                      <td className="font-medium wrap-break-word text-gray-800">{item.material.title}</td>
                      <td className="text-gray-600">
                        {getMaterialMainCategoryTitle(item.material.subCategoryId) || "-"}
                      </td>
                      <td>{getMaterialUnitLabel(enteredUnit, locale)}</td>
                      <td>{formatQuantity(item.quantityRequired)}</td>
                      <td>{formatMoney(toDisplayUnitPrice(unitCost, factor))}</td>
                      <td className="font-medium">{formatMoney(lineCost)}</td>
                      <td className="wrap-break-word text-gray-600">
                        <div className="flex flex-col gap-0.5 leading-relaxed">
                          {item.notes ? <span>{item.notes}</span> : null}
                          {item.parentManufacturedMaterialTitle && (
                            <span className="text-[7px] text-gray-500">
                              {translate("Required for", "مطلوب لـ")}:{" "}
                              <span className="font-medium text-gray-800">{item.parentManufacturedMaterialTitle}</span>
                            </span>
                          )}
                          {!item.notes && !item.parentManufacturedMaterialTitle ? "-" : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                <tr className="border-t border-gray-300 bg-gray-50 font-medium">
                  <td>{translate("Total", "الإجمالي")}</td>
                  <td colSpan={5} className="text-gray-600">
                    {group.itemCount} {translate("Items", "بند")}
                  </td>
                  <td>{formatMoney(group.totalCost)}</td>
                  <td className="text-gray-600">{group.sharePercent.toFixed(1)}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}
      </section>

      {manufacturingRows.length > 0 && (
        <section className="mt-6 flex flex-col gap-2.5 border-y border-dashed border-gray-300 py-6">
          <h2 className="text-base font-semibold">{translate("Outsourcing Items", "المواد المصنعة خارجيًا")}</h2>
          <table className="w-full border-collapse text-[7.5px] [&_td]:px-1.5 [&_td]:py-1.5 [&_th]:px-1.5 [&_th]:py-1.5">
            <thead>
              <tr className="border-b border-gray-300 bg-gray-50 text-start text-[7px] font-medium tracking-wide text-gray-500 uppercase">
                <th className="text-start whitespace-nowrap">{translate("Material Code", "كود المادة")}</th>
                <th className="text-start whitespace-nowrap">{translate("Material Name", "اسم المادة")}</th>
                <th className="text-start whitespace-nowrap">
                  {translate("Production Department", "قسم الانتاج")}
                </th>
                <th className="text-start whitespace-nowrap">{translate("Quantity", "الكمية")}</th>
                <th className="text-start whitespace-nowrap">
                  {translate(
                    `Unit Manufacturing Cost (${translation.currency})`,
                    `تكلفة التصنيع للوحدة (${translation.currency})`,
                  )}
                </th>
                <th className="text-start whitespace-nowrap">
                  {translate(
                    `Total Manufacturing Cost (${translation.currency})`,
                    `إجمالي تكلفة التصنيع (${translation.currency})`,
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {manufacturingRows.map((row) => (
                <tr key={row.id} className="border-b border-gray-200">
                  <td className="font-mono text-gray-600">{row.materialCode}</td>
                  <td className="font-medium whitespace-nowrap">{row.materialTitle}</td>
                  <td className="text-gray-600">
                    {row.productionSubDepartment
                      ? getProductionSubDepartmentLabel(row.productionSubDepartment, locale)
                      : "-"}
                  </td>
                  <td>{formatQuantity(row.quantityRequired)}</td>
                  <td>{formatMoney(row.unitManufacturingCost)}</td>
                  <td className="font-medium">{formatMoney(row.totalManufacturingCost)}</td>
                </tr>
              ))}
              <tr className="border-t border-gray-300 bg-gray-50 font-medium">
                <td>{translate("Total", "الإجمالي")}</td>
                <td colSpan={4} className="text-gray-600">
                  {totals.manufacturingItemCount} {translate("Items", "بند")}
                </td>
                <td>{formatMoney(totals.totalManufacturingCost)}</td>
              </tr>
            </tbody>
          </table>
        </section>
      )}

      <section className="mt-8 flex flex-col gap-2.5">
        <h2 className="text-base font-semibold">{translate("Departments Summary", "ملخص الأقسام")}</h2>
        <table className="w-full border-collapse text-[7.5px] [&_td]:px-1.5 [&_td]:py-1.5 [&_th]:px-1.5 [&_th]:py-1.5">
          <thead>
            <tr className="border-b border-gray-300 bg-gray-50 text-start text-[7px] font-medium tracking-wide text-gray-500 uppercase">
              <th className="text-start whitespace-nowrap">
                {translate("Production Department", "قسم الانتاج")}
              </th>
              <th className="text-start whitespace-nowrap">{translate("Items Count", "عدد البنود")}</th>
              <th className="text-start whitespace-nowrap">
                {translate(`Total Price (${translation.currency})`, `السعر الإجمالي (${translation.currency})`)}
              </th>
              <th className="text-start whitespace-nowrap">{translate("Share", "الحصة")}</th>
            </tr>
          </thead>
          <tbody>
            {departmentBreakdown.map((group) => (
              <tr key={group.departmentId} className="border-b border-gray-200">
                <td className="font-medium">{group.title}</td>
                <td>{group.itemCount}</td>
                <td>{formatMoney(group.totalCost)}</td>
                <ShareCell value={group.sharePercent} />
              </tr>
            ))}
            <tr className="border-t border-gray-300 bg-gray-50 font-medium">
              <td>{translate("Total", "الإجمالي")}</td>
              <td className="text-gray-600">
                {totals.itemCount} {translate("Items", "بند")}
              </td>
              <td>{formatMoney(totals.totalMaterialCost)}</td>
              <ShareCell value={100} className="text-gray-800" />
            </tr>
          </tbody>
        </table>
      </section>

      <section className="grid grid-cols-2 gap-x-6 gap-y-3 border-y border-dashed border-gray-300 py-6 text-xs sm:grid-cols-3">
        <PrintDetail
          label={translate("Total Material Cost", "إجمالي تكلفة المواد")}
          value={formatMoney(totals.totalMaterialCost, translation.currency)}
        />
        <PrintDetail
          label={translate("Total Outsourcing Cost", "إجمالي تكلفة التصنيع خارجيًا")}
          value={formatMoney(totals.totalManufacturingCost, translation.currency)}
        />
        <PrintDetail
          label={translate("Grand Total Cost", "إجمالي التكلفة الكلية")}
          value={formatMoney(totals.grandTotalCost, translation.currency)}
        />
      </section>
    </div>
  );
}

function ShareCell({ value, className }: { value: number; className?: string }) {
  return (
    <td>
      <div className="flex items-center gap-1.5">
        <div className="h-1 w-10 overflow-hidden rounded-full bg-gray-200">
          <div className="h-full rounded-full bg-teal-600" style={{ width: `${Math.min(value, 100)}%` }} />
        </div>
        <span className={className}>{value.toFixed(1)}%</span>
      </div>
    </td>
  );
}
