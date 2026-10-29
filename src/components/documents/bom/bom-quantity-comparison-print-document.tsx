import type { Bom } from "@/types/bom";
import { getMaterialUnitLabel } from "@/lib/constants/enums/material-units";
import {
  getCostingMethodLabel,
  getItemCostingMethodShortLabel,
  type CostingMethod,
  type ItemCostingMethod,
} from "@/lib/constants/enums/derived/costing-methods";
import { getProductionSubDepartmentLabel } from "@/lib/constants/enums/production-sub-departments";
import { getMmSourcingTypeLabel, isInternallyManufacturedMmSourcing } from "@/lib/constants/enums/mm-sourcing-types";
import {
  getMaterialCostPrice,
  getQuantityComparisonManufacturingRowCost,
  getQuantityComparisonRowLineCost,
  getRowCostingMethod,
  getRowManufacturingCostingMethod,
  type BomQuantityComparisonManufacturingRow,
  type BomQuantityComparisonRow,
} from "@/lib/helpers/bom-display";
import type { ManufacturingCostingMethod } from "@/lib/constants/enums/derived/manufacturing-costing-methods";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { formatDimensionLabel } from "@/lib/helpers/format-dimension-label";
import { formatMoney } from "@/lib/helpers/format-money";
import { formatQuantity } from "@/lib/helpers/format-quantity";
import { resolveDisplayUnit, toDisplayUnitPrice } from "@/lib/helpers/unit-conversion";
import { useI18n } from "@/lib/i18n/hooks";
import { PrintDetail, PrintSectionHeading } from "../components";

const ZERO_VALUE_CLASS = "text-ochre-600";
/** Column lines only. Logical inline-end drops the outer edge in both RTL and LTR. */
const TABLE_CELL_CLASS =
  "[&_td]:border-e-[0.5px] [&_td]:border-gray-300 [&_td]:px-1 [&_td]:py-1 [&_th]:border-e-[0.5px] [&_th]:border-gray-300 [&_th]:px-1 [&_th]:py-1 [&_tr>*:last-child]:!border-e-0";

export type BomQuantityComparisonDepartmentGroup = {
  departmentId: string;
  title: string;
  itemCount: number;
  items: BomQuantityComparisonRow[];
};

type BomQuantityComparisonPrintDocumentProps = {
  bom: Bom;
  departmentBreakdown: BomQuantityComparisonDepartmentGroup[];
  manufacturingRows: BomQuantityComparisonManufacturingRow[];
  mainCategoryTitle: string | null;
  costingMethod: CostingMethod;
  itemCostingOverrides?: Record<string, ItemCostingMethod>;
  manufacturingCostingOverrides?: Record<string, ManufacturingCostingMethod>;
};

function sumPresent(values: Array<number | null>): number {
  return values.reduce<number>((sum, value) => (value == null ? sum : sum + value), 0);
}

function quantityDifference(oldQuantity: number | null, newQuantity: number): number | null {
  if (oldQuantity == null) return null;
  return newQuantity - oldQuantity;
}

function moneyDifference(oldTotal: number | null, newTotal: number | null): number | null {
  if (oldTotal == null || newTotal == null) return null;
  return newTotal - oldTotal;
}

