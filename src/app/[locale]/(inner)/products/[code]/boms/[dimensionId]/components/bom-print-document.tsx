import type { Bom, BomItemWithMaterial } from "@/types/bom";
import { getDimensionUnitLabel } from "@/lib/constants/enums/dimension-units";
import { getMaterialUnitLabel } from "@/lib/constants/enums/material-units";
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

      <section className="flex flex-col gap-2.5">
        <h2 className="text-base font-semibold">
          {translate("Cost by Category", "التكلفة حسب الفئة")}
          <span className="ms-2 text-xs font-normal text-gray-500">({categoryBreakdown.length})</span>
        </h2>
        <table className="w-full border-collapse text-[10px]">
          <thead>
            <tr className="border-b border-gray-300 bg-gray-50 text-start text-[9px] font-medium tracking-wide text-gray-500 uppercase">
              <th className="px-2.5 py-2 text-start">{translate("Category", "الفئة")}</th>
              <th className="px-2.5 py-2 text-start">{translate("Items", "البنود")}</th>
              <th className="px-2.5 py-2 text-start">{translate("Cost", "التكلفة")}</th>
              <th className="px-2.5 py-2 text-start">{translate("Share", "الحصة")}</th>
            </tr>
          </thead>
          <tbody>
            {categoryBreakdown.map((group) => (
              <tr key={group.mainCategoryId} className="border-b border-gray-200">
                <td className="px-2.5 py-2 font-medium">{group.title}</td>
                <td className="px-2.5 py-2">{group.itemCount}</td>
                <td className="px-2.5 py-2">{formatMoney(group.totalCost, translation.currency)}</td>
                <td className="px-2.5 py-2">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-14 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-teal-600"
                        style={{ width: `${Math.min(group.sharePercent, 100)}%` }}
                      />
                    </div>
                    <span>{group.sharePercent.toFixed(1)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="flex flex-col gap-4">
        {categoryBreakdown.map((group, index) => (
          <div key={group.mainCategoryId} className="flex break-inside-avoid flex-col gap-2">
            {index === 0 && (
              <h2 className="break-after-avoid text-base font-semibold">
                {translate("BOM Items", "بنود قائمة المواد")}
                <span className="ms-2 text-xs font-normal text-gray-500">({totals.itemCount})</span>
              </h2>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-baseline gap-2 text-xs">
                <h3 className="text-sm font-semibold">{group.title}</h3>
                <span className="text-gray-500">
                  {formatMoney(group.totalCost, translation.currency)} · {group.sharePercent.toFixed(1)}%
                </span>
              </div>

              <span className="rounded-lg bg-gray-100 px-1.5 py-[2.5px] text-[7.5px]! text-gray-600">
                {group.itemCount} {translate("Items", "بنود")}
              </span>
            </div>

            <table className="w-full border-collapse text-[10px]">
              <thead>
                <tr className="border-b border-gray-300 bg-gray-50 text-[9px] font-medium tracking-wide text-gray-500 uppercase">
                  <th className="px-2.5 py-2 text-start">{translate("Material Code", "كود المادة")}</th>
                  <th className="px-2.5 py-2 text-start">{translate("Material Name", "اسم المادة")}</th>
                  <th className="px-2.5 py-2 text-start">{translate("Unit", "الوحدة")}</th>
                  <th className="px-2.5 py-2 text-start">{translate("Quantity", "الكمية")}</th>
                  <th className="px-2.5 py-2 text-start">{translate("Unit Price", "سعر الوحدة")}</th>
                  <th className="px-2.5 py-2 text-start">{translate("Total", "الإجمالي")}</th>
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
                      <td className="px-2.5 py-2">{formatMoney(item.material.unitPrice, translation.currency)}</td>
                      <td className="px-2.5 py-2 font-medium">{formatMoney(lineCost, translation.currency)}</td>
                      <td className="px-2.5 py-2 text-gray-600">{item.notes || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </section>

      <footer className="mt-2 border-t border-gray-300 pt-2.5 text-[10px] text-gray-500">
        {translate("Printed at", "تاريخ الطباعة")}:{" "}
        {new Date().toLocaleString(locale === "ar" ? "ar-EG" : "en-US", { dateStyle: "full" })}
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
