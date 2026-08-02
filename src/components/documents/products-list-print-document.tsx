import { useI18n } from "@/lib/i18n/hooks";
import { PrintSectionHeading, PrintTable } from "./components";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { formatDimensionLabel } from "@/lib/helpers/format-dimension-label";
import { getProductSourceTypeLabel } from "@/lib/constants/enums/product-source-types";
import type { ProductWithDimensions } from "@/types/product";
import type { ProductCategoryMain, ProductCategorySub } from "@/types/categories";
import type { ReactNode } from "react";

export default function ProductsListPrintDocument({
  products,
  mainCategories,
  getSubCategory,
}: {
  products: ProductWithDimensions[];
  mainCategories: ProductCategoryMain[];
  getSubCategory: (id: string) => ProductCategorySub | null;
}) {
  const { locale, translate, translation } = useI18n();
  const logoSrc = typeof window !== "undefined" ? `${window.location.origin}/images/logo.png` : "/images/logo.png";
  const printedAt = formatDateAndTime(new Date(), locale);

  // Group products by main category
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

  // Products with no matching main category
  const categorizedCodes = new Set(groups.flatMap((g) => g.products.map((p) => p.code)));
  for (const p of products) {
    if (!categorizedCodes.has(p.code)) uncategorized.push(p);
  }

  const headers = [
    translate("Code", "الكود"),
    translate("Product Name", "اسم المنتج"),
    translate("Source Type", "نوع المصدر"),
    translate("Standard Dimension", "الأبعاد النمطية"),
  ];

  function productRows(list: ProductWithDimensions[]): ReactNode[][] {
    return list.map((p) => {
      const defaultDimension = p.dimensions.find((dimension) => dimension.isDefault) ?? null;
      return [
        p.code,
        p.title,
        getProductSourceTypeLabel(p.sourceType, locale),
        defaultDimension
          ? formatDimensionLabel(defaultDimension, translation.productDimensionUnit)
          : "-",
      ];
    });
  }

  return (
    <div className="flex flex-col gap-5 p-3 text-xs text-gray-900">
      <header className="flex items-start justify-between gap-4 border-b border-gray-300 pb-4">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-[10px] font-medium tracking-wide text-gray-500 uppercase">
            {translate("Products List", "قائمة المنتجات")}
          </p>
          <h1 className="text-2xl font-semibold">{translate("All Products", "جميع المنتجات")}</h1>
          <p className="text-[10px] text-gray-500">{printedAt}</p>
        </div>
        <img src={logoSrc} alt="" width={60} height={60} className="h-[60px] w-[60px] shrink-0 rounded object-contain" />
      </header>

      {groups.map((group) => (
        <section key={group.mainCategory.id} className="mb-4 space-y-2.5">
          <div className="w-full break-after-avoid rounded-md bg-gray-100 px-3 py-2 text-center">
            <h2 className="text-sm font-semibold text-gray-900">
              {group.mainCategory.title}
              <span className="ms-2 text-xs font-normal text-gray-600">({group.products.length})</span>
            </h2>
          </div>
          <PrintTable
            headers={headers}
            rows={productRows(group.products)}
            monoColumnIndexes={[0]}
            noWrapIndexes={[0, 2, 3]}
            tableClassName="break-before-avoid text-[9px]"
            emptyLabel={translate("No products", "لا توجد منتجات")}
          />
        </section>
      ))}

      {uncategorized.length > 0 && (
        <section className="mb-4 space-y-2.5">
          <div className="break-after-avoid">
            <PrintSectionHeading
              title={
                <>
                  {translate("Uncategorized", "غير مصنف")}
                  <span className="ms-2 text-xs font-normal text-gray-500">({uncategorized.length})</span>
                </>
              }
            />
          </div>
          <PrintTable
            headers={headers}
            rows={productRows(uncategorized)}
            monoColumnIndexes={[0]}
            noWrapIndexes={[0, 2, 3]}
            tableClassName="break-before-avoid text-[9px]"
            emptyLabel={translate("No products", "لا توجد منتجات")}
          />
        </section>
      )}
    </div>
  );
}