export default function BomQuantityComparisonPrintDocument({
  bom,
  departmentBreakdown,
  manufacturingRows,
  mainCategoryTitle,
  costingMethod,
  itemCostingOverrides,
  manufacturingCostingOverrides,
}: BomQuantityComparisonPrintDocumentProps) {
  const { locale, translate, translation } = useI18n();

  const dimensionLabel = formatDimensionLabel(bom, translation.productDimensionUnit);
  const logoSrc = typeof window !== "undefined" ? `${window.location.origin}/images/logo.png` : "/images/logo.png";
  const printedAt = formatDateAndTime(new Date(), locale);
  const totalItemCount = departmentBreakdown.reduce((sum, group) => sum + group.itemCount, 0);

  const departmentMoney = departmentBreakdown.map((group) => {
    const oldTotals = group.items.map((item) =>
      getQuantityComparisonRowLineCost(
        item,
        "old",
        getRowCostingMethod(item.id, costingMethod, itemCostingOverrides),
      ),
    );
    const newTotals = group.items.map((item) =>
      getQuantityComparisonRowLineCost(
        item,
        "new",
        getRowCostingMethod(item.id, costingMethod, itemCostingOverrides),
      ),
    );
    const diffs = group.items.map((_, index) => moneyDifference(oldTotals[index], newTotals[index]));

    return {
      oldTotal: sumPresent(oldTotals),
      newTotal: sumPresent(newTotals),
      difference: sumPresent(diffs),
    };
  });

  const oldMaterialCost = sumPresent(departmentMoney.map((group) => group.oldTotal));
  const newMaterialCost = sumPresent(departmentMoney.map((group) => group.newTotal));
  const materialCostDifference = sumPresent(departmentMoney.map((group) => group.difference));

  const manufacturingMoney = manufacturingRows.map((row) => {
    const isInternal = isInternallyManufacturedMmSourcing(row.sourceBomItem.mmSourcingType);
    if (isInternal) {
      return { oldTotal: null as number | null, newTotal: null as number | null, difference: null as number | null };
    }

    const method = getRowManufacturingCostingMethod(row.id, manufacturingCostingOverrides);
    const oldTotal = getQuantityComparisonManufacturingRowCost(row, "old", method);
    const newTotal = getQuantityComparisonManufacturingRowCost(row, "new", method);

    return {
      oldTotal,
      newTotal,
      difference: moneyDifference(oldTotal, newTotal),
    };
  });

  const oldManufacturingCost = sumPresent(manufacturingMoney.map((row) => row.oldTotal));
  const newManufacturingCost = sumPresent(manufacturingMoney.map((row) => row.newTotal));
  const manufacturingCostDifference = sumPresent(manufacturingMoney.map((row) => row.difference));

  const oldGrandTotal = oldMaterialCost + oldManufacturingCost;
  const newGrandTotal = newMaterialCost + newManufacturingCost;
  const grandTotalDifference = materialCostDifference + manufacturingCostDifference;

  return (
    <div className="flex flex-col gap-4 text-xs text-gray-900">
      <header className="flex items-start justify-between gap-4 border-b border-gray-300 pb-3">
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-medium tracking-wide text-gray-500 uppercase">
            <span>{translate("Bill of Materials", "قائمة المواد")}</span>
            <span> - </span>
            <span>{translate("Quantity Comparison", "مقارنة الكميات")}</span>
            <span> - </span>
            <span className="font-mono text-xs">{bom.product.code}</span>
          </p>
          <h1 className="text-xl font-semibold">{bom.product.title}</h1>
          <p className="text-[10px] text-gray-500">{printedAt}</p>
        </div>

        <img src={logoSrc} alt="" width={52} height={52} className="h-[52px] w-[52px] shrink-0 rounded object-contain" />
      </header>

      <section className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs sm:grid-cols-4">
        <PrintDetail label={translate("Dimension", "المقاس")} value={dimensionLabel} />
        <PrintDetail
          label={translate("Product Category", "فئة المنتج")}
          value={mainCategoryTitle || translate("Uncategorized", "غير مصنف")}
        />
        <PrintDetail label={translate("Items Count", "عدد البنود")} value={String(totalItemCount)} />
        <PrintDetail
          label={translate("Costing Basis", "أساس التكلفة")}
          value={getCostingMethodLabel(costingMethod, locale)}
        />
      </section>

      <hr className="border-gray-300" />

      <section className="flex flex-col gap-6">
        {departmentBreakdown.map((group, groupIndex) => {
          const money = departmentMoney[groupIndex];

          return (
            <div key={group.departmentId} className="flex flex-col gap-1.5">
              <h3 className="text-sm font-semibold">{group.title}</h3>

              <table className={`w-full table-fixed border-separate border-spacing-0 text-[6.5px] ${TABLE_CELL_CLASS} [&_tr]:break-inside-avoid [&_td]:break-inside-avoid [&_td]:border-b [&_td]:border-gray-200 [&_th]:border-b [&_th]:border-gray-300`}>
                <thead className="break-inside-avoid">
                  <tr className="bg-gray-50 text-[6px] font-medium tracking-wide text-gray-500 uppercase">
                    <th className="w-[8%] text-start whitespace-nowrap">{translate("Material Code", "كود")}</th>
                    <th className="w-[18%] text-start whitespace-nowrap">{translate("Material Name", "الصنف")}</th>
                    <th className="w-[6%] text-start whitespace-nowrap">{translate("Unit", "الوحدة")}</th>
                    <th className="w-[9%] text-start whitespace-nowrap">
                      {translate(`Unit Price (${translation.currency})`, `سعر الوحدة (${translation.currency})`)}
                    </th>
                    <th className="w-[8%] text-start whitespace-nowrap">{translate("Old Quantity", "الكمية القديمة")}</th>
                    <th className="w-[8%] text-start whitespace-nowrap">{translate("New Quantity", "الكمية الجديدة")}</th>
                    <th className="w-[8%] text-start whitespace-nowrap">
                      {translate("Quantity Difference", "فرق الكمية")}
                    </th>
                    <th className="w-[11%] text-start whitespace-nowrap">
                      {translate(`Old Total (${translation.currency})`, `الإجمالي القديم (${translation.currency})`)}
                    </th>
                    <th className="w-[12%] text-start whitespace-nowrap">
                      {translate(`New Total (${translation.currency})`, `الإجمالي الجديد (${translation.currency})`)}
                    </th>
                    <th className="w-[12%] text-start whitespace-nowrap">
                      {translate(`Total Difference (${translation.currency})`, `فرق الإجمالي (${translation.currency})`)}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {group.items.map((item) => {
                    const enteredUnit = item.unitOfMeasurementSelected ?? item.material.unitOfMeasurement;
                    const method = getRowCostingMethod(item.id, costingMethod, itemCostingOverrides);
                    const unitCost = getMaterialCostPrice(item.material, method);
                    const { factor } = resolveDisplayUnit(
                      enteredUnit,
                      item.material.unitOfMeasurement,
                      item.material.unitConversions,
                    );
                    const oldTotal = getQuantityComparisonRowLineCost(item, "old", method);
                    const newTotal = getQuantityComparisonRowLineCost(item, "new", method);
                    const hasOverride = method !== costingMethod;

                    return (
                      <tr key={item.id} className="break-inside-avoid bg-white">
                        <td className="font-mono text-gray-600">{item.material.code}</td>
                        <td className="font-medium wrap-break-word text-gray-800">
                          <div className="flex break-inside-avoid flex-col gap-0.5 leading-relaxed">
                            <span className="inline-flex flex-wrap items-center gap-1">
                              <span>{item.material.title}</span>
                              {item.noLongerUsed && <NoLongerUsedBadge label={translate("No longer used", "لم يعد مستخدماً")} />}
                            </span>
                            {item.parentManufacturedMaterialTitle && (
                              <span className="inline-block w-full break-inside-avoid text-[5.5px] leading-tight text-gray-500">
                                {translate("Required for", "مطلوب لـ")}:{" "}
                                <span className="font-medium text-gray-800">{item.parentManufacturedMaterialTitle}</span>
                              </span>
                            )}
                          </div>
                        </td>
                        <td>{getMaterialUnitLabel(enteredUnit, locale)}</td>
                        <td className={unitCost === 0 ? ZERO_VALUE_CLASS : undefined}>
                          <span className="inline-flex flex-wrap items-center gap-1">
                            <span>{formatMoney(toDisplayUnitPrice(unitCost, factor))}</span>
                            {hasOverride && (
                              <span className="rounded-full bg-teal-100 px-1 py-px text-[5px] font-semibold tracking-wide text-teal-700 uppercase">
                                {getItemCostingMethodShortLabel(method, locale)}
                              </span>
                            )}
                          </span>
                        </td>
                        <QuantityCell value={item.oldQuantity} />
                        <td>{formatQuantity(item.newQuantity)}</td>
                        <DifferenceCell value={quantityDifference(item.oldQuantity, item.newQuantity)} kind="quantity" />
                        <MoneyCell value={oldTotal} />
                        <MoneyCell value={newTotal} />
                        <DifferenceCell value={moneyDifference(oldTotal, newTotal)} kind="money" />
                      </tr>
                    );
                  })}
                  <tr className="break-inside-avoid bg-gray-50 font-medium">
                    <td>{translate("Total", "الإجمالي")}</td>
                    <td colSpan={6} className="text-gray-600">
                      {group.itemCount} {translate("Items", "بند")}
                    </td>
                    <td>{formatMoney(money.oldTotal)}</td>
                    <td>{formatMoney(money.newTotal)}</td>
                    <DifferenceCell value={money.difference} kind="money" />
                  </tr>
                </tbody>
              </table>
            </div>
          );
        })}
      </section>

      {manufacturingRows.length > 0 && (
        <section className="mt-4 flex flex-col gap-2 border-y border-dashed border-gray-300 py-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-semibold">{translate("Manufactured Materials", "المواد المصنعة")}</h2>
            <p className="text-[9px] text-gray-500">
              {translate(
                "Internally and externally manufactured materials.",
                "المواد المصنعة داخلياً وخارجياً.",
              )}
            </p>
          </div>
          <table className={`w-full table-fixed border-collapse text-[6.5px] ${TABLE_CELL_CLASS}`}>
            <thead>
              <tr className="border-b border-gray-300 bg-gray-50 text-start text-[6px] font-medium tracking-wide text-gray-500 uppercase">
                <th className="w-[10%] text-start whitespace-nowrap">{translate("Material Code", "كود المادة")}</th>
                <th className="w-[16%] text-start whitespace-nowrap">{translate("Material Name", "اسم المادة")}</th>
                <th className="w-[10%] text-start whitespace-nowrap">{translate("Manufacturing Source", "مصدر التصنيع")}</th>
                <th className="w-[10%] text-start whitespace-nowrap">{translate("Production Department", "قسم الانتاج")}</th>
                <th className="w-[8%] text-start whitespace-nowrap">{translate("Old Quantity", "الكمية القديمة")}</th>
                <th className="w-[8%] text-start whitespace-nowrap">{translate("New Quantity", "الكمية الجديدة")}</th>
                <th className="w-[8%] text-start whitespace-nowrap">{translate("Quantity Difference", "فرق الكمية")}</th>
                <th className="w-[10%] text-start whitespace-nowrap">
                  {translate(`Old Total (${translation.currency})`, `الإجمالي القديم (${translation.currency})`)}
                </th>
                <th className="w-[10%] text-start whitespace-nowrap">
                  {translate(`New Total (${translation.currency})`, `الإجمالي الجديد (${translation.currency})`)}
                </th>
                <th className="w-[10%] text-start whitespace-nowrap">
                  {translate(`Total Difference (${translation.currency})`, `فرق الإجمالي (${translation.currency})`)}
                </th>
              </tr>
            </thead>
            <tbody>
              {manufacturingRows.map((row, rowIndex) => {
                const money = manufacturingMoney[rowIndex];
                const isInternal = isInternallyManufacturedMmSourcing(row.sourceBomItem.mmSourcingType);

                return (
                  <tr key={row.id} className="border-b border-gray-200">
                    <td className="font-mono text-gray-600">{row.materialCode}</td>
                    <td className="font-medium wrap-break-word">
                      <span className="inline-flex flex-wrap items-center gap-1">
                        <span>{row.materialTitle}</span>
                        {row.sourceBomItem.noLongerUsed && (
                          <NoLongerUsedBadge label={translate("No longer used", "لم يعد مستخدماً")} />
                        )}
                      </span>
                    </td>
                    <td className="text-gray-600">
                      {row.sourceBomItem.mmSourcingType
                        ? getMmSourcingTypeLabel(row.sourceBomItem.mmSourcingType, locale)
                        : "-"}
                    </td>
                    <td className="text-gray-600">
                      {row.productionSubDepartment
                        ? getProductionSubDepartmentLabel(row.productionSubDepartment, locale)
                        : "-"}
                    </td>
                    <QuantityCell value={row.oldQuantity} />
                    <td>{formatQuantity(row.newQuantity)}</td>
                    <DifferenceCell value={quantityDifference(row.oldQuantity, row.newQuantity)} kind="quantity" />
                    {isInternal ? (
                      <>
                        <td>-</td>
                        <td>-</td>
                        <td>-</td>
                      </>
                    ) : (
                      <>
                        <MoneyCell value={money.oldTotal} />
                        <MoneyCell value={money.newTotal} />
                        <DifferenceCell value={money.difference} kind="money" />
                      </>
                    )}
                  </tr>
                );
              })}
              <tr className="border-t border-gray-300 bg-gray-50 font-medium">
                <td>{translate("Total", "الإجمالي")}</td>
                <td colSpan={6} className="text-gray-600">
                  {manufacturingRows.length} {translate("Items", "بند")}
                </td>
                <td>{formatMoney(oldManufacturingCost)}</td>
                <td>{formatMoney(newManufacturingCost)}</td>
                <DifferenceCell value={manufacturingCostDifference} kind="money" />
              </tr>
            </tbody>
          </table>
        </section>
      )}

      <section className="mt-4 flex flex-col gap-2">
        <h2 className="text-sm font-semibold">{translate("Departments Summary", "ملخص الأقسام")}</h2>
        <table className={`w-full table-fixed border-collapse text-[6.5px] ${TABLE_CELL_CLASS}`}>
          <thead>
            <tr className="border-b border-gray-300 bg-gray-50 text-start text-[6px] font-medium tracking-wide text-gray-500 uppercase">
              <th className="w-[40%] text-start whitespace-nowrap">{translate("Production Department", "قسم الانتاج")}</th>
              <th className="w-[12%] text-start whitespace-nowrap">{translate("Items Count", "عدد البنود")}</th>
              <th className="w-[16%] text-start whitespace-nowrap">
                {translate(`Old Total (${translation.currency})`, `الإجمالي القديم (${translation.currency})`)}
              </th>
              <th className="w-[16%] text-start whitespace-nowrap">
                {translate(`New Total (${translation.currency})`, `الإجمالي الجديد (${translation.currency})`)}
              </th>
              <th className="w-[16%] text-start whitespace-nowrap">
                {translate(`Total Difference (${translation.currency})`, `فرق الإجمالي (${translation.currency})`)}
              </th>
            </tr>
          </thead>
          <tbody>
            {departmentBreakdown.map((group, groupIndex) => {
              const money = departmentMoney[groupIndex];

              return (
                <tr key={group.departmentId} className="border-b border-gray-200">
                  <td className="font-medium">{group.title}</td>
                  <td>{group.itemCount}</td>
                  <td>{formatMoney(money.oldTotal)}</td>
                  <td>{formatMoney(money.newTotal)}</td>
                  <DifferenceCell value={money.difference} kind="money" />
                </tr>
              );
            })}
            <tr className="border-t border-gray-300 bg-gray-50 font-medium">
              <td>{translate("Total", "الإجمالي")}</td>
              <td className="text-gray-600">
                {totalItemCount} {translate("Items", "بند")}
              </td>
              <td>{formatMoney(oldMaterialCost)}</td>
              <td>{formatMoney(newMaterialCost)}</td>
              <DifferenceCell value={materialCostDifference} kind="money" />
            </tr>
          </tbody>
        </table>
      </section>

      <section className="mt-2 flex flex-col gap-2">
        <h2 className="text-sm font-semibold">{translate("Cost Comparison", "مقارنة التكلفة")}</h2>
        <table className={`w-full table-fixed border-collapse text-[6.5px] ${TABLE_CELL_CLASS}`}>
          <thead>
            <tr className="border-b border-gray-300 bg-gray-50 text-start text-[6px] font-medium tracking-wide text-gray-500 uppercase">
              <th className="w-[40%] text-start whitespace-nowrap">{translate("Cost", "التكلفة")}</th>
              <th className="w-[20%] text-start whitespace-nowrap">
                {translate(`Old (${translation.currency})`, `القديم (${translation.currency})`)}
              </th>
              <th className="w-[20%] text-start whitespace-nowrap">
                {translate(`New (${translation.currency})`, `الجديد (${translation.currency})`)}
              </th>
              <th className="w-[20%] text-start whitespace-nowrap">
                {translate(`Difference (${translation.currency})`, `الفرق (${translation.currency})`)}
              </th>
            </tr>
          </thead>
          <tbody>
            <CostComparisonRow
              label={translate("Total Material Cost", "إجمالي تكلفة المواد")}
              oldTotal={oldMaterialCost}
              newTotal={newMaterialCost}
              difference={materialCostDifference}
            />
            <CostComparisonRow
              label={translate("Total Outsourcing Cost", "إجمالي تكلفة التصنيع خارجيًا")}
              oldTotal={oldManufacturingCost}
              newTotal={newManufacturingCost}
              difference={manufacturingCostDifference}
            />
            <tr className="border-t border-gray-300 bg-gray-50 font-medium">
              <td>{translate("Grand Total Cost", "إجمالي التكلفة الكلية")}</td>
              <td>{formatMoney(oldGrandTotal)}</td>
              <td>{formatMoney(newGrandTotal)}</td>
              <DifferenceCell value={grandTotalDifference} kind="money" />
            </tr>
          </tbody>
        </table>
      </section>

      {bom.notes ? (
        <section className="flex flex-col gap-1.5">
          <PrintSectionHeading title={translate("Notes", "ملاحظات")} />
          <p className="text-[11px] leading-relaxed whitespace-pre-wrap text-gray-800">{bom.notes}</p>
        </section>
      ) : null}
    </div>
  );
}

