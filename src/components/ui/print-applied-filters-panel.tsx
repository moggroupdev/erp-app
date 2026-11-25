"use client";

import { Checkbox } from "@mantine/core";
import { ListFilter, type LucideIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";

export type PrintFilterItem = {
  key: string;
  label: string;
  value: string;
  Icon: LucideIcon;
};

export default function PrintAppliedFiltersPanel({
  filterItems,
  ignoreFilters,
  onIgnoreFiltersChange,
  ignoreLabel,
}: {
  filterItems: PrintFilterItem[];
  ignoreFilters: boolean;
  onIgnoreFiltersChange: (checked: boolean) => void;
  ignoreLabel: string;
}) {
  const { translate } = useI18n();

  if (filterItems.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
      <div className="flex items-center justify-between gap-2 border-b border-gray-200 bg-white px-3 py-2">
        <div className="text-haze-700 flex min-w-0 items-center gap-2">
          <span className="border-haze-100 bg-haze-50 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border">
            <ListFilter size={14} />
          </span>
          <span className="text-sm font-semibold text-gray-900">
            {translate("Applied filters", "الفلاتر المطبقة")}
          </span>
        </div>
        <span
          className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${
            ignoreFilters ? "bg-gray-100 text-gray-500 line-through" : "bg-haze-50 text-haze-700"
          }`}
        >
          {translate(`${filterItems.length} active`, `${filterItems.length} نشط`)}
        </span>
      </div>

      <dl className={`divide-y divide-gray-200 ${ignoreFilters ? "opacity-50" : ""}`}>
        {filterItems.map(({ key, label, value, Icon }) => (
          <div
            key={key}
            className="grid grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)] items-start gap-2 px-3 py-2 sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)]"
          >
            <dt className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
              <Icon size={13} className="text-haze-600 shrink-0" aria-hidden />
              <span className="truncate">{label}</span>
            </dt>
            <dd
              className={`min-w-0 text-sm font-semibold wrap-break-word text-gray-900 ${ignoreFilters ? "line-through" : ""}`}
              title={value}
            >
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="border-t border-gray-200 bg-white px-3 py-2.5">
        <Checkbox
          checked={ignoreFilters}
          onChange={(e) => onIgnoreFiltersChange(e.currentTarget.checked)}
          label={ignoreLabel}
          radius="md"
        />
      </div>
    </section>
  );
}
