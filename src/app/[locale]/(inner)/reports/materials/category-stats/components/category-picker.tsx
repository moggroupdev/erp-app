"use client";

import { useI18n } from "@/lib/i18n/hooks";
import SelectMaterialMain from "@/components/global/selections/query-based/select-material-main";

export default function CategoryPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (mainCategoryId: string | null) => void;
}) {
  const { translate } = useI18n();

  function setValue(next: React.SetStateAction<string | null>) {
    onChange(typeof next === "function" ? next(value) : next);
  }

  return (
    <section className="rounded-3xl bg-white px-5 py-4 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
        <div className="min-w-0 sm:max-w-xs">
          <label htmlFor="category-stats-main" className="text-sm font-semibold text-stone-800">
            {translate("Main category", "الفئة الرئيسية")}
          </label>
          <p className="mt-1 text-xs leading-relaxed text-stone-500">
            {translate("Required filter for this report", "فلتر مطلوب لهذا التقرير")}
          </p>
        </div>

        <div className="w-full sm:max-w-md">
          <SelectMaterialMain
            id="category-stats-main"
            value={value}
            setValue={setValue}
            placeholder={translate("Search or select a category…", "ابحث أو اختر فئة…")}
            clearable
            searchable
            nothingFoundMessage={translate("No categories found", "لا توجد فئات")}
          />
        </div>
      </div>
    </section>
  );
}
