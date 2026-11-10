import { useI18n } from "@/lib/i18n/hooks";
import { PrintDetail, PrintSectionHeading } from "../components";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { formatDimensionLabelText } from "@/lib/helpers/format-dimension-label";
import {
  getProductionSubDepartmentLabel,
  type ProductionSubDepartment,
} from "@/lib/constants/enums/production-sub-departments";
import type { ProductWithDimensions, ProductDimension } from "@/types/product";
import type { ProductCategoryMain, ProductCategorySub } from "@/types/categories";

function countDimensions(list: ProductWithDimensions[]) {
  return list.reduce((sum, product) => sum + product.dimensions.length, 0);
}

function sortDimensions(dimensions: ProductDimension[]) {
  return [...dimensions].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
}

/**
 * Inner grid only. Uses logical inline-end so vertical rules stay between columns in RTL.
 * `bottomTone`: "strong" for product/header separators, "light" between dimensions of one product.
 */
function cellBorder({
  isLastCol,
  isLastRow,
  bottomTone = "strong",
}: {
  isLastCol: boolean;
  isLastRow: boolean;
  bottomTone?: "strong" | "light";
}) {
  return [
    "px-2 align-top",
    isLastCol ? "" : "border-e border-gray-300",
    isLastRow ? "" : bottomTone === "light" ? "border-b border-gray-200" : "border-b border-gray-300",
  ]
    .filter(Boolean)
    .join(" ");
}

type ProductBlock = {
  code: string;
  title: string;
  subcategory: string;
  dimensions: { key: string; label: string }[];
};

