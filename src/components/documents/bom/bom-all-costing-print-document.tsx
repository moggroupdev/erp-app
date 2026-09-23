import type { Bom } from "@/types/bom";
import { getMaterialUnitLabel } from "@/lib/constants/enums/material-units";
import {
  getItemCostingMethodShortLabel,
  ITEM_COSTING_METHODS,
  type ItemCostingMethod,
} from "@/lib/constants/enums/derived/costing-methods";
import { getProductionSubDepartmentLabel } from "@/lib/constants/enums/production-sub-departments";
import { getMmSourcingTypeLabel, isInternallyManufacturedMmSourcing } from "@/lib/constants/enums/mm-sourcing-types";
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
import { PrintDetail, PrintSectionHeading } from "../components";

const ZERO_VALUE_CLASS = "text-orange-500";
/** Internal grid lines only — no outer table frame. Uses logical inline-end so RTL/LTR both work. */
const TABLE_CELL_CLASS =
  "[&_td]:border-e [&_td]:border-b [&_td]:border-gray-300 [&_td]:px-1 [&_td]:py-1 [&_th]:border-e [&_th]:border-b [&_th]:border-gray-300 [&_th]:px-1 [&_th]:py-1 [&_tr>*:last-child]:border-e-0 [&_tbody>tr:last-child>*]:border-b-0";

const COSTING_COLUMNS: ItemCostingMethod[] = [
  ITEM_COSTING_METHODS.AVERAGE_PRICE,
  ITEM_COSTING_METHODS.LAST_PURCHASE_PRICE,
  ITEM_COSTING_METHODS.MARKET_PRICE,
];

export type BomAllCostingDepartmentGroup = {
  departmentId: string;
  title: string;
  itemCount: number;
  items: FlattenedBomRow[];
};

type BomAllCostingPrintDocumentProps = {
  bom: Bom;
  departmentBreakdown: BomAllCostingDepartmentGroup[];
  manufacturingRows: ManufacturingCostRow[];
  mainCategoryTitle: string | null;
  totalManufacturingCost: number;
  manufacturingItemCount: number;
  itemCount: number;
};

function sumLineCosts(items: FlattenedBomRow[], method: ItemCostingMethod) {
  return items.reduce((sum, item) => sum + getFlattenedRowLineCost(item, method), 0);
}

