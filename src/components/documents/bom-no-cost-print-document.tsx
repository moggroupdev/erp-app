import type { Bom } from "@/types/bom";
import { getMaterialUnitLabel } from "@/lib/constants/enums/material-units";
import { getProductionSubDepartmentLabel } from "@/lib/constants/enums/production-sub-departments";
import { getMmSourcingTypeLabel } from "@/lib/constants/enums/mm-sourcing-types";
import { type FlattenedBomRow, type ManufacturingCostRow } from "@/lib/helpers/bom-display";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { formatDimensionLabel } from "@/lib/helpers/format-dimension-label";
import { formatQuantity } from "@/lib/helpers/format-quantity";
import { useI18n } from "@/lib/i18n/hooks";
import { PrintDetail, PrintSectionHeading } from "./components";

export type BomNoCostDepartmentGroup = {
  departmentId: string;
  title: string;
  itemCount: number;
  items: FlattenedBomRow[];
};

type BomNoCostPrintDocumentProps = {
  bom: Bom;
  departmentBreakdown: BomNoCostDepartmentGroup[];
  manufacturingRows: ManufacturingCostRow[];
  mainCategoryTitle: string | null;
  totalItemCount: number;
};

export default function BomNoCostPrintDocument({
  bom,
  departmentBreakdown,
  manufacturingRows,
  mainCategoryTitle,
  totalItemCount,
}: BomNoCostPrintDocumentProps) {
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
            <span>{translate("Without Costs", "بدون تكاليف")}</span>
            <span> - </span>
            <span className="font-mono text-xs">{bom.product.code}</span>
          </p>
          <h1 className="text-2xl font-semibold">{bom.product.title}</h1>
          <p className="text-[10px] text-gray-500">{printedAt}</p>
        </div>

        <img src={logoSrc} alt="" width={60} height={60} className="h-[60px] w-[60px] shrink-0 rounded object-contain" />
      </header>

      <section className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs sm:grid-cols-3">
        <PrintDetail label={translate("Dimension", "المقاس")} value={dimensionLabel} />
        <PrintDetail
          label={translate("Product Category", "فئة المنتج")}
          value={mainCategoryTitle || translate("Uncategorized", "غير مصنف")}
        />
        <PrintDetail label={translate("Items Count", "عدد البنود")} value={String(totalItemCount)} />
      </section>

      <hr className="border-gray-300" />

      <section className="flex flex-col gap-8">
        {departmentBreakdown.map((group) => (
          <div key={group.departmentId} className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">{group.title}</h3>

            <table className="w-full table-fixed border-collapse text-[7.5px] [&_td]:px-1.5 [&_td]:py-1.5 [&_th]:px-1.5 [&_th]:py-1.5">
              <thead>
                <tr className="border-b border-gray-300 bg-gray-50 text-[7px] font-medium tracking-wide text-gray-500 uppercase">
                  <th className="w-[14%] text-start whitespace-nowrap">{translate("Material Code", "كود")}</th>
                  <th className="w-[36%] text-start whitespace-nowrap">{translate("Material Name", "الصنف")}</th>
                  <th className="w-[10%] text-start whitespace-nowrap">{translate("Unit", "الوحدة")}</th>
                  <th className="w-[10%] text-start whitespace-nowrap">{translate("Quantity", "الكمية")}</th>
                  <th className="w-[30%] text-start whitespace-nowrap">{translate("Notes", "الملاحظات")}</th>
                </tr>
              </thead>
              <tbody>
                {group.items.map((item) => {
                  const enteredUnit = item.unitOfMeasurementSelected ?? item.material.unitOfMeasurement;

                  return (
                    <tr key={item.id} className="border-b border-gray-200">
                      <td className="font-mono text-gray-600">{item.material.code}</td>
                      <td className="font-medium wrap-break-word text-gray-800">{item.material.title}</td>
                      <td>{getMaterialUnitLabel(enteredUnit, locale)}</td>
                      <td>{formatQuantity(item.quantityRequired)}</td>
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
                  <td colSpan={4} className="text-gray-600">
                    {group.itemCount} {translate("Items", "بند")}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}
      </section>

      {manufacturingRows.length > 0 && (
        <section className="mt-6 flex flex-col gap-2.5 border-y border-dashed border-gray-300 py-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold">{translate("Manufactured Materials", "المواد المصنعة")}</h2>
            <p className="text-[10px] text-gray-500">
              {translate(
                "Internally and externally manufactured materials.",
                "المواد المصنعة داخلياً وخارجياً.",
              )}
            </p>
          </div>
          <table className="w-full border-collapse text-[7.5px] [&_td]:px-1.5 [&_td]:py-1.5 [&_th]:px-1.5 [&_th]:py-1.5">
            <thead>
              <tr className="border-b border-gray-300 bg-gray-50 text-start text-[7px] font-medium tracking-wide text-gray-500 uppercase">
                <th className="text-start whitespace-nowrap">{translate("Material Code", "كود المادة")}</th>
                <th className="text-start whitespace-nowrap">{translate("Material Name", "اسم المادة")}</th>
                <th className="text-start whitespace-nowrap">{translate("Manufacturing Source", "مصدر التصنيع")}</th>
                <th className="text-start whitespace-nowrap">
                  {translate("Production Department", "قسم الانتاج")}
                </th>
                <th className="text-start whitespace-nowrap">{translate("Quantity", "الكمية")}</th>
              </tr>
            </thead>
            <tbody>
              {manufacturingRows.map((row) => (
                <tr key={row.id} className="border-b border-gray-200">
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
                </tr>
              ))}
              <tr className="border-t border-gray-300 bg-gray-50 font-medium">
                <td>{translate("Total", "الإجمالي")}</td>
                <td colSpan={4} className="text-gray-600">
                  {manufacturingRows.length} {translate("Items", "بند")}
                </td>
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
            </tr>
          </thead>
          <tbody>
            {departmentBreakdown.map((group) => (
              <tr key={group.departmentId} className="border-b border-gray-200">
                <td className="font-medium">{group.title}</td>
                <td>{group.itemCount}</td>
              </tr>
            ))}
            <tr className="border-t border-gray-300 bg-gray-50 font-medium">
              <td>{translate("Total", "الإجمالي")}</td>
              <td className="text-gray-600">
                {totalItemCount} {translate("Items", "بند")}
              </td>
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
