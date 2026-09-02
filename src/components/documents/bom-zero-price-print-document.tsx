import type { Bom } from "@/types/bom";
import { getMaterialUnitLabel } from "@/lib/constants/enums/material-units";
import { getCostingMethodLabel, type CostingMethod } from "@/lib/constants/enums/derived/costing-methods";
import { type FlattenedBomRow } from "@/lib/helpers/bom-display";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { formatDimensionLabel } from "@/lib/helpers/format-dimension-label";
import { useI18n } from "@/lib/i18n/hooks";
import { PrintDetail } from "./components";

export type BomZeroPriceDepartmentGroup = {
  departmentId: string;
  title: string;
  itemCount: number;
  items: FlattenedBomRow[];
};

type BomZeroPricePrintDocumentProps = {
  bom: Bom;
  departmentBreakdown: BomZeroPriceDepartmentGroup[];
  mainCategoryTitle: string | null;
  getMaterialMainCategoryTitle: (subCategoryId: string) => string;
  costingMethod: CostingMethod;
  totalItemCount: number;
};

export default function BomZeroPricePrintDocument({
  bom,
  departmentBreakdown,
  mainCategoryTitle,
  getMaterialMainCategoryTitle,
  costingMethod,
  totalItemCount,
}: BomZeroPricePrintDocumentProps) {
  const { locale, translate, translation } = useI18n();

  const dimensionLabel = formatDimensionLabel(bom, translation.productDimensionUnit);
  const logoSrc = typeof window !== "undefined" ? `${window.location.origin}/images/logo.png` : "/images/logo.png";
  const printedAt = formatDateAndTime(new Date(), locale);

  return (
    <div className="flex flex-col gap-5 text-xs text-gray-900">
      <header className="flex items-start justify-between gap-4 border-b border-gray-300 pb-4">
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-medium tracking-wide text-gray-500 uppercase">
            <span>{translate("Zero Unit Price Items", "بنود بدون سعر وحدة")}</span>
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
          label={translate("Costing Basis", "أساس التكلفة")}
          value={getCostingMethodLabel(costingMethod, locale)}
        />
        <PrintDetail label={translate("Items Count", "عدد البنود")} value={String(totalItemCount)} />
      </section>

      <hr className="border-gray-300" />

      {departmentBreakdown.length === 0 ? (
        <p className="text-sm text-gray-600">
          {translate("No items with zero unit price found.", "لا توجد بنود بسعر وحدة صفر.")}
        </p>
      ) : (
        <section className="flex flex-col gap-8">
          {departmentBreakdown.map((group) => (
            <div key={group.departmentId} className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold">{group.title}</h3>

              <table className="w-full table-fixed border-collapse text-[7.5px] [&_td]:px-1.5 [&_td]:py-1.5 [&_th]:px-1.5 [&_th]:py-1.5">
                <thead>
                  <tr className="border-b border-gray-300 bg-gray-50 text-[7px] font-medium tracking-wide text-gray-500 uppercase">
                    <th className="w-[18%] text-start whitespace-nowrap">{translate("Material Code", "كود")}</th>
                    <th className="w-[42%] text-start whitespace-nowrap">{translate("Material Name", "الصنف")}</th>
                    <th className="w-[24%] text-start whitespace-nowrap">{translate("Category", "الفئة")}</th>
                    <th className="w-[16%] text-start whitespace-nowrap">{translate("Unit", "الوحدة")}</th>
                  </tr>
                </thead>
                <tbody>
                  {group.items.map((item) => {
                    const enteredUnit = item.unitOfMeasurementSelected ?? item.material.unitOfMeasurement;

                    return (
                      <tr key={item.id} className="border-b border-gray-200">
                        <td className="font-mono text-gray-600">{item.material.code}</td>
                        <td className="font-medium wrap-break-word text-gray-800">{item.material.title}</td>
                        <td className="text-gray-600">
                          {getMaterialMainCategoryTitle(item.material.subCategoryId) || "-"}
                        </td>
                        <td>{getMaterialUnitLabel(enteredUnit, locale)}</td>
                      </tr>
                    );
                  })}
                  <tr className="border-t border-gray-300 bg-gray-50 font-medium">
                    <td>{translate("Total", "الإجمالي")}</td>
                    <td colSpan={3} className="text-gray-600">
                      {group.itemCount} {translate("Items", "بند")}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