export default function DepartmentProductsPrintDocument({
  products,
  productionSubDepartment,
  mainCategories,
  getSubCategory,
  includeSubcategory = false,
  appliedFilters = [],
}: {
  products: ProductWithDimensions[];
  productionSubDepartment: ProductionSubDepartment;
  mainCategories: ProductCategoryMain[];
  getSubCategory: (id: string) => ProductCategorySub | null;
  includeSubcategory?: boolean;
  appliedFilters?: { label: string; value: string }[];
}) {
  const hasFilters = appliedFilters.length > 0;
  const { locale, translate, translation } = useI18n();
  const logoSrc = typeof window !== "undefined" ? `${window.location.origin}/images/logo.png` : "/images/logo.png";
  const printedAt = formatDateAndTime(new Date(), locale);
  const departmentLabel = getProductionSubDepartmentLabel(productionSubDepartment, locale);
  const totalDimensions = countDimensions(products);

  const groups: { mainCategory: ProductCategoryMain; products: ProductWithDimensions[] }[] = [];
  const uncategorized: ProductWithDimensions[] = [];

  for (const main of mainCategories) {
    const matched = products.filter((p) => {
      const sub = getSubCategory(p.subCategoryId);
      return sub?.mainCategoryId === main.id;
    });
    if (matched.length > 0) {
      groups.push({ mainCategory: main, products: matched });
    }
  }

  const categorizedCodes = new Set(groups.flatMap((g) => g.products.map((p) => p.code)));
  for (const p of products) {
    if (!categorizedCodes.has(p.code)) uncategorized.push(p);
  }

  const headers = [
    translate("Product", "المنتج"),
    ...(includeSubcategory ? [translate("Subcategory", "الفئة الفرعية")] : []),
    translate("Dimensions", "الأبعاد") + ` (${translation.productDimensionUnit})`,
    translate("Production time", "زمن الانتاج"),
  ];
  const lastColIndex = headers.length - 1;

  const columnWidths = includeSubcategory ? ["40%", "16%", "22%", "22%"] : ["48%", "26%", "26%"];

  function sortBySubcategoryThenName(list: ProductWithDimensions[]) {
    if (!includeSubcategory) return list;

    return [...list].sort((a, b) => {
      const aSubTitle = getSubCategory(a.subCategoryId)?.title ?? "";
      const bSubTitle = getSubCategory(b.subCategoryId)?.title ?? "";
      const bySubcategory = aSubTitle.localeCompare(bSubTitle, locale);
      if (bySubcategory !== 0) return bySubcategory;
      return a.title.localeCompare(b.title, locale);
    });
  }

  function buildBlocks(list: ProductWithDimensions[]): ProductBlock[] {
    return sortBySubcategoryThenName(list).map((product) => {
      const dimensions = sortDimensions(product.dimensions);
      return {
        code: product.code,
        title: product.title,
        subcategory: getSubCategory(product.subCategoryId)?.title ?? "-",
        dimensions:
          dimensions.length > 0
            ? dimensions.map((dimension) => ({
                key: `${product.code}-${dimension.id}`,
                label: formatDimensionLabelText(dimension),
              }))
            : [{ key: product.code, label: "-" }],
      };
    });
  }

  function renderCategoryTable(list: ProductWithDimensions[]) {
    const blocks = buildBlocks(list);

    if (blocks.length === 0) {
      return <p className="py-2 text-[10px] text-gray-500">{translate("No products", "لا توجد منتجات")}</p>;
    }

    return (
      <table className="w-full table-fixed border-collapse break-before-avoid text-[9px]">
        <colgroup>
          {columnWidths.map((width, index) => (
            <col key={index} style={{ width }} />
          ))}
        </colgroup>
        <thead className="break-inside-avoid break-after-avoid">
          <tr className="bg-gray-50 text-[9px] font-medium tracking-wide text-gray-500 uppercase">
            {headers.map((header, headerIndex) => (
              <th
                key={header}
                className={`${cellBorder({ isLastCol: headerIndex === lastColIndex, isLastRow: false })} py-1.5 text-start text-nowrap`}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {blocks.map((block) => {
            const rowSpan = block.dimensions.length;

            return block.dimensions.map((dimension, dimensionIndex) => {
              const isFirstDimension = dimensionIndex === 0;
              const isLastDimensionOfProduct = dimensionIndex === rowSpan - 1;
              const bottomTone = isLastDimensionOfProduct ? "strong" : "light";

              return (
                <tr key={dimension.key} className="break-inside-avoid">
                  {isFirstDimension && (
                    <td
                      rowSpan={rowSpan}
                      className={`${cellBorder({ isLastCol: false, isLastRow: false, bottomTone: "strong" })} py-1.5`}
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="inline-block leading-snug text-gray-900">{block.title}</span>
                        <span className="font-mono text-[8px] leading-tight text-gray-400">{block.code}</span>
                      </div>
                    </td>
                  )}
                  {isFirstDimension && includeSubcategory && (
                    <td
                      rowSpan={rowSpan}
                      className={`${cellBorder({ isLastCol: false, isLastRow: false, bottomTone: "strong" })} py-1.5`}
                    >
                      {block.subcategory}
                    </td>
                  )}
                  <td className={`${cellBorder({ isLastCol: false, isLastRow: false, bottomTone })} py-1.5`}>
                    {dimension.label}
                  </td>
                  <td className={`${cellBorder({ isLastCol: true, isLastRow: false, bottomTone })} py-1.5`}>&nbsp;</td>
                </tr>
              );
            });
          })}
          <tr className="break-inside-avoid bg-gray-50 font-semibold text-gray-700">
            <td className={`${cellBorder({ isLastCol: false, isLastRow: true })} py-1.5`}>
              {list.length} {translate("items", "منتج")}
            </td>
            {includeSubcategory && <td className={`${cellBorder({ isLastCol: false, isLastRow: true })} py-1.5`} />}
            <td className={`${cellBorder({ isLastCol: false, isLastRow: true })} py-1.5`}>
              {countDimensions(list)} {translate("dimensions", "مقاس")}
            </td>
            <td className={`${cellBorder({ isLastCol: true, isLastRow: true })} py-1.5`} />
          </tr>
        </tbody>
      </table>
    );
  }

  return (
    <div className="flex flex-col gap-5 text-xs text-gray-900">
      <header className="flex items-start justify-between gap-4 border-b border-gray-300 pb-4">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-[10px] font-medium tracking-wide text-gray-500 uppercase">
            {translate("Department Products Sheet", "ورقة منتجات القسم")}
          </p>
          <h1 className="text-2xl font-semibold">{departmentLabel}</h1>
          <p className="text-[10px] text-gray-500">
            {hasFilters ? translate("Selected Products", "المنتجات المحددة") : translate("All Products", "جميع المنتجات")}
            {" · "}
            {printedAt}
          </p>
          <div className="mt-2 flex max-w-xs items-end gap-2">
            <span className="shrink-0 text-[10px] text-gray-500">{translate("Workers", "عدد العمال")}</span>
            <span className="min-h-4 min-w-24 flex-1 border-b border-gray-400" />
          </div>
        </div>
        <img src={logoSrc} alt="" width={60} height={60} className="h-[60px] w-[60px] shrink-0 rounded object-contain" />
      </header>

      {hasFilters && (
        <>
          <section className="flex break-inside-avoid flex-col gap-2.5">
            <p className="text-[10px] font-semibold tracking-wide text-gray-500 uppercase">
              {translate("Applied filters", "الفلاتر المطبقة")}
            </p>
            <div
              className={`grid gap-x-6 gap-y-3 ${
                appliedFilters.length === 1
                  ? "grid-cols-1"
                  : appliedFilters.length === 2
                    ? "grid-cols-2"
                    : "grid-cols-2 sm:grid-cols-4"
              }`}
            >
              {appliedFilters.map((filter) => (
                <PrintDetail key={`${filter.label}-${filter.value}`} label={filter.label} value={filter.value} />
              ))}
            </div>
          </section>
          <hr className="border-gray-300" />
        </>
      )}

      {groups.map((group) => (
        <section key={group.mainCategory.id} className="mb-6 space-y-2.5">
          <div className="w-full break-after-avoid rounded-md bg-gray-100 px-3 py-2 text-center">
            <h2 className="text-sm font-semibold text-gray-900">{group.mainCategory.title}</h2>
          </div>
          {renderCategoryTable(group.products)}
        </section>
      ))}

      {uncategorized.length > 0 && (
        <section className="mb-4 space-y-2.5">
          <div className="break-after-avoid">
            <PrintSectionHeading title={translate("Uncategorized", "غير مصنف")} />
          </div>
          {renderCategoryTable(uncategorized)}
        </section>
      )}

      {products.length === 0 && (
        <p className="py-2 text-[10px] text-gray-500">{translate("No products", "لا توجد منتجات")}</p>
      )}

      <footer className="mt-1 flex break-inside-avoid items-center justify-between gap-4 border-t border-gray-300 pt-3 text-[10px] text-gray-700">
        <span className="font-semibold tracking-wide uppercase">{translate("Document Total", "إجمالي المستند")}</span>
        <div className="flex items-center gap-4">
          <span>
            <span className="font-semibold text-gray-900">{products.length}</span> {translate("items", "منتج")}
          </span>
          <span className="text-gray-300">|</span>
          <span>
            <span className="font-semibold text-gray-900">{totalDimensions}</span> {translate("dimensions", "مقاس")}
          </span>
        </div>
      </footer>
    </div>
  );
}
