import type { Bom, BomItemWithMaterial } from "@/types/bom";
import { getDimensionUnitLabel } from "@/lib/constants/enums/dimension-units";
import { getMaterialUnitLabel } from "@/lib/constants/enums/material-units";
import { formatDate } from "@/lib/helpers/date-formaters";
import { formatMoney } from "@/lib/helpers/format-money";
import { useI18n } from "@/lib/i18n/hooks";

export type BomPrintCategoryGroup = {
  mainCategoryId: string;
  title: string;
  itemCount: number;
  totalCost: number;
  sharePercent: number;
  items: BomItemWithMaterial[];
};

type BomPrintDocumentProps = {
  bom: Bom;
  categoryBreakdown: BomPrintCategoryGroup[];
  totals: { totalMaterialCost: number; estimatedUnitPrice: number; itemCount: number };
  mainCategoryTitle: string | null;
};

export default function BomPrintDocument({ bom, categoryBreakdown, totals, mainCategoryTitle }: BomPrintDocumentProps) {
  const { locale, translate, translation } = useI18n();

  const dimensionLabel = `${bom.length} × ${bom.depth} × ${bom.height} ${getDimensionUnitLabel(bom.dimensionUnit, locale)}`;
  const logoSrc = typeof window !== "undefined" ? `${window.location.origin}/images/logo.png` : "/images/logo.png";
  const printedAt = formatDate(new Date(), locale);

  return (
    <div className="flex flex-col gap-5 p-3 text-xs text-gray-900">
      <header className="flex items-start justify-between gap-4 border-b border-gray-300 pb-4">
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-medium tracking-wide text-gray-500 uppercase">
            {translate("Bill of Materials", "قائمة المواد")}
          </p>
          <h1 className="text-2xl font-semibold">{bom.product.title}</h1>
          <p className="font-mono text-[11px] text-gray-600">{bom.product.code}</p>
        </div>

        <img src={logoSrc} alt="" width={60} height={60} className="h-[60px] w-[60px] shrink-0 rounded object-contain" />
      </header>

      <section className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs sm:grid-cols-3">
        <Detail label={translate("Dimension", "المقاس")} value={dimensionLabel} />
        <Detail
          label={translate("Product Category", "فئة المنتج")}
          value={mainCategoryTitle || translate("Uncategorized", "غير مصنف")}
        />
        <Detail
          label={translate("Total Material Cost", "إجمالي تكلفة المواد")}
          value={formatMoney(totals.totalMaterialCost, translation.currency)}
        />
      </section>

      <hr className="border-gray-300" />

      <section className="flex flex-col gap-8">
        {categoryBreakdown.map((group) => (
          <div key={group.mainCategoryId} className="flex break-inside-avoid flex-col gap-2">
            <h3 className="text-sm font-semibold">{group.title}</h3>

            <table className="w-full border-collapse text-[10px]">
              <thead>
                <tr className="border-b border-gray-300 bg-gray-50 text-[9px] font-medium tracking-wide text-gray-500 uppercase">
                  <th className="px-2.5 py-2 text-start">{translate("Material Code", "كود المادة")}</th>
                  <th className="px-2.5 py-2 text-start">{translate("Material Name", "اسم المادة")}</th>
                  <th className="px-2.5 py-2 text-start">{translate("Unit", "الوحدة")}</th>
                  <th className="px-2.5 py-2 text-start">{translate("Quantity", "الكمية")}</th>
                  <th className="px-2.5 py-2 text-start">
                    {translate(`Unit Price (${translation.currency})`, `سعر الوحدة (${translation.currency})`)}
                  </th>
                  <th className="px-2.5 py-2 text-start">
                    {translate(`Total (${translation.currency})`, `الإجمالي (${translation.currency})`)}
                  </th>
                  <th className="px-2.5 py-2 text-start">{translate("Notes", "الملاحظات")}</th>
                </tr>
              </thead>
              <tbody>
                {group.items.map((item) => {
                  const lineCost = item.quantityRequired * item.material.unitPrice;
                  return (
                    <tr key={item.id} className="border-b border-gray-200">
                      <td className="px-2.5 py-2 font-mono text-[10px] text-gray-600">{item.material.code}</td>
                      <td className="px-2.5 py-2 font-medium">{item.material.title}</td>
                      <td className="px-2.5 py-2">{getMaterialUnitLabel(item.material.unitOfMeasurement, locale)}</td>
                      <td className="px-2.5 py-2">{item.quantityRequired}</td>
                      <td className="px-2.5 py-2">{formatMoney(item.material.unitPrice)}</td>
                      <td className="px-2.5 py-2 font-medium">{formatMoney(lineCost)}</td>
                      <td className="px-2.5 py-2 text-gray-600">{item.notes || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-300 bg-gray-50 font-medium">
                  <td className="px-2.5 py-2">{translate("Total", "الإجمالي")}</td>
                  <td colSpan={4} className="px-2.5 py-2 text-gray-600">
                    {group.itemCount} {translate("Items", "بند")}
                  </td>
                  <td className="px-2.5 py-2">{formatMoney(group.totalCost)}</td>
                  <td className="px-2.5 py-2 text-gray-600">{group.sharePercent.toFixed(1)}%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        ))}
      </section>

      <section className="mt-8 flex break-inside-avoid flex-col gap-2.5">
        <h2 className="text-base font-semibold">{translate("Summary", "الملخص")}</h2>
        <table className="w-full border-collapse break-inside-avoid text-[10px]">
          <thead>
            <tr className="border-b border-gray-300 bg-gray-50 text-start text-[9px] font-medium tracking-wide text-gray-500 uppercase">
              <th className="px-2.5 py-2 text-start">{translate("Category", "الفئة")}</th>
              <th className="px-2.5 py-2 text-start">{translate("Items Count", "عدد البنود")}</th>
              <th className="px-2.5 py-2 text-start">
                {translate(`Total Price (${translation.currency})`, `السعر الإجمالي (${translation.currency})`)}
              </th>
              <th className="px-2.5 py-2 text-start">{translate("Share", "الحصة")}</th>
            </tr>
          </thead>
          <tbody>
            {categoryBreakdown.map((group) => (
              <tr key={group.mainCategoryId} className="border-b border-gray-200">
                <td className="px-2.5 py-2 font-medium">{group.title}</td>
                <td className="px-2.5 py-2">{group.itemCount}</td>
                <td className="px-2.5 py-2">{formatMoney(group.totalCost)}</td>
                <ShareCell value={group.sharePercent} />
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-gray-300 bg-gray-50 font-medium">
              <td className="px-2.5 py-2">{translate("Total", "الإجمالي")}</td>
              <td className="px-2.5 py-2 text-gray-600">
                {totals.itemCount} {translate("Items", "بند")}
              </td>
              <td className="px-2.5 py-2">{formatMoney(totals.totalMaterialCost)}</td>
              <ShareCell value={100} className="text-gray-800" />
            </tr>
          </tfoot>
        </table>
      </section>

      <footer className="mt-2 border-t border-gray-300 pt-2.5 text-[10px] text-gray-500">
        {translate("Printed on", "تاريخ الطباعة")} {printedAt}
      </footer>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-gray-500">{label}</span>
      <span className="text-xs font-medium">{value}</span>
    </div>
  );
}

function ShareCell({ value, className }: { value: number; className?: string }) {
  return (
    <td className="px-2.5 py-2">
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-14 overflow-hidden rounded-full bg-gray-200">
          <div className="h-full rounded-full bg-teal-600" style={{ width: `${Math.min(value, 100)}%` }} />
        </div>
        <span className={className}>{value.toFixed(1)}%</span>
      </div>
    </td>
  );
}
