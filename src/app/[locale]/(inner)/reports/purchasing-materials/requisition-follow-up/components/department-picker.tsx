"use client";

import { useI18n } from "@/lib/i18n/hooks";
import SelectProductionSubDepartment from "@/components/global/selections/enum-based/select-production-sub-department";

export default function DepartmentPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (productionSubDepartment: string | null) => void;
}) {
  const { translate } = useI18n();

  function setValue(next: React.SetStateAction<string | null>) {
    onChange(typeof next === "function" ? next(value) : next);
  }

  return (
    <section className="rounded-3xl bg-white px-5 py-4 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
        <div className="min-w-0 sm:max-w-xs">
          <label htmlFor="purchasing-requisition-follow-up-dept" className="text-sm font-semibold text-stone-800">
            {translate("Production department", "قسم الإنتاج")}
          </label>
          <p className="mt-1 text-xs leading-relaxed text-stone-500">
            {translate("Required filter for this report", "فلتر مطلوب لهذا التقرير")}
          </p>
        </div>

        <div className="w-full sm:max-w-md">
          <SelectProductionSubDepartment
            id="purchasing-requisition-follow-up-dept"
            value={value}
            setValue={setValue}
            placeholder={translate("Select a production department…", "اختر قسم إنتاج…")}
            clearable
            searchable
            nothingFoundMessage={translate("No departments found", "لا توجد أقسام")}
          />
        </div>
      </div>
    </section>
  );
}