export default function BomAllCostingPrintDocument({
  bom,
  departmentBreakdown,
  manufacturingRows,
  mainCategoryTitle,
  totalManufacturingCost,
  manufacturingItemCount,
  itemCount,
}: BomAllCostingPrintDocumentProps) {
  const { locale, translate, translation } = useI18n();

  const dimensionLabel = formatDimensionLabel(bom, translation.productDimensionUnit);
  const logoSrc = typeof window !== "undefined" ? `${window.location.origin}/images/logo.png` : "/images/logo.png";
  const printedAt = formatDateAndTime(new Date(), locale);

  const materialTotals = Object.fromEntries(
    COSTING_COLUMNS.map((method) => [
      method,
      departmentBreakdown.reduce((sum, group) => sum + sumLineCosts(group.items, method), 0),
    ]),
  ) as Record<ItemCostingMethod, number>;

  const grandTotals = Object.fromEntries(
    COSTING_COLUMNS.map((method) => [method, materialTotals[method] + totalManufacturingCost]),
  ) as Record<ItemCostingMethod, number>;

  return (
    <div className="flex flex-col gap-4 text-xs text-gray-900">
      <header className="flex items-start justify-between gap-4 border-b border-gray-300 pb-3">
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-medium tracking-wide text-gray-500 uppercase">
            <span>{translate("Bill of Materials", "قائمة المواد")}</span>
            <span> - </span>
            <span>{translate("All Costing Methods", "كل أسس التكلفة")}</span>
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
        <PrintDetail label={translate("Items Count", "عدد البنود")} value={String(itemCount)} />
        <PrintDetail
          label={translate("Costing Comparison", "مقارنة التكلفة")}
          value={translate("Average / Last Price / Market", "متوسط / آخر سعر / سوق")}
        />
      </section>

      <hr className="border-gray-300" />

      <section className="flex flex-col gap-6">
        {departmentBreakdown.map((group) => {
          const groupTotals = Object.fromEntries(
            COSTING_COLUMNS.map((method) => [method, sumLineCosts(group.items, method)]),
          ) as Record<ItemCostingMethod, number>;

          return (
            <div key={group.departmentId} className="flex flex-col gap-1.5">
              <h3 className="text-sm font-semibold">{group.title}</h3>

              <table className={`w-full table-fixed border-collapse text-[6.5px] ${TABLE_CELL_CLASS}`}>
                <thead>
                  <tr className="bg-gray-50 text-[6px] font-medium tracking-wide text-gray-500 uppercase">
                    <th className="w-[8%] text-start whitespace-nowrap">{translate("Code", "كود")}</th>
                    <th className="w-[18%] text-start whitespace-nowrap">{translate("Material Name", "الصنف")}</th>
                    <th className="w-[5%] text-start whitespace-nowrap">{translate("Unit", "الوحدة")}</th>
                    <th className="w-[5%] text-start whitespace-nowrap">{translate("Quantity", "الكمية")}</th>
                    <th className="w-[8%] text-start whitespace-nowrap">
                      {translate("Unit Price (Average)", "سعر الوحدة (متوسط)")}
                    </th>
                    <th className="w-[8%] text-start whitespace-nowrap">
                      {translate("Total (Average)", "الإجمالي (متوسط)")}
                    </th>
                    <th className="w-[8%] text-start whitespace-nowrap">
                      {translate("Unit Price (Last Price)", "سعر الوحدة (آخر سعر)")}
                    </th>
                    <th className="w-[8%] text-start whitespace-nowrap">
                      {translate("Total (Last Price)", "الإجمالي (آخر سعر)")}
                    </th>
                    <th className="w-[8%] text-start whitespace-nowrap">
                      {translate("Unit Price (Market)", "سعر الوحدة (سوق)")}
                    </th>
                    <th className="w-[8%] text-start whitespace-nowrap">{translate("Total (Market)", "الإجمالي (سوق)")}</th>
                    <th className="w-[8%] text-start whitespace-nowrap">{translate("Notes", "الملاحظات")}</th>
                  </tr>
                </thead>
                <tbody>
                  {group.items.map((item) => {
                    const enteredUnit = item.unitOfMeasurementSelected ?? item.material.unitOfMeasurement;
                    const { factor } = resolveDisplayUnit(
                      enteredUnit,
                      item.material.unitOfMeasurement,
                      item.material.unitConversions,
                    );

                    const prices = Object.fromEntries(
                      COSTING_COLUMNS.map((method) => {
                        const unitCost = getMaterialCostPrice(item.material, method);
                        const lineCost = getFlattenedRowLineCost(item, method);
                        return [
                          method,
                          {
                            unitCost: toDisplayUnitPrice(unitCost, factor),
                            lineCost,
                          },
                        ];
                      }),
                    ) as Record<ItemCostingMethod, { unitCost: number; lineCost: number }>;

                    return (
                      <tr key={item.id}>
                        <td className="font-mono text-gray-600">{item.material.code}</td>
                        <td className="font-medium wrap-break-word text-gray-800">{item.material.title}</td>
                        <td>{getMaterialUnitLabel(enteredUnit, locale)}</td>
                        <td>{formatQuantity(item.quantityRequired)}</td>
                        {COSTING_COLUMNS.map((method) => (
                          <CostCells key={method} unitCost={prices[method].unitCost} lineCost={prices[method].lineCost} />
                        ))}
                        <td className="wrap-break-word text-gray-600">
                          <div className="flex flex-col gap-0.5 leading-relaxed">
                            {item.notes ? <span>{item.notes}</span> : null}
                            {item.parentManufacturedMaterialTitle && (
                              <span className="text-[5.5px] text-gray-500">
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
                  <tr className="bg-gray-50 font-medium">
                    <td>{translate("Total", "الإجمالي")}</td>
                    <td colSpan={3} className="text-gray-600">
                      {group.itemCount} {translate("Items", "بند")}
                    </td>
                    {COSTING_COLUMNS.map((method) => (
                      <FooterTotalCells
                        key={method}
                        total={groupTotals[method]}
                        methodLabel={getItemCostingMethodShortLabel(method, locale)}
                      />
                    ))}
                    <td />
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
                "Manufacturing cost is independent of material costing methods.",
                "تكلفة التصنيع مستقلة عن أسس تكلفة المواد.",
              )}
            </p>
          </div>
          <table className={`w-full border-collapse text-[6.5px] ${TABLE_CELL_CLASS}`}>
            <thead>
              <tr className="bg-gray-50 text-start text-[6px] font-medium tracking-wide text-gray-500 uppercase">
                <th className="text-start whitespace-nowrap">{translate("Material Code", "كود المادة")}</th>
                <th className="text-start whitespace-nowrap">{translate("Material Name", "اسم المادة")}</th>
                <th className="text-start whitespace-nowrap">{translate("Manufacturing Source", "مصدر التصنيع")}</th>
                <th className="text-start whitespace-nowrap">{translate("Production Department", "قسم الانتاج")}</th>
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
                <tr key={row.id}>
                  <td className="font-mono text-gray-600">{row.materialCode}</td>
                  <td className="font-medium whitespace-nowrap">{row.materialTitle}</td>
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
                  <td>{formatQuantity(row.quantityRequired)}</td>
                  <td
                    className={
                      isInternallyManufacturedMmSourcing(row.sourceBomItem.mmSourcingType)
                        ? undefined
                        : row.unitManufacturingCost === 0
                          ? ZERO_VALUE_CLASS
                          : undefined
                    }
                  >
                    {isInternallyManufacturedMmSourcing(row.sourceBomItem.mmSourcingType)
                      ? "-"
                      : formatMoney(row.unitManufacturingCost)}
                  </td>
                  <td
                    className={
                      isInternallyManufacturedMmSourcing(row.sourceBomItem.mmSourcingType)
                        ? "font-medium"
                        : row.totalManufacturingCost === 0
                          ? `font-medium ${ZERO_VALUE_CLASS}`
                          : "font-medium"
                    }
                  >
                    {isInternallyManufacturedMmSourcing(row.sourceBomItem.mmSourcingType)
                      ? "-"
                      : formatMoney(row.totalManufacturingCost)}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-medium">
                <td>{translate("Total", "الإجمالي")}</td>
                <td colSpan={5} className="text-gray-600">
                  {manufacturingItemCount} {translate("Items", "بند")}
                </td>
                <td className={totalManufacturingCost === 0 ? ZERO_VALUE_CLASS : undefined}>
                  {formatMoney(totalManufacturingCost)}
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      )}

      <section className="mt-4 flex flex-col gap-2">
        <h2 className="text-sm font-semibold">{translate("Costing Summary", "ملخص التكلفة")}</h2>
        <table className={`w-full border-collapse text-[6.5px] ${TABLE_CELL_CLASS}`}>
          <thead>
            <tr className="bg-gray-50 text-start text-[6px] font-medium tracking-wide text-gray-500 uppercase">
              <th className="text-start whitespace-nowrap">{translate("Basis", "الأساس")}</th>
              <th className="text-start whitespace-nowrap">
                {translate(`Total Material Cost (${translation.currency})`, `إجمالي تكلفة المواد (${translation.currency})`)}
              </th>
              <th className="text-start whitespace-nowrap">
                {translate(
                  `Total Outsourcing Cost (${translation.currency})`,
                  `إجمالي تكلفة التصنيع خارجيًا (${translation.currency})`,
                )}
              </th>
              <th className="text-start whitespace-nowrap">
                {translate(`Grand Total Cost (${translation.currency})`, `إجمالي التكلفة الكلية (${translation.currency})`)}
              </th>
            </tr>
          </thead>
          <tbody>
            {COSTING_COLUMNS.map((method) => (
              <tr key={method}>
                <td className="font-medium">{getItemCostingMethodShortLabel(method, locale)}</td>
                <td className={materialTotals[method] === 0 ? ZERO_VALUE_CLASS : undefined}>
                  {formatMoney(materialTotals[method])}
                </td>
                <td className={totalManufacturingCost === 0 ? ZERO_VALUE_CLASS : undefined}>
                  {formatMoney(totalManufacturingCost)}
                </td>
                <td className={grandTotals[method] === 0 ? `font-medium ${ZERO_VALUE_CLASS}` : "font-medium"}>
                  {formatMoney(grandTotals[method])}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <p className="text-[9px] leading-relaxed text-gray-500">
        <span className="font-medium text-gray-700">{translate("Note", "ملاحظة")}: </span>
        {translate(
          "Market price is entered manually for each material. All amounts in this document are in Egyptian Pounds (EGP).",
          "سعر السوق يُدخل يدويًا لكل مادة. جميع المبالغ في هذا المستند بالجنيه المصري.",
        )}
      </p>

      {bom.notes ? (
        <section className="flex flex-col gap-1.5">
          <PrintSectionHeading title={translate("Notes", "ملاحظات")} />
          <p className="text-[11px] leading-relaxed whitespace-pre-wrap text-gray-800">{bom.notes}</p>
        </section>
      ) : null}
    </div>
  );
}

function CostCells({ unitCost, lineCost }: { unitCost: number; lineCost: number }) {
  return (
    <>
      <td className={unitCost === 0 ? ZERO_VALUE_CLASS : undefined}>{formatMoney(unitCost)}</td>
      <td className={lineCost === 0 ? `font-medium ${ZERO_VALUE_CLASS}` : "font-medium"}>{formatMoney(lineCost)}</td>
    </>
  );
}

function FooterTotalCells({ total, methodLabel }: { total: number; methodLabel: string }) {
  return (
    <>
      <td />
      <td className={total === 0 ? ZERO_VALUE_CLASS : undefined}>
        {formatMoney(total)}
        <span className="ms-1 text-[5px] font-normal tracking-wide text-gray-500 uppercase">({methodLabel})</span>
      </td>
    </>
  );
}
