"use client";

import { useI18n } from "@/lib/i18n/hooks";
import SelectSupplier from "@/components/global/selections/remote-based/select-supplier";

export default function SupplierPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (supplierId: string | null) => void;
}) {
  const { translate } = useI18n();

  function setValue(next: React.SetStateAction<string | null>) {
    onChange(typeof next === "function" ? next(value) : next);
  }

  return (
    <section className="rounded-3xl bg-white px-5 py-4 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
        <div className="min-w-0 sm:max-w-xs">
          <label htmlFor="purchasing-supplier-stats-supplier" className="text-sm font-semibold text-stone-800">
            {translate("Supplier", "المورد")}
          </label>
          <p className="mt-1 text-xs leading-relaxed text-stone-500">
            {translate("Required filter for this report", "فلتر مطلوب لهذا التقرير")}
          </p>
        </div>

        <div className="w-full sm:max-w-md">
          <SelectSupplier
            id="purchasing-supplier-stats-supplier"
            value={value}
            setValue={setValue}
            placeholder={translate("Search or select a supplier...", "ابحث أو اختر مورداً...")}
            clearable
            searchable
            nothingFoundMessage={translate("No suppliers found", "لا يوجد موردون")}
          />
        </div>
      </div>
    </section>
  );
}
