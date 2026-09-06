"use client";

import { useI18n } from "@/lib/i18n/hooks";
import SelectMaterial from "@/components/global/selections/remote-based/select-material";

export default function MaterialPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (materialCode: string | null) => void;
}) {
  const { translate } = useI18n();

  function setValue(next: React.SetStateAction<string | null>) {
    onChange(typeof next === "function" ? next(value) : next);
  }

  return (
    <section className="rounded-3xl bg-white px-5 py-4 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
        <div className="min-w-0 sm:max-w-xs">
          <label htmlFor="price-history-material" className="text-sm font-semibold text-stone-800">
            {translate("Material", "المادة")}
          </label>
          <p className="mt-1 text-xs leading-relaxed text-stone-500">
            {translate("Required filter for this report", "فلتر مطلوب لهذا التقرير")}
          </p>
        </div>

        <div className="w-full sm:max-w-md">
          <SelectMaterial
            id="price-history-material"
            value={value}
            setValue={setValue}
            placeholder={translate("Search or select a material...", "ابحث أو اختر مادة...")}
            nothingFoundMessage={translate("No materials found", "لا توجد مواد")}
            clearable
            searchable
            withBrowseModal
          />
        </div>
      </div>
    </section>
  );
}
