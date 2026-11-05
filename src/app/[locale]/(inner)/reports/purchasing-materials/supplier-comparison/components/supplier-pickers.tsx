"use client";

import { useI18n } from "@/lib/i18n/hooks";
import SelectSupplier from "@/components/global/selections/remote-based/select-supplier";

export default function SupplierPickers({
  supplierAId,
  supplierBId,
  onSupplierAChange,
  onSupplierBChange,
}: {
  supplierAId: string | null;
  supplierBId: string | null;
  onSupplierAChange: (supplierId: string | null) => void;
  onSupplierBChange: (supplierId: string | null) => void;
}) {
  const { translate } = useI18n();

  function setSupplierA(next: React.SetStateAction<string | null>) {
    onSupplierAChange(typeof next === "function" ? next(supplierAId) : next);
  }

  function setSupplierB(next: React.SetStateAction<string | null>) {
    onSupplierBChange(typeof next === "function" ? next(supplierBId) : next);
  }

  return (
    <section className="rounded-3xl bg-white px-5 py-4 sm:px-6">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-gray-800">
          {translate("Suppliers to compare", "الموردان للمقارنة")}
        </h2>
        <p className="mt-0.5 text-xs text-gray-500">
          {translate("Choose two different suppliers.", "اختر موردين مختلفين.")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto_1fr] lg:items-end lg:gap-4">
        <PickerField
          id="purchasing-supplier-comparison-a"
          side="a"
          label={translate("Supplier A", "المورد أ")}
          value={supplierAId}
          setValue={setSupplierA}
          excludeIds={supplierBId ? [supplierBId] : []}
        />

        <div className="hidden h-9 items-center justify-center lg:flex">
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
            {translate("vs", "مقابل")}
          </span>
        </div>

        <PickerField
          id="purchasing-supplier-comparison-b"
          side="b"
          label={translate("Supplier B", "المورد ب")}
          value={supplierBId}
          setValue={setSupplierB}
          excludeIds={supplierAId ? [supplierAId] : []}
        />
      </div>
    </section>
  );
}

function PickerField({
  id,
  side,
  label,
  value,
  setValue,
  excludeIds,
}: {
  id: string;
  side: "a" | "b";
  label: string;
  value: string | null;
  setValue: React.Dispatch<React.SetStateAction<string | null>>;
  excludeIds: string[];
}) {
  const { translate } = useI18n();

  return (
    <div className="min-w-0">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-100 text-[11px] font-semibold text-gray-600">
          {side === "a" ? "A" : "B"}
        </span>
        <label htmlFor={id} className="text-sm font-medium text-gray-800">
          {label}
        </label>
      </div>
      <SelectSupplier
        id={id}
        value={value}
        setValue={setValue}
        excludeIds={excludeIds}
        withBrowseModal
        placeholder={translate("Search or select a supplier...", "ابحث أو اختر مورداً...")}
        clearable
        searchable
        nothingFoundMessage={translate("No suppliers found", "لا يوجد موردون")}
      />
    </div>
  );
}