function QuantityCell({ value }: { value: number | null }) {
  return <td>{value == null ? "-" : formatQuantity(value)}</td>;
}

function MoneyCell({ value }: { value: number | null }) {
  return <td>{value == null ? "-" : formatMoney(value)}</td>;
}

function differenceClassName(value: number): string {
  if (value > 0) return "font-bold text-teal-700";
  if (value < 0) return "font-bold text-clay-700";
  return "font-bold text-gray-800";
}

function DifferenceCell({ value, kind }: { value: number | null; kind: "quantity" | "money" }) {
  if (value == null) return <td>-</td>;

  return (
    <td className={differenceClassName(value)}>
      {kind === "quantity" ? formatQuantity(value) : formatMoney(value)}
    </td>
  );
}

function NoLongerUsedBadge({ label }: { label: string }) {
  return (
    <span className="rounded-sm bg-ochre-100 px-0.5 py-0 text-[4.5px] leading-none font-semibold whitespace-nowrap text-ochre-700">
      {label}
    </span>
  );
}

function CostComparisonRow({
  label,
  oldTotal,
  newTotal,
  difference,
}: {
  label: string;
  oldTotal: number;
  newTotal: number;
  difference: number;
}) {
  return (
    <tr className="border-b border-gray-200">
      <td className="font-medium">{label}</td>
      <td>{formatMoney(oldTotal)}</td>
      <td>{formatMoney(newTotal)}</td>
      <DifferenceCell value={difference} kind="money" />
    </tr>
  );
}
