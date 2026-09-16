"use client";

import { useMemo } from "react";
import { Database } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import useDebouncedState from "@/hooks/use-debounced-state";
import { getAuditedTableSelectData } from "@/lib/constants/audit-tables";
import DataSelect, { GenericDataSelectProps } from "@/components/ui/data-select";

export type SelectAuditedTableProps = Omit<
  GenericDataSelectProps,
  "data" | "value" | "setValue" | "onChange" | "rightIcon" | "searchable" | "filter"
> & {
  value: string | null;
  setValue: React.Dispatch<React.SetStateAction<string | null>>;
};

export default function SelectAuditedTable({ value, setValue, ...props }: SelectAuditedTableProps) {
  const { locale, translate } = useI18n();
  const { debouncedValue: debouncedSearch, setPendingValue: setSearch } = useDebouncedState("");

  const allOptions = useMemo(() => getAuditedTableSelectData(locale), [locale]);

  const data = useMemo(() => {
    const keyword = debouncedSearch.trim().toLowerCase();
    if (!keyword) return allOptions;
    return allOptions.filter(
      (option) => option.label.toLowerCase().includes(keyword) || option.value.toLowerCase().includes(keyword),
    );
  }, [allOptions, debouncedSearch]);

  function handleSearchChange(search: string) {
    const selectedLabel = allOptions.find((option) => option.value === value)?.label;
    if (selectedLabel && search === selectedLabel) return;
    setSearch(search);
  }

  return (
    <DataSelect
      {...props}
      value={value}
      setValue={setValue}
      data={data}
      searchable
      clearable
      onSearchChange={handleSearchChange}
      rightIcon={<Database size={15} className="pointer-events-none text-gray-400" />}
      filter={({ options }) => options}
      nothingFoundMessage={translate("No tables found", "لا توجد جداول")}
    />
  );
}
