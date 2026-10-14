"use client";

/**
 * Unlike other query-based selectors,
 * SelectSupplier searches a live entity list via suppliersApi and optionally
 * opens a browse modal (search + purchased material category + classification + results table).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useDisclosure } from "@mantine/hooks";
import { useI18n } from "@/lib/i18n/hooks";
import useDebouncedState from "@/hooks/use-debounced-state";
import usePrivateRequest from "@/hooks/use-private-request";
import suppliersApi from "@/lib/api/suppliers";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import removeEmptyParams from "@/lib/helpers/remove-empty-params";
import type { Supplier } from "@/types/supplier";
import { ActionIcon, Tooltip } from "@mantine/core";
import { Table2, Truck } from "lucide-react";
import DataSelect, { GenericDataSelectProps } from "@/components/ui/data-select";
import BrowseSuppliersModal from "./browse-suppliers-modal";

type SelectableSupplier = Pick<Supplier, "id" | "name" | "code">;

export type SelectSupplierProps = Omit<GenericDataSelectProps, "data" | "value" | "setValue" | "onChange" | "rightIcon"> & {
  value: string | null;
  setValue: React.Dispatch<React.SetStateAction<string | null>>;
  onSupplierSelect?: (supplier: SelectableSupplier | null) => void;
  /** Supplier ids to hide from the options list. */
  excludeIds?: string[];
  /** Show a button that opens a browse modal for picking a supplier. */
  withBrowseModal?: boolean;
};

