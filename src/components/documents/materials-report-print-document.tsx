import { useI18n } from "@/lib/i18n/hooks";
import { PrintDetail, PrintSectionHeading, PrintTable } from "./components";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { formatMoney } from "@/lib/helpers/format-money";
import { getMaterialTypeLabel } from "@/lib/constants/enums/material-types";
import { getMaterialUnitLabel } from "@/lib/constants/enums/material-units";
import { getStockStatusLabel } from "@/lib/constants/enums/derived/stock-statuses";
import type {
  MaterialsInventoryByMaterialType,
  MaterialsInventoryLowStockMaterial,
  MaterialsInventoryOverview,
  MaterialsInventoryStockStatus,
  MaterialsInventoryTopMaterial,
} from "@/types/reports";

type CategoryRow = { id: string; title: string; count: number; totalValue: number };

export default function MaterialsReportPrintDocument({
  title,
  scopeLabel,
  overview,
  byMaterialType,
  stockStatus,
  categoryRows,
  categoryLevel,
  topMaterialsByValue,
  topMaterialsByQuantity,
  lowStockMaterials,
}: {
  title: string;
  scopeLabel?: string | null;
  overview: MaterialsInventoryOverview;
  byMaterialType: MaterialsInventoryByMaterialType[];
  stockStatus: MaterialsInventoryStockStatus[];
  categoryRows: CategoryRow[];
  categoryLevel: "main" | "sub";
  topMaterialsByValue: MaterialsInventoryTopMaterial[];
  topMaterialsByQuantity: MaterialsInventoryTopMaterial[];
  lowStockMaterials: MaterialsInventoryLowStockMaterial[];
}) {
  const { locale, translate, translation } = useI18n();
  const currency = translation.currency;
  const logoSrc = typeof window !== "undefined" ? `${window.location.origin}/images/logo.png` : "/images/logo.png";
  const printedAt = formatDateAndTime(new Date(), locale);

  const categorySectionTitle =
    categoryLevel === "main"
      ? translate("Value by Main Category", "القيمة حسب الفئة الرئيسية")
      : translate("Value by Subcategory", "القيمة حسب الفئة الفرعية");

  const categoryColumnLabel =
    categoryLevel === "main" ? translate("Category", "الفئة") : translate("Subcategory", "الفئة الفرعية");
  const totalCategoryCount = categoryRows.reduce((sum, row) => sum + row.count, 0);
  const totalCategoryValue = categoryRows.reduce((sum, row) => sum + row.totalValue, 0);
  const percentageFormatter = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="flex flex-col gap-5 p-3 text-xs text-gray-900">
      <header className="flex items-start justify-between gap-4 border-b border-gray-300 pb-4">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-[10px] font-medium tracking-wide text-gray-500 uppercase">
            {translate("Materials Report", "تقرير المواد")}
          </p>
          <h1 className="text-2xl font-semibold">
            {title}
            {scopeLabel && <span> - {scopeLabel}</span>}
          </h1>
          <p className="text-[10px] text-gray-500">{printedAt}</p>
        </div>
        <img src={logoSrc} alt="" width={60} height={60} className="h-[60px] w-[60px] shrink-0 rounded object-contain" />
      </header>

      <section className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs sm:grid-cols-3">
        <PrintDetail
          label={translate("Total Inventory Value", "إجمالي قيمة المخزون")}
          value={formatMoney(overview.totalInventoryValue, currency)}
        />
        <PrintDetail
          label={translate("Total Registered Materials", "إجمالي عدد المواد المسجلة")}
          value={String(overview.totalMaterials)}
        />
      </section>

      <hr className="border-gray-300" />

      <section className="flex break-inside-avoid flex-col gap-2.5">
        <PrintSectionHeading
          title={translate("Inventory by Type", "المخزون حسب النوع")}
          subtitle={translate(
            "Inventory value split between raw materials and spare parts.",
            "قيمة المخزون موزعة بين المواد الخام وقطع الغيار.",
          )}
        />
        <PrintTable
          headers={[
            translate("Type", "النوع"),
            translate("Items", "العناصر"),
            translate("Quantity", "الكمية"),
            translate(`Value (${translation.currency})`, `القيمة (${translation.currency})`),
          ]}
          rows={byMaterialType.map((row) => [
            getMaterialTypeLabel(row.materialType, locale),
            String(row.count),
            String(row.totalQuantity),
            formatMoney(row.totalValue),
          ])}
          emptyLabel={translate("No data available", "لا توجد بيانات")}
        />
      </section>

      <section className="flex break-inside-avoid flex-col gap-2.5">
        <PrintSectionHeading
          title={translate("Stock Status Distribution", "توزيع حالة المخزون")}
          subtitle={translate(
            "Materials grouped by quantity vs. minimum stock level.",
            "المواد مصنّفة حسب الكمية مقارنةً بحد الطلب.",
          )}
        />
        <PrintTable
          headers={[
            translate("Status", "الحالة"),
            translate("Items", "العناصر"),
            translate(`Value (${translation.currency})`, `القيمة (${translation.currency})`),
          ]}
          rows={stockStatus.map((row) => [
            getStockStatusLabel(row.status, locale),
            String(row.count),
            formatMoney(row.totalValue),
          ])}
          emptyLabel={translate("No data available", "لا توجد بيانات")}
        />
        {overview.noMinimumStockCount > 0 && (
          <p className="rounded-lg bg-amber-50 px-2.5 py-2 text-[10px] text-amber-800">
            {translate(
              `${overview.noMinimumStockCount} material(s) have no minimum stock level set.`,
              `هناك عدد ${overview.noMinimumStockCount} من المواد لم يتم تعيين حد أدنى طلب لها.`,
            )}
          </p>
        )}
      </section>

      <section className="flex break-inside-avoid flex-col gap-2.5">
        <PrintSectionHeading
          title={
            <>
              {categorySectionTitle}
              <span className="ms-2 text-xs font-normal text-gray-500">({categoryRows.length})</span>
            </>
          }
          subtitle={
            categoryLevel === "main"
              ? translate(
                  "Inventory value by main material category, highest value first.",
                  "قيمة المخزون حسب الفئة الرئيسية، الأعلى قيمة أولاً.",
                )
              : translate(
                  "Inventory value by subcategory within the selected main category.",
                  "قيمة المخزون حسب الفئة الفرعية ضمن الفئة الرئيسية المحددة.",
                )
          }
        />
        <PrintTable
          headers={[
            "#",
            categoryColumnLabel,
            translate("Items", "العناصر"),
            translate(`Total Value (${translation.currency})`, `القيمة الإجمالية (${translation.currency})`),
            translate("Percentage", "النسبة"),
          ]}
          rows={categoryRows.map((row, index) => [
            String(index + 1),
            row.title,
            String(row.count),
            formatMoney(row.totalValue),
            `${percentageFormatter.format(totalCategoryValue === 0 ? 0 : (row.totalValue / totalCategoryValue) * 100)}%`,
          ])}
          footerRow={[
            "",
            translate("Total", "الإجمالي"),
            String(totalCategoryCount),
            formatMoney(totalCategoryValue),
            `${percentageFormatter.format(categoryRows.length === 0 ? 0 : 100)}%`,
          ]}
          emptyLabel={translate("No data available", "لا توجد بيانات")}
        />
      </section>

      <section className="flex break-inside-avoid flex-col gap-2.5">
        <PrintSectionHeading
          title={
            <>
              {translate("Highest-Value Materials", "أعلى المواد قيمة")}
              <span className="ms-2 text-xs font-normal text-gray-500">({topMaterialsByValue.length})</span>
            </>
          }
          subtitle={translate("Largest inventory value (quantity × unit price).", "أكبر قيمة مخزون (الكمية × سعر الوحدة).")}
        />
        <PrintTable
          headers={[
            "#",
            translate("Item Name", "اسم الصنف"),
            translate("Code", "الكود"),
            translate("Unit", "الوحدة"),
            translate("Qty", "الكمية"),
            translate(`Unit Price (${translation.currency})`, `سعر الوحدة (${translation.currency})`),
            translate(`Total (${translation.currency})`, `الإجمالي (${translation.currency})`),
          ]}
          rows={topMaterialsByValue.map((material, index) => [
            String(index + 1),
            material.title,
            material.code,
            getMaterialUnitLabel(material.unitOfMeasurement, locale),
            String(material.quantity),
            formatMoney(material.unitPrice),
            formatMoney(material.value),
          ])}
          monoColumnIndexes={[2]}
          emptyLabel={translate("No data available", "لا توجد بيانات")}
        />
      </section>

      <section className="flex break-inside-avoid flex-col gap-2.5">
        <PrintSectionHeading
          title={
            <>
              {translate("Highest-Quantity Materials", "أعلى المواد كمية")}
              <span className="ms-2 text-xs font-normal text-gray-500">({topMaterialsByQuantity.length})</span>
            </>
          }
          subtitle={translate("Largest on-hand quantity.", "أكبر كمية متوفرة في المخزون.")}
        />
        <PrintTable
          headers={[
            "#",
            translate("Item Name", "اسم الصنف"),
            translate("Code", "الكود"),
            translate("Unit", "الوحدة"),
            translate("Qty", "الكمية"),
            translate(`Unit Price (${translation.currency})`, `سعر الوحدة (${translation.currency})`),
            translate(`Total (${translation.currency})`, `الإجمالي (${translation.currency})`),
          ]}
          rows={topMaterialsByQuantity.map((material, index) => [
            String(index + 1),
            material.title,
            material.code,
            getMaterialUnitLabel(material.unitOfMeasurement, locale),
            String(material.quantity),
            formatMoney(material.unitPrice),
            formatMoney(material.value),
          ])}
          monoColumnIndexes={[2]}
          emptyLabel={translate("No data available", "لا توجد بيانات")}
        />
      </section>

      <section className="flex break-inside-avoid flex-col gap-2.5">
        <PrintSectionHeading
          title={
            <>
              {translate("Materials Below Minimum", "مواد دون حد الطلب")}
              <span className="ms-2 text-xs font-normal text-gray-500">({lowStockMaterials.length})</span>
            </>
          }
        />
        {lowStockMaterials.length === 0 ? (
          <p className="text-[10px] text-gray-500">
            {translate(
              "All materials with a minimum stock level are currently above their threshold.",
              "جميع المواد التي لها حد أدنى للمخزون تقع حالياً فوق العتبة المحددة.",
            )}
          </p>
        ) : (
          <PrintTable
            headers={[
              translate("Title", "العنوان"),
              translate("Code", "الكود"),
              translate("Qty", "الكمية"),
              translate("Minimum", "حد الطلب"),
              translate("Deficit", "العجز"),
            ]}
            rows={lowStockMaterials.map((material) => [
              material.title,
              material.code,
              String(material.quantity),
              String(material.minimumStock),
              String(material.deficit),
            ])}
            monoColumnIndexes={[1]}
            emptyLabel={translate("No data available", "لا توجد بيانات")}
          />
        )}
      </section>
    </div>
  );
}
