"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/hooks";
import useMaterialCategories from "@/hooks/reference/use-material-categories";
import SelectMaterialMain from "@/components/global/selections/reference-based/select-material-main";
import SelectMaterialSub from "@/components/global/selections/reference-based/select-material-sub";

export default function SubCategoryPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (subCategoryId: string | null) => void;
}) {
  const { translate } = useI18n();
  const { helpers } = useMaterialCategories();

  const selectedSub = helpers.getMaterialCategorySubById(value);
  const [mainCategoryId, setMainCategoryId] = useState<string | null>(selectedSub?.mainCategoryId ?? null);

  useEffect(() => {
    if (!value) return;
    const sub = helpers.getMaterialCategorySubById(value);
    if (sub && sub.mainCategoryId !== mainCategoryId) {
      setMainCategoryId(sub.mainCategoryId);
    }
  }, [value, helpers, mainCategoryId]);

  function handleMainChange(next: React.SetStateAction<string | null>) {
    const nextMain = typeof next === "function" ? next(mainCategoryId) : next;
    setMainCategoryId(nextMain);

    if (!nextMain) {
      onChange(null);
      return;
    }

    if (value) {
      const currentSub = helpers.getMaterialCategorySubById(value);
      if (!currentSub || currentSub.mainCategoryId !== nextMain) {
        onChange(null);
      }
    }
  }

  function handleSubChange(next: React.SetStateAction<string | null>) {
    onChange(typeof next === "function" ? next(value) : next);
  }

  return (
    <section className="rounded-3xl bg-white px-5 py-4 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
        <div className="min-w-0 flex-1">
          <label htmlFor="purchasing-subcategory-stats-main" className="text-sm font-semibold text-stone-800">
            {translate("Main category", "الفئة الرئيسية")}
          </label>
          <p className="mt-1 text-xs leading-relaxed text-stone-500">
            {translate("First pick a main category", "اختر أولاً فئة رئيسية")}
          </p>
          <div className="mt-2">
            <SelectMaterialMain
              id="purchasing-subcategory-stats-main"
              value={mainCategoryId}
              setValue={handleMainChange}
              placeholder={translate("Search or select a category…", "ابحث أو اختر فئة…")}
              clearable
              searchable
              nothingFoundMessage={translate("No categories found", "لا توجد فئات")}
            />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <label htmlFor="purchasing-subcategory-stats-sub" className="text-sm font-semibold text-stone-800">
            {translate("Subcategory", "الفئة الفرعية")}
          </label>
          <p className="mt-1 text-xs leading-relaxed text-stone-500">
            {translate("Required filter for this report", "فلتر مطلوب لهذا التقرير")}
          </p>
          <div className="mt-2">
            <SelectMaterialSub
              id="purchasing-subcategory-stats-sub"
              value={value}
              setValue={handleSubChange}
              mainCategoryScope={mainCategoryId}
              placeholder={
                mainCategoryId
                  ? translate("Search or select a subcategory…", "ابحث أو اختر فئة فرعية…")
                  : translate("Select a main category first…", "اختر فئة رئيسية أولاً…")
              }
              clearable
              searchable
              nothingFoundMessage={translate("No subcategories found", "لا توجد فئات فرعية")}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