export default function SelectSupplier({
  value,
  setValue,
  onSupplierSelect,
  excludeIds = [],
  withBrowseModal = false,
  searchable = true,
  clearable = true,
  ...props
}: SelectSupplierProps) {
  const { translate } = useI18n();

  const privateRequest = usePrivateRequest();

  const { value: searchKeyword, debouncedValue: debouncedSearch, setPendingValue: setSearch } = useDebouncedState("");

  const [selectedSupplier, setSelectedSupplier] = useState<SelectableSupplier | null>(null);
  const [browseOpened, { open: openBrowse, close: closeBrowse }] = useDisclosure(false);
  const [browseKeyword, setBrowseKeyword] = useState("");
  const browseKeywordRef = useRef("");
  const preserveSelectSearchRef = useRef(false);
  const selectWrapRef = useRef<HTMLDivElement>(null);

  const trimmedSearch = debouncedSearch.trim();
  const listParams = removeEmptyParams({ page: "1", limit: "20", keyword: trimmedSearch });

  const suppliersQuery = useQuery({
    queryKey: queryKeys.suppliers.list(listParams),
    queryFn: ({ signal }) => suppliersApi.list({ privateRequest, params: listParams, signal }),
    staleTime: staleTimes.suppliers,
    placeholderData: keepPreviousData,
    enabled: trimmedSearch.length > 0,
  });

  const suppliers = trimmedSearch.length > 0 ? (suppliersQuery.data?.data ?? []) : [];

  // Keep the currently selected supplier available for the label even when search results change
  useEffect(() => {
    if (!value) {
      setSelectedSupplier(null);
      return;
    }

    const fromResults = suppliers.find((supplier) => supplier.id === value);

    if (fromResults) {
      setSelectedSupplier(fromResults);
      return;
    }

    if (selectedSupplier?.id === value) return;

    let cancelled = false;

    suppliersApi
      .get({ privateRequest, id: value })
      .then((supplier) => {
        if (!cancelled) setSelectedSupplier(supplier);
      })
      .catch(() => {
        if (!cancelled) setSelectedSupplier(null);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, suppliers]);

  const excludeSet = useMemo(() => new Set(excludeIds.filter((id) => id !== value)), [excludeIds, value]);

  const data = useMemo(() => {
    const byId = new Map<string, SelectableSupplier>();

    for (const supplier of suppliers) if (!excludeSet.has(supplier.id)) byId.set(supplier.id, supplier);

    if (selectedSupplier && !excludeSet.has(selectedSupplier.id)) byId.set(selectedSupplier.id, selectedSupplier);

    return Array.from(byId.values()).map((supplier) => ({
      value: supplier.id,
      label: `${supplier.name} - ${supplier.code}`,
    }));
  }, [suppliers, selectedSupplier, excludeSet]);

  function handleChange(next: string | null) {
    setValue(next);

    if (!next) {
      setSelectedSupplier(null);
      onSupplierSelect?.(null);
      return;
    }

    const supplier =
      suppliers.find((item) => item.id === next) || (selectedSupplier?.id === next ? selectedSupplier : null);

    if (supplier) {
      setSelectedSupplier(supplier);
      onSupplierSelect?.(supplier);
    } else onSupplierSelect?.(null);
  }

  function getSelectedLabel() {
    if (selectedSupplier && selectedSupplier.id === value) {
      return `${selectedSupplier.name} - ${selectedSupplier.code}`;
    }

    return data.find((option) => option.value === value)?.label;
  }

  function captureBrowseKeyword() {
    const selectedLabel = getSelectedLabel();
    const inputValue = selectWrapRef.current?.querySelector("input")?.value.trim() ?? "";
    const typed = searchKeyword.trim();
    const fromInput = inputValue && inputValue !== selectedLabel ? inputValue : "";
    const fromState = typed && typed !== selectedLabel ? typed : "";

    browseKeywordRef.current = fromInput || fromState;
  }

  function handleOpenBrowse() {
    preserveSelectSearchRef.current = true;
    setBrowseKeyword(browseKeywordRef.current);
    openBrowse();
  }

  function handleCloseBrowse() {
    preserveSelectSearchRef.current = false;
    closeBrowse();
  }

  function handleBrowseSelect(supplier: SelectableSupplier) {
    setSelectedSupplier(supplier);
    setValue(supplier.id);
    setSearch("");
    onSupplierSelect?.(supplier);
    handleCloseBrowse();
  }

  // Mantine syncs the search input to the selected option label after change,
  // and clears it on blur (e.g. when the browse modal takes focus).
  function handleSearchChange(search: string) {
    const selectedLabel = getSelectedLabel();

    if (selectedLabel && search === selectedLabel) return;
    if (!search && preserveSelectSearchRef.current) return;

    setSearch(search);
  }

  const select = (
    <DataSelect
      {...props}
      value={value}
      setValue={handleChange as React.Dispatch<React.SetStateAction<string | null>>}
      data={data}
      searchable={searchable}
      clearable={clearable}
      onSearchChange={handleSearchChange}
      disabled={props.disabled}
      rightIcon={<Truck size={15} className="pointer-events-none text-gray-400" />}
      // Server already filters by keyword (name, code, email, phone); skip client-side label matching.
      filter={({ options }) => options}
      renderOption={({ option }) => {
        const supplier =
          suppliers.find((item) => item.id === option.value) ||
          (selectedSupplier?.id === option.value ? selectedSupplier : null);
        const name = supplier?.name ?? option.label;
        const code = supplier?.code ?? "";

        return (
          <div className="flex w-full min-w-0 items-center justify-between gap-3">
            <span className="min-w-0 truncate">{name}</span>
            {code ? <span className="shrink-0 text-xs text-gray-400">{code}</span> : null}
          </div>
        );
      }}
      nothingFoundMessage={
        !trimmedSearch
          ? translate("Type to search suppliers", "اكتب للبحث عن الموردين")
          : suppliersQuery.isFetching
            ? translate("Searching...", "جاري البحث...")
            : translate("No suppliers found", "لا يوجد موردون")
      }
    />
  );

  if (!withBrowseModal) return select;

  return (
    <>
      <div className="flex items-end gap-2">
        <div ref={selectWrapRef} className="flex-1">
          {select}
        </div>
        <Tooltip label={translate("Browse suppliers", "تصفح الموردين")} withArrow>
          <ActionIcon
            size={36}
            variant="light"
            onMouseDown={(event) => {
              event.preventDefault();
              preserveSelectSearchRef.current = true;
              captureBrowseKeyword();
            }}
            onClick={handleOpenBrowse}
            disabled={props.disabled}
          >
            <Table2 size={15} />
          </ActionIcon>
        </Tooltip>
      </div>

      <BrowseSuppliersModal
        opened={browseOpened}
        close={handleCloseBrowse}
        onSelect={handleBrowseSelect}
        excludeIds={excludeIds}
        initialKeyword={browseKeyword}
      />
    </>
  );
}
