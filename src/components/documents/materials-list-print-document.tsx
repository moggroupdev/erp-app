import { useI18n } from "@/lib/i18n/hooks";
import { PrintSectionHeading, PrintTable } from "./components";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { formatMoney } from "@/lib/helpers/format-money";
import { getMaterialUnitLabel } from "@/lib/constants/enums/material-units";
import type { Material } from "@/types/material";
import type { MaterialCategoryMain, MaterialCategorySub } from "@/types/categories";

export default function MaterialsListPrintDocument({
  materials,
  mainCategories,
  getSubCategory,
  heading,
  includeQuantityAndUnitPrice = true,
}: {
  materials: Material[];
  mainCategories: MaterialCategoryMain[];
  getSubCategory: (id: string) => MaterialCategorySub | null;
  heading?: string;
  includeQuantityAndUnitPrice?: boolean;
}) {
  const { locale, translate, translation } = useI18n();
  const currency = translation.currency;
  const logoSrc = typeof window !== "undefined" ? `${window.location.origin}/images/logo.png` : "/images/logo.png";
  const printedAt = formatDateAndTime(new Date(), locale);
  const documentHeading = heading ?? translate("All Materials", "جميع المواد");

  // Group materials by main category
  const groups: { mainCategory: MaterialCategoryMain; materials: Material[] }[] = [];
  const uncategorized: Material[] = [];

  for (const main of mainCategories) {
    const matched = materials.filter((m) => {
      const sub = getSubCategory(m.subCategoryId);
      return sub?.mainCategoryId === main.id;
    });
    if (matched.length > 0) {
      groups.push({ mainCategory: main, materials: matched });
    }
  }

  // Materials with no matching main category
  const categorizedCodes = new Set(groups.flatMap((g) => g.materials.map((m) => m.code)));
  for (const m of materials) {
    if (!categorizedCodes.has(m.code)) uncategorized.push(m);
  }

  const headers = [
    translate("Code", "الكود"),
    translate("Legacy Code", "الكود السابق"),
    translate("Material Name", "اسم المادة"),
    translate("Subcategory", "الفئة الفرعية"),
    translate("Unit", "الوحدة"),
    ...(includeQuantityAndUnitPrice
      ? [translate("Qty", "الكمية"), translate(`Unit Price (${currency})`, `سعر الوحدة (${currency})`)]
      : []),
  ];

  function sortMaterials(list: Material[]) {
    return [...list].sort((a, b) => {
      const aSubTitle = getSubCategory(a.subCategoryId)?.title ?? "";
      const bSubTitle = getSubCategory(b.subCategoryId)?.title ?? "";

      const bySubcategory = aSubTitle.localeCompare(bSubTitle, locale);
      if (bySubcategory !== 0) return bySubcategory;

      return a.title.localeCompare(b.title, locale);
    });
  }

  function materialRows(list: Material[]): string[][] {
    return sortMaterials(list).map((m) => [
      m.code,
      m.legacyCode || "-",
      m.title,
      getSubCategory(m.subCategoryId)?.title ?? "-",
      getMaterialUnitLabel(m.unitOfMeasurement, locale),
      ...(includeQuantityAndUnitPrice ? [String(m.quantity), formatMoney(m.unitPrice)] : []),
    ]);
  }

  const noWrapIndexes = includeQuantityAndUnitPrice ? [0, 1, 3, 4, 5, 6] : [0, 1, 3, 4];

  return (
    <div className="flex flex-col gap-5 p-3 text-xs text-gray-900">
      <header className="flex items-start justify-between gap-4 border-b border-gray-300 pb-4">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-[10px] font-medium tracking-wide text-gray-500 uppercase">
            {translate("Materials List", "قائمة المواد")}
          </p>
          <h1 className="text-2xl font-semibold">{documentHeading}</h1>
          <p className="text-[10px] text-gray-500">{printedAt}</p>
        </div>
        <img src={logoSrc} alt="" width={60} height={60} className="h-[60px] w-[60px] shrink-0 rounded object-contain" />
      </header>

      {groups.map((group) => (
        <section key={group.mainCategory.id} className="mb-4 space-y-2.5">
          <div className="w-full break-after-avoid rounded-md bg-gray-100 px-3 py-2 text-center">
            <h2 className="text-sm font-semibold text-gray-900">
              {group.mainCategory.title}
              <span className="ms-2 text-xs font-normal text-gray-600">({group.materials.length})</span>
            </h2>
          </div>
          <PrintTable
            headers={headers}
            rows={materialRows(group.materials)}
            monoColumnIndexes={[0, 1]}
            noWrapIndexes={noWrapIndexes}
            tableClassName="break-before-avoid text-[8px] [&_thead_tr]:text-[8px]"
            emptyLabel={translate("No materials", "لا توجد مواد")}
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
            rows={materialRows(uncategorized)}
            monoColumnIndexes={[0, 1]}
            noWrapIndexes={noWrapIndexes}
            tableClassName="break-before-avoid text-[8px] [&_thead_tr]:text-[8px]"
            emptyLabel={translate("No materials", "لا توجد مواد")}
          />
        </section>
      )}
    </div>
  );
}
